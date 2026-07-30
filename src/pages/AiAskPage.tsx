import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState } from '../components/PageState';
import { askAiBusinessQuery, fetchAiBusinessQueryHistory, type AiBusinessDailyFilters } from '../services/adminApi';
import type { AiBusinessDailyEvidence, AiBusinessQueryResponse } from '../types/admin';

const presets: Array<[NonNullable<AiBusinessDailyFilters['preset']>, string]> = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['last7days', 'Last 7 days'],
  ['custom', 'Custom'],
];

const promptSuggestions = [
  '今天整体怎么样？',
  '今天为什么退款变多了？',
  '哪个商品最近卖得最好？',
  '哪个顾客值得召回？',
  '哪个活动效果最好？',
  '哪个档口最慢？',
  '本周营业额为什么变化？',
];

export function AiAskPage() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState(promptSuggestions[0]);
  const [preset, setPreset] = useState<NonNullable<AiBusinessDailyFilters['preset']>>('today');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [response, setResponse] = useState<AiBusinessQueryResponse | null>(null);
  const filters = useMemo(() => ({ preset, from: preset === 'custom' ? from : undefined, to: preset === 'custom' ? to : undefined, timezone: 'Asia/Shanghai' }), [from, preset, to]);
  const historyQuery = useQuery({ queryKey: ['admin', 'ai-business-query-history'], queryFn: fetchAiBusinessQueryHistory });
  const mutation = useMutation({
    mutationFn: askAiBusinessQuery,
    onSuccess: (data) => {
      setResponse(data);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-business-query-history'] });
    },
  });

  const evidenceById = new Map((response?.evidence ?? []).map((item) => [item.id, item]));
  const ask = () => {
    if (!question.trim()) return;
    mutation.mutate({ question: question.trim(), ...filters });
  };

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">AI Operations · Natural language query</span>
          <h1>AI Business Ask</h1>
        </div>
        <span className="analytics-period">{response ? `${response.range.from} — ${response.range.to} · ${response.fallback ? 'Fallback' : 'AI'} · ${new Date(response.generatedAt).toLocaleString()}` : 'Evidence-backed answers'}</span>
      </div>

      <section className="analytics-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Ask about this store</span>
            <h2>Question</h2>
          </div>
          <button className="primary-button" disabled={mutation.isPending || !question.trim()} type="button" onClick={ask}>{mutation.isPending ? 'Asking...' : 'Ask'}</button>
        </div>
        <textarea rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about sales, refunds, products, customers, campaigns, kitchen, tables, or approvals." />
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
        <div className="segmented-control">
          {promptSuggestions.map((prompt) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)}>{prompt}</button>)}
        </div>
        {mutation.isError ? <p className="muted-copy">AI Business Ask is unavailable. Reports and Dashboard remain available.</p> : null}
      </section>

      <div className="copilot-layout">
        <section className="copilot-main">
          {response ? <AnswerCard response={response} evidenceById={evidenceById} /> : <EmptyState title="Ask a business question" description="Answers are scoped to the current store and cite backend evidence." />}
        </section>
        <aside className="copilot-side">
          <section className="analytics-panel">
            <div className="panel-header"><h2>Query History</h2></div>
            {historyQuery.isError ? <ErrorState title="History unavailable" description="Recent query history could not be loaded." /> : null}
            {(historyQuery.data?.items ?? []).map((item) => (
              <button className="analytics-list-row" key={item.id} type="button" onClick={() => setQuestion(item.question)}>
                <span><strong>{item.question}</strong><small>{item.intent} · {new Date(item.createdAt).toLocaleString()}</small></span>
              </button>
            ))}
            {historyQuery.data?.items.length === 0 ? <p className="muted-copy">No query history yet.</p> : null}
          </section>
          <section className="analytics-panel">
            <div className="panel-header"><h2>Evidence</h2></div>
            {(response?.evidence ?? []).map((item) => <EvidenceRow item={item} key={item.id} />)}
            {!response ? <p className="muted-copy">Evidence appears after asking.</p> : null}
          </section>
        </aside>
      </div>
    </section>
  );
}

function AnswerCard({ evidenceById, response }: { response: AiBusinessQueryResponse; evidenceById: Map<string, AiBusinessDailyEvidence> }) {
  return (
    <section className="analytics-panel">
      <div className="panel-header">
        <div>
          <span className="status active">{response.intent}</span>
          <h2>{response.answer.headline}</h2>
        </div>
      </div>
      <p className="muted-copy">{response.answer.summary}</p>
      <div className="copilot-list">
        {response.answer.details.map((detail, index) => (
          <div className="analytics-list-row" key={`${detail.title}-${index}`}>
            <span><strong>{detail.title}</strong><small>{detail.text}</small><EvidenceRefs ids={detail.evidenceIds} evidenceById={evidenceById} /></span>
          </div>
        ))}
      </div>
      {response.answer.limitations.length > 0 ? (
        <div className="copilot-response">
          <strong>Limitations</strong>
          {response.answer.limitations.map((item) => <p className="muted-copy" key={item}>{item}</p>)}
        </div>
      ) : null}
      <div className="copilot-list">
        {response.suggestedActions.map((action) => (
          action.href ? <Link className="secondary-button" key={`${action.kind}-${action.label}`} to={action.href}>{action.label}</Link> : <span className="status" key={`${action.kind}-${action.label}`}>{action.label}</span>
        ))}
      </div>
    </section>
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
