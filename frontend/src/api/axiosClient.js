import axios from "axios";
import { getOrCreateDeviceUUID } from "../utils/deviceBinding";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-Device-ID"] = getOrCreateDeviceUUID();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    /* ===============================
       DEVICE COOLDOWN → OTP FLOW
       =============================== */
    if (
      error.response?.status === 403 &&
      error.response?.data?.detail?.includes("DEVICE_COOLDOWN")
    ) {
      sessionStorage.setItem(
        "deviceBindingRequired",
        JSON.stringify({
          email: JSON.parse(localStorage.getItem("user"))?.email,
          timestamp: Date.now(),
        })
      );

      const { toast } = await import("react-hot-toast");
      toast.error("New device detected. Please verify with OTP.", {
        duration: 5000,
        position: "top-center",
      });

      return Promise.reject(error);
    }

    /* ===============================
       SESSION CONFLICT
       =============================== */
    if (
      error.response?.status === 401 &&
      error.response?.data?.detail?.includes("SESSION_CONFLICT")
    ) {
      const { toast } = await import("react-hot-toast");

      localStorage.clear();
      sessionStorage.clear();

      toast.error(
        "You have been logged out because this account was logged in on another device",
        { duration: 5000, position: "top-center" }
      );

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);

      return Promise.reject(error);
    }

    /* ===============================
       TOKEN REFRESH
       =============================== */
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const res = await axios.post("/api/auth/refresh-token", {
            refresh_token: refreshToken,
          });

          localStorage.setItem("token", res.data.token);
          if (res.data.refresh_token) {
            localStorage.setItem("refresh_token", res.data.refresh_token);
          }

          api.defaults.headers.common.Authorization =
            "Bearer " + res.data.token;

          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
