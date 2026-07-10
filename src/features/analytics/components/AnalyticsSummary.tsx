import type { AnalyticsContext } from '../../../types/admin';

const percent = (value: number | boolean | null | undefined) => typeof value === 'number' ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : '—';

export function AnalyticsSummary({ data }: { data: AnalyticsContext }) {
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.store.currency });
  const cards = [
    { label: 'Net sales', value: money.format(data.overview.netSales), change: data.comparison.netSalesChangePercent },
    { label: 'Gross sales', value: money.format(data.overview.grossSales), change: data.comparison.grossSalesChangePercent },
    { label: 'Refunds', value: money.format(data.overview.refundTotal), change: data.comparison.refundTotalChangePercent },
    { label: 'Orders', value: String(data.overview.orderCount), change: data.comparison.orderCountChangePercent },
    { label: 'Average ticket', value: money.format(data.overview.averageTicket), change: data.comparison.averageTicketChangePercent },
  ];
  return (
    <>
      <div className="analytics-metric-grid">
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small className={typeof card.change === 'number' && card.change < 0 ? 'trend down' : 'trend'}>{percent(card.change)} vs comparison</small>
          </article>
        ))}
      </div>
      {data.signals.length > 0 && (
        <div className="signal-strip">
          {data.signals.slice(0, 5).map((signal, index) => (
            <span className={`signal ${signal.severity.toLowerCase()}`} key={`${signal.type}-${signal.label ?? index}`}>
              {signal.label ? `${signal.label}: ` : ''}{signal.type.replaceAll('_', ' ').toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

