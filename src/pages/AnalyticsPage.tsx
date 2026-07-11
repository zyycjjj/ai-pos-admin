import { ErrorState, LoadingState } from '../components/PageState';
import { AnalyticsCharts } from '../features/analytics/components/AnalyticsCharts';
import { AnalyticsSummary } from '../features/analytics/components/AnalyticsSummary';
import { AnalyticsTables } from '../features/analytics/components/AnalyticsTables';
import { useAnalyticsPage } from '../features/analytics/hooks/useAnalyticsPage';
import { useAdminI18n } from '../i18n';

const presets = [
  ['today', 'analytics.today'],
  ['yesterday', 'analytics.yesterday'],
  ['last_7_days', 'analytics.last7'],
  ['last_30_days', 'analytics.last30'],
  ['custom', 'analytics.custom'],
] as const;

export function AnalyticsPage() {
  const { t } = useAdminI18n();
  const vm = useAnalyticsPage();
  if (vm.query.isLoading) return <LoadingState title={t('analytics.loading')} />;
  if (vm.query.isError || !vm.query.data) return <ErrorState title={t('analytics.errorTitle')} description={t('analytics.errorBody')} />;
  const data = vm.query.data;
  return (
    <section className="analytics-page">
      <div className="page-header row">
        <div><span className="eyebrow">{t('analytics.eyebrow')} · {data.store.timezone}</span><h1>{t('analytics.title')}</h1></div>
        <span className="analytics-period">{data.period.from} — {data.period.to}</span>
      </div>
      <div className="analytics-filter-bar">
        <div className="segmented-control">
          {presets.map(([value, labelKey]) => <button className={vm.state.preset === value ? 'active' : ''} key={value} type="button" onClick={() => vm.actions.setPreset(value)}>{t(labelKey)}</button>)}
        </div>
        {vm.state.preset === 'custom' && <><input type="date" value={vm.state.from} onChange={(event) => vm.actions.setFrom(event.target.value)} /><input type="date" value={vm.state.to} onChange={(event) => vm.actions.setTo(event.target.value)} /></>}
        <select value={vm.state.compare} onChange={(event) => vm.actions.setCompare(event.target.value as typeof vm.state.compare)}>
          <option value="previous_period">{t('analytics.previousPeriod')}</option><option value="previous_week">{t('analytics.previousWeek')}</option>
        </select>
        <button className="primary-button" type="button" onClick={vm.actions.apply}>{t('analytics.apply')}</button>
      </div>
      <AnalyticsSummary data={data} />
      <AnalyticsCharts data={data} />
      <AnalyticsTables data={data} modifiers={vm.modifiers} />
    </section>
  );
}
