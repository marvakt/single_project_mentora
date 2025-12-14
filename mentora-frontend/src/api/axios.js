import axios from "axios";

// Dynamically use correct backend URL (local or Docker)
const AUTH_URL = import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: AUTH_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==============================
// 1️⃣ Attach Access Token Automatically
// ==============================
api.interceptors.request.use((config) => {
  const access = sessionStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// ==============================
// 2️⃣ Auto Refresh Access Token
// ==============================
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // retry only once
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refresh = sessionStorage.getItem("refresh");
        if (!refresh) throw new Error("Missing refresh token");

        // IMPORTANT: use AUTH_URL so Docker hostname works
        const refreshRes = await axios.post(
          `${AUTH_URL}/api/accounts/token/refresh/`,
          { refresh }
        );

        const newAccess = refreshRes.data.access;
        sessionStorage.setItem("access", newAccess);

        // retry original request with new access token
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);

      } catch (e) {
        console.warn("Refresh failed → Logging out");
        sessionStorage.clear();
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
