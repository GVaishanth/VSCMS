import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DetailPage } from './_shared';
import { RelatedRecordsPanel } from '../components/common/RelatedRecordsPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, money } from '../utils/format';
import { paymentStatusStyle, requestStatusStyle } from '../utils/status';

export default function InvoiceDetail() {
  const { invoiceId } = useParams();

  return (
    <DetailPage
      id={invoiceId}
      back="/invoices"
      resource={api.invoices.get}
      title={(item: any) => `Invoice #${item.invoice_id}`}
      fields={(item: any) => [
        ['Invoice ID', item.invoice_id],
        ['Work order', item.context?.request_id ? <Link className="link" to={`/service-requests/${item.context.request_id}`}>Work order #{item.context.request_id}</Link> : `Request #${item.request_id}`],
        ['Customer', item.context?.customer_id ? <Link className="link" to={`/customers/${item.context.customer_id}`}>{item.context.customer_name ?? 'Open customer record'}</Link> : item.context?.customer_name ?? 'Customer not linked'],
        ['Vehicle', item.context?.vehicle_id ? <Link className="link" to={`/vehicles/${item.context.vehicle_id}`}>{item.context.registration_number ?? 'Open vehicle record'}</Link> : item.context?.registration_number ?? 'Vehicle not linked'],
        ['Invoice date', formatDate(item.invoice_date)],
        ['Labour', money(item.labor_amount)],
        ['Parts', money(item.parts_amount)],
        ['Tax', money(item.tax_amount)],
        ['Discount', money(item.discount_amount)],
        ['Total', money(item.total_amount)],
        ['Payment', <StatusBadge status={paymentStatusStyle(item.payment_status)} withDot />],
        ['Calculation check', item.verification?.matches ? 'Matches stored total' : 'Check required'],
      ]}
    >
      {(item: any) => (
        <div className="grid gap-4 xl:grid-cols-2">
          <RelatedRecordsPanel
            title="Work order"
            subtitle="Source record for this invoice"
            records={item.context ? [{
              to: `/service-requests/${item.context.request_id}`,
              label: `Work order #${item.context.request_id}`,
              detail: `${item.context.service_type ?? 'Service'} · ${item.context.customer_name ?? 'Customer'} · ${formatDate(item.context.appointment_date)}`,
              trailing: <StatusBadge status={requestStatusStyle(item.context.service_status)} size="sm" withIcon={false} withDot />,
            }] : []}
            emptyTitle="Work-order connection unavailable"
            emptyDescription="The work order for this invoice could not be found. Check the imported records or restore a valid backup."
          />
          <RelatedRecordsPanel
            title="Labour lines"
            subtitle={`${item.labour_lines?.length ?? 0} service lines on this work order`}
            records={(item.labour_lines ?? []).map((line: any) => ({
              to: `/services/${line.service_id}`,
              label: line.service_name,
              detail: `${line.description || line.remarks || 'Service performed'} · ${money(line.labor_charge)}`,
            }))}
            emptyTitle="No itemised labour lines"
            emptyDescription="A labour amount may still be invoiced even when separate service lines were not recorded."
          />
          <RelatedRecordsPanel
            title="Parts"
            subtitle={`${item.part_lines?.length ?? 0} issued part lines`}
            records={(item.part_lines ?? []).map((line: any) => ({
              to: `/inventory/${line.part_id}`,
              label: line.part_name ?? `Part #${line.part_id}`,
              detail: `${line.quantity_used} used · ${money(line.total_cost)}`,
            }))}
            emptyTitle="No parts charged"
            emptyDescription="No part-usage lines are attached to this invoice."
          />
          <RelatedRecordsPanel
            title="Customer feedback"
            subtitle="Feedback attached to the invoiced work order"
            records={item.feedback ? [{
              to: `/feedback/${item.feedback.feedback_id}`,
              label: `Feedback · ${item.feedback.rating} / 5`,
              detail: `${formatDate(item.feedback.feedback_date)}${item.feedback.comments ? ` · ${item.feedback.comments}` : ''}`,
            }] : []}
            emptyTitle="No feedback linked"
            emptyDescription="Feedback for this work order will appear here once submitted."
          />
        </div>
      )}
    </DetailPage>
  );
}
