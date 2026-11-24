import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/home_catalog.dart';
import '../models/models.dart';
import '../services/karnel_api.dart';
import '../widgets/travel_ui.dart';
import 'contact_screen.dart';
import 'search_screen.dart';
import 'service_detail_screen.dart';
import 'services_screen.dart';
import 'travel_detail_screen.dart';

const _navy = Color(0xFF164E52);
const _teal = Color(0xFF087F78);
const _muted = Color(0xFF526C68);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api});
  final KarnelApi api;
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HomeCatalog? _data;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await widget.api.getHomeCatalog();
      if (mounted) {
        setState(() {
          _data = data;
          _loading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _loading = false;
        });
      }
    }
  }

  void _open(Widget page) {
    final title = switch (page) {
      ServicesScreen() => 'Stay & Dining',
      SearchScreen() => 'Search',
      ContactScreen() => 'Contact Karnel Travels',
      _ => null,
    };
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => title == null
            ? page
            : Scaffold(
                appBar: AppBar(title: Text(title)),
                body: SafeArea(child: page),
              ),
      ),
    );
  }

  void _search([String? query]) =>
      _open(SearchScreen(api: widget.api, initialQuery: query));
  String? _spotImage(Map<String, dynamic> spot) =>
      widget.api.client.imageUrl(spot['thumbnailUrl']);
  String? _tourImage(Map<String, dynamic> tour) {
    for (final spot in _data?.spots ?? <Map<String, dynamic>>[]) {
      if (spot['spotId'] == tour['spotId']) return _spotImage(spot);
    }
    return null;
  }

  void _tour(Map<String, dynamic> tour) => _open(
    TravelDetailScreen(
      api: widget.api,
      id: (tour['tourId'] as num).toInt(),
      isTour: true,
      initial: tour,
      imageUrl: _tourImage(tour),
    ),
  );
  void _spot(Map<String, dynamic> spot) => _open(
    TravelDetailScreen(
      api: widget.api,
      id: (spot['spotId'] as num).toInt(),
      isTour: false,
      initial: spot,
      imageUrl: _spotImage(spot),
    ),
  );

  void _all(bool tours) {
    if (_data == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _loading
                ? 'Loading the latest trips…'
                : 'Please retry loading the latest trips.',
          ),
        ),
      );
      return;
    }
    final records = tours ? _data?.tours ?? [] : _data?.spots ?? [];
    _open(
      Scaffold(
        appBar: AppBar(
          title: Text(tours ? 'Explore tours' : 'Explore destinations'),
        ),
        body: ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: records.length,
          separatorBuilder: (_, _) => const SizedBox(height: 16),
          itemBuilder: (_, index) => tours
              ? _tourCard(records[index], wide: true)
              : _destinationCard(records[index], wide: true),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final spots = _data?.featuredSpots ?? [];
    final tours = _data?.featuredTours ?? [];
    final stays = (_data?.services ?? [])
        .where(
          (s) => s['serviceType'] == 'Hotel' || s['serviceType'] == 'Resort',
        )
        .take(5)
        .toList();
    return ColoredBox(
      color: const Color(0xFFFFFCF5),
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1040),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'A LITTLE WANDER. A LOT OF WONDER.',
                        style: TextStyle(
                          color: _teal,
                          fontSize: 10,
                          letterSpacing: 1.8,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 315,
                        child: Stack(
                          children: [
                            Positioned(
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 24,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    TravelImage(
                                      url: spots.isNotEmpty
                                          ? _spotImage(spots.first)
                                          : null,
                                    ),
                                    const DecoratedBox(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: [
                                            Color(0xF2FFFAE8),
                                            Color(0x30F3FFF6),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(24),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withValues(
                                                alpha: .16,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(20),
                                            ),
                                            child: const Text(
                                              'DISCOVER VIETNAM',
                                              style: TextStyle(
                                                color: _navy,
                                                fontSize: 10,
                                                letterSpacing: 1.3,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 16),
                                          const FittedBox(
                                            fit: BoxFit.scaleDown,
                                            alignment: Alignment.centerLeft,
                                            child: Text(
                                              'Go somewhere\nunforgettable.',
                                              softWrap: false,
                                              style: TextStyle(
                                                fontSize: 32,
                                                height: 1.12,
                                                letterSpacing: -.8,
                                                color: _navy,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 13),
                                          const Text(
                                            'Beautiful places. Local experiences.\nYour next chapter starts here.',
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: Color(0xFF365F59),
                                              height: 1.6,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            Positioned(
                              left: 14,
                              right: 14,
                              bottom: 0,
                              child: Material(
                                color: Colors.white,
                                elevation: 5,
                                shadowColor: _navy.withValues(alpha: .14),
                                borderRadius: BorderRadius.circular(18),
                                child: InkWell(
                                  key: const Key('home-search'),
                                  onTap: _search,
                                  borderRadius: BorderRadius.circular(18),
                                  child: const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.search_rounded,
                                          color: _teal,
                                          size: 27,
                                        ),
                                        SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Where would you like to go?',
                                                style: TextStyle(
                                                  color: _navy,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                              SizedBox(height: 3),
                                              Text(
                                                'Destinations, tours & places to stay',
                                                style: TextStyle(
                                                  color: _muted,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Icon(
                                          Icons.arrow_forward_rounded,
                                          color: _teal,
                                          size: 20,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          _category(
                            Icons.explore_outlined,
                            'Tours',
                            const Color(0xFFD9F5DF),
                            () => _all(true),
                          ),
                          _category(
                            Icons.hotel_outlined,
                            'Hotels',
                            const Color(0xFFDDF2FF),
                            () => _open(
                              ServicesScreen(
                                api: widget.api,
                                initialType: 'Hotel',
                              ),
                            ),
                          ),
                          _category(
                            Icons.restaurant_outlined,
                            'Dining',
                            const Color(0xFFFFE7C6),
                            () => _open(
                              ServicesScreen(
                                api: widget.api,
                                initialType: 'Restaurant',
                              ),
                            ),
                          ),
                          _category(
                            Icons.beach_access_outlined,
                            'Resorts',
                            const Color(0xFFEAF4CF),
                            () => _open(
                              ServicesScreen(
                                api: widget.api,
                                initialType: 'Resort',
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (_loading)
                        const Padding(
                          padding: EdgeInsets.all(28),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      if (_error != null)
                        Container(
                          margin: const EdgeInsets.only(top: 24),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'We could not load the latest trips',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Text(_error!),
                              TextButton.icon(
                                onPressed: _load,
                                icon: const Icon(Icons.refresh),
                                label: const Text('Try again'),
                              ),
                            ],
                          ),
                        ),
                      if (_data != null) ...[
                        const SizedBox(height: 28),
                        _heading(
                          'Find your kind of escape',
                          'DESTINATIONS TO FALL FOR',
                          () => _all(false),
                        ),
                        if (spots.isEmpty)
                          const Text('New destinations are on their way.')
                        else
                          SizedBox(
                            height: 215,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: spots.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(width: 14),
                              itemBuilder: (_, i) => _destinationCard(spots[i]),
                            ),
                          ),
                        const SizedBox(height: 30),
                        _heading(
                          'Journeys worth taking',
                          'CURATED FOR YOUR NEXT ADVENTURE',
                          () => _all(true),
                        ),
                        if (tours.isEmpty)
                          const Text(
                            'Featured tours will appear here when published.',
                          )
                        else
                          SizedBox(
                            height: 306,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: tours.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(width: 14),
                              itemBuilder: (_, i) => _tourCard(tours[i]),
                            ),
                          ),
                        if (_data!.promotions.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          _offer(_data!.promotions.first),
                        ],
                        if (stays.isNotEmpty) ...[
                          const SizedBox(height: 30),
                          _heading(
                            'Stay somewhere special',
                            'CHECK IN. SWITCH OFF.',
                            () => _open(ServicesScreen(api: widget.api)),
                          ),
                          for (final stay in stays.take(3)) _stay(stay),
                        ],
                      ],
                      const SizedBox(height: 26),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE7F7DF),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.support_agent_rounded,
                              color: _teal,
                              size: 28,
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'A little help, a better trip.',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: _navy,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Not sure where to start? Tell us what you love and let us help you plan.',
                              style: TextStyle(
                                color: _muted,
                                fontSize: 13,
                                height: 1.6,
                              ),
                            ),
                            TextButton(
                              onPressed: () =>
                                  _open(ContactScreen(api: widget.api)),
                              child: const Text('Talk to Karnel Travels →'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),
                      const Center(
                        child: Text(
                          'MADE FOR THE WAY YOU TRAVEL',
                          style: TextStyle(
                            color: _muted,
                            fontSize: 10,
                            letterSpacing: 1.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _category(
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) => Expanded(
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, color: _navy, size: 27),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: _navy,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _heading(String title, String eyebrow, VoidCallback onAll) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: const TextStyle(
            fontSize: 9,
            color: _teal,
            letterSpacing: 1.5,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: _navy,
                  fontSize: 21,
                  letterSpacing: -.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            TextButton(
              onPressed: onAll,
              child: const Text('View all', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ],
    ),
  );

  Widget _destinationCard(Map<String, dynamic> spot, {bool wide = false}) =>
      SizedBox(
        width: wide ? double.infinity : 174,
        height: 215,
        child: Material(
          borderRadius: BorderRadius.circular(20),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => _spot(spot),
            child: Stack(
              fit: StackFit.expand,
              children: [
                TravelImage(url: _spotImage(spot)),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xB3165658)],
                    ),
                  ),
                ),
                Positioned(
                  left: 15,
                  right: 15,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        spot['spotName']?.toString() ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        spot['locationName']?.toString() ?? 'Vietnam',
                        style: const TextStyle(
                          color: Color(0xFFDBEAEE),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );

  Widget _tourCard(Map<String, dynamic> tour, {bool wide = false}) {
    final count = (tour['reviewCount'] as num?)?.toInt() ?? 0;
    final rating = tour['averageRating'] as num?;
    return SizedBox(
      width: wide ? double.infinity : 260,
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFE5ECEE)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _tour(tour),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 148,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    TravelImage(url: _tourImage(tour)),
                    Positioned(
                      left: 12,
                      top: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          tour['duration']?.toString() ?? 'Guided tour',
                          style: const TextStyle(
                            color: _navy,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tour['tourName']?.toString() ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _navy,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          size: 16,
                          color: Color(0xFFF3A437),
                        ),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            count > 0 && rating != null
                                ? '${rating.toStringAsFixed(1)} ($count reviews)'
                                : 'Be the first to review',
                            style: const TextStyle(color: _muted, fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'From / adult',
                                style: TextStyle(fontSize: 10, color: _muted),
                              ),
                              Text(
                                travelMoney(
                                  tour['salePrice'] ?? tour['standardPrice'],
                                ),
                                style: const TextStyle(
                                  color: _teal,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.arrow_circle_right_outlined,
                          color: _teal,
                          size: 27,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _offer(Map<String, dynamic> offer) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFFFFE79C), Color(0xFFFFD9B5)],
      ),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'A LITTLE EXTRA FOR YOUR NEXT TRIP',
          style: TextStyle(
            color: Color(0xFF93421B),
            fontSize: 9,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 9),
        Text(
          offer['title']?.toString() ?? 'Travel offer',
          style: const TextStyle(
            color: _navy,
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          offer['discountPercent'] != null
              ? 'Save ${offer['discountPercent']}% on eligible bookings.'
              : 'Save ${travelMoney(offer['discountAmount'])} on eligible bookings.',
          style: const TextStyle(color: Color(0xFF6E4D2F), fontSize: 12),
        ),
        if ((offer['promoCode']?.toString() ?? '').isNotEmpty)
          TextButton.icon(
            onPressed: () async {
              await Clipboard.setData(
                ClipboardData(text: offer['promoCode'].toString()),
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Promo code copied. Check offer conditions when booking.',
                    ),
                  ),
                );
              }
            },
            icon: const Icon(Icons.copy_rounded, size: 15, color: _navy),
            label: Text(
              'Copy ${offer['promoCode']}',
              style: const TextStyle(color: _navy),
            ),
          ),
      ],
    ),
  );

  Widget _stay(Map<String, dynamic> stay) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _open(
          ServiceDetailScreen(
            api: widget.api,
            serviceId: (stay['providerId'] as num).toInt(),
            initialProvider: ServiceProvider.fromJson(stay),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(11),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 78,
                  height: 82,
                  child: TravelImage(
                    url: widget.api.client.imageUrl(stay['imageUrl']),
                  ),
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stay['serviceType']?.toString().toUpperCase() ?? '',
                      style: const TextStyle(
                        color: _teal,
                        fontSize: 9,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      stay['providerName']?.toString() ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _navy,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      stay['locationName']?.toString() ?? '',
                      style: const TextStyle(color: _muted, fontSize: 11),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      travelMoney(stay['minPrice']),
                      style: const TextStyle(
                        color: _teal,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right, color: _muted),
            ],
          ),
        ),
      ),
    ),
  );
}
