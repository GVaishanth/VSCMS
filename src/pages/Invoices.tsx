import { api } from '../services/api';
import { ListPage,basicColumns } from './_shared';

const crud={entity:'invoice',idKey:'invoice_id',createFields:[
  {key:'requestId',label:'Service request without an invoice',type:'select',source:'ungeneratedInvoices',required:true},
  {key:'laborAmount',label:'Labour amount',type:'number',min:0,required:true,hint:'Parts and invoice totals are calculated locally from work-order records.'},
  {key:'taxAmount',label:'Tax amount',type:'number',min:0,required:true},
  {key:'discountAmount',label:'Discount amount',type:'number',min:0,required:true},
],editFields:[
  {key:'laborAmount',label:'Labour amount',type:'number',min:0,required:true},
  {key:'taxAmount',label:'Tax amount',type:'number',min:0,required:true},
  {key:'discountAmount',label:'Discount amount',type:'number',min:0,required:true},
  {key:'paymentStatus',label:'Payment status',type:'select',required:true,options:[{value:'PENDING',label:'Pending'},{value:'PARTIAL',label:'Partial'},{value:'PAID',label:'Paid'}]},
],fromRow:(r:any)=>({requestId:r.request_id,laborAmount:r.labor_amount,taxAmount:r.tax_amount,discountAmount:r.discount_amount,paymentStatus:r.payment_status}),toApi:(v:any)=>({...v,requestId:v.requestId?Number(v.requestId):undefined,laborAmount:Number(v.laborAmount||0),taxAmount:Number(v.taxAmount||0),discountAmount:Number(v.discountAmount||0)}),create:api.invoices.generate,update:(id:number,v:any)=>api.invoices.update(id,v),remove:api.invoices.remove};

export default function Invoices(){return <ListPage title="Invoices" description="Generate and maintain invoices; parts and totals are calculated from locally stored records." resource={api.invoices.list} hrefBase="/invoices" columns={basicColumns(['invoice_id','request_id','customer_name','invoice_date','labor_amount','parts_amount','total_amount','payment_status'])} crud={crud} createLabel="Generate invoice"/>}
