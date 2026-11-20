import { request } from '../api/http.js';
import { listTourPromotions, promotionInstant } from '../services/tourService.js';

const calendar = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' });
const day = value => value ? calendar.format(promotionInstant(value)) : '';

function present(promotion) {
  return {
    PromotionId: promotion.promotionId,
    PromoCode: promotion.promoCode ?? '',
    Title: promotion.title,
    DiscountPercent: promotion.discountPercent,
    DiscountAmount: promotion.discountAmount,
    StartDate: day(promotion.startDate),
    EndDate: day(promotion.endDate),
    StartInstant: promotionInstant(promotion.startDate).toISOString(),
    EndInstant: promotionInstant(promotion.endDate).toISOString(),
    IsActive: promotion.isActive,
    TourIds: promotion.tourIds ?? [],
  };
}

export async function listPromotions() {
  return (await listTourPromotions({ activeOnly: false })).map(present);
}

export async function getPromotion(id) {
  return present(await request('/promotions/' + encodeURIComponent(id)));
}

export function savePromotion(payload, id) {
  return request(id ? '/promotions/' + encodeURIComponent(id) : '/promotions', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
}

export function deletePromotion(id) {
  return request('/promotions/' + encodeURIComponent(id), { method: 'DELETE' });
}
