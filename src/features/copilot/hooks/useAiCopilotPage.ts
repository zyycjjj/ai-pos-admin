import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { AnalyticsFilters, CopilotChatResponse } from '../../../types/admin';
import { fetchAiDrafts, fetchCopilotConversations, fetchCopilotDailyBrief, sendCopilotMessage } from '../api/copilotApi';

const defaultPeriod: AnalyticsFilters = { preset: 'last_7_days', compare: 'previous_period' };

export function useAiCopilotPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [period, setPeriod] = useState<AnalyticsFilters>(defaultPeriod);
  const [responses, setResponses] = useState<CopilotChatResponse[]>([]);

  const dailyBriefQuery = useQuery({ queryKey: ['admin', 'copilot', 'daily-brief'], queryFn: fetchCopilotDailyBrief });
  const conversationsQuery = useQuery({ queryKey: ['admin', 'copilot', 'conversations'], queryFn: fetchCopilotConversations });
  const draftsQuery = useQuery({ queryKey: ['admin', 'ai-drafts'], queryFn: fetchAiDrafts });

  const chatMutation = useMutation({
    mutationFn: sendCopilotMessage,
    onSuccess: (response) => {
      setConversationId(response.conversationId);
      setResponses((current) => [...current, response]);
      setMessage('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'copilot', 'conversations'] });
    },
  });

  const submit = (overrideMessage?: string) => {
    const finalMessage = (overrideMessage ?? message).trim();
    if (!finalMessage || chatMutation.isPending) return;
    chatMutation.mutate({ conversationId, message: finalMessage, period });
  };

  return {
    state: { message, period, responses, conversationId },
    queries: { dailyBriefQuery, conversationsQuery, draftsQuery },
    mutation: chatMutation,
    actions: {
      setMessage,
      setPeriodPreset: (preset: NonNullable<AnalyticsFilters['preset']>) => setPeriod({ preset, compare: period.compare ?? 'previous_period' }),
      submit,
      usePrompt: (prompt: string) => {
        setMessage(prompt);
        submit(prompt);
      },
    },
  };
}
