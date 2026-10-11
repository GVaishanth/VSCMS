import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Car,
  CalendarDays,
  ClipboardList,
  Wrench,
  Settings2,
  Package,
  Truck,
  FileText,
  MessageSquare,
  BarChart3,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Match this route exactly (used for the overview link). */
  end?: boolean;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Sidebar structure exactly as specified: OPERATIONS / WORKSHOP / FINANCE / INSIGHTS. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Overview', path: '/', icon: LayoutDashboard, end: true, description: 'Service center overview' },
      { label: 'Customers', path: '/customers', icon: Users, description: 'Customer register and history' },
      { label: 'Vehicles', path: '/vehicles', icon: Car, description: 'Fleet register and service state' },
      { label: 'Appointments', path: '/appointments', icon: CalendarDays, description: 'Booking schedule' },
      { label: 'Service Requests', path: '/service-requests', icon: ClipboardList, description: 'Work orders' },
    ],
  },
  {
    label: 'Workshop',
    items: [
      { label: 'Mechanics', path: '/mechanics', icon: Wrench, description: 'Technicians, workload and bonus' },
      { label: 'Services', path: '/services', icon: Settings2, description: 'Labour line items' },
      { label: 'Inventory', path: '/inventory', icon: Package, description: 'Spare parts and stock' },
      { label: 'Suppliers', path: '/suppliers', icon: Truck, description: 'Parts suppliers' },
    ],
  },
  {
    label: 'Finance',
    items: [{ label: 'Invoices', path: '/invoices', icon: FileText, description: 'Billing and payment status' }],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Feedback', path: '/feedback', icon: MessageSquare, description: 'Customer ratings' },
      { label: 'Reports', path: '/reports', icon: BarChart3, description: 'Locally calculated summaries and exports' },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export interface RouteMeta {
  group: string;
  title: string;
  description: string;
}

/** Top-bar title and group label, derived from the current path. */
export function routeMeta(pathname: string): RouteMeta {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/') return { group: 'Operations', title: 'Overview', description: 'Service center overview' };

  const exact = ALL_NAV_ITEMS.find((item) => item.path === clean);
  if (exact) {
    const group = NAV_GROUPS.find((g) => g.items.some((i) => i.path === exact.path))?.label ?? '';
    return { group, title: exact.label, description: exact.description };
  }

  const parent = ALL_NAV_ITEMS.find((item) => item.path !== '/' && clean.startsWith(`${item.path}/`));
  if (parent) {
    const group = NAV_GROUPS.find((g) => g.items.some((i) => i.path === parent.path))?.label ?? '';
    const tail = clean.slice(parent.path.length + 1).split('/')[0] ?? '';
    return {
      group,
      title: parent.label,
      description: tail ? `${parent.label} · record ${tail}` : parent.description,
    };
  }

  return { group: '', title: 'Not found', description: 'Unknown route' };
}
