import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  tone?: 'default' | 'danger' | 'brand';
  size?: 'sm' | 'md';
}

/** Square icon-only control with an accessible label. */
export function IconButton({ label, icon, tone = 'default', size = 'md', className = '', ...rest }: IconButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-danger hover:bg-danger-soft hover:border-danger/30'
      : tone === 'brand'
        ? 'text-brand hover:bg-brand-soft hover:border-brand/30'
        : 'text-ink-muted hover:bg-canvas hover:text-ink hover:border-line-strong';
  const sizeClass = size === 'sm' ? 'size-6' : 'size-7';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex ${sizeClass} shrink-0 items-center justify-center rounded-btn border border-transparent transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${className}`.trim()}
      {...rest}
    >
      {icon}
    </button>
  );
}
