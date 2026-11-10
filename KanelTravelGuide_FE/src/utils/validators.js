// Form validation for Contact (CN14), Feedback (CN15) and the account forms.
// Length limits match the database design (Contacts, Feedbacks tables).
// Each function returns an error object: { fieldName: 'error message' }. An empty object means valid.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9 .-]{8,20}$/

export const LIMITS = {
  fullName: 100,
  email: 100,
  phone: 20,
  subject: 200,
  title: 200,
  text: 2000, // message / content (NVARCHAR(MAX) column, limit enforced in the UI)
}

function checkRequired(errors, field, value, label, max) {
  const text = (value ?? '').trim()
  if (!text) {
    errors[field] = `${label} is required.`
  } else if (text.length > max) {
    errors[field] = `${label} must be at most ${max} characters.`
  }
}

function checkOptionalMax(errors, field, value, label, max) {
  if ((value ?? '').trim().length > max) {
    errors[field] = `${label} must be at most ${max} characters.`
  }
}

function checkEmail(errors, value) {
  checkRequired(errors, 'email', value, 'Email', LIMITS.email)
  if (!errors.email && !EMAIL_PATTERN.test(value.trim())) {
    errors.email = 'Email format is invalid.'
  }
}

export function validateContact(form) {
  const errors = {}
  checkRequired(errors, 'fullName', form.fullName, 'Full name', LIMITS.fullName)
  checkEmail(errors, form.email)
  const phone = (form.phone ?? '').trim()
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Phone number is invalid (8–20 digits).'
  }
  checkOptionalMax(errors, 'subject', form.subject, 'Subject', LIMITS.subject)
  checkRequired(errors, 'message', form.message, 'Message', LIMITS.text)
  return errors
}

const USERNAME_PATTERN = /^[A-Za-z0-9_.]{3,50}$/

function checkOptionalPhone(errors, value) {
  const phone = (value ?? '').trim()
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Phone number is invalid (8–20 digits).'
  }
}

// New password: at least 8 characters, letters and digits, and the confirmation must match.
function checkNewPassword(errors, field, password, confirmPassword) {
  if (!password) {
    errors[field] = 'Please enter your password.'
  } else if (password.length < 8) {
    errors[field] = 'Password must be at least 8 characters.'
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors[field] = 'Password must contain both letters and digits.'
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.'
  }
}

export function validateLogin(form) {
  const errors = {}
  if (!(form.username ?? '').trim()) errors.username = 'Please enter your username.'
  if (!form.password) errors.password = 'Please enter your password.'
  return errors
}

export function validateRegister(form) {
  const errors = {}
  const username = (form.username ?? '').trim()
  if (!username) {
    errors.username = 'Please enter your username.'
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = 'Username must be 3–50 characters: letters, digits, dots and underscores only.'
  }
  checkRequired(errors, 'fullName', form.fullName, 'Full name', LIMITS.fullName)
  checkEmail(errors, form.email)
  checkNewPassword(errors, 'password', form.password, form.confirmPassword)
  checkOptionalPhone(errors, form.phone)
  checkOptionalMax(errors, 'address', form.address, 'Address', 255)
  return errors
}

/** Profile: full name is required; phone and address are optional. */
export function validateProfile(form) {
  const errors = {}
  checkRequired(errors, 'fullName', form.fullName, 'Full name', LIMITS.fullName)
  checkOptionalPhone(errors, form.phone)
  checkOptionalMax(errors, 'address', form.address, 'Address', 255)
  return errors
}

export function validateChangePassword(form) {
  const errors = {}
  if (!form.currentPassword) errors.currentPassword = 'Please enter your current password.'
  checkNewPassword(errors, 'newPassword', form.newPassword, form.confirmPassword)
  if (!errors.newPassword && form.newPassword === form.currentPassword) {
    errors.newPassword = 'New password must be different from the current password.'
  }
  return errors
}

export function validateForgotPassword(form) {
  const errors = {}
  checkEmail(errors, form.email)
  return errors
}

/** Reset via the emailed link: only the new password and its confirmation are needed. */
export function validateResetPassword(form) {
  const errors = {}
  checkNewPassword(errors, 'newPassword', form.newPassword, form.confirmPassword)
  return errors
}

export function validateFeedback(form) {
  const errors = {}
  checkRequired(errors, 'fullName', form.fullName, 'Full name', LIMITS.fullName)
  checkEmail(errors, form.email)
  const rating = Number(form.rating)
  if (form.rating !== '' && form.rating != null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) {
    errors.rating = 'Rating must be from 1 to 5 stars.'
  }
  checkOptionalMax(errors, 'title', form.title, 'Title', LIMITS.title)
  checkRequired(errors, 'content', form.content, 'Feedback', LIMITS.text)
  return errors
}
