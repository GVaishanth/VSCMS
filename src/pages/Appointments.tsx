import { api } from '../services/api';
import { ListPage,basicColumns } from './_shared';

const crud={entity:'appointment',idKey:'appointment_id',createFields:[
  {key:'vehicleId',label:'Vehicle',type:'select',source:'vehicles',required:true},
  {key:'appointmentDate',label:'Appointment date',type:'date',required:true},
  {key:'appointmentTime',label:'Appointment time',type:'time',required:true},
  {key:'serviceType',label:'Service type',required:true,hint:'For example: General Service, Oil Change, Brake Repair or AC Service.'},
  {key:'bookingMode',label:'Booking mode',type:'select',required:true,options:[{value:'ONLINE',label:'Online'},{value:'PHONE',label:'Phone'},{value:'WALK_IN',label:'Walk-in'}]},
],editFields:[
  {key:'vehicleId',label:'Vehicle',type:'select',source:'vehicles',required:true},
  {key:'appointmentDate',label:'Appointment date',type:'date',required:true},
  {key:'appointmentTime',label:'Appointment time',type:'time',required:true},
  {key:'serviceType',label:'Service type',required:true},
  {key:'bookingMode',label:'Booking mode',type:'select',required:true,options:[{value:'ONLINE',label:'Online'},{value:'PHONE',label:'Phone'},{value:'WALK_IN',label:'Walk-in'}]},
  {key:'status',label:'Status',type:'select',required:true,options:[{value:'BOOKED',label:'Booked'},{value:'CONFIRMED',label:'Confirmed'},{value:'COMPLETED',label:'Completed'},{value:'CANCELLED',label:'Cancelled'}]},
],fromRow:(r:any)=>({vehicleId:r.vehicle_id,appointmentDate:String(r.appointment_date??'').slice(0,10),appointmentTime:String(r.appointment_time??'').slice(0,5),serviceType:r.service_type,bookingMode:r.booking_mode,status:r.status}),toApi:(v:any)=>({...v,vehicleId:Number(v.vehicleId)}),create:api.appointments.create,update:(id:number,v:any)=>api.appointments.update(id,v),remove:api.appointments.remove};

export default function Appointments(){return <ListPage title="Appointments" description="Schedule and monitor vehicle visits." resource={api.appointments.list} hrefBase="/appointments" columns={basicColumns(['appointment_id','appointment_date','appointment_time','registration_number','customer_name','service_type','status'])} crud={crud} createLabel="New appointment"/>}
