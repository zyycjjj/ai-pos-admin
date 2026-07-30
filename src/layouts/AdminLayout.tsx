import { BarChart3, ChefHat, Clock, FileSpreadsheet, LayoutDashboard, ListOrdered, LogOut, Megaphone, Package, Printer, Sparkles, Table2, Tags, UserRound, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '../stores/authStore';
import { formatStatusLabel, useAdminI18n } from '../i18n';

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', Icon: LayoutDashboard },
  { to: '/analytics', labelKey: 'nav.analytics', Icon: BarChart3 },
  { to: '/reports', labelKey: 'nav.reports', Icon: FileSpreadsheet },
  { to: '/staff', labelKey: 'nav.staff', Icon: Users },
  { to: '/shifts', labelKey: 'nav.shifts', Icon: Clock },
  { to: '/kitchen', labelKey: 'nav.kitchen', Icon: ChefHat },
  { to: '/printers', labelKey: 'nav.printers', Icon: Printer },
  { to: '/tables', labelKey: 'nav.tables', Icon: Table2 },
  { to: '/products', labelKey: 'nav.products', Icon: Package },
  { to: '/orders', labelKey: 'nav.orders', Icon: ListOrdered },
  { to: '/customers', labelKey: 'nav.customers', Icon: UserRound },
  { to: '/customer-segments', labelKey: 'nav.customerSegments', Icon: Tags },
  { to: '/campaigns', labelKey: 'nav.campaigns', Icon: Megaphone },
  { to: '/ai-actions', labelKey: 'nav.aiActions', Icon: Sparkles },
  { to: '/ai-ask', labelKey: 'nav.aiAsk', Icon: Sparkles },
  { to: '/ai-playbooks', labelKey: 'nav.aiPlaybooks', Icon: Sparkles },
  { to: '/ai-daily', labelKey: 'nav.aiDaily', Icon: Sparkles },
  { to: '/ai-weekly', labelKey: 'nav.aiWeekly', Icon: Sparkles },
  { to: '/ai-center', labelKey: 'nav.aiCenter', Icon: Sparkles },
];

export function AdminLayout() {
  const { activeStoreId, logout, role, stores, user } = useAuthStore();
  const { locale, setLocale, t } = useAdminI18n();
  const store = stores.find((item) => item.storeId === activeStoreId);

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div>
            <strong>AI-POS</strong>
            <span>{t('layout.admin')}</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(({ Icon, labelKey, to }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <span className="topbar-label">{t('layout.currentStore')}</span>
            <strong>{store?.storeName ?? 'AI-POS Store'}</strong>
          </div>
          <div className="topbar-user">
            <label className="language-switcher">
              <span>{t('layout.language')}</span>
              <select value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>
                <option value="zh-CN">中文</option>
                <option value="en">English</option>
              </select>
            </label>
            <div>
              <strong>{user?.name ?? user?.email}</strong>
              <span>{formatStatusLabel(t, role)}</span>
            </div>
            <button className="icon-button" type="button" onClick={logout}>
              <LogOut size={18} />
              {t('layout.logout')}
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
