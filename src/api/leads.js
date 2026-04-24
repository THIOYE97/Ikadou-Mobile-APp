import { publicClient, protectedClient } from './client';

export const createLead = (payload) =>
  publicClient.post('/public/leads', payload);

export const contactAgent = ({ terrainId, ...payload }) =>
  publicClient.post(`/public/terrains/${terrainId}/contact`, payload);

export const getVisitSlots = ({ terrainId, date, projectId }) =>
  protectedClient.get('/client/visits/slots/search', {
    params: {
      terrainId: terrainId || undefined,
      date,
      projectId: projectId || undefined,
    },
  });

export const bookVisit = ({ terrainId, date, slot, notes, projectId }) =>
  protectedClient.post('/client/visits', {
    terrainId: terrainId || undefined,
    visitDate: date,
    visitTime: slot,
    notes,
    projectId: projectId || undefined,
  });

export const getMyVisits = (params = {}) =>
  protectedClient.get('/client/visits', { params });

export const getVisitById = (id) =>
  protectedClient.get(`/client/visits/${id}`);

export const rescheduleVisit = (id, payload) =>
  protectedClient.patch(`/client/visits/${id}/reschedule`, payload);

export const cancelVisit = (id, payload = {}) =>
  protectedClient.patch(`/client/visits/${id}/cancel`, payload);