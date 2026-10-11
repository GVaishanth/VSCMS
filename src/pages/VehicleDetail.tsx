import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatTime, money } from '../utils/format';
import { appointmentStatusStyle, paymentStatusStyle, requestStatusStyle, serviceStateStyle } from '../utils/status';

export default function VehicleDetail() {
  const { vehicleId } = useParams();

  return (
    <DetailPage
      id={vehicleId}
      back="/vehicles"
      resource={api.vehicles.get}
      title={(item: any) => item.registration_number ?? `Vehicle #${vehicleId}`}
      fields={(item: any) => [
        ['Registration', item.registration_number],
        ['Customer', item.customer_id ? <Link className="link" to={`/customers/${item.customer_id}`}>{item.customer_name ?? 'Open customer record'}</Link> : item.customer_name ?? 'No customer linked'],
        ['Make / model', [item.make, item.model].filter(Boolean).join(' ') || '—'],
        ['Service state', <StatusBadge status={serviceStateStyle(item.service_state ?? 'IDLE')} withDot />],
        ['Mileage', item.current_mileage == null ? '—' : `${Number(item.current_mileage).toLocaleString('en-IN')} km`],
        ['Fuel', item.fuel_type],
        ['Transmission', item.transmission],
        ['Colour', item.color],
        ['Appointments', item.appointment_count ?? item.appointments?.length ?? 0],
        ['Work orders', item.request_count ?? item.totals?.total_requests ?? 0],
        ['Last visit', item.last_visit_date ? formatDate(item.last_visit_date) : 'No completed visit'],
        ['Total billed', money(item.totals?.total_billed ?? 0)],
      ]}
    >
      {(item: any) => (
        <div className="grid gap-4 xl:grid-cols-2">
          <RelatedRecordsPanel
            title="Work orders"
            subtitle={`${item.requests?.length ?? 0} linked to this vehicle`}
            records={(item.requests ?? []).map((request: any) => ({
              to: `/service-requests/${request.request_id}`,
              label: `Work order #${request.request_id}`,
              detail: `${request.service_type ?? 'Service'} · ${formatDate(request.appointment_date)}`,
              trailing: <StatusBadge status={requestStatusStyle(request.service_status)} size="sm" withIcon={false} withDot />,
            }))}
            emptyTitle="No work orders yet"
            emptyDescription="Work orders linked to this vehicle will appear here."
          />
          <RelatedRecordsPanel
            title="Appointments"
            subtitle={`${item.appointments?.length ?? 0} linked to this vehicle`}
            records={(item.appointments ?? []).map((appointment: any) => ({
              to: `/appointments/${appointment.appointment_id}`,
              label: `${formatDate(appointment.appointment_date)} · ${formatTime(appointment.appointment_time)}`,
              detail: `${appointment.service_type ?? 'Service'} · ${appointment.customer_name ?? item.customer_name ?? 'Customer'}`,
              trailing: <StatusBadge status={appointmentStatusStyle(appointment.status)} size="sm" withIcon={false} />,
            }))}
            emptyTitle="No appointments yet"
            emptyDescription="Bookings for this vehicle will appear here."
          />
          <RelatedRecordsPanel
            title="Invoices"
            subtitle={`${item.invoices?.length ?? 0} linked to this vehicle`}
            records={(item.invoices ?? []).map((invoice: any) => ({
              to: `/invoices/${invoice.invoice_id}`,
              label: `Invoice #${invoice.invoice_id}`,
              detail: `${formatDate(invoice.invoice_date)} · ${money(invoice.total_amount)}`,
              trailing: <StatusBadge status={paymentStatusStyle(invoice.payment_status)} size="sm" withIcon={false} withDot />,
            }))}
            emptyTitle="No invoices yet"
            emptyDescription="Invoices for this vehicle’s work orders will appear here."
          />
          <RelatedRecordsPanel
            title="Feedback"
            subtitle={`${item.feedback?.length ?? 0} linked to this vehicle`}
            records={(item.feedback ?? []).map((feedback: any) => ({
              to: `/feedback/${feedback.feedback_id}`,
              label: `Feedback · ${feedback.rating} / 5`,
              detail: `${formatDate(feedback.feedback_date)}${feedback.comments ? ` · ${feedback.comments}` : ''}`,
            }))}
            emptyTitle="No feedback yet"
            emptyDescription="Customer ratings for this vehicle’s work orders will appear here."
          />
        </div>
      )}
    </DetailPage>
  );
}
