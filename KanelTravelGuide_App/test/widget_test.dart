// Screen tests against a fake backend that follows KanelTravelGuide_BE/docs/api-endpoints.md.
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kaneltravelguide_app/main.dart';
import 'package:kaneltravelguide_app/services/api_client.dart';
import 'package:kaneltravelguide_app/services/karnel_api.dart';

class Call {
  Call(this.method, this.path, this.auth, this.body);

  final String method;
  final String path;
  final String? auth;
  final Object? body;
}

class Harness {
  Harness({this.token, this.failContacts = false}) {
    final mock = MockClient((request) async {
      final path = request.url.path.replaceFirst('/api', '');
      calls.add(Call(request.method, path, request.headers['Authorization'],
          request.body.isEmpty ? null : jsonDecode(request.body)));
      http.Response json(Object body, [int status = 200]) =>
          http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json'});

      if (path == '/contacts' && request.method == 'POST') {
        if (failContacts) return json({'message': 'Server is busy.'}, 500);
        return json({'contactId': 1, 'isResponded': false}, 201);
      }
      if (path == '/feedbacks' && request.method == 'POST') return json({'feedbackId': 5, 'isApproved': false}, 201);
      if (path == '/feedbacks/approved') {
        return json([
          {'feedbackId': 1, 'fullName': 'Anna', 'rating': 5, 'title': 'Golden Bridge', 'content': 'Beautiful.', 'createdAt': '2026-11-06T08:00:00'},
        ]);
      }
      if (path == '/notifications') {
        return json([
          {'notificationId': 1, 'title': 'Booking confirmed', 'message': 'BK-001 is confirmed.', 'notificationType': 'BOOKING', 'referenceId': 'BK-001', 'isRead': false, 'createdAt': '2026-11-08T08:00:00'},
          {'notificationId': 2, 'title': 'Autumn sale', 'message': '10% off.', 'notificationType': 'PROMOTION', 'referenceId': null, 'isRead': true, 'createdAt': '2026-11-07T08:00:00'},
        ]);
      }
      if (path.startsWith('/notifications/') && (path.endsWith('/read') || path.endsWith('/read-all'))) {
        return http.Response('', 204);
      }
      return json({'message': 'not found'}, 404);
    });
    api = KarnelApi(ApiClient(baseUrl: 'http://test/api', httpClient: mock, token: token));
  }

  final String? token;
  final bool failContacts;
  final calls = <Call>[];
  late final KarnelApi api;

  bool called(String method, String path) => calls.any((c) => c.method == method && c.path == path);
}

void useTallScreen(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

Future<void> openTab(WidgetTester tester, String label) async {
  await tester.tap(find.text(label));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('About screen shows the company and its services', (tester) async {
    useTallScreen(tester);
    await tester.pumpWidget(KarnelApp(api: Harness().api));
    await tester.pumpAndSettle();

    expect(find.text('About Karnel Travel Guide'), findsOneWidget);
    expect(find.text('Tours & combos'), findsOneWidget);
    expect(find.text('Why Choose Karnel Travel Guide'), findsOneWidget);
  });

  testWidgets('Contact: an empty form shows errors and sends nothing', (tester) async {
    useTallScreen(tester);
    final harness = Harness();
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Contact');

    await tester.tap(find.text('Send request'));
    await tester.pumpAndSettle();

    expect(find.text('Full name is required.'), findsOneWidget);
    expect(find.text('Email is required.'), findsOneWidget);
    expect(find.text('Message is required.'), findsOneWidget);
    expect(harness.called('POST', '/contacts'), isFalse);
  });

  testWidgets('Contact: a bad email is rejected', (tester) async {
    useTallScreen(tester);
    final harness = Harness();
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Contact');

    await tester.enterText(find.byKey(const Key('contact-fullName')), 'Nguyen Van A');
    await tester.enterText(find.byKey(const Key('contact-email')), 'abc');
    await tester.enterText(find.byKey(const Key('contact-message')), 'Hello');
    await tester.tap(find.text('Send request'));
    await tester.pumpAndSettle();

    expect(find.text('Email format is invalid.'), findsOneWidget);
    expect(harness.called('POST', '/contacts'), isFalse);
  });

  testWidgets('Contact: a valid form is sent to POST /contacts and cleared', (tester) async {
    useTallScreen(tester);
    final harness = Harness();
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Contact');

    await tester.enterText(find.byKey(const Key('contact-fullName')), '  Nguyen Van A ');
    await tester.enterText(find.byKey(const Key('contact-email')), 'a@example.com');
    await tester.enterText(find.byKey(const Key('contact-message')), 'Tour price?');
    await tester.tap(find.text('Send request'));
    await tester.pumpAndSettle();

    final call = harness.calls.lastWhere((c) => c.method == 'POST' && c.path == '/contacts');
    final body = call.body as Map<String, dynamic>;
    expect(body['fullName'], 'Nguyen Van A');
    expect(body['phone'], isNull);
    expect(body['subject'], isNull);
    expect(body['message'], 'Tour price?');
    expect(find.textContaining('Thank you! We have received your request'), findsOneWidget);
    expect(tester.widget<TextFormField>(find.byKey(const Key('contact-fullName'))).controller!.text, isEmpty);
  });

  testWidgets('Contact: a server error is shown and the input is kept', (tester) async {
    useTallScreen(tester);
    final harness = Harness(failContacts: true);
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Contact');

    await tester.enterText(find.byKey(const Key('contact-fullName')), 'Nguyen Van A');
    await tester.enterText(find.byKey(const Key('contact-email')), 'a@example.com');
    await tester.enterText(find.byKey(const Key('contact-message')), 'Hello');
    await tester.tap(find.text('Send request'));
    await tester.pumpAndSettle();

    expect(find.text('Server is busy.'), findsOneWidget);
    expect(tester.widget<TextFormField>(find.byKey(const Key('contact-fullName'))).controller!.text, 'Nguyen Van A');
  });

  testWidgets('Feedback: lists approved feedback from GET /feedbacks/approved', (tester) async {
    useTallScreen(tester);
    await tester.pumpWidget(KarnelApp(api: Harness().api));
    await openTab(tester, 'Feedback');

    expect(find.text('Golden Bridge  ·  5 ★'), findsOneWidget);
    expect(find.textContaining('Beautiful.'), findsOneWidget);
  });

  testWidgets('Feedback: content is required', (tester) async {
    useTallScreen(tester);
    final harness = Harness();
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Feedback');

    await tester.enterText(find.byKey(const Key('fb-fullName')), 'Nguyen Van A');
    await tester.enterText(find.byKey(const Key('fb-email')), 'a@example.com');
    await tester.tap(find.text('Send feedback'));
    await tester.pumpAndSettle();

    expect(find.text('Feedback is required.'), findsOneWidget);
    expect(harness.called('POST', '/feedbacks'), isFalse);
  });

  testWidgets('Feedback: sends rating, can clear it, and waits for approval', (tester) async {
    useTallScreen(tester);
    final harness = Harness();
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Feedback');

    await tester.enterText(find.byKey(const Key('fb-fullName')), 'Nguyen Van A');
    await tester.enterText(find.byKey(const Key('fb-email')), 'a@example.com');
    await tester.enterText(find.byKey(const Key('fb-content')), 'Great trip.');
    await tester.tap(find.byKey(const Key('rating-4')));
    await tester.pump();
    await tester.tap(find.text('Send feedback'));
    await tester.pumpAndSettle();

    final body = harness.calls.lastWhere((c) => c.method == 'POST' && c.path == '/feedbacks').body as Map<String, dynamic>;
    expect(body['rating'], 4);
    expect(body['title'], isNull);
    expect(body['content'], 'Great trip.');
    expect(find.textContaining('displayed once an administrator approves it'), findsOneWidget);

    // Tapping the selected star again clears the optional rating.
    await tester.tap(find.byKey(const Key('rating-2')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('rating-2')));
    await tester.pump();
    await tester.enterText(find.byKey(const Key('fb-fullName')), 'B');
    await tester.enterText(find.byKey(const Key('fb-email')), 'b@example.com');
    await tester.enterText(find.byKey(const Key('fb-content')), 'Again.');
    await tester.tap(find.text('Send feedback'));
    await tester.pumpAndSettle();
    final second = harness.calls.lastWhere((c) => c.method == 'POST' && c.path == '/feedbacks').body as Map<String, dynamic>;
    expect(second['rating'], isNull);
  });

  testWidgets('Notifications: asks to sign in when there is no token', (tester) async {
    useTallScreen(tester);
    final harness = Harness();
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Alerts');

    expect(find.text('Please sign in to see your notifications.'), findsOneWidget);
    expect(harness.called('GET', '/notifications'), isFalse);
  });

  testWidgets('Notifications: loads with the bearer token, filters and marks as read', (tester) async {
    useTallScreen(tester);
    final harness = Harness(token: 'JWT123');
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await tester.pumpAndSettle();

    expect(harness.calls.firstWhere((c) => c.path == '/notifications').auth, 'Bearer JWT123');

    await openTab(tester, 'Alerts');
    expect(find.text('You have 1 unread notification.'), findsOneWidget);
    expect(find.text('Booking confirmed'), findsOneWidget);
    expect(find.text('Autumn sale'), findsOneWidget);

    await tester.tap(find.widgetWithText(ChoiceChip, 'Promotion'));
    await tester.pumpAndSettle();
    expect(find.text('Booking confirmed'), findsNothing);
    expect(find.text('Autumn sale'), findsOneWidget);

    await tester.tap(find.widgetWithText(ChoiceChip, 'All'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mark as read'));
    await tester.pumpAndSettle();
    expect(harness.called('PUT', '/notifications/1/read'), isTrue);
  });

  testWidgets('Notifications: "Mark all as read" calls PUT /notifications/read-all', (tester) async {
    useTallScreen(tester);
    final harness = Harness(token: 'JWT123');
    await tester.pumpWidget(KarnelApp(api: harness.api));
    await openTab(tester, 'Alerts');

    await tester.tap(find.text('Mark all as read'));
    await tester.pumpAndSettle();

    expect(harness.calls.where((c) => c.method == 'PUT').map((c) => c.path), ['/notifications/read-all']);
  });
}
