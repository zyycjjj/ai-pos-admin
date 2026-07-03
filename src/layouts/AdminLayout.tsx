import { LayoutDashboard, LogOut, Megaphone, Package, Sparkles, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '../stores/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/staff', label: 'Staff', Icon: Users },
  { to: '/products', label: 'Products', Icon: Package },
  { to: '/campaigns', label: 'Campaigns', Icon: Megaphone },
  { to: '/ai-center', label: 'AI Center', Icon: Sparkles },
];

export function AdminLayout() {
  const { activeStoreId, logout, role, stores, user } = useAuthStore();
  const store = stores.find((item) => item.storeId === activeStoreId);

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div>
            <strong>AI-POS</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(({ Icon, label, to }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <span className="topbar-label">Current store</span>
            <strong>{store?.storeName ?? 'AI-POS Store'}</strong>
          </div>
          <div className="topbar-user">
            <div>
              <strong>{user?.name ?? user?.email}</strong>
              <span>{role}</span>
            </div>
            <button className="icon-button" type="button" onClick={logout}>
              <LogOut size={18} />
              Logout
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
