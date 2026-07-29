import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { createAiCampaignDraft, fetchAiBusinessDaily, fetchAiRecommendations, type AiBusinessDailyFilters } from '../services/adminApi';
import type { AiBusinessDailyEvidence, AiBusinessDailyRecommendation } from '../types/admin';

const presets: Array<[NonNullable<AiBusinessDailyFilters['preset']>, string]> = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['last7days', 'Last 7 days'],
  ['custom', 'Custom'],
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function AiDailyPage() {
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState<NonNullable<AiBusinessDailyFilters['preset']>>('today');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const filters = useMemo<AiBusinessDailyFilters>(() => ({
    preset,
    from: preset === 'custom' ? from : undefined,
    to: preset === 'custom' ? to : undefined,
    timezone: 'Asia/Shanghai',
  }), [from, preset, to]);
  const query = useQuery({ queryKey: ['admin', 'ai-business-daily', filters], queryFn: () => fetchAiBusinessDaily(filters) });
  const recommendationsQuery = useQuery({ queryKey: ['admin', 'ai-campaign-recommendations', filters], queryFn: () => fetchAiRecommendations(filters) });
  const draftMutation = useMutation({
    mutationFn: createAiCampaignDraft,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-business-daily'] });
    },
  });

  if (query.isLoading) return <LoadingState title="Generating AI Daily" />;
  if (query.isError || !query.data) return <ErrorState title="AI Daily unavailable" description="Reports and Analytics remain available. Try again after checking the API connection." />;

  const report = query.data;
  const recommendationResponse = recommendationsQuery.data;
  const recommendations = recommendationResponse?.items ?? report.recommendations;
  const evidence = recommendationResponse?.evidence ?? report.evidence;
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const cards = [
    ['Net sales', money.format(report.metrics.sales.netSales)],
    ['Orders', String(report.metrics.sales.orderCount)],
    ['Refunds', money.format(report.metrics.sales.refundTotal)],
    ['Discounts', money.format(report.metrics.sales.discountTotal)],
    ['Kitchen overdue', String(report.metrics.kitchen.overdueTicketCount)],
    ['Approvals', String(report.metrics.refundApproval.managerApprovalCount)],
  ];

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">AI Operations · {report.range.timezone}</span>
          <h1>AI Business Daily</h1>
        </div>
        <span className="analytics-period">{report.range.from} — {report.range.to} · {report.fallback ? 'Fallback' : report.generatedBy} · {new Date(report.generatedAt).toLocaleString()}</span>
      </div>

      <div className="analytics-filter-bar">
        <div className="segmented-control">
          {presets.map(([value, label]) => <button className={preset === value ? 'active' : ''} key={value} type="button" onClick={() => setPreset(value)}>{label}</button>)}
        </div>
        {preset === 'custom' ? (
          <>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </>
        ) : null}
      </div>

      <div className="metrics-grid">
        {cards.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="copilot-layout">
        <section className="copilot-main">
          <section className="analytics-panel">
            <div className="panel-header"><h2>Summary</h2></div>
            <p className="muted-copy">{report.summary.text}</p>
            <EvidenceRefs ids={report.summary.evidenceIds} evidenceById={evidenceById} />
          </section>

          <SectionList title="Highlights" items={report.highlights} evidenceById={evidenceById} />
          <SectionList title="Risks" items={report.risks} evidenceById={evidenceById} />

          <section className="analytics-panel">
            <div className="panel-header"><h2>Recommendations</h2></div>
            {recommendations.length === 0 ? <EmptyState title="No recommendations" description="There is not enough evidence to propose a safe action." /> : null}
            <div className="copilot-list">
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  filters={filters}
                  recommendation={recommendation}
                  evidenceById={evidenceById}
                  onCreateDraft={(adjustments) => draftMutation.mutate({
                    recommendationId: recommendation.id,
                    recommendationType: recommendation.type as AiBusinessDailyFilters['type'],
                    preset: filters.preset,
                    from: filters.from,
                    to: filters.to,
                    timezone: filters.timezone,
                    adjustments,
                  })}
                  saving={draftMutation.isPending}
                />
              ))}
            </div>
          </section>
        </section>

        <aside className="copilot-side">
          <section className="analytics-panel">
            <div className="panel-header"><h2>Evidence</h2></div>
            {evidence.map((item) => <EvidenceRow item={item} key={item.id} />)}
          </section>
        </aside>
      </div>
    </section>
  );
}

function SectionList({ evidenceById, items, title }: { title: string; items: Array<{ text: string; evidenceIds: string[] }>; evidenceById: Map<string, AiBusinessDailyEvidence> }) {
  return (
    <section className="analytics-panel">
      <div className="panel-header"><h2>{title}</h2></div>
      <div className="copilot-list">
        {items.map((item, index) => (
          <div className="analytics-list-row" key={`${title}-${index}`}>
            <span><strong>{item.text}</strong><EvidenceRefs ids={item.evidenceIds} evidenceById={evidenceById} /></span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({
  evidenceById,
  filters,
  onCreateDraft,
  recommendation,
  saving,
}: {
  recommendation: AiBusinessDailyRecommendation;
  evidenceById: Map<string, AiBusinessDailyEvidence>;
  filters: AiBusinessDailyFilters;
  saving: boolean;
  onCreateDraft: (adjustments: { title?: string; discountValue?: number; threshold?: number; durationDays?: number }) => void;
}) {
  const [title, setTitle] = useState(recommendation.title);
  const [discountValue, setDiscountValue] = useState(recommendation.offer?.discountValue ?? 5);
  const [threshold, setThreshold] = useState(recommendation.offer?.threshold ?? 0);
  const [durationDays, setDurationDays] = useState(recommendation.offer?.suggestedDurationDays ?? 7);
  return (
    <article className="copilot-response">
      <div className="panel-header">
        <div>
          <span className={`status ${recommendation.priority.toLowerCase()}`}>{recommendation.priority}</span>
          <h2>{recommendation.title}</h2>
        </div>
        {recommendation.action.kind === 'CREATE_CAMPAIGN_DRAFT' ? (
          <button className="primary-button" disabled={saving} type="button" onClick={() => onCreateDraft({ title, discountValue, threshold: threshold || undefined, durationDays })}>Create Draft</button>
        ) : null}
      </div>
      <small>{recommendation.type} · {filters.preset ?? 'today'}</small>
      <p>{recommendation.reason}</p>
      {recommendation.target ? <p><strong>Target:</strong> {recommendation.target.label}{recommendation.target.estimatedCustomerCount !== undefined ? ` · ${recommendation.target.estimatedCustomerCount} customers` : ''}</p> : null}
      {recommendation.offer ? <p><strong>Offer:</strong> {recommendation.offer.campaignType} · {formatOffer(recommendation.offer)}</p> : null}
      {recommendation.expectedImpact ? <p><strong>Expected impact:</strong> {recommendation.expectedImpact.label} · {recommendation.expectedImpact.description}</p> : null}
      {recommendation.action.kind === 'CREATE_CAMPAIGN_DRAFT' ? (
        <div className="form-grid compact-grid">
          <label>Draft title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Discount<input type="number" min="0" value={discountValue} onChange={(event) => setDiscountValue(Number(event.target.value) || 0)} /></label>
          <label>Threshold<input type="number" min="0" value={threshold || ''} onChange={(event) => setThreshold(Number(event.target.value) || 0)} /></label>
          <label>Duration days<input type="number" min="1" max="30" value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value) || 7)} /></label>
        </div>
      ) : null}
      <EvidenceRefs ids={recommendation.evidenceIds} evidenceById={evidenceById} />
    </article>
  );
}

function formatOffer(offer: NonNullable<AiBusinessDailyRecommendation['offer']>) {
  const discount = offer.discountValue !== undefined ? `${offer.discountValue}${offer.discountType === 'percentage' ? '%' : ''}` : 'review';
  const threshold = offer.threshold ? ` over ${money.format(offer.threshold)}` : '';
  const duration = `${offer.suggestedDurationDays} days`;
  return `${discount}${threshold} · ${duration}${offer.timeWindow ? ` · ${offer.timeWindow}` : ''}`;
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
