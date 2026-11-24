// CN15: Feedback & Ratings. Sends feedback to POST /feedbacks (hidden until an Admin approves it)
// and lists the approved feedback from GET /feedbacks/approved.
import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/karnel_api.dart';
import '../utils/validators.dart';
import '../widgets/notice_banner.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key, required this.api});

  final KarnelApi api;

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _title = TextEditingController();
  final _content = TextEditingController();

  late Future<List<ApprovedFeedback>> _approved;
  int? _rating;
  bool _submitting = false;
  String? _success;
  String? _error;

  @override
  void initState() {
    super.initState();
    _approved = widget.api.getApprovedFeedbacks();
  }

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _success = null;
      _error = null;
    });
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _submitting = true);
    try {
      await widget.api.sendFeedback(
        fullName: _fullName.text,
        email: _email.text,
        rating: _rating,
        title: _title.text,
        content: _content.text,
      );
      if (!mounted) return;
      _formKey.currentState?.reset();
      for (final controller in [_fullName, _email, _title, _content]) {
        controller.clear();
      }
      setState(() {
        _rating = null;
        _success = 'Thank you for your feedback! It will be displayed once an administrator approves it.';
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _reloadApproved() {
    setState(() => _approved = widget.api.getApprovedFeedbacks());
  }

  Widget _ratingPicker() {
    return Row(
      children: [
        for (var star = 1; star <= 5; star++)
          IconButton(
            key: Key('rating-$star'),
            tooltip: '$star ${star == 1 ? 'star' : 'stars'}',
            // Tap the selected star again to clear the rating (rating is optional).
            onPressed: () => setState(() => _rating = _rating == star ? null : star),
            icon: Icon(
              (_rating ?? 0) >= star ? Icons.star : Icons.star_border,
              color: Theme.of(context).colorScheme.tertiary,
            ),
          ),
      ],
    );
  }

  // "Title · 5 ★", or the author's name when there is neither a title nor a rating.
  String _heading(ApprovedFeedback item) {
    final parts = [
      if (item.title != null && item.title!.isNotEmpty) item.title!,
      if (item.rating != null) '${item.rating} ★',
    ];
    return parts.isEmpty ? item.fullName : parts.join('  ·  ');
  }

  Widget _approvedList() {
    return FutureBuilder<List<ApprovedFeedback>>(
      future: _approved,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()));
        }
        if (snapshot.hasError) {
          final message = snapshot.error is ApiException ? (snapshot.error as ApiException).message : 'Could not load feedback.';
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              NoticeBanner(message: message, isError: true),
              TextButton(onPressed: _reloadApproved, child: const Text('Try again')),
            ],
          );
        }
        final items = snapshot.data ?? const <ApprovedFeedback>[];
        if (items.isEmpty) return const Text('No feedback to display yet.');
        return Column(
          children: [
            for (final item in items)
              Card(
                child: ListTile(
                  title: Text(_heading(item), style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${item.content}\n— ${item.fullName}'),
                  isThreeLine: true,
                ),
              ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Feedback & Ratings', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Tell us about your experience. Your feedback appears here once an administrator approves it.'),
        const SizedBox(height: 16),
        if (_success != null) NoticeBanner(message: _success!),
        if (_error != null) NoticeBanner(message: _error!, isError: true),
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                key: const Key('fb-fullName'),
                controller: _fullName,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Full name *', border: OutlineInputBorder()),
                validator: (value) => validateRequired(value, 'Full name', fullNameMax),
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('fb-email'),
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Email *', border: OutlineInputBorder()),
                validator: validateEmail,
              ),
              const SizedBox(height: 12),
              Text('Rating (optional)', style: theme.textTheme.labelLarge),
              _ratingPicker(),
              TextFormField(
                key: const Key('fb-title'),
                controller: _title,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Title', border: OutlineInputBorder()),
                validator: (value) => validateOptionalMax(value, 'Title', titleMax),
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('fb-content'),
                controller: _content,
                minLines: 4,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: 'Feedback *',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(),
                ),
                validator: (value) => validateRequired(value, 'Feedback', textMax),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: Text(_submitting ? 'Sending...' : 'Send feedback'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        Text('Customer Feedback', style: theme.textTheme.titleLarge),
        const SizedBox(height: 8),
        _approvedList(),
      ],
    );
  }
}
