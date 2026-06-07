import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Central displacement handler — called from interceptor AND poll
export const handleDisplaced = () => {
  Cookies.remove('token', { path: '/' });
  Cookies.remove('user', { path: '/' });
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/institute/login?reason=displaced';
  }
};

// Handle 401 responses globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const data = err.response?.data;
      const url = err.config?.url || '';

      if (data?.error === 'SESSION_DISPLACED') {
        handleDisplaced();
        return Promise.reject(err);
      }

      if (url.includes('/api/auth/verify') && !url.includes('verify-session')) {
        Cookies.remove('token', { path: '/' });
        Cookies.remove('user', { path: '/' });
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path.startsWith('/admin')) window.location.href = '/admin/login';
          else if (path.startsWith('/institute')) window.location.href = '/institute/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth helpers ─────────────────────────────────────────────
export const getUser = () => {
  try {
    const raw = Cookies.get('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const setAuth = (token, user) => {
  const opts = { expires: 7, path: '/', secure: true, sameSite: 'Strict' };
  Cookies.set('token', token, opts);
  Cookies.set('user', JSON.stringify(user), opts);
};

export const clearAuth = () => {
  const opts = { path: '/', secure: true, sameSite: 'Strict' };
  Cookies.remove('token', opts);
  Cookies.remove('user', opts);
};