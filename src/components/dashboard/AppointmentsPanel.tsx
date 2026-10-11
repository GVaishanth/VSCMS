import { Link } from 'react-router-dom';
import { CalendarDays, CalendarPlus, Clock } from 'lucide-react';
import { Panel } from '../common/Panel';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { appointmentStatusStyle, requestStatusStyle } from '../../utils/status';
import { formatDate, formatRegistration, formatTime, relativeDay } from '../../utils/format';
import type { Appointment } from '../../types';

export interface AppointmentsPanelProps {
  date: string;
  appointments: Appointment[];
  upcoming: (Appointment & { days_away: number })[];
  loading?: boolean;
  onNew?: () => void;
}

/**
 * Today's schedule in workshop order (by time). When the selected day is empty the
 * panel shows the next real bookings from APPOINTMENT rather than placeholder copy.
 */
export function AppointmentsPanel({ date, appointments, upcoming, loading = false, onNew }: AppointmentsPanelProps) {
  const showUpcoming = appointments.length === 0 && upcoming.length > 0;

  return (
    <Panel
      flush
      title={showUpcoming ? 'Next appointments' : "Today's appointments"}
      subtitle={
        showUpcoming
          ? `No bookings on ${formatDate(date)} — showing the next scheduled vehicles`
          : `${formatDate(date)} · ${appointments.length} booking${appointments.length === 1 ? '' : 's'}`
      }
      actions={
        onNew ? (
          <Button variant="primary" size="sm" icon={<CalendarPlus size={13} aria-hidden="true" />} onClick={onNew}>
            New appointment
          </Button>
        ) : null
      }
      className="min-h-[300px]"
    >
      {loading ? (
        <div className="divide-y divide-line-soft">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="skeleton h-3.5 w-12" />
              <div className="skeleton h-3.5 flex-1" />
              <div className="skeleton h-3.5 w-16" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 && !showUpcoming ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments scheduled"
          description={`Nothing is booked for ${formatDate(date)}. Create an appointment to put a vehicle on the schedule.`}
          action={
            onNew ? (
              <Button variant="primary" size="sm" icon={<CalendarPlus size={13} aria-hidden="true" />} onClick={onNew}>
                New appointment
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="divide-y divide-line-soft">
          {(showUpcoming ? upcoming : appointments).map((row) => {
            const status = appointmentStatusStyle(row.status);
            const requestStatus = row.service_status ? requestStatusStyle(row.service_status) : null;
            const daysAway = 'days_away' in row ? Number(row.days_away) : null;
            return (
              <li key={row.appointment_id} className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-canvas/60">
                <span className="flex w-12 shrink-0 flex-col items-start">
                  <span className="text-[13px] font-semibold text-ink tnum">{formatTime(row.appointment_time)}</span>
                  {daysAway !== null ? (
                    <span className="text-2xs text-ink-faint">{relativeDay(row.appointment_date)}</span>
                  ) : null}
                </span>
                <span className="hidden h-8 w-px shrink-0 bg-line sm:block" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/vehicles/${row.vehicle_id}`}
                      className="truncate font-mono text-xs font-medium text-ink hover:text-brand hover:underline"
                    >
                      {formatRegistration(row.registration_number)}
                    </Link>
                    <span className="truncate text-xs text-ink-muted">
                      {row.make} {row.model}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-2xs text-ink-muted">
                    <Clock size={10} aria-hidden="true" />
                    {row.service_type}
                    <span className="text-line-strong">·</span>
                    {row.customer_id ? (
                      <Link to={`/customers/${row.customer_id}`} className="truncate hover:text-brand hover:underline">
                        {row.customer_name ?? 'Open customer record'}
                      </Link>
                    ) : row.customer_name ?? 'Customer not linked'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {requestStatus ? <StatusBadge status={requestStatus} size="sm" withIcon={false} withDot /> : null}
                  <StatusBadge status={status} size="sm" withIcon={false} />
                  {row.request_id ? (
                    <Link
                      to={`/service-requests/${row.request_id}`}
                      className="hidden text-2xs font-medium text-brand hover:underline sm:inline"
                    >
                      #{row.request_id}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
