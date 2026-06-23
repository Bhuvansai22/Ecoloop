/**
 * Axios instance with base URL and JWT interceptor
 */

import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (baseURL && !baseURL.endsWith('/api') && !baseURL.endsWith('/api/')) {
  baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`;
}

const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15000, // 15s — prevents indefinite hang on cold-start
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecoloop_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);


export default api;
