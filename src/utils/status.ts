import type { LucideIcon } from 'lucide-react';
import {
  CircleDashed,
  Loader,
  PauseCircle,
  CheckCircle2,
  XCircle,
  CalendarClock,
  CalendarCheck2,
  AlertTriangle,
  Package,
  Wallet,
  Wrench,
  Star,
} from 'lucide-react';

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent';

export interface StatusStyle {
  label: string;
  tone: Tone;
  icon: LucideIcon;
  /** Tailwind classes for the pill: subtle tint, no heavy fills. */
  className: string;
  dotClassName: string;
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'border-line bg-canvas text-ink-muted',
  brand: 'border-brand/25 bg-brand-soft text-brand-deep',
  success: 'border-success/25 bg-success-soft text-success',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  danger: 'border-danger/25 bg-danger-soft text-danger',
  accent: 'border-accent/30 bg-accent-soft text-accent-deep',
};

const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-ink-faint',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
};

function style(label: string, tone: Tone, icon: LucideIcon): StatusStyle {
  return { label, tone, icon, className: TONE_CLASS[tone], dotClassName: TONE_DOT[tone] };
}

/* SERVICE_REQUEST.service_status */
const REQUEST_STATUS: Record<string, StatusStyle> = {
  OPEN: style('Open', 'brand', CircleDashed),
  IN_PROGRESS: style('In progress', 'warning', Loader),
  ON_HOLD: style('On hold', 'neutral', PauseCircle),
  COMPLETED: style('Completed', 'success', CheckCircle2),
  CANCELLED: style('Cancelled', 'danger', XCircle),
};

/* APPOINTMENT.status */
const APPOINTMENT_STATUS: Record<string, StatusStyle> = {
  BOOKED: style('Scheduled', 'brand', CalendarClock),
  CONFIRMED: style('Confirmed', 'accent', CalendarCheck2),
  COMPLETED: style('Completed', 'success', CheckCircle2),
  CANCELLED: style('Cancelled', 'danger', XCircle),
};

/* INVOICE.payment_status */
const PAYMENT_STATUS: Record<string, StatusStyle> = {
  PENDING: style('Pending', 'warning', Wallet),
  PARTIAL: style('Part paid', 'brand', Wallet),
  PAID: style('Paid', 'success', CheckCircle2),
};

/* MECHANIC.availability_status */
const AVAILABILITY: Record<string, StatusStyle> = {
  AVAILABLE: style('Available', 'success', Wrench),
  BUSY: style('Busy', 'warning', Wrench),
  ON_LEAVE: style('On leave', 'neutral', PauseCircle),
};

/* Stock labels calculated from the local inventory quantity and reorder level. */
const STOCK_STATUS: Record<string, StatusStyle> = {
  'IN STOCK': style('In stock', 'success', Package),
  'LOW STOCK': style('Low stock', 'warning', AlertTriangle),
  'OUT OF STOCK': style('Out of stock', 'danger', AlertTriangle),
};

/* Derived vehicle display state (no column in the schema) */
const SERVICE_STATE: Record<string, StatusStyle> = {
  'IN SERVICE': style('In service', 'warning', Wrench),
  SERVICED: style('Serviced', 'success', CheckCircle2),
  CANCELLED: style('Cancelled', 'danger', XCircle),
  IDLE: style('Idle', 'neutral', CircleDashed),
};

/* APPOINTMENT.booking_mode */
const BOOKING_MODE: Record<string, StatusStyle> = {
  ONLINE: style('Online', 'brand', CalendarClock),
  PHONE: style('Phone', 'neutral', CalendarClock),
  WALK_IN: style('Walk-in', 'accent', CalendarClock),
};

const FALLBACK = (label: string) => style(label || 'Unknown', 'neutral', CircleDashed);

function normalise(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export const requestStatusStyle = (v: unknown): StatusStyle => REQUEST_STATUS[normalise(v)] ?? FALLBACK(String(v ?? 'Unknown'));
export const appointmentStatusStyle = (v: unknown): StatusStyle => APPOINTMENT_STATUS[normalise(v)] ?? FALLBACK(String(v ?? 'Unknown'));
export const paymentStatusStyle = (v: unknown): StatusStyle => PAYMENT_STATUS[normalise(v)] ?? FALLBACK(String(v ?? 'Unknown'));
export const availabilityStyle = (v: unknown): StatusStyle => AVAILABILITY[normalise(v)] ?? FALLBACK(String(v ?? 'Unknown'));
export const stockStatusStyle = (v: unknown): StatusStyle => STOCK_STATUS[normalise(v)] ?? FALLBACK(String(v ?? 'Unknown'));
export const serviceStateStyle = (v: unknown): StatusStyle => SERVICE_STATE[normalise(v)] ?? FALLBACK(String(v ?? 'Unknown'));
export const bookingModeStyle = (v: unknown): StatusStyle => BOOKING_MODE[normalise(v)] ?? FALLBACK(String(v ?? 'Unknown'));

/** Colour used for a request status in charts. */
export const REQUEST_STATUS_COLOR: Record<string, string> = {
  OPEN: '#2563EB',
  IN_PROGRESS: '#B7791F',
  ON_HOLD: '#64748B',
  COMPLETED: '#16803C',
  CANCELLED: '#C53030',
};

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  PAID: '#16803C',
  PARTIAL: '#2563EB',
  PENDING: '#B7791F',
};

export const CHART_COLORS = ['#0E2433', '#2563EB', '#F28C28', '#16803C', '#B7791F', '#64748B', '#C53030', '#17384A'];

export function ratingColor(rating: number): string {
  if (rating >= 5) return '#16803C';
  if (rating >= 4) return '#2563EB';
  if (rating >= 3) return '#B7791F';
  return '#C53030';
}

export const StarIcon = Star;
