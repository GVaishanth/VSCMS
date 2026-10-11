import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { money } from '../utils/format';
import { stockStatusStyle } from '../utils/status';

export default function SupplierDetail() {
  const { supplierId } = useParams();

  return (
    <DetailPage
      id={supplierId}
      back="/suppliers"
      resource={api.suppliers.get}
      title={(item: any) => item.supplier_name ?? `Supplier #${item.supplier_id}`}
      fields={(item: any) => [
        ['Supplier ID', item.supplier_id],
        ['Contact', item.contact_person],
        ['Phone', item.phone],
        ['Email', item.email],
        ['Address', item.address],
        ['City', item.city],
        ['GST number', item.gst_number],
        ['Parts supplied', item.parts?.length ?? 0],
        ['Stock value', money((item.parts ?? []).reduce((sum: number, part: any) => sum + Number(part.stock_value ?? 0), 0))],
      ]}
    >
      {(item: any) => (
        <RelatedRecordsPanel
          title="Supplied parts"
          subtitle={`${item.parts?.length ?? 0} inventory items`}
          records={(item.parts ?? []).map((part: any) => ({
            to: `/inventory/${part.part_id}`,
            label: part.part_name,
            detail: `${part.category ?? 'Uncategorised'} · ${part.stock_quantity} in stock · ${money(part.unit_price)}`,
            trailing: <StatusBadge status={stockStatusStyle(part.stock_status)} size="sm" withIcon={false} withDot />,
          }))}
          emptyTitle="No parts linked"
          emptyDescription="Inventory parts supplied by this vendor will appear here."
        />
      )}
    </DetailPage>
  );
}
