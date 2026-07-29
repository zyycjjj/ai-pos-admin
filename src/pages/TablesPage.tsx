import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import { batchCreateDiningTables, createDiningArea, createDiningTable, fetchDiningAreas, fetchDiningTables } from '../services/adminApi';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function TablesPage() {
  const { t } = useAdminI18n();
  const queryClient = useQueryClient();
  const areasQuery = useQuery({ queryKey: ['admin', 'dining-areas'], queryFn: fetchDiningAreas });
  const tablesQuery = useQuery({ queryKey: ['admin', 'dining-tables'], queryFn: fetchDiningTables });
  const [areaName, setAreaName] = useState('');
  const [tableName, setTableName] = useState('');
  const [seats, setSeats] = useState('2');
  const [areaId, setAreaId] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortMode, setSortMode] = useState<'AREA' | 'STATUS' | 'OPENED_AT'>('AREA');
  const [batchAreaId, setBatchAreaId] = useState('');
  const [batchAreaName, setBatchAreaName] = useState('');
  const [batchPrefix, setBatchPrefix] = useState('A');
  const [batchStart, setBatchStart] = useState('1');
  const [batchCount, setBatchCount] = useState('5');
  const [batchDigits, setBatchDigits] = useState('2');
  const [batchSeats, setBatchSeats] = useState('2');
  const [batchSkipExisting, setBatchSkipExisting] = useState(true);

  const createArea = useMutation({
    mutationFn: createDiningArea,
    onSuccess: () => {
      setAreaName('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dining-areas'] });
    },
  });
  const createTable = useMutation({
    mutationFn: createDiningTable,
    onSuccess: () => {
      setTableName('');
      setSeats('2');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dining-tables'] });
    },
  });
  const batchCreate = useMutation({
    mutationFn: batchCreateDiningTables,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dining-areas'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dining-tables'] });
    },
  });

  const areas = areasQuery.data ?? [];
  const tables = tablesQuery.data ?? [];
  const selectedAreaId = areaId || areas[0]?.id || '';
  const filteredTables = useMemo(() => {
    const visible = tables.filter((table) => (areaFilter === 'ALL' || table.areaId === areaFilter) && (statusFilter === 'ALL' || table.status === statusFilter));
    return [...visible].sort((left, right) => {
      if (sortMode === 'STATUS') return left.status.localeCompare(right.status) || left.areaName.localeCompare(right.areaName) || left.sortOrder - right.sortOrder;
      if (sortMode === 'OPENED_AT') return Date.parse(right.currentOrder?.openedAt ?? '0') - Date.parse(left.currentOrder?.openedAt ?? '0');
      return left.areaName.localeCompare(right.areaName) || left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
    });
  }, [areaFilter, sortMode, statusFilter, tables]);
  const grouped = useMemo(() => areas.map((area) => ({ area, tables: filteredTables.filter((table) => table.areaId === area.id) })).filter((group) => areaFilter === 'ALL' || group.area.id === areaFilter), [areaFilter, areas, filteredTables]);

  if (areasQuery.isLoading || tablesQuery.isLoading) return <LoadingState title={t('tables.loading')} />;
  if (areasQuery.isError || tablesQuery.isError) return <ErrorState title={t('tables.errorTitle')} description={t('common.errorDescription')} />;

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">{t('tables.eyebrow')}</span>
        <h1>{t('tables.title')}</h1>
      </div>

      <div className="table-card">
        <div className="form-grid">
          <label>
            {t('tables.areaFilter')}
            <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
              <option value="ALL">{t('common.all')}</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </select>
          </label>
          <label>
            {t('tables.statusFilter')}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">{t('common.all')}</option>
              {['AVAILABLE', 'OCCUPIED', 'DIRTY', 'RESERVED', 'INACTIVE'].map((status) => <option key={status} value={status}>{formatStatusLabel(t, status)}</option>)}
            </select>
          </label>
          <label>
            {t('tables.sort')}
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}>
              <option value="AREA">{t('tables.sortArea')}</option>
              <option value="STATUS">{t('tables.sortStatus')}</option>
              <option value="OPENED_AT">{t('tables.sortOpenedAt')}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="settings-grid">
        <div className="panel-card">
          <h2>{t('tables.createArea')}</h2>
          <div className="form-grid">
            <label>
              {t('tables.areaName')}
              <input value={areaName} onChange={(event) => setAreaName(event.target.value)} />
            </label>
            <button className="primary-button" type="button" disabled={!areaName.trim() || createArea.isPending} onClick={() => createArea.mutate({ name: areaName })}>
              {t('common.create')}
            </button>
          </div>
        </div>

        <div className="panel-card">
          <h2>{t('tables.createTable')}</h2>
          <div className="form-grid">
            <label>
              {t('tables.area')}
              <select value={selectedAreaId} onChange={(event) => setAreaId(event.target.value)}>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </label>
            <label>
              {t('tables.tableName')}
              <input value={tableName} onChange={(event) => setTableName(event.target.value)} />
            </label>
            <label>
              {t('tables.seats')}
              <input type="number" min="1" value={seats} onChange={(event) => setSeats(event.target.value)} />
            </label>
            <button className="primary-button" type="button" disabled={!selectedAreaId || !tableName.trim() || createTable.isPending} onClick={() => createTable.mutate({ areaId: selectedAreaId, name: tableName, seats: Number(seats) || 2 })}>
              {t('common.create')}
            </button>
          </div>
        </div>

        <div className="panel-card">
          <h2>{t('tables.batchCreate')}</h2>
          <div className="form-grid">
            <label>
              {t('tables.area')}
              <select value={batchAreaId} onChange={(event) => setBatchAreaId(event.target.value)}>
                <option value="">{t('tables.newOrExistingArea')}</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </label>
            {!batchAreaId ? (
              <label>
                {t('tables.areaName')}
                <input value={batchAreaName} onChange={(event) => setBatchAreaName(event.target.value)} placeholder={t('tables.areaNameExample')} />
              </label>
            ) : null}
            <label>
              {t('tables.prefix')}
              <input value={batchPrefix} onChange={(event) => setBatchPrefix(event.target.value.toUpperCase())} />
            </label>
            <label>
              {t('tables.startNumber')}
              <input type="number" min="1" value={batchStart} onChange={(event) => setBatchStart(event.target.value)} />
            </label>
            <label>
              {t('tables.count')}
              <input type="number" min="1" max="200" value={batchCount} onChange={(event) => setBatchCount(event.target.value)} />
            </label>
            <label>
              {t('tables.digits')}
              <input type="number" min="1" value={batchDigits} onChange={(event) => setBatchDigits(event.target.value)} />
            </label>
            <label>
              {t('tables.defaultSeats')}
              <input type="number" min="1" value={batchSeats} onChange={(event) => setBatchSeats(event.target.value)} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={batchSkipExisting} onChange={(event) => setBatchSkipExisting(event.target.checked)} />
              {t('tables.skipExisting')}
            </label>
            <button
              className="primary-button"
              type="button"
              disabled={!batchPrefix.trim() || (!batchAreaId && !batchAreaName.trim()) || batchCreate.isPending}
              onClick={() =>
                batchCreate.mutate({
                  areaId: batchAreaId || undefined,
                  areaName: batchAreaId ? undefined : batchAreaName,
                  prefix: batchPrefix,
                  startNumber: Number(batchStart) || 1,
                  count: Number(batchCount) || 1,
                  digits: Number(batchDigits) || 2,
                  defaultSeats: Number(batchSeats) || 2,
                  skipExisting: batchSkipExisting,
                })
              }
            >
              {t('tables.batchCreateAction')}
            </button>
            {batchCreate.data ? (
              <p className="muted-copy">
                {t('tables.batchResult', { created: batchCreate.data.created, skipped: batchCreate.data.skipped })}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {areas.length === 0 ? <EmptyState title={t('tables.emptyAreas')} /> : null}
      {grouped.map(({ area, tables: areaTables }) => (
        <div className="table-card" key={area.id}>
          <div className="panel-header">
            <div>
              <h2>{area.name}</h2>
              <span>{areaTables.length} {t('tables.tables')}</span>
            </div>
          </div>
          {areaTables.length === 0 ? <EmptyState title={t('tables.emptyTables')} /> : (
            <table>
              <thead>
                <tr>
                  <th>{t('tables.tableName')}</th>
                  <th>{t('tables.seats')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('tables.currentOrder')}</th>
                  <th>{t('tables.guests')}</th>
                  <th>{t('tables.openedAt')}</th>
                  <th>{t('orders.total')}</th>
                </tr>
              </thead>
              <tbody>
                {areaTables.map((table) => (
                  <tr key={table.id}>
                    <td><strong>{table.name}</strong></td>
                    <td>{table.seats}</td>
                    <td><span className={`status-pill ${table.status === 'AVAILABLE' ? 'success' : ''}`}>{formatStatusLabel(t, table.status)}</span></td>
                    <td>{table.currentOrder?.orderNumber ?? '-'}</td>
                    <td>{table.currentOrder?.guestCount ?? '-'}</td>
                    <td>{table.currentOrder?.openedAt ? new Date(table.currentOrder.openedAt).toLocaleString() : '-'}</td>
                    <td>{table.currentOrder ? money.format(table.currentOrder.total) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </section>
  );
}
