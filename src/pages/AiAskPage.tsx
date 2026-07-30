import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { askAiBusinessQuery, createAiAction, fetchAiConversation, fetchAiConversations, type AiBusinessDailyFilters } from '../services/adminApi';
import type { AiActionPriority, AiActionTargetType, AiActionType, AiBusinessDailyEvidence, AiBusinessQueryIntent, AiBusinessQueryResponse, AiConversationMessage } from '../types/admin';

const presets: Array<[NonNullable<AiBusinessDailyFilters['preset']>, string]> = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['last7days', 'Last 7 days'],
  ['custom', 'Custom'],
];

const promptSuggestions = [
  '今天为什么退款变多了？',
  '具体是哪几笔？',
  '这些有什么共同点？',
  '那我该怎么办？',
  '帮我保存成待办',
  '哪个顾客值得召回？',
  '生成一个召回活动草稿',
];

export function AiAskPage() {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [question, setQuestion] = useState(promptSuggestions[0]);
  const [preset, setPreset] = useState<NonNullable<AiBusinessDailyFilters['preset']>>('today');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const filters = useMemo(() => ({ preset, from: preset === 'custom' ? from : undefined, to: preset === 'custom' ? to : undefined, timezone: 'Asia/Shanghai' }), [from, preset, to]);
  const conversationsQuery = useQuery({ queryKey: ['admin', 'ai-conversations'], queryFn: fetchAiConversations });
  const threadQuery = useQuery({ queryKey: ['admin', 'ai-conversation', activeConversationId], queryFn: () => fetchAiConversation(activeConversationId as string), enabled: Boolean(activeConversationId) });
  const saveActionMutation = useMutation({
    mutationFn: createAiAction,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-actions'] }),
  });
  const askMutation = useMutation({
    mutationFn: askAiBusinessQuery,
    onSuccess: (data) => {
      setActiveConversationId(data.conversationId);
      setQuestion('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-conversation', data.conversationId] });
    },
  });

  const ask = () => {
    if (!question.trim()) return;
    askMutation.mutate({ question: question.trim(), conversationId: activeConversationId, ...filters });
  };
  const startNew = () => {
    setActiveConversationId(null);
    setQuestion(promptSuggestions[0]);
  };

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">AI Operations · Conversation memory</span>
          <h1>AI Business Ask</h1>
        </div>
        <button className="secondary-button" type="button" onClick={startNew}>New conversation</button>
      </div>

      <div className="copilot-layout">
        <aside className="copilot-side">
          <section className="analytics-panel">
            <div className="panel-header"><h2>Conversations</h2></div>
            {conversationsQuery.isLoading ? <p className="muted-copy">Loading conversations...</p> : null}
            {conversationsQuery.isError ? <ErrorState title="Conversations unavailable" description="AI Ask threads could not be loaded." /> : null}
            <div className="copilot-list">
              {(conversationsQuery.data?.items ?? []).map((item) => (
                <button className={`analytics-list-row ${activeConversationId === item.id ? 'active' : ''}`} key={item.id} type="button" onClick={() => setActiveConversationId(item.id)}>
                  <span><strong>{item.title}</strong><small>{item.lastIntent ?? 'AI_ASK'} · {new Date(item.updatedAt).toLocaleString()}</small></span>
                </button>
              ))}
            </div>
            {conversationsQuery.data?.items.length === 0 ? <p className="muted-copy">No conversation yet.</p> : null}
          </section>

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
        </aside>

        <section className="copilot-main">
          <section className="analytics-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">{threadQuery.data ? threadQuery.data.title : 'Ask about this store'}</span>
                <h2>Thread</h2>
              </div>
              <span className="analytics-period">{activeConversationId ? 'Follow-up enabled' : 'New question'}</span>
            </div>
            {threadQuery.isLoading ? <LoadingState title="Loading AI conversation" /> : null}
            {threadQuery.isError ? <ErrorState title="Conversation unavailable" description="This conversation could not be loaded for the active store." /> : null}
            {!activeConversationId && !askMutation.data ? <EmptyState title="Start a business conversation" description="Ask an initial question, then continue with follow-ups like “具体是哪几笔？” or “那我该怎么办？”" /> : null}
            <div className="copilot-list">
              {(threadQuery.data?.messages ?? []).map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSaveAction={(input) => saveActionMutation.mutate(input)}
                  saving={saveActionMutation.isPending}
                />
              ))}
            </div>
          </section>

          <section className="analytics-panel">
            <textarea rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={activeConversationId ? 'Ask a follow-up, save as action, or create a draft campaign.' : 'Ask about sales, refunds, products, customers, campaigns, kitchen, tables, or approvals.'} />
            <div className="panel-header">
              <div className="segmented-control">
                {promptSuggestions.map((prompt) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)}>{prompt}</button>)}
              </div>
              <button className="primary-button" disabled={askMutation.isPending || !question.trim()} type="button" onClick={ask}>{askMutation.isPending ? 'Asking...' : activeConversationId ? 'Send follow-up' : 'Ask'}</button>
            </div>
            {askMutation.isError ? <p className="muted-copy">AI Business Ask is unavailable. Reports and Dashboard remain available.</p> : null}
          </section>
        </section>
      </div>
    </section>
  );
}

function MessageBubble({ message, onSaveAction, saving }: {
  message: AiConversationMessage;
  saving: boolean;
  onSaveAction: (input: Parameters<typeof createAiAction>[0]) => void;
}) {
  if (message.role === 'USER') {
    return (
      <article className="analytics-list-row">
        <span><strong>You</strong><small>{message.content}</small></span>
        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
      </article>
    );
  }
  const evidence = message.evidence ?? [];
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  return (
    <article className="copilot-response">
      <div className="panel-header">
        <div>
          <span className="status active">{message.resolvedIntent ?? message.intent ?? 'AI_ASK'}</span>
          <h2>{message.answer?.headline ?? message.content}</h2>
        </div>
        {message.contextUsed?.campaignDraftCreated ? <span className="status draft">DRAFT created</span> : message.contextUsed?.actionCreated ? <span className="status active">Action saved</span> : null}
      </div>
      {message.answer?.summary ? <p className="muted-copy">{message.answer.summary}</p> : null}
      <div className="copilot-list">
        {(message.answer?.details ?? []).map((detail, index) => (
          <div className="analytics-list-row" key={`${message.id}-detail-${index}`}>
            <span><strong>{detail.title}</strong><small>{detail.text}</small><EvidenceRefs ids={detail.evidenceIds} evidenceById={evidenceById} /></span>
          </div>
        ))}
      </div>
      {(message.suggestedActions ?? []).length > 0 ? (
        <div className="copilot-list">
          {(message.suggestedActions ?? []).map((action) => (
            <div className="analytics-list-row" key={`${message.id}-${action.kind}-${action.label}`}>
              <span><strong>{action.label}</strong><small>{action.kind} · {(action.evidenceIds ?? []).map((id) => evidenceById.get(id)?.title ?? id).join(' · ')}</small></span>
              <span className="segmented-control">
                {action.href ? <Link className="secondary-button" to={action.href}>Open</Link> : null}
                <button className="secondary-button" disabled={saving || (action.evidenceIds ?? []).length === 0} type="button" onClick={() => onSaveAction(actionFromMessage(message, action, evidenceById))}>Save Action</button>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {evidence.length > 0 ? (
        <details>
          <summary>Evidence snapshot</summary>
          <div className="copilot-list">
            {evidence.slice(0, 8).map((item) => <EvidenceRow item={item} key={item.id} />)}
          </div>
        </details>
      ) : null}
      {(message.answer?.limitations ?? []).map((item) => <p className="muted-copy" key={item}>{item}</p>)}
    </article>
  );
}

function actionFromMessage(
  message: AiConversationMessage,
  action: NonNullable<AiConversationMessage['suggestedActions']>[number],
  evidenceById: Map<string, AiBusinessDailyEvidence>,
) {
  const actionType = mapQueryActionType(action.kind);
  const evidenceSnapshot = (action.evidenceIds ?? []).map((id) => evidenceById.get(id)).filter((item): item is AiBusinessDailyEvidence => Boolean(item));
  return {
    sourceType: 'AI_ASK' as const,
    sourceId: message.id,
    sourceTitle: message.question ?? message.content,
    actionType,
    priority: inferQueryPriority(message.resolvedIntent ?? message.intent ?? 'GENERAL_BUSINESS_SUMMARY', actionType),
    title: action.label,
    description: message.answer?.summary,
    reason: message.answer?.headline,
    targetType: targetTypeFor(actionType),
    targetUrl: action.href ?? targetUrlFor(actionType),
    payload: { messageId: message.id, intent: message.resolvedIntent ?? message.intent, range: message.range },
    evidenceSnapshot,
  };
}

function mapQueryActionType(kind: NonNullable<AiConversationMessage['suggestedActions']>[number]['kind']): AiActionType {
  const map: Record<typeof kind, AiActionType> = {
    VIEW_REPORT: 'VIEW_REPORT',
    VIEW_PRODUCT: 'VIEW_PRODUCT',
    VIEW_CUSTOMER: 'VIEW_CUSTOMER',
    VIEW_CAMPAIGNS: 'VIEW_CAMPAIGN',
    CREATE_CAMPAIGN_DRAFT: 'CREATE_CAMPAIGN_DRAFT',
    VIEW_KITCHEN: 'VIEW_KITCHEN',
    VIEW_TABLES: 'VIEW_TABLE',
  };
  return map[kind];
}

function inferQueryPriority(intent: AiBusinessQueryIntent, actionType: AiActionType): AiActionPriority {
  if (intent === 'REFUND_ANALYSIS' || intent === 'KITCHEN_ANALYSIS' || actionType === 'CREATE_CAMPAIGN_DRAFT') return 'HIGH';
  if (intent === 'SALES_ANALYSIS' || intent === 'GENERAL_BUSINESS_SUMMARY') return 'MEDIUM';
  return 'LOW';
}

function targetTypeFor(actionType: AiActionType): AiActionTargetType {
  if (actionType === 'VIEW_REPORT') return 'REPORT';
  if (actionType === 'VIEW_PRODUCT') return 'PRODUCT';
  if (actionType === 'VIEW_CUSTOMER') return 'CUSTOMER';
  if (actionType === 'VIEW_CAMPAIGN') return 'CAMPAIGN';
  if (actionType === 'VIEW_KITCHEN') return 'KITCHEN_STATION';
  if (actionType === 'VIEW_TABLE') return 'TABLE';
  if (actionType === 'CREATE_CAMPAIGN_DRAFT') return 'AI_RECOMMENDATION';
  return 'NONE';
}

function targetUrlFor(actionType: AiActionType) {
  if (actionType === 'VIEW_REPORT') return '/reports';
  if (actionType === 'VIEW_PRODUCT') return '/products';
  if (actionType === 'VIEW_CUSTOMER') return '/customers';
  if (actionType === 'VIEW_CAMPAIGN' || actionType === 'CREATE_CAMPAIGN_DRAFT') return '/campaigns';
  if (actionType === 'VIEW_KITCHEN') return '/kitchen';
  if (actionType === 'VIEW_TABLE') return '/tables';
  return undefined;
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
