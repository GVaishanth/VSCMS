import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox } from 'lucide-react';
import type { ApiClientError } from '../../services/api';
import type { Pagination } from '../../types';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { TableSkeleton } from './Skeleton';
import { PaginationBar } from './Pagination';

export interface Column<T> {
  /** Stable key, also used as React key for the cell. */
  key: string;
  header: ReactNode;
  /** Record field used for local sorting. */
  sortKey?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
  /** Cell renderer. */
  render?: (row: T, index: number) => ReactNode;
  /** Plain-text value used when no renderer is supplied and for CSV fallback. */
  value?: (row: T) => ReactNode;
  /** Hide the column below a breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  width?: string;
}

const HIDE_CLASS: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
  '2xl': 'hidden 2xl:table-cell',
};

const ALIGN_CLASS = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: ApiClientError | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string | undefined;
  selectedKey?: string | number | null;
  pagination?: Pagination | null;
  onPage?: (page: number) => void;
  sort?: string;
  order?: 'ASC' | 'DESC';
  onSort?: (sortKey: string) => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
  /** Row actions column content. */
  actions?: (row: T) => ReactNode;
  actionsLabel?: string;
  skeletonRows?: number;
  maxHeight?: string;
  dense?: boolean;
  caption?: string;
  striped?: boolean;
}

/**
 * The operational workhorse: sticky header, sortable columns, hover state,
 * loading skeletons, empty and error states, optional row actions and pagination.
 * Tables stay compact — records are never turned into cards.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records',
  emptyDescription = 'Nothing matches the current filters.',
  emptyAction,
  onRowClick,
  rowHref,
  selectedKey = null,
  pagination = null,
  onPage,
  sort,
  order = 'ASC',
  onSort,
  toolbar,
  footer,
  actions,
  actionsLabel = 'Actions',
  skeletonRows = 8,
  maxHeight,
  dense = false,
  caption,
  striped = false,
}: DataTableProps<T>) {
  const showActions = Boolean(actions);
  const padY = dense ? 'py-1.5' : 'py-2';

  return (
    <div className="surface flex min-w-0 flex-col overflow-hidden">
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">{toolbar}</div>
      ) : null}

      <div className="table-scroll" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        {error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : loading ? (
          <TableSkeleton columns={columns.length + (showActions ? 1 : 0)} rows={skeletonRows} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} action={emptyAction} />
        ) : (
          <table className="data">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead>
              <tr>
                {columns.map((column) => {
                  const sortable = Boolean(column.sortKey && onSort);
                  const isSorted = sortable && column.sortKey === sort;
                  const hideClass = column.hideBelow ? HIDE_CLASS[column.hideBelow] : '';
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      style={column.width ? { width: column.width } : undefined}
                      className={`${ALIGN_CLASS[column.align ?? 'left']} ${hideClass} ${column.headerClassName ?? ''} ${
                        sortable ? 'th-sortable' : ''
                      }`}
                      aria-sort={isSorted ? (order === 'ASC' ? 'ascending' : 'descending') : undefined}
                      onClick={sortable ? () => onSort?.(column.sortKey as string) : undefined}
                      onKeyDown={
                        sortable
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onSort?.(column.sortKey as string);
                              }
                            }
                          : undefined
                      }
                      tabIndex={sortable ? 0 : undefined}
                    >
                      <span
                        className={`inline-flex items-center gap-1 ${
                          column.align === 'right' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {column.header}
                        {sortable ? (
                          isSorted ? (
                            order === 'ASC' ? (
                              <ArrowUp size={11} className="shrink-0 text-brand" aria-hidden="true" />
                            ) : (
                              <ArrowDown size={11} className="shrink-0 text-brand" aria-hidden="true" />
                            )
                          ) : (
                            <ChevronsUpDown size={11} className="shrink-0 text-ink-faint/60" aria-hidden="true" />
                          )
                        ) : null}
                      </span>
                    </th>
                  );
                })}
                {showActions ? (
                  <th scope="col" className="w-[1%] text-right">
                    <span className="sr-only">{actionsLabel}</span>
                    <span aria-hidden="true" className="text-2xs font-semibold uppercase tracking-[0.06em] text-transparent">
                      {actionsLabel}
                    </span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const key = rowKey(row);
                const href = rowHref?.(row);
                const clickable = Boolean(onRowClick || href);
                const selected = selectedKey !== null && String(selectedKey) === String(key);
                return (
                  <tr
                    key={key}
                    data-clickable={clickable ? 'true' : undefined}
                    data-selected={selected ? 'true' : undefined}
                    onClick={
                      clickable
                        ? (event) => {
                            const target = event.target as HTMLElement;
                            if (target.closest('[data-no-row-click="true"]')) return;
                            if (href) {
                              window.location.assign(href);
                            } else {
                              onRowClick?.(row);
                            }
                          }
                        : undefined
                    }
                    className={striped && index % 2 === 1 ? 'bg-canvas/30' : undefined}
                  >
                    {columns.map((column) => {
                      const hideClass = column.hideBelow ? HIDE_CLASS[column.hideBelow] : '';
                      return (
                        <td
                          key={column.key}
                          className={`${ALIGN_CLASS[column.align ?? 'left']} ${padY} ${hideClass} ${column.className ?? ''}`}
                        >
                          {column.render ? column.render(row, index) : (column.value ? column.value(row) : '—')}
                        </td>
                      );
                    })}
                    {showActions ? (
                      <td className={`${padY} text-right`} data-no-row-click="true">
                        <div className="flex items-center justify-end gap-0.5">{actions?.(row)}</div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {footer ? <div className="border-t border-line px-3 py-2">{footer}</div> : null}

      {pagination && onPage && pagination.total > 0 ? (
        <div className="border-t border-line">
          <PaginationBar pagination={pagination} onPage={onPage} />
        </div>
      ) : null}
    </div>
  );
}
