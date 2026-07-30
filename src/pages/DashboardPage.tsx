import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { ErrorState, LoadingState } from '../components/PageState';
import { fetchAiBossDashboard, fetchDashboard } from '../services/adminApi';
import { useAdminI18n } from '../i18n';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function DashboardPage() {
  const { t } = useAdminI18n();
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchDashboard });
  const bossQuery = useQuery({ queryKey: ['admin', 'ai-boss-dashboard', { preset: 'last7days' }], queryFn: () => fetchAiBossDashboard({ preset: 'last7days', timezone: 'Asia/Shanghai' }) });

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
      <section className="analytics-panel" style={{ marginTop: 24 }}>
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t('dashboard.aiBossEyebrow')}</span>
            <h2>{t('dashboard.aiBossTitle')}</h2>
          </div>
          <Link className="secondary-button" to="/ai-weekly">{t('dashboard.viewWeekly')}</Link>
        </div>
        {bossQuery.isLoading ? <p className="muted-copy">{t('dashboard.aiBossLoading')}</p> : null}
        {bossQuery.isError ? <p className="muted-copy">{t('dashboard.aiBossError')}</p> : null}
        {bossQuery.data ? (
          <>
            <div className="metric-grid">
              <article className="metric-card">
                <span>{t('dashboard.healthScore')}</span>
                <strong>{bossQuery.data.healthScore}/100</strong>
              </article>
              <article className="metric-card">
                <span>{t('dashboard.netSalesTrend')}</span>
                <strong>{formatTrend(bossQuery.data.trend.netSales.changeRate)}</strong>
              </article>
              <article className="metric-card">
                <span>{t('dashboard.kitchenRisk')}</span>
                <strong>{bossQuery.data.sections.kitchen.overdueTicketCount}</strong>
              </article>
            </div>
            <p className="muted-copy">{bossQuery.data.headline}</p>
            <div className="copilot-layout" style={{ marginTop: 16 }}>
              <MiniList title={t('dashboard.topRisks')} items={bossQuery.data.risks.slice(0, 3)} />
              <MiniList title={t('dashboard.nextActions')} items={bossQuery.data.nextActions.slice(0, 3)} />
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}

function MiniList({ items, title }: { title: string; items: Array<{ text: string }> }) {
  return (
    <section>
      <h3>{title}</h3>
      <div className="copilot-list">
        {items.map((item, index) => (
          <div className="analytics-list-row" key={`${title}-${index}`}>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatTrend(value: number) {
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}
