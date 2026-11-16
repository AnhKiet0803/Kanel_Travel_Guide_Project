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
