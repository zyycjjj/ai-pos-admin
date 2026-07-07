import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import {
  createCategory,
  createModifierGroup,
  createModifierOption,
  createProduct,
  fetchCategories,
  fetchKitchenStations,
  fetchProduct,
  fetchProducts,
  type ProductFilters,
  updateCategory,
  updateCategoryStatus,
  updateModifierGroup,
  updateModifierGroupStatus,
  updateModifierOption,
  updateModifierOptionStatus,
  updateProduct,
  updateProductAvailability,
  updateProductStatus,
} from '../services/adminApi';
import type { AdminCategory, AdminModifierGroup, AdminModifierOption, AdminProduct, KitchenStation, ProductFormInput } from '../types/admin';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const emptyProductForm: ProductFormInput = {
  name: '',
  description: '',
  categoryId: '',
  price: 0,
  status: 'ACTIVE',
  availabilityStatus: 'AVAILABLE',
  kitchenStationId: '',
};

type ModifierGroupForm = {
  name: string;
  required: boolean;
  selectionType: 'SINGLE' | 'MULTI';
  minSelect: number;
  maxSelect: number;
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [editorProductId, setEditorProductId] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const productsQuery = useQuery({ queryKey: ['admin', 'products', filters], queryFn: () => fetchProducts(filters) });
  const categoriesQuery = useQuery({ queryKey: ['admin', 'categories'], queryFn: fetchCategories });
  const kitchenStationsQuery = useQuery({ queryKey: ['admin', 'kitchen', 'stations'], queryFn: fetchKitchenStations });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => updateProductStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
  const availabilityMutation = useMutation({
    mutationFn: ({ id, availabilityStatus }: { id: string; availabilityStatus: 'AVAILABLE' | 'SOLD_OUT' }) => updateProductAvailability(id, availabilityStatus),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  const activeCategories = useMemo(() => (categoriesQuery.data ?? []).filter((category) => category.status === 'ACTIVE'), [categoriesQuery.data]);
  const activeKitchenStations = useMemo(() => (kitchenStationsQuery.data ?? []).filter((station) => station.status === 'ACTIVE'), [kitchenStationsQuery.data]);

  return (
    <section>
      <div className="page-header row">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Product Management</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => setCategoryManagerOpen(true)}>
            Manage Categories
          </button>
          <button className="primary-button icon-button" type="button" onClick={() => setEditorProductId('new')}>
            <Plus size={18} /> New Product
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <label>
          Search
          <input
            placeholder="Tea, latte, cheesecake"
            value={filters.search ?? ''}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </label>
        <label>
          Category
          <select value={filters.categoryId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value || undefined }))}>
            <option value="">All categories</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          Kitchen
          <select value={filters.kitchenStationId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, kitchenStationId: event.target.value || undefined }))}>
            <option value="">All stations</option>
            {activeKitchenStations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ProductFilters['status'] }))}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label>
          Availability
          <select
            value={filters.availabilityStatus ?? ''}
            onChange={(event) => setFilters((current) => ({ ...current, availabilityStatus: event.target.value as ProductFilters['availabilityStatus'] }))}
          >
            <option value="">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="SOLD_OUT">Sold out</option>
          </select>
        </label>
      </div>

      {productsQuery.isLoading ? <LoadingState title="Loading products" /> : null}
      {productsQuery.isError ? <ErrorState title="Products unavailable" description="Check the backend connection and try again." /> : null}
      {productsQuery.data?.length === 0 ? <EmptyState title="No products yet" description="Create your first product or generate a menu with AI." /> : null}
      {productsQuery.data && productsQuery.data.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Kitchen</th>
                <th>Price</th>
                <th>Status</th>
                <th>Availability</th>
                <th>Modifiers</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.data.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    {product.description ? <small>{product.description}</small> : null}
                  </td>
                  <td>{product.categoryName ?? 'Menu'}</td>
                  <td>{product.kitchenStation?.name ?? 'Default route'}</td>
                  <td>{money.format(product.price)}</td>
                  <td><span className={`status ${product.status.toLowerCase()}`}>{product.status}</span></td>
                  <td><span className={`status ${product.availabilityStatus.toLowerCase().replace('_', '-')}`}>{product.availabilityStatus.replace('_', ' ')}</span></td>
                  <td>{product.modifierCount}</td>
                  <td>{new Date(product.updatedAt).toLocaleString()}</td>
                  <td>
                    <div className="table-actions">
                      <button className="secondary-button" type="button" onClick={() => setEditorProductId(product.id)}>Edit</button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => availabilityMutation.mutate({ id: product.id, availabilityStatus: product.availabilityStatus === 'SOLD_OUT' ? 'AVAILABLE' : 'SOLD_OUT' })}
                      >
                        {product.availabilityStatus === 'SOLD_OUT' ? 'Restore' : 'Sold Out'}
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => statusMutation.mutate({ id: product.id, status: product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      >
                        {product.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {editorProductId ? (
        <ProductEditor
          activeCategories={activeCategories}
          activeKitchenStations={activeKitchenStations}
          productId={editorProductId}
          onClose={() => setEditorProductId(null)}
        />
      ) : null}
      {categoryManagerOpen ? <CategoryManager activeKitchenStations={activeKitchenStations} categories={categoriesQuery.data ?? []} onClose={() => setCategoryManagerOpen(false)} /> : null}
    </section>
  );
}

function ProductEditor({
  activeCategories,
  activeKitchenStations,
  productId,
  onClose,
}: {
  activeCategories: AdminCategory[];
  activeKitchenStations: KitchenStation[];
  productId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = productId === 'new';
  const productQuery = useQuery({ queryKey: ['admin', 'product', productId], queryFn: () => fetchProduct(productId), enabled: !isNew });
  const [form, setForm] = useState<ProductFormInput>(emptyProductForm);
  const product = productQuery.data;
  const hydratedForm = useMemo(() => productToForm(product), [product]);
  const visibleForm = isNew || form.name ? form : hydratedForm;
  const saveMutation = useMutation({
    mutationFn: () => (isNew ? createProduct(visibleForm) : updateProduct(productId, visibleForm)),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'product', saved.id] });
      if (isNew) {
        onClose();
      }
    },
  });

  const updateField = <K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) => setForm((current) => ({ ...(current.name ? current : hydratedForm), [key]: value }));

  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">{isNew ? 'New Product' : 'Product Editor'}</span>
            <h2>{isNew ? 'Create Product' : product?.name ?? 'Loading product'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        {productQuery.isLoading ? <LoadingState title="Loading product detail" /> : null}
        <div className="editor-section">
          <h3>Basic Information</h3>
          <div className="editor-grid">
            <label>Name<input value={visibleForm.name} onChange={(event) => updateField('name', event.target.value)} /></label>
            <label>Price<input type="number" min="0" step="0.01" value={visibleForm.price} onChange={(event) => updateField('price', Number(event.target.value))} /></label>
            <label>
              Category
              <select value={visibleForm.categoryId ?? ''} onChange={(event) => updateField('categoryId', event.target.value)}>
                <option value="">Menu</option>
                {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              Kitchen
              <select value={visibleForm.kitchenStationId ?? ''} onChange={(event) => updateField('kitchenStationId', event.target.value)}>
                <option value="">Category/default route</option>
                {activeKitchenStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={visibleForm.status} onChange={(event) => updateField('status', event.target.value as ProductFormInput['status'])}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label>
              Availability
              <select value={visibleForm.availabilityStatus} onChange={(event) => updateField('availabilityStatus', event.target.value as ProductFormInput['availabilityStatus'])}>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD_OUT">Sold out</option>
              </select>
            </label>
            <label className="span-2">Description<input value={visibleForm.description ?? ''} onChange={(event) => updateField('description', event.target.value)} /></label>
          </div>
          {saveMutation.isError ? <p className="form-error">Unable to save product. Check required fields and store permissions.</p> : null}
          <button className="primary-button" type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Saving...' : 'Save Product'}
          </button>
        </div>

        {!isNew && product ? <ModifierEditor product={product} /> : null}
      </aside>
    </div>
  );
}

function ModifierEditor({ product }: { product: AdminProduct }) {
  const queryClient = useQueryClient();
  const [groupForm, setGroupForm] = useState<ModifierGroupForm>({ name: '', required: true, selectionType: 'SINGLE', minSelect: 1, maxSelect: 1 });
  const addGroup = useMutation({
    mutationFn: () => createModifierGroup(product.id, groupForm),
    onSuccess: () => {
      setGroupForm({ name: '', required: true, selectionType: 'SINGLE', minSelect: 1, maxSelect: 1 });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'product', product.id] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });

  return (
    <div className="editor-section">
      <h3>Modifiers</h3>
      <div className="modifier-create">
        <input placeholder="Group name, e.g. Size" value={groupForm.name} onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))} />
        <select value={groupForm.selectionType} onChange={(event) => setGroupForm((current) => ({ ...current, selectionType: event.target.value as 'SINGLE' | 'MULTI', maxSelect: event.target.value === 'SINGLE' ? 1 : current.maxSelect }))}>
          <option value="SINGLE">Single</option>
          <option value="MULTI">Multi</option>
        </select>
        <select value={groupForm.required ? 'required' : 'optional'} onChange={(event) => setGroupForm((current) => ({ ...current, required: event.target.value === 'required', minSelect: event.target.value === 'required' ? Math.max(current.minSelect, 1) : 0 }))}>
          <option value="required">Required</option>
          <option value="optional">Optional</option>
        </select>
        <input type="number" min="0" value={groupForm.minSelect} onChange={(event) => setGroupForm((current) => ({ ...current, minSelect: Number(event.target.value) }))} />
        <input type="number" min="1" value={groupForm.maxSelect} onChange={(event) => setGroupForm((current) => ({ ...current, maxSelect: Number(event.target.value) }))} />
        <button className="secondary-button" type="button" onClick={() => addGroup.mutate()} disabled={addGroup.isPending}>Add Group</button>
      </div>
      <div className="modifier-list">
        {(product.modifierGroups ?? []).map((group) => <ModifierGroupCard key={group.id} productId={product.id} group={group} />)}
      </div>
    </div>
  );
}

function ModifierGroupCard({ productId, group }: { productId: string; group: AdminModifierGroup }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(group.name);
  const [optionName, setOptionName] = useState('');
  const [priceDelta, setPriceDelta] = useState(0);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'product', productId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  };
  const saveGroup = useMutation({
    mutationFn: () => updateModifierGroup(group.id, { name, required: group.required, selectionType: group.selectionType, minSelect: group.minSelect, maxSelect: group.maxSelect, sortOrder: group.sortOrder }),
    onSuccess: refresh,
  });
  const toggleGroup = useMutation({ mutationFn: () => updateModifierGroupStatus(group.id, group.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'), onSuccess: refresh });
  const addOption = useMutation({
    mutationFn: () => createModifierOption(group.id, { name: optionName, priceDelta }),
    onSuccess: () => {
      setOptionName('');
      setPriceDelta(0);
      refresh();
    },
  });

  return (
    <div className="modifier-card">
      <div className="modifier-card-header">
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <span className={`status ${group.status.toLowerCase()}`}>{group.status}</span>
      </div>
      <p>{group.required ? 'Required' : 'Optional'} · {group.selectionType} · min {group.minSelect} · max {group.maxSelect}</p>
      <div className="table-actions">
        <button className="secondary-button" type="button" onClick={() => saveGroup.mutate()}>Save Group</button>
        <button className="secondary-button" type="button" onClick={() => toggleGroup.mutate()}>{group.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button>
      </div>
      <div className="option-list">
        {group.options.map((option) => <ModifierOptionRow key={option.id} option={option} onSaved={refresh} />)}
      </div>
      <div className="modifier-create option-create">
        <input placeholder="Option name" value={optionName} onChange={(event) => setOptionName(event.target.value)} />
        <input type="number" min="0" step="0.01" value={priceDelta} onChange={(event) => setPriceDelta(Number(event.target.value))} />
        <button className="secondary-button" type="button" onClick={() => addOption.mutate()}>Add Option</button>
      </div>
    </div>
  );
}

function ModifierOptionRow({ option, onSaved }: { option: AdminModifierOption; onSaved: () => void }) {
  const [name, setName] = useState(option.name);
  const [priceDelta, setPriceDelta] = useState(option.priceDelta);
  const save = useMutation({ mutationFn: () => updateModifierOption(option.id, { name, priceDelta, status: option.status, sortOrder: option.sortOrder }), onSuccess: onSaved });
  const status = useMutation({ mutationFn: (next: AdminModifierOption['status']) => updateModifierOptionStatus(option.id, next), onSuccess: onSaved });

  return (
    <div className="option-row">
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <input type="number" min="0" step="0.01" value={priceDelta} onChange={(event) => setPriceDelta(Number(event.target.value))} />
      <span className={`status ${option.status.toLowerCase().replace('_', '-')}`}>{option.status.replace('_', ' ')}</span>
      <button className="secondary-button" type="button" onClick={() => save.mutate()}>Save</button>
      <button className="secondary-button" type="button" onClick={() => status.mutate(option.status === 'SOLD_OUT' ? 'ACTIVE' : 'SOLD_OUT')}>
        {option.status === 'SOLD_OUT' ? 'Restore' : 'Sold Out'}
      </button>
      <button className="secondary-button" type="button" onClick={() => status.mutate(option.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE')}>
        {option.status === 'INACTIVE' ? 'Enable' : 'Disable'}
      </button>
    </div>
  );
}

function CategoryManager({
  activeKitchenStations,
  categories,
  onClose,
}: {
  activeKitchenStations: KitchenStation[];
  categories: AdminCategory[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const create = useMutation({
    mutationFn: () => createCategory({ name }),
    onSuccess: () => {
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });

  return (
    <div className="drawer-backdrop">
      <aside className="drawer compact-drawer">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Catalog</span>
            <h2>Category Manager</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modifier-create">
          <input placeholder="Seasonal Drinks" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="primary-button" type="button" onClick={() => create.mutate()}>Create</button>
        </div>
        <div className="category-list">
          {categories.map((category) => <CategoryRow key={category.id} activeKitchenStations={activeKitchenStations} category={category} onSaved={refresh} />)}
        </div>
      </aside>
    </div>
  );
}

function CategoryRow({ activeKitchenStations, category, onSaved }: { activeKitchenStations: KitchenStation[]; category: AdminCategory; onSaved: () => void }) {
  const [name, setName] = useState(category.name);
  const [defaultKitchenStationId, setDefaultKitchenStationId] = useState(category.defaultKitchenStation?.id ?? '');
  const save = useMutation({ mutationFn: () => updateCategory(category.id, { name, sortOrder: category.sortOrder, defaultKitchenStationId }), onSuccess: onSaved });
  const toggle = useMutation({ mutationFn: () => updateCategoryStatus(category.id, category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'), onSuccess: onSaved });

  return (
    <div className="category-row">
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <select value={defaultKitchenStationId} onChange={(event) => setDefaultKitchenStationId(event.target.value)}>
        <option value="">Store default</option>
        {activeKitchenStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
      </select>
      <span className={`status ${category.status.toLowerCase()}`}>{category.status}</span>
      <span>{category.productCount} products</span>
      <button className="secondary-button" type="button" onClick={() => save.mutate()}>Rename</button>
      <button className="secondary-button" type="button" onClick={() => toggle.mutate()}>{category.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button>
    </div>
  );
}

function productToForm(product?: AdminProduct): ProductFormInput {
  if (!product) {
    return emptyProductForm;
  }
  return {
    name: product.name,
    description: product.description ?? '',
    categoryId: product.category?.id ?? '',
    kitchenStationId: product.kitchenStation?.id ?? '',
    price: product.price,
    status: product.status,
    availabilityStatus: product.availabilityStatus,
  };
}
