import 'package:flutter/material.dart';

/// A coloured message box for success or error feedback inside a screen.
class NoticeBanner extends StatelessWidget {
  const NoticeBanner({super.key, required this.message, this.isError = false});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final background = isError ? scheme.errorContainer : scheme.secondaryContainer;
    final foreground = isError ? scheme.onErrorContainer : scheme.onSecondaryContainer;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(12)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(isError ? Icons.error_outline : Icons.check_circle_outline, color: foreground),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: TextStyle(color: foreground))),
        ],
      ),
    );
  }
}
