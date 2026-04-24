// src/api/terrains.js
import { publicClient } from './client';

export const getOnboardingContent = () =>
  publicClient.get('/public/onboarding');

export const getTerrains = (params = {}) => {
  const clean = {};

  if (params.page) clean.page = params.page;
  if (params.limit) clean.limit = params.limit;

  if (params.q && String(params.q).trim()) {
    clean.search = String(params.q).trim();
  }

  if (params.city && params.city !== 'Toutes') {
    clean.location = params.city;
  }

  if (params.zone_id) {
    clean.zone_id = params.zone_id;
  }

  if (params.minPrice !== '' && params.minPrice != null) {
    clean.min_price = params.minPrice;
  }

  if (params.maxPrice !== '' && params.maxPrice != null) {
    clean.max_price = params.maxPrice;
  }

  if (params.minSurface !== '' && params.minSurface != null) {
    clean.min_surface = params.minSurface;
  }

  if (params.maxSurface !== '' && params.maxSurface != null) {
    clean.max_surface = params.maxSurface;
  }

  if (params.sort) clean.sort = params.sort;
  if (params.order) clean.order = params.order;

  console.log('getTerrains raw params =', params);
  console.log('getTerrains clean params =', clean);

  return publicClient.get('/public/terrains', { params: clean });
};

export const getTerrainById = (id) =>
  publicClient.get(`/public/terrains/${id}`);

export const getTerrainVisitPolicy = (id) =>
  publicClient.get(`/public/terrains/${id}/visit-policy`);

export const getTerrainsForMap = (params = {}) =>
  publicClient.get('/public/terrains/map', { params });

