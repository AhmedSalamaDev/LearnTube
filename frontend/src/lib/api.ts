import axios from "axios";

// Use environment variable for API URL
// Development: /api (proxied by Vite to localhost:3000)
// Production: https://learntube-yi19.onrender.com
const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // ESSENTIAL for sending auth cookies
});

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if:
    // 1. We get a 401 error
    // 2. We're not already on the login page
    // 3. The request was not to /auth/me (which is expected to fail when not logged in)
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login") &&
      !error.config?.url?.includes("/auth/me")
    ) {
      // Clear the invalid token
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
