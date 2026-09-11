import axios from 'axios';

// Use environment variable for API URL
// Development: /api/v1 (proxied by Vite to localhost:3000)
// Production: /api/v1 (served from backend)
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true, // ESSENTIAL for sending auth cookies
});

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', {
        refreshToken: localStorage.getItem('refresh_token'),
      })
      .then((response) => {
        const tokens = response.data.data.tokens;
        localStorage.setItem('auth_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        return tokens.accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/verify-email') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const accessToken = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          if (requestUrl.includes('/auth/logout')) {
            originalRequest.data = {
              refreshToken: localStorage.getItem('refresh_token'),
            };
          }
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !isAuthRequest
    ) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);
