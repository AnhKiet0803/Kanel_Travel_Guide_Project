// CN10: Basic Travel Search screen
// Maintained by Nguyễn Công Tiến (recca279)
import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/karnel_api.dart';
import '../widgets/notice_banner.dart';
import 'service_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, required this.api, this.initialQuery});

  final KarnelApi api;
  final String? initialQuery;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  SearchResult _result = const SearchResult();
  bool _hasSearched = false;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _searchController.text = widget.initialQuery!;
      _performSearch();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
      _hasSearched = true;
    });

    try {
      final res = await widget.api.searchBasic(query);
      if (mounted) {
        setState(() {
          _result = res;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e is ApiException ? e.message : 'Search failed. Please try again.';
          _loading = false;
        });
      }
    }
  }

  String _formatPrice(num? price) {
    if (price == null || price == 0) return 'Free / Inquire';
    return '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} VND';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header
        Text(
          'Explore Vietnam',
          style: theme.textTheme.labelLarge?.copyWith(color: colorScheme.secondary),
        ),
        const SizedBox(height: 4),
        Text(
          'Travel Search',
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'Quickly search for tourist attractions, guided tours, hotels, and restaurants across all destinations.',
        ),
        const SizedBox(height: 16),

        // Search Input
        TextField(
          key: const Key('search-query-field'),
          controller: _searchController,
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: 'Search destinations, tours, hotels...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _hasSearched = false;
                        _result = const SearchResult();
                      });
                    },
                  )
                : null,
            isDense: true,
            border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
          ),
          onSubmitted: (_) => _performSearch(),
        ),
        const SizedBox(height: 12),

        // Suggestion chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              const Text(
                'Suggestions: ',
                style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
              _buildSuggestionChip('Da Nang'),
              const SizedBox(width: 6),
              _buildSuggestionChip('Hoi An'),
              const SizedBox(width: 6),
              _buildSuggestionChip('Hotel'),
              const SizedBox(width: 6),
              _buildSuggestionChip('Beach'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Error Banner
        if (_error != null) ...[
          NoticeBanner(message: _error!, isError: true),
          TextButton.icon(
            onPressed: _performSearch,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
          const SizedBox(height: 8),
        ],

        // Loading
        if (_loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (!_hasSearched)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 40),
            child: Center(
              child: Column(
                children: [
                  Icon(Icons.travel_explore, size: 56, color: colorScheme.outline),
                  const SizedBox(height: 12),
                  const Text('Discover Vietnam Your Way', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Enter a destination or service name above to find results.', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ),
          )
        else if (_result.totalCount == 0 && _error == null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 40),
            child: Center(
              child: Column(
                children: [
                  Icon(Icons.search_off, size: 48, color: colorScheme.outline),
                  const SizedBox(height: 12),
                  Text('No results for "${_searchController.text}"', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Try searching with different keywords.', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ),
          )
        else ...[
          // Services Results
          if (_result.services.isNotEmpty) ...[
            _buildSectionHeader('Stays & Dining (${_result.services.length})', Icons.hotel),
            const SizedBox(height: 8),
            for (final svc in _result.services) _buildServiceItem(svc, colorScheme),
            const SizedBox(height: 16),
          ],

          // Tours Results
          if (_result.tours.isNotEmpty) ...[
            _buildSectionHeader('Tours (${_result.tours.length})', Icons.explore_outlined),
            const SizedBox(height: 8),
            for (final tour in _result.tours) _buildTourItem(tour, colorScheme),
            const SizedBox(height: 16),
          ],

          // Spots Results
          if (_result.spots.isNotEmpty) ...[
            _buildSectionHeader('Attractions (${_result.spots.length})', Icons.place_outlined),
            const SizedBox(height: 8),
            for (final spot in _result.spots) _buildSpotItem(spot, colorScheme),
          ],
        ],
      ],
    );
  }

  Widget _buildSuggestionChip(String label) {
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      visualDensity: VisualDensity.compact,
      onPressed: () {
        _searchController.text = label;
        _performSearch();
      },
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF123B5D)),
        const SizedBox(width: 6),
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF123B5D)),
        ),
      ],
    );
  }

  Widget _buildServiceItem(ServiceProvider svc, ColorScheme colorScheme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            svc.effectiveImageUrl,
            width: 44,
            height: 44,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF123B5D).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.apartment, color: Color(0xFF123B5D)),
            ),
          ),
        ),
        title: Text(svc.providerName, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(
          svc.address ?? svc.locationName ?? svc.serviceType,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Text(
          _formatPrice(svc.minPrice),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF123B5D)),
        ),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ServiceDetailScreen(
                api: widget.api,
                serviceId: svc.providerId,
                initialProvider: svc,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTourItem(Map<String, dynamic> tour, ColorScheme colorScheme) {
    final name = (tour['tourName'] as String?) ?? 'Tour';
    final price = tour['price'] as num?;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Colors.teal.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.directions_bus, color: Colors.teal),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(
          tour['duration']?.toString() ?? 'Guided Excursion',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Text(
          _formatPrice(price),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.teal),
        ),
      ),
    );
  }

  Widget _buildSpotItem(Map<String, dynamic> spot, ColorScheme colorScheme) {
    final name = (spot['spotName'] as String?) ?? 'Attraction';
    final location = (spot['locationName'] as String?) ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Colors.orange.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.landscape, color: Colors.orange),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(location, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      ),
    );
  }
}
