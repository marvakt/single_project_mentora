import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentView: 'landing',
    sidebarOpen: false,
    modals: {
        videoCall: { isOpen: false, appointmentId: null },
        chat: { isOpen: false, appointmentId: null },
        payment: { isOpen: false, appointmentId: null, amount: null },
    },
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setCurrentView: (state, action) => {
            state.currentView = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload;
        },
        openModal: (state, action) => {
            const { modalType, data } = action.payload;
            if (state.modals[modalType]) {
                state.modals[modalType] = { isOpen: true, ...data };
            }
        },
        closeModal: (state, action) => {
            const modalType = action.payload;
            if (state.modals[modalType]) {
                state.modals[modalType] = { isOpen: false };
            }
        },
        closeAllModals: (state) => {
            Object.keys(state.modals).forEach(key => {
                state.modals[key] = { isOpen: false };
            });
        },
    },
});

export const {
    setCurrentView,
    toggleSidebar,
    setSidebarOpen,
    openModal,
    closeModal,
    closeAllModals
} = uiSlice.actions;

export default uiSlice.reducer;
