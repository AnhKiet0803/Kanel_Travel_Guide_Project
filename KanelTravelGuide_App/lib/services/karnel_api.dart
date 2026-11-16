// API calls used by the About / Contact / Feedback / Notifications screens.
// Endpoints follow KanelTravelGuide_BE/docs/api-endpoints.md and match the website (src/api/*.js).
import '../models/models.dart';
import 'api_client.dart';

class KarnelApi {
  KarnelApi(this.client);

  final ApiClient client;

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
    return _asList(await client.get('/feedbacks/approved')).map(ApprovedFeedback.fromJson).toList();
  }

  /// CN16: GET /notifications, newest first. Needs a signed-in user (token).
  Future<List<AppNotification>> listNotifications() async {
    final items = _asList(await client.get('/notifications')).map(AppNotification.fromJson).toList();
    items.sort((a, b) => (b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0))
        .compareTo(a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)));
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

  List<Map<String, dynamic>> _asList(dynamic data) {
    final list = data is List ? data : (data is Map ? data['items'] : null);
    if (list is! List) return const [];
    return list.whereType<Map<String, dynamic>>().toList();
  }
}
