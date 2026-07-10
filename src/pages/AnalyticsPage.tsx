import { ErrorState, LoadingState } from '../components/PageState';
import { AnalyticsCharts } from '../features/analytics/components/AnalyticsCharts';
import { AnalyticsSummary } from '../features/analytics/components/AnalyticsSummary';
import { AnalyticsTables } from '../features/analytics/components/AnalyticsTables';
import { useAnalyticsPage } from '../features/analytics/hooks/useAnalyticsPage';

const presets = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['last_7_days', 'Last 7 days'],
  ['last_30_days', 'Last 30 days'],
  ['custom', 'Custom'],
] as const;

export function AnalyticsPage() {
  const vm = useAnalyticsPage();
  if (vm.query.isLoading) return <LoadingState title="Building store intelligence" />;
  if (vm.query.isError || !vm.query.data) return <ErrorState title="Analytics unavailable" description="The store data could not be aggregated. No business data was changed." />;
  const data = vm.query.data;
  return (
    <section className="analytics-page">
      <div className="page-header row">
        <div><span className="eyebrow">Business intelligence · {data.store.timezone}</span><h1>Analytics</h1></div>
        <span className="analytics-period">{data.period.from} — {data.period.to}</span>
      </div>
      <div className="analytics-filter-bar">
        <div className="segmented-control">
          {presets.map(([value, label]) => <button className={vm.state.preset === value ? 'active' : ''} key={value} type="button" onClick={() => vm.actions.setPreset(value)}>{label}</button>)}
        </div>
        {vm.state.preset === 'custom' && <><input type="date" value={vm.state.from} onChange={(event) => vm.actions.setFrom(event.target.value)} /><input type="date" value={vm.state.to} onChange={(event) => vm.actions.setTo(event.target.value)} /></>}
        <select value={vm.state.compare} onChange={(event) => vm.actions.setCompare(event.target.value as typeof vm.state.compare)}>
          <option value="previous_period">Previous period</option><option value="previous_week">Previous week</option>
        </select>
        <button className="primary-button" type="button" onClick={vm.actions.apply}>Apply</button>
      </div>
      <AnalyticsSummary data={data} />
      <AnalyticsCharts data={data} />
      <AnalyticsTables data={data} modifiers={vm.modifiers} />
    </section>
  );
}
