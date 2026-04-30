// Central API client — all requests proxied through Vite to localhost:3001

const BASE = '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
};

// Typed helpers
export const getStats = () => api.get('/stats');
export const getEvents = () => api.get('/events');

export const getRequests = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();
  return api.get(`/requests${qs ? '?' + qs : ''}`);
};
export const getRequest = (id) => api.get(`/requests/${id}`);
export const createRequest = (body) => api.post('/requests', body);
export const approveRequest = (id) => api.post(`/requests/${id}/approve`);
export const dispatchRequest = (id, warehouseId) =>
  api.post(`/requests/${id}/dispatch`, { warehouseId });
export const confirmDelivery = (dispatchId, receivedBy) =>
  api.post(`/dispatches/${dispatchId}/confirm`, { receivedBy });

export const getDispatches = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();
  return api.get(`/dispatches${qs ? '?' + qs : ''}`);
};

export const getInventory = (warehouseId) =>
  api.get(`/inventory${warehouseId ? '?warehouseId=' + warehouseId : ''}`);
export const getAlerts = (warehouseId) =>
  api.get(`/alerts${warehouseId ? '?warehouseId=' + warehouseId : ''}`);

export const getWarehouses = () => api.get('/warehouses');
export const getWarehouseStats = (id) => api.get(`/warehouses/${id}/stats`);
export const getResources = () => api.get('/resources');
export const getCamps = () => api.get('/camps');
export const getCampStats = (id) => api.get(`/camps/${id}/stats`);

export const restock = (body) => api.post('/restock', body);
export const getRestockLog = (warehouseId) =>
  api.get(`/restock-log${warehouseId ? '?warehouseId=' + warehouseId : ''}`);

export const getAuditLog = () => api.get('/audit');
