import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import {
  createCustomer,
  fetchCustomerOrders,
  fetchCustomerPoints,
  fetchCustomers,
  updateCustomer,
} from '../services/adminApi';
import { useAdminI18n } from '../i18n';
import type { AdminCustomer, CustomerStatus } from '../types/admin';

const statuses: Array<CustomerStatus | ''> = ['', 'ACTIVE', 'INACTIVE', 'BLOCKED'];

export function CustomersPage() {
  const { t } = useAdminI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const customersQuery = useQuery({
    queryKey: ['admin', 'customers', search, status],
    queryFn: () => fetchCustomers({ search: search || undefined, status, take: 50 }),
  });
  const ordersQuery = useQuery({
    queryKey: ['admin', 'customers', selected?.id, 'orders'],
    queryFn: () => fetchCustomerOrders(selected!.id),
    enabled: Boolean(selected),
  });
  const pointsQuery = useQuery({
    queryKey: ['admin', 'customers', selected?.id, 'points'],
    queryFn: () => fetchCustomerPoints(selected!.id),
    enabled: Boolean(selected),
  });
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      setPhone('');
      setName('');
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: CustomerStatus }) => updateCustomer(id, { status: nextStatus }),
    onSuccess: (customer) => {
      setSelected((current) => (current?.id === customer.id ? customer : current));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await createMutation.mutateAsync({ phone, name, note });
    } catch {
      setError(t('customers.createError'));
    }
  }

  const customers = customersQuery.data?.items ?? [];

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">{t('customers.eyebrow')}</span>
        <h1>{t('customers.title')}</h1>
      </div>

      <form className="inline-form" onSubmit={submit}>
        <input placeholder={t('customers.phone')} value={phone} onChange={(event) => setPhone(event.target.value)} required />
        <input placeholder={t('customers.name')} value={name} onChange={(event) => setName(event.target.value)} />
        <input placeholder={t('customers.note')} value={note} onChange={(event) => setNote(event.target.value)} />
        <button className="primary-button" type="submit" disabled={createMutation.isPending}>
          {t('customers.create')}
        </button>
      </form>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="toolbar">
        <input placeholder={t('customers.search')} value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value as CustomerStatus | '')}>
          {statuses.map((item) => (
            <option key={item || 'all'} value={item}>
              {item ? t(`customerStatus.${item}`) : t('common.all')}
            </option>
          ))}
        </select>
      </div>

      {customersQuery.isLoading ? <LoadingState title={t('customers.loading')} /> : null}
      {customersQuery.isError ? <ErrorState title={t('customers.errorTitle')} description={t('common.errorDescription')} /> : null}
      {!customersQuery.isLoading && customers.length === 0 ? <EmptyState title={t('customers.emptyTitle')} description={t('customers.emptyBody')} /> : null}

      {customers.length > 0 ? (
        <div className="split-grid">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>{t('customers.phone')}</th>
                  <th>{t('customers.name')}</th>
                  <th>{t('customers.orders')}</th>
                  <th>{t('customers.totalSpend')}</th>
                  <th>{t('customers.points')}</th>
                  <th>{t('customers.lastOrder')}</th>
                  <th>{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className={selected?.id === customer.id ? 'selected-row' : ''} onClick={() => setSelected(customer)}>
                    <td>{customer.phone}</td>
                    <td>{customer.name ?? '-'}</td>
                    <td>{customer.orderCount}</td>
                    <td>{money(customer.totalSpend)}</td>
                    <td>{customer.pointsBalance}</td>
                    <td>{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleString() : '-'}</td>
                    <td><span className={`status ${customer.status.toLowerCase()}`}>{t(`customerStatus.${customer.status}`)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="detail-panel">
            {selected ? (
              <>
                <div className="detail-header">
                  <div>
                    <span className="eyebrow">{t('customers.detail')}</span>
                    <h2>{selected.name ?? selected.phone}</h2>
                  </div>
                  <select
                    value={selected.status}
                    onChange={(event) => statusMutation.mutate({ id: selected.id, nextStatus: event.target.value as CustomerStatus })}
                  >
                    {statuses.filter(Boolean).map((item) => (
                      <option key={item} value={item}>
                        {t(`customerStatus.${item}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="metric-row">
                  <div><span>{t('customers.totalSpend')}</span><strong>{money(selected.totalSpend)}</strong></div>
                  <div><span>{t('customers.orders')}</span><strong>{selected.orderCount}</strong></div>
                  <div><span>{t('customers.points')}</span><strong>{selected.pointsBalance}</strong></div>
                </div>
                <h3>{t('customers.orderHistory')}</h3>
                <div className="compact-list">
                  {(ordersQuery.data ?? []).slice(0, 6).map((order) => (
                    <div key={order.id}>
                      <strong>{order.orderNumber}</strong>
                      <span>{money(order.total)} · {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</span>
                    </div>
                  ))}
                  {ordersQuery.data?.length === 0 ? <span>{t('customers.noOrders')}</span> : null}
                </div>
                <h3>{t('customers.pointsLedger')}</h3>
                <div className="compact-list">
                  {(pointsQuery.data ?? []).slice(0, 8).map((ledger) => (
                    <div key={ledger.id}>
                      <strong>{ledger.points > 0 ? `+${ledger.points}` : ledger.points}</strong>
                      <span>{ledger.type} · {t('customers.balance')} {ledger.balanceAfter}</span>
                    </div>
                  ))}
                  {pointsQuery.data?.length === 0 ? <span>{t('customers.noPoints')}</span> : null}
                </div>
              </>
            ) : (
              <EmptyState title={t('customers.selectTitle')} description={t('customers.selectBody')} />
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
