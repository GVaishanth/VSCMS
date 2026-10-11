import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatTime, titleCase } from '../utils/format';
import { appointmentStatusStyle, requestStatusStyle } from '../utils/status';

export default function AppointmentDetail() {
  const { appointmentId } = useParams();

  return (
    <DetailPage
      id={appointmentId}
      back="/appointments"
      resource={api.appointments.get}
      title={(item: any) => `Appointment #${item.appointment_id}`}
      fields={(item: any) => [
        ['Appointment ID', item.appointment_id],
        ['Vehicle', item.vehicle_id ? <Link className="link" to={`/vehicles/${item.vehicle_id}`}>{item.registration_number ?? 'Open vehicle record'}</Link> : item.registration_number ?? 'Vehicle not linked'],
        ['Customer', item.customer_id ? <Link className="link" to={`/customers/${item.customer_id}`}>{item.customer_name ?? 'Open customer record'}</Link> : item.customer_name ?? 'Customer not linked'],
        ['Date', formatDate(item.appointment_date)],
        ['Time', formatTime(item.appointment_time)],
        ['Service type', item.service_type],
        ['Booking mode', titleCase(item.booking_mode)],
        ['Appointment status', <StatusBadge status={appointmentStatusStyle(item.status)} withDot />],
        ['Work-order status', item.service_status ? <StatusBadge status={requestStatusStyle(item.service_status)} withDot /> : 'No work order yet'],
        ['Assigned mechanic', item.mechanic_id ? <Link className="link" to={`/mechanics/${item.mechanic_id}`}>{item.mechanic_name ?? 'Open mechanic record'}</Link> : item.mechanic_name ?? 'Not assigned'],
      ]}
    >
      {(item: any) => (
        <div className="grid gap-4 xl:grid-cols-2">
          <RelatedRecordsPanel
            title="Linked work order"
            subtitle="The service request created from this booking"
            records={item.request ? [{
              to: `/service-requests/${item.request.request_id}`,
              label: `Work order #${item.request.request_id}`,
              detail: `${item.request.complaint_description || item.service_type} · ${item.request.customer_name ?? item.customer_name ?? 'Customer'}`,
              trailing: <StatusBadge status={requestStatusStyle(item.request.service_status)} size="sm" withIcon={false} withDot />,
            }] : []}
            emptyTitle="No work order linked yet"
            emptyDescription="This appointment is still a booking. Once a work order is created, it will appear here."
          />
          <RelatedRecordsPanel
            title="Other vehicle appointments"
            subtitle="Bookings for the same vehicle"
            records={(item.history ?? []).map((appointment: any) => ({
              to: `/appointments/${appointment.appointment_id}`,
              label: `Appointment #${appointment.appointment_id} · ${formatDate(appointment.appointment_date)}`,
              detail: `${formatTime(appointment.appointment_time)} · ${appointment.service_type ?? 'Service'}`,
              trailing: <StatusBadge status={appointmentStatusStyle(appointment.status)} size="sm" withIcon={false} />,
            }))}
            emptyTitle="No other appointments"
            emptyDescription="There are no other bookings recorded for this vehicle."
          />
        </div>
      )}
    </DetailPage>
  );
}
