/** Material service — wraps API calls */
import api from './api';

export const materialService = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  create: (formData) => api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/materials/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/materials/${id}`),
  getMy: (params) => api.get('/materials/my', { params }),
  getMatches: (params) => api.get('/materials/matches', { params }),
  placeBid: (id, amount, quantity) => api.post(`/materials/${id}/bid`, { amount, quantity }),
  getBids: (id) => api.get(`/materials/${id}/bids`),
  acceptBid: (id, bidId) => api.post(`/materials/${id}/accept-bid`, { bidId }),
  recordView: (id) => api.post(`/materials/${id}/view`),
  analyzeImage: (image) => api.post('/materials/analyze-image', { image }),
};

/** Transaction service */
export const transactionService = {
  create: (data) => api.post('/transactions', data),
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  updateStatus: (id, status, sellerNote) =>
    api.patch(`/transactions/${id}/status`, { status, sellerNote }),
};

/** Message service */
export const messageService = {
  getConversations: () => api.get('/messages/conversations/list'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (receiver, text) => api.post('/messages', { receiver, text }),
};

/** User service */
export const userService = {
  getProfile: () => api.get('/users/profile'),
  update: (formData) => api.put('/users/update', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDashboard: () => api.get('/users/dashboard'),
  getCarbon: () => api.get('/users/carbon'),
  submitCarbonAssessment: (data) => api.post('/users/carbon-assessment', data),
  // Admin
  getAllUsers: (params) => api.get('/users', { params }),
  toggleVerify: (id) => api.patch(`/users/${id}/verify`),
};
