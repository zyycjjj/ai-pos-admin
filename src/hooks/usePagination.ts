import { useEffect, useMemo, useState } from 'react';

export function usePagination<T>(items: T[] | undefined, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const total = items?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const pagedItems = useMemo(() => (items ?? []).slice(startIndex, startIndex + pageSize), [items, pageSize, startIndex]);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [page, safePage]);

  return {
    page: safePage,
    pageSize,
    pageCount,
    pagedItems,
    total,
    from: total === 0 ? 0 : startIndex + 1,
    to: Math.min(startIndex + pageSize, total),
    setPage,
    setPageSize: (nextPageSize: number) => {
      setPageSize(nextPageSize);
      setPage(1);
    },
  };
}
