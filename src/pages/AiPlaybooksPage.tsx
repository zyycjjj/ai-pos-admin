import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { createAiAction, createCampaignDraftFromAiAction, fetchAiPlaybookRuns, fetchAiPlaybooks, runAiPlaybook, type AiBusinessDailyFilters } from '../services/adminApi';
import type { AiBusinessDailyEvidence, AiPlaybookCard, AiPlaybookResult } from '../types/admin';

const presets: Array<[NonNullable<AiBusinessDailyFilters['preset']>, string]> = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['last7days', 'Last 7 days'],
  ['custom', 'Custom'],
];

export function AiPlaybooksPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [result, setResult] = useState<AiPlaybookResult | null>(null);
  const [preset, setPreset] = useState<NonNullable<AiBusinessDailyFilters['preset']>>('today');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const filters = useMemo(() => ({ preset, from: preset === 'custom' ? from : undefined, to: preset === 'custom' ? to : undefined, timezone: 'Asia/Shanghai' }), [from, preset, to]);
  const playbooksQuery = useQuery({ queryKey: ['admin', 'ai-playbooks'], queryFn: fetchAiPlaybooks });
  const runsQuery = useQuery({ queryKey: ['admin', 'ai-playbook-runs'], queryFn: fetchAiPlaybookRuns });
  const runMutation = useMutation({
    mutationFn: (type: string) => runAiPlaybook(type, filters),
    onSuccess: (data) => {
      setResult(data);
      setSelectedType(data.type);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-playbook-runs'] });
    },
  });
  const saveActionMutation = useMutation({
    mutationFn: createAiAction,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-actions'] }),
  });
  const draftMutation = useMutation({
    mutationFn: async ({ result, actionIndex }: { result: AiPlaybookResult; actionIndex: number }) => {
      const saved = await createAiAction(actionInput(result, result.recommendedActions[actionIndex]));
      return createCampaignDraftFromAiAction(saved.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-actions'] });
    },
  });

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">AI Operations · Scenario playbooks</span>
          <h1>AI Playbooks</h1>
        </div>
        <span className="analytics-period">{preset === 'custom' ? `${from} - ${to}` : preset}</span>
      </div>

      <div className="copilot-layout">
        <aside className="copilot-side">
          <section className="analytics-panel">
            <div className="panel-header"><h2>Range</h2></div>
            <div className="segmented-control">
              {presets.map(([value, label]) => <button className={preset === value ? 'active' : ''} key={value} type="button" onClick={() => setPreset(value)}>{label}</button>)}
            </div>
            {preset === 'custom' ? (
              <div className="form-grid compact-grid">
                <label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
                <label>To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
              </div>
            ) : null}
          </section>

          <section className="analytics-panel">
            <div className="panel-header"><h2>Recent runs</h2></div>
            {runsQuery.isLoading ? <p className="muted-copy">Loading runs...</p> : null}
            <div className="copilot-list">
              {(runsQuery.data?.items ?? []).map((item) => (
                <button className={`analytics-list-row ${result?.runId === item.id ? 'active' : ''}`} key={item.id} type="button" onClick={() => setResult(null)}>
                  <span><strong>{item.title}</strong><small>{item.status} · {new Date(item.createdAt).toLocaleString()}</small></span>
                </button>
              ))}
            </div>
            {runsQuery.data?.items.length === 0 ? <p className="muted-copy">No playbook run yet.</p> : null}
          </section>
        </aside>

        <section className="copilot-main">
          <section className="analytics-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">One-click diagnosis</span>
                <h2>Playbook library</h2>
              </div>
            </div>
            {playbooksQuery.isLoading ? <LoadingState title="Loading AI Playbooks" /> : null}
            {playbooksQuery.isError ? <ErrorState title="AI Playbooks unavailable" description="Scenario playbooks could not be loaded." /> : null}
            <div className="analytics-grid">
              {(playbooksQuery.data?.items ?? []).map((playbook) => (
                <PlaybookCard
                  key={playbook.type}
                  playbook={playbook}
                  active={selectedType === playbook.type}
                  loading={runMutation.isPending && selectedType === playbook.type}
                  onRun={() => {
                    setSelectedType(playbook.type);
                    runMutation.mutate(playbook.type);
                  }}
                />
              ))}
            </div>
          </section>

          {runMutation.isError ? <ErrorState title="Playbook run failed" description="The diagnosis could not be generated. Business data was not changed." /> : null}
          {result ? (
            <PlaybookResultView
              result={result}
              onSave={(index) => saveActionMutation.mutate(actionInput(result, result.recommendedActions[index]))}
              onDraft={(index) => draftMutation.mutate({ result, actionIndex: index })}
              working={saveActionMutation.isPending || draftMutation.isPending}
            />
          ) : <EmptyState title="Run a scenario playbook" description="Choose a scenario above to generate step-by-step findings, evidence, and manager actions." />}
        </section>
      </div>
    </section>
  );
}

function PlaybookCard({ active, loading, onRun, playbook }: { playbook: AiPlaybookCard; active: boolean; loading: boolean; onRun: () => void }) {
  return (
    <article className={`analytics-card ${active ? 'active' : ''}`}>
      <div className="panel-header">
        <span className="status active">{playbook.category}</span>
        <span>{playbook.estimatedMinutes} min</span>
      </div>
      <h3>{playbook.title}</h3>
      <p className="muted-copy">{playbook.description}</p>
      <button className="primary-button" disabled={!playbook.enabled || loading} type="button" onClick={onRun}>{loading ? 'Running...' : 'Run playbook'}</button>
    </article>
  );
}

function PlaybookResultView({ result, onDraft, onSave, working }: { result: AiPlaybookResult; working: boolean; onSave: (index: number) => void; onDraft: (index: number) => void }) {
  const evidenceById = new Map(result.evidence.map((item) => [item.id, item]));
  return (
    <section className="analytics-panel">
      <div className="panel-header">
        <div>
          <span className={`status ${result.summary.status === 'RISK' ? 'danger' : result.summary.status === 'GOOD' ? 'success' : 'active'}`}>{result.summary.status}</span>
          <h2>{result.summary.headline}</h2>
        </div>
        <span className="analytics-period">{result.range.from} - {result.range.to} · {result.fallback ? 'Fallback' : 'AI'}</span>
      </div>

      <div className="copilot-list">
        {result.steps.map((step) => (
          <div className="analytics-list-row" key={step.id}>
            <span><strong>{step.title}</strong><small>{step.status} · {step.finding}</small><EvidenceRefs evidenceById={evidenceById} ids={step.evidenceIds} /></span>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <section>
          <h3>Findings</h3>
          {result.findings.map((item) => <Finding item={item} evidenceById={evidenceById} key={item.title} />)}
        </section>
        <section>
          <h3>Risks</h3>
          {result.risks.map((item) => <Finding item={item} evidenceById={evidenceById} key={item.title} />)}
        </section>
      </div>

      <div className="copilot-list">
        {result.recommendedActions.map((action, index) => (
          <div className="analytics-list-row" key={`${action.kind}-${action.label}`}>
            <span><strong>{action.label}</strong><small>{action.actionType} · {action.priority}</small><EvidenceRefs evidenceById={evidenceById} ids={action.evidenceIds} /></span>
            <span className="segmented-control">
              <button className="secondary-button" disabled={working || action.evidenceIds.length === 0} type="button" onClick={() => onSave(index)}>Save Action</button>
              {action.actionType === 'CREATE_CAMPAIGN_DRAFT' ? <button className="primary-button" disabled={working || action.evidenceIds.length === 0} type="button" onClick={() => onDraft(index)}>Create Draft</button> : null}
            </span>
          </div>
        ))}
      </div>

      <details>
        <summary>Evidence</summary>
        <div className="copilot-list">
          {result.evidence.slice(0, 12).map((item) => <EvidenceRow item={item} key={item.id} />)}
        </div>
      </details>
    </section>
  );
}

function Finding({ evidenceById, item }: { item: { title: string; text: string; evidenceIds: string[] }; evidenceById: Map<string, AiBusinessDailyEvidence> }) {
  return <p className="muted-copy"><strong>{item.title}</strong><br />{item.text}<EvidenceRefs evidenceById={evidenceById} ids={item.evidenceIds} /></p>;
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

function actionInput(result: AiPlaybookResult, action: AiPlaybookResult['recommendedActions'][number]) {
  const evidenceSnapshot = action.evidenceIds.map((id) => result.evidence.find((item) => item.id === id)).filter(Boolean);
  return {
    sourceType: 'AI_PLAYBOOK' as const,
    sourceId: result.runId,
    sourceTitle: result.title,
    actionType: action.actionType,
    priority: action.priority,
    title: action.label,
    description: result.summary.headline,
    reason: result.findings[0]?.text,
    targetType: action.targetType,
    targetUrl: action.targetUrl,
    payload: { playbookType: result.type, range: result.range, ...(action.payload ?? {}) },
    evidenceSnapshot,
  };
}
