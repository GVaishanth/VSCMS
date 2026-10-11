import type {
  Appointment, AppointmentDetail, AppointmentInput, ApiErrorBody, CustomerDetail, CustomerInput,
  DashboardBundle, DashboardKpis, FeedbackInput, FeedbackRow, FeedbackSummary, HealthResponse,
  InventorySummary, Invoice, InvoiceDetail, InvoiceSummary, Lookups, MechanicDetail,
  MechanicInput, MetaResponse, Page, PartInput, PartUsageResult,
  RequestInput, ServiceCatalogueEntry, ServiceInput, ServiceLine, ServiceRequestRow, SparePartDetail,
  SparePartRow, SupplierDetail, SupplierInput, VehicleDetail, VehicleInput,
  ViewResult, WorkOrder,
} from '../types';
import { deleteRow, exportSnapshot, importSnapshot, insertRow, issuePartUsage, readAll, readOne, saveRow, storageStatus } from './localDb';
import { STORE_NAMES } from './localDb';
import type { LocalRow, StoreName } from './localDb';

export interface Query extends Record<string, string | number | boolean | null | undefined> {}
export interface ListQuery extends Query { search?: string; page?: number; limit?: number; sort?: string; order?: 'ASC'|'DESC' }

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  constructor(body: ApiErrorBody) { super(body.message || 'The request failed.'); this.name='ApiClientError'; this.status=body.status??0; this.code=body.code??'ERROR'; this.details=body.details; }
  get isOffline(){return this.code==='LOCAL_STORE_UNAVAILABLE'||this.status===503;}
}

const VOCABULARIES:MetaResponse['vocabularies']={
  appointmentStatuses:['BOOKED','CONFIRMED','COMPLETED','CANCELLED'],bookingModes:['ONLINE','PHONE','WALK_IN'],
  requestStatuses:['OPEN','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED'],paymentStatuses:['PENDING','PARTIAL','PAID'],
  availabilityStatuses:['AVAILABLE','BUSY','ON_LEAVE'],fuelTypes:['Petrol','Diesel','Electric','Hybrid','CNG'],
  transmissions:['Manual','Automatic'],serviceTypes:['General Service','Oil Change','Brake Repair','AC Service'],partCategories:['Lubricant','Filter','Brake','Electrical'],
};
const round=(n:unknown)=>Number((Number(n)||0).toFixed(2));
const isoToday=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);};
const nowSql=()=>new Date().toISOString().slice(0,19).replace('T',' ');
const fullName=(r:any)=>[r?.first_name,r?.last_name].filter(Boolean).join(' ')||'—';
const needed=<T,>(value:T|undefined,label:string):T=>{if(!value)throw new Error(`${label} was not found.`);return value;};
const num=(value:unknown, label:string, min=0)=>{const n=Number(value);if(!Number.isFinite(n)||n<min)throw new Error(`${label} must be ${min===0?'zero or greater':'a valid number'}.`);return n;};
const nonblank=(value:unknown,label:string)=>{const s=String(value??'').trim();if(!s)throw new Error(`${label} is required.`);return s;};
const stockStatus=(stock:number,reorder:number):SparePartRow['stock_status']=>stock===0?'OUT OF STOCK':stock<=reorder?'LOW STOCK':'IN STOCK';

async function list<T extends LocalRow=LocalRow>(name:StoreName):Promise<T[]>{return readAll<T>(name);}
async function row<T extends LocalRow=LocalRow>(name:StoreName,id:number):Promise<T>{return needed(await readOne<T>(name,id),`${name} record ${id}`);}
async function page<T extends LocalRow>(rows:T[],query:ListQuery|undefined,searchKeys:string[],key:string):Promise<Page<T>>{
  const q=String(query?.search??'').trim().toLowerCase();
  let filtered=q?rows.filter(r=>searchKeys.some(k=>String(r[k]??'').toLowerCase().includes(q))):rows;
  const order=(query?.order??'DESC').toUpperCase()==='ASC'?1:-1;
  const sortKey=query?.sort;
  if(sortKey&&filtered.length&&sortKey in filtered[0]!)filtered=[...filtered].sort((a,b)=>String(a[sortKey]??'').localeCompare(String(b[sortKey]??''),undefined,{numeric:true})*order);
  else filtered=[...filtered].sort((a,b)=>(Number(a[key]??0)-Number(b[key]??0))*order);
  const limit=Math.min(100,Math.max(1,Number(query?.limit)||25));const total=filtered.length;const totalPages=Math.max(1,Math.ceil(total/limit));const current=Math.min(Math.max(1,Number(query?.page)||1),totalPages);
  return {data:filtered.slice((current-1)*limit,current*limit),pagination:{page:current,limit,total,totalPages,hasPrev:current>1,hasNext:current<totalPages}};
}
function assertUnique(rows:LocalRow[],key:string,value:unknown,label:string,excludeId?:number,idKey='id'){
  const target=String(value??'').trim().toLowerCase();if(!target)return;
  if(rows.some(r=>Number(r[idKey])!==excludeId&&String(r[key]??'').trim().toLowerCase()===target))throw new Error(`${label} is already in use.`);
}
function dateRange(query?:Query){const range=String(query?.range??'30d');const end=isoToday();const days:number|null=range==='today'?1:range==='7d'?7:range==='30d'?30:null;let from:string|null=null;const to:string|null=range==='all'?null:end;if(days){const d=new Date(`${end}T00:00:00Z`);d.setUTCDate(d.getUTCDate()-days+1);from=d.toISOString().slice(0,10);}return {range,from,to};}

async function vehicleContext(vehicleId:number){const [vehicles,customers]=await Promise.all([list('vehicles'),list('customers')]);const v=vehicles.find(x=>Number(x.vehicle_id)===vehicleId);if(!v)return null;const c=customers.find(x=>Number(x.customer_id)===Number(v.customer_id));return {vehicle:v,customer:c};}
async function appointmentShape(a:LocalRow):Promise<Appointment>{const ctx=await vehicleContext(Number(a.vehicle_id));const [requests,mechanics]=await Promise.all([list('requests'),list('mechanics')]);const req=requests.find(x=>Number(x.appointment_id)===Number(a.appointment_id));const mechanic=req?mechanics.find(m=>Number(m.mechanic_id)===Number(req.mechanic_id)):undefined;return {...a,registration_number:ctx?.vehicle.registration_number,make:ctx?.vehicle.make,model:ctx?.vehicle.model,manufacture_year:ctx?.vehicle.manufacture_year,customer_id:ctx?.customer?.customer_id,customer_name:ctx?.customer?fullName(ctx.customer):undefined,customer_phone:ctx?.customer?.phone,customer_email:ctx?.customer?.email,request_id:req?.request_id??null,service_status:req?.service_status??null,mechanic_id:req?.mechanic_id??null,mechanic_name:mechanic?fullName(mechanic):null} as Appointment;}
async function requestShape(r:LocalRow):Promise<ServiceRequestRow>{const ap=await readOne('appointments',Number(r.appointment_id));const ctx=ap?await vehicleContext(Number(ap.vehicle_id)):null;const [mechanics,services,usages,invoices,feedbacks]=await Promise.all([list('mechanics'),list('services'),list('partUsage'),list('invoices'),list('feedback')]);const m=mechanics.find(x=>Number(x.mechanic_id)===Number(r.mechanic_id));const svc=services.filter(x=>Number(x.request_id)===Number(r.request_id));const uses=usages.filter(x=>Number(x.request_id)===Number(r.request_id));const invoice=invoices.find(x=>Number(x.request_id)===Number(r.request_id));const fb=feedbacks.find(x=>Number(x.request_id)===Number(r.request_id));return {...r,appointment_date:ap?.appointment_date,appointment_time:ap?.appointment_time,service_type:ap?.service_type,appointment_status:ap?.status,booking_mode:ap?.booking_mode,vehicle_id:ctx?.vehicle.vehicle_id,registration_number:ctx?.vehicle.registration_number,make:ctx?.vehicle.make,model:ctx?.vehicle.model,manufacture_year:ctx?.vehicle.manufacture_year,current_mileage:ctx?.vehicle.current_mileage,customer_id:ctx?.customer?.customer_id,customer_name:ctx?.customer?fullName(ctx.customer):undefined,customer_phone:ctx?.customer?.phone,customer_email:ctx?.customer?.email,customer_city:ctx?.customer?.city,mechanic_name:m?fullName(m):undefined,specialization:m?.specialization,availability_status:m?.availability_status,service_count:svc.length,labor_total:round(svc.reduce((s,x)=>s+Number(x.labor_charge??0),0)),part_count:uses.length,parts_total:round(uses.reduce((s,x)=>s+Number(x.total_cost??0),0)),invoice_id:invoice?.invoice_id??null,invoice_total:invoice?.total_amount??null,payment_status:invoice?.payment_status??null,feedback_id:fb?.feedback_id??null,rating:fb?.rating??null} as ServiceRequestRow;}
async function workOrder(id:number):Promise<WorkOrder>{const base=await row('requests',id);const shaped=await requestShape(base);const [appointment,customer,mechanics,services,usages,parts,invoices,feedbacks,requests,suppliers]=await Promise.all([readOne('appointments',Number(base.appointment_id)),list('customers'),list('mechanics'),list('services'),list('partUsage'),list('parts'),list('invoices'),list('feedback'),list('requests'),list('suppliers')]);const c=customer.find(x=>Number(x.customer_id)===Number(shaped.customer_id))??null;const m=mechanics.find(x=>Number(x.mechanic_id)===Number(base.mechanic_id));const svc=services.filter(x=>Number(x.request_id)===id);const uses:any[]=usages.filter(x=>Number(x.request_id)===id).map(p=>{const part=parts.find(x=>Number(x.part_id)===Number(p.part_id));const supplier=suppliers.find(x=>Number(x.supplier_id)===Number(part?.supplier_id));return {...p,...part,supplier_name:supplier?.supplier_name??p.supplier_name};});const inv=invoices.find(x=>Number(x.request_id)===id);const fb=feedbacks.find(x=>Number(x.request_id)===id);const vehicleId=Number(shaped.vehicle_id);const history=await Promise.all(requests.filter(x=>Number(x.request_id)!==id).map(async x=>{const ap=await readOne('appointments',Number(x.appointment_id));if(!ap||Number(ap.vehicle_id)!==vehicleId)return null;const mech=mechanics.find(m1=>Number(m1.mechanic_id)===Number(x.mechanic_id));return {request_id:x.request_id,service_status:x.service_status,created_at:x.created_at,actual_cost:x.actual_cost,appointment_date:ap.appointment_date,service_type:ap.service_type,mechanic_name:mech?fullName(mech):'—'};}));const validHistory=history.filter(Boolean).slice(0,10);const laborTotal=round(svc.reduce((s,x)=>s+Number(x.labor_charge??0),0));const partsTotal=round(uses.reduce((s,x)=>s+Number(x.total_cost??0),0));const computed={labor_total:laborTotal,parts_total:partsTotal,service_count:svc.length,part_count:uses.length,has_invoice:Boolean(inv),has_feedback:Boolean(fb)};return {...shaped,appointment,customer:c,mechanic:m?{...m,mechanic_name:fullName(m)}:null,services:svc,parts:uses,invoice:inv?{...inv,computed_total:round(Number(inv.labor_amount)+Number(inv.parts_amount)+Number(inv.tax_amount)-Number(inv.discount_amount))}:null,feedback:fb??null,history:validHistory,computed} as unknown as WorkOrder;}
async function customerDetail(id:number):Promise<CustomerDetail>{const c=await row('customers',id);const [vehicles,appointments,requests,invoices,feedbacks]=await Promise.all([list('vehicles'),list('appointments'),list('requests'),list('invoices'),list('feedback')]);const owned=vehicles.filter(v=>Number(v.customer_id)===id);const ownVehicleIds=new Set(owned.map(v=>Number(v.vehicle_id)));const ownAppts=appointments.filter(a=>ownVehicleIds.has(Number(a.vehicle_id)));const appointmentIds=new Set(ownAppts.map(a=>Number(a.appointment_id)));const ownRequests=requests.filter(r=>appointmentIds.has(Number(r.appointment_id)));const requestIds=new Set(ownRequests.map(r=>Number(r.request_id)));const ownInvoices=invoices.filter(i=>requestIds.has(Number(i.request_id)));const ownFeedback=feedbacks.filter(f=>Number(f.customer_id)===id);const billed=ownInvoices.reduce((s,i)=>s+Number(i.total_amount),0);const paid=ownInvoices.filter(i=>i.payment_status==='PAID').reduce((s,i)=>s+Number(i.total_amount),0);const withName={...c,customer_name:fullName(c)};return {...withName,totals:{total_billed:round(billed),total_paid:round(paid),outstanding:round(billed-paid),avg_rating:ownFeedback.length?round(ownFeedback.reduce((s,f)=>s+Number(f.rating),0)/ownFeedback.length):0},vehicles:owned as any,appointments:await Promise.all(ownAppts.map(appointmentShape)),requests:await Promise.all(ownRequests.map(requestShape)),invoices:ownInvoices as any,feedback:ownFeedback as any} as unknown as CustomerDetail;}
function deriveVehicleServiceState(requests: Array<{ service_status?: unknown }>): VehicleDetail['service_state'] {
  if (requests.some((request) => !['COMPLETED', 'CANCELLED'].includes(String(request.service_status)))) return 'IN SERVICE';
  if (requests.some((request) => request.service_status === 'COMPLETED')) return 'SERVICED';
  if (requests.some((request) => request.service_status === 'CANCELLED')) return 'CANCELLED';
  return 'IDLE';
}

async function vehicleDetail(id:number):Promise<VehicleDetail>{
  const v=await row('vehicles',id);
  const [customer,appointments,requests,invoices,feedbacks]=await Promise.all([
    readOne('customers',Number(v.customer_id)),list('appointments'),list('requests'),list('invoices'),list('feedback'),
  ]);
  const ownAppts=appointments.filter(a=>Number(a.vehicle_id)===id);
  const appointmentIds=new Set(ownAppts.map(a=>Number(a.appointment_id)));
  const ownRequests=requests.filter(r=>appointmentIds.has(Number(r.appointment_id)));
  const requestIds=new Set(ownRequests.map(r=>Number(r.request_id)));
  const ownInvoices=invoices.filter(i=>requestIds.has(Number(i.request_id)));
  const ownFeedback=feedbacks.filter(f=>Number(f.customer_id)===Number(v.customer_id)&&requestIds.has(Number(f.request_id)));
  const [shapedAppointments,shapedRequests]=await Promise.all([
    Promise.all(ownAppts.map(appointmentShape)),Promise.all(ownRequests.map(requestShape)),
  ]);
  const latestCompletedRequest=[...shapedRequests].filter(request=>request.service_status==='COMPLETED').sort((a,b)=>`${String(b.appointment_date)} ${String(b.appointment_time)}`.localeCompare(`${String(a.appointment_date)} ${String(a.appointment_time)}`))[0];
  const latestRequest=[...shapedRequests].sort((a,b)=>`${String(b.appointment_date)} ${String(b.appointment_time)}`.localeCompare(`${String(a.appointment_date)} ${String(a.appointment_time)}`))[0];
  return {
    ...v,
    customer:customer?{...customer,customer_name:fullName(customer)}:null,
    customer_name:customer?fullName(customer):'—',
    customer_phone:customer?.phone??null,
    customer_email:customer?.email??null,
    customer_city:customer?.city??null,
    appointment_count:ownAppts.length,
    request_count:ownRequests.length,
    last_visit_date:latestCompletedRequest?.appointment_date??null,
    latest_request_status:latestRequest?.service_status??null,
    service_state:deriveVehicleServiceState(ownRequests),
    appointments:shapedAppointments,
    requests:shapedRequests as any,
    invoices:ownInvoices as any,
    feedback:ownFeedback as any,
    totals:{total_billed:round(ownInvoices.reduce((s,i)=>s+Number(i.total_amount),0)),total_actual_cost:round(ownRequests.reduce((s,r)=>s+Number(r.actual_cost??0),0)),total_requests:ownRequests.length},
  } as unknown as VehicleDetail;
}
async function mechanicDetail(id:number):Promise<MechanicDetail>{const m=await row('mechanics',id);const requests=await list('requests');const mine=await Promise.all(requests.filter(r=>Number(r.mechanic_id)===id).map(async r=>{const x=await requestShape(r);const inv=(await list('invoices')).find(i=>Number(i.request_id)===Number(r.request_id));const fb=(await list('feedback')).find(f=>Number(f.request_id)===Number(r.request_id));return {...x,registration_number:x.registration_number??'',make:x.make??'',model:x.model??'',rating:fb?.rating??null,invoice_total:inv?.total_amount??null,payment_status:inv?.payment_status??null};}));const completed=mine.filter(r=>r.service_status==='COMPLETED');return {...m,mechanic_name:fullName(m),requests:mine as any,performance:{mechanic_id:id,mechanic:fullName(m),completed_requests:completed.length,total_revenue_handled:round(completed.reduce((s,r)=>s+Number(r.actual_cost??0),0)),total_bonus:Number(m.total_bonus),specialization:m.specialization,experience_years:m.experience_years,availability_status:m.availability_status,active_jobs:mine.filter(r=>!['COMPLETED','CANCELLED'].includes(String(r.service_status))).length,assigned_requests:mine.length}} as unknown as MechanicDetail;}
async function partDetail(id:number):Promise<SparePartDetail>{
  const part=await row('parts',id);
  const supplier=await readOne('suppliers',Number(part.supplier_id));
  const usages=(await list('partUsage')).filter(usage=>Number(usage.part_id)===id);
  const enrichedUsages=await Promise.all(usages.map(async usage=>{
    const request=await readOne('requests',Number(usage.request_id));
    const context=request?await requestShape(request):null;
    return {
      ...usage,
      part_name:part.part_name,
      supplier_name:supplier?.supplier_name,
      service_status:context?.service_status,
      appointment_date:context?.appointment_date,
      registration_number:context?.registration_number,
      customer_name:context?.customer_name,
      mechanic_name:context?.mechanic_name,
    };
  }));
  return {
    ...part,
    supplier_name:supplier?.supplier_name,
    stock_status:stockStatus(Number(part.stock_quantity),Number(part.reorder_level)),
    stock_value:round(Number(part.unit_price)*Number(part.stock_quantity)),
    supplier:supplier as any,
    usages:enrichedUsages as any,
  } as unknown as SparePartDetail;
}
async function supplierDetail(id:number):Promise<SupplierDetail>{const s=await row('suppliers',id);const parts=await list('parts');return {...s,parts:parts.filter(p=>Number(p.supplier_id)===id).map(p=>({...p,stock_status:stockStatus(Number(p.stock_quantity),Number(p.reorder_level)),stock_value:round(Number(p.unit_price)*Number(p.stock_quantity))})) as any} as unknown as SupplierDetail;}
async function invoiceDetail(id:number):Promise<InvoiceDetail>{const inv=await row('invoices',id);const request=await readOne('requests',Number(inv.request_id));const shaped=request?await requestShape(request):null;const [services,usages,feedbacks]=await Promise.all([list('services'),list('partUsage'),list('feedback')]);const labour=services.filter(s=>Number(s.request_id)===Number(inv.request_id));const partLines=usages.filter(p=>Number(p.request_id)===Number(inv.request_id));const fb=feedbacks.find(f=>Number(f.request_id)===Number(inv.request_id))??null;const total=round(Number(inv.labor_amount)+Number(inv.parts_amount)+Number(inv.tax_amount)-Number(inv.discount_amount));const actual=round(inv.total_amount);return {...inv,computed_total:total,labor_lines_total:round(labour.reduce((s,x)=>s+Number(x.labor_charge),0)),part_lines_total:round(partLines.reduce((s,x)=>s+Number(x.total_cost),0)),context:shaped?{...shaped}:null,labour_lines:labour as any,part_lines:partLines as any,feedback:fb,verification:{formula:'Browser-local function: max(0, labour + parts + tax - discount)',stored_total:actual,database_computed_total:total,matches:actual===total,effective_tax_rate:Number(inv.labor_amount)+Number(inv.parts_amount)>0?round(Number(inv.tax_amount)/(Number(inv.labor_amount)+Number(inv.parts_amount))*100):0}} as InvoiceDetail;}

async function appointmentDetail(id:number):Promise<AppointmentDetail>{
  const appointment=await row('appointments',id);
  const [allAppointments,requests]=await Promise.all([list('appointments'),list('requests')]);
  const request=requests.find(r=>Number(r.appointment_id)===id);
  const sameVehicleHistory=allAppointments
    .filter(a=>Number(a.vehicle_id)===Number(appointment.vehicle_id)&&Number(a.appointment_id)!==id)
    .sort((a,b)=>`${String(b.appointment_date)} ${String(b.appointment_time)}`.localeCompare(`${String(a.appointment_date)} ${String(a.appointment_time)}`));
  return {
    ...await appointmentShape(appointment),
    request:request?await workOrder(Number(request.request_id)):null,
    history:await Promise.all(sameVehicleHistory.map(appointmentShape)),
  } as AppointmentDetail;
}

async function serviceDetail(id:number):Promise<ServiceLine & {vehicle_id?:number;customer_id?:number;request_context:ServiceRequestRow|null}>{
  const service=await row('services',id);
  const request=await readOne('requests',Number(service.request_id));
  const context=request?await requestShape(request):null;
  return {
    ...service,
    service_status:context?.service_status,
    appointment_date:context?.appointment_date,
    service_type:context?.service_type,
    registration_number:context?.registration_number,
    make:context?.make,
    model:context?.model,
    customer_name:context?.customer_name,
    mechanic_name:context?.mechanic_name,
    vehicle_id:context?.vehicle_id,
    customer_id:context?.customer_id,
    request_context:context,
  } as ServiceLine & {vehicle_id?:number;customer_id?:number;request_context:ServiceRequestRow|null};
}

async function feedbackDetail(id:number):Promise<FeedbackRow>{
  const feedback=await row('feedback',id);
  const [customer,request]=await Promise.all([
    readOne('customers',Number(feedback.customer_id)),readOne('requests',Number(feedback.request_id)),
  ]);
  const context=request?await requestShape(request):null;
  return {
    ...feedback,
    customer_name:customer?fullName(customer):'—',
    customer_phone:customer?.phone??null,
    vehicle_id:context?.vehicle_id,
    registration_number:context?.registration_number,
    make:context?.make,
    model:context?.model,
    service_status:context?.service_status,
    appointment_date:context?.appointment_date,
    service_type:context?.service_type,
    mechanic_id:context?.mechanic_id,
    mechanic_name:context?.mechanic_name,
    specialization:context?.specialization,
  } as FeedbackRow;
}

export const api={
  health:async()=>{const [status,requests]=await Promise.all([storageStatus(),list('requests')]);return {status:'ok',database:{connected:status.connected,database:'VSCMS IndexedDB',host:'This browser',port:0,serverVersion:'IndexedDB',latencyMs:0,checkedAt:new Date().toISOString(),error:null,errorCode:null,recordCount:status.count,requestCount:requests.length,openRequestCount:requests.filter(r=>r.service_status==='OPEN').length},server:{time:new Date().toISOString(),nodeEnv:'static',version:'1.0.0'}} as HealthResponse;},
  meta:async()=>({database:{name:'VSCMS IndexedDB',host:'This browser',port:0,connected:true,server_version:'IndexedDB',latency_ms:0,checked_at:new Date().toISOString(),error:null},schema:{tables:STORE_NAMES.length,views:0,procedures:0,functions:0,triggers:0},vocabularies:VOCABULARIES}) as MetaResponse,
  lookups:async():Promise<Lookups>=>{const [customers,vehicles,mechanics,suppliers,parts,appointments]=await Promise.all([list('customers'),list('vehicles'),list('mechanics'),list('suppliers'),list('parts'),list('appointments')]);const requests=await list('requests');return {customers:customers.map(c=>({...c,label:fullName(c)})) as any,vehicles:vehicles.map(v=>({...v,label:v.registration_number,customer_name:fullName(customers.find(c=>Number(c.customer_id)===Number(v.customer_id))??{})})) as any,mechanics:mechanics.map(m=>({...m,label:fullName(m)})) as any,suppliers:suppliers.map(s=>({...s,label:s.supplier_name})) as any,parts:parts.map(p=>({...p,label:p.part_name,stock_status:stockStatus(Number(p.stock_quantity),Number(p.reorder_level))})) as any,appointments:appointments.filter(a=>!requests.some(r=>Number(r.appointment_id)===Number(a.appointment_id))&&a.status!=='CANCELLED').map(a=>({...a,label:a.service_type,customer_name:fullName(customers.find(c=>Number(c.customer_id)===Number(vehicles.find(v=>Number(v.vehicle_id)===Number(a.vehicle_id))?.customer_id))??{})})) as any,serviceTypes:[...new Set(appointments.map(a=>String(a.service_type)))].map(label=>({label,uses:appointments.filter(a=>a.service_type===label).length}))};},
  dashboard: async (query?: Query): Promise<DashboardBundle> => {
    const [customers, vehicles, appointments, requests, mechanics, parts, invoices, feedback, usages] = await Promise.all([
      list('customers'), list('vehicles'), list('appointments'), list('requests'), list('mechanics'),
      list('parts'), list('invoices'), list('feedback'), list('partUsage'),
    ]);
    const { range, from, to } = dateRange(query);
    const inRange = (value: unknown) => {
      const day = String(value ?? '').slice(0, 10);
      return Boolean(day) && (!from || day >= from) && (!to || day <= to);
    };
    const today = isoToday();
    const appointmentsById = new Map(appointments.map((appointment) => [Number(appointment.appointment_id), appointment]));
    const vehiclesById = new Map(vehicles.map((vehicle) => [Number(vehicle.vehicle_id), vehicle]));
    const customerIds = new Set(customers.map((customer) => Number(customer.customer_id)));
    const requestsById = new Map(requests.map((request) => [Number(request.request_id), request]));

    // Apply the selected window to appointment and work-order activity consistently.
    const selectedAppointments = appointments.filter((appointment) => inRange(appointment.appointment_date));
    const selectedAppointmentIds = new Set(selectedAppointments.map((appointment) => Number(appointment.appointment_id)));
    const selectedVehicleIds = new Set<number>();
    const selectedCustomerIds = new Set<number>();
    for (const appointment of selectedAppointments) {
      const vehicle = vehiclesById.get(Number(appointment.vehicle_id));
      if (vehicle) {
        selectedVehicleIds.add(Number(vehicle.vehicle_id));
        if (customerIds.has(Number(vehicle.customer_id))) selectedCustomerIds.add(Number(vehicle.customer_id));
      }
    }
    const requestsInRange = requests.filter((request) => selectedAppointmentIds.has(Number(request.appointment_id)));
    const invoicesInRange = invoices.filter((invoice) => inRange(invoice.invoice_date));
    const feedbackInRange = feedback.filter((item) => inRange(item.feedback_date));
    const usagesInRange = usages.filter((usage) => {
      const request = requestsById.get(Number(usage.request_id));
      const appointment = request ? appointmentsById.get(Number(request.appointment_id)) : undefined;
      return inRange(usage.appointment_date ?? appointment?.appointment_date);
    });

    const requestAppointmentIds = new Set(requestsInRange.map((request) => Number(request.appointment_id)));
    const appointmentTrendMap = new Map<string, { day: string; appointments: number; cancelled: number; with_request: number }>();
    for (const appointment of selectedAppointments) {
      const day = String(appointment.appointment_date ?? '').slice(0, 10);
      if (!day) continue;
      const item = appointmentTrendMap.get(day) ?? { day, appointments: 0, cancelled: 0, with_request: 0 };
      item.appointments++;
      if (appointment.status === 'CANCELLED') item.cancelled++;
      if (requestAppointmentIds.has(Number(appointment.appointment_id))) item.with_request++;
      appointmentTrendMap.set(day, item);
    }

    // Today's schedule and future bookings are live operational snapshots, separate from the history filter.
    const todays = await Promise.all(appointments
      .filter((appointment) => String(appointment.appointment_date).slice(0, 10) === today)
      .sort((a, b) => String(a.appointment_time).localeCompare(String(b.appointment_time)))
      .map(appointmentShape));
    const upcoming = await Promise.all(appointments
      .filter((appointment) => String(appointment.appointment_date).slice(0, 10) > today && appointment.status !== 'CANCELLED')
      .sort((a, b) => String(a.appointment_date).localeCompare(String(b.appointment_date)))
      .slice(0, 6)
      .map(async (appointment) => ({
        ...await appointmentShape(appointment),
        days_away: Math.ceil((new Date(`${String(appointment.appointment_date).slice(0, 10)}T00:00:00`).getTime()
          - new Date(`${today}T00:00:00`).getTime()) / 86400000),
      })));

    const statuses = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    const requestStatus = statuses.map((status) => {
      const matching = requestsInRange.filter((request) => request.service_status === status);
      return {
        service_status: status as any,
        total: matching.length,
        estimated_value: round(matching.reduce((sum, request) => sum + Number(request.estimated_cost ?? 0), 0)),
        actual_value: round(matching.reduce((sum, request) => sum + Number(request.actual_cost ?? 0), 0)),
      };
    });

    const workload = mechanics.map((mechanic) => {
      const mine = requestsInRange.filter((request) => Number(request.mechanic_id) === Number(mechanic.mechanic_id));
      const completed = mine.filter((request) => request.service_status === 'COMPLETED');
      const completedIds = new Set(completed.map((request) => Number(request.request_id)));
      const completionBonus = completed.reduce((sum, request) => sum + 100 + (Number(request.actual_cost ?? 0) >= 5000 ? 250 : 0), 0);
      const ratingBonus = feedbackInRange.filter((item) => completedIds.has(Number(item.request_id)) && Number(item.rating) === 5).length * 100;
      const bonusInRange = round(completionBonus + ratingBonus);
      return {
        ...mechanic,
        mechanic_name: fullName(mechanic),
        active_jobs: mine.filter((request) => !['COMPLETED', 'CANCELLED'].includes(String(request.service_status))).length,
        completed_jobs: completed.length,
        revenue_handled: round(completed.reduce((sum, request) => sum + Number(request.actual_cost ?? 0), 0)),
        total_bonus: bonusInRange,
        bonus_in_range: bonusInRange,
      };
    });

    const alertParts: any[] = parts
      .filter((part) => Number(part.stock_quantity) <= Number(part.reorder_level))
      .map((part) => ({
        ...part,
        stock_status: stockStatus(Number(part.stock_quantity), Number(part.reorder_level)),
        shortfall: Math.max(0, Number(part.reorder_level) - Number(part.stock_quantity)),
      } as any))
      .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity));
    const totalRevenue = round(invoicesInRange.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0));
    const collected = round(invoicesInRange
      .filter((invoice) => invoice.payment_status === 'PAID')
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0));
    const byStatus = (status: string) => requestsInRange.filter((request) => request.service_status === status).length;
    const ratingAverage = feedbackInRange.length
      ? round(feedbackInRange.reduce((sum, item) => sum + Number(item.rating), 0) / feedbackInRange.length)
      : 0;
    const revenueByMonth = new Map<string, any>();
    for (const invoice of invoicesInRange) {
      const month = String(invoice.invoice_date ?? '').slice(0, 7);
      if (!month) continue;
      const item = revenueByMonth.get(month) ?? { month, invoices: 0, revenue: 0, labor: 0, parts: 0, collected: 0 };
      item.invoices++;
      item.revenue += Number(invoice.total_amount);
      item.labor += Number(invoice.labor_amount);
      item.parts += Number(invoice.parts_amount);
      if (invoice.payment_status === 'PAID') item.collected += Number(invoice.total_amount);
      revenueByMonth.set(month, item);
    }
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: feedbackInRange.filter((item) => Number(item.rating) === rating).length,
    }));

    const kpis: DashboardKpis = {
      total_customers: selectedCustomerIds.size,
      total_vehicles: selectedVehicleIds.size,
      work_orders_in_range: requestsInRange.length,
      appointments_today: todays.length,
      appointments_in_range: selectedAppointments.length,
      active_requests: requestsInRange.filter((request) => !['COMPLETED', 'CANCELLED'].includes(String(request.service_status))).length,
      open_requests: byStatus('OPEN'),
      in_progress_requests: byStatus('IN_PROGRESS'),
      on_hold_requests: byStatus('ON_HOLD'),
      completed_requests: byStatus('COMPLETED'),
      cancelled_requests: byStatus('CANCELLED'),
      completion_rate: requestsInRange.length ? round(byStatus('COMPLETED') / requestsInRange.length * 100) : 0,
      low_stock_parts: parts.filter((part) => Number(part.stock_quantity) > 0 && Number(part.stock_quantity) <= Number(part.reorder_level)).length,
      out_of_stock_parts: parts.filter((part) => Number(part.stock_quantity) === 0).length,
      needs_reorder_parts: alertParts.length,
      total_parts: parts.length,
      units_on_hand: parts.reduce((sum, part) => sum + Number(part.stock_quantity), 0),
      inventory_value: round(parts.reduce((sum, part) => sum + Number(part.unit_price) * Number(part.stock_quantity), 0)),
      total_revenue: totalRevenue,
      collected_revenue: collected,
      outstanding_revenue: round(totalRevenue - collected),
      labor_revenue: round(invoicesInRange.reduce((sum, invoice) => sum + Number(invoice.labor_amount), 0)),
      parts_revenue: round(invoicesInRange.reduce((sum, invoice) => sum + Number(invoice.parts_amount), 0)),
      tax_collected: round(invoicesInRange.reduce((sum, invoice) => sum + Number(invoice.tax_amount), 0)),
      discounts_given: round(invoicesInRange.reduce((sum, invoice) => sum + Number(invoice.discount_amount), 0)),
      invoice_count: invoicesInRange.length,
      unpaid_invoices: invoicesInRange.filter((invoice) => invoice.payment_status !== 'PAID').length,
      avg_invoice: invoicesInRange.length ? round(totalRevenue / invoicesInRange.length) : 0,
      avg_rating: ratingAverage,
      feedback_count: feedbackInRange.length,
      five_star_feedback: feedbackInRange.filter((item) => Number(item.rating) === 5).length,
      critical_feedback: feedbackInRange.filter((item) => Number(item.rating) <= 2).length,
      mechanics_available: mechanics.filter((mechanic) => mechanic.availability_status === 'AVAILABLE').length,
      mechanics_busy: mechanics.filter((mechanic) => mechanic.availability_status === 'BUSY').length,
      mechanics_total: mechanics.length,
      bonus_paid: round(workload.reduce((sum, mechanic) => sum + Number(mechanic.bonus_in_range), 0)),
      parts_consumed_value: round(usagesInRange.reduce((sum, usage) => sum + Number(usage.total_cost ?? 0), 0)),
      part_movements: usagesInRange.length,
    };
    const recent = await Promise.all([...requestsInRange]
      .sort((a, b) => Number(b.request_id) - Number(a.request_id))
      .slice(0, 8)
      .map(requestShape));

    return {
      summary: {
        as_of: new Date().toISOString(),
        range,
        window: { from, to },
        kpis,
        totals: {
          appointments: selectedAppointments.length,
          requests: requestsInRange.length,
          invoices: invoicesInRange.length,
          revenue: totalRevenue,
          inventory_value: kpis.inventory_value,
          feedback: feedbackInRange.length,
        },
      },
      todays_appointments: { date: today, total: todays.length, appointments: todays, upcoming },
      request_status: requestStatus,
      mechanic_workload: workload as any,
      inventory_alerts: alertParts as any,
      recent_activity: recent,
      revenue_trend: [...revenueByMonth.values()]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((item) => ({
          ...item,
          revenue: round(item.revenue),
          labor: round(item.labor),
          parts: round(item.parts),
          collected: round(item.collected),
        })),
      rating_distribution: ratingDistribution,
      appointment_trend: [...appointmentTrendMap.values()].sort((a, b) => a.day.localeCompare(b.day)),
    };
  },
  customers:{list:async(q?:ListQuery)=>{
    const [cs,vehicles,invoices,feedback,appointments,requests]=await Promise.all([list('customers'),list('vehicles'),list('invoices'),list('feedback'),list('appointments'),list('requests')]);
    const rows=cs.map(c=>{
      const ownedVehicles=vehicles.filter(v=>Number(v.customer_id)===Number(c.customer_id));
      const vehicleIds=new Set(ownedVehicles.map(v=>Number(v.vehicle_id)));
      const appointmentIds=new Set(appointments.filter(a=>vehicleIds.has(Number(a.vehicle_id))).map(a=>Number(a.appointment_id)));
      const requestIds=new Set(requests.filter(r=>appointmentIds.has(Number(r.appointment_id))).map(r=>Number(r.request_id)));
      const ratings=feedback.filter(f=>Number(f.customer_id)===Number(c.customer_id));
      const billed=invoices.filter(i=>requestIds.has(Number(i.request_id))).reduce((sum,i)=>sum+Number(i.total_amount),0);
      return {...c,customer_name:fullName(c),vehicle_count:ownedVehicles.length,request_count:requestIds.size,feedback_count:ratings.length,avg_rating:ratings.length?round(ratings.reduce((sum,f)=>sum+Number(f.rating),0)/ratings.length):0,total_billed:round(billed)};
    });
    return page(rows,q,['customer_id','customer_name','phone','email','city','state'],'customer_id');
  },get:customerDetail,create:async(input:CustomerInput)=>{const cs=await list('customers');assertUnique(cs,'email',input.email,'Email');assertUnique(cs,'phone',input.phone,'Phone');const id=await insertRow('customers',{first_name:nonblank(input.firstName,'First name'),last_name:nonblank(input.lastName,'Last name'),phone:nonblank(input.phone,'Phone'),email:nonblank(input.email,'Email').toLowerCase(),address:input.address||null,city:input.city||null,state:input.state||null,pincode:input.pincode||null,created_at:nowSql()});return customerDetail(id);},update:async(id:number,input:Partial<CustomerInput>)=>{const c=await row('customers',id);const next={...c,...(input.firstName!==undefined?{first_name:nonblank(input.firstName,'First name')}:{}),...(input.lastName!==undefined?{last_name:nonblank(input.lastName,'Last name')}:{}),...(input.phone!==undefined?{phone:nonblank(input.phone,'Phone')}:{}),...(input.email!==undefined?{email:nonblank(input.email,'Email').toLowerCase()}:{}),...(input.address!==undefined?{address:input.address||null}:{}),...(input.city!==undefined?{city:input.city||null}:{}),...(input.state!==undefined?{state:input.state||null}:{}),...(input.pincode!==undefined?{pincode:input.pincode||null}:{})};const cs=await list('customers');assertUnique(cs,'email',next.email,'Email',id,'customer_id');assertUnique(cs,'phone',next.phone,'Phone',id,'customer_id');await saveRow('customers',next);return customerDetail(id);},remove:async(id:number)=>{if((await list('vehicles')).some(v=>Number(v.customer_id)===id))throw new Error('This customer still has vehicles and cannot be deleted.');await deleteRow('customers',id);return {deleted:true,id};},cities:async()=>[...new Set((await list('customers')).map(c=>c.city).filter(Boolean))].map(city=>({city:String(city)}))},
  vehicles:{list:async(q?:ListQuery)=>{const vs=await list('vehicles');const rows=await Promise.all(vs.map(async v=>{const c=await readOne('customers',Number(v.customer_id));const ap=(await list('appointments')).filter(a=>Number(a.vehicle_id)===Number(v.vehicle_id));const req=await Promise.all((await list('requests')).filter(r=>ap.some(a=>Number(a.appointment_id)===Number(r.appointment_id))).map(requestShape));return {...v,customer_name:c?fullName(c):'—',customer_phone:c?.phone,customer_email:c?.email,appointment_count:ap.length,request_count:req.length,last_visit_date:req.filter(r=>r.service_status==='COMPLETED').map(r=>String(r.appointment_date)).sort().at(-1)??null,latest_request_status:[...req].sort((a,b)=>`${String(b.appointment_date??'')} ${String(b.appointment_time??'')}`.localeCompare(`${String(a.appointment_date??'')} ${String(a.appointment_time??'')}`))[0]?.service_status??null,service_state:deriveVehicleServiceState(req)};}));return page(rows,q,['vehicle_id','registration_number','make','model','customer_name'],'vehicle_id');},get:vehicleDetail,create:async(input:VehicleInput)=>{const customer=await readOne('customers',Number(input.customerId));if(!customer)throw new Error('Select an existing customer.');const vs=await list('vehicles');for(const [key,val,label] of [['registration_number',input.registrationNumber,'Registration number'],['chassis_number',input.chassisNumber,'Chassis number'],['engine_number',input.engineNumber,'Engine number']] as const)assertUnique(vs,key,val,label);const id=await insertRow('vehicles',{customer_id:Number(input.customerId),registration_number:nonblank(input.registrationNumber,'Registration number').toUpperCase(),chassis_number:nonblank(input.chassisNumber,'Chassis number'),engine_number:nonblank(input.engineNumber,'Engine number'),make:nonblank(input.make,'Make'),model:nonblank(input.model,'Model'),variant:input.variant||null,manufacture_year:input.manufactureYear||null,fuel_type:input.fuelType||null,transmission:input.transmission||null,color:input.color||null,current_mileage:Number(input.currentMileage||0)});return vehicleDetail(id);},update:async(id:number,input:Partial<VehicleInput>)=>{const v=await row('vehicles',id);const next={...v,...(input.customerId!==undefined?{customer_id:Number(input.customerId)}:{}),...(input.registrationNumber!==undefined?{registration_number:nonblank(input.registrationNumber,'Registration number').toUpperCase()}:{}),...(input.chassisNumber!==undefined?{chassis_number:nonblank(input.chassisNumber,'Chassis number')}:{}),...(input.engineNumber!==undefined?{engine_number:nonblank(input.engineNumber,'Engine number')}:{}),...(input.make!==undefined?{make:nonblank(input.make,'Make')}:{}),...(input.model!==undefined?{model:nonblank(input.model,'Model')}:{}),...(input.variant!==undefined?{variant:input.variant||null}:{}),...(input.manufactureYear!==undefined?{manufacture_year:input.manufactureYear||null}:{}),...(input.fuelType!==undefined?{fuel_type:input.fuelType||null}:{}),...(input.transmission!==undefined?{transmission:input.transmission||null}:{}),...(input.color!==undefined?{color:input.color||null}:{}),...(input.currentMileage!==undefined?{current_mileage:Number(input.currentMileage||0)}:{})};if(!await readOne('customers',Number(next.customer_id)))throw new Error('Select an existing customer.');const vs=await list('vehicles');for(const [key,val,label] of [['registration_number',next.registration_number,'Registration number'],['chassis_number',next.chassis_number,'Chassis number'],['engine_number',next.engine_number,'Engine number']] as const)assertUnique(vs,key,val,label,id,'vehicle_id');await saveRow('vehicles',next);return vehicleDetail(id);},remove:async(id:number)=>{if((await list('appointments')).some(a=>Number(a.vehicle_id)===id))throw new Error('This vehicle has appointments and cannot be deleted.');await deleteRow('vehicles',id);return {deleted:true,id};},makes:async()=>[...new Set((await list('vehicles')).map(v=>v.make))].map(make=>({make:String(make)})),fuelTypes:async()=>[...new Set((await list('vehicles')).map(v=>v.fuel_type).filter(Boolean))].map(fuel_type=>({fuel_type:String(fuel_type)}))},
  appointments:{list:async(q?:ListQuery)=>page(await Promise.all((await list('appointments')).map(appointmentShape)),q,['appointment_id','registration_number','customer_name','service_type','status'],'appointment_id'),get:appointmentDetail,create:async(input:AppointmentInput)=>{if(!await readOne('vehicles',Number(input.vehicleId)))throw new Error('Select an existing vehicle.');const id=await insertRow('appointments',{vehicle_id:Number(input.vehicleId),appointment_date:nonblank(input.appointmentDate,'Appointment date'),appointment_time:nonblank(input.appointmentTime,'Appointment time'),service_type:nonblank(input.serviceType,'Service type'),booking_mode:input.bookingMode??'ONLINE',status:'BOOKED'});return api.appointments.get(id);},update:async(id:number,input:Partial<AppointmentInput>&{status?:string})=>{const a=await row('appointments',id);const next={...a,...(input.vehicleId!==undefined?{vehicle_id:Number(input.vehicleId)}:{}),...(input.appointmentDate!==undefined?{appointment_date:input.appointmentDate}:{}),...(input.appointmentTime!==undefined?{appointment_time:input.appointmentTime}:{}),...(input.serviceType!==undefined?{service_type:input.serviceType}:{}),...(input.bookingMode!==undefined?{booking_mode:input.bookingMode}:{}),...(input.status!==undefined?{status:input.status}:{})};await saveRow('appointments',next);return api.appointments.get(id);},remove:async(id:number)=>{if((await list('requests')).some(r=>Number(r.appointment_id)===id))throw new Error('This appointment has a service request and cannot be deleted.');await deleteRow('appointments',id);return {deleted:true,id};},available:async()=>{const l=await api.lookups();return l.appointments as any;},serviceTypes:async()=>api.lookups().then(x=>x.serviceTypes.map(s=>({service_type:s.label,uses:s.uses})) )},
  requests:{list:async(q?:ListQuery)=>{let rows=await Promise.all((await list('requests')).map(requestShape));const status=String(q?.status??'').toUpperCase();if(status==='ACTIVE')rows=rows.filter(r=>['OPEN','IN_PROGRESS','ON_HOLD'].includes(String(r.service_status).toUpperCase()));else if(status)rows=rows.filter(r=>String(r.service_status).toUpperCase()===status);return page(rows,q,['request_id','registration_number','customer_name','mechanic_name','service_status','complaint_description'],'request_id');},get:workOrder,create:async(input:RequestInput)=>{const ap=await readOne('appointments',Number(input.appointmentId));if(!ap)throw new Error('Select an existing appointment.');if((await list('requests')).some(r=>Number(r.appointment_id)===Number(input.appointmentId)))throw new Error('This appointment already has a service request.');if(!await readOne('mechanics',Number(input.mechanicId)))throw new Error('Select an existing mechanic.');const id=await insertRow('requests',{appointment_id:Number(input.appointmentId),mechanic_id:Number(input.mechanicId),complaint_description:nonblank(input.complaintDescription,'Complaint'),diagnosis:null,service_status:'OPEN',estimated_completion_date:input.estimatedCompletionDate||null,estimated_cost:Number(input.estimatedCost||0),actual_cost:null,created_at:nowSql()});return workOrder(id);},update:async(id:number,input:Record<string,unknown>)=>{const r=await row('requests',id);const next={...r,...(input.mechanicId!==undefined?{mechanic_id:Number(input.mechanicId)}:{}),...(input.complaintDescription!==undefined?{complaint_description:input.complaintDescription}:{}),...(input.diagnosis!==undefined?{diagnosis:input.diagnosis||null}:{}),...(input.estimatedCompletionDate!==undefined?{estimated_completion_date:input.estimatedCompletionDate||null}:{}),...(input.estimatedCost!==undefined?{estimated_cost:Number(input.estimatedCost??0)}:{})};if(input.mechanicId!==undefined&&!await readOne('mechanics',Number(input.mechanicId)))throw new Error('Mechanic does not exist.');await saveRow('requests',next);return workOrder(id);},setStatus:async(id:number,serviceStatus:string)=>{const r=await row('requests',id);const next=serviceStatus.toUpperCase();if(!['OPEN','IN_PROGRESS','ON_HOLD','CANCELLED'].includes(next))throw new Error('Use Complete work order to mark a request completed.');await saveRow('requests',{...r,service_status:next});return {request_id:id,service_status:next,previous_status:r.service_status};},complete:async(id:number,actualCost:number,diagnosis?:string)=>{const r=await row('requests',id);const cost=num(actualCost,'Actual cost');const updated={...r,actual_cost:cost,diagnosis:diagnosis||null,service_status:'COMPLETED'};await saveRow('requests',updated);if(r.service_status!=='COMPLETED'){const m=await readOne('mechanics',Number(r.mechanic_id));if(m)await saveRow('mechanics',{...m,total_bonus:round(Number(m.total_bonus??0)+100+(cost>=5000?250:0))});}return {request_id:id,service_status:'COMPLETED',actual_cost:cost,bonus_awarded_by_trigger:r.service_status!=='COMPLETED',mechanic_bonus_total:(await readOne('mechanics',Number(r.mechanic_id)))?.total_bonus??null};},assignMechanic:async(id:number,mechanicId:number)=>{const r=await row('requests',id);if(!await readOne('mechanics',mechanicId))throw new Error(`Mechanic ${mechanicId} does not exist.`);await saveRow('requests',{...r,mechanic_id:mechanicId});return workOrder(id);},remove:async(id:number)=>{const [services,uses,invoices,feedback]=await Promise.all([list('services'),list('partUsage'),list('invoices'),list('feedback')]);if(services.some(x=>Number(x.request_id)===id)||uses.some(x=>Number(x.request_id)===id)||invoices.some(x=>Number(x.request_id)===id)||feedback.some(x=>Number(x.request_id)===id))throw new Error('This work order has services, parts, an invoice or feedback and cannot be deleted.');await deleteRow('requests',id);return {deleted:true,id};},statuses:async()=>VOCABULARIES.requestStatuses,statusBreakdown:async()=>{const reqs=await list('requests');return VOCABULARIES.requestStatuses.map(service_status=>({service_status,total:reqs.filter(r=>r.service_status===service_status).length}));}},
  services:{list:async(q?:ListQuery)=>{const rows=await Promise.all((await list('services')).map(async s=>{const r=await readOne('requests',Number(s.request_id));const shaped=r?await requestShape(r):null;return {...s,service_status:shaped?.service_status,appointment_date:shaped?.appointment_date,service_type:shaped?.service_type,registration_number:shaped?.registration_number,make:shaped?.make,model:shaped?.model,customer_name:shaped?.customer_name,mechanic_name:shaped?.mechanic_name};}));return page(rows,q,['service_id','service_name','request_id','registration_number','customer_name'],'service_id');},get:serviceDetail,forRequest:async(requestId:number)=>(await list('services')).filter(s=>Number(s.request_id)===requestId) as any,create:async(input:ServiceInput)=>{if(!await readOne('requests',Number(input.requestId)))throw new Error('Service request does not exist.');const id=await insertRow('services',{request_id:Number(input.requestId),service_name:nonblank(input.serviceName,'Service name'),description:input.description||null,labor_charge:Number(input.laborCharge||0),estimated_duration:input.estimatedDuration??null,remarks:input.remarks||null});return row('services',id) as Promise<ServiceLine>;},update:async(id:number,input:Partial<ServiceInput>)=>{const s=await row('services',id);const next={...s,...(input.serviceName!==undefined?{service_name:nonblank(input.serviceName,'Service name')}:{}),...(input.description!==undefined?{description:input.description||null}:{}),...(input.laborCharge!==undefined?{labor_charge:Number(input.laborCharge)}:{}),...(input.estimatedDuration!==undefined?{estimated_duration:input.estimatedDuration??null}:{}),...(input.remarks!==undefined?{remarks:input.remarks||null}:{})};await saveRow('services',next);return next as ServiceLine;},remove:async(id:number)=>{await deleteRow('services',id);return {deleted:true,id};},catalogue:async()=>{const ss=await list('services');const by=new Map<string,LocalRow[]>();for(const s of ss)by.set(String(s.service_name),[...(by.get(String(s.service_name))??[]),s]);return [...by].map(([service_name,items])=>({service_name,times_used:items.length,avg_labor_charge:round(items.reduce((n,s)=>n+Number(s.labor_charge),0)/items.length),min_labor_charge:Math.min(...items.map(s=>Number(s.labor_charge))),max_labor_charge:Math.max(...items.map(s=>Number(s.labor_charge))),avg_duration:Math.round(items.reduce((n,s)=>n+Number(s.estimated_duration??0),0)/items.length),sample_description:items.find(s=>s.description)?.description??null,total_labor:round(items.reduce((n,s)=>n+Number(s.labor_charge),0))})) as ServiceCatalogueEntry[]; }},
  mechanics:{list:async(q?:ListQuery)=>{const [ms,rs,feedback]=await Promise.all([list('mechanics'),list('requests'),list('feedback')]);const rows:any[]=ms.map(m=>{const mine=rs.filter(r=>Number(r.mechanic_id)===Number(m.mechanic_id));const ids=new Set(mine.map(r=>Number(r.request_id)));return {...m,mechanic_name:fullName(m),active_jobs:mine.filter(r=>!['COMPLETED','CANCELLED'].includes(String(r.service_status))).length,completed_jobs:mine.filter(r=>r.service_status==='COMPLETED').length,total_jobs:mine.length,revenue_handled:round(mine.reduce((s,r)=>s+Number(r.actual_cost??0),0)),avg_rating:feedback.filter(f=>ids.has(Number(f.request_id))).length?round(feedback.filter(f=>ids.has(Number(f.request_id))).reduce((s,f)=>s+Number(f.rating),0)/feedback.filter(f=>ids.has(Number(f.request_id))).length):0,total_bonus:Number(m.total_bonus??0)};});return page(rows,q,['mechanic_id','mechanic_name','specialization','availability_status'],'mechanic_id');},get:mechanicDetail,create:async(input:MechanicInput)=>{const id=await insertRow('mechanics',{first_name:nonblank(input.firstName,'First name'),last_name:nonblank(input.lastName,'Last name'),phone:nonblank(input.phone,'Phone'),specialization:input.specialization||null,experience_years:Number(input.experienceYears||0),joining_date:nonblank(input.joiningDate,'Joining date'),salary:num(input.salary,'Salary'),total_bonus:0,availability_status:input.availabilityStatus??'AVAILABLE'});return mechanicDetail(id);},update:async(id:number,input:Partial<MechanicInput>)=>{const m=await row('mechanics',id);const next={...m,...(input.firstName!==undefined?{first_name:input.firstName}:{}),...(input.lastName!==undefined?{last_name:input.lastName}:{}),...(input.phone!==undefined?{phone:input.phone}:{}),...(input.specialization!==undefined?{specialization:input.specialization||null}:{}),...(input.experienceYears!==undefined?{experience_years:Number(input.experienceYears)}:{}),...(input.joiningDate!==undefined?{joining_date:input.joiningDate}:{}),...(input.salary!==undefined?{salary:num(input.salary,'Salary')} :{}),...(input.availabilityStatus!==undefined?{availability_status:input.availabilityStatus}:{})};await saveRow('mechanics',next);return mechanicDetail(id);},remove:async(id:number)=>{if((await list('requests')).some(r=>Number(r.mechanic_id)===id))throw new Error('This mechanic is assigned to work orders and cannot be deleted.');await deleteRow('mechanics',id);return {deleted:true,id};},performance:async()=>api.mechanics.list({limit:100}).then(p=>p.data.map(m=>({mechanic_id:m.mechanic_id,mechanic:m.mechanic_name??'',completed_requests:Number(m.completed_jobs),total_revenue_handled:Number(m.revenue_handled),total_bonus:Number(m.total_bonus)}))),awardBonus:async(requestId:number)=>{const r=await row('requests',requestId);const fb=(await list('feedback')).find(f=>Number(f.request_id)===requestId);const m=await row('mechanics',Number(r.mechanic_id));const before=Number(m.total_bonus??0);const added=Number(fb?.rating)===5&&r.service_status==='COMPLETED'?100:0;if(added)await saveRow('mechanics',{...m,total_bonus:round(before+added)});return {request_id:requestId,mechanic:fullName(m),rating:fb?.rating??null,bonus_before:before,bonus_after:before+added,bonus_added:added};},specializations:async()=>{const ms=await list('mechanics');return [...new Set(ms.map(m=>String(m.specialization??'')).filter(Boolean))].map(specialization=>({specialization,total:ms.filter(m=>m.specialization===specialization).length}));}},
  inventory:{list:async(q?:ListQuery)=>{const [parts,suppliers,usages]=await Promise.all([list('parts'),list('suppliers'),list('partUsage')]);let rows:any[]=parts.map(p=>({...p,supplier_name:suppliers.find(s=>Number(s.supplier_id)===Number(p.supplier_id))?.supplier_name??'—',stock_status:stockStatus(Number(p.stock_quantity),Number(p.reorder_level)),stock_value:round(Number(p.unit_price)*Number(p.stock_quantity)),usage_count:usages.filter(u=>Number(u.part_id)===Number(p.part_id)).length}));const stockFilter=String(q?.stockStatus??'').trim().toUpperCase();if(stockFilter==='ATTENTION')rows=rows.filter(p=>['LOW STOCK','OUT OF STOCK'].includes(String(p.stock_status).toUpperCase()));else if(stockFilter)rows=rows.filter(p=>String(p.stock_status).toUpperCase()===stockFilter);return page(rows,q,['part_id','part_name','category','supplier_name','stock_status'],'part_id');},get:partDetail,create:async(input:PartInput)=>{if(!await readOne('suppliers',Number(input.supplierId)))throw new Error('Select an existing supplier.');const id=await insertRow('parts',{supplier_id:Number(input.supplierId),part_name:nonblank(input.partName,'Part name'),category:input.category||null,manufacturer:input.manufacturer||null,unit_price:num(input.unitPrice,'Unit price'),stock_quantity:Number(input.stockQuantity??0),reorder_level:Number(input.reorderLevel??0),warranty_months:Number(input.warrantyMonths??0)});return partDetail(id);},update:async(id:number,input:Partial<PartInput>)=>{const p=await row('parts',id);const next={...p,...(input.supplierId!==undefined?{supplier_id:Number(input.supplierId)}:{}),...(input.partName!==undefined?{part_name:nonblank(input.partName,'Part name')}:{}),...(input.category!==undefined?{category:input.category||null}:{}),...(input.manufacturer!==undefined?{manufacturer:input.manufacturer||null}:{}),...(input.unitPrice!==undefined?{unit_price:num(input.unitPrice,'Unit price')} :{}),...(input.stockQuantity!==undefined?{stock_quantity:Number(input.stockQuantity)}:{}),...(input.reorderLevel!==undefined?{reorder_level:Number(input.reorderLevel)}:{}),...(input.warrantyMonths!==undefined?{warranty_months:Number(input.warrantyMonths)}:{})};if(!await readOne('suppliers',Number(next.supplier_id)))throw new Error('Supplier does not exist.');await saveRow('parts',next);return partDetail(id);},remove:async(id:number)=>{if((await list('partUsage')).some(u=>Number(u.part_id)===id))throw new Error('This part has usage records and cannot be deleted.');await deleteRow('parts',id);return {deleted:true,id};},summary:async():Promise<InventorySummary>=>{const parts=await list('parts');const usages=await list('partUsage');return {total_parts:parts.length,categories:new Set(parts.map(p=>p.category).filter(Boolean)).size,suppliers:new Set(parts.map(p=>p.supplier_id)).size,units_on_hand:parts.reduce((s,p)=>s+Number(p.stock_quantity),0),inventory_value:round(parts.reduce((s,p)=>s+Number(p.unit_price)*Number(p.stock_quantity),0)),avg_unit_price:parts.length?round(parts.reduce((s,p)=>s+Number(p.unit_price),0)/parts.length):0,in_stock:parts.filter(p=>Number(p.stock_quantity)>Number(p.reorder_level)).length,low_stock:parts.filter(p=>Number(p.stock_quantity)>0&&Number(p.stock_quantity)<=Number(p.reorder_level)).length,out_of_stock:parts.filter(p=>Number(p.stock_quantity)===0).length,needs_reorder:parts.filter(p=>Number(p.stock_quantity)<=Number(p.reorder_level)).length,usage_rows:usages.length,units_consumed:usages.reduce((s,u)=>s+Number(u.quantity_used),0),consumed_value:round(usages.reduce((s,u)=>s+Number(u.total_cost),0))};},alerts:async(limit=8)=>(await api.inventory.list({limit:100})).data.filter(p=>Number(p.stock_quantity)<=Number(p.reorder_level)).slice(0,limit).map(p=>({...p,shortfall:Math.max(0,Number(p.reorder_level)-Number(p.stock_quantity))})),categories:async()=>{const ps=await list('parts');return [...new Set(ps.map(p=>String(p.category??'')).filter(Boolean))].map(category=>({category,total:ps.filter(p=>p.category===category).length}));},picker:async()=>(await api.inventory.list({limit:100})).data,byCategory:async()=>{const ps=await list('parts');return [...new Set(ps.map(p=>String(p.category??'Uncategorised')))].map(category=>{const rows=ps.filter(p=>String(p.category??'Uncategorised')===category);return {category,parts:rows.length,units:rows.reduce((s,p)=>s+Number(p.stock_quantity),0),value:round(rows.reduce((s,p)=>s+Number(p.unit_price)*Number(p.stock_quantity),0))};})}},
  partUsage:{list:async(q?:Query)=>{const us=await list('partUsage');return us.filter(u=>(!q?.requestId||Number(u.request_id)===Number(q.requestId))&&(!q?.partId||Number(u.part_id)===Number(q.partId))) as any;},forRequest:async(requestId:number)=>{const rows=(await list('partUsage')).filter(u=>Number(u.request_id)===requestId);return {request_id:requestId,lines:rows.length,units:rows.reduce((s,u)=>s+Number(u.quantity_used),0),parts_amount:round(rows.reduce((s,u)=>s+Number(u.total_cost),0)),rows:rows as any};},create:async(input:{requestId:number;partId:number;quantityUsed:number}):Promise<PartUsageResult>=>{const result=await issuePartUsage(Number(input.requestId),Number(input.partId),Number(input.quantityUsed));return {...result.usage,request_id:Number(input.requestId),part_id:Number(input.partId),part_name:result.part.part_name,total_cost:result.usage.total_cost,unit_price:result.part.unit_price,stock_before:Number(result.part.stock_quantity)+Number(input.quantityUsed),stock_after:Number(result.part.stock_quantity),stock_status:stockStatus(Number(result.part.stock_quantity),Number(result.part.reorder_level)),computed_by:'IndexedDB local transaction'} as PartUsageResult;},remove:async(id:number)=>{const u=await row('partUsage',id);await deleteRow('partUsage',id);return {usage_id:id,part_id:Number(u.part_id),quantity_used:Number(u.quantity_used),stock_after_delete:Number((await readOne('parts',Number(u.part_id)))?.stock_quantity??0),stock_returned:false,note:'Deleting a usage record does not return stock; adjust inventory manually.'};},top:async(limit=8)=>{const [usages,parts]=await Promise.all([list('partUsage'),list('parts')]);return parts.map(p=>{const matching=usages.filter(u=>Number(u.part_id)===Number(p.part_id));return {...p,times_used:matching.length,units_used:matching.reduce((sum,u)=>sum+Number(u.quantity_used),0),consumed_value:round(matching.reduce((sum,u)=>sum+Number(u.total_cost),0))};}).filter(p=>p.times_used>0).sort((a,b)=>Number(b.units_used)-Number(a.units_used)).slice(0,limit)}},
  suppliers:{list:async(q?:ListQuery)=>{const [ss,parts]=await Promise.all([list('suppliers'),list('parts')]);return page(ss.map(s=>{const ps=parts.filter(p=>Number(p.supplier_id)===Number(s.supplier_id));return {...s,parts_supplied:ps.length,units_held:ps.reduce((n,p)=>n+Number(p.stock_quantity),0),stock_value:round(ps.reduce((n,p)=>n+Number(p.unit_price)*Number(p.stock_quantity),0)),attention_parts:ps.filter(p=>Number(p.stock_quantity)<=Number(p.reorder_level)).length};}),q,['supplier_id','supplier_name','contact_person','phone','city'],'supplier_id');},get:supplierDetail,create:async(input:SupplierInput)=>{const ss=await list('suppliers');if(input.gstNumber)assertUnique(ss,'gst_number',input.gstNumber,'GST number');const id=await insertRow('suppliers',{supplier_name:nonblank(input.supplierName,'Supplier name'),contact_person:input.contactPerson||null,phone:input.phone||null,email:input.email||null,address:input.address||null,city:input.city||null,gst_number:input.gstNumber||null});return supplierDetail(id);},update:async(id:number,input:Partial<SupplierInput>)=>{const s=await row('suppliers',id);const next={...s,...(input.supplierName!==undefined?{supplier_name:nonblank(input.supplierName,'Supplier name')}:{}),...(input.contactPerson!==undefined?{contact_person:input.contactPerson||null}:{}),...(input.phone!==undefined?{phone:input.phone||null}:{}),...(input.email!==undefined?{email:input.email||null}:{}),...(input.address!==undefined?{address:input.address||null}:{}),...(input.city!==undefined?{city:input.city||null}:{}),...(input.gstNumber!==undefined?{gst_number:input.gstNumber||null}:{})};const ss=await list('suppliers');if(next.gst_number)assertUnique(ss,'gst_number',next.gst_number,'GST number',id,'supplier_id');await saveRow('suppliers',next);return supplierDetail(id);},remove:async(id:number)=>{if((await list('parts')).some(p=>Number(p.supplier_id)===id))throw new Error('This supplier still has inventory parts and cannot be deleted.');await deleteRow('suppliers',id);return {deleted:true,id};},picker:async()=>(await api.lookups()).suppliers},
  invoices:{list:async(q?:ListQuery)=>{const rows:any[]=await Promise.all((await list('invoices')).map(async i=>{const r=await readOne('requests',Number(i.request_id));const x=r?await requestShape(r):null;return {...i,customer_name:x?.customer_name,registration_number:x?.registration_number,service_status:x?.service_status,appointment_date:x?.appointment_date,service_type:x?.service_type,vehicle_id:x?.vehicle_id,make:x?.make,model:x?.model,customer_id:x?.customer_id,mechanic_name:x?.mechanic_name};}));return page(rows,q,['invoice_id','request_id','customer_name','registration_number','payment_status'],'invoice_id');},get:invoiceDetail,generate:async(input:{requestId:number;laborAmount:number;taxAmount:number;discountAmount:number})=>{const req=await readOne('requests',Number(input.requestId));if(!req)throw new Error('Service request does not exist.');const usages=(await list('partUsage')).filter(u=>Number(u.request_id)===Number(input.requestId));const partsAmount=round(usages.reduce((s,u)=>s+Number(u.total_cost),0));const labor=num(input.laborAmount,'Labour amount'),tax=num(input.taxAmount,'Tax amount'),discount=num(input.discountAmount,'Discount amount');const total=round(Math.max(0,labor+partsAmount+tax-discount));const old=(await list('invoices')).find(i=>Number(i.request_id)===Number(input.requestId));const data={request_id:Number(input.requestId),labor_amount:labor,parts_amount:partsAmount,tax_amount:tax,discount_amount:discount,total_amount:total,invoice_date:old?.invoice_date??isoToday(),payment_status:old?.payment_status??'PENDING'};if(old)await saveRow('invoices',{...old,...data});else{const id=await insertRow('invoices',data);return row('invoices',id) as Promise<Invoice>;}return row('invoices',Number(old!.invoice_id)) as Promise<Invoice>;},update:async(id:number,input:Record<string,unknown>)=>{const inv=await row('invoices',id);if(input.paymentStatus!==undefined)inv.payment_status=String(input.paymentStatus).toUpperCase();if(input.invoiceDate!==undefined)inv.invoice_date=input.invoiceDate;if(input.laborAmount!==undefined||input.taxAmount!==undefined||input.discountAmount!==undefined)return api.invoices.generate({requestId:Number(inv.request_id),laborAmount:Number(input.laborAmount??inv.labor_amount),taxAmount:Number(input.taxAmount??inv.tax_amount),discountAmount:Number(input.discountAmount??inv.discount_amount)}).then(async()=>invoiceDetail(id));await saveRow('invoices',inv);return invoiceDetail(id);},setPaymentStatus:async(id:number,paymentStatus:string)=>{const inv=await row('invoices',id);const next={...inv,payment_status:paymentStatus.toUpperCase()};await saveRow('invoices',next);return invoiceDetail(id);},remove:async(id:number)=>{await deleteRow('invoices',id);return {deleted:true,id};},summary:async():Promise<InvoiceSummary>=>{const rows=await list('invoices');const revenue=round(rows.reduce((s,i)=>s+Number(i.total_amount),0));const collected=round(rows.filter(i=>i.payment_status==='PAID').reduce((s,i)=>s+Number(i.total_amount),0));return {invoices:rows.length,revenue,labor:round(rows.reduce((s,i)=>s+Number(i.labor_amount),0)),parts:round(rows.reduce((s,i)=>s+Number(i.parts_amount),0)),tax:round(rows.reduce((s,i)=>s+Number(i.tax_amount),0)),discounts:round(rows.reduce((s,i)=>s+Number(i.discount_amount),0)),avg_invoice:rows.length?round(revenue/rows.length):0,largest_invoice:Math.max(0,...rows.map(i=>Number(i.total_amount))),collected,outstanding:round(revenue-collected),by_status:['PENDING','PARTIAL','PAID'].map(payment_status=>({payment_status:payment_status as any,invoices:rows.filter(i=>i.payment_status===payment_status).length,amount:round(rows.filter(i=>i.payment_status===payment_status).reduce((s,i)=>s+Number(i.total_amount),0))})),monthly:[]};},ungenerated:async()=>{const requests=await list('requests');const invoices=await list('invoices');return Promise.all(requests.filter(r=>!invoices.some(i=>Number(i.request_id)===Number(r.request_id))).map(async r=>{const s=await requestShape(r);return {...s,labor_total:s.labor_total??0,parts_total:s.parts_total??0};}));}},
  feedback:{list:async(q?:ListQuery)=>page(await Promise.all((await list('feedback')).map(async f=>{const r=await readOne('requests',Number(f.request_id));const s=r?await requestShape(r):null;return {...f,customer_name:fullName(await readOne('customers',Number(f.customer_id))??{}),mechanic_name:s?.mechanic_name,registration_number:s?.registration_number,service_status:s?.service_status,appointment_date:s?.appointment_date,service_type:s?.service_type};})),q,['feedback_id','rating','customer_name','mechanic_name','registration_number','comments'],'feedback_id'),get:feedbackDetail,create:async(input:FeedbackInput)=>{const req=await row('requests',Number(input.requestId));const ap=await row('appointments',Number(req.appointment_id));const v=await row('vehicles',Number(ap.vehicle_id));if(Number(v.customer_id)!==Number(input.customerId))throw new Error('This customer does not own the vehicle for this request.');if((await list('feedback')).some(f=>Number(f.request_id)===Number(input.requestId)))throw new Error('Feedback already exists for this service request.');const rating=Number(input.rating);if(!Number.isInteger(rating)||rating<1||rating>5)throw new Error('Rating must be a whole number between 1 and 5.');const id=await insertRow('feedback',{request_id:Number(input.requestId),customer_id:Number(input.customerId),rating,comments:input.comments||null,feedback_date:input.feedbackDate||isoToday()});let bonus=null;if(rating===5&&req.service_status==='COMPLETED'){const m=await row('mechanics',Number(req.mechanic_id));const before=Number(m.total_bonus??0);const after=before+100;await saveRow('mechanics',{...m,total_bonus:after});bonus={awarded_by:'local rule',before,after};}return {...await api.feedback.get(id),bonus};},update:async(id:number,input:Partial<{rating:number;comments:string;feedbackDate:string}>)=>{const f=await row('feedback',id);const next={...f,...(input.rating!==undefined?{rating:Number(input.rating)}:{}),...(input.comments!==undefined?{comments:input.comments||null}:{}),...(input.feedbackDate!==undefined?{feedback_date:input.feedbackDate}:{})};if(Number(next.rating)<1||Number(next.rating)>5)throw new Error('Rating must be from 1 to 5.');await saveRow('feedback',next);return next as FeedbackRow;},remove:async(id:number)=>{await deleteRow('feedback',id);return {deleted:true,id};},summary:async():Promise<FeedbackSummary>=>{const fs=await list('feedback');const total=fs.length;return {total,avg_rating:total?round(fs.reduce((s,f)=>s+Number(f.rating),0)/total):0,min_rating:total?Math.min(...fs.map(f=>Number(f.rating))):0,max_rating:total?Math.max(...fs.map(f=>Number(f.rating))):0,five_star:fs.filter(f=>Number(f.rating)===5).length,critical:fs.filter(f=>Number(f.rating)<=2).length,awaiting_feedback:(await api.feedback.awaiting()).length,distribution:[5,4,3,2,1].map(rating=>{const count=fs.filter(f=>Number(f.rating)===rating).length;return {rating,count,share:total?round(count/total*100):0};})};},awaiting:async()=>{const [reqs,fs]=await Promise.all([list('requests'),list('feedback')]);return Promise.all(reqs.filter(r=>r.service_status==='COMPLETED'&&!fs.some(f=>Number(f.request_id)===Number(r.request_id))).map(requestShape));},byMechanic:async()=>{const [ms,reqs,fs]=await Promise.all([list('mechanics'),list('requests'),list('feedback')]);return ms.map(m=>{const ids=reqs.filter(r=>Number(r.mechanic_id)===Number(m.mechanic_id)).map(r=>Number(r.request_id));const rows=fs.filter(f=>ids.includes(Number(f.request_id)));return {mechanic_id:m.mechanic_id,mechanic_name:fullName(m),feedback_count:rows.length,avg_rating:rows.length?round(rows.reduce((s,f)=>s+Number(f.rating),0)/rows.length):0};}).filter(m=>m.feedback_count>0);}},
  reports:{invoiceSummary:async():Promise<ViewResult<any>>=>{
    const [all,requests,appointments,vehicles,customers]=await Promise.all([list('invoices'),list('requests'),list('appointments'),list('vehicles'),list('customers')]);
    const rows=all.map(invoice=>{
      const request=requests.find(r=>Number(r.request_id)===Number(invoice.request_id));
      const appointment=request?appointments.find(a=>Number(a.appointment_id)===Number(request.appointment_id)):undefined;
      const vehicle=appointment?vehicles.find(v=>Number(v.vehicle_id)===Number(appointment.vehicle_id)):undefined;
      const customer=vehicle?customers.find(c=>Number(c.customer_id)===Number(vehicle.customer_id)):undefined;
      return {invoice_id:invoice.invoice_id,customer_name:customer?fullName(customer):'—',registration_number:vehicle?.registration_number??'—',labor_amount:invoice.labor_amount,parts_amount:invoice.parts_amount,tax_amount:invoice.tax_amount,discount_amount:invoice.discount_amount,total_amount:invoice.total_amount,payment_status:invoice.payment_status};
    });
    return {rows,total:rows.length,totals:{revenue:round(all.reduce((sum,i)=>sum+Number(i.total_amount),0)),labor:round(all.reduce((sum,i)=>sum+Number(i.labor_amount),0)),parts:round(all.reduce((sum,i)=>sum+Number(i.parts_amount),0))}};
  }},
  exportBackup:exportSnapshot,importBackup:importSnapshot,
};
