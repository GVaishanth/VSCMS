import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, money } from '../utils/format';
import { stockStatusStyle } from '../utils/status';

export default function PartDetail() {
  const { partId } = useParams();

  return (
    <DetailPage
      id={partId}
      back="/inventory"
      resource={api.inventory.get}
      title={(item: any) => item.part_name ?? `Part #${item.part_id}`}
      fields={(item: any) => [
        ['Part ID', item.part_id],
        ['Category', item.category],
        ['Manufacturer', item.manufacturer],
        ['Supplier', item.supplier_id ? <Link className="link" to={`/suppliers/${item.supplier_id}`}>{item.supplier_name ?? 'Open supplier record'}</Link> : item.supplier_name ?? 'Supplier not linked'],
        ['Stock on hand', item.stock_quantity],
        ['Reorder level', item.reorder_level],
        ['Unit price', money(item.unit_price)],
        ['Stock value', money(item.stock_value ?? 0)],
        ['Stock status', <StatusBadge status={stockStatusStyle(item.stock_status)} withDot />],
        ['Warranty', item.warranty_months == null ? '—' : `${item.warranty_months} months`],
      ]}
    >
      {(item: any) => (
        <RelatedRecordsPanel
          title="Work orders using this part"
          subtitle={`${item.usages?.length ?? 0} recorded usage lines`}
          records={(item.usages ?? []).map((usage: any) => ({
            to: `/service-requests/${usage.request_id}`,
            label: `Work order #${usage.request_id} · ${usage.registration_number ?? 'Vehicle'}`,
            detail: `${usage.customer_name ?? 'Customer'} · ${formatDate(usage.appointment_date)}`,
            trailing: <span className="text-right text-xs font-medium text-ink-muted">{usage.quantity_used} × {money(usage.unit_price ?? item.unit_price)}</span>,
          }))}
          emptyTitle="No usage recorded"
          emptyDescription="This part has not been issued to any work orders."
        />
      )}
    </DetailPage>
  );
}
