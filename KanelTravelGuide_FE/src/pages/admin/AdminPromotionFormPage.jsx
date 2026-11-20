import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPromotion, savePromotion } from '../../data/adminPromotionsStore';
import { tourService } from '../../services/tourService.js';
import '../../styles/admin/AdminPromotions.css';

const blank = {
  PromoCode: '', Title: '', DiscountType: 'percent', DiscountValue: '',
  StartDate: '', EndDate: '', IsActive: true, TourIds: [],
};

export default function AdminPromotionFormPage() {
  const { id } = useParams();
  return <PromotionForm key={id ?? 'new'} id={id} />;
}

function PromotionForm({ id }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [catalog, setCatalog] = useState(null);
  const [original, setOriginal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([tourService.list(), id ? getPromotion(id) : null])
      .then(([tours, promotion]) => {
        if (!active) return;
        if (promotion) {
          setOriginal(promotion);
          setForm({
            ...promotion,
            DiscountType: promotion.DiscountPercent != null ? 'percent' : 'amount',
            DiscountValue: String(promotion.DiscountPercent ?? promotion.DiscountAmount ?? ''),
            TourIds: tours.filter(tour => tour.promotionId === Number(id)).map(tour => tour.id),
          });
        }
        setCatalog({ tours });
      })
      .catch(failure => { if (active) setCatalog({ error: failure.message }); });
    return () => { active = false; };
  }, [id]);

  function set(key, value) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function toggleTour(tourId, checked) {
    setForm(previous => ({
      ...previous,
      TourIds: checked ? [...previous.TourIds, tourId] : previous.TourIds.filter(value => value !== tourId),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const promoCode = form.PromoCode.trim().toUpperCase();
    const title = form.Title.trim();
    const discount = Number(form.DiscountValue);
    if (!title || !/^[A-Z0-9_-]+$/.test(promoCode)) {
      setError('Enter a campaign name and a code using letters, numbers, underscores or hyphens.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await savePromotion({
        promoCode,
        title,
        discountPercent: form.DiscountType === 'percent' ? discount : null,
        discountAmount: form.DiscountType === 'amount' ? discount : null,
        startDate: form.StartDate === original?.StartDate ? original.StartInstant
          : new Date(form.StartDate + 'T00:00:00+07:00').toISOString(),
        endDate: form.EndDate === original?.EndDate ? original.EndInstant
          : new Date(form.EndDate + 'T23:59:59.999+07:00').toISOString(),
        isActive: form.IsActive,
        tourIds: form.TourIds,
      }, id);
      navigate('/admin/promotions');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="ap-page ap-modern">
      <header className="ap-head">
        <div>
          <Link className="ap-back" to="/admin/promotions">← Back to promotions</Link>
          <h1>{id ? 'Edit promotion' : 'Add promotion'}</h1>
        </div>
      </header>
      {!catalog && <p role="status">Loading promotion form…</p>}
      {catalog?.error && <p className="ap-error" role="alert">{catalog.error}</p>}
      {catalog?.tours && (
        <form className="ap-panel ap-form" onSubmit={submit}>
          <div className="ap-form-grid">
            <label>Promotion code
              <input required maxLength={50} value={form.PromoCode} onChange={e => set('PromoCode', e.target.value.toUpperCase())} />
            </label>
            <label>Campaign name
              <input required maxLength={200} value={form.Title} onChange={e => set('Title', e.target.value)} />
            </label>
            <label>Discount type
              <select value={form.DiscountType} onChange={e => setForm(previous => ({
                ...previous, DiscountType: e.target.value, DiscountValue: '',
              }))}>
                <option value="percent">Percentage (%)</option>
                <option value="amount">Fixed amount (VND)</option>
              </select>
            </label>
            <label>Discount value
              <input type="number" min="0.01" max={form.DiscountType === 'percent' ? 100 : 1000000000}
                step="0.01" required value={form.DiscountValue} onChange={e => set('DiscountValue', e.target.value)} />
            </label>
            <label>Start date
              <input type="date" required value={form.StartDate} onChange={e => set('StartDate', e.target.value)} />
            </label>
            <label>End date
              <input type="date" required min={form.StartDate || undefined} value={form.EndDate}
                onChange={e => set('EndDate', e.target.value)} />
            </label>
          </div>
          <label className="ap-check">
            <input type="checkbox" checked={form.IsActive} onChange={e => set('IsActive', e.target.checked)} /> Enable promotion
          </label>
          <fieldset className="ap-tours">
            <legend>Applicable tours</legend>
            <p>Link tours to show this promotion on the public Offers page.</p>
            {!catalog.tours.length && <p>No tours available yet.</p>}
            {catalog.tours.map(tour => {
              const alreadyLinked = tour.promotionId != null && tour.promotionId !== Number(id);
              return (
                <label className="ap-check" key={tour.id}>
                  <input type="checkbox" disabled={alreadyLinked} checked={form.TourIds.includes(tour.id)}
                    onChange={e => toggleTour(tour.id, e.target.checked)} />
                  {tour.title}{alreadyLinked ? ' · Already linked to another promotion' : ''}
                </label>
              );
            })}
          </fieldset>
          {error && <p className="ap-error" role="alert">{error}</p>}
          <div className="ap-form-actions">
            <Link className="ap-secondary" to="/admin/promotions">Cancel</Link>
            <button className="ap-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : id ? 'Save changes' : 'Create promotion'}</button>
          </div>
        </form>
      )}
    </main>
  );
}
