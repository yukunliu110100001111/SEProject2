import axios from 'axios';
import { clearSession } from '../utils/storage';

// Create the axios instance.
const service = axios.create({
  baseURL: '/api',
  timeout: 8000,
});

// Attach the saved auth token to every request.
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('greenbite_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Return API payloads directly to views.
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 200) {
      return res.data;
    } else {
      console.error('Business error:', res.message);
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
    console.error('Network error:', error);
    return Promise.reject(error);
  }
);

export default service;
