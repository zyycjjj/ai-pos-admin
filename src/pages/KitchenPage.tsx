import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, Eye, Plus, Printer } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import { assignKitchenStaffStations, createKitchenStation, fetchKitchenRouteSummary, fetchKitchenSettings, fetchKitchenStaffStations, fetchKitchenStations, fetchKitchenTickets, previewKitchenTicket, setDefaultKitchenStation, updateKitchenPrintMode, updateKitchenStation, updateKitchenStationStatus } from '../services/adminApi';
import type { KitchenPrintMode, KitchenRouteSummary, KitchenStaffStationAssignment, KitchenStation, KitchenTicket, KitchenTicketPreview, KitchenTicketStatus } from '../types/admin';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

type StationForm = {
  id?: string;
  name: string;
  code: string;
  sortOrder: number;
  isDefault: boolean;
  warningMinutes: number;
  overdueMinutes: number;
};

const emptyStationForm: StationForm = { name: '', code: '', sortOrder: 0, isDefault: false, warningMinutes: 8, overdueMinutes: 15 };

export function KitchenPage() {
  const queryClient = useQueryClient();
  const { t } = useAdminI18n();
  const [stationForm, setStationForm] = useState<StationForm>(emptyStationForm);
  const [filters, setFilters] = useState<{ stationId?: string; status?: KitchenTicketStatus | '' }>({});
  const [preview, setPreview] = useState<KitchenTicketPreview | null>(null);
  const stationsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'stations'], queryFn: fetchKitchenStations });
  const settingsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'settings'], queryFn: fetchKitchenSettings });
  const ticketsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'tickets', filters], queryFn: () => fetchKitchenTickets({ ...filters, take: 100 }) });
  const routeSummaryQuery = useQuery({ queryKey: ['admin', 'kitchen', 'route-summary'], queryFn: fetchKitchenRouteSummary });
  const staffStationsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'staff-stations'], queryFn: fetchKitchenStaffStations });
  const ticketPagination = usePagination(ticketsQuery.data, 10);
  const activeStations = useMemo(() => (stationsQuery.data ?? []).filter((station) => station.status === 'ACTIVE'), [stationsQuery.data]);

  const refreshStations = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'kitchen', 'stations'] });
  const refreshTickets = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'kitchen', 'tickets'] });
  const refreshStaffStations = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'kitchen', 'staff-stations'] });
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
  const printModeMutation = useMutation({
    mutationFn: (mode: KitchenPrintMode) => updateKitchenPrintMode(mode),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'kitchen', 'settings'] });
      refreshTickets();
    },
  });
  const assignStations = useMutation({
    mutationFn: assignKitchenStaffStations,
    onSuccess: refreshStaffStations,
  });
  const previewMutation = useMutation({
    mutationFn: previewKitchenTicket,
    onSuccess: setPreview,
  });

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">{t('kitchen.eyebrow')}</span>
          <h1>{t('kitchen.title')}</h1>
          <p className="page-description">{t('kitchen.configDescription')}</p>
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
            <input
              type="number"
              min="1"
              value={stationForm.warningMinutes}
              title={t('kitchen.warningMinutes')}
              onChange={(event) => setStationForm((current) => ({ ...current, warningMinutes: Number(event.target.value) }))}
            />
            <input
              type="number"
              min="1"
              value={stationForm.overdueMinutes}
              title={t('kitchen.overdueMinutes')}
              onChange={(event) => setStationForm((current) => ({ ...current, overdueMinutes: Number(event.target.value) }))}
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
                  <small>{station.code} · sort {station.sortOrder} · {t('kitchen.sla')} {station.warningMinutes}/{station.overdueMinutes}m</small>
                </div>
                <span className={`status-pill ${station.status === 'ACTIVE' ? 'success' : ''}`}>{formatStatusLabel(t, station.status)}</span>
                {station.isDefault ? <span className="status-pill success">{t('common.default')}</span> : null}
                <div className="table-actions">
                  <button className="secondary-button" type="button" onClick={() => setStationForm({ id: station.id, name: station.name, code: station.code, sortOrder: station.sortOrder, isDefault: station.isDefault, warningMinutes: station.warningMinutes, overdueMinutes: station.overdueMinutes })}>
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

        <RouteSummaryCard summary={routeSummaryQuery.data} loading={routeSummaryQuery.isLoading} />
        <StaffStationsCard assignments={staffStationsQuery.data ?? []} stations={activeStations} onAssign={(userId, stationIds) => assignStations.mutate({ userId, stationIds })} />

        <div className="table-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t('kitchen.printMode')}</span>
              <h2>{t('kitchen.ticketMode')}</h2>
            </div>
            <Printer size={20} />
          </div>
          <div className="filter-bar compact-filter">
            <label>
              {t('kitchen.ticketMode')}
              <select
                value={settingsQuery.data?.printMode ?? 'ORDER_TICKET'}
                onChange={(event) => printModeMutation.mutate(event.target.value as KitchenPrintMode)}
                disabled={settingsQuery.isLoading || printModeMutation.isPending}
              >
                <option value="ORDER_TICKET">{t('kitchen.orderTicketMode')}</option>
                <option value="ITEM_TICKET">{t('kitchen.itemTicketMode')}</option>
              </select>
            </label>
          </div>
          <p className="muted-copy">{t('kitchen.printModeHelp')}</p>
        </div>

        <div className="table-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t('kitchen.queue')}</span>
              <h2>{t('kitchen.ticketsReadonly')}</h2>
            </div>
          </div>
          <p className="muted-copy">{t('kitchen.posModeHint')}</p>
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
                <option value="IN_PROGRESS">{formatStatusLabel(t, 'IN_PROGRESS')}</option>
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
              <TicketCard key={ticket.id} ticket={ticket} onPreview={() => previewMutation.mutate(ticket.id)} />
            ))}
          </div>
          <Pagination {...ticketPagination} onPageChange={ticketPagination.setPage} onPageSizeChange={ticketPagination.setPageSize} />
        </div>
      </div>
      {preview ? <PreviewPanel preview={preview} onClose={() => setPreview(null)} /> : null}
    </section>
  );
}

function RouteSummaryCard({ summary, loading }: { summary?: KitchenRouteSummary; loading: boolean }) {
  const { t } = useAdminI18n();
  return (
    <div className="table-card">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t('kitchen.routeHealth')}</span>
          <h2>{t('kitchen.unrouted')}</h2>
        </div>
      </div>
      {loading ? <LoadingState title={t('common.loading')} /> : null}
      <div className="kitchen-route-summary">
        <span className="status-pill warning">{t('kitchen.unroutedProducts')}: {summary?.unroutedProductCount ?? 0}</span>
        <span className="status-pill warning">{t('kitchen.unroutedCategories')}: {summary?.unroutedCategoryCount ?? 0}</span>
      </div>
      <div className="station-list">
        {(summary?.unroutedProducts ?? []).slice(0, 8).map((product) => (
          <div className="station-row" key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <small>{product.categoryName ?? t('common.unresolved')}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffStationsCard({ assignments, stations, onAssign }: { assignments: KitchenStaffStationAssignment[]; stations: KitchenStation[]; onAssign: (userId: string, stationIds: string[]) => void }) {
  const { t } = useAdminI18n();
  return (
    <div className="table-card">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{t('kitchen.permissions')}</span>
          <h2>{t('kitchen.staffStations')}</h2>
        </div>
      </div>
      <div className="station-list">
        {assignments.map((assignment) => {
          const selected = new Set(assignment.stations.map((station) => station.id));
          return (
            <div className="station-row" key={assignment.userId}>
              <div>
                <strong>{assignment.name ?? assignment.email}</strong>
                <small>{assignment.email}</small>
              </div>
              <select
                multiple
                value={[...selected]}
                onChange={(event) => onAssign(assignment.userId, Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}
              >
                {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      {assignments.length === 0 ? <p className="muted-copy">{t('kitchen.noKitchenStaff')}</p> : null}
    </div>
  );
}

function TicketCard({ ticket, onPreview }: { ticket: KitchenTicket; onPreview: () => void }) {
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
      <div className="kitchen-route-summary">
        {ticket.urgent ? <span className="status-pill warning">{t('kitchen.urgent')}</span> : null}
        <span className={`status-pill ${ticket.slaStatus === 'OVERDUE' ? 'danger' : ticket.slaStatus === 'WARNING' ? 'warning' : 'success'}`}>{t(`kitchen.sla.${ticket.slaStatus}`)}</span>
        <span>{t('kitchen.waitMinutes')}: {ticket.waitMinutes}m</span>
        {ticket.cookMinutes !== null ? <span>{t('kitchen.cookMinutes')}: {ticket.cookMinutes}m</span> : null}
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
      <button className="secondary-button icon-button" type="button" onClick={onPreview}>
        <Eye size={16} /> {t('kitchen.preview')}
      </button>
      <p className="muted-copy">{t('kitchen.readonlyTicketHint')}</p>
    </article>
  );
}

function PreviewPanel({ preview, onClose }: { preview: KitchenTicketPreview; onClose: () => void }) {
  const { t } = useAdminI18n();
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="dialog-card preview-dialog">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{preview.stationName}</span>
            <h2>{t('kitchen.preview')}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>{t('common.close')}</button>
        </div>
        <pre className="ticket-preview-text">{preview.textPreview}</pre>
      </div>
    </div>
  );
}

function formatModifiers(modifiers: KitchenTicket['items'][number]['modifiers'], emptyText: string) {
  if (!modifiers.length) {
    return emptyText;
  }
  return modifiers.map((modifier) => [modifier.groupName, modifier.optionName].filter(Boolean).join(': ')).join(', ');
}
