import { Star } from 'lucide-react';
import { count } from '../../utils/format';
import { ratingColor } from '../../utils/status';

export interface RatingBarsProps {
  distribution: { rating: number; count: number; share?: number }[];
  total?: number;
}

/** Rating distribution as compact bars — clearer than a pie for 5 buckets. */
export function RatingBars({ distribution, total }: RatingBarsProps) {
  const sum = total ?? distribution.reduce((acc, d) => acc + Number(d.count ?? 0), 0);
  const max = Math.max(1, ...distribution.map((d) => Number(d.count ?? 0)));

  return (
    <ul className="space-y-1.5">
      {distribution.map((entry) => {
        const value = Number(entry.count ?? 0);
        const share = entry.share ?? (sum ? (value / sum) * 100 : 0);
        return (
          <li key={entry.rating} className="flex items-center gap-2">
            <span className="flex w-9 shrink-0 items-center gap-0.5 text-xs text-ink-muted">
              <span className="tnum">{entry.rating}</span>
              <Star size={11} strokeWidth={1.8} fill={ratingColor(entry.rating)} color={ratingColor(entry.rating)} aria-hidden="true" />
            </span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-[2px] bg-line-soft">
              <span
                className="block h-full rounded-[2px] transition-[width] duration-300"
                style={{ width: `${(value / max) * 100}%`, background: ratingColor(entry.rating) }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-xs font-semibold text-ink tnum">{count(value)}</span>
            <span className="w-11 shrink-0 text-right text-2xs text-ink-faint tnum">{share.toFixed(0)}%</span>
          </li>
        );
      })}
      {sum === 0 ? <li className="text-xs text-ink-faint">No feedback recorded yet.</li> : null}
    </ul>
  );
}
