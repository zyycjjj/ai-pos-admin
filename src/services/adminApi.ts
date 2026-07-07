import { apiClient } from './apiClient';
import type { AiDraft, AdminCategory, AdminModifierGroup, AdminModifierOption, AdminProduct, AdminShift, CampaignDraft, DashboardSummary, ProductFormInput, StaffMember } from '../types/admin';
import type { StoreRole } from '../types/auth';

export async function fetchDashboard() {
  const { data } = await apiClient.get<DashboardSummary>('/admin/dashboard');
  return data;
}

export async function fetchStaff() {
  const { data } = await apiClient.get<StaffMember[]>('/admin/staff');
  return data;
}

export async function fetchShifts() {
  const { data } = await apiClient.get<AdminShift[]>('/admin/shifts');
  return data;
}

export async function fetchShift(id: string) {
  const { data } = await apiClient.get<AdminShift>(`/admin/shifts/${id}`);
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

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | '';
  availabilityStatus?: 'AVAILABLE' | 'SOLD_OUT' | '';
};

export async function fetchProducts(filters: ProductFilters = {}) {
  const { data } = await apiClient.get<AdminProduct[]>('/admin/products', { params: filters });
  return data;
}

export async function fetchProduct(id: string) {
  const { data } = await apiClient.get<AdminProduct>(`/admin/products/${id}`);
  return data;
}

export async function createProduct(input: ProductFormInput) {
  const { data } = await apiClient.post<AdminProduct>('/admin/products', input);
  return data;
}

export async function updateProduct(id: string, input: ProductFormInput) {
  const { data } = await apiClient.patch<AdminProduct>(`/admin/products/${id}`, input);
  return data;
}

export async function updateProductStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  const { data } = await apiClient.patch<AdminProduct>(`/admin/products/${id}/status`, { status });
  return data;
}

export async function updateProductAvailability(id: string, availabilityStatus: 'AVAILABLE' | 'SOLD_OUT') {
  const { data } = await apiClient.patch<AdminProduct>(`/admin/products/${id}/availability`, { availabilityStatus });
  return data;
}

export async function fetchCategories() {
  const { data } = await apiClient.get<AdminCategory[]>('/admin/categories');
  return data;
}

export async function createCategory(input: { name: string; sortOrder?: number }) {
  const { data } = await apiClient.post<AdminCategory>('/admin/categories', input);
  return data;
}

export async function updateCategory(id: string, input: { name: string; sortOrder?: number }) {
  const { data } = await apiClient.patch<AdminCategory>(`/admin/categories/${id}`, input);
  return data;
}

export async function updateCategoryStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  const { data } = await apiClient.patch<AdminCategory>(`/admin/categories/${id}/status`, { status });
  return data;
}

export async function createModifierGroup(productId: string, input: {
  name: string;
  required: boolean;
  selectionType: 'SINGLE' | 'MULTI';
  minSelect: number;
  maxSelect: number;
  sortOrder?: number;
}) {
  const { data } = await apiClient.post<AdminModifierGroup>(`/admin/products/${productId}/modifier-groups`, input);
  return data;
}

export async function updateModifierGroup(groupId: string, input: {
  name: string;
  required: boolean;
  selectionType: 'SINGLE' | 'MULTI';
  minSelect: number;
  maxSelect: number;
  sortOrder?: number;
}) {
  const { data } = await apiClient.patch<AdminModifierGroup>(`/admin/modifier-groups/${groupId}`, input);
  return data;
}

export async function updateModifierGroupStatus(groupId: string, status: 'ACTIVE' | 'INACTIVE') {
  const { data } = await apiClient.patch<AdminModifierGroup>(`/admin/modifier-groups/${groupId}/status`, { status });
  return data;
}

export async function createModifierOption(groupId: string, input: {
  name: string;
  priceDelta: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';
  sortOrder?: number;
}) {
  const { data } = await apiClient.post<AdminModifierOption>(`/admin/modifier-groups/${groupId}/options`, input);
  return data;
}

export async function updateModifierOption(optionId: string, input: {
  name: string;
  priceDelta: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';
  sortOrder?: number;
}) {
  const { data } = await apiClient.patch<AdminModifierOption>(`/admin/modifier-options/${optionId}`, input);
  return data;
}

export async function updateModifierOptionStatus(optionId: string, status: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT') {
  const { data } = await apiClient.patch<AdminModifierOption>(`/admin/modifier-options/${optionId}/status`, { status });
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
