import { useQuery } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '../components/PageState';
import { fetchShifts } from '../services/adminApi';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ShiftsPage() {
  const query = useQuery({ queryKey: ['admin', 'shifts'], queryFn: fetchShifts });

  if (query.isLoading) {
    return <LoadingState title="Loading shifts" />;
  }
  if (query.isError || !query.data) {
    return <ErrorState title="Shift history unavailable" description="Check the backend connection and try again." />;
  }

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">Cash operations</span>
        <h1>Shifts</h1>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Status</th>
              <th>Opened</th>
              <th>Closed</th>
              <th>Opening</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            {query.data.map((shift) => (
              <tr key={shift.id}>
                <td>{shift.staffName}</td>
                <td>
                  <span className={`status-pill ${shift.status === 'OPEN' ? 'success' : ''}`}>{shift.status}</span>
                </td>
                <td>{new Date(shift.openedAt).toLocaleString()}</td>
                <td>{shift.closedAt ? new Date(shift.closedAt).toLocaleString() : '-'}</td>
                <td>{money.format(shift.openingCash)}</td>
                <td>{money.format(shift.expectedCash)}</td>
                <td>{shift.actualCash === null ? '-' : money.format(shift.actualCash)}</td>
                <td>{shift.variance === null ? '-' : money.format(shift.variance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
