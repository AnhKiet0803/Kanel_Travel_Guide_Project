// CN16: the signed-in user's notifications (booking confirmations, promotions, system notices).
// Shown inside the app only; push notifications are out of scope (project brief, section 6.2).
// Needs a signed-in user: the login screen must set `api.client.token`.
import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/karnel_api.dart';
import '../widgets/notice_banner.dart';

const Map<String, String> _typeLabels = {
  'BOOKING': 'Booking',
  'PROMOTION': 'Promotion',
  'SYSTEM': 'System',
};

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, required this.api});

  final KarnelApi api;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _items = const [];
  String? _type; // null = all types
  bool _loading = false;
  String? _error;
  String? _actionError;

  bool get _signedIn => (widget.api.client.token ?? '').isNotEmpty;

  @override
  void initState() {
    super.initState();
    if (_signedIn) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await widget.api.listNotifications();
      if (!mounted) return;
      setState(() => _items = items);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _actionError = null);
    try {
      await action();
      await _load();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _actionError = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (!_signedIn) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Notifications', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const NoticeBanner(message: 'Please sign in to see your notifications.'),
        ],
      );
    }

    final unread = _items.where((item) => !item.isRead).toList();
    final shown = _type == null ? _items : _items.where((item) => item.notificationType == _type).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Notifications', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(unread.isEmpty
              ? 'You are all caught up.'
              : 'You have ${unread.length} unread ${unread.length == 1 ? 'notification' : 'notifications'}.'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(label: const Text('All'), selected: _type == null, onSelected: (_) => setState(() => _type = null)),
              for (final entry in _typeLabels.entries)
                ChoiceChip(
                  label: Text(entry.value),
                  selected: _type == entry.key,
                  onSelected: (_) => setState(() => _type = entry.key),
                ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: unread.isEmpty ? null : () => _run(() => widget.api.markAllNotificationsRead()),
              child: const Text('Mark all as read'),
            ),
          ),
          if (_actionError != null) NoticeBanner(message: _actionError!, isError: true),
          if (_error != null) NoticeBanner(message: _error!, isError: true),
          if (_loading && _items.isEmpty) const Center(child: CircularProgressIndicator()),
          if (!_loading && _error == null && shown.isEmpty) const Text('No notifications.'),
          for (final item in shown)
            Card(
              color: item.isRead ? null : theme.colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Chip(
                          label: Text(_typeLabels[item.notificationType] ?? item.notificationType),
                          visualDensity: VisualDensity.compact,
                        ),
                        const Spacer(),
                        if (item.createdAt != null)
                          Text(
                            '${item.createdAt!.day.toString().padLeft(2, '0')}/${item.createdAt!.month.toString().padLeft(2, '0')}/${item.createdAt!.year}',
                            style: theme.textTheme.bodySmall,
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text(item.message),
                    if (!item.isRead)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => _run(() => widget.api.markNotificationRead(item.notificationId)),
                          child: const Text('Mark as read'),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
