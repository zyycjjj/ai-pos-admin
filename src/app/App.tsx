import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '../layouts/AdminLayout';
import { AiCenterPage } from '../pages/AiCenterPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { CampaignsPage } from '../pages/CampaignsPage';
import { CustomerSegmentsPage } from '../pages/CustomerSegmentsPage';
import { CustomersPage } from '../pages/CustomersPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { LoginPage } from '../pages/LoginPage';
import { KitchenPage } from '../pages/KitchenPage';
import { OrdersPage } from '../pages/OrdersPage';
import { PrintersPage } from '../pages/PrintersPage';
import { ProductsPage } from '../pages/ProductsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ShiftsPage } from '../pages/ShiftsPage';
import { StaffPage } from '../pages/StaffPage';
import { TablesPage } from '../pages/TablesPage';
import { useAuthStore } from '../stores/authStore';
import { AdminI18nProvider } from '../i18n';

const queryClient = new QueryClient();
const routerBaseName = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'OWNER' && role !== 'MANAGER') {
    return <ForbiddenPage />;
  }

  return <AdminLayout />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminI18nProvider>
        <BrowserRouter basename={routerBaseName}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/shifts" element={<ShiftsPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/printers" element={<PrintersPage />} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customer-segments" element={<CustomerSegmentsPage />} />
              <Route path="/ai-center" element={<AiCenterPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminI18nProvider>
    </QueryClientProvider>
  );
}
