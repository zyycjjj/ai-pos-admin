import { useAdminI18n } from '../i18n';

type PaginationProps = {
  from: number;
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions?: number[];
  total: number;
  to: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function Pagination({
  from,
  onPageChange,
  onPageSizeChange,
  page,
  pageCount,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  to,
  total,
}: PaginationProps) {
  const { t } = useAdminI18n();
  if (total <= Math.min(...pageSizeOptions)) {
    return null;
  }

  return (
    <div className="pagination">
      <span>{t('common.showing', { from, to, total })}</span>
      <label>
        {t('common.rowsPerPage')}
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <div className="pagination-actions">
        <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t('common.previous')}
        </button>
        <span>{t('common.page')} {page} / {pageCount}</span>
        <button className="secondary-button" type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

type ShowAllToggleProps = {
  isShowingAll: boolean;
  total: number;
  visibleCount: number;
  onToggle: () => void;
};

export function ShowAllToggle({ isShowingAll, onToggle, total, visibleCount }: ShowAllToggleProps) {
  const { t } = useAdminI18n();
  if (total <= visibleCount) return null;
  return (
    <button className="secondary-button" type="button" onClick={onToggle}>
      {isShowingAll ? t('common.showLess') : `${t('common.showAll')} (${total})`}
    </button>
  );
}
