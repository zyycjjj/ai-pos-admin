import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { createAiCampaignDraft, fetchAiBusinessDaily, type AiBusinessDailyFilters } from '../services/adminApi';
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
  const evidenceById = new Map(report.evidence.map((item) => [item.id, item]));
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
            {report.recommendations.length === 0 ? <EmptyState title="No recommendations" description="There is not enough evidence to propose a safe action." /> : null}
            <div className="copilot-list">
              {report.recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  evidenceById={evidenceById}
                  onCreateDraft={() => draftMutation.mutate({
                    id: recommendation.id,
                    type: recommendation.type,
                    title: recommendation.title,
                    reason: recommendation.reason,
                    campaignTemplate: recommendation.action.campaignTemplate,
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
            {report.evidence.map((item) => <EvidenceRow item={item} key={item.id} />)}
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

function RecommendationCard({ evidenceById, onCreateDraft, recommendation, saving }: { recommendation: AiBusinessDailyRecommendation; evidenceById: Map<string, AiBusinessDailyEvidence>; saving: boolean; onCreateDraft: () => void }) {
  return (
    <article className="copilot-response">
      <div className="panel-header">
        <div>
          <span className={`status ${recommendation.priority.toLowerCase()}`}>{recommendation.priority}</span>
          <h2>{recommendation.title}</h2>
        </div>
        {recommendation.action.kind === 'CREATE_CAMPAIGN_DRAFT' ? (
          <button className="primary-button" disabled={saving} type="button" onClick={onCreateDraft}>Create Draft</button>
        ) : null}
      </div>
      <p>{recommendation.reason}</p>
      <EvidenceRefs ids={recommendation.evidenceIds} evidenceById={evidenceById} />
    </article>
  );
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
