import 'package:flutter/material.dart';

import '../services/karnel_api.dart';

Future<bool> requireTourSignIn(BuildContext context, KarnelApi api) async {
  try {
    if (await api.checkSession()) return true;
    if (!context.mounted) return false;
    return await Navigator.of(context).push<bool>(
          MaterialPageRoute(builder: (_) => SignInScreen(api: api)),
        ) ??
        false;
  } catch (error) {
    if (context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.toString())));
    }
    return false;
  }
}

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, required this.api});
  final KarnelApi api;
  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _form = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false, _hidden = true;
  String? _error;
  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.api.signIn(_username.text, _password.text);
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Sign in')),
    body: SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 18),
              const Icon(
                Icons.travel_explore,
                size: 48,
                color: Color(0xFF087F78),
              ),
              const SizedBox(height: 20),
              const Text(
                'Your next journey starts here.',
                style: TextStyle(
                  fontSize: 27,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF164E52),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Sign in with your Karnel Travels website account to book, pay and keep track of your trips.',
              ),
              const SizedBox(height: 28),
              TextFormField(
                key: const Key('login-username'),
                controller: _username,
                autofillHints: const [AutofillHints.username],
                decoration: const InputDecoration(
                  labelText: 'Username',
                  border: OutlineInputBorder(),
                ),
                textInputAction: TextInputAction.next,
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter your username.'
                    : null,
              ),
              const SizedBox(height: 18),
              TextFormField(
                key: const Key('login-password'),
                controller: _password,
                obscureText: _hidden,
                autofillHints: const [AutofillHints.password],
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    tooltip: _hidden ? 'Show password' : 'Hide password',
                    onPressed: () => setState(() => _hidden = !_hidden),
                    icon: Icon(
                      _hidden
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                  ),
                ),
                validator: (value) => value == null || value.isEmpty
                    ? 'Enter your password.'
                    : null,
                onFieldSubmitted: (_) => _signIn(),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 18),
                  child: Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _busy ? null : _signIn,
                  child: Text(_busy ? 'Signing in…' : 'Sign in and continue'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
