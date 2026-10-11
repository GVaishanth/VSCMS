import { Star } from 'lucide-react';
import { ratingColor } from '../../utils/status';

export interface RatingProps {
  value: number | null | undefined;
  size?: number;
  showValue?: boolean;
  outOf?: number;
  className?: string;
}

/** Read-only star rating. FEEDBACK.rating is CHECK(rating BETWEEN 1 AND 5). */
export function Rating({ value, size = 13, showValue = true, outOf = 5, className = '' }: RatingProps) {
  const v = Number(value ?? 0);
  const color = ratingColor(v);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={v ? `${v} out of ${outOf}` : 'No rating'}>
      <span className="inline-flex items-center gap-px" aria-hidden="true">
        {Array.from({ length: outOf }).map((_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.8}
            className={i < Math.round(v) ? '' : 'text-line-strong'}
            fill={i < Math.round(v) ? color : 'none'}
            color={i < Math.round(v) ? color : undefined}
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-medium tnum" style={{ color: v ? color : undefined }}>
          {v ? v.toFixed(v % 1 === 0 ? 0 : 1) : '—'}
        </span>
      ) : null}
      <span className="sr-only">{v ? `Rated ${v} out of ${outOf}` : 'Not rated'}</span>
    </span>
  );
}

export interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  name?: string;
  disabled?: boolean;
  error?: string | null;
}

/** Interactive 1–5 rating picker aligned with local feedback validation. */
export function RatingInput({ value, onChange, name = 'rating', disabled = false, error }: RatingInputProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">Rating (1 to 5)</legend>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = star <= value;
          return (
            <label
              key={star}
              className={`flex cursor-pointer items-center justify-center rounded-btn border p-1 transition-colors duration-100 ${
                selected ? 'border-accent/40 bg-accent-soft' : 'border-line bg-surface hover:border-line-strong'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              title={`${star} star${star > 1 ? 's' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="sr-only"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              />
              <Star
                size={17}
                strokeWidth={1.8}
                className={selected ? 'text-accent' : 'text-line-strong'}
                fill={selected ? '#F28C28' : 'none'}
                aria-hidden="true"
              />
            </label>
          );
        })}
        <span className="ml-2 text-[13px] font-medium text-ink tnum">{value ? `${value}.0` : '—'}</span>
      </div>
      {error ? (
        <p className="mt-1 text-2xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
