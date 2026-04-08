import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Basic interceptor for logging or error handling in the future
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[API Error] ${error.config?.url}:`, error.message);
    return Promise.reject(error);
  }
);
