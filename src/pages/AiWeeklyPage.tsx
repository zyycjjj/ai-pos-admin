import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { createAiAction, fetchAiBossDashboard, fetchAiWeeklyInsight } from '../services/adminApi';
import type { AiActionPriority, AiActionTargetType, AiActionType, AiBossSection, AiBusinessDailyEvidence, AiTrendComparison } from '../types/admin';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function AiWeeklyPage() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(defaultWeekStart());
  const filters = useMemo(() => ({ weekStart, timezone: 'Asia/Shanghai' }), [weekStart]);
  const weeklyQuery = useQuery({ queryKey: ['admin', 'ai-weekly-insight', filters], queryFn: () => fetchAiWeeklyInsight(filters) });
  const dashboardQuery = useQuery({ queryKey: ['admin', 'ai-boss-dashboard', { preset: 'last7days' }], queryFn: () => fetchAiBossDashboard({ preset: 'last7days', timezone: 'Asia/Shanghai' }) });
  const saveActionMutation = useMutation({
    mutationFn: createAiAction,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-actions'] }),
  });

  if (weeklyQuery.isLoading) return <LoadingState title="Generating AI Weekly Insight" />;
  if (weeklyQuery.isError || !weeklyQuery.data) return <ErrorState title="AI Weekly unavailable" description="The weekly insight could not be generated. No business data was changed." />;

  const report = weeklyQuery.data;
  const dashboard = dashboardQuery.data;
  const evidenceById = new Map(report.evidence.map((item) => [item.id, item]));
  const trendCards = dashboard ? [
    ['Net sales', money.format(dashboard.trend.netSales.current), dashboard.trend.netSales],
    ['Orders', String(dashboard.trend.orderCount.current), dashboard.trend.orderCount],
    ['AOV', money.format(dashboard.trend.averageOrderValue.current), dashboard.trend.averageOrderValue],
    ['Refunds', money.format(dashboard.trend.refundTotal.current), dashboard.trend.refundTotal],
    ['Kitchen overdue', `${Math.round(dashboard.trend.kitchenOverdueRate.current * 100)}%`, dashboard.trend.kitchenOverdueRate],
    ['Approvals', String(dashboard.trend.managerApprovalCount.current), dashboard.trend.managerApprovalCount],
  ] as const : [];

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">AI Operations · {report.week.timezone}</span>
          <h1>AI Weekly Insight</h1>
        </div>
        <span className="analytics-period">{report.week.start} — {report.week.end} · {report.fallback ? 'Fallback' : 'AI'} · {new Date(report.generatedAt).toLocaleString()}</span>
      </div>

      <div className="analytics-filter-bar">
        <label>Week start<input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} /></label>
      </div>

      <section className="analytics-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Boss conclusion</span>
            <h2>{dashboard ? `${dashboard.healthScore}/100` : 'Weekly summary'}</h2>
          </div>
        </div>
        <p className="muted-copy">{report.headline}</p>
      </section>

      {trendCards.length > 0 ? (
        <div className="metrics-grid">
          {trendCards.map(([label, value, trend]) => (
            <article className="metric-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{formatTrend(trend)}</small>
            </article>
          ))}
        </div>
      ) : null}

      <div className="copilot-layout">
        <section className="copilot-main">
          <SectionList title="Summary" items={report.summary} evidenceById={evidenceById} />
          <SectionList title="Highlights" items={report.highlights} evidenceById={evidenceById} />
          <SectionList title="Risks" items={report.risks} evidenceById={evidenceById} />
          <SectionList title="Trend explanations" items={report.trendExplanations} evidenceById={evidenceById} />
          <SectionList
            title="Next week actions"
            items={report.nextWeekActions}
            evidenceById={evidenceById}
            onSave={(item) => saveActionMutation.mutate(sectionAction('AI_WEEKLY', 'Next week actions', item, evidenceById, { week: report.week, headline: report.headline }))}
            saving={saveActionMutation.isPending}
          />
          <SectionList
            title="Campaign suggestions"
            items={report.campaignSuggestions}
            evidenceById={evidenceById}
            onSave={(item) => saveActionMutation.mutate(sectionAction('AI_WEEKLY', 'Campaign suggestions', item, evidenceById, { week: report.week, headline: report.headline }, 'CREATE_CAMPAIGN_DRAFT'))}
            saving={saveActionMutation.isPending}
          />
        </section>

        <aside className="copilot-side">
          <section className="analytics-panel">
            <div className="panel-header"><h2>Evidence</h2></div>
            {report.evidence.length === 0 ? <EmptyState title="No evidence" description="There is not enough data to explain this week." /> : null}
            {report.evidence.map((item) => <EvidenceRow item={item} key={item.id} />)}
          </section>
        </aside>
      </div>
    </section>
  );
}

function SectionList({
  evidenceById,
  items,
  onSave,
  saving,
  title,
}: {
  title: string;
  items: AiBossSection[];
  evidenceById: Map<string, AiBusinessDailyEvidence>;
  saving?: boolean;
  onSave?: (item: AiBossSection) => void;
}) {
  return (
    <section className="analytics-panel">
      <div className="panel-header"><h2>{title}</h2></div>
      <div className="copilot-list">
        {items.map((item, index) => (
          <div className="analytics-list-row" key={`${title}-${index}`}>
            <span><strong>{item.text}</strong><EvidenceRefs ids={item.evidenceIds} evidenceById={evidenceById} /></span>
            {onSave ? <button className="secondary-button" disabled={saving || item.evidenceIds.length === 0} type="button" onClick={() => onSave(item)}>Save Action</button> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function sectionAction(
  sourceType: 'AI_WEEKLY' | 'AI_BOSS_DASHBOARD',
  sourceTitle: string,
  item: AiBossSection,
  evidenceById: Map<string, AiBusinessDailyEvidence>,
  payload: Record<string, unknown>,
  forcedActionType?: AiActionType,
) {
  const actionType = forcedActionType ?? inferSectionActionType(item.text);
  const evidenceSnapshot = item.evidenceIds.map((id) => evidenceById.get(id)).filter((evidence): evidence is AiBusinessDailyEvidence => Boolean(evidence));
  return {
    sourceType,
    sourceTitle,
    actionType,
    priority: inferSectionPriority(item.text, actionType),
    title: item.text.slice(0, 140),
    description: item.text,
    reason: sourceTitle,
    targetType: targetTypeFor(actionType),
    targetUrl: targetUrlFor(actionType),
    payload: { ...payload, sectionText: item.text },
    evidenceSnapshot,
  };
}

function inferSectionActionType(text: string): AiActionType {
  const lower = text.toLowerCase();
  if (lower.includes('campaign') || text.includes('活动') || text.includes('促销')) return 'CREATE_CAMPAIGN_DRAFT';
  if (lower.includes('kitchen') || text.includes('后厨') || text.includes('档口')) return 'REVIEW_KITCHEN_OVERDUE';
  if (lower.includes('refund') || text.includes('退款')) return 'REVIEW_REFUND';
  if (lower.includes('discount') || text.includes('折扣')) return 'REVIEW_DISCOUNT';
  if (lower.includes('customer') || text.includes('顾客') || text.includes('召回')) return 'REVIEW_CUSTOMER_REACTIVATION';
  if (lower.includes('product') || text.includes('商品')) return 'VIEW_PRODUCT';
  return 'VIEW_REPORT';
}

function inferSectionPriority(text: string, actionType: AiActionType): AiActionPriority {
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

function EvidenceRefs({ evidenceById, ids }: { ids: string[]; evidenceById: Map<string, AiBusinessDailyEvidence> }) {
  return <small>{ids.map((id) => evidenceById.get(id)?.title ?? id).join(' · ')}</small>;
}

function EvidenceRow({ item }: { item: AiBusinessDailyEvidence }) {
  return (
    <div className="analytics-list-row">
      <span><strong>{item.title}</strong><small>{item.id} · {item.type}</small></span>
      <span>{typeof item.value === 'number' ? item.value.toFixed(2) : item.value ?? '-'}</span>
    </div>
  );
}

function formatTrend(trend: AiTrendComparison) {
  const value = trend.changeRate === 0 ? '0%' : `${trend.changeRate > 0 ? '+' : ''}${trend.changeRate.toFixed(1)}%`;
  return `${trend.direction} · ${value}`;
}

function defaultWeekStart() {
  const date = new Date();
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}
