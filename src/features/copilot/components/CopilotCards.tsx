import type { CopilotChatResponse, CopilotStructuredMessage } from '../../../types/admin';

export function CopilotResponseCard({ response }: { response: CopilotChatResponse | CopilotStructuredMessage }) {
  return (
    <article className="copilot-response">
      <p>{response.answer}</p>
      <strong>{response.summary}</strong>
      {response.evidence.length > 0 ? (
        <div className="copilot-evidence-grid">
          {response.evidence.map((item) => (
            <div className="copilot-evidence" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value ?? 'n/a'}</strong>
              {item.changePercent !== undefined && item.changePercent !== null ? <small>{item.changePercent}%</small> : null}
            </div>
          ))}
        </div>
      ) : null}
      <CopilotList title="Drivers" items={response.drivers.map((item) => item.text)} />
      <CopilotList title="Risks" items={response.risks.map((item) => item.text)} />
      <CopilotList title="Recommendations" items={response.recommendations.map((item) => `${item.title}: ${item.description}`)} />
      <CopilotList title="Limitations" items={response.limitations} />
    </article>
  );
}

function CopilotList({ items, title }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="copilot-list">
      <h3>{title}</h3>
      {items.map((item) => <p key={item}>{item}</p>)}
    </div>
  );
}

