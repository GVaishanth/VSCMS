import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Panel } from '../common/Panel';
import { StatusDonut } from '../charts/StatusDonut';
import { EmptyState } from '../common/EmptyState';
import type { RequestStatus } from '../../types';
import { moneyCompact } from '../../utils/format';

export interface RequestStatusPanelProps {
  data: { service_status: RequestStatus; total: number; estimated_value: number; actual_value: number }[];
  loading?: boolean;
}

/** Service request status mix plus the money tied up in each state. */
export function RequestStatusPanel({ data, loading = false }: RequestStatusPanelProps) {
  const total = data.reduce((acc, row) => acc + Number(row.total ?? 0), 0);
  const openValue = data
    .filter((row) => ['OPEN', 'IN_PROGRESS', 'ON_HOLD'].includes(String(row.service_status).toUpperCase()))
    .reduce((acc, row) => acc + Number(row.estimated_value ?? 0), 0);
  const realisedValue = data
    .filter((row) => String(row.service_status).toUpperCase() === 'COMPLETED')
    .reduce((acc, row) => acc + Number(row.actual_value ?? 0), 0);

  return (
    <Panel
      title="Service request status"
      subtitle={`${total} work orders · ${moneyCompact(openValue)} estimated in progress · ${moneyCompact(realisedValue)} realised`}
      actions={
        <Link to="/service-requests" className="btn-ghost btn-sm inline-flex items-center gap-1">
          <ClipboardList size={13} aria-hidden="true" />
          Open register
        </Link>
      }
      className="min-h-[300px]"
    >
      {loading ? (
        <div className="flex items-center gap-4">
          <div className="skeleton size-[168px] rounded-full" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-3.5 w-full" />
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No service requests yet"
          description="Work orders appear here once an appointment is converted into a service request."
          compact
        />
      ) : (
        <StatusDonut data={data} />
      )}
    </Panel>
  );
}
