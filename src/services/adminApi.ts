import { apiClient } from './apiClient';
import type {
  AiDraft,
  AnalyticsContext,
  AnalyticsFilters,
  AdminCategory,
  AdminModifierGroup,
  AdminModifierOption,
  AdminOrder,
  AdminProduct,
  AdminShift,
  BusinessDay,
  CampaignDraft,
  CopilotChatResponse,
  CopilotConversationDetail,
  CopilotConversationSummary,
  DashboardSummary,
  KitchenStation,
  KitchenTicket,
  KitchenTicketStatus,
  PrintDocumentType,
  PrintJob,
  PrintJobStatus,
  Printer,
  PrinterConnectionType,
  PrinterRoute,
  PrinterRouteType,
  PrinterStatus,
  PrinterType,
  ProductFormInput,
  StaffMember,
} from '../types/admin';
import type { StoreRole } from '../types/auth';

export async function fetchDashboard() {
  const { data } = await apiClient.get<DashboardSummary>('/admin/dashboard');
  return data;
}

export async function fetchOrders() {
  const { data } = await apiClient.get<AdminOrder[]>('/checkout/orders');
  return data;
}

export async function fetchAnalyticsContext(filters: AnalyticsFilters) {
  const { data } = await apiClient.get<AnalyticsContext>('/admin/analytics/ai-context', { params: filters });
  return data;
}

export async function fetchCopilotDailyBrief() {
  const { data } = await apiClient.get<CopilotChatResponse>('/admin/ai/copilot/daily-brief');
  return data;
}

export async function fetchCopilotConversations() {
  const { data } = await apiClient.get<CopilotConversationSummary[]>('/admin/ai/copilot/conversations');
  return data;
}

export async function fetchCopilotConversation(id: string) {
  const { data } = await apiClient.get<CopilotConversationDetail>(`/admin/ai/copilot/conversations/${id}`);
  return data;
}

export async function sendCopilotMessage(input: {
  conversationId?: string;
  message: string;
  period?: AnalyticsFilters;
}) {
  const { data } = await apiClient.post<CopilotChatResponse>('/admin/ai/copilot/chat', input);
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

export async function fetchBusinessDays() {
  const { data } = await apiClient.get<BusinessDay[]>('/business-day');
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
  kitchenStationId?: string;
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

export async function createCategory(input: { name: string; sortOrder?: number; defaultKitchenStationId?: string }) {
  const { data } = await apiClient.post<AdminCategory>('/admin/categories', input);
  return data;
}

export async function updateCategory(id: string, input: { name: string; sortOrder?: number; defaultKitchenStationId?: string }) {
  const { data } = await apiClient.patch<AdminCategory>(`/admin/categories/${id}`, input);
  return data;
}

export async function updateCategoryStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  const { data } = await apiClient.patch<AdminCategory>(`/admin/categories/${id}/status`, { status });
  return data;
}

export async function fetchKitchenStations() {
  const { data } = await apiClient.get<KitchenStation[]>('/admin/kitchen/stations');
  return data;
}

export async function createKitchenStation(input: { name: string; code: string; sortOrder?: number; isDefault?: boolean }) {
  const { data } = await apiClient.post<KitchenStation>('/admin/kitchen/stations', input);
  return data;
}

export async function updateKitchenStation(id: string, input: { name: string; code: string; sortOrder?: number; isDefault?: boolean }) {
  const { data } = await apiClient.patch<KitchenStation>(`/admin/kitchen/stations/${id}`, input);
  return data;
}

export async function updateKitchenStationStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  const { data } = await apiClient.patch<KitchenStation>(`/admin/kitchen/stations/${id}/status`, { status });
  return data;
}

export async function setDefaultKitchenStation(id: string) {
  const { data } = await apiClient.patch<KitchenStation>(`/admin/kitchen/stations/${id}/default`);
  return data;
}

export async function fetchKitchenTickets(filters: { stationId?: string; status?: KitchenTicketStatus | ''; take?: number } = {}) {
  const { data } = await apiClient.get<KitchenTicket[]>('/admin/kitchen/tickets', { params: filters });
  return data;
}

export async function startKitchenTicket(id: string) {
  const { data } = await apiClient.post<KitchenTicket>(`/admin/kitchen/tickets/${id}/start`);
  return data;
}

export async function markKitchenTicketReady(id: string) {
  const { data } = await apiClient.post<KitchenTicket>(`/admin/kitchen/tickets/${id}/ready`);
  return data;
}

export async function completeKitchenTicket(id: string) {
  const { data } = await apiClient.post<KitchenTicket>(`/admin/kitchen/tickets/${id}/complete`);
  return data;
}

export async function cancelKitchenTicket(id: string, reason: string) {
  const { data } = await apiClient.post<KitchenTicket>(`/admin/kitchen/tickets/${id}/cancel`, { reason });
  return data;
}

export type PrinterFormInput = {
  name: string;
  code: string;
  type: PrinterType;
  connectionType: PrinterConnectionType;
  host?: string;
  port?: number;
  usbVendorId?: string;
  usbProductId?: string;
  paperWidth?: number;
  autoCut?: boolean;
  cashDrawerPulse?: boolean;
};

export type PrinterRouteInput = {
  printerId: string;
  routeType: PrinterRouteType;
  targetId?: string;
  documentType: PrintDocumentType;
};

export async function fetchPrinters() {
  const { data } = await apiClient.get<Printer[]>('/admin/printers');
  return data;
}

export async function createPrinter(input: PrinterFormInput) {
  const { data } = await apiClient.post<Printer>('/admin/printers', input);
  return data;
}

export async function updatePrinter(id: string, input: PrinterFormInput) {
  const { data } = await apiClient.patch<Printer>(`/admin/printers/${id}`, input);
  return data;
}

export async function updatePrinterStatus(id: string, status: PrinterStatus) {
  const { data } = await apiClient.patch<Printer>(`/admin/printers/${id}/status`, { status });
  return data;
}

export async function testPrinter(id: string) {
  const { data } = await apiClient.post<PrintJob>(`/admin/printers/${id}/test`);
  return data;
}

export async function fetchPrinterRoutes() {
  const { data } = await apiClient.get<PrinterRoute[]>('/admin/printer-routes');
  return data;
}

export async function upsertPrinterRoute(input: PrinterRouteInput) {
  const { data } = await apiClient.post<PrinterRoute>('/admin/printer-routes', input);
  return data;
}

export async function deletePrinterRoute(id: string) {
  const { data } = await apiClient.delete<{ id: string; deleted: boolean }>(`/admin/printer-routes/${id}`);
  return data;
}

export async function fetchPrintJobs(filters: { status?: PrintJobStatus | ''; printerId?: string; documentType?: PrintDocumentType | ''; take?: number } = {}) {
  const { data } = await apiClient.get<PrintJob[]>('/admin/print-jobs', { params: filters });
  return data;
}

export async function retryPrintJob(id: string) {
  const { data } = await apiClient.post<PrintJob>(`/admin/print-jobs/${id}/retry`);
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
