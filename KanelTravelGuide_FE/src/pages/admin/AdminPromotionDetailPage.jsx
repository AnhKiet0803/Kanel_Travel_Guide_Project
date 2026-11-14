import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPromotion, listPromotionTours, listPromotionSchedules, USE_DEMO_PROMOTIONS } from '../../data/adminPromotionsStore';
import '../../styles/admin/AdminPromotions.css';

const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const statusOf = p => !p.IsActive ? 'Inactive' : p.StartDate > today() ? 'Upcoming' : p.EndDate < today() ? 'Expired' : 'Active';
const dateOf = v => { if(!v) return '—'; const [y,m,d] = String(v).slice(0,10).split('-'); return `${d}/${m}/${y}`; };
export default function AdminPromotionDetailPage() {
  const { id } = useParams();
  const [item,setItem] = useState(null);
  const [tours,setTours] = useState([]);
  const [schedules,setSchedules] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(()=>{ let alive=true; setLoading(true); Promise.all([getPromotion(id),listPromotionTours(),USE_DEMO_PROMOTIONS?listPromotionSchedules():[]]).then(([p,t,sc])=>{if(alive){setItem(p);setTours(t);setSchedules(sc);}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);}); return ()=>{alive=false;}; },[id]);
  if (loading) return <main className="ap-page"><p>Loading promotion...</p></main>;
  if (error) return <main className="ap-page"><p className="ap-error">{error}</p><Link to="/admin/promotions">Back to promotions</Link></main>;
  if (!item) return <main className="ap-page"><div className="ap-empty">Promotion not found. <Link to="/admin/promotions">Back to promotions</Link></div></main>;
  const status=statusOf(item);
  const percent=item.DiscountPercent!=null && item.DiscountPercent!=='';
  const discount=percent?`${item.DiscountPercent}%`:`${Number(item.DiscountAmount||0).toLocaleString('vi-VN')} ₫`;
  const isTransport=item.ServiceType==='transport';
  const assigned=isTransport?(item.ScheduleIds||[]).map(sid=>({id:sid,name:(()=>{const sc=schedules.find(s=>Number(s.ScheduleId)===Number(sid));return sc?`${sc.RouteName} · ${sc.VehicleName} · ${sc.DepartureTime}`:`Schedule #${sid}`;})()})):(item.TourIds||[]).map(tid=>({id:tid,name:tours.find(t=>Number(t.TourId)===Number(tid))?.TourName||`Tour #${tid}`}));
  return <main className="ap-page ap-modern ap-detail-modern">
    <header className="ap-head"><div><Link className="ap-back" to="/admin/promotions"><i className="bi bi-arrow-left"/> Back to promotions</Link><h1>Promotion details</h1><p>Campaign information and applicable services.</p></div><Link className="ap-primary" to={`/admin/promotions/${id}/edit`}><i className="bi bi-pencil-square"/> Edit promotion</Link></header>
    <section className="ap-detail-hero"><div className="ap-detail-hero-main"><div className="ap-detail-symbol"><i className="bi bi-ticket-perforated"/></div><div><span className="ap-kicker">PROMOTIONAL CAMPAIGN</span><h2>{item.Title}</h2><div className="ap-detail-hero-meta"><code>{item.PromoCode || 'No promo code'}</code><span className={`ap-status ap-${status.toLowerCase()}`}>{status}</span></div></div></div><div className="ap-detail-discount"><small>DISCOUNT VALUE</small><strong>{discount}</strong><span>{percent?'Percentage discount':'Fixed amount discount'}</span></div></section>
    <div className="ap-detail-grid"><section className="ap-panel ap-info-card"><div className="ap-section-title"><span><i className="bi bi-calendar-range"/></span><div><h3>Campaign schedule</h3><p>Validity and availability</p></div></div><div className="ap-date-cards"><div><small>Start date</small><strong>{dateOf(item.StartDate)}</strong></div><i className="bi bi-arrow-right"/><div><small>End date</small><strong>{dateOf(item.EndDate)}</strong></div></div><div className="ap-info-row"><span>Enabled</span><strong>{item.IsActive?'Yes':'No'}</strong></div><div className="ap-info-row"><span>Current status</span><span className={`ap-status ap-${status.toLowerCase()}`}>{status}</span></div></section>
      <section className="ap-panel ap-info-card"><div className="ap-section-title"><span><i className="bi bi-map"/></span><div><h3>{isTransport?'Applicable transport schedules':'Applicable tours'}</h3><p>{assigned.length} linked {isTransport?'schedule(s)':'tour(s)'}</p></div></div>{assigned.length?<div className="ap-linked-tours">{assigned.map(t=><div key={t.id}><i className="bi bi-check-circle"/><span>{t.name}</span><small>#{t.id}</small></div>)}</div>:<div className="ap-no-tours">No {isTransport?'transport schedules':'tours'} have been assigned to this promotion.</div>}</section></div>
    <p className="ap-detail-footnote">Promotions apply only to linked services and valid dates. Transport promotion checkout requires backend integration.</p>
  </main>;
}
