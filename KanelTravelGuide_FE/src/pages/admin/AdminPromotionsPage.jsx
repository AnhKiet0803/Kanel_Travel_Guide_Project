import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePromotion, listPromotions, USE_DEMO_PROMOTIONS } from '../../data/adminPromotionsStore';
import '../../styles/admin/AdminPromotions.css';

const PAGE_SIZES = [5, 10, 20];
const day = value => String(value || '').slice(0, 10);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const statusOf = p => !p.IsActive ? 'Inactive' : day(p.StartDate) > today() ? 'Upcoming' : day(p.EndDate) < today() ? 'Expired' : 'Active';
const discountOf = p => p.DiscountPercent != null && p.DiscountPercent !== '' ? `${p.DiscountPercent}%` : `${Number(p.DiscountAmount || 0).toLocaleString('vi-VN')} ₫`;
const dateOf = v => { if (!v) return '—'; const [y,m,d] = day(v).split('-'); return `${d}/${m}/${y}`; };
const newestKey = p => (USE_DEMO_PROMOTIONS && p.CreatedAt) ? p.CreatedAt : day(p.StartDate);

export default function AdminPromotionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [service, setService] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  async function load() {
    try { setLoading(true); setError(''); setItems(await listPromotions()); }
    catch (e) { setError(e.message || 'Could not load promotions.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = items.filter(p => {
      const matchesText = `${p.Title || ''} ${p.PromoCode || ''}`.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || statusOf(p).toLowerCase() === status;
      const matchesService = service === 'all' || p.ServiceType === service;
      // Date range overlaps promotion validity period.
      const matchesDates = (!dateFrom || day(p.EndDate) >= dateFrom) && (!dateTo || day(p.StartDate) <= dateTo);
      return matchesText && matchesStatus && matchesDates && matchesService;
    });
    result.sort((a,b) => {
      if (sort === 'az') return (a.Title || '').localeCompare(b.Title || '');
      if (sort === 'za') return (b.Title || '').localeCompare(a.Title || '');
      const diff = newestKey(b).localeCompare(newestKey(a)) || Number(b.PromotionId) - Number(a.PromotionId);
      return sort === 'oldest' ? -diff : diff;
    });
    return result;
  }, [items, query, status, service, dateFrom, dateTo, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const counts = useMemo(() => ({ total: items.length, active: items.filter(p=>statusOf(p)==='Active').length, upcoming: items.filter(p=>statusOf(p)==='Upcoming').length, expired: items.filter(p=>statusOf(p)==='Expired').length }), [items]);
  const reset = () => { setQuery(''); setStatus('all'); setService('all'); setDateFrom(''); setDateTo(''); setSort('newest'); setPage(1); };
  async function remove(p) {
    if (!window.confirm(`Delete promotion "${p.Title}" (${p.PromoCode})?`)) return;
    try { await deletePromotion(p.PromotionId); await load(); }
    catch(e) { setError(e.message || 'Could not delete promotion.'); }
  }
  return <main className="ap-page ap-modern">
    <header className="ap-head"><div><span className="ap-kicker">CONTENT MANAGEMENT / OFFERS</span><h1>Promotions</h1><p>Create, organize and track your promotional campaigns.</p></div><Link className="ap-primary" to="/admin/promotions/new"><i className="bi bi-plus-lg"/> Add promotion</Link></header>
    <section className="ap-stats" aria-label="Promotion overview">
      {[['Total campaigns',counts.total,'bi-tags'],['Active now',counts.active,'bi-check-circle'],['Upcoming',counts.upcoming,'bi-calendar-event'],['Expired',counts.expired,'bi-clock-history']].map(([label,value,icon])=><div className="ap-stat" key={label}><span className="ap-stat-icon"><i className={`bi ${icon}`}/></span><div><small>{label}</small><strong>{value}</strong></div></div>)}
    </section>
    <section className="ap-panel"><div className="ap-list-heading"><div><h2>All promotions</h2><p>Filter by status or promotion validity dates.</p></div><span>{filtered.length} results</span></div>
      <div className="ap-filter-grid">
        <label className="ap-search-field"><span>Search</span><div><i className="bi bi-search"/><input type="search" placeholder="Campaign name or code" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></div></label>
        <label><span>Status</span><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="all">All statuses</option><option value="active">Active</option><option value="upcoming">Upcoming</option><option value="expired">Expired</option><option value="inactive">Inactive</option></select></label>
        <label><span>Service</span><select value={service} onChange={e=>{setService(e.target.value);setPage(1);}}><option value="all">All services</option><option value="tour">Tour Packages</option><option value="transport">Transport</option></select></label>
        <label><span>From date</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={e=>{setDateFrom(e.target.value);setPage(1);}}/></label>
        <label><span>To date</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={e=>{setDateTo(e.target.value);setPage(1);}}/></label>
        <label><span>Sort by</span><select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label>
      </div>
      <div className="ap-filter-note"><span><i className="bi bi-info-circle"/> Date range shows promotions whose active period overlaps the selected dates.</span><button type="button" onClick={reset}><i className="bi bi-arrow-counterclockwise"/> Reset filters</button></div>
      {error && <p className="ap-error" role="alert">{error}</p>}
      {loading ? <p className="ap-empty">Loading promotions...</p> : !visible.length ? <div className="ap-empty"><i className="bi bi-search"/><h3>No promotions found</h3><p>Try another keyword or date range.</p><button className="ap-secondary" onClick={reset}>Clear filters</button></div> : <div className="ap-table-wrap"><table className="ap-table"><thead><tr><th>Campaign</th><th>Service</th><th>Discount</th><th>Validity period</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(p=><tr key={p.PromotionId}><td><div className="ap-campaign"><span className="ap-campaign-icon"><i className="bi bi-ticket-perforated"/></span><div><Link to={`/admin/promotions/${p.PromotionId}`}>{p.Title}</Link><code>{p.PromoCode || 'No code'}</code></div></div></td><td><span className="ap-service-badge">{p.ServiceType==='transport'?'Transport':'Tour'}</span></td><td><strong className="ap-discount-cell">{discountOf(p)}</strong></td><td><span className="ap-date-range">{dateOf(p.StartDate)} <i className="bi bi-arrow-right"/> {dateOf(p.EndDate)}</span></td><td><span className={`ap-status ap-${statusOf(p).toLowerCase()}`}>{statusOf(p)}</span></td><td><div className="ap-actions"><Link to={`/admin/promotions/${p.PromotionId}`}>View</Link><Link to={`/admin/promotions/${p.PromotionId}/edit`}>Edit</Link><button type="button" onClick={()=>remove(p)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      <footer className="ap-footer"><span>{filtered.length ? `Showing ${(current-1)*pageSize+1}–${Math.min(current*pageSize,filtered.length)} of ${filtered.length}` : '0 promotions'}</span><div className="ap-page-controls"><label>Rows per page <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}>{PAGE_SIZES.map(n=><option key={n} value={n}>{n}</option>)}</select></label><button disabled={current===1} onClick={()=>setPage(1)} aria-label="First page">«</button><button disabled={current===1} onClick={()=>setPage(current-1)} aria-label="Previous page">‹</button><span>Page {current} of {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)} aria-label="Next page">›</button><button disabled={current===pages} onClick={()=>setPage(pages)} aria-label="Last page">»</button></div></footer>
    </section>
  </main>;
}
