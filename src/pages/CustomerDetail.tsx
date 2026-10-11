import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, money } from '../utils/format';
import { appointmentStatusStyle, paymentStatusStyle, requestStatusStyle } from '../utils/status';

export default function CustomerDetail() {
  const { customerId } = useParams();

  return (
    <DetailPage
      id={customerId}
      back="/customers"
      resource={api.customers.get}
      title={(item: any) => item.customer_name ?? `${item.first_name} ${item.last_name}`}
      fields={(item: any) => [
        ['Customer ID', item.customer_id],
        ['Phone', item.phone],
        ['Email', item.email],
        ['City', item.city],
        ['Address', item.address],
        ['Vehicles', item.vehicles?.length ?? 0],
        ['Total billed', money(item.totals?.total_billed ?? 0)],
        ['Total paid', money(item.totals?.total_paid ?? 0)],
        ['Outstanding', money(item.totals?.outstanding ?? 0)],
        ['Average rating', item.totals?.avg_rating ? `${item.totals.avg_rating} / 5` : 'No ratings yet'],
      ]}
    >
      {(item: any) => (
        <div className="grid gap-4 xl:grid-cols-2">
          <RelatedRecordsPanel
            title="Vehicles"
            subtitle={`${item.vehicles?.length ?? 0} registered to this customer`}
            records={(item.vehicles ?? []).map((vehicle: any) => ({
              to: `/vehicles/${vehicle.vehicle_id}`,
              label: vehicle.registration_number,
              detail: `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() || 'Vehicle record',
            }))}
            emptyTitle="No vehicles linked"
            emptyDescription="Vehicles registered to this customer will appear here."
          />
          <RelatedRecordsPanel
            title="Work orders"
            subtitle={`${item.requests?.length ?? 0} service records`}
            records={(item.requests ?? []).map((request: any) => ({
              to: `/service-requests/${request.request_id}`,
              label: `Work order #${request.request_id}`,
              detail: `${request.registration_number ?? 'Vehicle'} · ${request.service_type ?? 'Service'} · ${formatDate(request.appointment_date)}`,
              trailing: <StatusBadge status={requestStatusStyle(request.service_status)} size="sm" withIcon={false} withDot />,
            }))}
            emptyTitle="No work orders yet"
            emptyDescription="Service history for this customer will appear here."
          />
          <RelatedRecordsPanel
            title="Appointments"
            subtitle={`${item.appointments?.length ?? 0} bookings`}
            records={(item.appointments ?? []).map((appointment: any) => ({
              to: `/appointments/${appointment.appointment_id}`,
              label: `Appointment #${appointment.appointment_id} · ${formatDate(appointment.appointment_date)}`,
              detail: `${appointment.registration_number ?? 'Vehicle'} · ${appointment.service_type ?? 'Service'}`,
              trailing: <StatusBadge status={appointmentStatusStyle(appointment.status)} size="sm" withIcon={false} />,
            }))}
            emptyTitle="No appointments yet"
            emptyDescription="Bookings for this customer will appear here."
          />
          <RelatedRecordsPanel
            title="Invoices"
            subtitle={`${item.invoices?.length ?? 0} invoices`}
            records={(item.invoices ?? []).map((invoice: any) => ({
              to: `/invoices/${invoice.invoice_id}`,
              label: `Invoice #${invoice.invoice_id}`,
              detail: `${formatDate(invoice.invoice_date)} · ${money(invoice.total_amount)}`,
              trailing: <StatusBadge status={paymentStatusStyle(invoice.payment_status)} size="sm" withIcon={false} withDot />,
            }))}
            emptyTitle="No invoices yet"
            emptyDescription="Invoices for this customer’s work will appear here."
          />
          <RelatedRecordsPanel
            title="Feedback"
            subtitle={`${item.feedback?.length ?? 0} ratings`}
            records={(item.feedback ?? []).map((feedback: any) => ({
              to: `/feedback/${feedback.feedback_id}`,
              label: `Feedback · ${feedback.rating} / 5`,
              detail: `${formatDate(feedback.feedback_date)}${feedback.comments ? ` · ${feedback.comments}` : ''}`,
            }))}
            emptyTitle="No feedback yet"
            emptyDescription="Ratings submitted by this customer will appear here."
          />
        </div>
      )}
    </DetailPage>
  );
}
