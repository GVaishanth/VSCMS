/** Formatting helpers — Indian numbering and currency, ISO dates from the API. */

const inrExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const intFormat = new Intl.NumberFormat('en-IN');
const decimalFormat = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value: unknown): string {
  const n = Number(value);
  return inrExact.format(Number.isFinite(n) ? n : 0);
}

export function moneyWhole(value: unknown): string {
  const n = Number(value);
  return inrWhole.format(Number.isFinite(n) ? n : 0);
}

/** Compact rupee amount for KPI cards: 12,40,000 -> ₹12.4L */
export function moneyCompact(value: unknown): string {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs >= 1e8 ? 1 : 2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs >= 1e6 ? 1 : 2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(abs >= 10000 ? 1 : 2)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

export function count(value: unknown): string {
  const n = Number(value);
  return intFormat.format(Number.isFinite(n) ? n : 0);
}

export function decimal(value: unknown, digits = 2): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return decimalFormat.format(n).replace(/\.00$/, digits === 0 ? '' : '.00');
}

export function percent(value: unknown, digits = 1): string {
  const n = Number(value);
  return `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;
}

/** 'YYYY-MM-DD' -> '08 Oct 2026' */
export function formatDate(value: unknown): string {
  if (!value) return '—';
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateShort(value: unknown): string {
  if (!value) return '—';
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

/** 'YYYY-MM' -> 'Oct 2026' */
export function formatMonth(value: unknown): string {
  const s = String(value ?? '');
  if (!/^\d{4}-\d{2}$/.test(s)) return s || '—';
  const [y, m] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** 'HH:MM:SS' -> '11:30' (24h, the workshop standard) */
export function formatTime(value: unknown): string {
  if (!value) return '—';
  const s = String(value);
  const match = s.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : s;
}

/** 'YYYY-MM-DD HH:MM:SS' -> '08 Oct 2026, 14:22' */
export function formatDateTime(value: unknown): string {
  if (!value) return '—';
  const s = String(value);
  const [datePart, timePart] = s.split(/[ T]/);
  return timePart ? `${formatDate(datePart)}, ${formatTime(timePart)}` : formatDate(datePart);
}

export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

export function relativeDay(iso: unknown): string {
  const s = String(iso ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—';
  const diff = Math.round((new Date(`${s}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

/** 'TN23AB1000' -> 'TN 23 AB 1000' for readability, keeping the raw value available. */
export function formatRegistration(value: unknown): string {
  const raw = String(value ?? '').trim().toUpperCase();
  const match = raw.match(/^([A-Z]{2})\s*(\d{1,2})\s*([A-Z]{1,3})\s*(\d{1,4})$/);
  if (!match) return raw || '—';
  return `${match[1]} ${match[2].padStart(2, '0')} ${match[3]} ${match[4].padStart(4, '0')}`;
}

export function initials(firstName?: string | null, lastName?: string | null): string {
  const a = (firstName ?? '').trim().charAt(0);
  const b = (lastName ?? '').trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '—';
}

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ') || '—';
}

export function duration(minutes: unknown): string {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return '—';
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  if (hours === 0) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function truncate(value: unknown, max = 80): string {
  const s = String(value ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function titleCase(value: unknown): string {
  const s = String(value ?? '').toLowerCase().replace(/[_-]+/g, ' ');
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
