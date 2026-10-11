import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, RefreshCw, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { SectionHeading, Panel, DefinitionGrid } from '../components/common/Panel';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import { DataTable, type Column } from '../components/common/DataTable';
import { Modal, OverlayBody, OverlayFooter, OverlayHeader } from '../components/common/Overlay';
import { TextInput, NumberInput, TextArea, SelectInput } from '../components/common/Field';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { formatDate, money, count, titleCase } from '../utils/format';
import type { Page } from '../types';

type LookupSource = 'vehicles'|'mechanics'|'appointments'|'serviceRequests'|'ungeneratedInvoices'|'awaitingFeedback'|'parts'|'customers';
type FormOption = { value: string|number; label: string; relatedValue?: string|number; disabled?: boolean };
type FormField = { key:string; label:string; type?:'text'|'email'|'number'|'date'|'time'|'textarea'|'select'; required?:boolean; options?:FormOption[]; source?:LookupSource; deriveTo?:string; hint?:string; min?:number; max?:number; placeholder?:string };

async function loadOptions(source: LookupSource): Promise<FormOption[]> {
  if (['vehicles','mechanics','appointments','customers'].includes(source)) {
    const data = await api.lookups();
    if(source==='vehicles') return data.vehicles.map(x=>({value:x.vehicle_id,label:`${x.label} · ${x.make} ${x.model} · ${x.customer_name}`}));
    if(source==='mechanics') return data.mechanics.map(x=>({value:x.mechanic_id,label:`${x.label}${x.specialization?` · ${x.specialization}`:''} · ${titleCase(x.availability_status)}`}));
    if(source==='appointments') return data.appointments.map(x=>({value:x.appointment_id,label:`#${x.appointment_id} · ${x.label} · ${x.appointment_date} · ${x.service_type} · ${x.customer_name}`}));
    return data.customers.map(x=>({value:x.customer_id,label:`${x.label} · ${x.phone}`}));
  }
  if(source==='serviceRequests') {
    const first=await api.requests.list({limit:100,page:1});
    const remaining=await Promise.all(Array.from({length:first.pagination.totalPages-1},(_,index)=>api.requests.list({limit:100,page:index+2})));
    return [...first.data,...remaining.flatMap(page=>page.data)].map(x=>({value:x.request_id,label:`#${x.request_id} · ${x.registration_number??'Vehicle'} · ${x.customer_name??'Customer'} · ${x.service_status}`}));
  }
  if(source==='ungeneratedInvoices') {
    const rows=await api.invoices.ungenerated();
    return rows.map(x=>({value:x.request_id,label:`#${x.request_id} · ${x.registration_number??'Vehicle'} · ${x.customer_name??'Customer'} · ${x.service_status}`}));
  }
  if(source==='awaitingFeedback') {
    const rows=await api.feedback.awaiting();
    return rows.map(x=>({value:x.request_id,label:`#${x.request_id} · ${x.registration_number??'Vehicle'} · ${x.customer_name??'Customer'} · ${x.appointment_date}`,relatedValue:x.customer_id}));
  }
  const rows=await api.inventory.picker() as any[];
  return rows.map(x=>({value:x.part_id,label:`${x.part_name} · ${x.stock_quantity} in stock · ${money(x.unit_price)}`}));
}

function RecordForm({ config, initial, onSubmit, onClose, saving, error }: any) {
  const [values,setValues]=useState<Record<string,any>>(initial ?? {});
  const [options,setOptions]=useState<Record<string,FormOption[]>>({});
  const [loadingOptions,setLoadingOptions]=useState(false);
  const [optionsError,setOptionsError]=useState<string|null>(null);
  const fields:FormField[]=initial ? (config.editFields ?? config.fields) : (config.createFields ?? config.fields);
  useEffect(()=>{
    let alive=true;
    const sources=[...new Set(fields.map(f=>f.source).filter((x):x is LookupSource=>Boolean(x)))];
    if(!sources.length)return;
    setLoadingOptions(true);setOptionsError(null);
    Promise.all(sources.map(async source=>[source,await loadOptions(source)] as const))
      .then(entries=>{if(alive)setOptions(Object.fromEntries(entries));})
      .catch((e:any)=>{if(alive)setOptionsError(e?.message??'Could not load selection options.');})
      .finally(()=>{if(alive)setLoadingOptions(false);});
    return ()=>{alive=false;};
  },[config]);
  const set=(key:string,value:any)=>setValues(v=>({...v,[key]:value}));
  return <Modal open onClose={onClose} labelledBy="record-form-title" size="lg">
    <OverlayHeader id="record-form-title" title={initial ? `Edit ${config.entity}` : `New ${config.entity}`} onClose={onClose}/>
    <OverlayBody>
      {optionsError?<p className="mb-4 rounded-btn border border-warning/25 bg-warning-soft px-3 py-2 text-xs text-warning" role="alert">{optionsError} You can close this form and retry.</p>:null}
      {error?<p className="mb-4 rounded-btn border border-danger/25 bg-danger-soft px-3 py-2 text-xs text-danger" role="alert">{error}</p>:null}
      <div className="grid gap-4 sm:grid-cols-2">{fields.map((f:FormField)=><div key={f.key} className={f.type==='textarea'?'sm:col-span-2':''}>
        {f.type==='textarea'?<TextArea label={f.label} required={f.required} hint={f.hint} value={values[f.key]??''} onChange={e=>set(f.key,e.target.value)} rows={3}/>
        :f.type==='number'?<NumberInput label={f.label} required={f.required} hint={f.hint} min={f.min} max={f.max} value={values[f.key]??''} onChange={e=>set(f.key,e.target.value)}/>
        :f.type==='select'?<SelectInput label={f.label} required={f.required} hint={f.hint} disabled={Boolean(f.source&&loadingOptions)} value={values[f.key]??''} onChange={e=>{const value=e.target.value;set(f.key,value);if(f.deriveTo){const option=(options[f.source??'']??[]).find(o=>String(o.value)===String(value));if(option?.relatedValue!==undefined)set(f.deriveTo,option.relatedValue);}}} options={f.options??(f.source?options[f.source]??[]:[])} placeholder={f.placeholder??(f.source&&loadingOptions?'Loading options…':'Select an option')}/>
        :<TextInput label={f.label} required={f.required} hint={f.hint} type={f.type??'text'} value={values[f.key]??''} onChange={e=>set(f.key,e.target.value)}/>}</div>)}</div>
    </OverlayBody>
    <OverlayFooter><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button variant="primary" loading={saving} onClick={()=>onSubmit(values)}>{initial?'Save changes':'Create record'}</Button></OverlayFooter>
  </Modal>;
}

const DELETE_PASSWORD = 'VSCMS@adm1n';

export function ListPage({ title, description, resource, columns, hrefBase, createLabel='New record', crud }: any) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status')?.trim().toUpperCase() ?? '';
  const stockStatusFilter = queryParams.get('stockStatus')?.trim().toUpperCase() ?? '';
  const filterDescription = statusFilter
    ? statusFilter === 'ACTIVE' ? 'active work orders' : `${titleCase(statusFilter)} work orders`
    : stockStatusFilter
      ? stockStatusFilter === 'ATTENTION' ? 'low and out-of-stock parts' : `${titleCase(stockStatusFilter)} parts`
      : '';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [form, setForm] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const state = useApi<Page<any>>(
    () => resource({ search, page, limit: 15, sort, order, status: statusFilter || undefined, stockStatus: stockStatusFilter || undefined }),
    [search, page, sort, order, location.search],
  );
  const rows = state.data?.data ?? [];
  const canDelete = Boolean(crud?.remove);
  const recordId = (row: any): string | number => row?.[crud?.idKey]
    ?? row?.[Object.keys(row ?? {}).find((key) => key.endsWith('_id')) ?? 'id'];
  const selectedRecord = canDelete && selectedId !== null
    ? rows.find((row: any) => String(row[crud.idKey]) === String(selectedId)) ?? null
    : null;
  const handleSort = (sortKey: string) => {
    setSelectedId(null);
    setPage(1);
    if (sort === sortKey) setOrder((current) => current === 'ASC' ? 'DESC' : 'ASC');
    else {
      setSort(sortKey);
      setOrder('ASC');
    }
  };

  const submit = async (values: any) => {
    if (!crud) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = crud.toApi(values, form?.row);
      if (form?.row) await crud.update(form.row[crud.idKey], payload);
      else await crud.create(payload);
      setForm(null);
      state.refetch();
    } catch (error: any) {
      setFormError(error?.message ?? 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const closeDeleteDialog = () => {
    if (saving) return;
    setDeleteOpen(false);
    setDeletePassword('');
    setDeleteError(null);
  };

  const submitDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canDelete || !selectedRecord) return;
    if (deletePassword !== DELETE_PASSWORD) {
      setDeletePassword('');
      setDeleteError('The password is incorrect. Please try again.');
      return;
    }

    setSaving(true);
    setDeleteError(null);
    try {
      await crud.remove(selectedRecord[crud.idKey]);
      setDeleteOpen(false);
      setDeletePassword('');
      setSelectedId(null);
      state.refetch();
    } catch (error: any) {
      setDeletePassword('');
      setDeleteError(error?.message ?? 'Could not delete this record.');
    } finally {
      setSaving(false);
    }
  };

  const selectionColumn: Column<any> = {
    key: '__select_for_delete',
    header: <span className="sr-only">Select record to delete</span>,
    width: '46px',
    align: 'center',
    headerClassName: 'px-2',
    className: 'px-2',
    render: (row: any) => {
      const id = recordId(row);
      return (
        <input
          type="checkbox"
          checked={selectedId !== null && String(selectedId) === String(id)}
          onChange={(event) => setSelectedId(event.currentTarget.checked ? id : null)}
          onClick={(event) => event.stopPropagation()}
          disabled={saving || id === undefined}
          data-no-row-click="true"
          aria-label={`Select ${crud.entity} ${id} for deletion`}
          className="size-4 cursor-pointer rounded border-line accent-brand disabled:cursor-not-allowed"
        />
      );
    },
  };
  const tableColumns = canDelete ? [selectionColumn, ...(columns as Column<any>[])] : columns as Column<any>[];

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeading
        title={title}
        description={description}
        actions={crud ? (
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setFormError(null); setForm({}); }}>
            {createLabel}
          </Button>
        ) : null}
      />
      <Panel
        flush
        title={`${title} register`}
        subtitle={state.data ? `${count(state.data.pagination.total)} records` : 'Records saved on this browser'}
        actions={(
          <div className="flex items-center gap-2">
            {canDelete ? (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={13} aria-hidden="true" />}
                disabled={!selectedRecord || saving}
                onClick={() => { setDeletePassword(''); setDeleteError(null); setDeleteOpen(true); }}
              >
                Delete record
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={state.refetch}>
              Refresh
            </Button>
          </div>
        )}
      >
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            className="w-full max-w-md"
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); setSelectedId(null); }}
            placeholder={`Search ${title.toLowerCase()}...`}
          />
          {canDelete ? (
            <p className="text-2xs text-ink-faint">
              {selectedRecord
                ? `Record #${selectedId} selected. Choose one checkbox in the first column.`
                : 'Select one record using the checkbox in the first column to delete it.'}
            </p>
          ) : null}
        </div>
        {filterDescription ? (
          <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-brand-soft/35 px-4 py-2 text-xs text-ink-muted">
            <span>Showing {filterDescription}</span>
            <Link to={location.pathname} className="font-medium text-brand hover:underline">Clear filter</Link>
          </div>
        ) : null}
        <DataTable
          rows={rows}
          columns={tableColumns}
          rowKey={recordId}
          loading={state.loading}
          error={state.error}
          onRetry={state.refetch}
          rowHref={(row) => { const id = recordId(row); return id ? `${hrefBase}/${id}${location.search}` : undefined; }}
          selectedKey={selectedId}
          pagination={state.data ? state.data.pagination : null}
          onPage={(nextPage) => { setSelectedId(null); setPage(nextPage); }}
          sort={sort}
          order={order}
          onSort={handleSort}
          actions={crud ? (row) => (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${crud.entity}`}
              icon={<Pencil size={13} />}
              onClick={() => { setFormError(null); setForm({ row }); }}
            />
          ) : undefined}
        />
      </Panel>
      {form ? (
        <RecordForm
          key={form.row?.[crud?.idKey] ?? 'new'}
          config={crud}
          initial={form.row ? crud.fromRow(form.row) : undefined}
          onSubmit={submit}
          onClose={() => setForm(null)}
          saving={saving}
          error={formError}
        />
      ) : null}
      <Modal open={deleteOpen} onClose={closeDeleteDialog} labelledBy="delete-record-title" size="sm">
        <form onSubmit={submitDelete}>
          <OverlayHeader
            id="delete-record-title"
            title={`Delete ${crud?.entity ?? 'record'} #${selectedId ?? ''}?`}
            subtitle="Administrator password required"
            onClose={closeDeleteDialog}
          />
          <OverlayBody>
            <p className="mb-4 text-[13px] leading-relaxed text-ink-muted">
              This permanently removes the selected record from this browser. Related records may prevent deletion.
            </p>
            {deleteError ? (
              <p className="mb-3 rounded-btn border border-danger/25 bg-danger-soft px-3 py-2 text-xs text-danger" role="alert">
                {deleteError}
              </p>
            ) : null}
            <TextInput
              label="Administrator password"
              type="password"
              value={deletePassword}
              autoComplete="current-password"
              autoFocus
              required
              onChange={(event) => { setDeletePassword(event.target.value); setDeleteError(null); }}
            />
          </OverlayBody>
          <OverlayFooter>
            <Button variant="secondary" onClick={closeDeleteDialog} disabled={saving}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" loading={saving} disabled={!deletePassword || !selectedRecord}>
              Delete record
            </Button>
          </OverlayFooter>
        </form>
      </Modal>
    </div>
  );
}

export function DetailPage({ title, back, resource, id, fields, children }: any) {
  const location = useLocation();
  const backTo = `${back}${location.search}`;
  const state = useApi<any>(() => resource(Number(id)), [id]);
  if (state.loading) {
    return (
      <div className="surface p-6">
        <div className="skeleton h-7 w-64" />
        <div className="mt-5 skeleton h-32 w-full" />
      </div>
    );
  }
  if (state.error || !state.data) {
    return (
      <div className="space-y-4">
        <SectionHeading
          eyebrow="Record detail"
          title="Record unavailable"
          actions={<Link to={backTo} className="btn-secondary btn-sm inline-flex items-center gap-1"><ArrowLeft size={14} /> Back to register</Link>}
        />
        <Panel title="Unable to load record">
          <p className="text-sm text-danger" role="alert">{state.error?.message ?? 'This record could not be found. It may have been removed or the link may be invalid.'}</p>
          <Link to={backTo} className="btn-secondary btn-sm mt-4 inline-flex items-center gap-1"><ArrowLeft size={14} /> Return to the register</Link>
        </Panel>
      </div>
    );
  }
  const item = state.data;
  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeading
        eyebrow="Record detail"
        title={title(item)}
        actions={<Link to={backTo} className="btn-secondary btn-sm inline-flex items-center gap-1"><ArrowLeft size={14} /> Back</Link>}
      />
      <Panel title="Overview">
        <DefinitionGrid items={fields(item).map((entry: any) => ({ label: entry[0], value: entry[1] }))} />
      </Panel>
      {children?.(item)}
    </div>
  );
}

export const basicColumns=(fields:string[])=>fields.map((field)=>({key:field,header:titleCase(field),sortKey:field,render:(r:any)=><span className={field.endsWith('_id')?'font-mono text-xs':''}>{field.includes('date')||field.endsWith('_at')?formatDate(r[field]):field.includes('amount')||field.includes('cost')||field.includes('salary')||field.includes('price')||field.includes('bonus')?money(r[field]):r[field] ?? '—'}</span>}));
