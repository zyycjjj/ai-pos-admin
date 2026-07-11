import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Printer as PrinterIcon, RotateCcw, Send, Trash2 } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatEnumLabel, formatStatusLabel, useAdminI18n } from '../i18n';
import {
  createPrinter,
  deletePrinterRoute,
  fetchKitchenStations,
  fetchPrinterRoutes,
  fetchPrinters,
  fetchPrintJobs,
  retryPrintJob,
  testPrinter,
  updatePrinter,
  updatePrinterStatus,
  upsertPrinterRoute,
  type PrinterFormInput,
  type PrinterRouteInput,
} from '../services/adminApi';
import type { PrintDocumentType, PrintJob, PrintJobStatus, Printer, PrinterConnectionType, PrinterRouteType, PrinterType } from '../types/admin';

type PrinterForm = PrinterFormInput & { id?: string };

const emptyPrinterForm: PrinterForm = {
  name: '',
  code: '',
  type: 'RECEIPT',
  connectionType: 'LAN',
  host: '127.0.0.1',
  port: 9100,
  usbVendorId: '',
  usbProductId: '',
  paperWidth: 80,
  autoCut: true,
  cashDrawerPulse: false,
};

const documentTypes: PrintDocumentType[] = ['CUSTOMER_RECEIPT', 'KITCHEN_TICKET', 'REFUND_RECEIPT', 'SHIFT_SUMMARY', 'TEST_PAGE'];
const jobStatuses: PrintJobStatus[] = ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'];

export function PrintersPage() {
  const queryClient = useQueryClient();
  const { t } = useAdminI18n();
  const [printerForm, setPrinterForm] = useState<PrinterForm>(emptyPrinterForm);
  const [routeForm, setRouteForm] = useState<PrinterRouteInput>({ printerId: '', routeType: 'STORE_DEFAULT', targetId: '', documentType: 'CUSTOMER_RECEIPT' });
  const [jobFilters, setJobFilters] = useState<{ status?: PrintJobStatus | ''; printerId?: string; documentType?: PrintDocumentType | '' }>({});

  const printersQuery = useQuery({ queryKey: ['admin', 'printers'], queryFn: fetchPrinters });
  const routesQuery = useQuery({ queryKey: ['admin', 'printer-routes'], queryFn: fetchPrinterRoutes });
  const jobsQuery = useQuery({ queryKey: ['admin', 'print-jobs', jobFilters], queryFn: () => fetchPrintJobs({ ...jobFilters, take: 80 }) });
  const jobPagination = usePagination(jobsQuery.data, 10);
  const stationsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'stations'], queryFn: fetchKitchenStations });

  const activePrinters = useMemo(() => (printersQuery.data ?? []).filter((printer) => printer.status === 'ACTIVE'), [printersQuery.data]);
  const activeStations = useMemo(() => (stationsQuery.data ?? []).filter((station) => station.status === 'ACTIVE'), [stationsQuery.data]);

  const refreshPrinters = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'printers'] });
  const refreshRoutes = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'printer-routes'] });
  const refreshJobs = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'print-jobs'] });

  const savePrinter = useMutation({
    mutationFn: () => {
      const payload = normalizePrinterInput(printerForm);
      return printerForm.id ? updatePrinter(printerForm.id, payload) : createPrinter(payload);
    },
    onSuccess: () => {
      setPrinterForm(emptyPrinterForm);
      refreshPrinters();
    },
  });

  const togglePrinter = useMutation({
    mutationFn: (printer: Printer) => updatePrinterStatus(printer.id, printer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
    onSuccess: refreshPrinters,
  });

  const sendTest = useMutation({
    mutationFn: (printerId: string) => testPrinter(printerId),
    onSuccess: refreshJobs,
  });

  const saveRoute = useMutation({
    mutationFn: () => upsertPrinterRoute(routeForm),
    onSuccess: () => {
      setRouteForm({ printerId: routeForm.printerId, routeType: 'STORE_DEFAULT', targetId: '', documentType: 'CUSTOMER_RECEIPT' });
      refreshRoutes();
    },
  });

  const removeRoute = useMutation({
    mutationFn: (id: string) => deletePrinterRoute(id),
    onSuccess: refreshRoutes,
  });

  const retryJob = useMutation({
    mutationFn: (id: string) => retryPrintJob(id),
    onSuccess: refreshJobs,
  });

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">{t('printers.eyebrow')}</span>
          <h1>{t('printers.title')}</h1>
        </div>
      </div>

      <div className="ops-grid printer-ops-grid">
        <div className="table-card printer-config-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t('printers.devices')}</span>
              <h2>{t('printers.title')}</h2>
            </div>
            <PrinterIcon size={20} />
          </div>
          <div className="printer-form">
            <input placeholder={t('printers.name')} value={printerForm.name} onChange={(event) => setPrinterForm((current) => ({ ...current, name: event.target.value }))} />
            <input placeholder={t('printers.code')} value={printerForm.code} onChange={(event) => setPrinterForm((current) => ({ ...current, code: event.target.value }))} />
            <select value={printerForm.type} onChange={(event) => setPrinterForm((current) => ({ ...current, type: event.target.value as PrinterType }))}>
              <option value="RECEIPT">{t('printers.receipt')}</option>
              <option value="KITCHEN">{t('printers.kitchen')}</option>
              <option value="MULTI_PURPOSE">{t('printers.multiPurpose')}</option>
            </select>
            <select value={printerForm.connectionType} onChange={(event) => setPrinterForm((current) => ({ ...current, connectionType: event.target.value as PrinterConnectionType }))}>
              <option value="LAN">LAN</option>
              <option value="USB">USB</option>
            </select>
            {printerForm.connectionType === 'LAN' ? (
              <>
                <input placeholder={t('printers.host')} value={printerForm.host ?? ''} onChange={(event) => setPrinterForm((current) => ({ ...current, host: event.target.value }))} />
                <input type="number" min="1" placeholder={t('printers.port')} value={printerForm.port ?? ''} onChange={(event) => setPrinterForm((current) => ({ ...current, port: Number(event.target.value) }))} />
              </>
            ) : (
              <>
                <input placeholder={t('printers.usbVendor')} value={printerForm.usbVendorId ?? ''} onChange={(event) => setPrinterForm((current) => ({ ...current, usbVendorId: event.target.value }))} />
                <input placeholder={t('printers.usbProduct')} value={printerForm.usbProductId ?? ''} onChange={(event) => setPrinterForm((current) => ({ ...current, usbProductId: event.target.value }))} />
              </>
            )}
            <input type="number" min="58" placeholder={t('printers.paperWidth')} value={printerForm.paperWidth ?? 80} onChange={(event) => setPrinterForm((current) => ({ ...current, paperWidth: Number(event.target.value) }))} />
            <label className="compact-check">
              <input type="checkbox" checked={printerForm.autoCut ?? true} onChange={(event) => setPrinterForm((current) => ({ ...current, autoCut: event.target.checked }))} />
              {t('printers.autoCut')}
            </label>
            <button className="primary-button icon-button" type="button" disabled={savePrinter.isPending} onClick={() => savePrinter.mutate()}>
              <Send size={18} /> {printerForm.id ? t('common.save') : t('common.add')}
            </button>
          </div>
          {savePrinter.isError ? <p className="form-error">{t('printers.saveError')}</p> : null}
          {printersQuery.isLoading ? <LoadingState title={t('printers.loadingPrinters')} /> : null}
          {printersQuery.isError ? <ErrorState title={t('printers.printersError')} description={t('common.errorDescription')} /> : null}
          <div className="station-list">
            {(printersQuery.data ?? []).map((printer) => (
              <div className="station-row" key={printer.id}>
                <div>
                  <strong>{printer.name}</strong>
                  <small>{printer.code} · {printer.type} · {printer.address}</small>
                </div>
                <span className={`status-pill ${printer.status === 'ACTIVE' ? 'success' : ''}`}>{formatStatusLabel(t, printer.status)}</span>
                <div className="table-actions">
                  <button className="secondary-button" type="button" onClick={() => setPrinterForm(fromPrinter(printer))}>{t('common.edit')}</button>
                  <button className="secondary-button" type="button" onClick={() => togglePrinter.mutate(printer)}>{printer.status === 'ACTIVE' ? t('common.disable') : t('common.enable')}</button>
                  <button className="secondary-button icon-button" type="button" disabled={printer.status !== 'ACTIVE' || sendTest.isPending} onClick={() => sendTest.mutate(printer.id)}>
                    <Send size={16} /> {t('printers.test')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-card printer-config-card">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t('kitchen.routing')}</span>
              <h2>{t('printers.routes')}</h2>
            </div>
          </div>
          <div className="printer-route-form">
            <select value={routeForm.printerId} onChange={(event) => setRouteForm((current) => ({ ...current, printerId: event.target.value }))}>
              <option value="">{t('printers.selectPrinter')}</option>
              {activePrinters.map((printer) => <option key={printer.id} value={printer.id}>{printer.name}</option>)}
            </select>
            <select value={routeForm.routeType} onChange={(event) => setRouteForm((current) => ({ ...current, routeType: event.target.value as PrinterRouteType, targetId: '' }))}>
              <option value="STORE_DEFAULT">{t('printers.storeDefault')}</option>
              <option value="KITCHEN_STATION">{t('printers.kitchenStation')}</option>
            </select>
            {routeForm.routeType === 'KITCHEN_STATION' ? (
              <select value={routeForm.targetId ?? ''} onChange={(event) => setRouteForm((current) => ({ ...current, targetId: event.target.value }))}>
                <option value="">{t('printers.selectStation')}</option>
                {activeStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            ) : (
              <input disabled value={t('printers.store')} />
            )}
            <select value={routeForm.documentType} onChange={(event) => setRouteForm((current) => ({ ...current, documentType: event.target.value as PrintDocumentType }))}>
              {documentTypes.map((type) => <option key={type} value={type}>{formatEnum(type)}</option>)}
            </select>
            <button className="primary-button" type="button" disabled={!routeForm.printerId || saveRoute.isPending} onClick={() => saveRoute.mutate()}>{t('printers.saveRoute')}</button>
          </div>
          {saveRoute.isError ? <p className="form-error">{t('printers.routeError')}</p> : null}
          <div className="station-list">
            {(routesQuery.data ?? []).map((route) => (
              <div className="station-row" key={route.id}>
                <div>
                  <strong>{formatEnum(route.documentType)}</strong>
                  <small>{formatEnum(route.routeType)} · {route.targetId === 'STORE' ? t('printers.store') : findStationName(activeStations, route.targetId)} · {route.printer.name}</small>
                </div>
                <button className="secondary-button icon-button" type="button" disabled={removeRoute.isPending} onClick={() => removeRoute.mutate(route.id)}>
                  <Trash2 size={16} /> {t('printers.remove')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card printer-jobs-card">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t('kitchen.queue')}</span>
            <h2>{t('printers.printJobs')}</h2>
          </div>
        </div>
        <div className="filter-bar compact-filter print-job-filter">
          <label>
            {t('common.status')}
            <select value={jobFilters.status ?? ''} onChange={(event) => setJobFilters((current) => ({ ...current, status: event.target.value as PrintJobStatus | '' }))}>
              <option value="">{t('common.all')}</option>
              {jobStatuses.map((status) => <option key={status} value={status}>{formatEnum(status)}</option>)}
            </select>
          </label>
          <label>
            {t('printers.printer')}
            <select value={jobFilters.printerId ?? ''} onChange={(event) => setJobFilters((current) => ({ ...current, printerId: event.target.value || undefined }))}>
              <option value="">{t('printers.allPrinters')}</option>
              {(printersQuery.data ?? []).map((printer) => <option key={printer.id} value={printer.id}>{printer.name}</option>)}
            </select>
          </label>
          <label>
            {t('printers.document')}
            <select value={jobFilters.documentType ?? ''} onChange={(event) => setJobFilters((current) => ({ ...current, documentType: event.target.value as PrintDocumentType | '' }))}>
              <option value="">{t('printers.allDocuments')}</option>
              {documentTypes.map((type) => <option key={type} value={type}>{formatEnum(type)}</option>)}
            </select>
          </label>
        </div>
        {jobsQuery.isLoading ? <LoadingState title={t('printers.loadingJobs')} /> : null}
        {jobsQuery.isError ? <ErrorState title={t('printers.jobsError')} description={t('common.errorDescription')} /> : null}
        {jobsQuery.data?.length === 0 ? <EmptyState title={t('printers.emptyJobs')} description={t('printers.emptyJobsBody')} /> : null}
        <table>
          <thead>
            <tr>
              <th>{t('printers.document')}</th>
              <th>{t('common.status')}</th>
              <th>{t('printers.printer')}</th>
              <th>{t('printers.reference')}</th>
              <th>{t('printers.attempts')}</th>
              <th>{t('common.created')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {jobPagination.pagedItems.map((job) => <PrintJobRow key={job.id} job={job} busy={retryJob.isPending} onRetry={() => retryJob.mutate(job.id)} />)}
          </tbody>
        </table>
        <Pagination {...jobPagination} onPageChange={jobPagination.setPage} onPageSizeChange={jobPagination.setPageSize} />
      </div>
    </section>
  );
}

function PrintJobRow({ busy, job, onRetry }: { busy: boolean; job: PrintJob; onRetry: () => void }) {
  const { t } = useAdminI18n();
  return (
    <tr>
      <td>
        <strong>{formatEnum(job.documentType)}</strong>
        <small>{formatEnum(job.reason)} · {job.byteLength ? `${job.byteLength} ${t('common.bytes')}` : t('common.notRendered')}</small>
      </td>
      <td>
        <span className={`status-pill ${job.status === 'SUCCEEDED' ? 'success' : job.status === 'FAILED' ? 'danger' : ''}`}>{formatStatusLabel(t, job.status)}</span>
        {job.lastError ? <small>{job.lastError}</small> : null}
      </td>
      <td>{job.printer?.name ?? t('common.unresolved')}</td>
      <td>
        <strong>{formatEnum(job.referenceType)}</strong>
        <small>{job.referenceId}</small>
      </td>
      <td>{job.retryCount}/{job.maxRetries}</td>
      <td>{new Date(job.createdAt).toLocaleString()}</td>
      <td>
        {job.status === 'FAILED' ? (
          <button className="secondary-button icon-button" type="button" disabled={busy} onClick={onRetry}>
            <RotateCcw size={16} /> {t('common.retry')}
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function normalizePrinterInput(form: PrinterForm): PrinterFormInput {
  return {
    name: form.name,
    code: form.code,
    type: form.type,
    connectionType: form.connectionType,
    host: form.connectionType === 'LAN' ? form.host : undefined,
    port: form.connectionType === 'LAN' ? form.port : undefined,
    usbVendorId: form.connectionType === 'USB' ? form.usbVendorId : undefined,
    usbProductId: form.connectionType === 'USB' ? form.usbProductId : undefined,
    paperWidth: form.paperWidth,
    autoCut: form.autoCut,
    cashDrawerPulse: form.cashDrawerPulse,
  };
}

function fromPrinter(printer: Printer): PrinterForm {
  return {
    id: printer.id,
    name: printer.name,
    code: printer.code,
    type: printer.type,
    connectionType: printer.connectionType,
    host: printer.host ?? '',
    port: printer.port ?? 9100,
    usbVendorId: printer.usbVendorId ?? '',
    usbProductId: printer.usbProductId ?? '',
    paperWidth: printer.paperWidth,
    autoCut: printer.autoCut,
    cashDrawerPulse: printer.cashDrawerPulse,
  };
}

function findStationName(stations: Array<{ id: string; name: string }>, id: string) {
  return stations.find((station) => station.id === id)?.name ?? id;
}

function formatEnum(value: string) {
  return formatEnumLabel(value);
}
