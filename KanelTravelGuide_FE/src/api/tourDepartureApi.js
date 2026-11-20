import { request } from './http.js';

const path = (tourId) => '/tours/' + encodeURIComponent(tourId) + '/departures';

export const listTourDepartures = (tourId, includePast = false) =>
    request(path(tourId) + (includePast ? '?includePast=true' : ''));

export function saveTourDeparture(tourId, data, id) {
    return request(id == null ? path(tourId) : path(tourId) + '/' + encodeURIComponent(id), {
        method: id == null ? 'POST' : 'PUT',
        body: JSON.stringify(data),
    });
}

export const deleteTourDeparture = (tourId, id) =>
    request(path(tourId) + '/' + encodeURIComponent(id), { method: 'DELETE' });
