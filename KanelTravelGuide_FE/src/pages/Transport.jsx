import React, { useMemo, useState } from 'react';
import '../styles/transport/Transport.css';

// Front-end only: all schedules, seats, fares, promotions and reviews are DEMO data.
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10); };
const money = n => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const minutes = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const clock = (t, duration) => { const x=(minutes(t)+duration)%1440; return `${String(Math.floor(x/60)).padStart(2,'0')}:${String(x%60).padStart(2,'0')}`; };
const durationText = n => `${Math.floor(n/60)}h ${String(n%60).padStart(2,'0')}m`;
const MODES = [{id:'bus',name:'Bus / Limousine',icon:'🚌'},{id:'flight',name:'Flights',icon:'✈'},{id:'train',name:'Trains',icon:'🚆'}];
const WINDOWS = [{id:'all',name:'All day',start:0,end:1440},{id:'early',name:'00:00 – 06:00',start:0,end:360},{id:'morning',name:'06:00 – 12:00',start:360,end:720},{id:'afternoon',name:'12:00 – 18:00',start:720,end:1080},{id:'evening',name:'18:00 – 24:00',start:1080,end:1440}];
const IMG = {
 bus:'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=700&q=85',
 limousine:'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=700&q=85',
 train:'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=700&q=85',
 flight:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=85',
 interior:'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=700&q=85',
};
const DATA = [
 {id:1,mode:'bus',from:'Hanoi',to:'Ha Long',name:'Karnel Express',sub:'Premium Coach · 45 seats',variant:'Coach',depart:'07:00',duration:150,price:220000,seats:18,rating:4.7,operator:'Karnel Express',pickup:'Hanoi Central Station',dropoff:'Ha Long City Center',amenities:['Wi-Fi','Air conditioning','USB charging'],image:IMG.bus,featured:true,promotion:{name:'LAST-MINUTE DEAL',originalPrice:275000,discountPercent:20,extraLabel:'⚡ Extra 10% off · max 50k',endsAt:'2026-11-15T23:59:59+07:00'}},
 {id:2,mode:'bus',from:'Hanoi',to:'Ha Long',name:'Premium Limousine',sub:'Luxury Limousine · 16 seats',variant:'Limousine',depart:'09:30',duration:140,price:350000,seats:6,rating:4.9,operator:'Premium Limousine',pickup:'Hanoi Old Quarter',dropoff:'Bai Chay',amenities:['Wi-Fi','Reclining seats','USB charging'],image:IMG.limousine},
 {id:3,mode:'bus',from:'Hanoi',to:'Ha Long',name:'Karnel Sleeper',sub:'Sleeper Bus · 34 seats',variant:'Sleeper bus',depart:'18:30',duration:165,price:260000,seats:9,rating:4.5,operator:'Karnel Express',pickup:'My Dinh Station',dropoff:'Bai Chay',amenities:['Air conditioning','Sleeper seats','Wi-Fi'],image:IMG.bus,promotion:{name:'LIMITED OFFER',originalPrice:325000,discountPercent:20,extraLabel:'⚡ Save 20% · max 100k'}},
 {id:4,mode:'bus',from:'Hanoi',to:'Ha Long',name:'Coastal Shuttle',sub:'Standard Coach · 40 seats',variant:'Coach',depart:'13:00',duration:175,price:190000,seats:22,rating:4.3,operator:'Coastal Shuttle',pickup:'Hanoi Central Station',dropoff:'Ha Long City Center',amenities:['Air conditioning'],image:IMG.bus},
 {id:5,mode:'bus',from:'Hanoi',to:'Ha Long',name:'Evening Limousine',sub:'VIP Limousine · 12 seats',variant:'Limousine',depart:'20:00',duration:145,price:390000,seats:0,rating:4.8,operator:'Premium Limousine',pickup:'Hanoi Old Quarter',dropoff:'Bai Chay',amenities:['Wi-Fi','Reclining seats'],image:IMG.limousine},
 {id:6,mode:'bus',from:'Da Nang',to:'Hoi An',name:'Hoi An Shuttle',sub:'Limousine · 16 seats',variant:'Limousine',depart:'10:00',duration:55,price:140000,seats:8,rating:4.7,operator:'Hoi An Shuttle',pickup:'Da Nang Center',dropoff:'Hoi An Old Town',amenities:['Wi-Fi','Air conditioning'],image:IMG.limousine},
 {id:11,mode:'flight',from:'Hanoi',to:'Da Nang',name:'Vietnam Airlines',sub:'VN 167 · Economy',variant:'Economy',depart:'06:45',duration:85,price:1578000,seats:23,rating:4.7,operator:'Vietnam Airlines',pickup:'HAN · Noi Bai Airport',dropoff:'DAD · Da Nang Airport',amenities:['Cabin baggage','Checked baggage','Meal'],image:IMG.flight},
 {id:12,mode:'flight',from:'Hanoi',to:'Da Nang',name:'Vietjet Air',sub:'VJ 515 · Economy',variant:'Economy',depart:'08:15',duration:80,price:1199000,seats:14,rating:4.2,operator:'Vietjet Air',pickup:'HAN · Noi Bai Airport',dropoff:'DAD · Da Nang Airport',amenities:['Cabin baggage'],image:IMG.flight,featured:true},
 {id:13,mode:'flight',from:'Hanoi',to:'Da Nang',name:'Vietnam Airlines',sub:'VN 171 · Business',variant:'Business',depart:'13:20',duration:85,price:2980000,seats:5,rating:4.8,operator:'Vietnam Airlines',pickup:'HAN · Noi Bai Airport',dropoff:'DAD · Da Nang Airport',amenities:['Cabin baggage','Checked baggage','Meal'],image:IMG.flight},
 {id:14,mode:'flight',from:'Hanoi',to:'Da Nang',name:'Vietjet Air',sub:'VJ 523 · Economy',variant:'Economy',depart:'19:30',duration:85,price:1359000,seats:18,rating:4.3,operator:'Vietjet Air',pickup:'HAN · Noi Bai Airport',dropoff:'DAD · Da Nang Airport',amenities:['Cabin baggage'],image:IMG.flight},
 {id:15,mode:'flight',from:'Ho Chi Minh City',to:'Da Nang',name:'Vietnam Airlines',sub:'VN 120 · Economy',variant:'Economy',depart:'11:10',duration:90,price:1490000,seats:16,rating:4.6,operator:'Vietnam Airlines',pickup:'SGN · Tan Son Nhat Airport',dropoff:'DAD · Da Nang Airport',amenities:['Cabin baggage','Checked baggage'],image:IMG.flight},
 {id:21,mode:'train',from:'Hanoi',to:'Da Nang',name:'SE1 Express',sub:'Train SE1 · Vietnam Railways',variant:'Express',depart:'21:45',duration:929,price:771000,seats:54,rating:4.5,operator:'Vietnam Railways',pickup:'Hanoi Railway Station',dropoff:'Da Nang Railway Station',amenities:['Air conditioning','Sleeper berths'],image:IMG.train,classes:[{name:'Soft seat',price:771000,seats:54},{name:'6-berth sleeper',price:1093000,seats:16},{name:'4-berth sleeper',price:1399000,seats:37}],featured:true},
 {id:22,mode:'train',from:'Hanoi',to:'Da Nang',name:'SE7 Express',sub:'Train SE7 · Vietnam Railways',variant:'Standard',depart:'06:00',duration:975,price:706000,seats:32,rating:4.3,operator:'Vietnam Railways',pickup:'Hanoi Railway Station',dropoff:'Da Nang Railway Station',amenities:['Air conditioning','Sleeper berths'],image:IMG.train,classes:[{name:'Soft seat',price:706000,seats:32},{name:'6-berth sleeper',price:1056000,seats:7},{name:'4-berth sleeper',price:1364000,seats:16}]},
 {id:23,mode:'train',from:'Hanoi',to:'Da Nang',name:'SE5 Express',sub:'Train SE5 · Vietnam Railways',variant:'Standard',depart:'08:00',duration:981,price:729000,seats:24,rating:4.2,operator:'Vietnam Railways',pickup:'Hanoi Railway Station',dropoff:'Da Nang Railway Station',amenities:['Air conditioning','Sleeper berths'],image:IMG.train,classes:[{name:'Soft seat',price:729000,seats:24},{name:'6-berth sleeper',price:1065000,seats:8},{name:'4-berth sleeper',price:1319000,seats:18}]},
 {id:24,mode:'train',from:'Hanoi',to:'Da Nang',name:'SE3 Express',sub:'Train SE3 · Vietnam Railways',variant:'Express',depart:'19:20',duration:948,price:819000,seats:12,rating:4.6,operator:'Vietnam Railways',pickup:'Hanoi Railway Station',dropoff:'Da Nang Railway Station',amenities:['Air conditioning','Sleeper berths'],image:IMG.train,classes:[{name:'Soft seat',price:819000,seats:12},{name:'4-berth sleeper',price:1435000,seats:1}]},
];
const CONFIG = {
 bus:{from:'Hanoi',to:'Ha Long',headline:'Comfortable road journeys',subtitle:'Compare coaches, sleeper buses and premium limousines.',sort:['Recommended','Lowest price','Highest price','Earliest departure','Latest departure','Shortest duration','Top rated'],filterLabel:'Vehicle type',filters:['Coach','Limousine','Sleeper bus']},
 flight:{from:'Hanoi',to:'Da Nang',headline:'Flights made simple',subtitle:'Explore airlines, flight times and fares in one place.',sort:['Recommended','Lowest price','Highest price','Earliest departure','Latest departure','Shortest duration','Top rated'],filterLabel:'Cabin class',filters:['Economy','Business']},
 train:{from:'Hanoi',to:'Da Nang',headline:'Scenic journeys by rail',subtitle:'Compare trains, seat classes and sleeper berths.',sort:['Recommended','Lowest price','Highest price','Earliest departure','Latest departure','Shortest duration','Top rated'],filterLabel:'Train type',filters:['Express','Standard']},
};
const detailTabs = ['Offers','Pick-up / Drop-off','Reviews','Policy','Photos','Amenities'];

// Demo passenger selector. Age limits and infant seat rules may differ by operator.
const DEFAULT_PASSENGERS = { adults: 1, children: 0, infants: 0 };
const passengerCount = p => p.adults + p.children + p.infants;
const seatCount = p => p.adults + p.children; // Infants assumed to travel without a separate seat in this demo.
const passengerLabel = p => `${passengerCount(p)} passenger${passengerCount(p) === 1 ? '' : 's'}`;

function PassengerPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const rows = [
    { key: 'adults', title: 'Adults', subtitle: '12 years and above' },
    { key: 'children', title: 'Children', subtitle: '2–11 years' },
    { key: 'infants', title: 'Infants', subtitle: 'Under 2 years' },
  ];
  const change = (key, delta) => {
    const next = { ...value, [key]: value[key] + delta };
    if (next.adults < 1 || next.children < 0 || next.infants < 0 ||
        next.infants > next.adults || passengerCount(next) > 9) return;
    onChange(next);
  };
  return <div className="ktr-passengers" onKeyDown={e => { if (e.key === 'Escape') setIsOpen(false); }}>
    <button type="button" className="ktr-passenger-trigger" aria-expanded={isOpen}
      aria-controls="ktr-passenger-panel" onClick={() => setIsOpen(v => !v)}>
      <span><small>Passengers</small><strong>{passengerLabel(value)}</strong></span>
      <span aria-hidden="true">{isOpen ? '⌃' : '⌄'}</span>
    </button>
    {isOpen && <div className="ktr-passenger-panel" id="ktr-passenger-panel">
      {rows.map(row => <div className="ktr-passenger-row" key={row.key}>
        <div className="ktr-passenger-description"><strong>{row.title}</strong><small>{row.subtitle}</small></div>
        <div className="ktr-passenger-counter">
          <button type="button" aria-label={`Remove ${row.title.toLowerCase()}`} disabled={value[row.key] <= (row.key === 'adults' ? Math.max(1, value.infants) : 0)} onClick={() => change(row.key, -1)}>−</button>
          <output aria-label={`${row.title} count`}>{value[row.key]}</output>
          <button type="button" aria-label={`Add ${row.title.toLowerCase()}`} disabled={passengerCount(value) >= 9 || (row.key === 'infants' && value.infants >= value.adults)} onClick={() => change(row.key, 1)}>+</button>
        </div>
      </div>)}
      <p className="ktr-passenger-note">Demo: maximum 9 passengers, at least 1 adult and 1 adult per infant. Infants do not occupy a separate seat in this demo. Actual rules and fares depend on the operator.</p>
      <button type="button" className="ktr-passenger-apply" onClick={() => setIsOpen(false)}>Apply · {passengerLabel(value)}</button>
    </div>}
  </div>;
}

function FilterCheck({label,checked,onChange}) { return <label className="ktr-check"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>; }
function Details({trip,tab,setTab,onClose}) {
 return <div className="ktr-details"><div className="ktr-detail-tabs" role="tablist" aria-label="Trip details">{detailTabs.map(t=><button role="tab" aria-selected={tab===t} className={tab===t?'active':''} key={t} onClick={()=>setTab(t)}>{t}</button>)}<button className="ktr-close" aria-label="Close details" onClick={onClose}>×</button></div><div className="ktr-detail-body">
 {tab==='Offers'&&(trip.promotion
 ? <div className="ktr-offers"><div className="ktr-offer"><span>🎟</span><div><strong>{trip.promotion.name}</strong><small>Original {money(trip.promotion.originalPrice)} → {money(trip.price)} · -{trip.promotion.discountPercent}%</small><p>Sample promotional fare. {trip.promotion.extraLabel} is an additional illustrative offer, not automatically deducted.</p></div></div></div>
 : <div className="ktr-info"><h4>No promotions available for this trip</h4><p>This departure currently shows its standard demo fare.</p></div>)}
 {tab==='Pick-up / Drop-off'&&<div className="ktr-stops"><div><b>{trip.depart} · {trip.pickup}</b><small>Departure point (demo)</small></div><div><b>{clock(trip.depart,trip.duration)} · {trip.dropoff}</b><small>Arrival point (demo){minutes(trip.depart)+trip.duration>=1440?' · Next day':''}</small></div></div>}
 {tab==='Reviews'&&<div className="ktr-info"><h4>★ {trip.rating.toFixed(1)} / 5</h4><p>Illustrative rating. Verified traveler reviews will appear when review data is available.</p></div>}
 {tab==='Policy'&&<div className="ktr-info"><h4>Booking and cancellation terms</h4><p>Changes, refunds and baggage or seat conditions depend on the operator. This demo does not represent a confirmed policy.</p></div>}
 {tab==='Photos'&&<div className="ktr-photos"><img src={trip.image} alt={`${trip.name} illustrative photo`}/><img src={trip.mode==='bus'?IMG.interior:trip.image} alt="Illustrative travel photo"/></div>}
 {tab==='Amenities'&&<div className="ktr-amenities">{trip.amenities.map(a=><span key={a}>✓ {a}</span>)}</div>}
 </div></div>;
}
function PromoCountdown({endsAt}) {
 const remaining = () => Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
 const [seconds,setSeconds] = useState(remaining);
 React.useEffect(() => {
   const timer = setInterval(() => setSeconds(remaining()), 1000);
   return () => clearInterval(timer);
 }, [endsAt]);
 if (!seconds) return <span>Offer ended</span>;
 const h = String(Math.floor(seconds/3600)).padStart(2,'0');
 const m = String(Math.floor(seconds%3600/60)).padStart(2,'0');
 const s = String(seconds%60).padStart(2,'0');
 return <span>Ends in <strong>{h}:{m}:{s}</strong></span>;
}
function BusTripCard({trip,expanded,onToggle,tab,setTab,onBook,requiredSeats}) {
 const promo=trip.promotion;
 const nextDay=minutes(trip.depart)+trip.duration>=1440;
 return <article className={`ktr-trip ktr-bus-card ${promo?'ktr-has-promo':'ktr-no-promo'} ${expanded?'expanded':''}`}>
   {promo&&<div className="ktr-bus-promo-strip">
     <strong>◷ {promo.name}</strong>
     <span>{promo.endsAt?<PromoCountdown endsAt={promo.endsAt}/>: 'Special promotional fare'}</span>
   </div>}
   <div className="ktr-bus-layout">
     <div className="ktr-bus-photo"><img src={trip.image} alt={`${trip.name} demo bus`} loading="lazy"/></div>
     <div className="ktr-bus-main">
       <div className="ktr-bus-heading"><h3>{trip.name}</h3><span className="ktr-bus-rating">★ {trip.rating.toFixed(1)}</span></div>
       <p className="ktr-bus-type">{trip.sub}</p>
       <div className="ktr-bus-stops">
         <div><span className="ktr-stop-icon">◉</span><strong>{trip.depart}</strong><span className="ktr-stop-label"> · {trip.pickup}</span></div>
         <div className="ktr-bus-duration">{durationText(trip.duration)}</div>
         <div><span className="ktr-stop-icon">♦</span><strong>{clock(trip.depart,trip.duration)}</strong><span className="ktr-stop-label"> · {trip.dropoff}</span>{nextDay&&<small> (+1 day)</small>}</div>
       </div>
     </div>
     <div className="ktr-bus-right">
       {promo&&<span className="ktr-promo-caption">♨ {promo.name}</span>}
       <strong className={`ktr-bus-price ${promo?'discounted':''}`}>{money(trip.price)}</strong>
       {promo&&<div className="ktr-bus-original"><s>{money(promo.originalPrice)}</s><b>-{promo.discountPercent}%</b></div>}
       {promo?.extraLabel&&<span className="ktr-bus-extra">{promo.extraLabel}</span>}
       <span className="ktr-bus-seats">{trip.seats?`${trip.seats} seats available`:'Sold out'} <small>· demo</small></span>
       <div className="ktr-bus-actions">
         <button type="button" className="ktr-bus-detail-button" aria-expanded={expanded} onClick={onToggle}>{expanded?'Hide details ▴':'View details ▾'}</button>
         <button type="button" className="ktr-bus-book-button" disabled={trip.seats<requiredSeats} onClick={()=>onBook(trip)}>{trip.seats>=requiredSeats?'Choose seat':'Not enough seats'}</button>
       </div>
     </div>
   </div>
   <div className="ktr-bus-bottom">
     <span>✓ INSTANT CONFIRMATION{trip.variant==='Limousine'?' · PREMIUM SERVICE':''}</span>
     <strong>NO UPFRONT PAYMENT <small>(DEMO)</small></strong>
   </div>
   {expanded&&<Details trip={trip} tab={tab} setTab={setTab} onClose={onToggle}/>}
 </article>;
}
function TripCard({trip,expanded,onToggle,tab,setTab,onBook,requiredSeats}) {
 if (trip.mode==='bus') return <BusTripCard trip={trip} expanded={expanded} onToggle={onToggle} tab={tab} setTab={setTab} onBook={onBook} requiredSeats={requiredSeats}/>;
 const nextDay=minutes(trip.depart)+trip.duration>=1440;
 return <article className={`ktr-trip ${trip.mode} ${expanded?'expanded':''}`}>
 {trip.featured&&<div className="ktr-featured">✦ RECOMMENDED OPTION <span>Popular demo choice</span></div>}
 <div className="ktr-trip-content"><div className="ktr-trip-photo"><img src={trip.image} alt={`${trip.name} illustrative transport`} loading="lazy"/><span>{trip.mode==='flight'?'FLIGHT':'TRAIN'}</span></div>
 <div className="ktr-trip-center"><div className="ktr-trip-title"><h3>{trip.name}</h3><span className="ktr-rating">★ {trip.rating.toFixed(1)}</span></div><p className="ktr-sub">{trip.sub}</p><div className="ktr-timeline"><div><strong>{trip.depart}</strong><small>{trip.mode==='flight'?trip.pickup:trip.from}</small></div><div className="ktr-journey"><small>{durationText(trip.duration)}</small><span>● ────── ✦ ────── ●</span><small>{nextDay?'+1 day':'Direct journey'}</small></div><div><strong>{clock(trip.depart,trip.duration)}</strong><small>{trip.mode==='flight'?trip.dropoff:trip.to}</small></div></div><div className="ktr-points">{trip.mode==='flight'?'Direct flight':`From ${trip.pickup} · To ${trip.dropoff}`}</div>{trip.mode==='train'&&<div className="ktr-classes">{trip.classes.map(c=><div key={c.name}><strong>{c.name}</strong><span>From {money(c.price)}</span><small>{c.seats} seats (demo)</small></div>)}</div>}</div>
 <div className="ktr-trip-side"><span>From</span><strong>{money(trip.price)}</strong><small>/ passenger</small><em className={trip.seats?'available':'sold'}>{trip.seats?`${trip.seats} seats · demo`:'Sold out · demo'}</em><button disabled={trip.seats<requiredSeats} onClick={()=>onBook(trip)}>{trip.seats>=requiredSeats?'Book Now':'Not enough seats'}</button></div></div>
 <div className="ktr-trip-footer"><span>✓ {trip.amenities.slice(0,2).join(' · ')}</span><button aria-expanded={expanded} onClick={onToggle}>{expanded?'Hide details −':'View details + '}</button></div>
 {expanded&&<Details trip={trip} tab={tab} setTab={setTab} onClose={onToggle}/>}</article>;
}
function SeatSelection({ trip, onClose, onConfirm }) {
 const [quantity,setQuantity]=useState(1);
 const [chosenClass,setChosenClass]=useState(trip.classes?.[0]?.name || 'Standard seat');
 const option=trip.classes?.find(c=>c.name===chosenClass);
 const available=option ? option.seats : trip.seats;
 const unitPrice=option ? option.price : trip.price;
 return <div className="ktr-booking-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <section className="ktr-booking-dialog" role="dialog" aria-modal="true" aria-label="Select tickets">
   <div className="ktr-booking-header"><div><span>SELECT YOUR TICKETS · DEMO</span><h3>{trip.name}</h3><small>{trip.from} → {trip.to} · {trip.depart}</small></div><button type="button" aria-label="Close" onClick={onClose}>×</button></div>
   {trip.mode==='train'&&<label className="ktr-booking-class">Seat / berth type<select value={chosenClass} onChange={e=>{setChosenClass(e.target.value);setQuantity(1);}}>{trip.classes.map(c=><option key={c.name} value={c.name}>{c.name} · {money(c.price)} · {c.seats} available</option>)}</select></label>}
   <div className="ktr-booking-count"><div><strong>Number of {trip.mode==='train'?'tickets':'seats'}</strong><small>{available} available · demo inventory</small></div><div className="ktr-passenger-counter"><button type="button" disabled={quantity<=1} onClick={()=>setQuantity(q=>q-1)}>−</button><output>{quantity}</output><button type="button" disabled={quantity>=Math.min(9,available)} onClick={()=>setQuantity(q=>q+1)}>+</button></div></div>
   <div className="ktr-booking-summary"><span>{quantity} × {money(unitPrice)}</span><strong>{money(quantity*unitPrice)}</strong></div>
   <p className="ktr-booking-disclaimer">This is a front-end demonstration. Seat numbers, child fares and booking confirmation require backend integration.</p>
   <button className="ktr-booking-confirm" type="button" disabled={quantity>available} onClick={()=>onConfirm(trip,quantity,chosenClass,unitPrice)}>Continue · {quantity} ticket{quantity>1?'s':''}</button>
  </section>
 </div>;
}
export default function Transport(){
 const [mode,setMode]=useState('bus');
 const [draft,setDraft]=useState({from:'Hanoi',to:'Ha Long',date:today(),returnDate:'',time:'all',passengers:{...DEFAULT_PASSENGERS}});
 const [search,setSearch]=useState({...draft});
 const [sort,setSort]=useState('Recommended');
 const [variants,setVariants]=useState([]);
 const [operators,setOperators]=useState([]);
 const [price,setPrice]=useState(3500000);
 const [minRating,setMinRating]=useState(0);
 const [onlyAvailable,setOnlyAvailable]=useState(false);
 const [sidebarTime,setSidebarTime]=useState('all');
 const [expanded,setExpanded]=useState(null);
 const [tab,setTab]=useState('Offers');
 const [page,setPage]=useState(1);
 const [showFilters,setShowFilters]=useState(false);
 const [notice,setNotice]=useState('');
 const [selectedTrip,setSelectedTrip]=useState(null);
 const [open,setOpen]=useState({type:true,operator:true,time:true,price:true,rating:false,status:false});
 const config=CONFIG[mode];
 const allMode=useMemo(()=>DATA.filter(t=>t.mode===mode),[mode]);
 const modeOperators=useMemo(()=>[...new Set(allMode.map(t=>t.operator))],[allMode]);
 const setTransportMode=id=>{setMode(id);const next={from:CONFIG[id].from,to:CONFIG[id].to,date:draft.date,returnDate:'',time:'all',passengers:draft.passengers};setSelectedTrip(null);setDraft(next);setSearch(next);setSort('Recommended');setVariants([]);setOperators([]);setPrice(3500000);setMinRating(0);setOnlyAvailable(false);setSidebarTime('all');setPage(1);setExpanded(null);setNotice('');};
 const reset=()=>{setVariants([]);setOperators([]);setPrice(3500000);setMinRating(0);setOnlyAvailable(false);setSidebarTime('all');setPage(1);};
 const toggle=(item,value,set)=>set(prev=>value?[...prev,item]:prev.filter(x=>x!==item));
 const filtered=useMemo(()=>{
 const inWindow=(time,id)=>{const w=WINDOWS.find(x=>x.id===id)||WINDOWS[0];return minutes(time)>=w.start&&minutes(time)<w.end;};
 const result=allMode.filter(t=>t.from.toLowerCase()===search.from.trim().toLowerCase()&&t.to.toLowerCase()===search.to.trim().toLowerCase()&&inWindow(t.depart,search.time)&&inWindow(t.depart,sidebarTime)&&(!variants.length||variants.includes(t.variant))&&(!operators.length||operators.includes(t.operator))&&t.price<=price&&t.rating>=minRating&&(!onlyAvailable||t.seats>=(mode==='flight'?seatCount(search.passengers):1)));
 return [...result].sort((a,b)=>sort==='Lowest price'?a.price-b.price:sort==='Highest price'?b.price-a.price:sort==='Earliest departure'?minutes(a.depart)-minutes(b.depart):sort==='Latest departure'?minutes(b.depart)-minutes(a.depart):sort==='Shortest duration'?a.duration-b.duration:sort==='Top rated'?b.rating-a.rating:Number(Boolean(b.featured))-Number(Boolean(a.featured)));
 },[allMode,search,sidebarTime,variants,operators,price,minRating,onlyAvailable,sort]);
 const PAGE_SIZE=4; const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)); const visible=filtered.slice((Math.min(page,pages)-1)*PAGE_SIZE,Math.min(page,pages)*PAGE_SIZE);
 const updateDraft=(key,value)=>setDraft(s=>({...s,[key]:value}));
 const submit=e=>{e.preventDefault();if(mode==='flight'&&draft.passengers.infants>draft.passengers.adults){setNotice('Each infant must be accompanied by an adult.');return;}if(draft.from.trim().toLowerCase()===draft.to.trim().toLowerCase()){setNotice('Departure and destination must be different.');return;}if(draft.returnDate&&draft.returnDate<draft.date){setNotice('Return date cannot be before departure date.');return;}setSearch({...draft});setPage(1);setExpanded(null);setNotice('');};
 const book=trip=>{
   if(trip.mode!=='flight'){setSelectedTrip(trip);return;}
   const p=search.passengers;const needed=seatCount(p);
   if(trip.seats<needed){setNotice(`Only ${trip.seats} seats remain. Your flight search requires ${needed} seats.`);return;}
   setNotice(`Flight booking demo: ${trip.name} · ${p.adults} adult(s), ${p.children} child(ren), ${p.infants} infant(s). Fare per adult ${money(trip.price)}; child/infant pricing requires airline integration.`);
 };
 const confirmSeats=(trip,quantity,seatClass,unitPrice)=>{
   setSelectedTrip(null);
   setNotice(`Ticket selection demo: ${trip.name} · ${quantity} ticket(s) · ${trip.mode==='train'?seatClass+' · ':''}${money(quantity*unitPrice)} total. Passenger information and payment will be handled in a later booking step.`);
 };
 return <main className="ktr-page"><section className="ktr-hero"><div className="ktr-container"><div className="ktr-breadcrumb">Home / Transportation</div><div className="ktr-kicker">KARNEL TRAVELS · DISCOVER MORE</div><h1>Transportation</h1><p>{config.headline}. {config.subtitle}</p></div></section>
 <div className="ktr-container ktr-main"><section className="ktr-search"><div className="ktr-modes" role="tablist" aria-label="Transport mode">{MODES.map(m=><button role="tab" aria-selected={mode===m.id} key={m.id} className={mode===m.id?'selected':''} onClick={()=>setTransportMode(m.id)}><span>{m.icon}</span>{m.name}</button>)}</div>
 <form onSubmit={submit}><div className="ktr-search-grid"><label><span>From</span><select value={draft.from} onChange={e=>updateDraft('from',e.target.value)}>{['Hanoi','Ha Long','Da Nang','Hoi An','Ho Chi Minh City','Ninh Binh'].map(x=><option key={x}>{x}</option>)}</select></label><button type="button" className="ktr-swap" title="Swap locations" onClick={()=>setDraft(s=>({...s,from:s.to,to:s.from}))}>⇄</button><label><span>To</span><select value={draft.to} onChange={e=>updateDraft('to',e.target.value)}>{['Ha Long','Hanoi','Da Nang','Hoi An','Ho Chi Minh City','Ninh Binh'].map(x=><option key={x}>{x}</option>)}</select></label><label><span>Departure date</span><input type="date" min={today()} value={draft.date} onChange={e=>updateDraft('date',e.target.value)} required/></label><label><span>Return date <em>(optional)</em></span><input type="date" min={draft.date||today()} value={draft.returnDate} onChange={e=>updateDraft('returnDate',e.target.value)}/></label><button className="ktr-search-submit" type="submit">⌕ Search routes</button></div></form>{mode==='flight'&&<div className="ktr-flight-passengers"><PassengerPicker value={draft.passengers} onChange={value=>updateDraft('passengers',value)}/></div>}</section>
 {notice&&<div className="ktr-notice" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></div>}
 <div className="ktr-results-layout"><aside className={`ktr-sidebar ${showFilters?'visible':''}`}><div className="ktr-sidebar-heading"><h2>Filters</h2><button onClick={reset}>Reset all</button></div>
 <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={()=>setOpen(s=>({...s,type:!s.type}))}>{config.filterLabel}<span>{open.type?'−':'+'}</span></button>{open.type&&<div>{config.filters.map(v=><FilterCheck key={v} label={v} checked={variants.includes(v)} onChange={x=>toggle(v,x,setVariants)}/>)}</div>}</div>
 <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={()=>setOpen(s=>({...s,operator:!s.operator}))}>{mode==='flight'?'Airline':mode==='train'?'Rail operator':'Bus operator'}<span>{open.operator?'−':'+'}</span></button>{open.operator&&<div>{modeOperators.map(v=><FilterCheck key={v} label={v} checked={operators.includes(v)} onChange={x=>toggle(v,x,setOperators)}/>)}</div>}</div>
 <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={()=>setOpen(s=>({...s,time:!s.time}))}>Departure time<span>{open.time?'−':'+'}</span></button>{open.time&&<div className="ktr-time-grid">{WINDOWS.map(w=><button key={w.id} className={sidebarTime===w.id?'selected':''} onClick={()=>{setSidebarTime(w.id);setPage(1);}}>{w.name}</button>)}</div>}</div>
 <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={()=>setOpen(s=>({...s,price:!s.price}))}>Maximum price<span>{open.price?'−':'+'}</span></button>{open.price&&<div className="ktr-price"><strong>{money(price)}</strong><input type="range" min="100000" max="3500000" step="50000" value={price} onChange={e=>{setPrice(Number(e.target.value));setPage(1);}}/><div><small>100.000đ</small><small>3.500.000đ</small></div></div>}</div>
 <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={()=>setOpen(s=>({...s,rating:!s.rating}))}>Rating<span>{open.rating?'−':'+'}</span></button>{open.rating&&<div className="ktr-radio-list">{[0,4,4.5,4.8].map(n=><label key={n}><input type="radio" name="rating" checked={minRating===n} onChange={()=>{setMinRating(n);setPage(1);}}/>{n===0?'All ratings':`★ ${n}+`}</label>)}</div>}</div>
 <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={()=>setOpen(s=>({...s,status:!s.status}))}>Availability<span>{open.status?'−':'+'}</span></button>{open.status&&<FilterCheck label="Available seats only" checked={onlyAvailable} onChange={setOnlyAvailable}/>}</div>
 </aside><section className="ktr-results"><div className="ktr-results-head"><div><span className="ktr-eyebrow">EXPLORE YOUR OPTIONS</span><h2>{search.from} <span>→</span> {search.to}</h2><p>{filtered.length} {mode==='flight'?'flights':mode==='train'?'trains':'departures'} found · {mode==='flight'?`${passengerLabel(search.passengers)} · ${seatCount(search.passengers)} seat(s) needed · `:''}Demo results</p></div><div className="ktr-results-actions"><button className="ktr-mobile-filter" onClick={()=>setShowFilters(x=>!x)}>☷ Filters</button><label>Sort by <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}>{config.sort.map(s=><option key={s}>{s}</option>)}</select></label></div></div><div className="ktr-info-banner">ⓘ All dates, fares, remaining seats and offers are sample data. Choosing a date updates the search form; real date-based availability requires an API.</div>
 <div className="ktr-trip-list">{visible.map(t=><TripCard key={t.id} trip={t} expanded={expanded===t.id} onToggle={()=>{setExpanded(x=>x===t.id?null:t.id);setTab('Offers');}} tab={tab} setTab={setTab} onBook={book} requiredSeats={mode==='flight'?seatCount(search.passengers):1}/>)}{!visible.length&&<div className="ktr-empty"><div>⌕</div><h3>No matching trips</h3><p>Try another route or adjust the filters.</p><button onClick={reset}>Clear filters</button></div>}</div>
 {pages>1&&<nav className="ktr-pagination" aria-label="Results pages"><button disabled={page===1} onClick={()=>{setPage(p=>p-1);setExpanded(null);}}>‹ Previous</button>{Array.from({length:pages},(_,i)=><button className={page===i+1?'current':''} key={i} onClick={()=>{setPage(i+1);setExpanded(null);}}>{i+1}</button>)}<button disabled={page===pages} onClick={()=>{setPage(p=>p+1);setExpanded(null);}}>Next ›</button></nav>}
 </section></div></div>{selectedTrip&&<SeatSelection trip={selectedTrip} onClose={()=>setSelectedTrip(null)} onConfirm={confirmSeats}/>}</main>;
}
