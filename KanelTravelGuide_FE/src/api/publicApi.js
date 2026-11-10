// API calls for the public pages: Contact (CN14) and Feedback (CN15).
import { request } from './http.js'

/** CN14: send a contact / consultation request. */
export function sendContact({ fullName, email, phone, subject, message }) {
  return request('/contacts', {
    method: 'POST',
    body: JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
    }),
  })
}

/** CN15: send feedback & rating (hidden until an Admin approves it). */
export function sendFeedback({ fullName, email, rating, title, content }) {
  return request('/feedbacks', {
    method: 'POST',
    body: JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim(),
      rating: rating === '' || rating == null ? null : Number(rating),
      title: title?.trim() || null,
      content: content.trim(),
    }),
  })
}

/** CN15: fetch feedback approved by an Admin for public display. */
export async function getApprovedFeedbacks() {
  const data = await request('/feedbacks/approved')
  // Accept either a plain array or a paged { items } object.
  return Array.isArray(data) ? data : (data?.items ?? [])
}
