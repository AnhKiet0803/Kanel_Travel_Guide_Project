import 'package:flutter_test/flutter_test.dart';
import 'package:kaneltravelguide_app/utils/validators.dart';

void main() {
  group('validateRequired', () {
    test('rejects empty and blank text', () {
      expect(validateRequired('', 'Full name', 100), 'Full name is required.');
      expect(validateRequired('   ', 'Full name', 100), 'Full name is required.');
      expect(validateRequired(null, 'Message', 2000), 'Message is required.');
    });

    test('rejects text over the limit and accepts text at the limit', () {
      expect(validateRequired('a' * 101, 'Full name', 100), 'Full name must be at most 100 characters.');
      expect(validateRequired('a' * 100, 'Full name', 100), isNull);
    });
  });

  group('validateEmail', () {
    test('requires a value', () => expect(validateEmail(''), 'Email is required.'));

    test('rejects bad formats', () {
      for (final bad in ['abc', 'a@b', '@b.co', 'a b@c.co']) {
        expect(validateEmail(bad), 'Email format is invalid.', reason: bad);
      }
    });

    test('accepts a normal address (trimmed)', () => expect(validateEmail(' a@b.co '), isNull));
  });

  group('validateOptionalPhone', () {
    test('empty is fine', () => expect(validateOptionalPhone(''), isNull));

    test('accepts 8-20 digits with an optional + and separators', () {
      expect(validateOptionalPhone('0912345678'), isNull);
      expect(validateOptionalPhone('+84 912.345-678'), isNull);
    });

    test('rejects letters and too-short numbers', () {
      expect(validateOptionalPhone('12ab'), 'Phone number is invalid (8–20 digits).');
      expect(validateOptionalPhone('1234567'), 'Phone number is invalid (8–20 digits).');
    });
  });

  group('validateOptionalMax', () {
    test('only complains above the limit', () {
      expect(validateOptionalMax('', 'Subject', 200), isNull);
      expect(validateOptionalMax('a' * 201, 'Subject', 200), 'Subject must be at most 200 characters.');
    });
  });

  group('validateRating', () {
    test('rating is optional but must be 1 to 5', () {
      expect(validateRating(null), isNull);
      expect(validateRating(1), isNull);
      expect(validateRating(5), isNull);
      expect(validateRating(0), 'Rating must be from 1 to 5 stars.');
      expect(validateRating(6), 'Rating must be from 1 to 5 stars.');
    });
  });
}
