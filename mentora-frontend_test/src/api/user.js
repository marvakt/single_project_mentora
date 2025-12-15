// // src/api/user.js
// import axios from "axios";

// const userApi = axios.create({
//   baseURL: "http://localhost:8001/api",  // USER SERVICE BASE
// });

// export const getProfile = (userId) =>
//   userApi.get(`/profile/${userId}`);

// export const updateProfile = (userId, data) =>
//   userApi.put(`/profile/${userId}/update`, data);

// export const uploadDocument = (userId, data) =>
//   userApi.post(`/doctor/${userId}/upload-doc`, data);

// export const approveDoctor = (userId) =>
//   userApi.post(`/doctor/${userId}/approve`);

// export const rejectDoctor = (userId) =>
//   userApi.post(`/doctor/${userId}/reject`);

// export const addAvailability = (userId, data) =>
//   userApi.post(`/doctor/${userId}/availability/add`, data);

// export const listAvailability = (userId) =>
//   userApi.get(`/doctor/${userId}/availability/`);

// export const listDocuments = (userId) =>
//   userApi.get(`/doctor/${userId}/documents/`);

// export const getUserList = (params) =>
//   userApi.get(`/admin/users/`, { params });

// src/api/user.js
// src/api/user.js
import axios from "axios";

const userApi = axios.create({
  baseURL: "http://localhost:8001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ ATTACH JWT
userApi.interceptors.request.use((config) => {
  const access = sessionStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

export const getProfile = (userId) =>
  userApi.get(`/profile/${userId}/`);

export const updateProfile = (userId, data) =>
  userApi.put(`/profile/${userId}/update/`, data);

export const saveDoctorProfile = (userId, data) =>
  userApi.post(`/doctor/${userId}/profile/`, data);

export const uploadDocument = (userId, data) =>
  userApi.post(`/doctor/${userId}/document/upload/`, data);

export const listDocuments = (userId) =>
  userApi.get(`/doctor/${userId}/documents/`);

export const approveDoctor = (userId) =>
  userApi.post(`/doctor/${userId}/approve/`);

export const rejectDoctor = (userId) =>
  userApi.post(`/doctor/${userId}/reject/`);

export const addAvailability = (userId, data) =>
  userApi.post(`/doctor/${userId}/availability/add/`, data);

export const deleteAvailability = (availabilityId) =>
  userApi.delete(`/doctor/availability/${availabilityId}/delete/`);

export const listAvailability = (userId) =>
  userApi.get(`/doctor/${userId}/availability/`);

export const getUserList = (params) =>
  userApi.get(`/admin/users/`, { params });

export const getNotifications = (userId) =>
  userApi.get(`/notifications/${userId}/`);
