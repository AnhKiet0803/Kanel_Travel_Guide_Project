import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kaneltravelguide_app/models/tour_checkout.dart';
import 'package:kaneltravelguide_app/screens/tour_booking_screen.dart';
import 'package:kaneltravelguide_app/screens/booking_receipt_screen.dart';
import 'package:kaneltravelguide_app/screens/travel_detail_screen.dart';
import 'package:kaneltravelguide_app/services/api_client.dart';
import 'package:kaneltravelguide_app/services/karnel_api.dart';
import 'package:kaneltravelguide_app/services/tour_booking_api.dart';

const departure = <String, dynamic>{
  'tourDepartureId': 26,
  'departureDate': '2027-03-06',
  'returnDate': '2027-03-08',
  'adultPrice': 1000,
  'childPrice': 750,
  'seatsLeft': 8,
};
const tour = <String, dynamic>{
  'tourId': 2,
  'tourName': 'Hanoi - Hoi An',
  'duration': '3 days 2 nights',
  'standardPrice': 1000,
  'itineraryDetail': 'Day 1: Depart Hanoi\nTravel overnight.',
};
const extra = TourExtra(
  id: 12,
  kind: 'service',
  name: 'Double room',
  provider: 'Hotel',
  price: 2000,
  available: 2,
  unit: 'room / night',
);

void main() {
  test('Quote includes adults, children and extras without sending trusted unit prices', () {
    final quote = TourQuote(
      tourId: 2,
      departure: departure,
      adults: 2,
      childAges: [2, 17],
      extras: [extra],
      quantities: {extra.key: 1},
      promotion: {'promoCode': 'SAVE10', 'discountPercent': 10},
    );
    expect(quote.validate(), isNull);
    expect(quote.subtotal, 5500);
    expect(quote.discount, 550);
    expect(quote.total, 4950);
    final body = quote.bookingRequest(
      name: ' Guest ',
      phone: '0901234567',
      email: 'guest@example.com',
      paymentMethod: 'BankTransfer',
    );
    expect(body['totalPassengers'], 4);
    expect(body['childAges'], [2, 17]);
    expect(body['details'], [
      {'tourId': 2, 'quantity': 4},
      {'serviceItemId': 12, 'quantity': 1},
    ]);
    expect(body.containsKey('totalAmount'), isFalse);
  });
  test('Missing ages, invalid ages, insufficient seats and removed extras are rejected', () {
    for (final ages in <List<int?>>[
      [null],
      [1],
      [18],
    ]) {
      final quote = TourQuote(
        tourId: 2,
        departure: departure,
        adults: 1,
        childAges: ages,
      );
      expect(quote.validate(), isNotNull);
      expect(
        () => quote.bookingRequest(
          name: '',
          phone: '',
          email: '',
          paymentMethod: 'BankTransfer',
        ),
        throwsFormatException,
      );
    }
    expect(
      TourQuote(
        tourId: 2,
        departure: departure,
        adults: 9,
        childAges: [],
      ).validate(),
      isNotNull,
    );
    expect(
      TourQuote(
        tourId: 2,
        departure: departure,
        adults: 1,
        childAges: [],
        extras: [extra],
        quantities: {extra.key: 3},
      ).validate(),
      isNotNull,
    );
    expect(
      TourQuote(
        tourId: 2,
        departure: departure,
        adults: 1,
        childAges: [],
        quantities: {'service:99': 1},
      ).validate(),
      isNotNull,
    );
  });
  test('Discount cannot make the booking balance negative', () {
    expect(
      TourQuote(
        tourId: 2,
        departure: departure,
        adults: 1,
        childAges: [],
        promotion: {'discountAmount': 5000},
      ).total,
      0,
    );
  });

  testWidgets(
    'Resumed PayPal payment reports success only after the backend returns Paid',
    (tester) async {
      mobile(tester);
      final harness = PayPalHarness();
      await tester.pumpWidget(
        MaterialApp(
          home: BookingReceiptScreen(
            api: harness.api,
            bookingId: 9,
            startPayment: true,
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(harness.captures, 1);
      expect(find.text('Payment confirmed'), findsOneWidget);
      expect(find.text('Paid'), findsOneWidget);
      expect(harness.createdBookings, 0);
    },
  );

  testWidgets(
    'An unapproved PayPal order remains unpaid and can be retried on the same booking',
    (tester) async {
      mobile(tester);
      final harness = PayPalHarness(approved: false);
      await tester.pumpWidget(
        MaterialApp(
          home: BookingReceiptScreen(
            api: harness.api,
            bookingId: 9,
            startPayment: true,
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(harness.captures, 1);
      expect(find.text('Payment confirmed'), findsNothing);
      expect(find.text('Unpaid'), findsOneWidget);
      await tester.ensureVisible(find.text('Continue to PayPal Sandbox'));
      await tester.tap(find.text('Continue to PayPal Sandbox'));
      await tester.pumpAndSettle();
      expect(harness.captures, 2);
      expect(harness.createdBookings, 0);
      expect(find.text('Payment confirmed'), findsNothing);
    },
  );
  test(
    'PayPal URLs and callbacks cannot imply payment success by themselves',
    () {
      expect(
        sandboxApprovalUrl(
          'https://www.sandbox.paypal.com/checkoutnow?token=test',
        ),
        isTrue,
      );
      for (final value in [
        'http://www.sandbox.paypal.com',
        'https://www.sandbox.paypal.com.evil.example',
        'https://attacker@www.sandbox.paypal.com',
      ]) {
        expect(sandboxApprovalUrl(value), isFalse);
      }
      expect(
        paypalReturn(
          'http://localhost:5173/tours/payment-return?bookingId=9&token=x',
          9,
        ),
        PayPalReturn.approved,
      );
      expect(
        paypalReturn(
          'http://localhost:5173/tours/payment-return?bookingId=8&token=x',
          9,
        ),
        PayPalReturn.none,
      );
      expect(
        paypalReturn(
          'http://localhost:5173/tours/payment-return?bookingId=9&cancelled=1',
          9,
        ),
        PayPalReturn.cancelled,
      );
      expect(
        paypalReturn(
          'http://localhost:5173/tours/payment-return?bookingId=9',
          9,
        ),
        PayPalReturn.none,
      );
    },
  );
  test('Optional services are linked to the tour and filtered by date availability', () async {
    final calls = <String>[];
    final client = ApiClient(
      baseUrl: 'http://test/api',
      httpClient: MockClient((request) async {
        calls.add(request.url.toString());
        final Object data = switch (request.url.path) {
          '/api/tours/2/extras' => [
            {'serviceItemId': 12, 'providerId': 1},
            {'scheduleId': 4},
          ],
          '/api/services/1' => {
            'providerName': 'Hotel',
            'serviceType': 'Hotel',
            'items': [
              {
                'itemId': 12,
                'itemName': 'Linked room',
                'price': 100,
                'remainingQuantity': 2,
                'isAvailable': true,
              },
              {
                'itemId': 13,
                'itemName': 'Unlinked room',
                'price': 100,
                'remainingQuantity': 2,
                'isAvailable': true,
              },
            ],
          },
          '/api/schedules' => [
            {
              'scheduleId': 4,
              'vehicleName': 'Bus',
              'ticketPrice': 50,
              'remainingSeats': 0,
              'status': 'Running',
            },
          ],
          _ => [],
        };
        return http.Response(jsonEncode(data), 200);
      }),
    );
    final extras = await TourBookingApi(client).extras(2, '2027-03-06');
    expect(extras.map((e) => e.id), [12]);
    expect(calls.any((c) => c.contains('date=2027-03-06')), isTrue);
  });

  testWidgets(
    'Selecting a departure requests sign-in and returns to the same booking form',
    (tester) async {
      mobile(tester);
      final harness = BookingHarness(signedIn: false);
      await tester.pumpWidget(
        MaterialApp(
          home: TravelDetailScreen(
            api: harness.api,
            id: 2,
            isTour: true,
            initial: tour,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Select date & book'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Select date & book'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('login-username')), findsOneWidget);
      expect(harness.created, 0);
      await tester.enterText(find.byKey(const Key('login-username')), 'guest');
      await tester.enterText(
        find.byKey(const Key('login-password')),
        'test-password',
      );
      await tester.tap(find.text('Sign in and continue'));
      await tester.pumpAndSettle();
      expect(find.text('Complete your booking'), findsOneWidget);
      expect(harness.api.client.token, 'test-token');
      expect(find.text('Guest Traveler'), findsOneWidget);
      expect(harness.created, 0);
    },
  );
  testWidgets(
    'Booking is saved once; unpaid confirmation never reports payment success',
    (tester) async {
      mobile(tester);
      final harness = BookingHarness();
      await tester.pumpWidget(
        MaterialApp(
          home: TourBookingScreen(
            api: harness.api,
            tour: tour,
            departure: departure,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('booking-phone')));
      await tester.enterText(
        find.byKey(const Key('booking-phone')),
        '0901234567',
      );
      await tester.ensureVisible(find.byKey(const Key('booking-submit')));
      await tester.tap(find.byKey(const Key('booking-submit')));
      await tester.pumpAndSettle();
      expect(harness.created, 1);
      expect(harness.saved?['tourDepartureId'], 26);
      expect(harness.saved?['paymentMethod'], 'PayAfterConfirmation');
      expect(find.text('Your booking is saved'), findsOneWidget);
      expect(find.text('Payment confirmed'), findsNothing);
      expect(find.text('Unpaid'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'A lost create response blocks duplicate submission and directs the customer to saved bookings',
    (tester) async {
      mobile(tester);
      final harness = BookingHarness(loseResponse: true);
      await tester.pumpWidget(
        MaterialApp(
          home: TourBookingScreen(
            api: harness.api,
            tour: tour,
            departure: departure,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.byKey(const Key('booking-phone')));
      await tester.enterText(
        find.byKey(const Key('booking-phone')),
        '0901234567',
      );
      await tester.ensureVisible(find.byKey(const Key('booking-submit')));
      await tester.tap(find.byKey(const Key('booking-submit')));
      await tester.pumpAndSettle();
      expect(harness.created, 1);
      expect(
        find.text('Check My bookings before trying again'),
        findsOneWidget,
      );
      final button = tester.widget<FilledButton>(
        find.byKey(const Key('booking-submit')),
      );
      expect(button.onPressed, isNull);
    },
  );
}

void mobile(WidgetTester tester) {
  tester.view.physicalSize = const Size(390, 1100);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

class BookingHarness {
  BookingHarness({bool signedIn = true, this.loseResponse = false}) {
    api = KarnelApi(
      ApiClient(
        baseUrl: 'http://test/api',
        token: signedIn ? 'test-token' : null,
        httpClient: MockClient((request) async {
          Object data = {};
          final path = request.url.path;
          if (path == '/api/auth/login') {
            data = {'token': 'test-token', ...user};
          } else if (path == '/api/auth/me')
            data = user;
          else if (path == '/api/tours/2')
            data = tour;
          else if (path == '/api/tours/2/departures')
            data = [departure];
          else if (path == '/api/tours/2/extras')
            data = [];
          else if (path == '/api/payments/paypal/options')
            data = {'enabled': false};
          else if (path == '/api/bookings' && request.method == 'POST') {
            expect(request.headers['Authorization'], 'Bearer test-token');
            created++;
            saved = jsonDecode(request.body) as Map<String, dynamic>;
            if (loseResponse) throw http.ClientException('Connection lost');
            data = {'bookingId': 7, 'totalAmount': 2000};
          } else if (path == '/api/bookings/7') {
            data = {
              'bookingId': 7,
              'bookingCode': 'BK-TEST-7',
              'bookingStatus': 'Pending',
              'paymentStatus': 'Unpaid',
              'paymentMethod': 'PayAfterConfirmation',
              'totalAmount': 2000,
              'startDate': '2027-03-06',
              'totalPassengers': 2,
              'details': [],
            };
          }
          return http.Response(
            jsonEncode(data),
            200,
            headers: {'content-type': 'application/json'},
          );
        }),
      ),
    );
    if (signedIn) api.sessionUser = user;
  }
  static const user = <String, dynamic>{
    'userId': 1,
    'fullName': 'Guest Traveler',
    'email': 'guest@example.com',
  };
  final bool loseResponse;
  late KarnelApi api;
  int created = 0;
  Map<String, dynamic>? saved;
}

class PayPalHarness {
  PayPalHarness({bool approved = true}) {
    api = KarnelApi(
      ApiClient(
        baseUrl: 'http://test/api',
        token: 'test-token',
        httpClient: MockClient((request) async {
          final path = request.url.path;
          if (path == '/api/bookings' && request.method == 'POST') {
            createdBookings++;
          }
          if (path.endsWith('/capture')) {
            captures++;
            if (!approved) {
              return http.Response(
                '{"message":"The PayPal order has not been approved."}',
                409,
              );
            }
            paid = true;
            return http.Response(
              '{"paymentStatus":"Paid","bookingStatus":"Confirmed"}',
              200,
            );
          }
          if (path.endsWith('/order')) {
            return http.Response('{"resume":true,"amountUsd":1}', 200);
          }
          if (path == '/api/auth/me') {
            return http.Response('{"userId":1,"fullName":"Guest"}', 200);
          }
          return http.Response(
            jsonEncode({
              'bookingId': 9,
              'bookingCode': 'BK-TEST-9',
              'paymentMethod': 'PayPalSandbox',
              'paymentStatus': paid ? 'Paid' : 'Unpaid',
              'bookingStatus': paid ? 'Confirmed' : 'Pending',
              'totalAmount': 25000,
              'totalPassengers': 1,
              'startDate': '2027-03-06',
              'details': [],
            }),
            200,
          );
        }),
      ),
    );
  }
  late KarnelApi api;
  int captures = 0, createdBookings = 0;
  bool paid = false;
}
