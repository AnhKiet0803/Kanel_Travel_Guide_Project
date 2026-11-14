import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPromotion, listPromotionTours, listPromotionSchedules, savePromotion, USE_DEMO_PROMOTIONS } from '../../data/adminPromotionsStore';
import '../../styles/admin/AdminPromotions.css';

const blank = { PromoCode:'',Title:'',DiscountType:'percent',DiscountValue:'',StartDate:'',EndDate:'',IsActive:true,ServiceType:'tour',TourIds:[],ScheduleIds:[] };
export default function AdminPromotionFormPage(){
  const {id}=useParams();const editing=Boolean(id);const navigate=useNavigate();
  const [form,setForm]=useState(blank);const [tours,setTours]=useState([]);const [schedules,setSchedules]=useState([]);
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  useEffect(()=>{let alive=true;(async()=>{try{
    const [tourList,existing,scheduleList]=await Promise.all([listPromotionTours(),editing?getPromotion(id):null,USE_DEMO_PROMOTIONS?listPromotionSchedules():[]]);
    if(!alive)return;setTours(tourList);setSchedules(scheduleList);
    if(editing){if(!existing)throw new Error('Promotion not found.');setForm({...existing,DiscountType:existing.DiscountPercent!=null?'percent':'amount',DiscountValue:String(existing.DiscountPercent??existing.DiscountAmount??''),TourIds:(existing.TourIds||[]).map(Number),ScheduleIds:(existing.ScheduleIds||[]).map(Number)});}
  }catch(e){if(alive)setError(e.message||'Failed to load promotion.');}finally{if(alive)setLoading(false);}})();return()=>{alive=false;};},[id,editing]);
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));
  const toggle=(key,value,checked)=>setForm(f=>({...f,[key]:checked?[...new Set([...f[key],value])]:f[key].filter(x=>x!==value)}));
  const submit=async e=>{e.preventDefault();setError('');const value=Number(form.DiscountValue);
    if(!form.PromoCode.trim()||!form.Title.trim())return setError('Code and campaign name are required.');
    if(!/^[A-Z0-9_-]+$/.test(form.PromoCode.trim().toUpperCase()))return setError('Code may contain only letters, numbers, underscore and hyphen.');
    if(!Number.isFinite(value)||value<=0||(form.DiscountType==='percent'&&value>100))return setError('Enter a valid discount (percentage must be 1–100).');
    if(!form.StartDate||!form.EndDate||form.EndDate<form.StartDate)return setError('End date must be on or after start date.');
    if(form.ServiceType==='tour'&&!form.TourIds.length)return setError('Select at least one tour.');
    if(form.ServiceType==='transport'&&!form.ScheduleIds.length)return setError('Select at least one transport schedule.');
    const payload={PromoCode:form.PromoCode.trim().toUpperCase(),Title:form.Title.trim(),DiscountPercent:form.DiscountType==='percent'?value:null,DiscountAmount:form.DiscountType==='amount'?value:null,StartDate:form.StartDate,EndDate:form.EndDate,IsActive:form.IsActive,ServiceType:form.ServiceType,TourIds:form.ServiceType==='tour'?form.TourIds:[],ScheduleIds:form.ServiceType==='transport'?form.ScheduleIds:[]};
    try{setSaving(true);await savePromotion(payload,editing?id:null);navigate('/admin/promotions');}catch(err){setError(err.message||'Could not save promotion.');}finally{setSaving(false);}
  };
  return <main className="ap-page ap-modern"><div className="ap-head"><div><Link className="ap-back" to="/admin/promotions">← Back to promotions</Link><h1>{editing?'Edit promotion':'Add promotion'}</h1><p>Set up a campaign for tour packages or transport schedules.</p></div></div>
    {loading?<p>Loading...</p>:<form className="ap-panel ap-form" onSubmit={submit}>
      <div className="ap-service-select"><span className="ap-service-label">Applicable service *</span><div className="ap-service-options"><label className={form.ServiceType==='tour'?'selected':''}><input type="radio" name="serviceType" value="tour" checked={form.ServiceType==='tour'} onChange={()=>set('ServiceType','tour')}/><i className="bi bi-compass"/> Tour Packages</label><label className={form.ServiceType==='transport'?'selected':''}><input type="radio" name="serviceType" value="transport" checked={form.ServiceType==='transport'} onChange={()=>set('ServiceType','transport')}/><i className="bi bi-bus-front"/> Transport / Bus Tickets</label></div></div>
      <div className="ap-form-grid"><label>Promotion code *<input required value={form.PromoCode} onChange={e=>set('PromoCode',e.target.value.toUpperCase())} placeholder="SUMMER20"/></label><label>Campaign name *<input required value={form.Title} onChange={e=>set('Title',e.target.value)} placeholder="Summer travel offer"/></label><label>Discount type<select value={form.DiscountType} onChange={e=>setForm(f=>({...f,DiscountType:e.target.value,DiscountValue:''}))}><option value="percent">Percentage (%)</option><option value="amount">Fixed amount (VND)</option></select></label><label>Discount value *<input type="number" min="0.01" max={form.DiscountType==='percent'?'100':undefined} step="any" required value={form.DiscountValue} onChange={e=>set('DiscountValue',e.target.value)}/></label><label>Start date *<input type="date" required value={form.StartDate} onChange={e=>set('StartDate',e.target.value)}/></label><label>End date *<input type="date" required min={form.StartDate||undefined} value={form.EndDate} onChange={e=>set('EndDate',e.target.value)}/></label></div>
      <label className="ap-check"><input type="checkbox" checked={form.IsActive} onChange={e=>set('IsActive',e.target.checked)}/> Enable promotion</label>
      {form.ServiceType==='tour'?<fieldset className="ap-tours"><legend>Applicable tours</legend><p>Select one or more tour packages.</p>{tours.length?tours.map(t=><label className="ap-check" key={t.TourId}><input type="checkbox" checked={form.TourIds.includes(Number(t.TourId))} onChange={e=>toggle('TourIds',Number(t.TourId),e.target.checked)}/>{t.TourName}</label>):<p>No tours available yet.</p>}</fieldset>:<fieldset className="ap-tours"><legend>Applicable transport schedules</legend><p>Demo schedules only. Actual transport promotions require a backend API.</p>{schedules.length?schedules.map(s=><label className="ap-check" key={s.ScheduleId}><input type="checkbox" checked={form.ScheduleIds.includes(Number(s.ScheduleId))} onChange={e=>toggle('ScheduleIds',Number(s.ScheduleId),e.target.checked)}/><span>{s.RouteName} · {s.VehicleName} · {s.DepartureTime} · {Number(s.TicketPrice).toLocaleString('vi-VN')} ₫</span></label>):<p>Transport schedules are not available in API mode.</p>}</fieldset>}
      {error&&<p className="ap-error" role="alert">{error}</p>}<div className="ap-form-actions"><Link className="ap-secondary" to="/admin/promotions">Cancel</Link><button className="ap-primary" type="submit" disabled={saving}>{saving?'Saving...':editing?'Save changes':'Create promotion'}</button></div>
    </form>}
  </main>;
}
