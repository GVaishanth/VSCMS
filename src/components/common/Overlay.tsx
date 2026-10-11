import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const WIDTH: Record<NonNullable<OverlayProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

/** Centred dialog (8px radius) for compact CRUD forms and confirmations. */
export function Modal({ open, onClose, children, labelledBy, size = 'md' }: OverlayProps) {
  useLockBody(open);
  useEscape(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;
    const focusable = node.querySelector<HTMLElement>(
      'input:not([type=hidden]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? node).focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 animate-fade-in bg-navy/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative z-10 my-auto w-full ${WIDTH[size]} animate-slide-up rounded-dialog border border-line bg-surface shadow-pop`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Right-hand drawer for wider forms and record detail. */
export function Drawer({ open, onClose, children, labelledBy, size = 'md' }: OverlayProps) {
  useLockBody(open);
  useEscape(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;
    const focusable = node.querySelector<HTMLElement>(
      'input:not([type=hidden]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? node).focus();
  }, [open]);

  if (!open) return null;

  const widthClass =
    size === 'sm'
      ? 'max-w-sm'
      : size === 'md'
        ? 'max-w-lg'
        : size === 'lg'
          ? 'max-w-2xl'
          : 'max-w-4xl';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-navy/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative z-10 flex h-full w-full ${widthClass} animate-slide-left flex-col border-l border-line bg-canvas shadow-pop`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function OverlayHeader({
  title,
  subtitle,
  onClose,
  id,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  id: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <IconButton label="Close" icon={<X size={15} aria-hidden="true" />} onClick={onClose} />
      </div>
    </header>
  );
}

export function OverlayFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <footer
      className={`flex items-center justify-end gap-2 border-t border-line bg-surface px-4 py-3 ${className}`}
    >
      {children}
    </footer>
  );
}

export function OverlayBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-h-0 flex-1 overflow-y-auto p-4 ${className}`}>{children}</div>;
}
