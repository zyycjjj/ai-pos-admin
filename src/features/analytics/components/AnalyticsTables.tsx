import type { AnalyticsContext, AnalyticsModifierMetric } from '../../../types/admin';

const delta = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export function AnalyticsTables({ data, modifiers }: { data: AnalyticsContext; modifiers: AnalyticsModifierMetric[] }) {
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.store.currency });
  return (
    <div className="analytics-sections">
      <section className="analytics-panel">
        <div className="panel-header"><h2>Product performance</h2><span>Revenue · units · growth</span></div>
        <div className="table-card"><table><thead><tr><th>Product</th><th>Units</th><th>Net sales</th><th>Change</th><th>Refunds</th></tr></thead><tbody>
          {data.topProducts.map((item) => <tr key={item.productId}><td><strong>{item.name}</strong><small>{item.category}</small></td><td>{item.unitsSold}</td><td>{money.format(item.netSales)}</td><td><span className={item.changePercent !== null && item.changePercent < 0 ? 'trend down' : 'trend'}>{delta(item.changePercent)}</span></td><td>{money.format(item.refundAmount)}</td></tr>)}
        </tbody></table></div>
      </section>
      <div className="analytics-two-column">
        <section className="analytics-panel"><div className="panel-header"><h2>Categories</h2><span>Revenue share</span></div>
          {data.categories.map((item) => <div className="analytics-list-row" key={item.name}><span><strong>{item.name}</strong><small>{item.unitsSold} units</small></span><span>{money.format(item.netSales)} · {item.sharePercent.toFixed(1)}% · {delta(item.changePercent)}</span></div>)}
        </section>
        <section className="analytics-panel"><div className="panel-header"><h2>Payment mix</h2><span>Payment lines</span></div>
          {data.payments.map((item) => <div className="analytics-list-row" key={item.method}><strong>{item.method}</strong><span>{money.format(item.amount)} · {item.sharePercent.toFixed(1)}%</span></div>)}
        </section>
      </div>
      <section className="analytics-panel"><div className="panel-header"><h2>Modifier performance</h2><span>Eligible-item attach rate</span></div>
        <div className="table-card"><table><thead><tr><th>Modifier</th><th>Selections</th><th>Eligible items</th><th>Attach rate</th><th>Revenue</th></tr></thead><tbody>
          {modifiers.map((item) => <tr key={item.optionId}><td><strong>{item.name}</strong><small>{item.groupName}</small></td><td>{item.selectionCount}</td><td>{item.eligibleProductItemCount}</td><td>{(item.attachRate * 100).toFixed(1)}%</td><td>{money.format(item.revenueContribution)}</td></tr>)}
        </tbody></table></div>
      </section>
      <div className="analytics-two-column">
        <section className="analytics-panel"><div className="panel-header"><h2>Refund intelligence</h2><span>{(data.refunds.refundRate * 100).toFixed(1)}% of gross</span></div>
          {data.refunds.topReasons.map((item) => <div className="analytics-list-row" key={item.reason}><span><strong>{item.reason}</strong><small>{item.count} refunds</small></span><span>{money.format(item.amount)}</span></div>)}
        </section>
        <section className="analytics-panel"><div className="panel-header"><h2>Shift performance</h2><span>Cash variance</span></div>
          {data.shifts.map((item) => <div className="analytics-list-row" key={item.shiftId}><span><strong>{item.staffName}</strong><small>{item.orderCount} orders · {money.format(item.netSales)}</small></span><span>{item.cashVariance === null ? 'Open' : money.format(item.cashVariance)}</span></div>)}
        </section>
      </div>
      <section className="analytics-panel"><div className="panel-header"><h2>Kitchen performance</h2><span>Minutes by station</span></div>
        <div className="table-card"><table><thead><tr><th>Station</th><th>Tickets</th><th>Queue</th><th>Prep</th><th>Total</th><th>Late</th></tr></thead><tbody>
          {data.kitchen.map((item) => <tr key={item.stationId}><td><strong>{item.stationName}</strong></td><td>{item.ticketCount}</td><td>{item.avgQueueTimeMinutes ?? '—'}</td><td>{item.avgPrepTimeMinutes ?? '—'}</td><td>{item.avgTotalTimeMinutes ?? '—'}</td><td>{item.lateTicketCount}</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}

