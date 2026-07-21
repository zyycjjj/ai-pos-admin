import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import {
  downloadReportCsv,
  fetchCampaignReport,
  fetchCustomerReport,
  fetchPaymentReport,
  fetchProductReport,
  fetchReportSummary,
  fetchShiftReport,
  type ReportFilters,
} from '../services/adminApi';
import type { ReportPreset } from '../types/admin';

const presets: Array<[ReportPreset, string]> = [
  ['today', 'reports.preset.today'],
  ['yesterday', 'reports.preset.yesterday'],
  ['last7days', 'reports.preset.last7days'],
  ['thisMonth', 'reports.preset.thisMonth'],
  ['lastMonth', 'reports.preset.lastMonth'],
  ['custom', 'reports.preset.custom'],
];

export function ReportsPage() {
  const { t } = useAdminI18n();
  const [preset, setPreset] = useState<ReportPreset>('today');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const filters = useMemo<ReportFilters>(() => ({ preset, from: preset === 'custom' ? from : undefined, to: preset === 'custom' ? to : undefined, timezone: 'Asia/Shanghai', limit: 20 }), [from, preset, to]);
  const summary = useQuery({ queryKey: ['reports', 'summary', filters], queryFn: () => fetchReportSummary(filters) });
  const products = useQuery({ queryKey: ['reports', 'products', filters], queryFn: () => fetchProductReport(filters) });
  const customers = useQuery({ queryKey: ['reports', 'customers', filters], queryFn: () => fetchCustomerReport(filters) });
  const campaigns = useQuery({ queryKey: ['reports', 'campaigns', filters], queryFn: () => fetchCampaignReport(filters) });
  const payments = useQuery({ queryKey: ['reports', 'payments', filters], queryFn: () => fetchPaymentReport(filters) });
  const shifts = useQuery({ queryKey: ['reports', 'shifts', filters], queryFn: () => fetchShiftReport(filters) });
  const money = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: summary.data?.currency ?? 'USD' }), [summary.data?.currency]);

  if (summary.isLoading) return <LoadingState title={t('reports.loading')} />;
  if (summary.isError || !summary.data) return <ErrorState title={t('reports.errorTitle')} description={t('common.errorDescription')} />;

  const cards = [
    ['reports.netSales', money.format(summary.data.sales.netSales)],
    ['reports.grossSales', money.format(summary.data.sales.grossSales)],
    ['reports.refunds', money.format(summary.data.sales.refundTotal)],
    ['reports.orders', String(summary.data.sales.orderCount)],
    ['reports.averageOrderValue', money.format(summary.data.sales.averageOrderValue)],
    ['reports.discounts', money.format(summary.data.sales.discountTotal)],
    ['reports.newCustomers', String(summary.data.customers.newCustomers)],
    ['reports.repeatCustomers', String(summary.data.customers.repeatCustomers)],
    ['reports.campaignDiscount', money.format(summary.data.campaigns.campaignDiscountTotal)],
    ['reports.cashVariance', money.format(summary.data.shifts.cashVarianceTotal)],
  ] as const;

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">{t('reports.eyebrow')} · {summary.data.range.timezone}</span>
          <h1>{t('reports.title')}</h1>
        </div>
        <span className="analytics-period">{summary.data.range.from} — {summary.data.range.to}</span>
      </div>

      <div className="analytics-filter-bar">
        <div className="segmented-control">
          {presets.map(([value, labelKey]) => <button className={preset === value ? 'active' : ''} key={value} type="button" onClick={() => setPreset(value)}>{t(labelKey)}</button>)}
        </div>
        {preset === 'custom' ? (
          <>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </>
        ) : null}
        <button className="primary-button" type="button" onClick={() => void downloadReportCsv('summary', filters)}>{t('reports.exportSummary')}</button>
      </div>

      <div className="metrics-grid">
        {cards.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{t(label)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <ReportTable title={t('reports.productRanking')} exportLabel={t('reports.exportCsv')} onExport={() => void downloadReportCsv('products', filters)} loading={products.isLoading} empty={!products.data?.items.length}>
        <thead><tr><th>{t('reports.product')}</th><th>{t('reports.quantitySold')}</th><th>{t('reports.grossSales')}</th><th>{t('reports.netSales')}</th><th>{t('reports.refundAmount')}</th></tr></thead>
        <tbody>{products.data?.items.map((item) => <tr key={item.productId}><td>{item.name}</td><td>{item.quantitySold}</td><td>{money.format(item.grossSales)}</td><td>{money.format(item.netSales)}</td><td>{money.format(item.refundAmount)}</td></tr>)}</tbody>
      </ReportTable>

      <ReportTable title={t('reports.customerRanking')} exportLabel={t('reports.exportCsv')} onExport={() => void downloadReportCsv('customers', filters)} loading={customers.isLoading} empty={!customers.data?.items.length}>
        <thead><tr><th>{t('reports.customer')}</th><th>{t('reports.orders')}</th><th>{t('reports.netSales')}</th><th>{t('reports.pointsEarned')}</th><th>{t('reports.lastOrderAt')}</th></tr></thead>
        <tbody>{customers.data?.items.map((item) => <tr key={item.customerId}><td>{item.name ?? item.phone ?? item.customerId}</td><td>{item.orderCount}</td><td>{money.format(item.netSales)}</td><td>{item.pointsEarned}</td><td>{item.lastOrderAt ? new Date(item.lastOrderAt).toLocaleString() : '-'}</td></tr>)}</tbody>
      </ReportTable>

      <ReportTable title={t('reports.campaignPerformance')} exportLabel={t('reports.exportCsv')} onExport={() => void downloadReportCsv('campaigns', filters)} loading={campaigns.isLoading} empty={!campaigns.data?.items.length}>
        <thead><tr><th>{t('reports.campaign')}</th><th>{t('reports.type')}</th><th>{t('reports.customerEligibility')}</th><th>{t('reports.usage')}</th><th>{t('reports.discountTotal')}</th></tr></thead>
        <tbody>{campaigns.data?.items.map((item) => <tr key={item.campaignId}><td>{item.name}</td><td>{formatStatusLabel(t, item.type)}</td><td>{formatStatusLabel(t, item.customerEligibilityMode)}{item.targetSegmentName ? ` · ${item.targetSegmentName}` : ''}</td><td>{item.usageCount}</td><td>{money.format(item.discountTotal)}</td></tr>)}</tbody>
      </ReportTable>

      <ReportTable title={t('reports.paymentMethods')} exportLabel={t('reports.exportCsv')} onExport={() => void downloadReportCsv('payments', filters)} loading={payments.isLoading} empty={!payments.data?.items.length}>
        <thead><tr><th>{t('reports.method')}</th><th>{t('reports.orders')}</th><th>{t('reports.paymentAmount')}</th><th>{t('reports.refundAmount')}</th><th>{t('reports.netAmount')}</th></tr></thead>
        <tbody>{payments.data?.items.map((item) => <tr key={item.method}><td>{formatStatusLabel(t, item.method)}</td><td>{item.orderCount}</td><td>{money.format(item.paymentAmount)}</td><td>{money.format(item.refundAmount)}</td><td>{money.format(item.netAmount)}</td></tr>)}</tbody>
      </ReportTable>

      <ReportTable title={t('reports.shiftReconciliation')} exportLabel={t('reports.exportCsv')} onExport={() => void downloadReportCsv('shifts', filters)} loading={shifts.isLoading} empty={!shifts.data?.items.length}>
        <thead><tr><th>{t('reports.openedAt')}</th><th>{t('reports.openedBy')}</th><th>{t('reports.cashExpected')}</th><th>{t('reports.cashActual')}</th><th>{t('reports.cashVariance')}</th></tr></thead>
        <tbody>{shifts.data?.items.map((item) => <tr key={item.shiftId}><td>{new Date(item.openedAt).toLocaleString()}</td><td>{item.openedBy ?? '-'}</td><td>{money.format(item.cashExpected)}</td><td>{item.cashActual === null ? '-' : money.format(item.cashActual)}</td><td>{item.cashVariance === null ? '-' : money.format(item.cashVariance)}</td></tr>)}</tbody>
      </ReportTable>
    </section>
  );
}

function ReportTable({ children, empty, exportLabel, loading, onExport, title }: { children: ReactNode; empty: boolean; exportLabel: string; loading: boolean; onExport: () => void; title: string }) {
  return (
    <div className="table-card report-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <button className="secondary-button" type="button" onClick={onExport}>{exportLabel}</button>
      </div>
      {loading ? <LoadingState title={title} /> : empty ? <EmptyState title={title} description="-" /> : <table>{children}</table>}
    </div>
  );
}
