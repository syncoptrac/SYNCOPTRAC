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


// ─── CLIENT-SIDE READ CACHE ─────────────────────────────────────
// Attendance / Fees / Students / Dashboard all read the same few endpoints, and
// moving between pages re-requested everything from scratch - so every
// navigation cost a full backend + Apps Script + Sheets round trip.
//
// This layer adds three things to GET requests, without changing any endpoint,
// payload shape or component code:
//   1. A short freshness window, so revisiting a page paints instantly.
//   2. Request coalescing, so two pages asking for students at the same moment
//      share ONE network request.
//   3. sessionStorage persistence, so a hard reload is instant too.
//
// Every write (POST/PUT/PATCH/DELETE) clears the affected scope immediately, so
// saved changes always show up right away. Pass { cache: false } to bypass.
const CACHE_FRESH_MS = 20 * 1000;
const CACHEABLE = /^\/api\/(sheets|admin)\//;
const STORE_PREFIX = 'sc:get:';

const memCache = new Map();
const pendingGets = new Map();

const scopeOf = (url) => (String(url).startsWith('/api/admin') ? '/api/admin' : '/api/sheets');

function readCache(key) {
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_FRESH_MS) return hit.data;
  if (hit) memCache.delete(key);
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts >= CACHE_FRESH_MS) {
      window.sessionStorage.removeItem(STORE_PREFIX + key);
      return null;
    }
    memCache.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  const entry = { data, ts: Date.now() };
  memCache.set(key, entry);
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded or private mode - the in-memory cache still applies.
  }
}

export function invalidateCache(scope) {
  const prefix = scope ? scopeOf(scope) : null;
  for (const key of Array.from(memCache.keys())) {
    if (!prefix || key.startsWith(prefix)) memCache.delete(key);
  }
  if (typeof window === 'undefined') return;
  try {
    const store = window.sessionStorage;
    for (let i = store.length - 1; i >= 0; i--) {
      const k = store.key(i);
      if (!k || !k.startsWith(STORE_PREFIX)) continue;
      if (!prefix || k.slice(STORE_PREFIX.length).startsWith(prefix)) store.removeItem(k);
    }
  } catch {
    // Ignore - the cache is an optimisation, never a correctness requirement.
  }
}

const rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
  const cacheable =
    config.cache !== false &&
    CACHEABLE.test(String(url)) &&
    !String(url).includes('verify-session');
  if (!cacheable) return rawGet(url, config);

  const key = String(url);
  const cached = readCache(key);
  if (cached !== null && cached !== undefined) {
    return Promise.resolve({ data: cached, status: 200, headers: {}, config, fromCache: true });
  }

  const shared = pendingGets.get(key);
  if (shared) return shared;

  const request = rawGet(url, config)
    .then((res) => {
      pendingGets.delete(key);
      writeCache(key, res.data);
      return res;
    })
    .catch((err) => {
      pendingGets.delete(key);
      throw err;
    });
  pendingGets.set(key, request);
  return request;
};

// Any write invalidates the scope it touched, so the refetch that follows a
// save never serves pre-save data.
['post', 'put', 'patch', 'delete'].forEach((method) => {
  if (typeof api[method] !== 'function') return;
  const raw = api[method].bind(api);
  api[method] = (url, ...rest) => {
    const result = raw(url, ...rest);
    if (CACHEABLE.test(String(url)) && result && typeof result.then === 'function') {
      result.then(() => invalidateCache(url)).catch(() => invalidateCache(url));
    }
    return result;
  };
});

// Warm an endpoint in the background so the page that needs it next paints
// immediately. Failures are deliberately ignored.
export const prefetch = (url) => {
  if (typeof window === 'undefined') return;
  api.get(url).catch(() => {});
};

export default api;

// ─── Auth helpers ─────────────────────────────────────────────
export const getUser = () => {
  try {
    const raw = Cookies.get('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const setAuth = (token, user) => {
  const opts = { expires: 7, path: '/', secure: true, sameSite: 'Lax' };
  Cookies.set('token', token, opts);
  Cookies.set('user', JSON.stringify(user), opts);
};

export const setStoredUser = (user) => {
  Cookies.set('user', JSON.stringify(user), { expires: 7, path: '/', secure: true, sameSite: 'Lax' });
};

export const clearAuth = () => {
  const opts = { path: '/', secure: true, sameSite: 'Lax' };
  Cookies.remove('token', opts);
  Cookies.remove('user', opts);
};