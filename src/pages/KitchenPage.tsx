import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChefHat, CirclePause, Play, Plus, X } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
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
  const [stationForm, setStationForm] = useState<StationForm>(emptyStationForm);
  const [filters, setFilters] = useState<{ stationId?: string; status?: KitchenTicketStatus | '' }>({});
  const stationsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'stations'], queryFn: fetchKitchenStations });
  const ticketsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'tickets', filters], queryFn: () => fetchKitchenTickets({ ...filters, take: 100 }) });
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
          <span className="eyebrow">Kitchen operations</span>
          <h1>Kitchen</h1>
        </div>
      </div>

      <div className="ops-grid">
        <div className="table-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Routing</span>
              <h2>Stations</h2>
            </div>
            <ChefHat size={20} />
          </div>
          <div className="modifier-create kitchen-station-form">
            <input
              placeholder="Station name"
              value={stationForm.name}
              onChange={(event) => setStationForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              placeholder="Code"
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
              Default
            </label>
            <button className="primary-button icon-button" type="button" onClick={() => saveStation.mutate()} disabled={saveStation.isPending}>
              <Plus size={18} /> {stationForm.id ? 'Save' : 'Add'}
            </button>
          </div>
          {saveStation.isError ? <p className="form-error">Unable to save station.</p> : null}
          {stationsQuery.isLoading ? <LoadingState title="Loading stations" /> : null}
          {stationsQuery.isError ? <ErrorState title="Kitchen stations unavailable" description="Check the backend connection and try again." /> : null}
          <div className="station-list">
            {(stationsQuery.data ?? []).map((station) => (
              <div className="station-row" key={station.id}>
                <div>
                  <strong>{station.name}</strong>
                  <small>{station.code} · sort {station.sortOrder}</small>
                </div>
                <span className={`status-pill ${station.status === 'ACTIVE' ? 'success' : ''}`}>{station.status}</span>
                {station.isDefault ? <span className="status-pill success">DEFAULT</span> : null}
                <div className="table-actions">
                  <button className="secondary-button" type="button" onClick={() => setStationForm({ id: station.id, name: station.name, code: station.code, sortOrder: station.sortOrder, isDefault: station.isDefault })}>
                    Edit
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setDefault.mutate(station.id)} disabled={station.status !== 'ACTIVE' || station.isDefault}>
                    Default
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => updateStationStatus.mutate({ station, status: station.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                  >
                    {station.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Queue</span>
              <h2>Tickets</h2>
            </div>
          </div>
          <div className="filter-bar compact-filter">
            <label>
              Station
              <select value={filters.stationId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, stationId: event.target.value || undefined }))}>
                <option value="">All stations</option>
                {activeStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as KitchenTicketStatus | '' }))}>
                <option value="">Active</option>
                <option value="NEW">New</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
          </div>
          {ticketsQuery.isLoading ? <LoadingState title="Loading tickets" /> : null}
          {ticketsQuery.isError ? <ErrorState title="Kitchen queue unavailable" description="Check the backend connection and try again." /> : null}
          {ticketsQuery.data?.length === 0 ? <EmptyState title="No kitchen tickets" description="New paid orders will appear here after checkout." /> : null}
          <div className="ticket-list">
            {(ticketsQuery.data ?? []).map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onAction={(action) => ticketAction.mutate({ id: ticket.id, action })} busy={ticketAction.isPending} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TicketCard({ busy, onAction, ticket }: { busy: boolean; onAction: (action: 'start' | 'ready' | 'complete' | 'cancel') => void; ticket: KitchenTicket }) {
  return (
    <article className="modifier-card kitchen-ticket-card">
      <div className="modifier-card-header">
        <div>
          <strong>{ticket.ticketNumber}</strong>
          <small>Pickup {ticket.order.pickupNumber ?? ticket.order.orderNumber} · {ticket.station.name}</small>
        </div>
        <span className={`status-pill ${ticket.status === 'READY' || ticket.status === 'COMPLETED' ? 'success' : ''}`}>{ticket.status}</span>
      </div>
      <div className="ticket-items">
        {ticket.items.map((item) => (
          <div key={item.id}>
            <span>{item.quantity}x {item.productName}</span>
            <small>{formatModifiers(item.modifiers)}</small>
          </div>
        ))}
      </div>
      <div className="ticket-meta">
        <span>{money.format(ticket.order.total)}</span>
        <span>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
      </div>
      <div className="table-actions">
        {ticket.status === 'NEW' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('start')}><Play size={16} /> Start</button> : null}
        {ticket.status === 'NEW' || ticket.status === 'PREPARING' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('ready')}><Check size={16} /> Ready</button> : null}
        {ticket.status === 'READY' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('complete')}><Check size={16} /> Complete</button> : null}
        {ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' ? <button className="secondary-button icon-button" type="button" disabled={busy} onClick={() => onAction('cancel')}><X size={16} /> Cancel</button> : null}
        {ticket.status === 'PREPARING' ? <CirclePause size={16} aria-hidden /> : null}
      </div>
    </article>
  );
}

function formatModifiers(modifiers: KitchenTicket['items'][number]['modifiers']) {
  if (!modifiers.length) {
    return 'No modifiers';
  }
  return modifiers.map((modifier) => [modifier.groupName, modifier.optionName].filter(Boolean).join(': ')).join(', ');
}
