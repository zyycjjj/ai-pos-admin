import type { StoreRole } from './auth';

export type DashboardSummary = {
  todaySales: number;
  ordersCount: number;
  avgTicket: number;
  activeProducts: number;
};

export type StaffMember = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: StoreRole;
  status: 'ACTIVE' | 'DISABLED';
};

export type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  category: { id: string; name: string } | null;
  categoryName: string | null;
  price: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
  availabilityStatus: 'AVAILABLE' | 'SOLD_OUT';
  modifierCount: number;
  modifierGroups?: AdminModifierGroup[];
  updatedAt: string;
};

export type ProductFormInput = {
  name: string;
  description?: string;
  categoryId?: string;
  price: number;
  status?: 'ACTIVE' | 'INACTIVE';
  availabilityStatus?: 'AVAILABLE' | 'SOLD_OUT';
};

export type AdminCategory = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  productCount: number;
  sortOrder: number;
};

export type AdminModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  selectionType: 'SINGLE' | 'MULTI';
  multiSelect: boolean;
  minSelect: number;
  maxSelect: number;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  options: AdminModifierOption[];
};

export type AdminModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';
  sortOrder: number;
};

export type CampaignDraft = {
  id: string;
  name: string;
  goal: string | null;
  timeWindow: string | null;
  category: string | null;
  status: string;
  createdAt: string;
};

export type AiDraft = {
  id: string;
  type: 'MENU' | 'CAMPAIGN';
  title: string;
  status: string;
  createdAt: string;
};
