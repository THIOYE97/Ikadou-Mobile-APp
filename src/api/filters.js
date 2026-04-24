import { publicClient } from './client';

export const getPublicZones = () =>
  publicClient.get('/public/zones');

export const getPublicFilters = () =>
  publicClient.get('/public/filters');