// Demo data modeled on Promotion.cs and TourPackage.cs.
// Images and transportation offers are UI-only data, not backend fields.
const today = new Date();
const relativeDate = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const promotionsDemo = [
  {
    PromotionId: 1,
    PromoCode: 'KARNEL20',
    Title: 'Ha Long Bay Discovery – Save 20%',
    DiscountPercent: 20,
    DiscountAmount: null,
    StartDate: relativeDate(-4),
    EndDate: relativeDate(12),
    IsActive: true,
    TourPackages: [
      { TourId: 101, SpotId: 1, PromotionId: 1, TourName: 'Ha Long Bay Cruise Experience', Duration: '2 days 1 night', StandardPrice: 2500000, SalePrice: 2000000, ItineraryDetail: 'Cruise, kayaking and sunset views.', IsFeatured: true }
    ]
  },
  {
    PromotionId: 2,
    PromoCode: 'HOIAN300',
    Title: 'Hoi An Heritage Escape – Save 300,000đ',
    DiscountPercent: null,
    DiscountAmount: 300000,
    StartDate: relativeDate(-2),
    EndDate: relativeDate(18),
    IsActive: true,
    TourPackages: [
      { TourId: 102, SpotId: 2, PromotionId: 2, TourName: 'Hoi An Ancient Town Walk', Duration: '1 day', StandardPrice: 1200000, SalePrice: 900000, ItineraryDetail: 'Explore old streets and lantern markets.', IsFeatured: false }
    ]
  },
  {
    PromotionId: 3,
    PromoCode: 'BALI15',
    Title: 'Bali Island Getaway – Save 15%',
    DiscountPercent: 15,
    DiscountAmount: null,
    StartDate: relativeDate(-1),
    EndDate: relativeDate(8),
    IsActive: true,
    TourPackages: [
      { TourId: 103, SpotId: 3, PromotionId: 3, TourName: 'Bali Culture & Nature', Duration: '4 days 3 nights', StandardPrice: 7900000, SalePrice: 6715000, ItineraryDetail: 'Temples, rice terraces and coastal scenery.', IsFeatured: true }
    ]
  },
  {
    PromotionId: 4,
    PromoCode: 'NEXTMONTH',
    Title: 'Coming Soon – Summer Tour Deals',
    DiscountPercent: 10,
    DiscountAmount: null,
    StartDate: relativeDate(7),
    EndDate: relativeDate(35),
    IsActive: true,
    TourPackages: [
      { TourId: 104, SpotId: 1, PromotionId: 4, TourName: 'Ha Long Day Explorer', Duration: '1 day', StandardPrice: 1500000, SalePrice: null, ItineraryDetail: 'A full day on the bay.', IsFeatured: false }
    ]
  },
  {
    PromotionId: 5,
    PromoCode: 'PAST10',
    Title: 'Past Holiday Promotion',
    DiscountPercent: 10,
    DiscountAmount: null,
    StartDate: relativeDate(-25),
    EndDate: relativeDate(-5),
    IsActive: true,
    TourPackages: [
      { TourId: 105, SpotId: 2, PromotionId: 5, TourName: 'Hoi An Food Tour', Duration: 'Half day', StandardPrice: 800000, SalePrice: null, ItineraryDetail: 'Local food experiences.', IsFeatured: false }
    ]
  }
];

export const tourVisuals = {
  101: { image: '/images/destinations/halong/main.jpg', location: 'Ha Long Bay, Vietnam', badge: 'Popular' },
  102: { image: '/images/destinations/hoian/main.jpg', location: 'Hoi An, Vietnam', badge: 'Culture' },
  103: { image: '/images/destinations/bali/main.jpg', location: 'Bali, Indonesia', badge: 'Featured' },
  104: { image: '/images/destinations/halong/photo-1.jpg', location: 'Ha Long Bay, Vietnam', badge: 'Coming soon' },
  105: { image: '/images/destinations/hoian/photo-1.jpg', location: 'Hoi An, Vietnam', badge: 'Expired' }
};

// Transport promotions are demo-only. Promotion.cs currently relates to TourPackage only.
export const transportDealsDemo = [
  { id: 'bus-1', type: 'Bus', title: 'Hanoi → Ha Long · Limousine', provider: 'Karnel Express', origin: 'Hanoi', destination: 'Ha Long', price: 220000, discountPercent: 15, originalPrice: 260000, promoCode: 'BUS15', endDate: relativeDate(3), image: '/images/destinations/halong/main.jpg', description: 'Premium coach · reclining seats · Wi-Fi', bookingPath: '/transport?type=bus' },
  { id: 'flight-1', type: 'Flight', title: 'Hanoi → Da Nang · Flight', provider: 'Demo Airline', origin: 'Hanoi', destination: 'Da Nang', price: 1568000, discountPercent: 12, originalPrice: 1782000, promoCode: 'FLY12', endDate: relativeDate(6), image: '/images/destinations/hoian/main.jpg', description: 'One-way fare · demo offer', bookingPath: '/transport?type=flight' },
  { id: 'train-1', type: 'Train', title: 'Hanoi → Da Nang · Train', provider: 'Demo Rail', origin: 'Hanoi', destination: 'Da Nang', price: 771000, discountPercent: null, originalPrice: 771000, promoCode: null, endDate: relativeDate(9), image: '/images/destinations/hoian/photo-1.jpg', description: 'Sleeper and seat options · regular fare', bookingPath: '/transport?type=train' }
];
