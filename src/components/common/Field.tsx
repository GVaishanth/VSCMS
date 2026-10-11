import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

/** Label + control + validation message. Every form field uses this wrapper. */
export function Field({ label, htmlFor, required, hint, error, children, className = '' }: FieldProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className={`label ${required ? 'label-required' : ''}`}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-2xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-2xs leading-snug text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  wrapperClassName?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function TextInput({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className = '',
  leading,
  trailing,
  id,
  ...rest
}: TextInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} htmlFor={inputId} required={required} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
            {leading}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          className={`input ${leading ? 'pl-7' : ''} ${trailing ? 'pr-9' : ''} ${className}`}
          {...rest}
        />
        {trailing ? (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint">{trailing}</span>
        ) : null}
      </div>
    </Field>
  );
}

export interface NumberInputProps extends TextInputProps {
  step?: number | string;
  min?: number;
  max?: number;
}

export function NumberInput({ step, min, max, ...rest }: NumberInputProps) {
  return <TextInput type="number" inputMode="decimal" step={step} min={min} max={max} className="tnum" {...rest} />;
}

export interface SelectInputProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  wrapperClassName?: string;
  options: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
  placeholderValue?: string;
}

export function SelectInput({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  options,
  placeholder,
  placeholderValue = '',
  className = '',
  id,
  ...rest
}: SelectInputProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field label={label} htmlFor={selectId} required={required} hint={hint} error={error} className={wrapperClassName}>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        className={`select ${className}`}
        {...rest}
      >
        {placeholder ? <option value={placeholderValue}>{placeholder}</option> : null}
        {options.map((option) => (
          <option key={String(option.value)} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  wrapperClassName?: string;
  rows?: number;
}

export function TextArea({
  label,
  hint,
  error,
  required,
  wrapperClassName,
  rows = 3,
  className = '',
  id,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <Field label={label} htmlFor={areaId} required={required} hint={hint} error={error} className={wrapperClassName}>
      <textarea
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        className={`input resize-y leading-relaxed ${className}`}
        {...rest}
      />
    </Field>
  );
}

/** Two/three column form grid that stacks on narrow screens. */
export function FormGrid({
  children,
  columns = 2,
  className = '',
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridClass = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';
  return <div className={`grid grid-cols-1 gap-3 ${gridClass} ${className}`}>{children}</div>;
}

/** Full-width field inside a FormGrid. */
export function FullWidth({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2 lg:col-span-3">{children}</div>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-3.5 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Read-only note inside a form, used to explain derived local behavior. */
export function FormNote({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  const cls =
    tone === 'warning'
      ? 'border-warning/25 bg-warning-soft text-warning'
      : 'border-line bg-canvas text-ink-muted';
  return (
    <p className={`rounded-input border px-2.5 py-2 text-2xs leading-relaxed ${cls}`}>{children}</p>
  );
}
