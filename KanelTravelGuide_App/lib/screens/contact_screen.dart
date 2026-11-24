// CN14: Contact Us. Sends a consultation request to POST /contacts.
import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../services/karnel_api.dart';
import '../utils/validators.dart';
import '../widgets/notice_banner.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key, required this.api});

  final KarnelApi api;

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _subject = TextEditingController();
  final _message = TextEditingController();

  bool _submitting = false;
  String? _success;
  String? _error;

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
    _subject.dispose();
    _message.dispose();
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
      await widget.api.sendContact(
        fullName: _fullName.text,
        email: _email.text,
        phone: _phone.text,
        subject: _subject.text,
        message: _message.text,
      );
      if (!mounted) return;
      _formKey.currentState?.reset();
      for (final controller in [_fullName, _email, _phone, _subject, _message]) {
        controller.clear();
      }
      setState(() => _success = 'Thank you! We have received your request and will get back to you as soon as possible.');
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Contact Us', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Send us a question or a consultation request and our team will reply by email.'),
        const SizedBox(height: 16),
        if (_success != null) NoticeBanner(message: _success!),
        if (_error != null) NoticeBanner(message: _error!, isError: true),
        Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                key: const Key('contact-fullName'),
                controller: _fullName,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Full name *', border: OutlineInputBorder()),
                validator: (value) => validateRequired(value, 'Full name', fullNameMax),
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('contact-email'),
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Email *', border: OutlineInputBorder()),
                validator: validateEmail,
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('contact-phone'),
                controller: _phone,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Phone number', border: OutlineInputBorder()),
                validator: validateOptionalPhone,
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('contact-subject'),
                controller: _subject,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(labelText: 'Subject', border: OutlineInputBorder()),
                validator: (value) => validateOptionalMax(value, 'Subject', subjectMax),
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('contact-message'),
                controller: _message,
                minLines: 4,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: 'Message *',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(),
                ),
                validator: (value) => validateRequired(value, 'Message', textMax),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: Text(_submitting ? 'Sending...' : 'Send request'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
