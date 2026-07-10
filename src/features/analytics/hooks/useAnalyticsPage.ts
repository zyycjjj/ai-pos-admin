import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchAnalyticsContext } from '../../../services/adminApi';
import type { AnalyticsFilters } from '../../../types/admin';

export type AnalyticsPreset = NonNullable<AnalyticsFilters['preset']> | 'custom';

const initialFilters: AnalyticsFilters = { preset: 'last_7_days', compare: 'previous_period' };

export function useAnalyticsPage() {
  const [preset, setPreset] = useState<AnalyticsPreset>('last_7_days');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [compare, setCompare] = useState<AnalyticsFilters['compare']>('previous_period');
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);

  const contextQuery = useQuery({
    queryKey: ['admin', 'analytics', 'context', filters],
    queryFn: () => fetchAnalyticsContext(filters),
  });
  const apply = () => {
    if (preset === 'custom') {
      if (!from || !to) return;
      setFilters({ from, to, compare });
      return;
    }
    setFilters({ preset, compare });
  };

  return {
    state: { preset, from, to, compare, filters },
    query: contextQuery,
    modifiers: contextQuery.data?.modifiers ?? [],
    actions: { setPreset, setFrom, setTo, setCompare, apply, retry: () => void contextQuery.refetch() },
  };
}
