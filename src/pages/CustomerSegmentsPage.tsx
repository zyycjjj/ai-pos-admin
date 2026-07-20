import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import {
  createCustomerSegment,
  evaluateCustomerSegment,
  fetchCustomerSegmentCustomers,
  fetchCustomerSegments,
  updateCustomerSegment,
  updateCustomerSegmentStatus,
  type CustomerSegmentInput,
} from '../services/adminApi';
import type { CustomerSegment } from '../types/admin';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const ruleKeys: Array<keyof CustomerSegmentInput['ruleJson']> = ['minOrderCount', 'minTotalSpend', 'lastOrderBeforeDays', 'lastOrderWithinDays', 'minPointsBalance'];

export function CustomerSegmentsPage() {
  const { t } = useAdminI18n();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<CustomerSegment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerSegmentInput>({ name: '', description: '', ruleJson: { minOrderCount: 1, minTotalSpend: 50 } });
  const segmentsQuery = useQuery({ queryKey: ['admin', 'customer-segments'], queryFn: fetchCustomerSegments });
  const customersQuery = useQuery({
    queryKey: ['admin', 'customer-segments', selected?.id, 'customers'],
    queryFn: () => fetchCustomerSegmentCustomers(selected!.id),
    enabled: Boolean(selected?.id),
  });
  const createMutation = useMutation({
    mutationFn: createCustomerSegment,
    onSuccess: (segment) => {
      setSelected(segment);
      setEditingId(null);
      setForm({ name: '', description: '', ruleJson: { minOrderCount: 1, minTotalSpend: 50 } });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customer-segments'] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerSegmentInput }) => updateCustomerSegment(id, input),
    onSuccess: (segment) => {
      setSelected(segment);
      setEditingId(null);
      setForm({ name: '', description: '', ruleJson: { minOrderCount: 1, minTotalSpend: 50 } });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customer-segments'] });
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerSegment['status'] }) => updateCustomerSegmentStatus(id, status),
    onSuccess: (segment) => {
      setSelected((current) => (current?.id === segment.id ? segment : current));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customer-segments'] });
    },
  });
  const evaluateMutation = useMutation({
    mutationFn: evaluateCustomerSegment,
    onSuccess: (_, segmentId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customer-segments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customer-segments', segmentId, 'customers'] });
    },
  });
  const segments = segmentsQuery.data ?? [];

  function updateRule(key: keyof CustomerSegmentInput['ruleJson'], value: string) {
    setForm((current) => ({
      ...current,
      ruleJson: {
        ...current.ruleJson,
        [key]: value === '' ? undefined : Number(value),
      },
    }));
  }

  function editSegment(segment: CustomerSegment) {
    setSelected(segment);
    setEditingId(segment.id);
    setForm({ name: segment.name, description: segment.description ?? '', ruleJson: segment.ruleJson });
  }

  function submitForm() {
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">{t('segments.eyebrow')}</span>
          <h1>{t('segments.title')}</h1>
        </div>
      </div>

      <div className="table-card">
        <div className="form-grid">
          <label>{t('segments.name')}<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>{t('segments.description')}<input value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
          {ruleKeys.map((key) => (
            <label key={key}>{t(`segments.rule.${key}`)}<input type="number" min="0" value={form.ruleJson[key] ?? ''} onChange={(event) => updateRule(key, event.target.value)} /></label>
          ))}
          <button className="primary-button" type="button" disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending} onClick={submitForm}>{editingId ? t('segments.update') : t('segments.create')}</button>
          {editingId ? <button className="secondary-button" type="button" onClick={() => { setEditingId(null); setForm({ name: '', description: '', ruleJson: { minOrderCount: 1, minTotalSpend: 50 } }); }}>{t('common.cancel')}</button> : null}
        </div>
      </div>

      {segmentsQuery.isLoading ? <LoadingState title={t('segments.loading')} /> : null}
      {segmentsQuery.isError ? <ErrorState title={t('segments.errorTitle')} description={t('common.errorDescription')} /> : null}
      {!segmentsQuery.isLoading && segments.length === 0 ? <EmptyState title={t('segments.emptyTitle')} description={t('segments.emptyBody')} /> : null}

      {segments.length > 0 ? (
        <div className="split-grid">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>{t('segments.name')}</th>
                  <th>{t('segments.members')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.id} className={selected?.id === segment.id ? 'selected-row' : ''} onClick={() => setSelected(segment)}>
                    <td>{segment.name}</td>
                    <td>{segment.memberCount}</td>
                    <td><span className="status-pill">{formatStatusLabel(t, segment.status)}</span></td>
                    <td>
                      <button className="secondary-button" type="button" disabled={evaluateMutation.isPending} onClick={(event) => { event.stopPropagation(); evaluateMutation.mutate(segment.id); }}>{t('segments.evaluate')}</button>
                      <button className="secondary-button" type="button" onClick={(event) => { event.stopPropagation(); editSegment(segment); }}>{t('common.edit')}</button>
                      <button className="secondary-button" type="button" disabled={statusMutation.isPending} onClick={(event) => { event.stopPropagation(); statusMutation.mutate({ id: segment.id, status: 'ACTIVE' }); }}>{t('segments.activate')}</button>
                      <button className="secondary-button" type="button" disabled={statusMutation.isPending} onClick={(event) => { event.stopPropagation(); statusMutation.mutate({ id: segment.id, status: 'PAUSED' }); }}>{t('segments.pause')}</button>
                      <button className="secondary-button" type="button" disabled={statusMutation.isPending} onClick={(event) => { event.stopPropagation(); statusMutation.mutate({ id: segment.id, status: 'ARCHIVED' }); }}>{t('segments.archive')}</button>
                    </td>
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
                    <span className="eyebrow">{t('segments.detail')}</span>
                    <h2>{selected.name}</h2>
                  </div>
                  <span className="status-pill">{formatStatusLabel(t, selected.status)}</span>
                </div>
                <div className="metric-row">
                  <div><span>{t('segments.members')}</span><strong>{selected.memberCount}</strong></div>
                  <div><span>{t('segments.lastEvaluated')}</span><strong>{selected.lastEvaluatedAt ? new Date(selected.lastEvaluatedAt).toLocaleString() : '-'}</strong></div>
                </div>
                <h3>{t('segments.customers')}</h3>
                <div className="compact-list">
                  {customersQuery.data?.map((customer) => (
                    <div key={customer.id}>
                      <strong>{customer.name ?? customer.phone}</strong>
                      <span>{customer.phone} · {t('customers.orders')}: {customer.orderCount} · {money.format(customer.totalSpend)}</span>
                    </div>
                  ))}
                  {customersQuery.data?.length === 0 ? <span>{t('segments.noCustomers')}</span> : null}
                </div>
              </>
            ) : (
              <EmptyState title={t('segments.selectTitle')} description={t('segments.selectBody')} />
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
