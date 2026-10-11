import { api } from '../services/api';
import { ListPage,basicColumns } from './_shared';

const crud={entity:'service line',idKey:'service_id',createFields:[
  {key:'requestId',label:'Service request',type:'select',source:'serviceRequests',required:true},
  {key:'serviceName',label:'Service performed',required:true},
  {key:'description',label:'Description',type:'textarea'},
  {key:'laborCharge',label:'Labour charge',type:'number',min:0},
  {key:'estimatedDuration',label:'Estimated duration (minutes)',type:'number',min:0},
  {key:'remarks',label:'Remarks'},
],editFields:[
  {key:'serviceName',label:'Service performed',required:true},
  {key:'description',label:'Description',type:'textarea'},
  {key:'laborCharge',label:'Labour charge',type:'number',min:0},
  {key:'estimatedDuration',label:'Estimated duration (minutes)',type:'number',min:0},
  {key:'remarks',label:'Remarks'},
],fromRow:(r:any)=>({requestId:r.request_id,serviceName:r.service_name,description:r.description??'',laborCharge:r.labor_charge,estimatedDuration:r.estimated_duration??'',remarks:r.remarks??''}),toApi:(v:any)=>({...v,requestId:v.requestId?Number(v.requestId):undefined,laborCharge:v.laborCharge===''?undefined:Number(v.laborCharge),estimatedDuration:v.estimatedDuration===''?undefined:Number(v.estimatedDuration)}),create:api.services.create,update:(id:number,v:any)=>api.services.update(id,v),remove:api.services.remove};

export default function Services(){return <ListPage title="Services" description="Record labour lines against service requests; invoice totals are calculated locally." resource={api.services.list} hrefBase="/services" columns={basicColumns(['service_id','service_name','request_id','registration_number','customer_name','labor_charge','estimated_duration'])} crud={crud} createLabel="Add service line"/>}
