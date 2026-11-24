import 'package:flutter/material.dart';

import '../services/karnel_api.dart';
import 'contact_screen.dart';
import '../widgets/travel_ui.dart';
import 'sign_in_screen.dart';
import 'tour_booking_screen.dart';

class TravelDetailScreen extends StatefulWidget {
  const TravelDetailScreen({
    super.key,
    required this.api,
    required this.id,
    required this.isTour,
    required this.initial,
    this.imageUrl,
  });
  final KarnelApi api;
  final int id;
  final bool isTour;
  final Map<String, dynamic> initial;
  final String? imageUrl;
  @override
  State<TravelDetailScreen> createState() => _TravelDetailScreenState();
}

class _TravelDetailScreenState extends State<TravelDetailScreen> {
  Map<String, dynamic>? _record;
  List<Map<String, dynamic>> _departures = [];
  String? _error;
  bool _loading = true;
  bool _openingBooking = false;
  final _datesKey = GlobalKey();

  Future<void> _book(Map<String, dynamic> departure) async {
    if (_openingBooking || _record == null) return;
    setState(() => _openingBooking = true);
    try {
      if (!await requireTourSignIn(context, widget.api) || !mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => TourBookingScreen(
            api: widget.api,
            tour: _record!,
            departure: departure,
            imageUrl: widget.imageUrl,
          ),
        ),
      );
      if (mounted) await _load();
    } finally {
      if (mounted) setState(() => _openingBooking = false);
    }
  }

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
      final record = widget.isTour
          ? await widget.api.getTour(widget.id)
          : Map<String, dynamic>.from(
              await widget.api.client.get('/tourist-spots/${widget.id}') as Map,
            );
      final departures = widget.isTour
          ? await widget.api.getTourDepartures(widget.id)
          : <Map<String, dynamic>>[];
      if (mounted) {
        setState(() {
          _record = record;
          _departures = departures;
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

  String _date(Object? value) {
    final date = DateTime.tryParse(value?.toString() ?? '');
    return date == null
        ? ''
        : '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final record = _record ?? widget.initial;
    final title = (record[widget.isTour ? 'tourName' : 'spotName'] ?? '')
        .toString();
    final description =
        record[widget.isTour ? 'itineraryDetail' : 'detailedContent'] ??
        record['description'];
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.isTour ? 'Tour overview' : 'Destination',
          style: const TextStyle(fontSize: 17),
        ),
      ),
      bottomNavigationBar: widget.isTour
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: FilledButton.icon(
                  onPressed: _loading || _record == null
                      ? null
                      : () {
                          final datesContext = _datesKey.currentContext;
                          if (datesContext != null) {
                            Scrollable.ensureVisible(
                              datesContext,
                              duration: const Duration(milliseconds: 350),
                            );
                          }
                        },
                  icon: const Icon(Icons.calendar_month_outlined),
                  label: const Padding(
                    padding: EdgeInsets.all(12),
                    child: Text('See dates & prices'),
                  ),
                ),
              ),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: SizedBox(
                height: 230,
                child: TravelImage(url: widget.imageUrl),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              title,
              style: const TextStyle(
                color: Color(0xFF123B5D),
                fontSize: 26,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              (record[widget.isTour ? 'duration' : 'locationName'] ?? '')
                  .toString(),
              style: const TextStyle(color: Color(0xFF078C88), fontSize: 15),
            ),
            if (widget.isTour)
              Padding(
                padding: const EdgeInsets.only(top: 14),
                child: Text(
                  'From ${travelMoney(record['salePrice'] ?? record['standardPrice'])} / adult',
                  style: const TextStyle(
                    fontSize: 21,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF123B5D),
                  ),
                ),
              ),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (_error != null) ...[
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
              TextButton(onPressed: _load, child: const Text('Try again')),
            ],
            if (description is String && description.trim().isNotEmpty) ...[
              const SizedBox(height: 25),
              Text(
                widget.isTour ? 'Your itinerary' : 'Discover this destination',
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...description.split(RegExp(r'\n(?=Day\s+\d+\s*:)')).map((day) {
                final lines = day.split('\n');
                return widget.isTour
                    ? Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ExpansionTile(
                          title: Text(
                            lines.first,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                              child: Text(
                                lines.skip(1).join('\n\n'),
                                style: const TextStyle(height: 1.6),
                              ),
                            ),
                          ],
                        ),
                      )
                    : Text(
                        day,
                        style: const TextStyle(height: 1.7, fontSize: 15),
                      );
              }),
            ],
            if (widget.isTour && _record != null) ...[
              const SizedBox(height: 20),
              const Text(
                'The details that matter',
                style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              for (final entry in const {
                'meetingPoint': 'Meeting point',
                'endPoint': 'End point',
                'transportDescription': 'Transport',
                'accommodationDescription': 'Accommodation',
                'guideDescription': 'Guide',
                'mealsDescription': 'Meals',
                'includedServices': 'Included',
                'excludedServices': 'Not included',
              }.entries)
                if ((record[entry.key]?.toString() ?? '').isNotEmpty)
                  Card(
                    child: ExpansionTile(
                      title: Text(entry.value),
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                          child: Text(
                            record[entry.key].toString(),
                            style: const TextStyle(height: 1.6),
                          ),
                        ),
                      ],
                    ),
                  ),
              const SizedBox(height: 24),
              Text(
                'Dates & prices',
                key: _datesKey,
                style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Adults 18+ · Children 2–17. Fares are per traveler.',
                style: TextStyle(color: Color(0xFF6E7E89)),
              ),
              if (_departures.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 18),
                  child: Text('No upcoming departures have been published.'),
                ),
              for (final departure in _departures)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${_date(departure['departureDate'])} – ${_date(departure['returnDate'])}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${departure['seatsLeft']} seats left · ${departure['departureTime']?.toString().substring(0, 5) ?? 'Time to be confirmed'}',
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Adult ${travelMoney(departure['adultPrice'])}',
                          style: const TextStyle(
                            color: Color(0xFF078C88),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text('Child ${travelMoney(departure['childPrice'])}'),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed:
                                _openingBooking ||
                                    (departure['seatsLeft'] as num? ?? 0) <= 0
                                ? null
                                : () => _book(departure),
                            child: Text(
                              (departure['seatsLeft'] as num? ?? 0) > 0
                                  ? 'Select date & book'
                                  : 'Sold out',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => Scaffold(
                        appBar: AppBar(
                          title: const Text('Contact Karnel Travels'),
                        ),
                        body: SafeArea(child: ContactScreen(api: widget.api)),
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.support_agent),
                label: const Text('Ask about this tour'),
              ),
            ],
            const SizedBox(height: 25),
          ],
        ),
      ),
    );
  }
}
