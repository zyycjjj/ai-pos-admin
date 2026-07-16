import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { formatStatusLabel, useAdminI18n } from '../i18n';
import { createDiningArea, createDiningTable, fetchDiningAreas, fetchDiningTables } from '../services/adminApi';

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

  const areas = areasQuery.data ?? [];
  const tables = tablesQuery.data ?? [];
  const selectedAreaId = areaId || areas[0]?.id || '';
  const grouped = useMemo(() => areas.map((area) => ({ area, tables: tables.filter((table) => table.areaId === area.id) })), [areas, tables]);

  if (areasQuery.isLoading || tablesQuery.isLoading) return <LoadingState title={t('tables.loading')} />;
  if (areasQuery.isError || tablesQuery.isError) return <ErrorState title={t('tables.errorTitle')} description={t('common.errorDescription')} />;

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">{t('tables.eyebrow')}</span>
        <h1>{t('tables.title')}</h1>
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
