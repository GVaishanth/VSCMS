import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}

/** Debounced search field used by every list screen. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  debounce = 280,
  className = '',
  ariaLabel = 'Search',
  autoFocus = false,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, debounce);

  useEffect(() => {
    if (value !== local && value !== debounced) setLocal(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
        aria-hidden="true"
      />
      <input
        type="search"
        role="searchbox"
        value={local}
        autoFocus={autoFocus}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setLocal('');
            onChange('');
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="input pl-8 pr-7 [appearance:none] [&::-webkit-search-cancel-button]:hidden"
      />
      {local ? (
        <button
          type="button"
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-btn p-1 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
