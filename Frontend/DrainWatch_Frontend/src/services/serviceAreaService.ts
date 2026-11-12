import { api } from './api';
import type { ServiceAreaCollection, ServiceCity } from '../types';

export function getServiceAreas() {
  return api<ServiceAreaCollection>('/service-areas');
}

export async function identifyServiceCity(latitude: number, longitude: number) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
  const result = await api<{ city: ServiceCity | null }>(`/service-areas/identify?${params}`);
  return result.city;
}

export function searchServiceLocations(query: string, city: ServiceCity) {
  const params = new URLSearchParams({ q: query, city });
  return api<{ results: Array<{ display_name: string; latitude: number; longitude: number; city: ServiceCity }> }>(
    `/service-areas/search?${params}`
  );
}