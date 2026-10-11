import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate } from '../utils/format';
import { requestStatusStyle } from '../utils/status';
import { Rating } from '../components/common/Rating';

export default function FeedbackDetail() {
  const { feedbackId } = useParams();

  return (
    <DetailPage
      id={feedbackId}
      back="/feedback"
      resource={api.feedback.get}
      title={(item: any) => `Feedback #${item.feedback_id}`}
      fields={(item: any) => [
        ['Feedback ID', item.feedback_id],
        ['Rating', <span className="inline-flex items-center gap-2"><Rating value={Number(item.rating)} showValue={false} /><span>{item.rating} / 5</span></span>],
        ['Feedback date', formatDate(item.feedback_date)],
        ['Customer', item.customer_id ? <Link className="link" to={`/customers/${item.customer_id}`}>{item.customer_name ?? 'Open customer record'}</Link> : item.customer_name ?? 'Customer not linked'],
        ['Vehicle', item.vehicle_id ? <Link className="link" to={`/vehicles/${item.vehicle_id}`}>{item.registration_number ?? 'Open vehicle record'}</Link> : item.registration_number ?? 'Vehicle not linked'],
        ['Mechanic', item.mechanic_id ? <Link className="link" to={`/mechanics/${item.mechanic_id}`}>{item.mechanic_name ?? 'Open mechanic record'}</Link> : item.mechanic_name ?? 'Not assigned'],
        ['Work-order status', item.service_status ? <StatusBadge status={requestStatusStyle(item.service_status)} withDot /> : 'No work-order status available'],
        ['Comments', item.comments || 'No written comment'],
      ]}
    >
      {(item: any) => (
        <RelatedRecordsPanel
          title="Rated work order"
          subtitle="Feedback is attached to the completed service request"
          records={item.request_id ? [{
            to: `/service-requests/${item.request_id}`,
            label: `Work order #${item.request_id}`,
            detail: `${item.service_type ?? 'Service'} · ${formatDate(item.appointment_date)} · ${item.customer_name ?? 'Customer'}`,
            trailing: item.service_status ? <StatusBadge status={requestStatusStyle(item.service_status)} size="sm" withIcon={false} withDot /> : undefined,
          }] : []}
          emptyTitle="Work order connection unavailable"
          emptyDescription="The request linked to this feedback could not be found. Check the imported records or restore a valid backup."
        />
      )}
    </DetailPage>
  );
}
