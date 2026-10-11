import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Panel } from '../common/Panel';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { stockStatusStyle } from '../../utils/status';
import { count, money } from '../../utils/format';
import type { SparePartRow } from '../../types';

export interface InventoryAlertsPanelProps {
  data: (SparePartRow & { shortfall: number })[];
  loading?: boolean;
}

/** Parts at or below reorder level, worst first. Sourced from fn_stock_status. */
export function InventoryAlertsPanel({ data, loading = false }: InventoryAlertsPanelProps) {
  const navigate = useNavigate();
  const outOfStock = data.filter((p) => String(p.stock_status).toUpperCase() === 'OUT OF STOCK').length;

  return (
    <Panel
      flush
      title="Inventory alerts"
      subtitle={
        data.length
          ? `${count(data.length)} part${data.length === 1 ? '' : 's'} at or below reorder level · ${count(outOfStock)} out of stock`
          : 'Stock levels are healthy'
      }
      actions={
        <Link to="/inventory?stockStatus=ATTENTION" className="btn-ghost btn-sm inline-flex items-center gap-1">
          <Package size={13} aria-hidden="true" />
          Inventory
        </Link>
      }
    >
      {loading ? (
        <div className="divide-y divide-line-soft">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="skeleton h-3.5 flex-1" />
              <div className="skeleton h-3.5 w-14" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No stock alerts"
          description="Every part is above its reorder level."
          compact
        />
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col" className="hidden lg:table-cell">Supplier</th>
              <th scope="col" className="text-right">Stock</th>
              <th scope="col" className="hidden text-right sm:table-cell">Reorder</th>
              <th scope="col" className="hidden text-right md:table-cell">Unit price</th>
              <th scope="col" className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((part) => (
              <tr key={part.part_id} data-clickable="true" onClick={() => navigate(`/inventory/${part.part_id}`)}>
                <td>
                  <Link
                    to={`/inventory/${part.part_id}`}
                    data-no-row-click="true"
                    className="block truncate text-[13px] font-medium text-ink hover:text-brand hover:underline"
                  >
                    {part.part_name}
                  </Link>
                  <span className="block truncate text-2xs text-ink-faint">
                    {part.category ?? 'Uncategorised'}
                    {part.manufacturer ? ` · ${part.manufacturer}` : ''}
                  </span>
                </td>
                <td className="hidden truncate text-xs text-ink-muted lg:table-cell">{part.supplier_name ?? '—'}</td>
                <td className="text-right">
                  <span className="text-[13px] font-semibold text-ink tnum">{count(part.stock_quantity)}</span>
                  {Number(part.shortfall) > 0 ? (
                    <span className="ml-1 text-2xs text-danger tnum">−{count(part.shortfall)}</span>
                  ) : null}
                </td>
                <td className="hidden text-right text-xs text-ink-muted tnum sm:table-cell">{count(part.reorder_level)}</td>
                <td className="hidden text-right text-xs text-ink-muted tnum md:table-cell">{money(part.unit_price)}</td>
                <td className="text-right">
                  <StatusBadge status={stockStatusStyle(part.stock_status)} size="sm" withIcon={false} withDot />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
