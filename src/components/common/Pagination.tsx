import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination } from '../../types';
import { count } from '../../utils/format';
import { IconButton } from './Button';

export interface PaginationBarProps {
  pagination: Pagination;
  onPage: (page: number) => void;
  compact?: boolean;
}

function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

/** Compact pager: range summary, first/prev/next/last and a small page window. */
export function PaginationBar({ pagination, onPage, compact = false }: PaginationBarProps) {
  const { page, limit, total, totalPages } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-3 py-2" aria-label="Pagination">
      <p className="text-xs text-ink-muted tnum">
        {total === 0 ? 'No records' : `Showing ${count(from)}–${count(to)} of ${count(total)}`}
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          label="Previous page"
          size="sm"
          icon={<ChevronLeft size={14} aria-hidden="true" />}
          disabled={!pagination.hasPrev}
          onClick={() => onPage(page - 1)}
        />
        {!compact &&
          pageWindow(page, totalPages).map((entry, i) =>
            entry === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-ink-faint">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPage(entry)}
                aria-current={entry === page ? 'page' : undefined}
                className={`size-6 min-w-6 rounded-btn border px-1.5 text-xs font-medium tnum transition-colors ${
                  entry === page
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:bg-canvas hover:text-ink'
                }`}
              >
                {entry}
              </button>
            ),
          )}
        {compact ? (
          <span className="px-1 text-xs text-ink-muted tnum">
            {page} / {totalPages}
          </span>
        ) : null}
        <IconButton
          label="Next page"
          size="sm"
          icon={<ChevronRight size={14} aria-hidden="true" />}
          disabled={!pagination.hasNext}
          onClick={() => onPage(page + 1)}
        />
      </div>
    </nav>
  );
}
