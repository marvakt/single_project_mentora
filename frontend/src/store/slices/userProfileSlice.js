import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { USER_API, apiCall } from '../../config/api';

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
    'userProfile/fetchUserProfile',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await apiCall(`${USER_API}/profile/${userId}/`);
            if (response.ok) {
                return await response.json();
            }
            return rejectWithValue('Failed to fetch user profile');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
    'userProfile/updateUserProfile',
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
            return rejectWithValue('Failed to update user profile');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for updating FCM token
export const updateFcmToken = createAsyncThunk(
    'userProfile/updateFcmToken',
    async (token, { getState, rejectWithValue }) => {
        try {
            const { userProfile, auth } = getState();
            const userId = userProfile.profile?.user_id || auth.user?.user_id;

            if (!userId) {
                console.error('FCM Update Error: User ID not found in state');
                return rejectWithValue('User ID not found');
            }

            const response = await apiCall(
                `${USER_API}/profile/${userId}/update/`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ fcm_token: token })
                }
            );
            if (response.ok) {
                return await response.json();
            }
            return rejectWithValue('Failed to update FCM token');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const userProfileSlice = createSlice({
    name: 'userProfile',
    initialState: {
        profile: null,
        loading: false,
        error: null,
    },
    reducers: {
        setProfile: (state, action) => {
            state.profile = action.payload;
        },
        clearProfile: (state) => {
            state.profile = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch user profile
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update user profile
            .addCase(updateUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setProfile, clearProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
