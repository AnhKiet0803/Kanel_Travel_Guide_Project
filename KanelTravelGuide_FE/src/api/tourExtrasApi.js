import { request } from './http.js';

const path = (tourId) => '/tours/' + encodeURIComponent(tourId) + '/extras';
export const listTourExtras = (tourId, includeDisabled = false) => request(path(tourId) + (includeDisabled ? '?includeDisabled=true' : ''));
export const addTourExtra = (tourId, data) => request(path(tourId), { method: 'POST', body: JSON.stringify(data) });
export const setTourExtraVisibility = (tourId, optionId, isEnabled) => request(path(tourId) + '/' + optionId, { method: 'PUT', body: JSON.stringify({ isEnabled }) });
export const removeTourExtra = (tourId, optionId) => request(path(tourId) + '/' + optionId, { method: 'DELETE' });
