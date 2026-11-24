import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../models/tour_checkout.dart';
import '../services/api_client.dart';
import '../services/tour_booking_api.dart';

bool get supportsAppPayPal =>
    !kIsWeb &&
    {
      TargetPlatform.android,
      TargetPlatform.iOS,
      TargetPlatform.macOS,
    }.contains(defaultTargetPlatform);

class PayPalCheckoutScreen extends StatefulWidget {
  const PayPalCheckoutScreen({
    super.key,
    required this.api,
    required this.bookingId,
    required this.approvalUrl,
  });
  final TourBookingApi api;
  final int bookingId;
  final String approvalUrl;
  @override
  State<PayPalCheckoutScreen> createState() => _PayPalCheckoutScreenState();
}

class _PayPalCheckoutScreenState extends State<PayPalCheckoutScreen> {
  WebViewController? _controller;
  String? _error;
  int _progress = 0;
  bool _verifying = false, _returned = false;

  @override
  void initState() {
    super.initState();
    if (!supportsAppPayPal || !sandboxApprovalUrl(widget.approvalUrl)) {
      _error = 'A valid PayPal Sandbox checkout is available in the Android or iOS app.';
      return;
    }
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (value) {
            if (mounted) setState(() => _progress = value);
          },
          onWebResourceError: (error) {
            if (mounted && error.isForMainFrame == true) {
              setState(
                () => _error =
                    'PayPal could not load. Check your connection and retry.',
              );
            }
          },
          onNavigationRequest: (request) {
            if (!mounted) return NavigationDecision.prevent;
            if (!request.isMainFrame) return NavigationDecision.navigate;
            final returned = paypalReturn(request.url, widget.bookingId);
            if (returned == PayPalReturn.cancelled) {
              Navigator.of(context).pop(false);
              return NavigationDecision.prevent;
            }
            if (returned == PayPalReturn.approved) {
              _returned = true;
              _verify();
              return NavigationDecision.prevent;
            }
            final uri = Uri.tryParse(request.url);
            final host = uri?.host ?? '';
            if (uri?.scheme == 'https' &&
                (host == 'paypal.com' ||
                    host.endsWith('.paypal.com') ||
                    host == 'paypalobjects.com' ||
                    host.endsWith('.paypalobjects.com'))) {
              return NavigationDecision.navigate;
            }
            if (request.url == 'about:blank') {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.approvalUrl));
  }

  Future<void> _verify() async {
    if (_verifying) return;
    setState(() {
      _verifying = true;
      _error = null;
    });
    try {
      final result = await widget.api.capture(widget.bookingId);
      if (result['paymentStatus'] != 'Paid') {
        throw ApiException('The server has not confirmed payment.');
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_verifying,
    child: Scaffold(
      appBar: AppBar(title: const Text('PayPal Sandbox')),
      body: Column(
        children: [
          if (_progress < 100 && !_returned)
            LinearProgressIndicator(value: _progress / 100),
          if (_verifying)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Column(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Verifying payment with the server…'),
                ],
              ),
            ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  if (_returned)
                    FilledButton(
                      onPressed: _verifying ? null : _verify,
                      child: const Text('Retry payment verification'),
                    )
                  else if (_controller != null)
                    TextButton(
                      onPressed: () {
                        setState(() => _error = null);
                        _controller!.reload();
                      },
                      child: const Text('Reload PayPal'),
                    ),
                ],
              ),
            ),
          if (_controller != null && !_returned)
            Expanded(child: WebViewWidget(controller: _controller!)),
        ],
      ),
    ),
  );
}
