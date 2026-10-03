import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getJobs = () => api.get('/jobs');
export const createJob = (data) => api.post('/jobs', data);
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

export const getJobStages = (jobId) => api.get(`/stages/${jobId}`);
export const updateJobStage = (jobId, stageNo, data) => api.put(`/stages/${jobId}/stage/${stageNo}`, data);

export const getJobChecklists = (jobId) => api.get(`/checklists/${jobId}`);
export const updateChecklistItem = (id, data) => api.put(`/checklists/${id}`, data);

export const getLeads = () => api.get('/leads');
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);

export const getPayments = () => api.get('/payments');
export const createPayment = (data) => api.post('/payments', data);
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);

export const getMaterials = () => api.get('/materials');
export const createMaterial = (data) => api.post('/materials', data);
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);

export const getDailyTasks = () => api.get('/daily-tasks');
export const createDailyTask = (data) => api.post('/daily-tasks', data);
export const updateDailyTask = (id, data) => api.put(`/daily-tasks/${id}`, data);
export const deleteDailyTask = (id) => api.delete(`/daily-tasks/${id}`);

export const getSnags = () => api.get('/snags');
export const createSnag = (data) => api.post('/snags', data);
export const updateSnag = (id, data) => api.put(`/snags/${id}`, data);
export const deleteSnag = (id) => api.delete(`/snags/${id}`);

export const getHandovers = () => api.get('/handovers');
export const createHandover = (data) => api.post('/handovers', data);
export const updateHandover = (id, data) => api.put(`/handovers/${id}`, data);

export const getProfitability = () => api.get('/profitability');
export const createProfitability = (data) => api.post('/profitability', data);
export const updateProfitability = (id, data) => api.put(`/profitability/${id}`, data);

export default api;
