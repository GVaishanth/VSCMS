import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, money } from '../utils/format';
import { requestStatusStyle } from '../utils/status';

export default function ServiceDetail() {
  const { serviceId } = useParams();

  return (
    <DetailPage
      id={serviceId}
      back="/services"
      resource={api.services.get}
      title={(item: any) => item.service_name ?? `Service line #${item.service_id}`}
      fields={(item: any) => [
        ['Service line ID', item.service_id],
        ['Work order', item.request_id ? <Link className="link" to={`/service-requests/${item.request_id}`}>Work order #{item.request_id}</Link> : 'No work order linked'],
        ['Customer', item.customer_id ? <Link className="link" to={`/customers/${item.customer_id}`}>{item.customer_name ?? 'Open customer record'}</Link> : item.customer_name ?? 'Customer not linked'],
        ['Vehicle', item.vehicle_id ? <Link className="link" to={`/vehicles/${item.vehicle_id}`}>{item.registration_number ?? 'Open vehicle record'}</Link> : item.registration_number ?? 'Vehicle not linked'],
        ['Make / model', [item.make, item.model].filter(Boolean).join(' ') || '—'],
        ['Service date', formatDate(item.appointment_date)],
        ['Work-order status', item.service_status ? <StatusBadge status={requestStatusStyle(item.service_status)} withDot /> : 'No status available'],
        ['Labour charge', money(item.labor_charge)],
        ['Estimated duration', item.estimated_duration == null ? '—' : `${item.estimated_duration} minutes`],
        ['Assigned mechanic', item.request_context?.mechanic_id ? <Link className="link" to={`/mechanics/${item.request_context.mechanic_id}`}>{item.mechanic_name ?? 'Open mechanic record'}</Link> : item.mechanic_name ?? 'Not assigned'],
        ['Description', item.description || item.remarks || 'No description recorded'],
      ]}
    >
      {(item: any) => (
        <RelatedRecordsPanel
          title="Parent work order"
          subtitle="Service lines belong to a single work order"
          records={item.request_context ? [{
            to: `/service-requests/${item.request_id}`,
            label: `Work order #${item.request_id}`,
            detail: `${item.request_context.complaint_description || item.service_type || 'Service'} · ${formatDate(item.request_context.appointment_date)}`,
            trailing: <StatusBadge status={requestStatusStyle(item.request_context.service_status)} size="sm" withIcon={false} withDot />,
          }] : []}
          emptyTitle="Work order connection unavailable"
          emptyDescription="The parent request for this service line could not be found. Check the imported records or restore a valid backup."
        />
      )}
    </DetailPage>
  );
}
