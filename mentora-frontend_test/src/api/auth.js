// src/api/auth.js
import api from "./axios";

export const registerUser = (data) => api.post("/register/", data);

export const verifyOtp = (data) => api.post("/verify-otp/", data);

export const loginUser = (data) => api.post("/login/", data);

export const googleLogin = (data) => api.post("/auth/google/", data);
