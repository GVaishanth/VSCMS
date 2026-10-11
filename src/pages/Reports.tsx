import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { SectionHeading, Panel } from '../components/common/Panel';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Download } from 'lucide-react';

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export default function Reports() {
  const s = useApi(() => api.reports.invoiceSummary(), []);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [order, setOrder] = useState<'ASC' | 'DESC'>('ASC');
  const rows = s.data?.rows ?? [];
  const columns = Object.keys(rows[0] ?? {}).slice(0, 9).map((key) => ({
    key,
    header: key.replaceAll('_', ' '),
    sortKey: key,
    render: (row: any) => row[key] ?? '—',
  }));
  const sortedRows = sort
    ? [...rows].sort((a: any, b: any) => {
        const left = a[sort];
        const right = b[sort];
        const numeric = left !== null && left !== '' && right !== null && right !== ''
          && Number.isFinite(Number(left)) && Number.isFinite(Number(right));
        const comparison = numeric
          ? Number(left) - Number(right)
          : String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
        return comparison * (order === 'ASC' ? 1 : -1);
      })
    : rows;
  const onSort = (sortKey: string) => {
    if (sort === sortKey) setOrder((current) => current === 'ASC' ? 'DESC' : 'ASC');
    else {
      setSort(sortKey);
      setOrder('ASC');
    }
  };
  const exportCsv = () => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const content = [
      keys.map(csvCell).join(','),
      ...rows.map((row) => keys.map((key) => csvCell((row as Record<string, unknown>)[key])).join(',')),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vscms-local-invoice-summary.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Reports"
        description="Invoice summaries calculated from the records stored in this browser."
        actions={(
          <Button variant="secondary" size="sm" icon={<Download size={14} />} disabled={!rows.length} onClick={exportCsv}>
            Export CSV
          </Button>
        )}
      />
      <Panel title="Local invoice summary" subtitle="Calculated from locally stored invoices">
        <DataTable
          rows={sortedRows}
          loading={s.loading}
          error={s.error}
          onRetry={s.refetch}
          rowKey={(row: any) => row.invoice_id ?? row.request_id}
          columns={columns}
          sort={sort}
          order={order}
          onSort={onSort}
        />
      </Panel>
    </div>
  );
}
