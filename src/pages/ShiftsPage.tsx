import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import { fetchBusinessDays, fetchShifts } from '../services/adminApi';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ShiftsPage() {
  const { t } = useAdminI18n();
  const query = useQuery({ queryKey: ['admin', 'shifts'], queryFn: fetchShifts });
  const businessDaysQuery = useQuery({ queryKey: ['admin', 'business-days'], queryFn: fetchBusinessDays });
  const pagination = usePagination(query.data, 10);

  if (query.isLoading) {
    return <LoadingState title={t('shifts.loading')} />;
  }
  if (query.isError || !query.data) {
    return <ErrorState title={t('shifts.errorTitle')} description={t('common.errorDescription')} />;
  }

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">{t('shifts.eyebrow')}</span>
        <h1>{t('shifts.title')}</h1>
      </div>

      <h2>{t('businessDay.title')}</h2>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{t('businessDay.date')}</th>
              <th>{t('common.status')}</th>
              <th>{t('businessDay.orders')}</th>
              <th>{t('businessDay.gross')}</th>
              <th>{t('businessDay.refunds')}</th>
              <th>{t('businessDay.net')}</th>
              <th>{t('shifts.opened')}</th>
              <th>{t('shifts.closed')}</th>
            </tr>
          </thead>
          <tbody>
            {(businessDaysQuery.data ?? []).map((day) => (
              <tr key={day.id}>
                <td>{day.businessDate}</td>
                <td><span className={`status-pill ${day.status === 'OPEN' ? 'success' : ''}`}>{formatStatusLabel(t, day.status)}</span></td>
                <td>{day.orderCount}</td>
                <td>{money.format(day.grossSales)}</td>
                <td>{money.format(day.refundTotal)}</td>
                <td>{money.format(day.netSales)}</td>
                <td>{new Date(day.openedAt).toLocaleString()}</td>
                <td>{day.closedAt ? new Date(day.closedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!businessDaysQuery.isLoading && (businessDaysQuery.data ?? []).length === 0 ? <EmptyState title={t('businessDay.empty')} /> : null}
      </div>

      {query.data.length === 0 ? <EmptyState title={t('shifts.emptyTitle')} /> : null}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{t('shifts.staff')}</th>
              <th>{t('common.status')}</th>
              <th>{t('shifts.opened')}</th>
              <th>{t('shifts.closed')}</th>
              <th>{t('shifts.opening')}</th>
              <th>{t('shifts.expected')}</th>
              <th>{t('shifts.actual')}</th>
              <th>{t('shifts.variance')}</th>
            </tr>
          </thead>
          <tbody>
            {pagination.pagedItems.map((shift) => (
              <tr key={shift.id}>
                <td>{shift.staffName}</td>
                <td>
                  <span className={`status-pill ${shift.status === 'OPEN' ? 'success' : ''}`}>{formatStatusLabel(t, shift.status)}</span>
                </td>
                <td>{new Date(shift.openedAt).toLocaleString()}</td>
                <td>{shift.closedAt ? new Date(shift.closedAt).toLocaleString() : '-'}</td>
                <td>{money.format(shift.openingCash)}</td>
                <td>{money.format(shift.expectedCash)}</td>
                <td>{shift.actualCash === null ? '-' : money.format(shift.actualCash)}</td>
                <td>{shift.variance === null ? '-' : money.format(shift.variance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </div>
    </section>
  );
}
