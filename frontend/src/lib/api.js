import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }).then(r => r.data),
  me: (id) => api.get(`/auth/me/${id}`).then(r => r.data),
  updateMe: (id, data) => api.put(`/auth/me/${id}`, data).then(r => r.data),
};

export const patientsApi = {
  list: (psicologa_id) => api.get(`/patients`, { params: { psicologa_id } }).then(r => r.data),
  get: (id) => api.get(`/patients/${id}`).then(r => r.data),
  create: (data, psicologa_id) => api.post(`/patients`, data, { params: { psicologa_id } }).then(r => r.data),
  update: (id, data) => api.put(`/patients/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/patients/${id}`).then(r => r.data),
};

export const tasksApi = {
  list: (patient_id) => api.get(`/patients/${patient_id}/tasks`).then(r => r.data),
  create: (patient_id, data) => api.post(`/patients/${patient_id}/tasks`, data).then(r => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
  reorder: (items) => api.post(`/tasks/reorder`, items).then(r => r.data),
};

export const sessionsApi = {
  list: (psicologa_id, params = {}) => api.get(`/sessions`, { params: { psicologa_id, ...params } }).then(r => r.data),
  get: (id) => api.get(`/sessions/${id}`).then(r => r.data),
  create: (data, psicologa_id) => api.post(`/sessions`, data, { params: { psicologa_id } }).then(r => r.data),
  update: (id, data) => api.put(`/sessions/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/sessions/${id}`).then(r => r.data),
};

export const dashboardApi = {
  stats: (psicologa_id) => api.get(`/dashboard/stats`, { params: { psicologa_id } }).then(r => r.data),
  monthly: (psicologa_id) => api.get(`/stats/monthly`, { params: { psicologa_id } }).then(r => r.data),
};

export const seedApi = {
  run: () => api.post(`/seed`).then(r => r.data),
};

export default api;
