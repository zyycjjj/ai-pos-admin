import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import { createCampaign, fetchCampaigns, fetchCustomerSegments, updateCampaignStatus, type CampaignInput } from '../services/adminApi';
import type { CampaignDraft } from '../types/admin';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function CampaignsPage() {
  const { t } = useAdminI18n();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'campaigns'], queryFn: fetchCampaigns });
  const segmentsQuery = useQuery({ queryKey: ['admin', 'customer-segments'], queryFn: fetchCustomerSegments });
  const [statusFilter, setStatusFilter] = useState<'ALL' | CampaignDraft['status']>('ALL');
  const [form, setForm] = useState<CampaignInput>({ name: '', type: 'ORDER_DISCOUNT', discountType: 'percentage', discountValue: 10, stackingPolicy: 'BEST_ONLY', customerEligibilityMode: 'ALL_CUSTOMERS' });

  const visibleCampaigns = useMemo(() => (query.data ?? []).filter((campaign) => statusFilter === 'ALL' || campaign.status === statusFilter), [query.data, statusFilter]);
  const saveCampaign = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      setForm({ name: '', type: 'ORDER_DISCOUNT', discountType: 'percentage', discountValue: 10, stackingPolicy: 'BEST_ONLY', customerEligibilityMode: 'ALL_CUSTOMERS' });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignDraft['status'] }) => updateCampaignStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">{t('campaigns.eyebrow')}</span>
          <h1>{t('campaigns.title')}</h1>
        </div>
      </div>

      <div className="table-card">
        <div className="form-grid">
          <label>{t('campaigns.name')}<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>{t('campaigns.type')}<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CampaignInput['type'] }))}>
            {['ORDER_DISCOUNT', 'THRESHOLD_DISCOUNT', 'ITEM_DISCOUNT', 'PROMO_CODE'].map((type) => <option key={type} value={type}>{formatStatusLabel(t, type)}</option>)}
          </select></label>
          <label>{t('campaigns.discountType')}<select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as CampaignInput['discountType'] }))}>
            <option value="percentage">{t('campaigns.percentage')}</option>
            <option value="fixed_amount">{t('campaigns.fixed')}</option>
          </select></label>
          <label>{t('campaigns.discountValue')}<input type="number" min="0" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: Number(event.target.value) || 0 }))} /></label>
          <label>{t('campaigns.threshold')}<input type="number" min="0" value={form.thresholdAmount ?? ''} onChange={(event) => setForm((current) => ({ ...current, thresholdAmount: event.target.value ? Number(event.target.value) : undefined }))} /></label>
          <label>{t('campaigns.promoCode')}<input value={form.promoCode ?? ''} onChange={(event) => setForm((current) => ({ ...current, promoCode: event.target.value }))} /></label>
          <label>{t('campaigns.category')}<input value={form.categoryName ?? ''} onChange={(event) => setForm((current) => ({ ...current, categoryName: event.target.value }))} /></label>
          <label>{t('campaigns.customerEligibility')}<select value={form.customerEligibilityMode} onChange={(event) => setForm((current) => ({ ...current, customerEligibilityMode: event.target.value as CampaignInput['customerEligibilityMode'], targetCustomerSegmentId: event.target.value === 'SEGMENT_ONLY' ? current.targetCustomerSegmentId : undefined }))}>
            <option value="ALL_CUSTOMERS">{t('campaigns.eligibilityAll')}</option>
            <option value="CUSTOMER_ONLY">{t('campaigns.eligibilityCustomer')}</option>
            <option value="SEGMENT_ONLY">{t('campaigns.eligibilitySegment')}</option>
          </select></label>
          <label>{t('campaigns.targetSegment')}<select disabled={form.customerEligibilityMode !== 'SEGMENT_ONLY'} value={form.targetCustomerSegmentId ?? ''} onChange={(event) => setForm((current) => ({ ...current, targetCustomerSegmentId: event.target.value || undefined }))}>
            <option value="">{t('campaigns.noSegment')}</option>
            {(segmentsQuery.data ?? []).filter((segment) => segment.status === 'ACTIVE').map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}
          </select></label>
          <label>{t('campaigns.stacking')}<select value={form.stackingPolicy} onChange={(event) => setForm((current) => ({ ...current, stackingPolicy: event.target.value as CampaignInput['stackingPolicy'] }))}>
            <option value="BEST_ONLY">{t('campaigns.bestOnly')}</option>
            <option value="STACKABLE">{t('campaigns.stackable')}</option>
            <option value="EXCLUSIVE">{t('campaigns.exclusive')}</option>
          </select></label>
          <button className="primary-button" type="button" disabled={!form.name.trim() || saveCampaign.isPending} onClick={() => saveCampaign.mutate(form)}>{t('common.create')}</button>
        </div>
      </div>

      <div className="table-card">
        <label>
          {t('campaigns.statusFilter')}
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="ALL">{t('common.all')}</option>
            {['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED'].map((status) => <option key={status} value={status}>{formatStatusLabel(t, status)}</option>)}
          </select>
        </label>
      </div>

      {query.isLoading ? <LoadingState title={t('campaigns.loading')} /> : null}
      {query.isError ? <ErrorState title={t('campaigns.errorTitle')} description={t('common.errorDescription')} /> : null}
      {visibleCampaigns.length === 0 && !query.isLoading ? <EmptyState title={t('campaigns.emptyTitle')} description={t('campaigns.emptyBody')} /> : null}
      {visibleCampaigns.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>{t('campaigns.name')}</th>
                <th>{t('campaigns.type')}</th>
                <th>{t('campaigns.discount')}</th>
                <th>{t('campaigns.code')}</th>
                <th>{t('campaigns.customerEligibility')}</th>
                <th>{t('campaigns.usage')}</th>
                <th>{t('campaigns.discountTotal')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleCampaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>{campaign.name}</td>
                  <td>{formatStatusLabel(t, campaign.type)}</td>
                  <td>{campaign.discountType === 'fixed_amount' ? money.format(campaign.discountValue ?? 0) : `${campaign.discountValue ?? 0}%`}</td>
                  <td>{campaign.promoCode ?? '-'}</td>
                  <td>{formatCustomerEligibility(t, campaign, segmentsQuery.data ?? [])}</td>
                  <td>{campaign.usageCount}{campaign.usageLimit ? ` / ${campaign.usageLimit}` : ''}</td>
                  <td>{money.format(campaign.discountTotal)}</td>
                  <td><span className="status-pill">{formatStatusLabel(t, campaign.status)}</span></td>
                  <td>
                    <button className="secondary-button" type="button" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: campaign.id, status: 'ACTIVE' })}>{t('campaigns.activate')}</button>
                    <button className="secondary-button" type="button" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: campaign.id, status: 'PAUSED' })}>{t('campaigns.pause')}</button>
                    <button className="secondary-button" type="button" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: campaign.id, status: 'ARCHIVED' })}>{t('campaigns.archive')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function formatCustomerEligibility(t: (key: string) => string, campaign: CampaignDraft, segments: Array<{ id: string; name: string }>) {
  if (campaign.customerEligibilityMode === 'CUSTOMER_ONLY') return t('campaigns.eligibilityCustomer');
  if (campaign.customerEligibilityMode === 'SEGMENT_ONLY') {
    const segment = segments.find((item) => item.id === campaign.targetCustomerSegmentId);
    return segment ? `${t('campaigns.eligibilitySegment')}: ${segment.name}` : t('campaigns.eligibilitySegment');
  }
  return t('campaigns.eligibilityAll');
}
