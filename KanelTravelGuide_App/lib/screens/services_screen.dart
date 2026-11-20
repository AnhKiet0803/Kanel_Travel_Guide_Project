// CN06, CN07, CN08: Hotels, Restaurants, and Resorts Directory screen
// Maintained by Nguyễn Công Tiến (recca279)
import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/karnel_api.dart';
import '../widgets/notice_banner.dart';
import 'service_detail_screen.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key, required this.api, this.initialType});

  final KarnelApi api;
  final String? initialType;

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  String _selectedCategory = ''; // '' = All, 'Hotel', 'Restaurant', 'Resort'
  final TextEditingController _searchController = TextEditingController();
  List<ServiceProvider> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialType ?? '';
    _loadServices();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await widget.api.listServices(
        type: _selectedCategory.isEmpty ? null : _selectedCategory,
        query: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      );
      if (mounted) {
        setState(() {
          _items = results;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e is ApiException ? e.message : 'Could not load services.';
          _loading = false;
        });
      }
    }
  }

  String _formatPrice(num? price) {
    if (price == null || price == 0) return 'Contact for price';
    return '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} VND';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return RefreshIndicator(
      onRefresh: _loadServices,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header matching other screens
          Text(
            'Accommodation & Dining',
            style: theme.textTheme.labelLarge?.copyWith(color: colorScheme.secondary),
          ),
          const SizedBox(height: 4),
          Text(
            'Stay & Dining Services',
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Browse handpicked hotels, authentic restaurants, and luxury resorts across Vietnam with real-time availability and rates.',
          ),
          const SizedBox(height: 16),

          // Search Field
          TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Search hotels, restaurants, resorts...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _loadServices();
                      },
                    )
                  : null,
              isDense: true,
              border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
            ),
            onSubmitted: (_) => _loadServices(),
          ),
          const SizedBox(height: 12),

          // Category Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('All Stays', '', Icons.grid_view),
                const SizedBox(width: 8),
                _buildFilterChip('Hotels', 'Hotel', Icons.hotel_outlined),
                const SizedBox(width: 8),
                _buildFilterChip('Restaurants', 'Restaurant', Icons.restaurant_outlined),
                const SizedBox(width: 8),
                _buildFilterChip('Resorts', 'Resort', Icons.park_outlined),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Error Banner
          if (_error != null) ...[
            NoticeBanner(message: _error!, isError: true),
            TextButton.icon(
              onPressed: _loadServices,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
            const SizedBox(height: 8),
          ],

          // Loading Indicator
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_items.isEmpty && _error == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Column(
                children: [
                  Icon(Icons.search_off, size: 48, color: colorScheme.outline),
                  const SizedBox(height: 12),
                  const Text('No matching properties found', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Try adjusting your search query or category filter.', style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          else
            for (final item in _items) _buildServiceCard(item, theme, colorScheme),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String type, IconData icon) {
    final isSelected = _selectedCategory == type;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return FilterChip(
      selected: isSelected,
      label: Text(label),
      avatar: Icon(
        icon,
        size: 16,
        color: isSelected ? colorScheme.onPrimary : colorScheme.primary,
      ),
      selectedColor: colorScheme.primary,
      labelStyle: TextStyle(
        color: isSelected ? colorScheme.onPrimary : colorScheme.onSurface,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 13,
      ),
      onSelected: (_) {
        setState(() => _selectedCategory = type);
        _loadServices();
      },
    );
  }

  Widget _buildServiceCard(ServiceProvider item, ThemeData theme, ColorScheme colorScheme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ServiceDetailScreen(
                api: widget.api,
                serviceId: item.providerId,
                initialProvider: item,
              ),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area
            Stack(
              children: [
                Container(
                  height: 150,
                  width: double.infinity,
                  child: Image.network(
                    item.effectiveImageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _buildPlaceholder(colorScheme),
                  ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF123B5D).withOpacity(0.9),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      item.serviceType.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ),
                if (item.starRating != null && item.starRating! > 0)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, size: 14, color: Colors.amber),
                          const SizedBox(width: 4),
                          Text(
                            '${item.starRating}.0',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF123B5D),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),

            // Card text
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.providerName,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF123B5D)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  if (item.address != null || item.locationName != null)
                    Row(
                      children: [
                        const Icon(Icons.location_on, size: 14, color: Colors.redAccent),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            item.address ?? item.locationName ?? '',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('From', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text(
                            _formatPrice(item.minPrice),
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: colorScheme.primary),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF123B5D),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ServiceDetailScreen(
                                api: widget.api,
                                serviceId: item.providerId,
                                initialProvider: item,
                              ),
                            ),
                          );
                        },
                        child: const Text('View Details', style: TextStyle(fontSize: 13)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder(ColorScheme colorScheme) {
    return Container(
      color: const Color(0xFF123B5D).withOpacity(0.08),
      child: const Center(
        child: Icon(Icons.apartment, size: 48, color: Color(0xFF123B5D)),
      ),
    );
  }
}
