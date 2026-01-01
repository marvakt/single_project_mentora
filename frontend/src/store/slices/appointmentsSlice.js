import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { APPOINTMENT_API, apiCall } from '../../config/api';

// Async thunk for fetching appointments
export const fetchAppointments = createAsyncThunk(
    'appointments/fetchAppointments',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiCall(`${APPOINTMENT_API}/appointments/`);
            if (response.ok) {
                const data = await response.json();
                return data.appointments || data || [];
            }
            return rejectWithValue('Failed to fetch appointments');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for fetching appointment detail
export const fetchAppointmentDetail = createAsyncThunk(
    'appointments/fetchAppointmentDetail',
    async (appointmentId, { rejectWithValue }) => {
        try {
            const response = await apiCall(`${APPOINTMENT_API}/appointments/${appointmentId}/`);
            if (response.ok) {
                return await response.json();
            }
            return rejectWithValue('Failed to fetch appointment details');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const appointmentsSlice = createSlice({
    name: 'appointments',
    initialState: {
        appointments: [],
        selectedAppointment: null,
        loading: false,
        error: null,
    },
    reducers: {
        selectAppointment: (state, action) => {
            state.selectedAppointment = action.payload;
        },
        clearSelectedAppointment: (state) => {
            state.selectedAppointment = null;
        },
        updateAppointmentStatus: (state, action) => {
            const { id, status } = action.payload;
            const appointment = state.appointments.find(apt => apt.id === id);
            if (appointment) {
                appointment.status = status;
            }
            if (state.selectedAppointment?.id === id) {
                state.selectedAppointment.status = status;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch appointments
            .addCase(fetchAppointments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAppointments.fulfilled, (state, action) => {
                state.loading = false;
                state.appointments = action.payload;
            })
            .addCase(fetchAppointments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch appointment detail
            .addCase(fetchAppointmentDetail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAppointmentDetail.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedAppointment = action.payload;
            })
            .addCase(fetchAppointmentDetail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { selectAppointment, clearSelectedAppointment, updateAppointmentStatus } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
