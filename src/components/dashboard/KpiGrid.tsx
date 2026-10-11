import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Star,
  Users,
  Wrench,
} from 'lucide-react';
import { KpiCard, KpiSkeleton } from '../common/KpiCard';
import type { DashboardKpis } from '../../types';
import { count, moneyCompact } from '../../utils/format';

export interface KpiGridProps {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

/** Range-aware headline metrics; inventory counts are current snapshots. */
export function KpiGrid({ kpis, loading = false }: KpiGridProps) {
  const navigate = useNavigate();

  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <KpiSkeleton count={9} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      <KpiCard
        label="Work orders in range"
        value={count(kpis.work_orders_in_range)}
        icon={ClipboardList}
        tone="brand"
        hint={`${count(kpis.open_requests)} open · ${count(kpis.completed_requests)} completed`}
        onClick={() => navigate('/service-requests')}
      />
      <KpiCard
        label="Customers in range"
        value={count(kpis.total_customers)}
        icon={Users}
        hint={`${count(kpis.total_vehicles)} vehicles in range`}
        onClick={() => navigate('/customers')}
      />
      <KpiCard
        label="Vehicles in range"
        value={count(kpis.total_vehicles)}
        icon={Car}
        hint="With appointments in the selected range"
        onClick={() => navigate('/vehicles')}
      />
      <KpiCard
        label="Appointments today"
        value={count(kpis.appointments_today)}
        icon={CalendarDays}
        tone={kpis.appointments_today > 0 ? 'brand' : 'default'}
        hint={`${count(kpis.appointments_in_range)} in selected range`}
        onClick={() => navigate('/appointments')}
      />
      <KpiCard
        label="Active requests"
        value={count(kpis.active_requests)}
        icon={Wrench}
        tone={kpis.active_requests > 0 ? 'warning' : 'default'}
        hint={`${count(kpis.open_requests)} open · ${count(kpis.in_progress_requests)} in progress`}
        onClick={() => navigate('/service-requests?status=ACTIVE')}
      />
      <KpiCard
        label="Completed services"
        value={count(kpis.completed_requests)}
        icon={CheckCircle2}
        tone="success"
        hint={`${kpis.completion_rate.toFixed(0)}% completion rate in range`}
        onClick={() => navigate('/service-requests?status=COMPLETED')}
      />
      <KpiCard
        label="Low stock parts"
        value={count(kpis.low_stock_parts)}
        icon={AlertTriangle}
        tone={kpis.out_of_stock_parts > 0 ? 'danger' : kpis.low_stock_parts > 0 ? 'warning' : 'success'}
        hint={`${count(kpis.out_of_stock_parts)} out of stock · current inventory`}
        onClick={() => navigate('/inventory?stockStatus=LOW STOCK')}
      />
      <KpiCard
        label="Revenue in range"
        value={moneyCompact(kpis.total_revenue)}
        icon={IndianRupee}
        tone="brand"
        hint={`${moneyCompact(kpis.outstanding_revenue)} outstanding`}
        onClick={() => navigate('/invoices')}
      />
      <KpiCard
        label="Average rating"
        value={kpis.avg_rating ? kpis.avg_rating.toFixed(2) : '—'}
        icon={Star}
        tone={kpis.avg_rating >= 4 ? 'success' : kpis.avg_rating >= 3 ? 'warning' : 'default'}
        hint={`${count(kpis.feedback_count)} feedback records in range`}
        onClick={() => navigate('/feedback')}
      />
    </div>
  );
}
