// Form validation for the Contact and Feedback screens. The rules and messages are the same as the website
// (src/utils/validators.js) and the backend contracts. Each function returns an error message, or null when valid.

final RegExp _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final RegExp _phonePattern = RegExp(r'^\+?[0-9 .-]{8,20}$');

const int fullNameMax = 100;
const int emailMax = 100;
const int subjectMax = 200;
const int titleMax = 200;
const int textMax = 2000;

String? validateRequired(String? value, String label, int max) {
  final text = (value ?? '').trim();
  if (text.isEmpty) return '$label is required.';
  if (text.length > max) return '$label must be at most $max characters.';
  return null;
}

String? validateOptionalMax(String? value, String label, int max) {
  if ((value ?? '').trim().length > max) return '$label must be at most $max characters.';
  return null;
}

String? validateEmail(String? value) {
  final required = validateRequired(value, 'Email', emailMax);
  if (required != null) return required;
  if (!_emailPattern.hasMatch(value!.trim())) return 'Email format is invalid.';
  return null;
}

String? validateOptionalPhone(String? value) {
  final phone = (value ?? '').trim();
  if (phone.isNotEmpty && !_phonePattern.hasMatch(phone)) return 'Phone number is invalid (8–20 digits).';
  return null;
}

/// Rating is optional; when given it must be 1 to 5.
String? validateRating(int? rating) {
  if (rating != null && (rating < 1 || rating > 5)) return 'Rating must be from 1 to 5 stars.';
  return null;
}
