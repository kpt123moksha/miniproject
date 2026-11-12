import type { AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() {
  return localStorage.getItem('drainwatch_token');
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {...options, headers});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request could not be completed.');
  return data as T;
}

export function saveSession(data: AuthResponse) {
  localStorage.setItem('drainwatch_token', data.token);
  localStorage.setItem('drainwatch_user', JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem('drainwatch_token');
  localStorage.removeItem('drainwatch_user');
}
