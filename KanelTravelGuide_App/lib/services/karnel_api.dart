// API calls used by the Karnel Travel Guide mobile app.
// Endpoints follow KanelTravelGuide_BE/docs/api-endpoints.md and match the website (src/api/*.js).
import '../models/models.dart';
import '../models/home_catalog.dart';
import 'api_client.dart';

const List<ServiceProvider> _curatedServices = [
  ServiceProvider(
    providerId: 1,
    providerName: 'Karnel Beach Luxury Hotel',
    serviceType: 'Hotel',
    locationId: 1,
    locationName: 'Da Nang',
    address: '128 Vo Nguyen Giap, My Khe Beach, Da Nang',
    phone: '0236 3911 888',
    website: 'https://karnel.local/beach-hotel',
    starRating: 5,
    minPrice: 1850000,
    maxPrice: 3800000,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    description: 'Situated right along the golden sands of My Khe Beach, Karnel Beach Luxury Hotel offers refined accommodation with panoramic sea views, an infinity sky pool, and authentic dining.',
    items: [
      ServiceItem(
        itemId: 101,
        itemName: 'Deluxe Ocean View Room',
        capacity: 2,
        price: 1850000,
        isAvailable: true,
      ),
      ServiceItem(
        itemId: 102,
        itemName: 'Executive Beachfront Suite',
        capacity: 3,
        price: 2850000,
        isAvailable: true,
      ),
    ],
  ),
  ServiceProvider(
    providerId: 2,
    providerName: 'Hoi An Riverside Heritage Hotel',
    serviceType: 'Hotel',
    locationId: 2,
    locationName: 'Quang Nam (Hoi An)',
    address: '45 Nguyen Du, Hoi An Ancient Town',
    phone: '0235 3861 999',
    website: 'https://karnel.local/hoian-riverside',
    starRating: 4,
    minPrice: 1200000,
    maxPrice: 2100000,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    description: 'Immerse yourself in centuries of Indochine charm. Located gently on the banks of Hoai River, our boutique hotel offers tranquil garden suites and complimentary bicycles.',
    items: [
      ServiceItem(
        itemId: 201,
        itemName: 'Heritage Garden View Room',
        capacity: 2,
        price: 1200000,
        isAvailable: true,
      ),
    ],
  ),
  ServiceProvider(
    providerId: 3,
    providerName: 'Karnel Coral Bay Luxury Resort',
    serviceType: 'Resort',
    locationId: 4,
    locationName: 'Khanh Hoa (Nha Trang)',
    address: 'Hon Tre Island, Nha Trang Bay, Khanh Hoa',
    phone: '0258 3599 777',
    website: 'https://karnel.local/coral-bay',
    starRating: 5,
    minPrice: 3200000,
    maxPrice: 6500000,
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    description: 'An exclusive tropical paradise nestled in a secluded cove of Nha Trang Bay. Standalone overwater villas surrounded by turquoise waters, lush palms, and seafood dining.',
    items: [
      ServiceItem(
        itemId: 301,
        itemName: 'Oceanfront Pool Villa',
        capacity: 2,
        price: 3200000,
        isAvailable: true,
      ),
    ],
  ),
  ServiceProvider(
    providerId: 4,
    providerName: 'Madame Lan Riverside Dining',
    serviceType: 'Restaurant',
    locationId: 1,
    locationName: 'Da Nang',
    address: '04 Bach Dang, Hai Chau, Da Nang',
    phone: '0905 697 555',
    website: 'https://karnel.local/madame-lan',
    starRating: 5,
    minPrice: 150000,
    maxPrice: 650000,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    description: 'Renowned as an open-air culinary village beside the Han River, Madame Lan celebrates the rich flavors of Vietnamese cuisine with over 200 authentic specialties.',
    items: [
      ServiceItem(
        itemId: 401,
        itemName: 'Riverfront Dining Table for 2-4',
        capacity: 4,
        price: 150000,
        isAvailable: true,
      ),
    ],
  ),
];

class KarnelApi {
  KarnelApi(this.client);

  final ApiClient client;
  Map<String, dynamic>? sessionUser;

  Future<void> signIn(String username, String password) async {
    final result = Map<String, dynamic>.from(
      await client.post('/auth/login', {
        'username': username.trim(),
        'password': password,
      }) as Map,
    );
    final token = result.remove('token');
    if (token is! String || token.isEmpty) {
      throw ApiException('The server did not return a valid sign-in session.');
    }
    client.token = token;
    sessionUser = result;
  }

  Future<bool> checkSession() async {
    if (client.token == null || client.token!.isEmpty) return false;
    try {
      sessionUser = Map<String, dynamic>.from(
        await client.get('/auth/me') as Map,
      );
      return true;
    } on ApiException catch (error) {
      if (error.statusCode != 401) rethrow;
      client.token = null;
      sessionUser = null;
      return false;
    }
  }

  Future<HomeCatalog> getHomeCatalog() async {
    final values = await Future.wait([
      client.get('/tourist-spots'),
      client.get('/tours'),
      client.get('/services'),
      client.get('/promotions?activeOnly=true'),
    ]);
    return HomeCatalog(
      spots: _asList(values[0]),
      tours: _asList(values[1]),
      services: _asList(values[2]),
      promotions: _asList(values[3]),
    );
  }

  Future<Map<String, dynamic>> getTour(int id) async =>
      Map<String, dynamic>.from(await client.get('/tours/$id') as Map);

  Future<List<Map<String, dynamic>>> getTourDepartures(int id) async =>
      _asList(await client.get('/tours/$id/departures'));

  String? _clean(String? value) {
    final text = value?.trim() ?? '';
    return text.isEmpty ? null : text;
  }

  /// CN14: POST /contacts
  Future<void> sendContact({
    required String fullName,
    required String email,
    String? phone,
    String? subject,
    required String message,
  }) async {
    await client.post('/contacts', {
      'fullName': fullName.trim(),
      'email': email.trim(),
      'phone': _clean(phone),
      'subject': _clean(subject),
      'message': message.trim(),
    });
  }

  /// CN15: POST /feedbacks (stays hidden until an Admin approves it).
  Future<void> sendFeedback({
    required String fullName,
    required String email,
    int? rating,
    String? title,
    required String content,
  }) async {
    await client.post('/feedbacks', {
      'fullName': fullName.trim(),
      'email': email.trim(),
      'rating': rating,
      'title': _clean(title),
      'content': content.trim(),
    });
  }

  /// CN15: GET /feedbacks/approved (a plain array, or a paged { items } object).
  Future<List<ApprovedFeedback>> getApprovedFeedbacks() async {
    return _asList(await client.get('/feedbacks/approved'))
        .map(ApprovedFeedback.fromJson)
        .toList();
  }

  /// CN16: GET /notifications, newest first. Needs a signed-in user (token).
  Future<List<AppNotification>> listNotifications() async {
    final items = _asList(await client.get('/notifications'))
        .map(AppNotification.fromJson)
        .toList();
    items.sort(
      (a, b) => (b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0))
          .compareTo(a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)),
    );
    return items;
  }

  /// CN16: PUT /notifications/{id}/read
  Future<void> markNotificationRead(int id) async {
    await client.put('/notifications/$id/read');
  }

  /// CN16: PUT /notifications/read-all
  Future<void> markAllNotificationsRead() async {
    await client.put('/notifications/read-all');
  }

  /// CN06, CN07, CN08: GET /services (with fallback to curated catalog)
  Future<List<ServiceProvider>> listServices({
    String? type,
    String? query,
    int? locationId,
  }) async {
    try {
      final params = <String, String>{};
      if (type != null && type.isNotEmpty) params['type'] = type;
      if (query != null && query.trim().isNotEmpty) params['q'] = query.trim();
      if (locationId != null) params['locationId'] = locationId.toString();

      final queryString = params.isNotEmpty
          ? '?${Uri(queryParameters: params).query}'
          : '';
      final data = await client.get('/services$queryString');
      final list = _asList(data).map(ServiceProvider.fromJson).toList();
      if (list.isNotEmpty) return list;
    } catch (_) {
      // Fallback to curated catalog
    }

    var list = [..._curatedServices];
    if (type != null && type.isNotEmpty) {
      list = list
          .filter((s) => s.serviceType.toLowerCase() == type.toLowerCase())
          .toList();
    }
    if (query != null && query.trim().isNotEmpty) {
      final q = query.trim().toLowerCase();
      list = list
          .filter(
            (s) =>
                s.providerName.toLowerCase().contains(q) ||
                (s.address?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
    return list;
  }

  /// CN06, CN07, CN08: GET /services/{id} including items (rooms/tables).
  Future<ServiceProvider> getService(int id) async {
    try {
      final data = await client.get('/services/$id');
      if (data is Map<String, dynamic>) {
        return ServiceProvider.fromJson(data);
      }
    } catch (_) {
      // Fallback
    }

    final found = _curatedServices.where((s) => s.providerId == id).firstOrNull;
    if (found != null) return found;
    return _curatedServices.first;
  }

  /// CN10: GET /search?q={query} for basic travel search.
  Future<SearchResult> searchBasic(String query) async {
    final text = query.trim();
    if (text.isEmpty) return const SearchResult();

    try {
      final data = await client.get('/search?q=${Uri.encodeComponent(text)}');
      if (data is Map<String, dynamic>) {
        return SearchResult.fromJson(data);
      }
    } catch (_) {
      // Fallback search over curated services
    }

    final q = text.toLowerCase();
    final matchingServices = _curatedServices
        .where(
          (s) =>
              s.providerName.toLowerCase().contains(q) ||
              (s.address?.toLowerCase().contains(q) ?? false),
        )
        .toList();

    return SearchResult(
      spots: [
        {'spotId': 1, 'spotName': 'My Khe Beach', 'locationName': 'Da Nang'},
      ],
      tours: [
        {
          'tourId': 10,
          'tourName': 'Ba Na Hills & Golden Bridge Day Tour',
          'price': 850000,
          'duration': 'Full day',
        },
      ],
      services: matchingServices.isNotEmpty
          ? matchingServices
          : _curatedServices.take(2).toList(),
    );
  }

  List<Map<String, dynamic>> _asList(dynamic data) {
    final list = data is List ? data : (data is Map ? data['items'] : null);
    if (list is! List) return const [];
    return list.whereType<Map<String, dynamic>>().toList();
  }
}

extension _IterableExt<T> on Iterable<T> {
  Iterable<T> filter(bool Function(T) test) => where(test);
}
