import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, Gauge } from 'lucide-react';
import { NAV_GROUPS } from '../../navigation';
import type { NavItem } from '../../navigation';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function NavRow({ item, collapsed, onCloseMobile }: { item: NavItem; collapsed: boolean; onCloseMobile: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={collapsed ? item.label : undefined}
      onClick={onCloseMobile}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-btn px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-100 ${
          collapsed ? 'justify-center px-0' : ''
        } ${
          isActive
            ? 'bg-navy-soft text-white'
            : 'text-[#9DB0BE] hover:bg-navy-soft/60 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1/2 h-[18px] w-[2px] -translate-y-1/2 rounded-r-sm bg-brand transition-opacity duration-100 ${
              isActive ? 'opacity-100' : 'opacity-0'
            } ${collapsed ? 'left-0' : '-left-[10px]'}`}
          />
          <Icon
            size={16}
            strokeWidth={1.8}
            className={isActive ? 'shrink-0 text-white' : 'shrink-0 text-[#7E95A6] group-hover:text-white'}
            aria-hidden="true"
          />
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </>
      )}
    </NavLink>
  );
}

/**
 * Compact dark navy rail. 248px expanded, 60px collapsed on wide screens,
 * off-canvas below lg. Active items use a 2px blue indicator — never a pill.
 */
export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const widthClass = collapsed ? 'xl:w-[60px]' : 'xl:w-[248px]';

  const content = (
    <div
      className={`flex h-full flex-col bg-navy transition-[width] duration-150 ${widthClass} w-[248px]`}
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className={`flex items-center gap-2.5 border-b border-navy-line px-4 py-3.5 ${collapsed ? 'xl:justify-center xl:px-0' : ''}`}>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-btn bg-navy-soft ring-1 ring-inset ring-accent/40"
          aria-hidden="true"
        >
          <Gauge size={17} strokeWidth={1.8} className="text-accent" />
        </span>
        <div className={`min-w-0 ${collapsed ? 'xl:hidden' : ''}`}>
          <p className="text-[15px] font-semibold leading-none tracking-[0.02em] text-white">VSCMS</p>
          <p className="mt-1 truncate text-2xs leading-none text-[#7E95A6]">
            Vehicle Service Center Management
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            {!collapsed ? (
              <p className="mb-1.5 px-2.5 text-2xs font-semibold uppercase tracking-[0.14em] text-[#5F7688]">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-navy-line xl:block hidden" aria-hidden="true" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavRow item={item} collapsed={collapsed} onCloseMobile={onCloseMobile} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse control — wide screens only */}
      <div className="hidden border-t border-navy-line p-2 xl:block">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className={`flex w-full items-center gap-2 rounded-btn px-2.5 py-1.5 text-xs font-medium text-[#7E95A6] transition-colors duration-100 hover:bg-navy-soft hover:text-white ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          {collapsed ? <ChevronsRight size={15} aria-hidden="true" /> : <ChevronsLeft size={15} aria-hidden="true" />}
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen shrink-0 xl:block">
        <div className={`h-full transition-[width] duration-150 ${widthClass}`}>{content}</div>
      </aside>

      {/* Mobile / tablet off-canvas */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-navy/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-[248px] animate-slide-left shadow-pop">{content}</div>
        </div>
      ) : null}
    </>
  );
}
