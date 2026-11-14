const KEY = 'karnel-admin-tours-demo';
export const USE_DEMO_TOURS = import.meta.env.VITE_USE_DEMO_TOURS !== 'false';
const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011/api').replace(/\/$/, '');
const seed = [
  {id:1,title:'Ha Long Bay Cruise',destination:'Ha Long',duration:3,price:2590000,image:'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200',description:'Khám phá vịnh Hạ Long và trải nghiệm du thuyền.',itinerary:['Ngày 1: Khởi hành và nhận phòng','Ngày 2: Tham quan vịnh và chèo kayak','Ngày 3: Trở về'],status:'active'},
  {id:2,title:'Sapa Mountain Escape',destination:'Sa Pa',duration:4,price:3290000,image:'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200',description:'Khám phá núi rừng và bản làng Sa Pa.',itinerary:['Ngày 1: Di chuyển đến Sa Pa','Ngày 2: Trekking bản làng','Ngày 3: Tham quan Fansipan','Ngày 4: Trở về'],status:'active'},
  {id:3,title:'Da Nang & Hoi An',destination:'Da Nang',duration:3,price:2890000,image:'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200',description:'Trải nghiệm Đà Nẵng và phố cổ Hội An.',itinerary:['Ngày 1: Đà Nẵng','Ngày 2: Hội An','Ngày 3: Trở về'],status:'active'},
];
function read(){try{const v=localStorage.getItem(KEY);return v?JSON.parse(v):seed;}catch{return seed;}}
function write(items){localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new Event('karnel-tours-updated'));}
async function request(path, options){const res=await fetch(`${API}/tours${path}`,{headers:{'Content-Type':'application/json'},...options});if(!res.ok)throw new Error(`API error ${res.status}`);return res.status===204?null:res.json();}
export const tourService={
  list:async()=>USE_DEMO_TOURS?read():request(''),
  get:async(id)=>USE_DEMO_TOURS?read().find(x=>String(x.id)===String(id)):request(`/${id}`),
  save:async(data)=>{if(!USE_DEMO_TOURS)return request(data.id?`/${data.id}`:'',{method:data.id?'PUT':'POST',body:JSON.stringify(data)});const items=read();const item={...data,id:data.id||Date.now()};const index=items.findIndex(x=>String(x.id)===String(item.id));if(index>=0)items[index]=item;else items.unshift(item);write(items);return item;},
  remove:async(id)=>{if(!USE_DEMO_TOURS)return request(`/${id}`,{method:'DELETE'});write(read().filter(x=>String(x.id)!==String(id)));},
};
export const money=(v)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Number(v)||0);
