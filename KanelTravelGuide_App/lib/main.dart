// Temporary app shell: a bottom navigation bar with the screens that exist so far
// (About, Contact, Feedback, Notifications). The shared foundation (theme, navigation, sign-in) is
// Giáp's task; when it lands, replace this shell and keep the screens in lib/screens.
import 'package:flutter/material.dart';

import 'screens/about_screen.dart';
import 'screens/contact_screen.dart';
import 'screens/feedback_screen.dart';
import 'screens/notifications_screen.dart';
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
      appBar: AppBar(title: const Text('Karnel Travel Guide')),
      body: SafeArea(
        // IndexedStack keeps each screen alive, so a half-filled form survives switching tabs.
        child: IndexedStack(
          index: _index,
          children: [
            const AboutScreen(),
            ContactScreen(api: widget.api),
            FeedbackScreen(api: widget.api),
            NotificationsScreen(api: widget.api),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.info_outline), selectedIcon: Icon(Icons.info), label: 'About'),
          NavigationDestination(icon: Icon(Icons.mail_outline), selectedIcon: Icon(Icons.mail), label: 'Contact'),
          NavigationDestination(icon: Icon(Icons.star_border), selectedIcon: Icon(Icons.star), label: 'Feedback'),
          NavigationDestination(
              icon: Icon(Icons.notifications_none), selectedIcon: Icon(Icons.notifications), label: 'Alerts'),
        ],
      ),
    );
  }
}
