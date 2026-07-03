import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { fetchAiDrafts } from '../services/adminApi';

export function AiCenterPage() {
  const query = useQuery({ queryKey: ['admin', 'ai-drafts'], queryFn: fetchAiDrafts });

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">Human reviewed AI</span>
          <h1>AI Center</h1>
        </div>
        <button className="secondary-button" disabled type="button">Generate · Use POS flow</button>
      </div>
      {query.isLoading ? <LoadingState title="Loading AI drafts" /> : null}
      {query.isError ? <ErrorState title="AI drafts unavailable" description="Check the backend connection and try again." /> : null}
      {query.data?.length === 0 ? <EmptyState title="No AI drafts" description="AI menu and campaign drafts will appear here." /> : null}
      {query.data && query.data.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((draft) => (
                <tr key={draft.id}>
                  <td>{draft.title}</td>
                  <td>{draft.type}</td>
                  <td><span className="status draft">{draft.status}</span></td>
                  <td>{new Date(draft.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
