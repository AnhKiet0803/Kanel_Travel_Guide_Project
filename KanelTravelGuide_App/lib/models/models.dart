// Data classes for the screens that show feedback and notifications.

DateTime? _parseDate(Object? value) => value is String ? DateTime.tryParse(value)?.toLocal() : null;

/// An approved customer feedback (GET /feedbacks/approved).
class ApprovedFeedback {
  const ApprovedFeedback({
    required this.feedbackId,
    required this.fullName,
    required this.content,
    this.rating,
    this.title,
    this.createdAt,
  });

  factory ApprovedFeedback.fromJson(Map<String, dynamic> json) => ApprovedFeedback(
        feedbackId: (json['feedbackId'] as num?)?.toInt() ?? 0,
        fullName: (json['fullName'] as String?) ?? '',
        content: (json['content'] as String?) ?? '',
        rating: (json['rating'] as num?)?.toInt(),
        title: json['title'] as String?,
        createdAt: _parseDate(json['createdAt']),
      );

  final int feedbackId;
  final String fullName;
  final String content;
  final int? rating;
  final String? title;
  final DateTime? createdAt;
}

/// A notification for the signed-in user (GET /notifications).
class AppNotification {
  const AppNotification({
    required this.notificationId,
    required this.title,
    required this.message,
    required this.notificationType,
    required this.isRead,
    this.referenceId,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        notificationId: (json['notificationId'] as num?)?.toInt() ?? 0,
        title: (json['title'] as String?) ?? '',
        message: (json['message'] as String?) ?? '',
        notificationType: (json['notificationType'] as String?) ?? 'SYSTEM',
        isRead: (json['isRead'] as bool?) ?? false,
        referenceId: json['referenceId']?.toString(),
        createdAt: _parseDate(json['createdAt']),
      );

  final int notificationId;
  final String title;
  final String message;

  /// BOOKING, PROMOTION or SYSTEM.
  final String notificationType;
  final bool isRead;
  final String? referenceId;
  final DateTime? createdAt;
}

/// Service provider model (Hotels, Restaurants, Resorts - CN06, CN07, CN08).
class ServiceProvider {
  const ServiceProvider({
    required this.providerId,
    required this.providerName,
    required this.serviceType,
    this.locationId,
    this.locationName,
    this.address,
    this.description,
    this.phone,
    this.website,
    this.starRating,
    this.minPrice,
    this.maxPrice,
    this.imageUrl,
    this.items = const [],
  });

  factory ServiceProvider.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final itemsList = rawItems is List
        ? rawItems.whereType<Map<String, dynamic>>().map(ServiceItem.fromJson).toList()
        : const <ServiceItem>[];

    return ServiceProvider(
      providerId: (json['providerId'] as num?)?.toInt() ?? 0,
      providerName: (json['providerName'] as String?) ?? '',
      serviceType: (json['serviceType'] as String?) ?? 'Hotel',
      locationId: (json['locationId'] as num?)?.toInt(),
      locationName: json['locationName'] as String?,
      address: json['address'] as String?,
      description: json['description'] as String?,
      phone: json['phone'] as String?,
      website: json['website'] as String?,
      starRating: (json['starRating'] as num?)?.toInt(),
      minPrice: json['minPrice'] as num?,
      maxPrice: json['maxPrice'] as num?,
      imageUrl: json['imageUrl'] as String?,
      items: itemsList,
    );
  }

  final int providerId;
  final String providerName;
  final String serviceType;
  final int? locationId;
  final String? locationName;
  final String? address;
  final String? description;
  final String? phone;
  final String? website;
  final int? starRating;
  final num? minPrice;
  final num? maxPrice;
  final String? imageUrl;
  final List<ServiceItem> items;

  /// High quality display image URL with automatic curated fallbacks for relative paths.
  String get effectiveImageUrl {
    if (imageUrl != null && (imageUrl!.startsWith('http://') || imageUrl!.startsWith('https://'))) {
      return imageUrl!;
    }
    final img = (imageUrl ?? '').toLowerCase();
    final name = providerName.toLowerCase();
    final type = serviceType.toLowerCase();

    if (img.contains('beach') || name.contains('beach') || name.contains('biển')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
    }
    if (img.contains('hoian') || name.contains('hoi an') || name.contains('riverside')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
    }
    if (img.contains('resort') || type.contains('resort') || name.contains('resort') || name.contains('bay')) {
      return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80';
    }
    if (img.contains('restaurant') || type.contains('restaurant') || name.contains('quang') || name.contains('restaurant') || name.contains('nhà hàng')) {
      return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
    }
    if (type.contains('hotel') || name.contains('hotel')) {
      return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  }
}

/// A room, suite, or table within a ServiceProvider.
class ServiceItem {
  const ServiceItem({
    required this.itemId,
    required this.itemName,
    this.capacity,
    required this.price,
    this.totalQuantity,
    this.isAvailable = true,
  });

  factory ServiceItem.fromJson(Map<String, dynamic> json) => ServiceItem(
        itemId: (json['itemId'] as num?)?.toInt() ?? 0,
        itemName: (json['itemName'] ?? json['ItemName'] ?? '') as String,
        capacity: (json['capacity'] as num?)?.toInt(),
        price: (json['price'] as num?) ?? 0,
        totalQuantity: (json['totalQuantity'] as num?)?.toInt(),
        isAvailable: (json['isAvailable'] as bool?) ?? true,
      );

  final int itemId;
  final String itemName;
  final int? capacity;
  final num price;
  final int? totalQuantity;
  final bool isAvailable;
}

/// Search result model (CN10: Basic Search).
class SearchResult {
  const SearchResult({
    this.spots = const [],
    this.tours = const [],
    this.services = const [],
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    final spotsList = json['spots'] is List
        ? (json['spots'] as List).whereType<Map<String, dynamic>>().toList()
        : const <Map<String, dynamic>>[];
    final toursList = json['tours'] is List
        ? (json['tours'] as List).whereType<Map<String, dynamic>>().toList()
        : const <Map<String, dynamic>>[];
    final servicesList = json['services'] is List
        ? (json['services'] as List)
            .whereType<Map<String, dynamic>>()
            .map(ServiceProvider.fromJson)
            .toList()
        : const <ServiceProvider>[];

    return SearchResult(
      spots: spotsList,
      tours: toursList,
      services: servicesList,
    );
  }

  final List<Map<String, dynamic>> spots;
  final List<Map<String, dynamic>> tours;
  final List<ServiceProvider> services;

  int get totalCount => spots.length + tours.length + services.length;
}
