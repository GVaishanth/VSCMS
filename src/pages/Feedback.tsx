import { api } from '../services/api';
import { ListPage,basicColumns } from './_shared';

const crud={entity:'feedback',idKey:'feedback_id',createFields:[
  {key:'requestId',label:'Completed service request awaiting feedback',type:'select',source:'awaitingFeedback',deriveTo:'customerId',required:true},
  {key:'rating',label:'Rating (1–5)',type:'number',min:1,max:5,required:true},
  {key:'comments',label:'Comments',type:'textarea'},
  {key:'feedbackDate',label:'Feedback date',type:'date',required:true},
],editFields:[
  {key:'rating',label:'Rating (1–5)',type:'number',min:1,max:5,required:true},
  {key:'comments',label:'Comments',type:'textarea'},
  {key:'feedbackDate',label:'Feedback date',type:'date',required:true},
],fromRow:(r:any)=>({rating:r.rating,comments:r.comments??'',feedbackDate:String(r.feedback_date??'').slice(0,10)}),toApi:(v:any)=>({...v,requestId:v.requestId?Number(v.requestId):undefined,customerId:v.customerId?Number(v.customerId):undefined,rating:Number(v.rating)}),create:api.feedback.create,update:(id:number,v:any)=>api.feedback.update(id,v),remove:api.feedback.remove};

export default function Feedback(){return <ListPage title="Feedback" description="Submit service ratings and monitor customer feedback." resource={api.feedback.list} hrefBase="/feedback" columns={basicColumns(['feedback_id','rating','customer_name','mechanic_name','registration_number','feedback_date','comments'])} crud={crud} createLabel="Add feedback"/>}
