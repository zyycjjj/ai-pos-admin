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

export type BusinessDay = {
  id: string;
  status: 'OPEN' | 'CLOSED';
  businessDate: string;
  openedAt: string;
  closedAt: string | null;
  orderCount: number;
  grossSales: number;
  refundTotal: number;
  netSales: number;
  notes: string | null;
};

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type AdminCustomer = {
  id: string;
  phone: string;
  normalizedPhone: string;
  name: string | null;
  note: string | null;
  tags: unknown[];
  status: CustomerStatus;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  orderCount: number;
  totalSpend: number;
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCustomerListResponse = {
  items: AdminCustomer[];
  total: number;
};

export type LoyaltyPointLedger = {
  id: string;
  customerId: string;
  orderId: string | null;
  type: 'EARN' | 'ADJUST' | 'VOID' | 'REFUND_ADJUST';
  points: number;
  balanceAfter: number;
  reason: string;
  createdByUserId: string | null;
  createdAt: string;
};

export type ReportPreset = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'custom';

export type ReportRange = {
  from: string;
  to: string;
  timezone: string;
  preset: ReportPreset;
};

export type ReportSummary = {
  range: ReportRange;
  currency: string;
  sales: {
    grossSales: number;
    netSales: number;
    refundTotal: number;
    discountTotal: number;
    promotionDiscountTotal: number;
    manualDiscountTotal: number;
    orderCount: number;
    averageOrderValue: number;
  };
  customers: {
    customerCount: number;
    newCustomers: number;
    repeatCustomers: number;
    repeatPurchaseRate: number;
  };
  campaigns: {
    campaignUsageCount: number;
    campaignDiscountTotal: number;
    customerCampaignUsageCount: number;
    customerCampaignDiscountTotal: number;
  };
  shifts: {
    closedShiftCount: number;
    cashExpectedTotal: number;
    cashActualTotal: number;
    cashVarianceTotal: number;
  };
};

export type ProductReportItem = { productId: string; name: string; quantitySold: number; grossSales: number; netSales: number; refundQuantity: number; refundAmount: number };
export type CustomerReportItem = { customerId: string; name: string | null; phone: string | null; orderCount: number; netSales: number; pointsEarned: number; pointsAdjusted: number; lastOrderAt: string | null };
export type CampaignReportItem = { campaignId: string; name: string; type: string; customerEligibilityMode: string; targetSegmentName: string | null; usageCount: number; discountTotal: number; orderCount: number };
export type PaymentReportItem = { method: string; orderCount: number; paymentAmount: number; refundAmount: number; netAmount: number };
export type ShiftReportItem = { shiftId: string; openedAt: string; closedAt: string | null; openedBy: string | null; closedBy: string | null; cashExpected: number; cashActual: number | null; cashVariance: number | null; cashIn: number; cashOut: number; cashSales: number; cashRefunds: number };

export type ItemsReport<T> = {
  range: ReportRange;
  currency: string;
  items: T[];
};

export type DiningArea = {
  id: string;
  name: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
};

export type DiningTable = {
  id: string;
  areaId: string;
  areaName: string;
  name: string;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'RESERVED' | 'INACTIVE';
  sortOrder: number;
  currentOrderId: string | null;
  currentOrder: AdminOrder | null;
  createdAt: string;
  updatedAt: string;
};

export type BatchCreateTablesInput = {
  areaId?: string;
  areaName?: string;
  prefix: string;
  startNumber: number;
  count: number;
  digits?: number;
  defaultSeats?: number;
  skipExisting?: boolean;
};

export type BatchCreateTablesResult = {
  areaId: string;
  areaName: string;
  created: number;
  skipped: number;
  items: Array<{ name: string; status: 'CREATED' | 'SKIPPED' }>;
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
  kitchenStation: { id: string; name: string; code: string } | null;
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
  kitchenStationId?: string;
  price: number;
  status?: 'ACTIVE' | 'INACTIVE';
  availabilityStatus?: 'AVAILABLE' | 'SOLD_OUT';
};

export type AdminCategory = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  defaultKitchenStation: { id: string; name: string; code: string } | null;
  productCount: number;
  sortOrder: number;
};

export type KitchenStation = {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KitchenTicketStatus = 'NEW' | 'PREPARING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type KitchenPrintMode = 'ORDER_TICKET' | 'ITEM_TICKET';
export type KitchenSettings = { printMode: KitchenPrintMode };

export type KitchenTicket = {
  id: string;
  ticketNumber: string;
  status: KitchenTicketStatus;
  station: KitchenStation;
  order: {
    id: string;
    orderNumber: string;
    pickupNumber: string | null;
    status: string;
    total: number;
    createdAt: string;
  };
  items: Array<{
    id: string;
    orderItemId: string;
    productId: string;
    productName: string;
    quantity: number;
    modifiers: Array<{ groupName?: string; optionName?: string; priceDelta?: number }>;
    notes: string | null;
    status: KitchenTicketStatus;
  }>;
  startedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PrinterType = 'RECEIPT' | 'KITCHEN' | 'MULTI_PURPOSE';
export type PrinterConnectionType = 'LAN' | 'USB';
export type PrinterStatus = 'ACTIVE' | 'INACTIVE';
export type PrinterRouteType = 'STORE_DEFAULT' | 'KITCHEN_STATION';
export type PrintDocumentType = 'CUSTOMER_RECEIPT' | 'KITCHEN_TICKET' | 'REFUND_RECEIPT' | 'SHIFT_SUMMARY' | 'TEST_PAGE';
export type PrintJobReferenceType = 'ORDER' | 'KITCHEN_TICKET' | 'REFUND' | 'SHIFT' | 'TEST';
export type PrintJobStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export type PrintJobReason = 'AUTO' | 'MANUAL' | 'MANUAL_REPRINT' | 'TEST';

export type Printer = {
  id: string;
  name: string;
  code: string;
  type: PrinterType;
  connectionType: PrinterConnectionType;
  status: PrinterStatus;
  host: string | null;
  port: number | null;
  usbVendorId: string | null;
  usbProductId: string | null;
  paperWidth: number;
  autoCut: boolean;
  cashDrawerPulse: boolean;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type PrinterRoute = {
  id: string;
  printerId: string;
  printer: Printer;
  routeType: PrinterRouteType;
  targetId: string;
  documentType: PrintDocumentType;
  createdAt: string;
  updatedAt: string;
};

export type PrintJob = {
  id: string;
  printerId: string | null;
  printer: Printer | null;
  documentType: PrintDocumentType;
  referenceType: PrintJobReferenceType;
  referenceId: string;
  status: PrintJobStatus;
  reason: PrintJobReason;
  payload: unknown;
  renderedText: string | null;
  byteLength: number | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  autoPrintKey: string | null;
  sourceJobId: string | null;
  requestedByUserId: string | null;
  requestedByName: string | null;
  claimedByDeviceId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  type: 'ORDER_DISCOUNT' | 'THRESHOLD_DISCOUNT' | 'ITEM_DISCOUNT' | 'PROMO_CODE' | 'BUY_X_GET_Y';
  discountType: 'percentage' | 'fixed_amount' | string | null;
  discountValue: number | null;
  thresholdAmount: number | null;
  promoCode: string | null;
  productId: string | null;
  categoryName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  customerEligibilityMode: 'ALL_CUSTOMERS' | 'CUSTOMER_ONLY' | 'SEGMENT_ONLY';
  targetCustomerSegmentId: string | null;
  stackingPolicy: 'BEST_ONLY' | 'STACKABLE' | 'EXCLUSIVE';
  usageLimit: number | null;
  usageCount: number;
  discountTotal: number;
  timeWindow: string | null;
  category: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
  createdAt: string;
};

export type CustomerSegmentRuleJson = {
  minOrderCount?: number;
  maxOrderCount?: number;
  minTotalSpend?: number;
  maxTotalSpend?: number;
  lastOrderBeforeDays?: number;
  lastOrderWithinDays?: number;
  minPointsBalance?: number;
  maxPointsBalance?: number;
};

export type CustomerSegment = {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  type: 'SMART_RULE';
  ruleJson: CustomerSegmentRuleJson;
  memberCount: number;
  lastEvaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSegmentCustomer = {
  id: string;
  phone: string;
  name: string | null;
  orderCount: number;
  totalSpend: number;
  pointsBalance: number;
  lastOrderAt: string | null;
  matchedAt: string;
};

export type AiDraft = {
  id: string;
  type: 'MENU' | 'CAMPAIGN';
  title: string;
  status: string;
  createdAt: string;
};

export type AnalyticsPeriod = { from: string; to: string; timezone: string };
export type AnalyticsSalesMetric = {
  grossSales: number;
  refundTotal: number;
  netSales: number;
  orderCount: number;
  paidOrderCount: number;
  averageTicket: number;
  unitsSold: number;
};
export type AnalyticsProductMetric = {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  orderCount: number;
  grossSales: number;
  refundAmount: number;
  netSales: number;
  orderPenetration: number;
  changePercent: number | null;
};
export type AnalyticsCategoryMetric = {
  categoryId: string | null;
  name: string;
  unitsSold: number;
  netSales: number;
  sharePercent: number;
  changePercent: number | null;
};
export type AnalyticsModifierMetric = {
  optionId: string;
  name: string;
  groupName: string;
  selectionCount: number;
  eligibleProductItemCount: number;
  attachRate: number;
  revenueContribution: number;
};
export type AnalyticsShiftMetric = {
  shiftId: string;
  staffName: string;
  netSales: number;
  orderCount: number;
  cashVariance: number | null;
};
export type AnalyticsKitchenMetric = {
  stationId: string;
  stationName: string;
  ticketCount: number;
  lateTicketCount: number;
  avgQueueTimeMinutes: number | null;
  avgPrepTimeMinutes: number | null;
  avgTotalTimeMinutes: number | null;
};
export type AnalyticsContext = {
  store: { id: string; name: string; timezone: string; currency: string };
  period: AnalyticsPeriod;
  comparisonPeriod: AnalyticsPeriod;
  overview: AnalyticsSalesMetric;
  comparison: Record<string, number | boolean | null>;
  daily: Array<{ date: string; netSales: number; orderCount: number }>;
  hourly: Array<{ hour: number; netSales: number; orderCount: number }>;
  topProducts: AnalyticsProductMetric[];
  decliningProducts: AnalyticsProductMetric[];
  categories: AnalyticsCategoryMetric[];
  modifiers: AnalyticsModifierMetric[];
  refunds: {
    refundTotal: number;
    refundCount: number;
    refundRate: number;
    refundedOrderRate: number;
    topReasons: Array<{ reason: string; count: number; amount: number }>;
    topRefundedProducts: Array<{ productId: string; name: string; quantity: number; amount: number }>;
  };
  shifts: AnalyticsShiftMetric[];
  kitchen: AnalyticsKitchenMetric[];
  payments: Array<{ method: string; amount: number; sharePercent: number }>;
  signals: Array<{ type: string; severity: 'INFO' | 'WARNING'; metric: string; currentValue: number; changePercent: number | null; label?: string }>;
  coverage: Record<string, boolean>;
};

export type AnalyticsFilters = {
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days';
  from?: string;
  to?: string;
  compare?: 'previous_period' | 'previous_day' | 'previous_week';
};

export type CopilotEvidence = {
  label: string;
  value: number | string | null;
  comparisonValue?: number | string | null;
  changePercent?: number | null;
};

export type CopilotStructuredMessage = {
  answer: string;
  summary: string;
  evidence: CopilotEvidence[];
  drivers: Array<{ type: string; text: string }>;
  risks: Array<{ severity: 'INFO' | 'WARNING'; text: string }>;
  recommendations: Array<{ title: string; description: string }>;
  limitations: string[];
};

export type CopilotChatResponse = CopilotStructuredMessage & {
  conversationId: string;
  messageId: string;
  executionId: string;
  provider: string;
  model: string;
  source: 'deepseek' | 'fallback';
  contextType: string;
  period: AnalyticsPeriod;
  comparisonPeriod: AnalyticsPeriod;
  dataCoverage: Record<string, boolean>;
  suggestedQuestions: string[];
};

export type CopilotConversationSummary = {
  id: string;
  title: string;
  status: string;
  lastMessageAt: string;
  lastMessage: string | null;
  createdAt: string;
};

export type CopilotMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  structuredData: CopilotStructuredMessage | null;
  periodContext: unknown;
  createdAt: string;
};

export type CopilotConversationDetail = {
  id: string;
  title: string;
  status: string;
  messages: CopilotMessage[];
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  pickupNumber: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'PICKUP';
  tableId: string | null;
  tableName: string | null;
  customerId: string | null;
  customerPhone: string | null;
  customerName: string | null;
  loyaltyPointsEarned: number;
  loyaltyPointsBalanceAfter: number | null;
  guestCount: number | null;
  status: string;
  printStatus: string;
  paymentMethod: string | null;
  currency: string;
  subtotal: number;
  adjustment: number;
  adjustmentType: string | null;
  adjustmentValue: number | null;
  discountReason: string | null;
  taxRate: number;
  tax: number;
  serviceChargeRate: number;
  serviceCharge: number;
  tip: number;
  total: number;
  refundedTotal: number;
  heldAt: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  itemCount?: number;
  items: Array<{ id: string; quantity: number }>;
  auditLogs?: Array<{
    id: string;
    action: 'CANCELLED' | 'VOIDED' | 'REFUNDED' | 'HELD' | 'RESUMED' | 'TABLE_OPENED' | 'TABLE_TRANSFERRED' | 'TABLE_MERGED' | 'BILL_SPLIT' | 'TABLE_CLEARED';
    reason: string;
    createdAt: string;
  }>;
  createdAt: string;
};
