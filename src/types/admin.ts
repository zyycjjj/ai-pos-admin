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
  category: string | null;
  price: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
  modifierCount: number;
  updatedAt: string;
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
