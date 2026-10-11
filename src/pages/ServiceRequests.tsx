import { api } from '../services/api';
import { ListPage,basicColumns } from './_shared';

const crud={entity:'service request',idKey:'request_id',createFields:[
  {key:'appointmentId',label:'Appointment without a work order',type:'select',source:'appointments',required:true},
  {key:'mechanicId',label:'Assign mechanic',type:'select',source:'mechanics',required:true},
  {key:'complaintDescription',label:'Customer complaint',type:'textarea',required:true},
  {key:'estimatedCompletionDate',label:'Estimated completion date',type:'date'},
  {key:'estimatedCost',label:'Estimated cost',type:'number',min:0},
],editFields:[
  {key:'mechanicId',label:'Assigned mechanic',type:'select',source:'mechanics',required:true},
  {key:'complaintDescription',label:'Customer complaint',type:'textarea',required:true},
  {key:'diagnosis',label:'Diagnosis',type:'textarea'},
  {key:'estimatedCompletionDate',label:'Estimated completion date',type:'date'},
  {key:'estimatedCost',label:'Estimated cost',type:'number',min:0},
],fromRow:(r:any)=>({mechanicId:r.mechanic_id,complaintDescription:r.complaint_description,diagnosis:r.diagnosis??'',estimatedCompletionDate:r.estimated_completion_date?String(r.estimated_completion_date).slice(0,10):'',estimatedCost:r.estimated_cost}),toApi:(v:any)=>({...v,appointmentId:v.appointmentId?Number(v.appointmentId):undefined,mechanicId:Number(v.mechanicId),estimatedCost:v.estimatedCost===''?undefined:Number(v.estimatedCost)}),create:api.requests.create,update:(id:number,v:any)=>api.requests.update(id,v),remove:api.requests.remove};

export default function ServiceRequests(){return <ListPage title="Service requests" description="Create and manage workshop work orders." resource={api.requests.list} hrefBase="/service-requests" columns={basicColumns(['request_id','service_status','registration_number','customer_name','mechanic_name','estimated_cost','actual_cost'])} crud={crud} createLabel="New work order"/>}
