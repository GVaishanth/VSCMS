import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Modal, OverlayBody, OverlayFooter, OverlayHeader } from './Overlay';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/** Destructive-action confirmation. Concise, never alarmist. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-title" size="sm">
      <OverlayHeader id="confirm-title" title={title} onClose={onCancel} />
      <OverlayBody>
        <div className="flex gap-3">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-btn border ${
              tone === 'danger' ? 'border-danger/25 bg-danger-soft text-danger' : 'border-brand/25 bg-brand-soft text-brand'
            }`}
            aria-hidden="true"
          >
            <TriangleAlert size={15} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 text-[13px] leading-relaxed text-ink-muted">
            {description}
            {children}
          </div>
        </div>
      </OverlayBody>
      <OverlayFooter>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </OverlayFooter>
    </Modal>
  );
}
