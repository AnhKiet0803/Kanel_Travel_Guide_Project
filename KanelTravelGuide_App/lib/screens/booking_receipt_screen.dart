import 'package:flutter/material.dart';

import '../models/tour_checkout.dart';
import '../services/api_client.dart';
import '../services/karnel_api.dart';
import '../services/tour_booking_api.dart';
import '../widgets/travel_ui.dart';
import 'paypal_checkout_screen.dart';
import 'sign_in_screen.dart';

const paymentNames = {
  'PayPalSandbox': 'PayPal Sandbox',
  'BankTransfer': 'Bank transfer',
  'PayAfterConfirmation': 'Pay after confirmation',
};

class BookingReceiptScreen extends StatefulWidget {
  const BookingReceiptScreen({
    super.key,
    required this.api,
    required this.bookingId,
    this.startPayment = false,
  });
  final KarnelApi api;
  final int bookingId;
  final bool startPayment;
  @override
  State<BookingReceiptScreen> createState() => _BookingReceiptScreenState();
}

class _BookingReceiptScreenState extends State<BookingReceiptScreen> {
  Map<String, dynamic>? _booking;
  String? _error;
  bool _busy = false, _autoStarted = false;
  TourBookingApi get _api => TourBookingApi(widget.api.client);
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final booking = await _api.booking(widget.bookingId);
      if (!mounted) return;
      setState(() {
        _booking = booking;
        _error = null;
      });
      if (widget.startPayment &&
          !_autoStarted &&
          booking['paymentStatus'] == 'Unpaid' &&
          booking['paymentMethod'] == 'PayPalSandbox') {
        _autoStarted = true;
        await _pay();
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  Future<void> _pay() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (!await requireTourSignIn(context, widget.api)) return;
      if (!supportsAppPayPal) {
        throw ApiException(
          'Continue PayPal checkout in the Android or iOS app.',
        );
      }
      final order = await _api.order(widget.bookingId);
      if (!mounted) return;
      if (order['resume'] == true) {
        final result = await _api.capture(widget.bookingId);
        if (result['paymentStatus'] != 'Paid') {
          throw ApiException('Payment has not been confirmed.');
        }
      } else {
        final approval = order['approvalUrl']?.toString() ?? '';
        if (!sandboxApprovalUrl(approval)) {
          throw ApiException(
            'The server did not return a valid PayPal Sandbox link.',
          );
        }
        final confirmed = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (_) => PayPalCheckoutScreen(
              api: _api,
              bookingId: widget.bookingId,
              approvalUrl: approval,
            ),
          ),
        );
        if (mounted && confirmed != true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Checkout closed. Your booking is saved; payment is not confirmed yet.',
              ),
            ),
          );
        }
      }
      final booking = await _api.booking(widget.bookingId);
      if (mounted) setState(() => _booking = booking);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = _booking;
    final paid = booking?['paymentStatus'] == 'Paid';
    final cancelled = booking?['bookingStatus'] == 'Cancelled';
    final paypal = booking?['paymentMethod'] == 'PayPalSandbox';
    return Scaffold(
      appBar: AppBar(title: const Text('Your booking')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(22),
          children: [
            if (booking == null && _error == null)
              const Center(child: CircularProgressIndicator()),
            if (booking != null) ...[
              Icon(
                cancelled
                    ? Icons.cancel_outlined
                    : paid
                    ? Icons.check_circle_outline
                    : Icons.receipt_long_outlined,
                size: 58,
                color: cancelled ? Colors.grey : const Color(0xFF087F78),
              ),
              const SizedBox(height: 18),
              Text(
                cancelled
                    ? 'Booking cancelled'
                    : paid
                    ? 'Payment confirmed'
                    : 'Your booking is saved',
                style: const TextStyle(
                  fontSize: 27,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF164E52),
                ),
              ),
              const SizedBox(height: 10),
              SelectableText(
                booking['bookingCode'].toString(),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 22),
              for (final row in [
                ['Booking status', booking['bookingStatus']],
                [
                  'Payment method',
                  paymentNames[booking['paymentMethod']] ??
                      booking['paymentMethod'],
                ],
                ['Payment status', booking['paymentStatus']],
                ['Travel date', booking['startDate']],
                ['Travelers', booking['totalPassengers']],
                ['Total', travelMoney(booking['totalAmount'])],
              ])
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: Text(row[0]?.toString() ?? '')),
                      const SizedBox(width: 16),
                      Flexible(
                        child: Text(
                          row[1]?.toString() ?? '—',
                          textAlign: TextAlign.right,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              const Divider(height: 32),
              for (final detail in (booking['details'] as List? ?? []))
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    '${detail['tourName'] ?? detail['serviceItemName'] ?? detail['vehicleName'] ?? 'Service'}${detail['travelerType'] != null ? ' · ${detail['travelerType']}' : ''}\n${detail['quantity']} × ${travelMoney(detail['unitPrice'])}',
                  ),
                ),
              if (!paid && !cancelled) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1CD),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    paypal
                        ? 'The booking remains unpaid until PayPal and our server confirm the payment. You can continue checkout using the same booking.'
                        : booking['paymentMethod'] == 'BankTransfer'
                        ? 'Wait for the organizer to confirm your booking and provide the bank account details. Use ${booking['bookingCode']} as the transfer reference. A booking request is not a payment receipt.'
                        : 'The organizer will confirm availability and contact you with the amount, payment instructions and due date. Your booking is currently unpaid.',
                  ),
                ),
                if (paypal)
                  Padding(
                    padding: const EdgeInsets.only(top: 20),
                    child: FilledButton.icon(
                      onPressed: _busy ? null : _pay,
                      icon: const Icon(Icons.payment),
                      label: Text(
                        _busy
                            ? 'Checking payment…'
                            : 'Continue to PayPal Sandbox',
                      ),
                    ),
                  ),
              ],
            ],
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            TextButton.icon(
              onPressed: _busy ? null : _load,
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh booking status'),
            ),
            OutlinedButton(
              onPressed: _busy
                  ? null
                  : () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => MyBookingsScreen(api: widget.api),
                      ),
                    ),
              child: const Text('My bookings'),
            ),
          ],
        ),
      ),
    );
  }
}

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key, required this.api});
  final KarnelApi api;
  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  List<Map<String, dynamic>>? _rows;
  String? _error;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await TourBookingApi(widget.api.client).bookings();
      if (mounted) {
        setState(() {
          _rows = rows;
          _error = null;
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('My bookings')),
    body: RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_rows == null && _error == null)
            const Center(child: CircularProgressIndicator()),
          if (_error != null) ...[
            Text(_error!),
            TextButton(
              onPressed: () async {
                if (await requireTourSignIn(context, widget.api)) _load();
              },
              child: const Text('Sign in / retry'),
            ),
          ],
          if (_rows?.isEmpty == true)
            const Text(
              'No bookings yet. Choose a tour and select a departure to start your next journey.',
            ),
          for (final row in _rows ?? <Map<String, dynamic>>[])
            Card(
              margin: const EdgeInsets.only(bottom: 14),
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                title: Text(
                  row['bookingCode'].toString(),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  '${_serviceName(row)}\n${row['startDate']} · ${row['totalPassengers']} travelers\n${row['bookingStatus']} · ${row['paymentStatus']}\n${travelMoney(row['totalAmount'])}',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => BookingReceiptScreen(
                        api: widget.api,
                        bookingId: (row['bookingId'] as num).toInt(),
                      ),
                    ),
                  );
                  _load();
                },
              ),
            ),
        ],
      ),
    ),
  );
  String _serviceName(Map<String, dynamic> row) {
    final details = row['details'] as List? ?? [];
    if (details.isEmpty) return row['bookingType']?.toString() ?? 'Booking';
    final detail = details.first as Map;
    return (detail['tourName'] ??
            detail['providerName'] ??
            detail['vehicleName'] ??
            row['bookingType'])
        .toString();
  }
}
