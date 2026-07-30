import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { ErrorState, LoadingState } from '../components/PageState';
import { createAiAction, fetchAiBossDashboard, fetchDashboard } from '../services/adminApi';
import { useAdminI18n } from '../i18n';
import type { AiActionPriority, AiActionTargetType, AiActionType, AiBossSection, AiBusinessDailyEvidence } from '../types/admin';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { t } = useAdminI18n();
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchDashboard });
  const bossQuery = useQuery({ queryKey: ['admin', 'ai-boss-dashboard', { preset: 'last7days' }], queryFn: () => fetchAiBossDashboard({ preset: 'last7days', timezone: 'Asia/Shanghai' }) });
  const saveActionMutation = useMutation({
    mutationFn: createAiAction,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-actions'] }),
  });

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
  const bossEvidenceById = new Map((bossQuery.data?.evidence ?? []).map((item) => [item.id, item]));

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
              <MiniList
                title={t('dashboard.topRisks')}
                items={bossQuery.data.risks.slice(0, 3)}
                onSave={(item) => saveActionMutation.mutate(sectionAction('Top risks', item, bossEvidenceById, { range: bossQuery.data.range, headline: bossQuery.data.headline }))}
                saving={saveActionMutation.isPending}
              />
              <MiniList
                title={t('dashboard.nextActions')}
                items={bossQuery.data.nextActions.slice(0, 3)}
                onSave={(item) => saveActionMutation.mutate(sectionAction('Next actions', item, bossEvidenceById, { range: bossQuery.data.range, headline: bossQuery.data.headline }))}
                saving={saveActionMutation.isPending}
              />
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}

function MiniList({ items, onSave, saving, title }: { title: string; items: AiBossSection[]; saving?: boolean; onSave?: (item: AiBossSection) => void }) {
  return (
    <section>
      <h3>{title}</h3>
      <div className="copilot-list">
        {items.map((item, index) => (
          <div className="analytics-list-row" key={`${title}-${index}`}>
            <span>{item.text}</span>
            {onSave ? <button className="secondary-button" disabled={saving || item.evidenceIds.length === 0} type="button" onClick={() => onSave(item)}>Save</button> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function sectionAction(
  sourceTitle: string,
  item: AiBossSection,
  evidenceById: Map<string, AiBusinessDailyEvidence>,
  payload: Record<string, unknown>,
) {
  const actionType = inferActionType(item.text);
  const evidenceSnapshot = item.evidenceIds.map((id) => evidenceById.get(id)).filter((evidence): evidence is AiBusinessDailyEvidence => Boolean(evidence));
  return {
    sourceType: 'AI_BOSS_DASHBOARD' as const,
    sourceTitle,
    actionType,
    priority: inferPriority(item.text, actionType),
    title: item.text.slice(0, 140),
    description: item.text,
    reason: sourceTitle,
    targetType: targetTypeFor(actionType),
    targetUrl: targetUrlFor(actionType),
    payload: { ...payload, sectionText: item.text },
    evidenceSnapshot,
  };
}

function inferActionType(text: string): AiActionType {
  const lower = text.toLowerCase();
  if (lower.includes('campaign') || text.includes('活动') || text.includes('促销')) return 'CREATE_CAMPAIGN_DRAFT';
  if (lower.includes('kitchen') || text.includes('后厨') || text.includes('档口')) return 'REVIEW_KITCHEN_OVERDUE';
  if (lower.includes('refund') || text.includes('退款')) return 'REVIEW_REFUND';
  if (lower.includes('discount') || text.includes('折扣')) return 'REVIEW_DISCOUNT';
  if (lower.includes('customer') || text.includes('顾客') || text.includes('召回')) return 'REVIEW_CUSTOMER_REACTIVATION';
  if (lower.includes('product') || text.includes('商品')) return 'VIEW_PRODUCT';
  return 'VIEW_REPORT';
}

function inferPriority(text: string, actionType: AiActionType): AiActionPriority {
  const lower = text.toLowerCase();
  if (actionType.startsWith('REVIEW_') || lower.includes('risk') || text.includes('风险')) return 'HIGH';
  if (actionType === 'CREATE_CAMPAIGN_DRAFT') return 'MEDIUM';
  return 'LOW';
}

function targetTypeFor(actionType: AiActionType): AiActionTargetType {
  if (actionType === 'CREATE_CAMPAIGN_DRAFT' || actionType === 'VIEW_CAMPAIGN') return 'CAMPAIGN';
  if (actionType === 'REVIEW_KITCHEN_OVERDUE' || actionType === 'VIEW_KITCHEN') return 'KITCHEN_STATION';
  if (actionType === 'REVIEW_CUSTOMER_REACTIVATION' || actionType === 'VIEW_CUSTOMER') return 'CUSTOMER';
  if (actionType === 'VIEW_PRODUCT') return 'PRODUCT';
  return 'REPORT';
}

function targetUrlFor(actionType: AiActionType) {
  if (actionType === 'CREATE_CAMPAIGN_DRAFT' || actionType === 'VIEW_CAMPAIGN') return '/campaigns';
  if (actionType === 'REVIEW_KITCHEN_OVERDUE' || actionType === 'VIEW_KITCHEN') return '/kitchen';
  if (actionType === 'REVIEW_CUSTOMER_REACTIVATION' || actionType === 'VIEW_CUSTOMER') return '/customers';
  if (actionType === 'VIEW_PRODUCT') return '/products';
  return '/reports';
}

function formatTrend(value: number) {
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}
