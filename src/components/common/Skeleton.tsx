export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="p-0" aria-busy="true" aria-live="polite">
      <div className="flex gap-3 border-b border-line bg-canvas px-3 py-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 border-b border-line-soft px-3 py-2.5 last:border-b-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 flex-1 ${c === 0 ? 'max-w-[120px]' : ''}`} />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading data</span>
    </div>
  );
}

export function PanelSkeleton({ lines = 4, title = true }: { lines?: number; title?: boolean }) {
  return (
    <div className="surface p-4" aria-busy="true">
      {title ? <Skeleton className="h-4 w-40" /> : null}
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="surface p-4">
        <Skeleton className="h-6 w-56" />
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-2 h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
      <PanelSkeleton lines={6} />
    </div>
  );
}

export function KpiRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface p-3.5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-2.5 h-6 w-16" />
          <Skeleton className="mt-2 h-2.5 w-20" />
        </div>
      ))}
    </>
  );
}
