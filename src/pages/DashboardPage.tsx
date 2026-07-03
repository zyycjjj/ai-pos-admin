import { useQuery } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '../components/PageState';
import { fetchDashboard } from '../services/adminApi';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function DashboardPage() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchDashboard });

  if (query.isLoading) {
    return <LoadingState title="Loading dashboard" />;
  }
  if (query.isError || !query.data) {
    return <ErrorState title="Dashboard unavailable" description="Check the backend connection and try again." />;
  }

  const cards = [
    { label: 'Today Sales', value: money.format(query.data.todaySales) },
    { label: 'Orders Count', value: String(query.data.ordersCount) },
    { label: 'Avg Ticket', value: money.format(query.data.avgTicket) },
    { label: 'Active Products', value: String(query.data.activeProducts) },
  ];

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">Store overview</span>
        <h1>Dashboard</h1>
      </div>
      <div className="metric-grid">
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
