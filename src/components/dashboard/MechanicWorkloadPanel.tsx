import { Link, useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Panel } from '../common/Panel';
import { WorkloadChart } from '../charts/WorkloadChart';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { availabilityStyle } from '../../utils/status';
import { count, moneyCompact } from '../../utils/format';
import type { Mechanic } from '../../types';

export interface MechanicWorkloadPanelProps {
  data: Mechanic[];
  loading?: boolean;
}

/** Technician load: active vs completed work orders, availability and bonus. */
export function MechanicWorkloadPanel({ data, loading = false }: MechanicWorkloadPanelProps) {
  const navigate = useNavigate();
  const busy = data.filter((m) => Number(m.active_jobs ?? 0) > 0).length;

  return (
    <Panel
      flush
      title="Mechanic workload"
      subtitle={`${data.length} technicians · ${busy} with active work · bonus ${moneyCompact(
        data.reduce((acc, m) => acc + Number(m.total_bonus ?? 0), 0),
      )}`}
      actions={
        <Link to="/mechanics" className="btn-ghost btn-sm inline-flex items-center gap-1">
          <Wrench size={13} aria-hidden="true" />
          Workshop team
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={Wrench} title="No mechanics registered" description="Add technicians to see workshop load." compact />
      ) : (
        <>
          <div className="px-2 pt-3">
            <WorkloadChart data={data} height={Math.max(180, data.length * 26 + 24)} />
          </div>
          <div className="mt-2 border-t border-line">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Technician</th>
                  <th scope="col" className="hidden sm:table-cell">Specialisation</th>
                  <th scope="col" className="text-right">Active</th>
                  <th scope="col" className="text-right">Done</th>
                  <th scope="col" className="hidden text-right md:table-cell">Revenue</th>
                  <th scope="col" className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.mechanic_id} data-clickable="true" onClick={() => navigate(`/mechanics/${m.mechanic_id}`)}>
                    <td>
                      <Link
                        to={`/mechanics/${m.mechanic_id}`}
                        data-no-row-click="true"
                        className="truncate text-[13px] font-medium text-ink hover:text-brand hover:underline"
                      >
                        {m.mechanic_name ?? `${m.first_name} ${m.last_name}`}
                      </Link>
                    </td>
                    <td className="hidden text-xs text-ink-muted sm:table-cell">{m.specialization ?? '—'}</td>
                    <td className="text-right text-[13px] font-semibold text-warning tnum">{count(m.active_jobs)}</td>
                    <td className="text-right text-[13px] text-ink-muted tnum">{count(m.completed_jobs)}</td>
                    <td className="hidden text-right text-xs text-ink-muted tnum md:table-cell">
                      {moneyCompact(m.revenue_handled)}
                    </td>
                    <td className="text-right">
                      <StatusBadge status={availabilityStyle(m.availability_status)} size="sm" withIcon={false} withDot />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}
