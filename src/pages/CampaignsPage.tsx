import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { fetchCampaigns } from '../services/adminApi';

export function CampaignsPage() {
  const query = useQuery({ queryKey: ['admin', 'campaigns'], queryFn: fetchCampaigns });

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">Growth drafts</span>
          <h1>Campaign Center</h1>
        </div>
        <button className="secondary-button" disabled type="button">Launch · Coming soon</button>
      </div>
      {query.isLoading ? <LoadingState title="Loading campaigns" /> : null}
      {query.isError ? <ErrorState title="Campaigns unavailable" description="Check the backend connection and try again." /> : null}
      {query.data?.length === 0 ? <EmptyState title="No campaign drafts" description="Generate a campaign draft from the POS AI workflow." /> : null}
      {query.data && query.data.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Goal</th>
                <th>Time Window</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((campaign) => (
                <tr key={campaign.id}>
                  <td>{campaign.name}</td>
                  <td>{campaign.goal ?? '-'}</td>
                  <td>{campaign.timeWindow ?? '-'}</td>
                  <td>{campaign.category ?? '-'}</td>
                  <td><span className="status draft">{campaign.status}</span></td>
                  <td>{new Date(campaign.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
