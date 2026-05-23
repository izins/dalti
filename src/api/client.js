/**
 * DALTI — Centralized API client with JWT interceptor.
 * 
 * All API calls go through this module. Automatically attaches
 * access tokens and handles refresh on 401.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Get stored tokens */
const getTokens = () => ({
  access: localStorage.getItem('dalti_access_token'),
  refresh: localStorage.getItem('dalti_refresh_token'),
});

/** Store tokens */
export const setTokens = (access, refresh) => {
  if (access) localStorage.setItem('dalti_access_token', access);
  if (refresh) localStorage.setItem('dalti_refresh_token', refresh);
};

/** Clear tokens */
export const clearTokens = () => {
  localStorage.removeItem('dalti_access_token');
  localStorage.removeItem('dalti_refresh_token');
};

/** Core fetch wrapper with auth */
async function apiFetch(path, options = {}) {
  const { access } = getTokens();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // Network error (offline, DNS failure, CORS, etc.)
    throw { status: 0, error: 'Erreur réseau. Vérifiez votre connexion.', code: 'NETWORK_ERROR' };
  }

  // Auto-refresh on 401
  if (response.status === 401 && !options._retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, { ...options, _retried: true });
    }
    // Refresh failed — clear auth
    clearTokens();
    window.dispatchEvent(new CustomEvent('dalti:logout'));
  }

  // Safely parse JSON — handle non-JSON responses (HTML 500 pages, proxy errors, etc.)
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    // Server returned non-JSON (e.g., HTML error page)
    if (!response.ok) {
      throw { status: response.status, error: `Erreur serveur (${response.status})`, code: 'SERVER_ERROR' };
    }
    data = {};
  }
  
  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data;
}

/** Refresh access token */
async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refresh}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      setTokens(data.access_token, null);
      return true;
    }
  } catch {}
  return false;
}

// ============ AUTH ============

export const authAPI = {
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
};

// ============ USERS ============

export const usersAPI = {
  getProfile: () => apiFetch('/users/me'),
  updateProfile: (data) => apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  getNotifications: () => apiFetch('/users/notifications'),
};

// ============ STRUCTURES ============

export const structuresAPI = {
  list: (wilaya) => apiFetch(`/structures${wilaya ? `?wilaya=${wilaya}` : ''}`),
  get: (id) => apiFetch(`/structures/${id}`),
  getServices: (id) => apiFetch(`/structures/${id}/services`),
  stats: () => apiFetch('/stats'),
};

// ============ SERVICES ============

export const servicesAPI = {
  list: () => apiFetch('/services'),
  popular: () => apiFetch('/services/popular'),
};

// ============ TICKETS ============

export const ticketsAPI = {
  take: (structureId, serviceId) => apiFetch('/tickets', {
    method: 'POST',
    body: JSON.stringify({ structure_id: structureId, service_id: serviceId }),
  }),
  mine: () => apiFetch('/tickets/mine'),
  history: () => apiFetch('/tickets/history'),
  get: (id) => apiFetch(`/tickets/${id}`),
  cancel: (id) => apiFetch(`/tickets/${id}/cancel`, { method: 'PUT' }),
  lookupQR: (code) => apiFetch(`/tickets/qr/${code}`),
};

// ============ QUEUES ============

export const queuesAPI = {
  get: (id) => apiFetch(`/queues/${id}`),
  forStructure: (id) => apiFetch(`/queues/structure/${id}`),
  setStatus: (id, status) => apiFetch(`/queues/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// ============ ADMIN ============

export const adminAPI = {
  callNext: (queueId) => apiFetch('/admin/call-next', {
    method: 'POST',
    body: JSON.stringify({ queue_id: queueId }),
  }),
  complete: (ticketId) => apiFetch(`/admin/complete/${ticketId}`, { method: 'POST' }),
  missed: (ticketId) => apiFetch(`/admin/missed/${ticketId}`, { method: 'POST' }),
  history: (structureId) => apiFetch(`/admin/history/${structureId}`),
};

// ============ EXCHANGES ============

export const exchangesAPI = {
  propose: (ownerTicketId, targetTicketId) => apiFetch('/exchanges', {
    method: 'POST',
    body: JSON.stringify({ owner_ticket_id: ownerTicketId, target_ticket_id: targetTicketId }),
  }),
  accept: (id) => apiFetch(`/exchanges/${id}/accept`, { method: 'PUT' }),
  reject: (id) => apiFetch(`/exchanges/${id}/reject`, { method: 'PUT' }),
  mine: () => apiFetch('/exchanges/mine'),
  discover: () => apiFetch('/exchanges/discover'),
};

export default apiFetch;
