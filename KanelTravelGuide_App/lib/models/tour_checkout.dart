import 'dart:math' as math;

double roundedMoney(num value) => (value * 100).round() / 100;

class TourExtra {
  const TourExtra({
    required this.id,
    required this.kind,
    required this.name,
    required this.provider,
    required this.price,
    required this.available,
    required this.unit,
    this.time,
  });
  final int id;
  final String kind, name, provider, unit;
  final double price;
  final int available;
  final String? time;
  String get key => '$kind:$id';
  Map<String, dynamic> bookingLine(int quantity) => {
    kind == 'service' ? 'serviceItemId' : 'scheduleId': id,
    'quantity': quantity,
  };
}

class TourQuote {
  TourQuote({
    required this.tourId,
    required this.departure,
    required this.adults,
    required this.childAges,
    this.extras = const [],
    this.quantities = const {},
    this.promotion,
  });
  final int tourId, adults;
  final Map<String, dynamic> departure;
  final List<int?> childAges;
  final List<TourExtra> extras;
  final Map<String, int> quantities;
  final Map<String, dynamic>? promotion;
  int get travelers => adults + childAges.length;
  double get adultTotal =>
      roundedMoney((departure['adultPrice'] as num) * adults);
  double get childTotal =>
      roundedMoney((departure['childPrice'] as num) * childAges.length);
  double get extrasTotal => roundedMoney(
    extras.fold<double>(
      0,
      (sum, item) => sum + item.price * (quantities[item.key] ?? 0),
    ),
  );
  double get subtotal => roundedMoney(adultTotal + childTotal + extrasTotal);
  double get discount {
    final percent = (promotion?['discountPercent'] as num?) ?? 0;
    final amount = percent > 0
        ? roundedMoney(subtotal * percent / 100)
        : (promotion?['discountAmount'] as num?) ?? 0;
    return math.min(subtotal, math.max(0, amount)).toDouble();
  }

  double get total => roundedMoney(subtotal - discount);
  String? validate() {
    if (adults < 1 || adults > 1000 || travelers > 1000) {
      return 'Choose at least one adult and at most 1,000 travelers.';
    }
    if (childAges.any((age) => age == null || age < 2 || age > 17)) {
      return 'Select an age from 2 to 17 for each child.';
    }
    if (travelers > ((departure['seatsLeft'] as num?) ?? 0)) {
      return 'Not enough seats for this group. Choose another departure.';
    }
    if (quantities.entries.where((entry) => entry.value > 0).length > 30) {
      return 'Add at most 30 optional services.';
    }
    for (final entry in quantities.entries) {
      if (entry.value == 0) continue;
      final matching = extras.where((item) => item.key == entry.key);
      if (matching.isEmpty ||
          entry.value < 0 ||
          entry.value > matching.first.available ||
          entry.value > 1000) {
        return 'An extra service is no longer available in the selected quantity. Update your selection.';
      }
    }
    return null;
  }

  Map<String, dynamic> bookingRequest({
    required String name,
    required String phone,
    required String email,
    required String paymentMethod,
    String? notes,
  }) {
    final error = validate();
    if (error != null) throw FormatException(error);
    return {
      'tourDepartureId': departure['tourDepartureId'],
      'bookingType': 'Tour',
      'adultCount': adults,
      'childAges': childAges.cast<int>(),
      'startDate': departure['departureDate'],
      'totalPassengers': travelers,
      'customerName': name.trim(),
      'customerPhone': phone.trim(),
      'customerEmail': email.trim(),
      'paymentMethod': paymentMethod,
      'notes': notes?.trim(),
      'promoCode': promotion?['promoCode'],
      'details': [
        {'tourId': tourId, 'quantity': travelers},
        for (final item in extras)
          if ((quantities[item.key] ?? 0) > 0)
            item.bookingLine(quantities[item.key]!),
      ],
    };
  }
}

bool sandboxApprovalUrl(String value) {
  final uri = Uri.tryParse(value);
  return uri != null &&
      uri.scheme == 'https' &&
      uri.host == 'www.sandbox.paypal.com' &&
      uri.port == 443 &&
      uri.userInfo.isEmpty;
}

enum PayPalReturn { none, approved, cancelled }

PayPalReturn paypalReturn(String value, int bookingId) {
  final uri = Uri.tryParse(value);
  if (uri == null ||
      !['http', 'https'].contains(uri.scheme) ||
      uri.path != '/tours/payment-return' ||
      uri.queryParameters['bookingId'] != '$bookingId') {
    return PayPalReturn.none;
  }
  if (uri.queryParameters['cancelled'] == '1') return PayPalReturn.cancelled;
  return (uri.queryParameters['token'] ?? '').isNotEmpty
      ? PayPalReturn.approved
      : PayPalReturn.none;
}
