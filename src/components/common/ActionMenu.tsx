import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

export interface ActionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger' | 'brand';
  disabled?: boolean;
  hint?: string;
}

export interface ActionMenuProps {
  items: ActionItem[];
  label?: string;
  align?: 'left' | 'right';
}

/**
 * Row action menu rendered in a portal so dense tables never clip it.
 * Keyboard: Enter/Space opens, Escape closes, arrows move focus.
 */
export function ActionMenu({ items, label = 'Row actions', align = 'right' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const enabled = items.filter((item) => !item.disabled);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button[data-item]') ?? []);
      if (!buttons.length) return;
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === 'ArrowDown'
          ? buttons[(current + 1) % buttons.length]
          : buttons[(current - 1 + buttons.length) % buttons.length];
      event.preventDefault();
      next?.focus();
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;
    const first = menuRef.current.querySelector<HTMLButtonElement>('button[data-item]');
    first?.focus();
  }, [open]);

  function toggle() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = 208;
    const left = align === 'right' ? Math.max(8, rect.right - width) : Math.max(8, rect.left);
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(enabled.length * 34 + 12, 280);
    const top = spaceBelow > estimatedHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - estimatedHeight - 4);
    setCoords({ top, left });
    setOpen((prev) => !prev);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-no-row-click="true"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          toggle();
        }}
        className={`inline-flex size-7 items-center justify-center rounded-btn border transition-colors duration-100 ${
          open ? 'border-line-strong bg-canvas text-ink' : 'border-transparent text-ink-faint hover:border-line hover:bg-canvas hover:text-ink'
        }`}
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </button>

      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              data-no-row-click="true"
              className="fixed z-[80] w-52 animate-slide-up overflow-hidden rounded-card border border-line bg-surface py-1 shadow-pop"
              style={{ top: coords.top, left: coords.left }}
            >
              {enabled.length === 0 ? (
                <p className="px-3 py-2 text-xs text-ink-faint">No actions available</p>
              ) : (
                enabled.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    data-item="true"
                    title={item.hint ?? item.label}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpen(false);
                      item.onSelect();
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors duration-75 ${
                      item.tone === 'danger'
                        ? 'text-danger hover:bg-danger-soft'
                        : item.tone === 'brand'
                          ? 'text-brand hover:bg-brand-soft'
                          : 'text-ink hover:bg-canvas'
                    }`}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </button>
                ))
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
