import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ClipboardList, FileText, History, Package, Plus, Star, Wrench } from 'lucide-react';
import { api } from '../services/api';
import type { Lookups, WorkOrder } from '../types';
import { useApi } from '../hooks/useApi';
import { SectionHeading, Panel, DefinitionGrid } from '../components/common/Panel';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Tabs, TabPanel } from '../components/common/Tabs';
import { Modal, OverlayBody, OverlayFooter, OverlayHeader } from '../components/common/Overlay';
import { TextInput, NumberInput, TextArea, SelectInput } from '../components/common/Field';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, money, titleCase, todayIso } from '../utils/format';
import { requestStatusStyle, paymentStatusStyle } from '../utils/status';

type DialogName='service'|'part'|'invoice'|'feedback'|'complete'|'mechanic'|null;

export default function ServiceRequestDetail(){
  const {requestId}=useParams();
  const id=Number(requestId);
  const state=useApi<WorkOrder>(()=>api.requests.get(id),[id],{enabled:Number.isInteger(id)&&id>0});
  const [activeTab,setActiveTab]=useState('overview');
  const [dialog,setDialog]=useState<DialogName>(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState<Record<string,string>>({});
  const [actionError,setActionError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);
  const [statusChoice,setStatusChoice]=useState('OPEN');
  const [paymentChoice,setPaymentChoice]=useState('PENDING');
  const lookups=useApi<Lookups>(()=>api.lookups(),[id],{enabled:dialog==='part'||dialog==='mechanic'});
  const item=state.data;

  useEffect(()=>{if(item){setStatusChoice(item.service_status);if(item.invoice)setPaymentChoice(item.invoice.payment_status);}},[item?.request_id,item?.service_status,item?.invoice?.payment_status]);
  const update=(key:string,value:string)=>setForm(v=>({...v,[key]:value}));
  const openDialog=(name:Exclude<DialogName,null>)=>{
    setActionError(null);setNotice(null);setDialog(name);
    if(name==='service')setForm({serviceName:'',description:'',laborCharge:'0',estimatedDuration:'',remarks:''});
    if(name==='part')setForm({partId:'',quantityUsed:'1'});
    if(name==='invoice')setForm({laborAmount:String(item?.computed.labor_total??0),taxAmount:'0',discountAmount:'0'});
    if(name==='feedback')setForm({rating:'5',comments:'',feedbackDate:todayIso()});
    if(name==='complete')setForm({actualCost:String(item?.estimated_cost??0),diagnosis:item?.diagnosis??''});
    if(name==='mechanic')setForm({mechanicId:String(item?.mechanic_id??'')});
  };
  const runMutation=async(fn:()=>Promise<string|void>)=>{
    setSaving(true);setActionError(null);setNotice(null);
    try{const message=await fn();setDialog(null);setNotice(message??'Changes saved.');state.refetch();}
    catch(e:any){setActionError(e?.message??'The change could not be saved.');}
    finally{setSaving(false);}
  };
  const submitDialog=async()=>{
    if(!item||!dialog)return;
    if(dialog==='service')return runMutation(async()=>{await api.services.create({requestId:id,serviceName:form.serviceName.trim(),description:form.description||undefined,laborCharge:Number(form.laborCharge||0),estimatedDuration:form.estimatedDuration?Number(form.estimatedDuration):undefined,remarks:form.remarks||undefined});return 'Service line added.';});
    if(dialog==='part')return runMutation(async()=>{const result=await api.partUsage.create({requestId:id,partId:Number(form.partId),quantityUsed:Number(form.quantityUsed)});return `${result.part_name}: ${result.quantity_used} issued; stock ${result.stock_before} → ${result.stock_after}. Unit cost and stock were updated in this browser.`;});
    if(dialog==='invoice')return runMutation(async()=>{const invoice=await api.invoices.generate({requestId:id,laborAmount:Number(form.laborAmount||0),taxAmount:Number(form.taxAmount||0),discountAmount:Number(form.discountAmount||0)});return `Invoice #${invoice.invoice_id} generated. Total: ${money(invoice.total_amount)} (calculated locally).`;});
    if(dialog==='feedback')return runMutation(async()=>{const result=await api.feedback.create({requestId:id,customerId:Number(item.customer?.customer_id),rating:Number(form.rating),comments:form.comments||undefined,feedbackDate:form.feedbackDate||undefined});return result.bonus?`Feedback saved. The local five-star bonus rule updated the mechanic's bonus from ${money(result.bonus.before)} to ${money(result.bonus.after)}.`:'Feedback saved.';});
    if(dialog==='complete')return runMutation(async()=>{const result=await api.requests.complete(id,Number(form.actualCost),form.diagnosis||undefined);return `Work order completed. Actual cost recorded: ${money(result.actual_cost)}; completion and any bonus were recorded in this browser.`;});
    if(dialog==='mechanic')return runMutation(async()=>{await api.requests.assignMechanic(id,Number(form.mechanicId));return 'Mechanic assignment updated.';});
  };
  const changeStatus=async()=>{
    if(!item||statusChoice===item.service_status)return;
    setSaving(true);setActionError(null);setNotice(null);
    try{await api.requests.setStatus(id,statusChoice);setNotice(`Status changed to ${titleCase(statusChoice)}.`);state.refetch();}
    catch(e:any){setActionError(e?.message??'Status could not be changed.');}
    finally{setSaving(false);}
  };
  const changePayment=async()=>{
    if(!item?.invoice||paymentChoice===item.invoice.payment_status)return;
    setSaving(true);setActionError(null);setNotice(null);
    try{await api.invoices.setPaymentStatus(item.invoice.invoice_id,paymentChoice);setNotice('Payment status updated.');state.refetch();}
    catch(e:any){setActionError(e?.message??'Payment status could not be updated.');}
    finally{setSaving(false);}
  };

  if(state.loading)return <div className="surface p-6"><div className="skeleton h-7 w-64"/><div className="mt-5 skeleton h-32 w-full"/></div>;
  if(state.error||!item)return <Panel title="Unable to load work order"><ErrorState error={state.error} onRetry={state.refetch}/></Panel>;

  const tabs=[
    {id:'overview',label:'Overview',icon:<ClipboardList size={14}/>},
    {id:'services',label:'Services',count:item.services.length,icon:<Wrench size={14}/>},
    {id:'parts',label:'Parts',count:item.parts.length,icon:<Package size={14}/>},
    {id:'invoice',label:'Invoice',icon:<FileText size={14}/>},
    {id:'feedback',label:'Feedback',icon:<Star size={14}/>},
    {id:'history',label:'History',count:item.history.length,icon:<History size={14}/>},
  ];
  const partOptions=(lookups.data?.parts??[]).map(p=>({value:p.part_id,label:`${p.label} · ${p.stock_quantity} in stock · ${money(p.unit_price)}`,disabled:Number(p.stock_quantity)<=0}));
  const mechanicOptions=(lookups.data?.mechanics??[]).map(m=>({value:m.mechanic_id,label:`${m.label}${m.specialization?` · ${m.specialization}`:''} · ${titleCase(m.availability_status)}`}));

  return <div className="space-y-5 animate-fade-in">
    <SectionHeading eyebrow="Workshop · Work order" title={`Work order #${item.request_id}`} description={`${item.registration_number??'Vehicle'} · ${item.customer_name??'Customer'}`} actions={<Link to="/service-requests" className="btn-secondary btn-sm inline-flex items-center gap-1"><ArrowLeft size={14}/> Back to requests</Link>}/>
    {notice?<p className="rounded-btn border border-success/25 bg-success-soft px-3 py-2 text-xs text-success" role="status">{notice}</p>:null}
    {actionError&&!dialog?<p className="rounded-btn border border-danger/25 bg-danger-soft px-3 py-2 text-xs text-danger" role="alert">{actionError}</p>:null}
    <Panel flush>
      <Tabs items={tabs} active={activeTab} onChange={setActiveTab} ariaLabel="Work order sections" className="px-2"/>
      <div className="p-4 sm:p-5">
        <TabPanel id="overview" active={activeTab} className="space-y-4">
          <Panel title="Work order summary" subtitle={`${item.service_type??'Service'} · ${formatDate(item.appointment_date)}`} actions={<StatusBadge status={requestStatusStyle(item.service_status)} withDot/>}>
            <DefinitionGrid columns={3} items={[
              {label:'Customer',value:item.customer_id?<Link className="link" to={`/customers/${item.customer_id}`}>{item.customer_name??'Open customer record'}</Link>:item.customer_name??'Customer not linked'},{label:'Vehicle',value:item.vehicle_id?<Link className="link" to={`/vehicles/${item.vehicle_id}`}>{`${item.registration_number??'Vehicle'} · ${item.make??''} ${item.model??''}`}</Link>:`${item.registration_number??'Vehicle'} · ${item.make??''} ${item.model??''}`},{label:'Mechanic',value:item.mechanic?.mechanic_id?<Link className="link" to={`/mechanics/${item.mechanic.mechanic_id}`}>{item.mechanic?.mechanic_name??item.mechanic_name}</Link>:item.mechanic?.mechanic_name??item.mechanic_name??'Not assigned'},
              {label:'Complaint',value:item.complaint_description,span:2},{label:'Diagnosis',value:item.diagnosis,span:2},{label:'Estimated cost',value:money(item.estimated_cost)},{label:'Actual cost',value:item.actual_cost==null?'—':money(item.actual_cost)},{label:'Estimated completion',value:formatDate(item.estimated_completion_date)},
              {label:'Labour lines',value:item.computed.service_count},{label:'Labour total',value:money(item.computed.labor_total)},{label:'Parts total',value:money(item.computed.parts_total)},
            ]}/>
          </Panel>
          <Panel title="Workshop actions" subtitle="Work-order changes are saved in this browser.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-wrap items-end gap-2"><SelectInput label="Work-order status" value={statusChoice} onChange={e=>setStatusChoice(e.target.value)} disabled={item.service_status==='COMPLETED'} options={[{value:'OPEN',label:'Open'},{value:'IN_PROGRESS',label:'In progress'},{value:'ON_HOLD',label:'On hold'},{value:'CANCELLED',label:'Cancelled'}]}/><Button variant="secondary" size="sm" loading={saving} disabled={statusChoice===item.service_status||item.service_status==='COMPLETED'} onClick={changeStatus}>Update status</Button></div>
              <div className="flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1"><TextInput label="Assigned mechanic" value={item.mechanic?.mechanic_name??item.mechanic_name??'—'} readOnly/></div><Button variant="secondary" size="sm" onClick={()=>openDialog('mechanic')}>Reassign</Button></div>
            </div>
            {item.service_status!=='COMPLETED'&&item.service_status!=='CANCELLED'?<div className="mt-4 border-t border-line pt-4"><Button variant="primary" icon={<Check size={14}/>} onClick={()=>openDialog('complete')}>Complete work order</Button><p className="mt-2 text-xs text-ink-muted">Completion records actual cost and applies the local bonus rule; do not mark it complete with a plain status edit.</p></div>:null}
          </Panel>
        </TabPanel>

        <TabPanel id="services" active={activeTab}>
          <Panel title="Labour and service lines" subtitle="Add the work performed; invoice totals are calculated from locally stored service and parts lines." actions={<Button variant="primary" size="sm" icon={<Plus size={14}/>} onClick={()=>openDialog('service')}>Add service line</Button>}>
            {item.services.length? <div className="table-scroll"><table className="data"><thead><tr><th>Service</th><th>Description</th><th className="text-right">Duration</th><th className="text-right">Labour charge</th></tr></thead><tbody>{item.services.map(s=><tr key={s.service_id}><td className="font-medium"><Link className="link" to={`/services/${s.service_id}`}>{s.service_name}</Link></td><td className="text-ink-muted">{s.description||s.remarks||'—'}</td><td className="text-right tnum">{s.estimated_duration?`${s.estimated_duration} min`:'—'}</td><td className="text-right tnum">{money(s.labor_charge)}</td></tr>)}</tbody></table></div>:<EmptyState title="No services recorded" description="Add a labour line when work is performed." compact/>}
          </Panel>
        </TabPanel>

        <TabPanel id="parts" active={activeTab}>
          <Panel title="Parts issued" subtitle="Each issued part gets a usage line and updates local stock in one transaction." actions={<Button variant="primary" size="sm" icon={<Plus size={14}/>} onClick={()=>openDialog('part')}>Issue part</Button>}>
            {item.parts.length?<div className="table-scroll"><table className="data"><thead><tr><th>Part</th><th>Supplier</th><th className="text-right">Quantity</th><th className="text-right">Unit price</th><th className="text-right">Line total</th></tr></thead><tbody>{item.parts.map(p=><tr key={p.usage_id}><td className="font-medium"><Link className="link" to={`/inventory/${p.part_id}`}>{p.part_name}</Link></td><td className="text-ink-muted">{p.supplier_id?<Link className="link" to={`/suppliers/${p.supplier_id}`}>{p.supplier_name??'Open supplier record'}</Link>:p.supplier_name??'Supplier not linked'}</td><td className="text-right tnum">{p.quantity_used}</td><td className="text-right tnum">{money(p.unit_price)}</td><td className="text-right tnum">{money(p.total_cost)}</td></tr>)}</tbody></table></div>:<EmptyState title="No parts issued" description="Issue a stocked part to this work order." compact/>}
          </Panel>
        </TabPanel>

        <TabPanel id="invoice" active={activeTab}>
          {item.invoice?<Panel title={`Invoice #${item.invoice.invoice_id}`} subtitle={`Created ${formatDate(item.invoice.invoice_date)}`} actions={<><StatusBadge status={paymentStatusStyle(item.invoice.payment_status)} withDot/><Link to={`/invoices/${item.invoice.invoice_id}`} className="btn-secondary btn-sm inline-flex items-center">Open invoice</Link></>}>
            <DefinitionGrid columns={3} items={[{label:'Labour',value:money(item.invoice.labor_amount)},{label:'Parts total',value:money(item.invoice.parts_amount)},{label:'Tax',value:money(item.invoice.tax_amount)},{label:'Discount',value:money(item.invoice.discount_amount)},{label:'Invoice total',value:money(item.invoice.total_amount)},{label:'Calculation check',value:Number(item.invoice.total_amount)===Number(item.invoice.computed_total)?'Matches':'Check required'}]}/>
            <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4"><SelectInput label="Payment status" value={paymentChoice} onChange={e=>setPaymentChoice(e.target.value)} options={[{value:'PENDING',label:'Pending'},{value:'PARTIAL',label:'Partial'},{value:'PAID',label:'Paid'}]}/><Button variant="secondary" size="sm" loading={saving} disabled={paymentChoice===item.invoice.payment_status} onClick={changePayment}>Update payment status</Button></div>
          </Panel>:<Panel title="No invoice generated" subtitle="VSCMS calculates parts and invoice totals from this work order's saved records."><Button variant="primary" onClick={()=>openDialog('invoice')}>Generate invoice</Button></Panel>}
        </TabPanel>

        <TabPanel id="feedback" active={activeTab}>
          {item.feedback?<Panel title="Customer feedback" subtitle={`Submitted ${formatDate(item.feedback.feedback_date)}`} actions={<Link to={`/feedback/${item.feedback.feedback_id}`} className="btn-secondary btn-sm inline-flex items-center">Open feedback</Link>}><DefinitionGrid items={[{label:'Customer',value:item.customer_id?<Link className="link" to={`/customers/${item.customer_id}`}>{item.feedback.customer_name??item.customer_name}</Link>:item.feedback.customer_name??item.customer_name},{label:'Rating',value:`${item.feedback.rating} / 5`},{label:'Comments',value:item.feedback.comments||'No written comment',span:2}]}/></Panel>:item.service_status==='COMPLETED'?<Panel title="Feedback not submitted" subtitle="Only one feedback record is allowed per service request."><Button variant="primary" icon={<Star size={14}/>} onClick={()=>openDialog('feedback')}>Add feedback</Button></Panel>:<EmptyState title="Feedback is available after completion" description="Complete the work order before submitting customer feedback."/>}
        </TabPanel>

        <TabPanel id="history" active={activeTab}>
          {item.history.length?<Panel title="Vehicle service history" subtitle="Previous work orders for this vehicle."><div className="divide-y divide-line">{item.history.map((h:any)=><Link key={String(h.request_id)} to={`/service-requests/${h.request_id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 hover:bg-canvas/60"><div><p className="text-sm font-medium text-ink">Work order #{String(h.request_id)} · {String(h.service_type??'Service')}</p><p className="mt-0.5 text-xs text-ink-muted">{formatDate(h.appointment_date)} · {String(h.mechanic_name??'Unassigned')}</p></div><div className="flex items-center gap-2"><StatusBadge status={requestStatusStyle(h.service_status)} size="sm" withDot/><span className="text-xs tnum">{h.actual_cost==null?'—':money(h.actual_cost)}</span></div></Link>)}</div></Panel>:<EmptyState title="No prior work orders" description="This vehicle has no other service requests in its recorded history."/>}
        </TabPanel>
      </div>
    </Panel>

    {dialog?<Modal open onClose={()=>{if(!saving)setDialog(null)}} labelledBy="work-order-dialog-title" size="md">
      <OverlayHeader id="work-order-dialog-title" title={{service:'Add service line',part:'Issue part to work order',invoice:'Generate invoice',feedback:'Record customer feedback',complete:'Complete work order',mechanic:'Reassign mechanic'}[dialog]} subtitle={`Work order #${id}`} onClose={()=>{if(!saving)setDialog(null)}}/>
      <OverlayBody>
        {actionError?<p className="mb-4 rounded-btn border border-danger/25 bg-danger-soft px-3 py-2 text-xs text-danger" role="alert">{actionError}</p>:null}
        {dialog==='service'?<div className="grid gap-4 sm:grid-cols-2"><TextInput label="Service performed" required value={form.serviceName??''} onChange={e=>update('serviceName',e.target.value)}/><NumberInput label="Labour charge" min={0} step="0.01" value={form.laborCharge??'0'} onChange={e=>update('laborCharge',e.target.value)}/><TextArea label="Description" wrapperClassName="sm:col-span-2" value={form.description??''} onChange={e=>update('description',e.target.value)}/><NumberInput label="Estimated duration (minutes)" min={0} value={form.estimatedDuration??''} onChange={e=>update('estimatedDuration',e.target.value)}/><TextInput label="Remarks" value={form.remarks??''} onChange={e=>update('remarks',e.target.value)}/></div>:null}
        {dialog==='part'?<div className="space-y-4">{lookups.loading?<p className="text-sm text-ink-muted">Loading stock options…</p>:lookups.error?<ErrorState error={lookups.error} onRetry={lookups.refetch} compact/>:<><SelectInput label="Spare part" required value={form.partId??''} onChange={e=>update('partId',e.target.value)} options={partOptions} placeholder="Choose a stocked part"/><NumberInput label="Quantity used" required min={1} step={1} value={form.quantityUsed??'1'} onChange={e=>update('quantityUsed',e.target.value)}/><p className="text-xs text-ink-muted">Choose the work order, part and quantity. VSCMS calculates the line cost and deducts stock locally.</p></>}</div>:null}
        {dialog==='invoice'?<div className="grid gap-4 sm:grid-cols-2"><NumberInput label="Labour amount" required min={0} step="0.01" hint="Prefilled from work-order labour lines; adjust if needed." value={form.laborAmount??'0'} onChange={e=>update('laborAmount',e.target.value)}/><NumberInput label="Tax amount" required min={0} step="0.01" value={form.taxAmount??'0'} onChange={e=>update('taxAmount',e.target.value)}/><NumberInput label="Discount amount" required min={0} step="0.01" value={form.discountAmount??'0'} onChange={e=>update('discountAmount',e.target.value)}/><p className="self-end text-xs text-ink-muted">Parts and total are calculated locally from saved usage and the amounts entered here.</p></div>:null}
        {dialog==='feedback'?<div className="space-y-4"><SelectInput label="Rating" required value={form.rating??'5'} onChange={e=>update('rating',e.target.value)} options={[5,4,3,2,1].map(n=>({value:n,label:`${n} / 5`}))}/><TextArea label="Comments" value={form.comments??''} onChange={e=>update('comments',e.target.value)}/><TextInput label="Feedback date" type="date" required value={form.feedbackDate??todayIso()} onChange={e=>update('feedbackDate',e.target.value)}/><p className="text-xs text-ink-muted">VSCMS allows one feedback entry per request, with a rating from 1 to 5.</p></div>:null}
        {dialog==='complete'?<div className="space-y-4"><NumberInput label="Actual cost" required min={0} step="0.01" value={form.actualCost??'0'} onChange={e=>update('actualCost',e.target.value)}/><TextArea label="Diagnosis" value={form.diagnosis??''} onChange={e=>update('diagnosis',e.target.value)}/><p className="text-xs text-ink-muted">VSCMS records the actual cost and applies its local completion and bonus rules.</p></div>:null}
        {dialog==='mechanic'?<div className="space-y-4">{lookups.loading?<p className="text-sm text-ink-muted">Loading mechanics…</p>:lookups.error?<ErrorState error={lookups.error} onRetry={lookups.refetch} compact/>:<SelectInput label="Mechanic" required value={form.mechanicId??''} onChange={e=>update('mechanicId',e.target.value)} options={mechanicOptions} placeholder="Choose a mechanic"/>}</div>:null}
      </OverlayBody>
      <OverlayFooter><Button variant="secondary" disabled={saving} onClick={()=>setDialog(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={submitDialog}>{dialog==='part'?'Issue part':dialog==='invoice'?'Generate invoice':dialog==='complete'?'Complete work order':dialog==='mechanic'?'Reassign mechanic':dialog==='feedback'?'Save feedback':'Add service line'}</Button></OverlayFooter>
    </Modal>:null}
  </div>;
}
