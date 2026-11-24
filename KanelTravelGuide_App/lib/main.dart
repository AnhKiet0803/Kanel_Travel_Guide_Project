// App shell: a bottom navigation bar with the screens for the mobile app
// Includes Stays & Search (Tiến), About, Contact, Feedback, Notifications (Dũng), and Auth/Theme (Giáp)
import 'dart:ui';

import 'package:flutter/material.dart';

import 'screens/about_screen.dart';
import 'screens/home_screen.dart';
import 'screens/booking_receipt_screen.dart';
import 'screens/sign_in_screen.dart';
import 'screens/contact_screen.dart';
import 'screens/feedback_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/search_screen.dart';
import 'screens/services_screen.dart';
import 'services/api_client.dart';
import 'services/karnel_api.dart';

void main() {
  runApp(KarnelApp(api: KarnelApi(ApiClient())));
}

class KarnelApp extends StatelessWidget {
  const KarnelApp({super.key, required this.api});

  final KarnelApi api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Karnel Travel Guide',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        // Same palette as the website (variables.css): navy primary, teal secondary, orange accent.
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF123B5D),
          secondary: const Color(0xFF19A7A0),
          tertiary: const Color(0xFFF4A340),
        ),
        useMaterial3: true,
      ),
      scrollBehavior: const MaterialScrollBehavior().copyWith(
        dragDevices: {
          PointerDeviceKind.mouse,
          PointerDeviceKind.touch,
          PointerDeviceKind.stylus,
          PointerDeviceKind.trackpad,
        },
      ),
      home: HomeShell(api: api),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.api});

  final KarnelApi api;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Row(
          children: [
            Icon(Icons.travel_explore, color: Color(0xFF078C88)),
            SizedBox(width: 9),
            Text(
              'Karnel Travels',
              style: TextStyle(
                color: Color(0xFF123B5D),
                fontWeight: FontWeight.w800,
                fontSize: 20,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'My bookings',
            icon: const Icon(Icons.receipt_long_outlined),
            onPressed: () async {
              if (!await requireTourSignIn(context, widget.api) ||
                  !context.mounted) {
                return;
              }
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => MyBookingsScreen(api: widget.api),
                ),
              );
            },
          ),
          IconButton(
            tooltip: 'About Karnel Travels',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => Scaffold(
                  appBar: AppBar(title: const Text('About Karnel Travels')),
                  body: const SafeArea(child: AboutScreen()),
                ),
              ),
            ),
            icon: const Icon(Icons.info_outline),
          ),
        ],
      ),
      body: SafeArea(
        // IndexedStack keeps each screen alive, so a half-filled form survives switching tabs.
        child: IndexedStack(
          index: _index,
          children: [
            HomeScreen(api: widget.api),
            ServicesScreen(api: widget.api),
            SearchScreen(api: widget.api),
            ContactScreen(api: widget.api),
            FeedbackScreen(api: widget.api),
            NotificationsScreen(api: widget.api),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFD9F5DF),
        surfaceTintColor: Colors.transparent,
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.hotel_outlined),
            selectedIcon: Icon(Icons.hotel),
            label: 'Stays',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search),
            label: 'Search',
          ),
          NavigationDestination(
            icon: Icon(Icons.mail_outline),
            selectedIcon: Icon(Icons.mail),
            label: 'Contact',
          ),
          NavigationDestination(
            icon: Icon(Icons.star_border),
            selectedIcon: Icon(Icons.star),
            label: 'Feedback',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none),
            selectedIcon: Icon(Icons.notifications),
            label: 'Alerts',
          ),
        ],
      ),
    );
  }
}
