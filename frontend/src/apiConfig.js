// Centralized API configuration for local & production deployment
const getApiBase = () => {
  // If VITE_API_URL env variable is provided
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  // Default PythonAnywhere backend or local proxy
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return ''; // Uses Vite dev proxy
    }
  }
  return 'https://medmec.pythonanywhere.com';
};

export const API = getApiBase();
// Helper: get auth token and tenant id from localStorage if available
export const getAuthToken = () => (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('access_token') : null;
export const getRefreshToken = () => (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('refresh_token') : null;
export const setAuthTokens = (accessToken, refreshToken, tenant) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (accessToken) window.localStorage.setItem('access_token', accessToken);
    if (refreshToken) window.localStorage.setItem('refresh_token', refreshToken);
    if (tenant) window.localStorage.setItem('tenant_id', tenant);
  }
};
export const clearAuthTokens = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    window.localStorage.removeItem('tenant_id');
  }
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('auth:logged_out'));
    }
  } catch (e) {}
};
export const getTenantId = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('tenant_id') || (import.meta.env && import.meta.env.VITE_TENANT_ID) || 'default';
  }
  return (import.meta.env && import.meta.env.VITE_TENANT_ID) || 'default';
};

const _uuidv4 = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export async function apiFetch(input, init = {}) {
  let url = input;
  if (!/^https?:\/\//i.test(input)) {
    // prefix API base when input is a path
    const base = API || '';
    url = `${base.replace(/\/$/, '')}${input.startsWith('/') ? '' : '/'}${input}`;
  }

  init.headers = init.headers || {};
  // Do not override Content-Type when sending FormData
  if (!(init.body instanceof FormData) && !init.headers['Content-Type']) {
    init.headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) init.headers['Authorization'] = `Bearer ${token}`;
  const tenant = getTenantId();
  if (tenant) init.headers['X-Tenant-Id'] = tenant;
  if (!init.headers['X-Request-Id']) init.headers['X-Request-Id'] = _uuidv4();

  // perform the request, with automatic refresh on 401 using refresh token
  const doFetch = () => fetch(url, init);

  let resp = await doFetch();
  if (resp.status === 401) {
    // try refresh token flow once
    const newAccess = await _attemptRefresh();
    if (newAccess) {
      init.headers['Authorization'] = `Bearer ${newAccess}`;
      resp = await doFetch();
    }
  }
  return resp;
}

let _refreshPromise = null;
async function _attemptRefresh() {
  if (_refreshPromise) return _refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  _refreshPromise = (async () => {
    try {
      const refreshUrl = `${API.replace(/\/$/, '')}/api/auth/refresh`;
      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': getTenantId() },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (!res.ok) {
        clearAuthTokens();
        return null;
      }
      const body = await res.json();
      const data = body && body.data ? body.data : null;
      if (data && data.access_token) {
        setAuthTokens(data.access_token, data.refresh_token || refreshToken, getTenantId());
        return data.access_token;
      }
      return null;
    } catch (err) {
      clearAuthTokens();
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}
