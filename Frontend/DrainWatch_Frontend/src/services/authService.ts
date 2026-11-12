import { api, saveSession, clearSession } from './api';
import type { AuthResponse, User } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const result = await api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password})
  });
  saveSession(result);
  return result;
}

export async function register(input: {name:string;email:string;password:string;phone:string}): Promise<AuthResponse> {
  const result = await api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  saveSession(result);
  return result;
}

export function getSavedUser(): User | null {
  const value = localStorage.getItem('drainwatch_user');
  if (!value) return null;
  try { return JSON.parse(value) as User; }
  catch { clearSession(); return null; }
}

export function logout() {
  clearSession();
}
