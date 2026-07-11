import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatStatusLabel, useAdminI18n } from '../i18n';
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
  const { t } = useAdminI18n();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [editorProductId, setEditorProductId] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const productsQuery = useQuery({ queryKey: ['admin', 'products', filters], queryFn: () => fetchProducts(filters) });
  const pagination = usePagination(productsQuery.data, 10);
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
          <span className="eyebrow">{t('products.eyebrow')}</span>
          <h1>{t('products.title')}</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => setCategoryManagerOpen(true)}>
            {t('products.manageCategories')}
          </button>
          <button className="primary-button icon-button" type="button" onClick={() => setEditorProductId('new')}>
            <Plus size={18} /> {t('products.newProduct')}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <label>
          {t('common.search')}
          <input
            placeholder={t('products.placeholder')}
            value={filters.search ?? ''}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </label>
        <label>
          {t('products.category')}
          <select value={filters.categoryId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value || undefined }))}>
            <option value="">{t('products.allCategories')}</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          {t('products.kitchen')}
          <select value={filters.kitchenStationId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, kitchenStationId: event.target.value || undefined }))}>
            <option value="">{t('products.allStations')}</option>
            {activeKitchenStations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
        </label>
        <label>
          {t('common.status')}
          <select value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ProductFilters['status'] }))}>
            <option value="">{t('common.all')}</option>
            <option value="ACTIVE">{formatStatusLabel(t, 'ACTIVE')}</option>
            <option value="INACTIVE">{formatStatusLabel(t, 'INACTIVE')}</option>
          </select>
        </label>
        <label>
          {t('products.availability')}
          <select
            value={filters.availabilityStatus ?? ''}
            onChange={(event) => setFilters((current) => ({ ...current, availabilityStatus: event.target.value as ProductFilters['availabilityStatus'] }))}
          >
            <option value="">{t('common.all')}</option>
            <option value="AVAILABLE">{formatStatusLabel(t, 'AVAILABLE')}</option>
            <option value="SOLD_OUT">{formatStatusLabel(t, 'SOLD_OUT')}</option>
          </select>
        </label>
      </div>

      {productsQuery.isLoading ? <LoadingState title={t('products.loading')} /> : null}
      {productsQuery.isError ? <ErrorState title={t('products.errorTitle')} description={t('common.errorDescription')} /> : null}
      {productsQuery.data?.length === 0 ? <EmptyState title={t('products.emptyTitle')} description={t('products.emptyBody')} /> : null}
      {productsQuery.data && productsQuery.data.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>{t('products.name')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.kitchen')}</th>
                <th>{t('products.price')}</th>
                <th>{t('common.status')}</th>
                <th>{t('products.availability')}</th>
                <th>{t('products.modifiers')}</th>
                <th>{t('common.updated')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pagedItems.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    {product.description ? <small>{product.description}</small> : null}
                  </td>
                  <td>{product.categoryName ?? t('products.menu')}</td>
                  <td>{product.kitchenStation?.name ?? t('products.defaultRoute')}</td>
                  <td>{money.format(product.price)}</td>
                  <td><span className={`status ${product.status.toLowerCase()}`}>{formatStatusLabel(t, product.status)}</span></td>
                  <td><span className={`status ${product.availabilityStatus.toLowerCase().replace('_', '-')}`}>{formatStatusLabel(t, product.availabilityStatus)}</span></td>
                  <td>{product.modifierCount}</td>
                  <td>{new Date(product.updatedAt).toLocaleString()}</td>
                  <td>
                    <div className="table-actions">
                      <button className="secondary-button" type="button" onClick={() => setEditorProductId(product.id)}>{t('common.edit')}</button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => availabilityMutation.mutate({ id: product.id, availabilityStatus: product.availabilityStatus === 'SOLD_OUT' ? 'AVAILABLE' : 'SOLD_OUT' })}
                      >
                        {product.availabilityStatus === 'SOLD_OUT' ? t('common.restore') : t('common.soldOutAction')}
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => statusMutation.mutate({ id: product.id, status: product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      >
                        {product.status === 'ACTIVE' ? t('common.disable') : t('common.enable')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
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
  const { t } = useAdminI18n();
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
            <span className="eyebrow">{isNew ? t('products.newProduct') : t('products.editor')}</span>
            <h2>{isNew ? t('products.createProduct') : product?.name ?? t('products.loadingProduct')}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        {productQuery.isLoading ? <LoadingState title={t('products.loadingDetail')} /> : null}
        <div className="editor-section">
          <h3>{t('products.basicInfo')}</h3>
          <div className="editor-grid">
            <label>{t('products.name')}<input value={visibleForm.name} onChange={(event) => updateField('name', event.target.value)} /></label>
            <label>{t('products.price')}<input type="number" min="0" step="0.01" value={visibleForm.price} onChange={(event) => updateField('price', Number(event.target.value))} /></label>
            <label>
              {t('products.category')}
              <select value={visibleForm.categoryId ?? ''} onChange={(event) => updateField('categoryId', event.target.value)}>
                <option value="">{t('products.menu')}</option>
                {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              {t('products.kitchen')}
              <select value={visibleForm.kitchenStationId ?? ''} onChange={(event) => updateField('kitchenStationId', event.target.value)}>
                <option value="">{t('products.categoryDefaultRoute')}</option>
                {activeKitchenStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </label>
            <label>
              {t('common.status')}
              <select value={visibleForm.status} onChange={(event) => updateField('status', event.target.value as ProductFormInput['status'])}>
                <option value="ACTIVE">{formatStatusLabel(t, 'ACTIVE')}</option>
                <option value="INACTIVE">{formatStatusLabel(t, 'INACTIVE')}</option>
              </select>
            </label>
            <label>
              {t('products.availability')}
              <select value={visibleForm.availabilityStatus} onChange={(event) => updateField('availabilityStatus', event.target.value as ProductFormInput['availabilityStatus'])}>
                <option value="AVAILABLE">{formatStatusLabel(t, 'AVAILABLE')}</option>
                <option value="SOLD_OUT">{formatStatusLabel(t, 'SOLD_OUT')}</option>
              </select>
            </label>
            <label className="span-2">{t('products.description')}<input value={visibleForm.description ?? ''} onChange={(event) => updateField('description', event.target.value)} /></label>
          </div>
          {saveMutation.isError ? <p className="form-error">{t('products.saveError')}</p> : null}
          <button className="primary-button" type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? t('common.saving') : t('products.saveProduct')}
          </button>
        </div>

        {!isNew && product ? <ModifierEditor product={product} /> : null}
      </aside>
    </div>
  );
}

function ModifierEditor({ product }: { product: AdminProduct }) {
  const queryClient = useQueryClient();
  const { t } = useAdminI18n();
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
      <h3>{t('products.modifiers')}</h3>
      <div className="modifier-create">
        <input placeholder={t('products.groupNamePlaceholder')} value={groupForm.name} onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))} />
        <select value={groupForm.selectionType} onChange={(event) => setGroupForm((current) => ({ ...current, selectionType: event.target.value as 'SINGLE' | 'MULTI', maxSelect: event.target.value === 'SINGLE' ? 1 : current.maxSelect }))}>
          <option value="SINGLE">{t('products.single')}</option>
          <option value="MULTI">{t('products.multi')}</option>
        </select>
        <select value={groupForm.required ? 'required' : 'optional'} onChange={(event) => setGroupForm((current) => ({ ...current, required: event.target.value === 'required', minSelect: event.target.value === 'required' ? Math.max(current.minSelect, 1) : 0 }))}>
          <option value="required">{t('products.required')}</option>
          <option value="optional">{t('products.optional')}</option>
        </select>
        <input type="number" min="0" value={groupForm.minSelect} onChange={(event) => setGroupForm((current) => ({ ...current, minSelect: Number(event.target.value) }))} />
        <input type="number" min="1" value={groupForm.maxSelect} onChange={(event) => setGroupForm((current) => ({ ...current, maxSelect: Number(event.target.value) }))} />
        <button className="secondary-button" type="button" onClick={() => addGroup.mutate()} disabled={addGroup.isPending}>{t('products.addGroup')}</button>
      </div>
      <div className="modifier-list">
        {(product.modifierGroups ?? []).map((group) => <ModifierGroupCard key={group.id} productId={product.id} group={group} />)}
      </div>
    </div>
  );
}

function ModifierGroupCard({ productId, group }: { productId: string; group: AdminModifierGroup }) {
  const queryClient = useQueryClient();
  const { t } = useAdminI18n();
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
        <span className={`status ${group.status.toLowerCase()}`}>{formatStatusLabel(t, group.status)}</span>
      </div>
      <p>{group.required ? t('products.required') : t('products.optional')} · {group.selectionType} · min {group.minSelect} · max {group.maxSelect}</p>
      <div className="table-actions">
        <button className="secondary-button" type="button" onClick={() => saveGroup.mutate()}>{t('products.saveGroup')}</button>
        <button className="secondary-button" type="button" onClick={() => toggleGroup.mutate()}>{group.status === 'ACTIVE' ? t('common.disable') : t('common.enable')}</button>
      </div>
      <div className="option-list">
        {group.options.map((option) => <ModifierOptionRow key={option.id} option={option} onSaved={refresh} />)}
      </div>
      <div className="modifier-create option-create">
        <input placeholder={t('products.optionName')} value={optionName} onChange={(event) => setOptionName(event.target.value)} />
        <input type="number" min="0" step="0.01" value={priceDelta} onChange={(event) => setPriceDelta(Number(event.target.value))} />
        <button className="secondary-button" type="button" onClick={() => addOption.mutate()}>{t('products.addOption')}</button>
      </div>
    </div>
  );
}

function ModifierOptionRow({ option, onSaved }: { option: AdminModifierOption; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const [name, setName] = useState(option.name);
  const [priceDelta, setPriceDelta] = useState(option.priceDelta);
  const save = useMutation({ mutationFn: () => updateModifierOption(option.id, { name, priceDelta, status: option.status, sortOrder: option.sortOrder }), onSuccess: onSaved });
  const status = useMutation({ mutationFn: (next: AdminModifierOption['status']) => updateModifierOptionStatus(option.id, next), onSuccess: onSaved });

  return (
    <div className="option-row">
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <input type="number" min="0" step="0.01" value={priceDelta} onChange={(event) => setPriceDelta(Number(event.target.value))} />
      <span className={`status ${option.status.toLowerCase().replace('_', '-')}`}>{formatStatusLabel(t, option.status)}</span>
      <button className="secondary-button" type="button" onClick={() => save.mutate()}>{t('common.save')}</button>
      <button className="secondary-button" type="button" onClick={() => status.mutate(option.status === 'SOLD_OUT' ? 'ACTIVE' : 'SOLD_OUT')}>
        {option.status === 'SOLD_OUT' ? t('common.restore') : t('common.soldOutAction')}
      </button>
      <button className="secondary-button" type="button" onClick={() => status.mutate(option.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE')}>
        {option.status === 'INACTIVE' ? t('common.enable') : t('common.disable')}
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
  const { t } = useAdminI18n();
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
            <span className="eyebrow">{t('products.eyebrow')}</span>
            <h2>{t('products.categoryManager')}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modifier-create">
          <input placeholder={t('products.categoryPlaceholder')} value={name} onChange={(event) => setName(event.target.value)} />
          <button className="primary-button" type="button" onClick={() => create.mutate()}>{t('common.create')}</button>
        </div>
        <div className="category-list">
          {categories.map((category) => <CategoryRow key={category.id} activeKitchenStations={activeKitchenStations} category={category} onSaved={refresh} />)}
        </div>
      </aside>
    </div>
  );
}

function CategoryRow({ activeKitchenStations, category, onSaved }: { activeKitchenStations: KitchenStation[]; category: AdminCategory; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const [name, setName] = useState(category.name);
  const [defaultKitchenStationId, setDefaultKitchenStationId] = useState(category.defaultKitchenStation?.id ?? '');
  const save = useMutation({ mutationFn: () => updateCategory(category.id, { name, sortOrder: category.sortOrder, defaultKitchenStationId }), onSuccess: onSaved });
  const toggle = useMutation({ mutationFn: () => updateCategoryStatus(category.id, category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'), onSuccess: onSaved });

  return (
    <div className="category-row">
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <select value={defaultKitchenStationId} onChange={(event) => setDefaultKitchenStationId(event.target.value)}>
        <option value="">{t('common.storeDefault')}</option>
        {activeKitchenStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
      </select>
      <span className={`status ${category.status.toLowerCase()}`}>{formatStatusLabel(t, category.status)}</span>
      <span>{t('products.productCount', { count: category.productCount })}</span>
      <button className="secondary-button" type="button" onClick={() => save.mutate()}>{t('products.rename')}</button>
      <button className="secondary-button" type="button" onClick={() => toggle.mutate()}>{category.status === 'ACTIVE' ? t('common.disable') : t('common.enable')}</button>
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
