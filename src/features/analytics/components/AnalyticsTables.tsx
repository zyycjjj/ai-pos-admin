import { useState } from 'react';

import { ShowAllToggle } from '../../../components/Pagination';
import { useAdminI18n } from '../../../i18n';
import type { AnalyticsContext, AnalyticsModifierMetric } from '../../../types/admin';

const delta = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export function AnalyticsTables({ data, modifiers }: { data: AnalyticsContext; modifiers: AnalyticsModifierMetric[] }) {
  const { t } = useAdminI18n();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.store.currency });
  const limit = 10;
  const topProducts = expanded.products ? data.topProducts : data.topProducts.slice(0, limit);
  const categoryRows = expanded.categories ? data.categories : data.categories.slice(0, limit);
  const modifierRows = expanded.modifiers ? modifiers : modifiers.slice(0, limit);
  const refundRows = expanded.refunds ? data.refunds.topReasons : data.refunds.topReasons.slice(0, limit);
  const shiftRows = expanded.shifts ? data.shifts : data.shifts.slice(0, limit);
  const kitchenRows = expanded.kitchen ? data.kitchen : data.kitchen.slice(0, limit);
  const toggle = (key: string) => setExpanded((current) => ({ ...current, [key]: !current[key] }));
  return (
    <div className="analytics-sections">
      <section className="analytics-panel">
        <div className="panel-header"><div><h2>{t('analytics.productPerformance')}</h2><span>{t('analytics.productPerformanceSub')}</span></div><ShowAllToggle isShowingAll={Boolean(expanded.products)} total={data.topProducts.length} visibleCount={limit} onToggle={() => toggle('products')} /></div>
        <div className="table-card"><table><thead><tr><th>{t('analytics.product')}</th><th>{t('analytics.units')}</th><th>{t('analytics.netSales')}</th><th>{t('analytics.change')}</th><th>{t('analytics.refunds')}</th></tr></thead><tbody>
          {topProducts.map((item) => <tr key={item.productId}><td><strong>{item.name}</strong><small>{item.category}</small></td><td>{item.unitsSold}</td><td>{money.format(item.netSales)}</td><td><span className={item.changePercent !== null && item.changePercent < 0 ? 'trend down' : 'trend'}>{delta(item.changePercent)}</span></td><td>{money.format(item.refundAmount)}</td></tr>)}
        </tbody></table></div>
      </section>
      <div className="analytics-two-column">
        <section className="analytics-panel"><div className="panel-header"><div><h2>{t('analytics.categories')}</h2><span>{t('analytics.revenueShare')}</span></div><ShowAllToggle isShowingAll={Boolean(expanded.categories)} total={data.categories.length} visibleCount={limit} onToggle={() => toggle('categories')} /></div>
          {categoryRows.map((item) => <div className="analytics-list-row" key={item.name}><span><strong>{item.name}</strong><small>{t('analytics.unitsLabel', { count: item.unitsSold })}</small></span><span>{money.format(item.netSales)} · {item.sharePercent.toFixed(1)}% · {delta(item.changePercent)}</span></div>)}
        </section>
        <section className="analytics-panel"><div className="panel-header"><h2>{t('analytics.paymentMix')}</h2><span>{t('analytics.paymentLines')}</span></div>
          {data.payments.map((item) => <div className="analytics-list-row" key={item.method}><strong>{item.method}</strong><span>{money.format(item.amount)} · {item.sharePercent.toFixed(1)}%</span></div>)}
        </section>
      </div>
      <section className="analytics-panel"><div className="panel-header"><div><h2>{t('analytics.modifierPerformance')}</h2><span>{t('analytics.attachRateSub')}</span></div><ShowAllToggle isShowingAll={Boolean(expanded.modifiers)} total={modifiers.length} visibleCount={limit} onToggle={() => toggle('modifiers')} /></div>
        <div className="table-card"><table><thead><tr><th>{t('analytics.modifier')}</th><th>{t('analytics.selections')}</th><th>{t('analytics.eligibleItems')}</th><th>{t('analytics.attachRate')}</th><th>{t('analytics.revenue')}</th></tr></thead><tbody>
          {modifierRows.map((item) => <tr key={item.optionId}><td><strong>{item.name}</strong><small>{item.groupName}</small></td><td>{item.selectionCount}</td><td>{item.eligibleProductItemCount}</td><td>{(item.attachRate * 100).toFixed(1)}%</td><td>{money.format(item.revenueContribution)}</td></tr>)}
        </tbody></table></div>
      </section>
      <div className="analytics-two-column">
        <section className="analytics-panel"><div className="panel-header"><div><h2>{t('analytics.refundIntelligence')}</h2><span>{t('analytics.ofGross', { rate: (data.refunds.refundRate * 100).toFixed(1) })}</span></div><ShowAllToggle isShowingAll={Boolean(expanded.refunds)} total={data.refunds.topReasons.length} visibleCount={limit} onToggle={() => toggle('refunds')} /></div>
          {refundRows.map((item) => <div className="analytics-list-row" key={item.reason}><span><strong>{item.reason}</strong><small>{t('analytics.refundCount', { count: item.count })}</small></span><span>{money.format(item.amount)}</span></div>)}
        </section>
        <section className="analytics-panel"><div className="panel-header"><div><h2>{t('analytics.shiftPerformance')}</h2><span>{t('analytics.cashVariance')}</span></div><ShowAllToggle isShowingAll={Boolean(expanded.shifts)} total={data.shifts.length} visibleCount={limit} onToggle={() => toggle('shifts')} /></div>
          {shiftRows.map((item) => <div className="analytics-list-row" key={item.shiftId}><span><strong>{item.staffName}</strong><small>{item.orderCount} orders · {money.format(item.netSales)}</small></span><span>{item.cashVariance === null ? t('analytics.open') : money.format(item.cashVariance)}</span></div>)}
        </section>
      </div>
      <section className="analytics-panel"><div className="panel-header"><div><h2>{t('analytics.kitchenPerformance')}</h2><span>{t('analytics.minutesByStation')}</span></div><ShowAllToggle isShowingAll={Boolean(expanded.kitchen)} total={data.kitchen.length} visibleCount={limit} onToggle={() => toggle('kitchen')} /></div>
        <div className="table-card"><table><thead><tr><th>{t('analytics.station')}</th><th>{t('kitchen.tickets')}</th><th>{t('analytics.queue')}</th><th>{t('analytics.prep')}</th><th>{t('analytics.total')}</th><th>{t('analytics.late')}</th></tr></thead><tbody>
          {kitchenRows.map((item) => <tr key={item.stationId}><td><strong>{item.stationName}</strong></td><td>{item.ticketCount}</td><td>{item.avgQueueTimeMinutes ?? '—'}</td><td>{item.avgPrepTimeMinutes ?? '—'}</td><td>{item.avgTotalTimeMinutes ?? '—'}</td><td>{item.lateTicketCount}</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}
