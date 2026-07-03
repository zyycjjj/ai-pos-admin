import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { fetchProducts } from '../services/adminApi';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductsPage() {
  const query = useQuery({ queryKey: ['admin', 'products'], queryFn: fetchProducts });

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Product Management</h1>
        </div>
        <button className="secondary-button" disabled type="button">New Product · Coming soon</button>
      </div>
      {query.isLoading ? <LoadingState title="Loading products" /> : null}
      {query.isError ? <ErrorState title="Products unavailable" description="Check the backend connection and try again." /> : null}
      {query.data?.length === 0 ? <EmptyState title="No products" description="Create or import products from AI menu generation." /> : null}
      {query.data && query.data.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Modifier Count</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category ?? 'Menu'}</td>
                  <td>{money.format(product.price)}</td>
                  <td><span className={`status ${product.status.toLowerCase()}`}>{product.status}</span></td>
                  <td>{product.modifierCount}</td>
                  <td>{new Date(product.updatedAt).toLocaleString()}</td>
                  <td><button className="secondary-button" disabled type="button">Edit soon</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
