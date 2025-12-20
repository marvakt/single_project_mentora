// src/api/appointment.js
import axios from "axios";

const appointmentApi = axios.create({
  baseURL: import.meta.env.VITE_APPOINTMENT_SERVICE_URL || "http://localhost:8002",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ ATTACH JWT
appointmentApi.interceptors.request.use((config) => {
  const access = sessionStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Handle 401 errors
appointmentApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const createAppointment = (data) =>
  appointmentApi.post("/appointments/", data);

export const listAppointments = () =>
  appointmentApi.get("/appointments/");

export const createPaymentOrder = (appointmentId) =>
  appointmentApi.post(`/appointments/${appointmentId}/payments/create/`);

