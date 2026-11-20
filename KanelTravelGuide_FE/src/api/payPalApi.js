import { request } from './http.js';

export const getPayPalOptions = () => request('/payments/paypal/options');
export const createPayPalOrder = (id) => request(`/payments/paypal/${encodeURIComponent(id)}/order`, { method: 'POST' });
export const capturePayPalOrder = (id) => request(`/payments/paypal/${encodeURIComponent(id)}/capture`, { method: 'POST' });

export const paymentLabels = {
    BankTransfer: 'Bank transfer',
    PayAfterConfirmation: 'Pay after confirmation',
    PayPalSandbox: 'PayPal Sandbox',
};
