import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kaneltravelguide_app/screens/home_screen.dart';
import 'package:kaneltravelguide_app/services/api_client.dart';
import 'package:kaneltravelguide_app/services/karnel_api.dart';

KarnelApi homeApi({bool fail = false}) => KarnelApi(ApiClient(
    baseUrl: 'http://test/api',
    httpClient: MockClient((request) async {
      if (fail) return http.Response('{"message":"Backend unavailable"}', 503);
      final data = switch (request.url.path) {
        '/api/tourist-spots' => [
            {
              'spotId': 3,
              'spotName': 'Hoi An Ancient Town',
              'locationName': 'Quang Nam',
              'isFeatured': true
            }
          ],
        '/api/tours' => [
            {
              'tourId': 2,
              'spotId': 3,
              'tourName': 'Hanoi - Hoi An by Night',
              'duration': '3 days 2 nights',
              'standardPrice': 890000,
              'salePrice': 756500,
              'isFeatured': true,
              'reviewCount': 2,
              'averageRating': 4.5
            }
          ],
        '/api/services' => [],
        '/api/promotions' => [],
        _ => [],
      };
      return http.Response(jsonEncode(data), 200,
          headers: {'content-type': 'application/json'});
    })));

void main() {
  testWidgets(
      'Home shows API destinations and actual tour prices at mobile width',
      (tester) async {
    tester.view.physicalSize = const Size(390, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: HomeScreen(api: homeApi()))));
    await tester.pumpAndSettle();
    expect(find.text('Go somewhere\nunforgettable.'), findsOneWidget);
    expect(find.text('Hoi An Ancient Town'), findsOneWidget);
    expect(find.text('Hanoi - Hoi An by Night'), findsOneWidget);
    expect(find.text('756.500 ₫'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('Tours').first);
    await tester.pumpAndSettle();
    expect(find.text('Explore tours'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
  testWidgets('Home reports API failure without substituting invented trips',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: Scaffold(body: HomeScreen(api: homeApi(fail: true)))));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
        find.text('We could not load the latest trips'), 250);
    expect(find.text('Backend unavailable'), findsOneWidget);
    expect(find.text('Hanoi - Hoi An by Night'), findsNothing);
    expect(find.text('Try again'), findsOneWidget);
  });
  test('API image paths use the configured backend origin', () {
    final client = ApiClient(baseUrl: 'http://10.0.2.2:5011/api');
    expect(client.imageUrl('/api/tourist-spots/3/thumbnail'),
        'http://10.0.2.2:5011/api/tourist-spots/3/thumbnail');
    expect(client.imageUrl('javascript:alert(1)'), isNull);
  });
}
