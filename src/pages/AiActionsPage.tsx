import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { createCampaignDraftFromAiAction, fetchAiActions, updateAiActionStatus, type AiActionFilters } from '../services/adminApi';
import type { AiActionItem, AiActionPriority, AiActionSourceType, AiActionStatus, AiActionType } from '../types/admin';

const statusOptions: Array<AiActionStatus | ''> = ['', 'OPEN', 'DONE', 'DISMISSED'];
const priorityOptions: Array<AiActionPriority | ''> = ['', 'HIGH', 'MEDIUM', 'LOW'];
const sourceOptions: Array<AiActionSourceType | ''> = ['', 'AI_ASK', 'AI_WEEKLY', 'AI_BOSS_DASHBOARD', 'AI_DAILY', 'AI_CAMPAIGN_RECOMMENDATION', 'MANUAL'];
const actionOptions: Array<AiActionType | ''> = ['', 'VIEW_REPORT', 'VIEW_PRODUCT', 'VIEW_CUSTOMER', 'VIEW_CAMPAIGN', 'VIEW_KITCHEN', 'VIEW_TABLE', 'CREATE_CAMPAIGN_DRAFT', 'REVIEW_REFUND', 'REVIEW_DISCOUNT', 'REVIEW_KITCHEN_OVERDUE', 'REVIEW_CUSTOMER_REACTIVATION', 'MANUAL_NOTE'];

export function AiActionsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AiActionFilters>({ status: 'OPEN', take: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['admin', 'ai-actions', filters], queryFn: () => fetchAiActions(filters) });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AiActionStatus }) => updateAiActionStatus(id, { status, note: status === 'DONE' ? 'Handled from AI Actions workspace.' : 'Updated from AI Actions workspace.' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-actions'] }),
  });
  const draftMutation = useMutation({
    mutationFn: createCampaignDraftFromAiAction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-actions'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });

  const items = query.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const summary = query.data?.summary;
  const cards = [
    ['Open', summary?.open ?? 0],
    ['High priority', summary?.high ?? 0],
    ['Done', summary?.done ?? 0],
    ['Dismissed', summary?.dismissed ?? 0],
  ];

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">AI Operations · Action Workspace</span>
          <h1>AI Actions</h1>
        </div>
        <span className="analytics-period">Owner reviewed · Evidence snapshot required</span>
      </div>

      <div className="metrics-grid">
        {cards.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <section className="analytics-panel">
        <div className="analytics-filter-bar">
          <FilterSelect label="Status" value={filters.status ?? ''} options={statusOptions} onChange={(status) => setFilters((current) => ({ ...current, status: status as AiActionStatus | '' }))} />
          <FilterSelect label="Priority" value={filters.priority ?? ''} options={priorityOptions} onChange={(priority) => setFilters((current) => ({ ...current, priority: priority as AiActionPriority | '' }))} />
          <FilterSelect label="Source" value={filters.sourceType ?? ''} options={sourceOptions} onChange={(sourceType) => setFilters((current) => ({ ...current, sourceType: sourceType as AiActionSourceType | '' }))} />
          <FilterSelect label="Action" value={filters.actionType ?? ''} options={actionOptions} onChange={(actionType) => setFilters((current) => ({ ...current, actionType: actionType as AiActionType | '' }))} />
        </div>
      </section>

      {query.isLoading ? <LoadingState title="Loading AI Actions" /> : null}
      {query.isError ? <ErrorState title="AI Actions unavailable" description="The action workspace could not be loaded." /> : null}

      <div className="copilot-layout">
        <section className="copilot-main">
          {items.length === 0 && !query.isLoading ? <EmptyState title="No AI actions" description="Save suggested actions from AI Ask or AI Weekly to build a manager action queue." /> : null}
          <div className="copilot-list">
            {items.map((item) => (
              <ActionCard
                item={item}
                key={item.id}
                onCreateDraft={() => draftMutation.mutate(item.id)}
                onSelect={() => setSelectedId(item.id)}
                onStatus={(status) => statusMutation.mutate({ id: item.id, status })}
                selected={selected?.id === item.id}
                working={statusMutation.isPending || draftMutation.isPending}
              />
            ))}
          </div>
        </section>

        <aside className="copilot-side">
          <section className="analytics-panel">
            <div className="panel-header"><h2>Evidence Snapshot</h2></div>
            {selected ? <EvidencePanel item={selected} /> : <p className="muted-copy">Select an action to inspect the saved evidence.</p>}
          </section>
        </aside>
      </div>
    </section>
  );
}

function ActionCard({ item, onCreateDraft, onSelect, onStatus, selected, working }: {
  item: AiActionItem;
  selected: boolean;
  working: boolean;
  onSelect: () => void;
  onStatus: (status: AiActionStatus) => void;
  onCreateDraft: () => void;
}) {
  return (
    <article className="copilot-response">
      <div className="panel-header">
        <div>
          <span className={`status ${item.priority.toLowerCase()}`}>{item.priority}</span>
          <h2>{item.title}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onSelect}>{selected ? 'Selected' : 'Evidence'}</button>
      </div>
      <small>{item.status} · {item.actionType} · {item.sourceType} · {new Date(item.createdAt).toLocaleString()}</small>
      {item.reason ? <p>{item.reason}</p> : null}
      {item.description ? <p className="muted-copy">{item.description}</p> : null}
      <div className="segmented-control">
        {item.targetUrl ? <Link className="secondary-button" to={item.targetUrl}>Open target</Link> : null}
        {item.actionType === 'CREATE_CAMPAIGN_DRAFT' && item.status === 'OPEN' ? <button className="primary-button" disabled={working} type="button" onClick={onCreateDraft}>Create Campaign Draft</button> : null}
        {item.status === 'OPEN' ? <button className="secondary-button" disabled={working} type="button" onClick={() => onStatus('DONE')}>Mark Done</button> : null}
        {item.status === 'OPEN' ? <button className="secondary-button" disabled={working} type="button" onClick={() => onStatus('DISMISSED')}>Dismiss</button> : null}
        {item.status !== 'OPEN' ? <button className="secondary-button" disabled={working} type="button" onClick={() => onStatus('OPEN')}>Reopen</button> : null}
      </div>
    </article>
  );
}

function EvidencePanel({ item }: { item: AiActionItem }) {
  const result = useMemo(() => JSON.stringify(item.result ?? {}, null, 2), [item.result]);
  return (
    <div className="copilot-list">
      <div className="analytics-list-row">
        <span><strong>{item.sourceTitle ?? item.sourceType}</strong><small>{item.targetType} · {item.targetUrl ?? 'No target URL'}</small></span>
      </div>
      {item.evidenceSnapshot.map((evidence) => (
        <div className="analytics-list-row" key={evidence.id}>
          <span><strong>{evidence.title}</strong><small>{evidence.id} · {evidence.type}</small></span>
          <span>{typeof evidence.value === 'number' ? evidence.value.toFixed(2) : evidence.value ?? '-'}</span>
        </div>
      ))}
      {item.evidenceSnapshot.length === 0 ? <p className="muted-copy">Manual action without AI evidence.</p> : null}
      {item.handledAt ? <p className="muted-copy">Handled at {new Date(item.handledAt).toLocaleString()}</p> : null}
      {item.dismissReason ? <p className="muted-copy">Dismiss reason: {item.dismissReason}</p> : null}
      {item.result ? <pre className="code-block">{result}</pre> : null}
    </div>
  );
}

function FilterSelect({ label, onChange, options, value }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>{label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option || 'ALL'} value={option}>{option || 'ALL'}</option>)}
      </select>
    </label>
  );
}
