import { apiClient } from './apiClient';
import type { AiDraft, AdminProduct, CampaignDraft, DashboardSummary, StaffMember } from '../types/admin';
import type { StoreRole } from '../types/auth';

export async function fetchDashboard() {
  const { data } = await apiClient.get<DashboardSummary>('/admin/dashboard');
  return data;
}

export async function fetchStaff() {
  const { data } = await apiClient.get<StaffMember[]>('/admin/staff');
  return data;
}

export async function createStaff(input: { email: string; name?: string; password: string; role: Exclude<StoreRole, 'OWNER'> }) {
  const { data } = await apiClient.post<StaffMember>('/admin/staff', input);
  return data;
}

export async function updateStaffRole(id: string, role: Exclude<StoreRole, 'OWNER'>) {
  const { data } = await apiClient.patch<StaffMember>(`/admin/staff/${id}/role`, { role });
  return data;
}

export async function disableStaff(id: string, disabled: boolean) {
  const { data } = await apiClient.patch<StaffMember>(`/admin/staff/${id}/disable`, { disabled });
  return data;
}

export async function fetchProducts() {
  const { data } = await apiClient.get<AdminProduct[]>('/admin/products');
  return data;
}

export async function fetchCampaigns() {
  const { data } = await apiClient.get<CampaignDraft[]>('/admin/campaigns');
  return data;
}

export async function fetchAiDrafts() {
  const { data } = await apiClient.get<AiDraft[]>('/admin/ai-drafts');
  return data;
}
