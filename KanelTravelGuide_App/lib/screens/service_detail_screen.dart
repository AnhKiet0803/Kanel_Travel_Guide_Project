// CN06, CN07, CN08: Details screen for a single Service Provider (Hotel, Restaurant, Resort)
// Maintained by Nguyễn Công Tiến (recca279)
import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/karnel_api.dart';

class ServiceDetailScreen extends StatefulWidget {
  const ServiceDetailScreen({
    super.key,
    required this.api,
    required this.serviceId,
    this.initialProvider,
  });

  final KarnelApi api;
  final int serviceId;
  final ServiceProvider? initialProvider;

  @override
  State<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends State<ServiceDetailScreen> {
  ServiceProvider? _provider;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _provider = widget.initialProvider;
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    try {
      final data = await widget.api.getService(widget.serviceId);
      if (mounted) {
        setState(() {
          _provider = data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          if (_provider == null) {
            _error = e.toString();
          }
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
    final item = _provider;

    return Scaffold(
      appBar: AppBar(
        title: Text(item?.providerName ?? 'Service Details'),
        backgroundColor: const Color(0xFF123B5D),
        foregroundColor: Colors.white,
      ),
      body: _loading && item == null
          ? const Center(child: CircularProgressIndicator())
          : _error != null && item == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.red),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadDetail,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : _buildContent(item!, colorScheme),
    );
  }

  Widget _buildContent(ServiceProvider item, ColorScheme colorScheme) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero Image Header
          Container(
            height: 220,
            width: double.infinity,
            child: Image.network(
              item.effectiveImageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _buildPlaceholder(),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type & Rating badges
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF123B5D),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        item.serviceType.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                    if (item.starRating != null && item.starRating! > 0)
                      Row(
                        children: List.generate(
                          item.starRating!,
                          (_) => const Icon(Icons.star, size: 18, color: Colors.amber),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                // Name
                Text(
                  item.providerName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF123B5D),
                  ),
                ),
                const SizedBox(height: 8),

                // Address
                if (item.address != null || item.locationName != null)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.location_on, size: 18, color: Colors.redAccent),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          item.address ?? item.locationName ?? '',
                          style: TextStyle(fontSize: 14, color: Colors.grey.shade800),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 8),

                // Contact Phone & Website
                if (item.phone != null && item.phone!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        const Icon(Icons.phone, size: 16, color: Colors.green),
                        const SizedBox(width: 8),
                        Text(item.phone!, style: const TextStyle(fontSize: 14)),
                      ],
                    ),
                  ),

                if (item.website != null && item.website!.isNotEmpty)
                  Row(
                    children: [
                      const Icon(Icons.language, size: 16, color: Colors.blue),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item.website!,
                          style: const TextStyle(fontSize: 14, color: Colors.blue),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),

                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 12),

                // Overview & Description
                const Text(
                  'Overview',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF123B5D),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  item.description != null && item.description!.isNotEmpty
                      ? item.description!
                      : '${item.providerName} is a premier ${item.serviceType.toLowerCase()} destination offering verified quality, comfortable ambiance, and personalized hospitality.',
                  style: const TextStyle(fontSize: 14, height: 1.5, color: Colors.black87),
                ),

                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 12),

                // Available Rooms & Tables
                Text(
                  item.serviceType == 'Restaurant' ? 'Available Tables & Menus' : 'Available Rooms & Suites',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF123B5D),
                  ),
                ),
                const SizedBox(height: 12),

                if (item.items.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: colorScheme.primary),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Please contact the property directly for real-time room availability and reservations.',
                            style: TextStyle(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: item.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, idx) {
                      final room = item.items[idx];
                      return _buildRoomCard(room, colorScheme);
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoomCard(ServiceItem room, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  room.itemName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF123B5D),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: room.isAvailable ? Colors.green.shade50 : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: room.isAvailable ? Colors.green : Colors.grey,
                  ),
                ),
                child: Text(
                  room.isAvailable ? 'Available' : 'Booked',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: room.isAvailable ? Colors.green.shade800 : Colors.grey.shade700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (room.capacity != null)
            Row(
              children: [
                const Icon(Icons.people_alt_outlined, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Capacity: ${room.capacity} guests',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatPrice(room.price),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF123B5D),
                ),
              ),
              const Chip(
                label: Text('Inquire', style: TextStyle(fontSize: 12)),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: const Color(0xFF123B5D).withOpacity(0.1),
      child: const Center(
        child: Icon(Icons.apartment, size: 64, color: Color(0xFF123B5D)),
      ),
    );
  }
}
