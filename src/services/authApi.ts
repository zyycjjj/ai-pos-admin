import { apiClient } from './apiClient';
import type { AuthSession } from '../types/auth';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthSession>('/auth/login', { email, password });
  return data;
}

export async function loadMe() {
  const { data } = await apiClient.get<AuthSession>('/auth/me');
  return data;
}
