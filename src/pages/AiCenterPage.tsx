import { ErrorState, LoadingState } from '../components/PageState';
import { CopilotPanel } from '../features/copilot/components/CopilotPanel';
import { useAiCopilotPage } from '../features/copilot/hooks/useAiCopilotPage';
import { useAdminI18n } from '../i18n';

export function AiCenterPage() {
  const { t } = useAdminI18n();
  const vm = useAiCopilotPage();
  const dailyBrief = vm.queries.dailyBriefQuery.data;
  const isLoading = vm.queries.dailyBriefQuery.isLoading && !dailyBrief;
  const suggestedQuestions = dailyBrief?.suggestedQuestions ?? [
    t('ai.q1'),
    t('ai.q2'),
    t('ai.q3'),
  ];

  return (
    <section className="copilot-page">
      <div className="page-header row">
        <div>
          <span className="eyebrow">{t('ai.eyebrow')}</span>
          <h1>{t('ai.title')}</h1>
        </div>
        <span className="analytics-period">{dailyBrief?.source === 'deepseek' ? 'DeepSeek' : t('ai.fallback')}</span>
      </div>
      {isLoading ? <LoadingState title={t('ai.loading')} /> : null}
      {vm.queries.dailyBriefQuery.isError ? <ErrorState title={t('ai.errorTitle')} description={t('ai.errorBody')} /> : null}
      {!isLoading && !vm.queries.dailyBriefQuery.isError ? (
        <CopilotPanel
          conversations={vm.queries.conversationsQuery.data ?? []}
          dailyBrief={dailyBrief}
          drafts={vm.queries.draftsQuery.data ?? []}
          error={vm.mutation.isError ? t('ai.answerError') : null}
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
