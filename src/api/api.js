import axios from 'axios';

const API = axios.create({
  // baseURL: 'http://localhost:8080/api',
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Auth interceptor ────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth APIs ───────────────────────────────────
export const login = (data) => API.post('/auth/login', data);
export const validateToken = () => API.get('/auth/validate');

// ─── Customer APIs ───────────────────────────────
export const getCustomers = () => API.get('/customers');
export const createCustomer = (data) => API.post('/customers', data);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);

// ─── Frame Seller APIs ───────────────────────────
export const getFrameSellers = () => API.get('/frame-sellers');
export const createFrameSeller = (data) => API.post('/frame-sellers', data);
export const updateFrameSeller = (id, data) => API.put(`/frame-sellers/${id}`, data);
export const deleteFrameSeller = (id) => API.delete(`/frame-sellers/${id}`);

// ─── Item (PITEM) APIs ───────────────────────────
export const getItemsByCustomer = (customerId) => API.get(`/items/customer/${customerId}`);
export const createItem = (data) => API.post('/items', data);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);

// ─── Frame APIs ──────────────────────────────────
export const getFrames = () => API.get('/frames');
export const createFrame = (data) => API.post('/frames', data);
export const updateFrame = (id, data) => API.put(`/frames/${id}`, data);
export const deleteFrame = (id) => API.delete(`/frames/${id}`);

// ─── Daily Entry APIs ────────────────────────────
export const createDailyEntry = (data) => API.post('/daily-entry', data);
export const updateDailyEntry = (id, data) => API.put(`/daily-entry/${id}`, data);
export const getDailyEntry = (date, customerId) =>
  API.get('/daily-entry', { params: { date, customerId } });
export const getDailyEntriesByDate = (date) =>
  API.get('/daily-entry', { params: { date } });
export const getAllDailyEntries = () => API.get('/daily-entry');
export const deleteDailyEntry = (id) => API.delete(`/daily-entry/${id}`);

// ─── Frame Entry APIs ────────────────────────────
export const getFrameEntries = (date, frameSellerId) =>
  API.get('/frame-entries', { params: { date, frameSellerId } });
export const saveFrameEntries = (date, frameSellerId, entries) =>
  API.post('/frame-entries', entries, { params: { date, frameSellerId } });

// ─── Daily Expense APIs ──────────────────────────
export const getDailyExpenses = (date) => API.get('/daily-expenses', { params: { date } });
export const createDailyExpense = (data) => API.post('/daily-expenses', data);
export const updateDailyExpense = (id, data) => API.put(`/daily-expenses/${id}`, data);
export const deleteDailyExpense = (id) => API.delete(`/daily-expenses/${id}`);

export default API;
