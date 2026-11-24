// CN03: About Us. The content is the same as the website's About page.
import 'package:flutter/material.dart';

class _Service {
  const _Service(this.icon, this.title, this.text);

  final IconData icon;
  final String title;
  final String text;
}

const List<_Service> _services = [
  _Service(Icons.explore_outlined, 'Tours & combos',
      'All-inclusive tour packages and combos to popular destinations, with clear itineraries and special prices.'),
  _Service(Icons.directions_bus_outlined, 'Intercity transport',
      'Limousine, sleeper and tourist coach routes connecting cities and provinces, with transparent schedules and fares.'),
  _Service(Icons.hotel_outlined, 'Hotels',
      'A hotel directory by area, star rating and price range, so you can compare and choose with ease.'),
  _Service(Icons.restaurant_outlined, 'Restaurants',
      'Restaurant and local specialty recommendations, with addresses and indicative prices.'),
  _Service(Icons.park_outlined, 'Resorts', 'Resorts and retreats with room types, capacity and availability.'),
];

const List<String> _reasons = [
  'All travel, transport and accommodation information in one place.',
  'Search and filter by location, price, quality and availability.',
  'Send tour and transport booking requests online and track your orders.',
  'Our advisory team is ready to help through the Contact Us screen.',
];

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('About Karnel Travels', style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.secondary)),
        const SizedBox(height: 4),
        Text('About Karnel Travel Guide', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text(
          'Karnel Travels is a travel company offering sightseeing tours, intercity transport, hotels, '
          'restaurants and resorts. The Karnel Travel Guide app helps you find information and send '
          'service booking requests conveniently.',
        ),
        const SizedBox(height: 24),
        Text('Our Services', style: theme.textTheme.titleLarge),
        const SizedBox(height: 8),
        for (final service in _services)
          Card(
            child: ListTile(
              leading: Icon(service.icon, color: theme.colorScheme.secondary),
              title: Text(service.title, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(service.text),
            ),
          ),
        const SizedBox(height: 24),
        Text('Why Choose Karnel Travel Guide', style: theme.textTheme.titleLarge),
        const SizedBox(height: 8),
        for (final reason in _reasons)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.check_circle_outline, size: 20, color: theme.colorScheme.secondary),
                const SizedBox(width: 8),
                Expanded(child: Text(reason)),
              ],
            ),
          ),
      ],
    );
  }
}
