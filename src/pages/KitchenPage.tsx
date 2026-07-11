import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChefHat, CirclePause, Play, Plus, X } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import {
  cancelKitchenTicket,
  completeKitchenTicket,
  createKitchenStation,
  fetchKitchenStations,
  fetchKitchenTickets,
  markKitchenTicketReady,
  setDefaultKitchenStation,
  startKitchenTicket,
  updateKitchenStation,
  updateKitchenStationStatus,
} from '../services/adminApi';
import type { KitchenStation, KitchenTicket, KitchenTicketStatus } from '../types/admin';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

type StationForm = {
  id?: string;
  name: string;
  code: string;
  sortOrder: number;
  isDefault: boolean;
};

const emptyStationForm: StationForm = { name: '', code: '', sortOrder: 0, isDefault: false };

export function KitchenPage() {
  const queryClient = useQueryClient();
  const { t } = useAdminI18n();
  const [stationForm, setStationForm] = useState<StationForm>(emptyStationForm);
  const [filters, setFilters] = useState<{ stationId?: string; status?: KitchenTicketStatus | '' }>({});
  const stationsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'stations'], queryFn: fetchKitchenStations });
  const ticketsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'tickets', filters], queryFn: () => fetchKitchenTickets({ ...filters, take: 100 }) });
  const ticketPagination = usePagination(ticketsQuery.data, 10);
  const activeStations = useMemo(() => (stationsQuery.data ?? []).filter((station) => station.status === 'ACTIVE'), [stationsQuery.data]);

  const refreshStations = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'kitchen', 'stations'] });
  const refreshTickets = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'kitchen', 'tickets'] });
  const saveStation = useMutation({
    mutationFn: () =>
      stationForm.id
        ? updateKitchenStation(stationForm.id, stationForm)
        : createKitchenStation(stationForm),
    onSuccess: () => {
      setStationForm(emptyStationForm);
      refreshStations();
    },
  });
  const updateStationStatus = useMutation({
    mutationFn: ({ station, status }: { station: KitchenStation; status: 'ACTIVE' | 'INACTIVE' }) => updateKitchenStationStatus(station.id, status),
    onSuccess: refreshStations,
  });
  const setDefault = useMutation({ mutationFn: (id: string) => setDefaultKitchenStation(id), onSuccess: refreshStations });
  const ticketAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'ready' | 'complete' | 'cancel' }) => {
      if (action === 'start') return startKitchenTicket(id);
      if (action === 'ready') return markKitchenTicketReady(id);
      if (action === 'complete') return completeKitchenTicket(id);
      return cancelKitchenTicket(id, 'Cancelled from Admin Kitchen');
    },
    onSuccess: refreshTickets,
  });

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">{t('kitchen.eyebrow')}</span>
          <h1>{t('kitchen.title')}</h1>
        </div>
      </div>

      <div className="ops-grid">
        <div className="table-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t('kitchen.routing')}</span>
              <h2>{t('kitchen.stations')}</h2>
            </div>
            <ChefHat size={20} />
          </div>
          <div className="modifier-create kitchen-station-form">
            <input
              placeholder={t('kitchen.stationName')}
              value={stationForm.name}
              onChange={(event) => setStationForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              placeholder={t('kitchen.code')}
              value={stationForm.code}
              onChange={(event) => setStationForm((current) => ({ ...current, code: event.target.value }))}
            />
            <input
              type="number"
              min="0"
              value={stationForm.sortOrder}
              onChange={(event) => setStationForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
            />
            <label className="compact-check">
              <input
                type="checkbox"
                checked={stationForm.isDefault}
                onChange={(event) => setStationForm((current) => ({ ...current, isDefault: event.target.checked }))}
              />
              {t('kitchen.default')}
            </label>
            <button className="primary-button icon-button" type="button" onClick={() => saveStation.mutate()} disabled={saveStation.isPending}>
              <Plus size={18} /> {stationForm.id ? t('common.save') : t('common.add')}
            </button>
          </div>
          {saveStation.isError ? <p className="form-error">{t('kitchen.saveStationError')}</p> : null}
          {stationsQuery.isLoading ? <LoadingState title={t('kitchen.loadingStations')} /> : null}
          {stationsQuery.isError ? <ErrorState title={t('kitchen.stationsError')} description={t('common.errorDescription')} /> : null}
          <div className="station-list">
            {(stationsQuery.data ?? []).map((station) => (
              <div className="station-row" key={station.id}>
                <div>
                  <strong>{station.name}</strong>
                  <small>{station.code} · sort {station.sortOrder}</small>
                </div>
                <span className={`status-pill ${station.status === 'ACTIVE' ? 'success' : ''}`}>{formatStatusLabel(t, station.status)}</span>
                {station.isDefault ? <span className="status-pill success">{t('common.default')}</span> : null}
                <div className="table-actions">
                  <button className="secondary-button" type="button" onClick={() => setStationForm({ id: station.id, name: station.name, code: station.code, sortOrder: station.sortOrder, isDefault: station.isDefault })}>
                    {t('common.edit')}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setDefault.mutate(station.id)} disabled={station.status !== 'ACTIVE' || station.isDefault}>
                    {t('common.default')}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => updateStationStatus.mutate({ station, status: station.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                  >
                    {station.status === 'ACTIVE' ? t('common.disable') : t('common.enable')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t('kitchen.queue')}</span>
              <h2>{t('kitchen.tickets')}</h2>
            </div>
          </div>
          <div className="filter-bar compact-filter">
            <label>
              {t('kitchen.station')}
              <select value={filters.stationId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, stationId: event.target.value || undefined }))}>
                <option value="">{t('products.allStations')}</option>
                {activeStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </label>
            <label>
              {t('common.status')}
              <select value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as KitchenTicketStatus | '' }))}>
                <option value="">{t('common.active')}</option>
                <option value="NEW">{formatStatusLabel(t, 'NEW')}</option>
                <option value="PREPARING">{formatStatusLabel(t, 'PREPARING')}</option>
                <option value="READY">{formatStatusLabel(t, 'READY')}</option>
                <option value="COMPLETED">{formatStatusLabel(t, 'COMPLETED')}</option>
                <option value="CANCELLED">{formatStatusLabel(t, 'CANCELLED')}</option>
              </select>
            </label>
          </div>
          {ticketsQuery.isLoading ? <LoadingState title={t('kitchen.loadingTickets')} /> : null}
          {ticketsQuery.isError ? <ErrorState title={t('kitchen.queueError')} description={t('common.errorDescription')} /> : null}
          {ticketsQuery.data?.length === 0 ? <EmptyState title={t('kitchen.emptyTickets')} description={t('kitchen.emptyTicketsBody')} /> : null}
          <div className="ticket-list">
            {ticketPagination.pagedItems.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onAction={(action) => ticketAction.mutate({ id: ticket.id, action })} busy={ticketAction.isPending} />
            ))}
          </div>
          <Pagination {...ticketPagination} onPageChange={ticketPagination.setPage} onPageSizeChange={ticketPagination.setPageSize} />
        </div>
      </div>
    </section>
  );
}

function TicketCard({ busy, onAction, ticket }: { busy: boolean; onAction: (action: 'start' | 'ready' | 'complete' | 'cancel') => void; ticket: KitchenTicket }) {
  const { t } = useAdminI18n();
  return (
    <article className="modifier-card kitchen-ticket-card">
      <div className="modifier-card-header">
        <div>
          <strong>{ticket.ticketNumber}</strong>
          <small>{t('kitchen.pickup')} {ticket.order.pickupNumber ?? ticket.order.orderNumber} · {ticket.station.name}</small>
        </div>
        <span className={`status-pill ${ticket.status === 'READY' || ticket.status === 'COMPLETED' ? 'success' : ''}`}>{formatStatusLabel(t, ticket.status)}</span>
      </div>
      <div className="ticket-items">
        {ticket.items.map((item) => (
          <div key={item.id}>
            <span>{item.quantity}x {item.productName}</span>
            <small>{formatModifiers(item.modifiers, t('kitchen.noModifiers'))}</small>
          </div>
        ))}
      </div>
      <div className="ticket-meta">
        <span>{money.format(ticket.order.total)}</span>
        <span>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
      </div>
      <div className="table-actions">
        {ticket.status === 'NEW' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('start')}><Play size={16} /> {t('kitchen.start')}</button> : null}
        {ticket.status === 'NEW' || ticket.status === 'PREPARING' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('ready')}><Check size={16} /> {t('kitchen.ready')}</button> : null}
        {ticket.status === 'READY' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('complete')}><Check size={16} /> {t('kitchen.complete')}</button> : null}
        {ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('cancel')}><X size={16} /> {t('common.cancel')}</button> : null}
        {ticket.status === 'PREPARING' ? <CirclePause size={16} aria-hidden /> : null}
      </div>
    </article>
  );
}

function formatModifiers(modifiers: KitchenTicket['items'][number]['modifiers'], emptyText: string) {
  if (!modifiers.length) {
    return emptyText;
  }
  return modifiers.map((modifier) => [modifier.groupName, modifier.optionName].filter(Boolean).join(': ')).join(', ');
}
