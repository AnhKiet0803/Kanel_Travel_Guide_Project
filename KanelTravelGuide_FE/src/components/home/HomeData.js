export function serviceIllustration(type) {
  const path = { Hotel: '/hotels', Restaurant: '/restaurants', Resort: '/resorts' }[type];
  return services.find(item => item.to === path)?.image ?? '/images/services/fallback.jpg';
}

export function fallbackServiceImage(event, type) {
  const img = event.currentTarget;
  const fallback = '/images/services/fallback.jpg';
  if (img.src.endsWith(fallback)) return;
  const illustration = serviceIllustration(type);
  img.src = img.src === illustration ? fallback : illustration;
}

export const services = [
  { name: 'Destinations', icon: 'bi-geo-alt', text: 'Discover inspiring places', to: '/destinations', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85' },
  { name: 'Tours', icon: 'bi-compass', text: 'Explore curated experiences', to: '/tours', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=85' },
  { name: 'Hotels', icon: 'bi-building', text: 'Find your ideal stay', to: '/hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=85' },
  { name: 'Restaurants', icon: 'bi-cup-hot', text: 'Taste local specialties', to: '/restaurants', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85' },
  { name: 'Resorts', icon: 'bi-tree', text: 'Relax in beautiful settings', to: '/resorts', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=85' },
  { name: 'Transportation', icon: 'bi-bus-front', text: 'Plan your journey', to: '/transport', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=85' },
];
