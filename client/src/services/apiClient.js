import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('sphere_token') ||
      (() => {
        try {
          const u = localStorage.getItem('userInfo');
          return u ? JSON.parse(u).token : null;
        } catch {
          return null;
        }
      })();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Helper to construct an absolute or proxy API URL for fetch or anchor links
 * e.g. getApiUrl('/cloud/google/auth') -> 'http://localhost:5000/api/cloud/google/auth' or '/api/cloud/google/auth'
 */
export const getApiUrl = (path) => {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export default apiClient;
