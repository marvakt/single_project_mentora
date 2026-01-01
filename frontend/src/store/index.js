import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import uiReducer from './slices/uiSlice';
import userProfileReducer from './slices/userProfileSlice';
import doctorProfileReducer from './slices/doctorProfileSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        appointments: appointmentsReducer,
        ui: uiReducer,
        userProfile: userProfileReducer,
        doctorProfile: doctorProfileReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['appointments/fetchAppointments/fulfilled'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

export default store;
