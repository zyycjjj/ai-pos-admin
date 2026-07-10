import type { AiDraft, AnalyticsFilters, CopilotChatResponse, CopilotConversationSummary } from '../../../types/admin';
import { CopilotResponseCard } from './CopilotCards';

const presets: Array<[NonNullable<AnalyticsFilters['preset']>, string]> = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['last_7_days', 'Last 7 days'],
  ['last_30_days', 'Last 30 days'],
];

export function CopilotPanel(props: {
  dailyBrief?: CopilotChatResponse;
  responses: CopilotChatResponse[];
  conversations: CopilotConversationSummary[];
  drafts: AiDraft[];
  message: string;
  period: AnalyticsFilters;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  suggestedQuestions: string[];
  onMessageChange: (value: string) => void;
  onPresetChange: (preset: NonNullable<AnalyticsFilters['preset']>) => void;
  onSubmit: () => void;
  onPrompt: (prompt: string) => void;
}) {
  return (
    <div className="copilot-layout">
      <section className="copilot-main">
        <div className="copilot-period-bar">
          <div className="segmented-control">
            {presets.map(([value, label]) => (
              <button className={props.period.preset === value ? 'active' : ''} key={value} type="button" onClick={() => props.onPresetChange(value)}>
                {label}
              </button>
            ))}
          </div>
          {props.dailyBrief ? <span>{props.dailyBrief.period.from} — {props.dailyBrief.period.to}</span> : null}
        </div>
        {props.dailyBrief ? <CopilotResponseCard response={props.dailyBrief} /> : null}
        <div className="copilot-prompts">
          {props.suggestedQuestions.map((question) => (
            <button key={question} type="button" onClick={() => props.onPrompt(question)}>{question}</button>
          ))}
        </div>
        <div className="copilot-chat">
          {props.responses.map((response) => (
            <CopilotResponseCard key={response.messageId} response={response} />
          ))}
          <div className="copilot-composer">
            <textarea value={props.message} onChange={(event) => props.onMessageChange(event.target.value)} placeholder="Ask about sales, refunds, products, kitchen, shifts, or payments" />
            <button className="primary-button" disabled={props.isSending || props.message.trim().length === 0} type="button" onClick={props.onSubmit}>
              {props.isSending ? 'Thinking' : 'Ask Copilot'}
            </button>
          </div>
          {props.error ? <p className="form-error">{props.error}</p> : null}
        </div>
      </section>
      <aside className="copilot-side">
        <section className="analytics-panel">
          <div className="panel-header"><h2>Conversations</h2></div>
          {props.conversations.length === 0 ? <p className="analytics-empty">No conversations yet.</p> : null}
          {props.conversations.map((conversation) => (
            <div className="analytics-list-row" key={conversation.id}>
              <span><strong>{conversation.title}</strong><small>{new Date(conversation.lastMessageAt).toLocaleString()}</small></span>
            </div>
          ))}
        </section>
        <section className="analytics-panel">
          <div className="panel-header"><h2>Reviewed drafts</h2></div>
          {props.drafts.length === 0 ? <p className="analytics-empty">AI menu and campaign drafts will appear here.</p> : null}
          {props.drafts.slice(0, 6).map((draft) => (
            <div className="analytics-list-row" key={draft.id}>
              <span><strong>{draft.title}</strong><small>{draft.type} · {draft.status}</small></span>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}

