import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    role: null,
};

// Load from sessionStorage on initialization
const loadAuthFromStorage = () => {
    try {
        const token = sessionStorage.getItem('access_token');
        const user = sessionStorage.getItem('user');
        if (token && user) {
            const parsedUser = JSON.parse(user);
            return {
                user: parsedUser,
                token,
                isAuthenticated: true,
                role: parsedUser.role,
            };
        }
    } catch (error) {
        console.error('Failed to load auth from storage:', error);
    }
    return initialState;
};

const authSlice = createSlice({
    name: 'auth',
    initialState: loadAuthFromStorage(),
    reducers: {
        login: (state, action) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            state.role = user.role;

            // Persist to sessionStorage
            sessionStorage.setItem('access_token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.role = null;

            // Clear sessionStorage
            sessionStorage.clear();
        },
        updateProfile: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                sessionStorage.setItem('user', JSON.stringify(state.user));
            }
        },
    },
});

export const { login, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
