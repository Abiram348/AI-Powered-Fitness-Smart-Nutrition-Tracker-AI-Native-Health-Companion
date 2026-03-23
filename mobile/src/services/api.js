import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const normalizeUrl = (url = '') => url.trim().replace(/\/+$/, '');
const MAX_GET_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Set EXPO_PUBLIC_API_URL in mobile/.env (and EAS env for production builds).
const configuredBaseUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL || '');
const fallbackBaseUrl = 'https://ai-powered-fitness-smart-nutrition.onrender.com';
const API_BASE_URL = configuredBaseUrl || fallbackBaseUrl;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // Render free instances can cold-start slowly; allow enough time for first request.
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // SecureStore not available
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config || {};
    const method = (config.method || '').toLowerCase();
    const status = error?.response?.status;
    const retryCount = config.__retryCount || 0;
    const isTransient = !status || status >= 500 || error.code === 'ECONNABORTED';

    // Retry only GET requests to avoid duplicate write operations.
    if (method === 'get' && isTransient && retryCount < MAX_GET_RETRIES) {
      config.__retryCount = retryCount + 1;
      await sleep(RETRY_DELAY_MS * config.__retryCount);
      return api.request(config);
    }

    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ==================== FOOD ====================
export const foodAPI = {
  analyze: (formData) => api.post('/food/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  createLog: (data) => api.post('/food/log', data),
  getLogs: (date) => api.get('/food/log', { params: date ? { date } : {} }),
  deleteLog: (id) => api.delete(`/food/log/${id}`),
};

// ==================== WATER ====================
export const waterAPI = {
  createLog: (data) => api.post('/water/log', data),
  deleteLog: (id) => api.delete(`/water/log/${id}`),
  getLogs: async (date) => {
    const response = await api.get('/water/log', { params: date ? { date } : {} });

    // Backend returns { logs, total_ml } for water, while mobile expects an array of logs.
    const normalizedLogs = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.logs)
        ? response.data.logs
        : [];

    return {
      ...response,
      data: normalizedLogs,
    };
  },
};

// ==================== WEIGHT ====================
export const weightAPI = {
  createLog: (data) => api.post('/weight/log', data),
  getLogs: () => api.get('/weight/log'),
};

// ==================== WORKOUT ====================
export const workoutAPI = {
  createLog: (data) => api.post('/workout/log', data),
  getLogs: (date) => api.get('/workout/log', { params: date ? { date } : {} }),
  deleteLog: (id) => api.delete(`/workout/log/${id}`),
  getLibrary: (params) => api.get('/workout/library', { params }),
};

// ==================== DIET ====================
export const dietAPI = {
  generatePlan: (data) => api.post('/diet/plan', data),
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
  getProgress: (days = 30) => api.get('/analytics/progress', { params: { days } }),
  getInsights: () => api.get('/analytics/insights'),
};

// ==================== CALCULATOR ====================
export const calculatorAPI = {
  bmi: (data) => api.post('/calculator/bmi', data),
  bmr: (data) => api.post('/calculator/bmr', data),
  tdee: (data) => api.post('/calculator/tdee', data),
};

// ==================== PROFILE ====================
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
};

// ==================== CHATBOT ====================
export const chatbotAPI = {
  getPersonas: () => api.get('/chatbot/coaches'),
  getPersona: () => api.get('/chatbot/persona'),
  setPersona: (data) => api.put('/chatbot/persona', data),
  sendMessage: (data) => api.post('/chatbot/message', data),
  getHistory: (limit = 50) => api.get('/chatbot/history', { params: { limit } }),
  clearHistory: () => api.delete('/chatbot/history'),
};

export default api;
