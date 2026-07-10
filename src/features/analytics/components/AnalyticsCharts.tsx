import type { AnalyticsContext } from '../../../types/admin';

const Bar = ({ label, value, max, suffix = '' }: { label: string; value: number; max: number; suffix?: string }) => (
  <div className="analytics-bar-row">
    <span>{label}</span>
    <div><i style={{ width: `${max === 0 ? 0 : Math.max(2, (value / max) * 100)}%` }} /></div>
    <strong>{value.toFixed(value % 1 === 0 ? 0 : 1)}{suffix}</strong>
  </div>
);

export function AnalyticsCharts({ data }: { data: AnalyticsContext }) {
  const peakHours = [...data.hourly].sort((a, b) => b.netSales - a.netSales).slice(0, 8).sort((a, b) => a.hour - b.hour);
  const maxDaily = Math.max(0, ...data.daily.map((item) => item.netSales));
  const maxHourly = Math.max(0, ...peakHours.map((item) => item.netSales));
  return (
    <div className="analytics-two-column">
      <section className="analytics-panel">
        <div className="panel-header"><h2>Daily net sales</h2><span>{data.period.from} — {data.period.to}</span></div>
        {data.daily.every((item) => item.netSales === 0) ? <p className="analytics-empty">No sales in this period.</p> : data.daily.map((item) => <Bar key={item.date} label={item.date.slice(5)} value={item.netSales} max={maxDaily} />)}
      </section>
      <section className="analytics-panel">
        <div className="panel-header"><h2>Peak hours</h2><span>Store local time</span></div>
        {peakHours.every((item) => item.netSales === 0) ? <p className="analytics-empty">No hourly sales yet.</p> : peakHours.map((item) => <Bar key={item.hour} label={`${String(item.hour).padStart(2, '0')}:00`} value={item.netSales} max={maxHourly} />)}
      </section>
    </div>
  );
}

