import { ErrorState, LoadingState } from '../components/PageState';
import { CopilotPanel } from '../features/copilot/components/CopilotPanel';
import { useAiCopilotPage } from '../features/copilot/hooks/useAiCopilotPage';

export function AiCenterPage() {
  const vm = useAiCopilotPage();
  const dailyBrief = vm.queries.dailyBriefQuery.data;
  const isLoading = vm.queries.dailyBriefQuery.isLoading && !dailyBrief;
  const suggestedQuestions = dailyBrief?.suggestedQuestions ?? [
    'How is my business doing today?',
    'Which products are underperforming?',
    'Why are refunds increasing?',
  ];

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">Metric-grounded AI</span>
          <h1>AI Business Copilot</h1>
        </div>
        <span className="analytics-period">{dailyBrief?.source === 'deepseek' ? 'DeepSeek' : 'Deterministic fallback'}</span>
      </div>
      {isLoading ? <LoadingState title="Preparing business context" /> : null}
      {vm.queries.dailyBriefQuery.isError ? <ErrorState title="Copilot unavailable" description="Analytics context could not be loaded. No business data was changed." /> : null}
      {!isLoading && !vm.queries.dailyBriefQuery.isError ? (
        <CopilotPanel
          conversations={vm.queries.conversationsQuery.data ?? []}
          dailyBrief={dailyBrief}
          drafts={vm.queries.draftsQuery.data ?? []}
          error={vm.mutation.isError ? 'Copilot could not answer this question. No business data was changed.' : null}
          isLoading={isLoading}
          isSending={vm.mutation.isPending}
          message={vm.state.message}
          onMessageChange={vm.actions.setMessage}
          onPresetChange={vm.actions.setPeriodPreset}
          onPrompt={vm.actions.usePrompt}
          onSubmit={() => vm.actions.submit()}
          period={vm.state.period}
          responses={vm.state.responses}
          suggestedQuestions={suggestedQuestions}
        />
      ) : null}
    </section>
  );
}
