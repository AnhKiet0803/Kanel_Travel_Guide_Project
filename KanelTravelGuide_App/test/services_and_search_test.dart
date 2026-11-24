// Unit and widget tests for Services (CN06, CN07, CN08) and Search (CN10) screens
// Maintained by Nguyễn Công Tiến (recca279)
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kaneltravelguide_app/models/models.dart';
import 'package:kaneltravelguide_app/screens/search_screen.dart';
import 'package:kaneltravelguide_app/screens/service_detail_screen.dart';
import 'package:kaneltravelguide_app/screens/services_screen.dart';
import 'package:kaneltravelguide_app/services/api_client.dart';
import 'package:kaneltravelguide_app/services/karnel_api.dart';

void useTallScreen(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

void main() {
  late KarnelApi api;

  setUp(() {
    final mock = MockClient((request) async {
      final path = request.url.path.replaceFirst('/api', '');

      http.Response json(Object body, [int status = 200]) =>
          http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json'});

      if (path.startsWith('/services/1')) {
        return json({
          'providerId': 1,
          'providerName': 'Karnel Beach Luxury Hotel',
          'serviceType': 'Hotel',
          'locationId': 1,
          'locationName': 'Da Nang',
          'address': '128 Vo Nguyen Giap, Da Nang',
          'phone': '02363911888',
          'website': 'https://karnel.local',
          'starRating': 5,
          'minPrice': 1850000,
          'description': 'A premier beachfront luxury hotel.',
          'items': [
            {'itemId': 101, 'itemName': 'Deluxe Ocean View', 'capacity': 2, 'price': 1850000, 'isAvailable': true},
          ]
        });
      }

      if (path.startsWith('/services')) {
        return json([
          {
            'providerId': 1,
            'providerName': 'Karnel Beach Luxury Hotel',
            'serviceType': 'Hotel',
            'locationId': 1,
            'locationName': 'Da Nang',
            'address': '128 Vo Nguyen Giap, Da Nang',
            'starRating': 5,
            'minPrice': 1850000,
          },
          {
            'providerId': 2,
            'providerName': 'Madame Lan Restaurant',
            'serviceType': 'Restaurant',
            'locationId': 1,
            'locationName': 'Da Nang',
            'address': '04 Bach Dang, Da Nang',
            'starRating': 5,
            'minPrice': 150000,
          }
        ]);
      }

      if (path.startsWith('/search')) {
        return json({
          'spots': [
            {'spotId': 1, 'spotName': 'My Khe Beach', 'locationName': 'Da Nang'},
          ],
          'tours': [
            {'tourId': 10, 'tourName': 'Ba Na Hills Full Day', 'price': 850000, 'duration': '8 hours'},
          ],
          'services': [
            {
              'providerId': 1,
              'providerName': 'Karnel Beach Luxury Hotel',
              'serviceType': 'Hotel',
              'minPrice': 1850000,
            }
          ]
        });
      }

      return json({'message': 'Not found'}, 404);
    });

    api = KarnelApi(ApiClient(baseUrl: 'http://test/api', httpClient: mock));
  });

  testWidgets('ServicesScreen lists items and displays category filter chips', (tester) async {
    useTallScreen(tester);
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: ServicesScreen(api: api))));
    await tester.pumpAndSettle();

    expect(find.text('Stay & Dining Services'), findsOneWidget);
    expect(find.text('All'), findsOneWidget);
    expect(find.text('Hotels'), findsOneWidget);
    expect(find.text('Dining'), findsOneWidget);
    expect(find.text('Resorts'), findsOneWidget);

    expect(find.text('Karnel Beach Luxury Hotel'), findsOneWidget);
    expect(find.text('Madame Lan Restaurant'), findsOneWidget);
  });

  testWidgets('ServiceDetailScreen displays provider details and rooms', (tester) async {
    await tester.pumpWidget(MaterialApp(home: ServiceDetailScreen(api: api, serviceId: 1)));
    await tester.pumpAndSettle();

    expect(find.text('Karnel Beach Luxury Hotel'), findsAtLeastNWidgets(1));
    expect(find.text('128 Vo Nguyen Giap, Da Nang'), findsOneWidget);
    expect(find.text('02363911888'), findsOneWidget);
    expect(find.text('Deluxe Ocean View'), findsOneWidget);
    expect(find.text('Available'), findsOneWidget);
  });

  testWidgets('SearchScreen searches and displays categorized results', (tester) async {
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: SearchScreen(api: api))));
    await tester.pumpAndSettle();

    expect(find.text('Travel Search'), findsOneWidget);
    expect(find.text('Suggestions'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('search-query-field')), 'Da Nang');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();

    expect(find.textContaining('Stays & Dining'), findsOneWidget);
    expect(find.textContaining('Tours'), findsOneWidget);
    expect(find.textContaining('Attractions'), findsOneWidget);
    expect(find.text('Ba Na Hills Full Day'), findsOneWidget);
    expect(find.text('My Khe Beach'), findsOneWidget);
  });
}
