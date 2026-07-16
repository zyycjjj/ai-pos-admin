import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import { fetchOrders } from '../services/adminApi';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function OrdersPage() {
  const { t } = useAdminI18n();
  const query = useQuery({ queryKey: ['admin', 'orders'], queryFn: fetchOrders });
  const pagination = usePagination(query.data, 10);

  if (query.isLoading) {
    return <LoadingState title={t('orders.loading')} />;
  }
  if (query.isError || !query.data) {
    return <ErrorState title={t('orders.errorTitle')} description={t('common.errorDescription')} />;
  }

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">{t('orders.eyebrow')}</span>
        <h1>{t('orders.title')}</h1>
      </div>

      {query.data.length === 0 ? <EmptyState title={t('orders.emptyTitle')} description={t('orders.emptyBody')} /> : null}
      {query.data.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>{t('orders.order')}</th>
                <th>{t('orders.type')}</th>
                <th>{t('common.created')}</th>
                <th>{t('orders.items')}</th>
                <th>{t('orders.breakdown')}</th>
                <th>{t('orders.total')}</th>
                <th>{t('common.status')}</th>
                <th>{t('orders.payment')}</th>
                <th>{t('orders.print')}</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pagedItems.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.orderNumber}</strong></td>
                  <td>{formatStatusLabel(t, order.orderType)}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td>
                    <div>{t('orders.subtotal')}: {money.format(order.subtotal)}</div>
                    <div>{t('orders.discount')}: {money.format(order.adjustment)}</div>
                    <div>{t('orders.tax')}: {money.format(order.tax)}</div>
                    <div>{t('orders.service')}: {money.format(order.serviceCharge)}</div>
                    <div>{t('orders.tip')}: {money.format(order.tip)}</div>
                  </td>
                  <td>{money.format(order.total)}</td>
                  <td><span className="status-pill">{formatStatusLabel(t, order.status)}</span></td>
                  <td>{order.paymentMethod ?? '-'}</td>
                  <td>{formatStatusLabel(t, order.printStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </div>
      ) : null}
    </section>
  );
}
