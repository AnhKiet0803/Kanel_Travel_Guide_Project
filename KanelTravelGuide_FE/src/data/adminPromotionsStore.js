// Demo-first FE adapter. API mode requires a matching backend contract.
export const USE_DEMO_PROMOTIONS = import.meta.env.VITE_USE_DEMO_PROMOTIONS !== 'false';
const KEY = 'karnel-admin-promotions-demo';
const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011/api').replace(/\/$/, '');
const seed = [
  { PromotionId:1, PromoCode:'KARNEL20', Title:'Ha Long Bay Discovery – Save 20%', DiscountPercent:20, DiscountAmount:null, StartDate:'2026-01-01', EndDate:'2027-12-31', IsActive:true, ServiceType:'tour', TourIds:[101], ScheduleIds:[], CreatedAt:'2026-10-20T09:00:00' },
  { PromotionId:2, PromoCode:'HOIAN300', Title:'Hoi An Heritage Escape', DiscountPercent:null, DiscountAmount:300000, StartDate:'2026-01-01', EndDate:'2027-12-31', IsActive:true, ServiceType:'tour', TourIds:[102], ScheduleIds:[], CreatedAt:'2026-10-21T09:00:00' },
  { PromotionId:3, PromoCode:'BALI15', Title:'Bali Island Getaway', DiscountPercent:15, DiscountAmount:null, StartDate:'2026-01-01', EndDate:'2027-12-31', IsActive:true, ServiceType:'tour', TourIds:[103], ScheduleIds:[], CreatedAt:'2026-10-22T09:00:00' }
];
export const demoTours = [
  {TourId:101,TourName:'Ha Long Bay Cruise Experience',StandardPrice:1800000,Location:'Ha Long Bay, Vietnam',Duration:'1 day'},
  {TourId:102,TourName:'Hoi An Ancient Town Walk',StandardPrice:1200000,Location:'Hoi An, Vietnam',Duration:'1 day'},
  {TourId:103,TourName:'Bali Culture & Nature',StandardPrice:4200000,Location:'Bali, Indonesia',Duration:'3 days'}
];
// Illustrative FE catalog; these IDs are NOT asserted to exist in the backend.
export const demoSchedules = [
  {ScheduleId:201,RouteId:1,RouteName:'Ha Noi → Ha Long',VehicleName:'Karnel Express Bus',TicketPrice:300000,DepartureTime:'08:00',Type:'Bus'},
  {ScheduleId:202,RouteId:2,RouteName:'Da Nang → Hoi An',VehicleName:'Karnel Shuttle',TicketPrice:180000,DepartureTime:'09:30',Type:'Bus'},
  {ScheduleId:203,RouteId:3,RouteName:'Ha Noi → Ninh Binh',VehicleName:'Karnel Minibus',TicketPrice:250000,DepartureTime:'07:00',Type:'Bus'}
];
const array = v => Array.isArray(v) ? v : [];
const normalize = p => {
  const tours = p.TourIds ?? p.tourIds ?? (p.TourPackages ?? p.tourPackages ?? []).map(t=>t.TourId??t.tourId);
  const schedules = p.ScheduleIds ?? p.scheduleIds ?? (p.Schedules ?? p.schedules ?? []).map(s=>s.ScheduleId??s.scheduleId);
  const tourIds = array(tours).map(Number).filter(Number.isFinite);
  const scheduleIds = array(schedules).map(Number).filter(Number.isFinite);
  const serviceType = p.ServiceType ?? p.serviceType ?? (scheduleIds.length && !tourIds.length ? 'transport' : 'tour');
  return {
    PromotionId:Number(p.PromotionId??p.promotionId), PromoCode:p.PromoCode??p.promoCode??'', Title:p.Title??p.title??'',
    DiscountPercent:p.DiscountPercent??p.discountPercent??null, DiscountAmount:p.DiscountAmount??p.discountAmount??null,
    StartDate:String(p.StartDate??p.startDate??'').slice(0,10), EndDate:String(p.EndDate??p.endDate??'').slice(0,10),
    IsActive:Boolean(p.IsActive??p.isActive), ServiceType:serviceType, TourIds:tourIds, ScheduleIds:scheduleIds,
    CreatedAt:p.CreatedAt??p.createdAt??''
  };
};
const read = () => {try {const raw=localStorage.getItem(KEY); const value=raw===null?seed:JSON.parse(raw); return Array.isArray(value)?value:seed;}catch{return seed;}};
const write = items => {localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new Event('karnel-promotions-changed'));};
async function request(path,options={}) {
  const token=localStorage.getItem('token');
  const res=await fetch(`${API}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers}});
  if(!res.ok)throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.status===204?null:res.json();
}
const extract = data => Array.isArray(data)?data:(data?.items??data?.data??[]);
export async function listPromotions(){return USE_DEMO_PROMOTIONS?read().map(normalize):extract(await request('/promotions')).map(normalize);}
export async function getPromotion(id){if(USE_DEMO_PROMOTIONS)return read().map(normalize).find(p=>p.PromotionId===Number(id))??null;const data=await request(`/promotions/${id}`);return data?normalize(data):null;}
export async function savePromotion(payload,id=null){
  if(!USE_DEMO_PROMOTIONS){
    if(payload.ServiceType==='transport')throw new Error('Transport promotions require a backend API contract. Switch to demo mode to preview.');
    const {ServiceType,ScheduleIds,CreatedAt,...apiPayload}=payload;
    return request(id?`/admin/promotions/${id}`:'/admin/promotions',{method:id?'PUT':'POST',body:JSON.stringify(apiPayload)});
  }
  const items=read().map(normalize);const nextId=id?Number(id):Math.max(0,...items.map(p=>p.PromotionId))+1;
  const existing=items.find(p=>p.PromotionId===nextId);
  const entry=normalize({...payload,PromotionId:nextId,CreatedAt:existing?.CreatedAt||new Date().toISOString()});
  const index=items.findIndex(p=>p.PromotionId===nextId);if(index>=0)items[index]=entry;else items.unshift(entry);
  write(items);return entry;
}
export async function deletePromotion(id){if(!USE_DEMO_PROMOTIONS)return request(`/admin/promotions/${id}`,{method:'DELETE'});write(read().filter(p=>Number(p.PromotionId??p.promotionId)!==Number(id)));}
export async function listPromotionTours(){if(USE_DEMO_PROMOTIONS)return demoTours;const data=await request('/tour-packages');return extract(data).map(t=>({TourId:Number(t.TourId??t.tourId),TourName:t.TourName??t.tourName,StandardPrice:t.StandardPrice??t.standardPrice,Location:t.Location??t.location,Duration:t.Duration??t.duration}));}
export async function listPromotionSchedules(){if(USE_DEMO_PROMOTIONS)return demoSchedules;throw new Error('Schedule listing API has not been confirmed.');}
