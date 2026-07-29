import { apiClient } from './apiClient';
import type {
  AiDraft,
  AiBusinessDailyReport,
  AiBusinessDailyRecommendation,
  AiCampaignRecommendationResponse,
  AiCampaignRecommendationType,
  AnalyticsContext,
  AnalyticsFilters,
  AdminCategory,
  AdminCustomer,
  AdminCustomerListResponse,
  AdminModifierGroup,
  AdminModifierOption,
  AdminOrder,
  AdminProduct,
  AdminShift,
  BatchCreateTablesInput,
  BatchCreateTablesResult,
  BusinessDay,
  DiningArea,
  DiningTable,
  CampaignDraft,
  CustomerSegment,
  CustomerSegmentCustomer,
  CustomerSegmentRuleJson,
  CopilotChatResponse,
  CopilotConversationDetail,
  CopilotConversationSummary,
  DashboardSummary,
  KitchenStation,
  KitchenSettings,
  KitchenPrintMode,
  KitchenRouteSummary,
  KitchenStaffStationAssignment,
  KitchenTicket,
  KitchenTicketPreview,
  KitchenTicketStatus,
  LoyaltyPointLedger,
  CampaignReportItem,
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
  ProductReportItem,
  CustomerReportItem,
  ItemsReport,
  PaymentReportItem,
  PermissionPolicy,
  ReportPreset,
  ReportSummary,
  ShiftReportItem,
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

export type AiBusinessDailyFilters = {
  preset?: 'today' | 'yesterday' | 'last7days' | 'custom';
  from?: string;
  to?: string;
  timezone?: string;
  type?: AiCampaignRecommendationType;
};

export async function fetchAiBusinessDaily(filters: AiBusinessDailyFilters) {
  const { data } = await apiClient.get<AiBusinessDailyReport>('/admin/ai/business-daily', { params: filters });
  return data;
}

export async function fetchAiRecommendations(filters: AiBusinessDailyFilters) {
  const { data } = await apiClient.get<AiCampaignRecommendationResponse>('/admin/ai/recommendations', { params: filters });
  return data;
}

export async function createAiCampaignDraft(input: {
  recommendationId: string;
  preset?: AiBusinessDailyFilters['preset'];
  from?: string;
  to?: string;
  timezone?: string;
  recommendationType?: AiCampaignRecommendationType;
  adjustments?: {
    title?: string;
    discountValue?: number;
    threshold?: number;
    durationDays?: number;
  };
}) {
  const { data } = await apiClient.post<{ campaign: CampaignDraft; aiMetadata: CampaignDraft['aiMetadata']; status: CampaignDraft['status'] }>('/admin/ai/campaign-drafts', {
    recommendationId: input.recommendationId,
    preset: input.preset,
    from: input.from,
    to: input.to,
    timezone: input.timezone,
    recommendationType: input.recommendationType,
    adjustments: input.adjustments,
  });
  return data;
}

export async function createLegacyAiCampaignDraft(input: Pick<AiBusinessDailyRecommendation, 'id' | 'type' | 'title' | 'reason'> & { campaignTemplate?: AiBusinessDailyRecommendation['action']['campaignTemplate'] }) {
  const { data } = await apiClient.post<CampaignDraft>('/admin/ai/campaign-drafts', {
    recommendationId: input.id,
    type: input.type,
    title: input.title,
    reason: input.reason,
    campaignTemplate: input.campaignTemplate,
  });
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

export type CustomerFilters = {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | '';
  take?: number;
  skip?: number;
};

export async function fetchCustomers(filters: CustomerFilters = {}) {
  const { data } = await apiClient.get<AdminCustomerListResponse>('/admin/customers', { params: filters });
  return data;
}

export async function fetchCustomer(id: string) {
  const { data } = await apiClient.get<AdminCustomer>(`/admin/customers/${id}`);
  return data;
}

export async function createCustomer(input: { phone: string; name?: string; note?: string }) {
  const { data } = await apiClient.post<AdminCustomer>('/admin/customers', input);
  return data;
}

export async function updateCustomer(id: string, input: { phone?: string; name?: string; note?: string; status?: AdminCustomer['status'] }) {
  const { data } = await apiClient.patch<AdminCustomer>(`/admin/customers/${id}`, input);
  return data;
}

export async function fetchCustomerOrders(id: string) {
  const { data } = await apiClient.get<AdminOrder[]>(`/admin/customers/${id}/orders`);
  return data;
}

export async function fetchCustomerPoints(id: string) {
  const { data } = await apiClient.get<LoyaltyPointLedger[]>(`/admin/customers/${id}/points`);
  return data;
}

export type ReportFilters = {
  preset?: ReportPreset;
  from?: string;
  to?: string;
  timezone?: string;
  limit?: number;
};

export async function fetchReportSummary(filters: ReportFilters) {
  const { data } = await apiClient.get<ReportSummary>('/admin/reports/summary', { params: filters });
  return data;
}

export async function fetchProductReport(filters: ReportFilters) {
  const { data } = await apiClient.get<ItemsReport<ProductReportItem>>('/admin/reports/products', { params: filters });
  return data;
}

export async function fetchCustomerReport(filters: ReportFilters) {
  const { data } = await apiClient.get<ItemsReport<CustomerReportItem>>('/admin/reports/customers', { params: filters });
  return data;
}

export async function fetchCampaignReport(filters: ReportFilters) {
  const { data } = await apiClient.get<ItemsReport<CampaignReportItem>>('/admin/reports/campaigns', { params: filters });
  return data;
}

export async function fetchPaymentReport(filters: ReportFilters) {
  const { data } = await apiClient.get<ItemsReport<PaymentReportItem>>('/admin/reports/payments', { params: filters });
  return data;
}

export async function fetchShiftReport(filters: ReportFilters) {
  const { data } = await apiClient.get<ItemsReport<ShiftReportItem>>('/admin/reports/shifts', { params: filters });
  return data;
}

export async function downloadReportCsv(type: 'summary' | 'products' | 'customers' | 'campaigns' | 'payments' | 'shifts', filters: ReportFilters) {
  const { data } = await apiClient.get<Blob>('/admin/reports/export', { params: { ...filters, type, format: 'csv' }, responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-pos-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function fetchDiningAreas() {
  const { data } = await apiClient.get<DiningArea[]>('/admin/dining-areas');
  return data;
}

export async function createDiningArea(input: { name: string; sortOrder?: number; status?: 'ACTIVE' | 'INACTIVE' }) {
  const { data } = await apiClient.post<DiningArea>('/admin/dining-areas', input);
  return data;
}

export async function fetchDiningTables() {
  const { data } = await apiClient.get<DiningTable[]>('/admin/dining-tables');
  return data;
}

export async function createDiningTable(input: { areaId: string; name: string; seats?: number; sortOrder?: number; status?: DiningTable['status'] }) {
  const { data } = await apiClient.post<DiningTable>('/admin/dining-tables', input);
  return data;
}

export async function batchCreateDiningTables(input: BatchCreateTablesInput) {
  const { data } = await apiClient.post<BatchCreateTablesResult>('/admin/tables/batch-create', input);
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

export async function resetStaffPin(id: string, pin: string) {
  const { data } = await apiClient.post<{ id: string; userId: string; pinSet: boolean }>(`/admin/staff/${id}/reset-pin`, { pin });
  return data;
}

export async function fetchPermissionPolicy() {
  const { data } = await apiClient.get<PermissionPolicy>('/admin/permission-policy');
  return data;
}

export async function updatePermissionPolicy(input: Partial<PermissionPolicy>) {
  const { data } = await apiClient.patch<PermissionPolicy>('/admin/permission-policy', input);
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

export async function fetchKitchenSettings() {
  const { data } = await apiClient.get<KitchenSettings>('/admin/kitchen/settings');
  return data;
}

export async function updateKitchenPrintMode(mode: KitchenPrintMode) {
  const { data } = await apiClient.patch<KitchenSettings>('/admin/kitchen/settings/print-mode', { mode });
  return data;
}

export async function createKitchenStation(input: { name: string; code: string; sortOrder?: number; isDefault?: boolean; warningMinutes?: number; overdueMinutes?: number }) {
  const { data } = await apiClient.post<KitchenStation>('/admin/kitchen/stations', input);
  return data;
}

export async function updateKitchenStation(id: string, input: { name: string; code: string; sortOrder?: number; isDefault?: boolean; warningMinutes?: number; overdueMinutes?: number }) {
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

export async function fetchKitchenRouteSummary() {
  const { data } = await apiClient.get<KitchenRouteSummary>('/admin/kitchen/route-summary');
  return data;
}

export async function fetchKitchenStaffStations() {
  const { data } = await apiClient.get<KitchenStaffStationAssignment[]>('/admin/kitchen/staff-stations');
  return data;
}

export async function assignKitchenStaffStations(input: { userId: string; stationIds: string[] }) {
  const { data } = await apiClient.patch<KitchenStaffStationAssignment[]>('/admin/kitchen/staff-stations', input);
  return data;
}

export async function previewKitchenTicket(id: string) {
  const { data } = await apiClient.get<KitchenTicketPreview>(`/admin/kitchen/tickets/${id}/preview`);
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

export type CampaignInput = {
  name: string;
  goal?: string;
  type: CampaignDraft['type'];
  discountType?: 'percentage' | 'fixed_amount';
  discountValue: number;
  thresholdAmount?: number;
  startsAt?: string;
  endsAt?: string;
  promoCode?: string;
  productId?: string;
  categoryName?: string;
  customerEligibilityMode?: CampaignDraft['customerEligibilityMode'];
  targetCustomerSegmentId?: string;
  stackingPolicy?: CampaignDraft['stackingPolicy'];
  priority?: number;
  usageLimit?: number;
};

export async function createCampaign(input: CampaignInput) {
  const { data } = await apiClient.post<CampaignDraft>('/admin/campaigns', input);
  return data;
}

export async function updateCampaignStatus(id: string, status: CampaignDraft['status']) {
  const { data } = await apiClient.patch<CampaignDraft>(`/admin/campaigns/${id}/status`, { status });
  return data;
}

export type CustomerSegmentInput = {
  name: string;
  description?: string;
  ruleJson: CustomerSegmentRuleJson;
};

export async function fetchCustomerSegments() {
  const { data } = await apiClient.get<CustomerSegment[]>('/admin/customer-segments');
  return data;
}

export async function createCustomerSegment(input: CustomerSegmentInput) {
  const { data } = await apiClient.post<CustomerSegment>('/admin/customer-segments', input);
  return data;
}

export async function updateCustomerSegment(id: string, input: CustomerSegmentInput) {
  const { data } = await apiClient.patch<CustomerSegment>(`/admin/customer-segments/${id}`, input);
  return data;
}

export async function updateCustomerSegmentStatus(id: string, status: CustomerSegment['status']) {
  const { data } = await apiClient.patch<CustomerSegment>(`/admin/customer-segments/${id}/status`, { status });
  return data;
}

export async function evaluateCustomerSegment(id: string) {
  const { data } = await apiClient.post<{ segmentId: string; matchedCustomerCount: number; matchedCustomerIds: string[]; evaluatedAt: string }>(`/admin/customer-segments/${id}/evaluate`);
  return data;
}

export async function fetchCustomerSegmentCustomers(id: string) {
  const { data } = await apiClient.get<CustomerSegmentCustomer[]>(`/admin/customer-segments/${id}/customers`);
  return data;
}

export async function fetchAiDrafts() {
  const { data } = await apiClient.get<AiDraft[]>('/admin/ai-drafts');
  return data;
}
