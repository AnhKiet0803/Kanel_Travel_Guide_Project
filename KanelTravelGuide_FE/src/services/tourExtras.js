import { getServiceById } from '../api/servicesApi.js';
import { getSchedules } from '../api/transportApi.js';
import { listTourExtras } from '../api/tourExtrasApi.js';

export function parseTourExtras(value) {
    if (!value) return [];
    try {
        const rows = JSON.parse(value);
        if (!Array.isArray(rows) || rows.length > 30) return null;
        const keys = new Set();
        for (const row of rows) {
            const validId = Number.isSafeInteger(row.id) && row.id > 0;
            const validQuantity = Number.isInteger(row.quantity) && row.quantity >= 1 && row.quantity <= 1000;
            const key = row.kind + ':' + row.id;
            if (!['service', 'transport'].includes(row.kind) || !validId || !validQuantity || keys.has(key)) return null;
            keys.add(key);
        }
        return rows.map(({ kind, id, quantity }) => ({ kind, id, quantity }));
    } catch {
        return null;
    }
}

export const extraKey = (item) => item.kind + ':' + item.id;

export async function loadTourExtras(tourId, date) {
    if (!tourId || !date) return [];
    const options = await listTourExtras(tourId);
    const providerIds = [...new Set(options.map((option) => option.providerId).filter(Boolean))];
    const serviceIds = new Set(options.map((option) => option.serviceItemId).filter(Boolean));
    const scheduleIds = new Set(options.map((option) => option.scheduleId).filter(Boolean));
    const [details, schedules] = await Promise.all([
        Promise.all(providerIds.map((providerId) => getServiceById(providerId, { date }))),
        scheduleIds.size ? getSchedules({ date, status: 'Running' }) : [],
    ]);
    const services = details.flatMap((provider) => provider.items
        .filter((item) => serviceIds.has(item.itemId) && item.isAvailable && item.price > 0 && item.remainingQuantity > 0)
        .map((item) => ({
            kind: 'service', id: item.itemId, label: item.itemName, provider: provider.providerName,
            price: item.price, available: item.remainingQuantity, capacity: item.capacity,
            category: provider.serviceType === 'Restaurant' ? 'Dining' : 'Accommodation',
            unit: provider.serviceType === 'Restaurant' ? 'option' : 'room / night',
        })));
    const transport = schedules.filter((item) => scheduleIds.has(item.scheduleId)
        && item.status === 'Running' && item.ticketPrice > 0 && item.remainingSeats > 0)
        .map((item) => ({
            kind: 'transport', id: item.scheduleId, label: item.vehicleName,
            provider: item.departureLocationName + ' → ' + item.destinationLocationName,
            price: item.ticketPrice, available: item.remainingSeats, category: 'Transport',
            unit: 'ticket', time: item.departureTime?.slice(0, 5),
        }));
    return [...services, ...transport];
}
