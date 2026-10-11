import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, money } from '../utils/format';
import { availabilityStyle, requestStatusStyle } from '../utils/status';

export default function MechanicDetail() {
  const { mechanicId } = useParams();

  return (
    <DetailPage
      id={mechanicId}
      back="/mechanics"
      resource={api.mechanics.get}
      title={(item: any) => item.mechanic_name ?? `${item.first_name} ${item.last_name}`}
      fields={(item: any) => [
        ['Mechanic ID', item.mechanic_id],
        ['Phone', item.phone],
        ['Specialisation', item.specialization],
        ['Availability', <StatusBadge status={availabilityStyle(item.availability_status)} withDot />],
        ['Experience', item.experience_years == null ? '—' : `${item.experience_years} years`],
        ['Salary', money(item.salary)],
        ['Bonus', money(item.total_bonus)],
        ['Assigned requests', item.requests?.length ?? 0],
        ['Active jobs', item.performance?.active_jobs ?? 0],
        ['Completed jobs', item.performance?.completed_requests ?? 0],
        ['Revenue handled', money(item.performance?.total_revenue_handled ?? 0)],
      ]}
    >
      {(item: any) => (
        <RelatedRecordsPanel
          title="Assigned work orders"
          subtitle={`${item.requests?.length ?? 0} requests assigned to this mechanic`}
          records={(item.requests ?? []).map((request: any) => ({
            to: `/service-requests/${request.request_id}`,
            label: `Work order #${request.request_id} · ${request.registration_number ?? 'Vehicle'}`,
            detail: `${request.customer_name ?? 'Customer'} · ${request.service_type ?? 'Service'} · ${formatDate(request.appointment_date)}`,
            trailing: <StatusBadge status={requestStatusStyle(request.service_status)} size="sm" withIcon={false} withDot />,
          }))}
          emptyTitle="No work orders assigned"
          emptyDescription="Work orders assigned to this mechanic will appear here."
        />
      )}
    </DetailPage>
  );
}
