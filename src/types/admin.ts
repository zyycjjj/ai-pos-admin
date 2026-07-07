import type { StoreRole } from './auth';

export type DashboardSummary = {
  todaySales: number;
  grossSales?: number;
  netSales?: number;
  refundTotal?: number;
  refundCount?: number;
  ordersCount: number;
  avgTicket: number;
  activeProducts: number;
};

export type AdminCashMovement = {
  id: string;
  shiftId: string;
  type: 'OPENING' | 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT' | 'ADJUSTMENT';
  amount: number;
  reason: string;
  referenceType: 'ORDER_PAYMENT' | 'REFUND' | 'MANUAL';
  referenceId: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type AdminShift = {
  id: string;
  userId: string;
  staffName: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  cashSales: number;
  cashRefunds: number;
  cashIn: number;
  cashOut: number;
  adjustments: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
  notes: string | null;
  movements: AdminCashMovement[];
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
