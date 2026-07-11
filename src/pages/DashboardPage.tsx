import { useQuery } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '../components/PageState';
import { fetchDashboard } from '../services/adminApi';
import { useAdminI18n } from '../i18n';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function DashboardPage() {
  const { t } = useAdminI18n();
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchDashboard });

  if (query.isLoading) {
    return <LoadingState title={t('dashboard.loading')} />;
  }
  if (query.isError || !query.data) {
    return <ErrorState title={t('dashboard.errorTitle')} description={t('common.errorDescription')} />;
  }

  const cards = [
    { label: t('dashboard.todaySales'), value: money.format(query.data.todaySales) },
    { label: t('dashboard.ordersCount'), value: String(query.data.ordersCount) },
    { label: t('dashboard.avgTicket'), value: money.format(query.data.avgTicket) },
    { label: t('dashboard.activeProducts'), value: String(query.data.activeProducts) },
  ];

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">{t('dashboard.eyebrow')}</span>
        <h1>{t('dashboard.title')}</h1>
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
