import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '../layouts/AdminLayout';
import { AiCenterPage } from '../pages/AiCenterPage';
import { CampaignsPage } from '../pages/CampaignsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { LoginPage } from '../pages/LoginPage';
import { KitchenPage } from '../pages/KitchenPage';
import { ProductsPage } from '../pages/ProductsPage';
import { ShiftsPage } from '../pages/ShiftsPage';
import { StaffPage } from '../pages/StaffPage';
import { useAuthStore } from '../stores/authStore';

const queryClient = new QueryClient();

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
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route path="/kitchen" element={<KitchenPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/ai-center" element={<AiCenterPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
