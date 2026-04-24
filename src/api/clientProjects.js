import { protectedClient, publicClient } from './client';

export const listClientProjects = (params = {}) =>
  protectedClient.get('/client/projects', { params });

export const getClientProject = (projectId) =>
  protectedClient.get(`/client/projects/${projectId}`);

export const createClientProject = (payload = {}) =>
  protectedClient.post('/client/projects', payload);

export const attachTerrainToProject = (projectId, payload) =>
  protectedClient.patch(`/client/projects/${projectId}/terrain`, payload);

export const saveProjectSimulation = (projectId, payload) =>
  protectedClient.patch(`/client/projects/${projectId}/simulation`, payload);

export const startProjectVisitStep = (projectId) =>
  protectedClient.patch(`/client/projects/${projectId}/visite/start`);

export const syncClientProject = (projectId) =>
  protectedClient.patch(`/client/projects/${projectId}/sync`);

export const cancelClientProject = (projectId, payload = {}) =>
  protectedClient.patch(`/client/projects/${projectId}/cancel`, payload);

export const searchTerrainsForProject = async (params = {}) => {
  const res = await publicClient.get('/public/terrains', {
    params: {
      page: 1,
      limit: 20,
      search: params.search?.trim() || undefined,
      location: params.location || undefined,
    },
  });

  return {
    items: res?.data?.data ?? [],
    meta: res?.data?.meta ?? {},
    raw: res?.data,
  };
};