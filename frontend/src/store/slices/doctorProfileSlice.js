import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { USER_API, APPOINTMENT_API, apiCall } from '../../config/api';

// Async thunk for fetching doctor profile
export const fetchDoctorProfile = createAsyncThunk(
    'doctorProfile/fetchDoctorProfile',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await apiCall(`${USER_API}/profile/${userId}/`);
            if (response.ok) {
                return await response.json();
            }
            return rejectWithValue('Failed to fetch doctor profile');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for updating doctor profile
export const updateDoctorProfile = createAsyncThunk(
    'doctorProfile/updateDoctorProfile',
    async ({ userId, data }, { rejectWithValue }) => {
        try {
            const response = await apiCall(
                `${USER_API}/profile/${userId}/update/`,
                {
                    method: 'PUT',
                    body: JSON.stringify(data)
                }
            );
            if (response.ok) {
                return await response.json();
            }
            return rejectWithValue('Failed to update doctor profile');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for fetching doctor availability
export const fetchDoctorAvailability = createAsyncThunk(
    'doctorProfile/fetchDoctorAvailability',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await apiCall(`${USER_API}/doctor/${userId}/availability/`);
            if (response.ok) {
                return await response.json();
            }
            return rejectWithValue('Failed to fetch availability');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for fetching doctor's patients
export const fetchDoctorPatients = createAsyncThunk(
    'doctorProfile/fetchDoctorPatients',
    async (_, { rejectWithValue }) => {
        try {
            // Since there is no direct /patients endpoint, we fetch all appointments
            // and derive the unique list of patients from there.
            const appointmentsResponse = await apiCall(`${APPOINTMENT_API}/appointments/`);

            if (!appointmentsResponse.ok) {
                return rejectWithValue('Failed to fetch appointments');
            }

            const appointmentsData = await appointmentsResponse.json();
            const appointments = appointmentsData.appointments || [];

            // Extract unique user IDs from appointments
            const uniqueUserIds = [...new Set(appointments.map(apt => apt.user_id))];

            // Create patient objects with placeholder info (Backend limitation: Doctors can't view User profiles)
            // This prevents 403 Forbidden errors while still showing patient list
            const patients = uniqueUserIds.map(userId => {
                // Get user's appointments
                const userAppointments = appointments.filter(apt => apt.user_id === userId);

                // Calculate last seen (most recent appointment date)
                // Use current date if no appointments found (though they should have at least one)
                let lastSeenDate = new Date();
                if (userAppointments.length > 0) {
                    const dates = userAppointments.map(a => new Date(a.scheduled_at).getTime());
                    lastSeenDate = new Date(Math.max(...dates));
                }

                return {
                    user_id: userId,
                    // Display placeholder name like "Patient 1234..."
                    name: `Patient ${userId.substring(0, 8)}`,
                    email: 'Contact Admin explicitly',
                    avatar: null,
                    role: 'user',
                    last_seen: lastSeenDate.toISOString(), // Store as ISO string
                    total_appointments: userAppointments.length
                };
            });

            return patients;

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const doctorProfileSlice = createSlice({
    name: 'doctorProfile',
    initialState: {
        doctorProfile: null,
        availability: [],
        patients: [],
        loading: false,
        error: null,
    },
    reducers: {
        setDoctorProfile: (state, action) => {
            state.doctorProfile = action.payload;
        },
        clearDoctorProfile: (state) => {
            state.doctorProfile = null;
            state.availability = [];
            state.patients = [];
            state.loading = false;
            state.error = null;
        },
        addAvailability: (state, action) => {
            state.availability.push(action.payload);
        },
        removeAvailability: (state, action) => {
            state.availability = state.availability.filter(
                slot => slot.id !== action.payload
            );
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch doctor profile
            .addCase(fetchDoctorProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDoctorProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.doctorProfile = action.payload;
            })
            .addCase(fetchDoctorProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update doctor profile
            .addCase(updateDoctorProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateDoctorProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.doctorProfile = action.payload;
            })
            .addCase(updateDoctorProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch availability
            .addCase(fetchDoctorAvailability.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDoctorAvailability.fulfilled, (state, action) => {
                state.loading = false;
                state.availability = action.payload;
            })
            .addCase(fetchDoctorAvailability.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch patients
            .addCase(fetchDoctorPatients.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDoctorPatients.fulfilled, (state, action) => {
                state.loading = false;
                state.patients = action.payload;
            })
            .addCase(fetchDoctorPatients.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setDoctorProfile, clearDoctorProfile, addAvailability, removeAvailability } = doctorProfileSlice.actions;
export default doctorProfileSlice.reducer;
