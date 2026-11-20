import { request } from '../api/http.js';
import { listSpots } from '../api/touristSpotsApi.js';

const pathFor = (id) => '/tours/' + encodeURIComponent(id);
const loadSpots = () => listSpots().catch(() => []);

export function readTourItinerary(value) {
    const text = value?.trim() ?? '';
    const meetingPoint = text.match(/^Meeting point:[ \t]*([^\r\n]+)(?:\r?\n|$)/i);
    return {
        meetingPoint: meetingPoint?.[1].trim() ?? '',
        itinerary: meetingPoint ? text.slice(meetingPoint[0].length).trim() : text,
    };
}

export function writeTourItinerary(meetingPoint, itinerary) {
    return [meetingPoint && 'Meeting point: ' + meetingPoint, itinerary].filter(Boolean).join('\n\n') || null;
}

function presentTour(tour, spots) {
    const spot = spots.find((item) => item.SpotId === tour.spotId);
    return {
        ...tour,
        id: tour.tourId,
        title: tour.tourName,
        destination: tour.spotName,
        locationId: spot?.LocationId,
        locationName: spot?.LocationName,
        description: readTourItinerary(tour.itineraryDetail).itinerary,
        price: tour.matchingAdultPrice ?? tour.salePrice ?? tour.standardPrice,
        image: spot?.ThumbnailUrl,
    };
}

export const tourService = {
    async list(filters = {}, spotsRequest = loadSpots()) {
        const query = new URLSearchParams(filters).toString();
        const [tours, spots] = await Promise.all([request('/tours' + (query ? '?' + query : '')), spotsRequest.catch(() => [])]);
        return tours.map((tour) => presentTour(tour, spots));
    },
    async get(id) {
        const [tour, spots, promotions] = await Promise.all([
            request(pathFor(id)), loadSpots(), listTourPromotions().catch(() => []),
        ]);
        return {
            ...presentTour(tour, spots),
            promotion: promotions.find((item) => item.promotionId === tour.promotionId) ?? null,
        };
    },
    save(data, id) {
        return request(id == null ? '/tours' : pathFor(id), {
            method: id == null ? 'POST' : 'PUT',
            body: JSON.stringify(data),
        });
    },
    remove(id) {
        return request(pathFor(id), { method: 'DELETE' });
    },
};

export const listTourPromotions = (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return request('/promotions' + (query ? '?' + query : ''));
};

export const promotionInstant = (value) => new Date(/(?:Z|[+-]\d\d:\d\d)$/i.test(value) ? value : value + 'Z');

export const money = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(value);
