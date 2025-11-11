import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Создаём экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth
export const requestOTP = (email) => api.post('/auth/request-otp', { email });
export const verifyOTP = (email, code) => api.post('/auth/verify-otp', { email, code });

// User
export const getProfile = () => api.get('/user/profile');
export const updateProfile = (data) => api.put('/user/profile', data);

// Movements
export const getMovements = () => api.get('/movements');
export const createMovement = (data) => api.post('/movements', data);
export const getMovementStats = (id) => api.get(`/movements/${id}/stats`);

// PR Records
export const getPRRecords = (movementId) => api.get('/pr-records', { params: { movement_id: movementId } });
export const createPRRecord = (data) => api.post('/pr-records', data);
export const updatePRRecord = (id, data) => api.put(`/pr-records/${id}`, data);
export const deletePRRecord = (id) => api.delete(`/pr-records/${id}`);

// WODs
export const getWODs = () => api.get('/wods');
export const createWOD = (data) => api.post('/wods', data);
export const getWODStats = (id) => api.get(`/wods/${id}/stats`);

// WOD Results
export const getWODResults = (wodId) => api.get('/wod-results', { params: { wod_id: wodId } });
export const createWODResult = (data) => api.post('/wod-results', data);
export const updateWODResult = (id, data) => api.put(`/wod-results/${id}`, data);
export const deleteWODResult = (id) => api.delete(`/wod-results/${id}`);

// Percent Calculator
export const getPercentTable = (movementId, base1RM) => 
  api.get(`/percent-calculator/${movementId}`, { params: { base_1rm: base1RM } });

// Search
export const search = (query, type) => api.get('/search', { params: { q: query, type } });

export default api;