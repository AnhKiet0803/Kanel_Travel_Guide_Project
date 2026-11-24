import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/tour_checkout.dart';
import '../services/api_client.dart';
import '../services/karnel_api.dart';
import '../services/tour_booking_api.dart';
import '../utils/validators.dart';
import '../widgets/travel_ui.dart';
import 'booking_receipt_screen.dart';
import 'paypal_checkout_screen.dart';
import 'sign_in_screen.dart';

class TourBookingScreen extends StatefulWidget {
  const TourBookingScreen({
    super.key,
    required this.api,
    required this.tour,
    required this.departure,
    this.imageUrl,
  });
  final KarnelApi api;
  final Map<String, dynamic> tour, departure;
  final String? imageUrl;
  @override
  State<TourBookingScreen> createState() => _TourBookingScreenState();
}

class _TourBookingScreenState extends State<TourBookingScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController(),
      _phone = TextEditingController(),
      _email = TextEditingController(),
      _notes = TextEditingController(),
      _code = TextEditingController();
  late Map<String, dynamic> _departure;
  int _adults = 2;
  final List<int?> _ages = [];
  List<TourExtra> _extras = [];
  final Map<String, int> _quantities = {};
  Map<String, dynamic>? _promotion;
  Map<String, dynamic> _paymentOptions = {};
  bool _loading = true, _saving = false, _applying = false, _uncertain = false;
  bool _availabilityReady = false;
  String _method = 'PayAfterConfirmation';
  String? _error, _promoError, _paymentError;
  TourBookingApi get _api => TourBookingApi(widget.api.client);
  int get _tourId => (widget.tour['tourId'] as num).toInt();
  int get _seats => (_departure['seatsLeft'] as num?)?.toInt() ?? 0;
  bool get _paypal => _paymentOptions['enabled'] == true && supportsAppPayPal;
  TourQuote get _quote => TourQuote(
    tourId: _tourId,
    departure: _departure,
    adults: _adults,
    childAges: _ages,
    extras: _extras,
    quantities: _quantities,
    promotion: _promotion,
  );

  @override
  void initState() {
    super.initState();
    _departure = widget.departure;
    if (_seats < 2) _adults = 1;
    _fillUser();
    _refresh();
  }

  void _fillUser() {
    if (_name.text.isEmpty) {
      _name.text = widget.api.sessionUser?['fullName']?.toString() ?? '';
    }
    if (_email.text.isEmpty) {
      _email.text = widget.api.sessionUser?['email']?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    for (final controller in [_name, _phone, _email, _notes, _code]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() {
      _loading = true;
      _availabilityReady = false;
      _error = null;
    });
    try {
      final departures = await widget.api.getTourDepartures(_tourId);
      final matching = departures.where(
        (item) => item['tourDepartureId'] == _departure['tourDepartureId'],
      );
      if (matching.isEmpty) {
        throw ApiException(
          'This departure is no longer published. Return to the tour and select another date.',
        );
      }
      final departure = matching.first;
      final extras = await _api.extras(
        _tourId,
        departure['departureDate'].toString(),
      );
      Map<String, dynamic> options = {};
      String? paymentError;
      try {
        options = await _api.paymentOptions();
      } catch (_) {
        paymentError = 'Online payment availability could not be checked. Refresh to try again.';
      }
      if (mounted) {
        setState(() {
          _departure = departure;
          _extras = extras;
          _paymentOptions = options;
          _paymentError = paymentError;
          _loading = false;
          _availabilityReady = true;
          if (!_paypal && _method == 'PayPalSandbox') {
            _method = 'PayAfterConfirmation';
          }
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _applyPromo() async {
    if (_applying || _saving) return;
    final code = _code.text.trim().toUpperCase();
    if (code.isEmpty) {
      setState(() {
        _promotion = null;
        _promoError = null;
      });
      return;
    }
    setState(() {
      _applying = true;
      _promoError = null;
    });
    try {
      final promotions = await _api.promotions();
      final matching = promotions.where(
        (promo) => promo['promoCode']?.toString().toUpperCase() == code,
      );
      if (matching.isEmpty) {
        throw ApiException('This promo code is invalid or expired.');
      }
      if (mounted) setState(() => _promotion = matching.first);
    } catch (error) {
      if (mounted) {
        setState(() {
          _promotion = null;
          _promoError = error.toString();
        });
      }
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  Future<void> _submit() async {
    if (_saving ||
        _loading ||
        _applying ||
        !_availabilityReady ||
        _uncertain ||
        !_form.currentState!.validate()) {
      return;
    }
    final quote = _quote;
    final invalid = quote.validate();
    if (invalid != null) {
      setState(() => _error = invalid);
      return;
    }
    if (_method == 'PayPalSandbox' && (!_paypal || quote.total <= 0)) {
      setState(() => _error = 'Choose an available payment method.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    bool sending = false;
    try {
      if (!await requireTourSignIn(context, widget.api)) return;
      if (!mounted) return;
      _fillUser();
      sending = true;
      final booking = await _api.create(
        quote.bookingRequest(
          name: _name.text,
          phone: _phone.text,
          email: _email.text,
          paymentMethod: _method,
          notes: _notes.text,
        ),
      );
      final id = (booking['bookingId'] as num?)?.toInt();
      if (id == null) {
        throw const FormatException(
          'The booking response did not contain a reference. Check My bookings before retrying.',
        );
      }
      if (!mounted) return;
      final actualTotal = (booking['totalAmount'] as num?)?.toDouble();
      final changed =
          actualTotal == null || (actualTotal - quote.total).abs() > .01;
      if (changed) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'The final server price has changed. Review your booking total before paying.',
            ),
          ),
        );
      }
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => BookingReceiptScreen(
            api: widget.api,
            bookingId: id,
            startPayment: _method == 'PayPalSandbox' && !changed,
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _uncertain =
            sending &&
            (error is! ApiException ||
                error.statusCode == 0 ||
                error.statusCode >= 500);
        _error = _uncertain
            ? 'We could not confirm whether the booking was saved. Check My bookings before creating another request. ${error.toString()}'
            : error.toString();
      });
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _section(String title, List<Widget> children) => Card(
    color: Colors.white,
    margin: const EdgeInsets.only(bottom: 18),
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Color(0xFF164E52),
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    ),
  );
  Widget _line(String label, String value, {bool strong = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label)),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontWeight: strong ? FontWeight.w800 : FontWeight.w500,
            ),
          ),
        ),
      ],
    ),
  );
  Widget _counter(
    String label,
    String hint,
    int value,
    VoidCallback? minus,
    VoidCallback? plus,
  ) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(
                hint,
                style: const TextStyle(fontSize: 12, color: Color(0xFF526C68)),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Remove $label',
          onPressed: _saving ? null : minus,
          icon: const Icon(Icons.remove_circle_outline),
        ),
        Text('$value'),
        IconButton(
          tooltip: 'Add $label',
          onPressed: _saving ? null : plus,
          icon: const Icon(Icons.add_circle_outline),
        ),
      ],
    ),
  );
  Widget _paymentChoice(
    String value,
    String label,
    String hint, {
    bool enabled = true,
  }) => Semantics(
    button: true,
    selected: _method == value,
    child: Card(
      margin: const EdgeInsets.only(bottom: 10),
      color: _method == value
          ? const Color(0xFFE7F7DF)
          : const Color(0xFFF7F9F7),
      child: ListTile(
        enabled: enabled && !_saving,
        onTap: enabled && !_saving
            ? () => setState(() => _method = value)
            : null,
        leading: Icon(
          _method == value
              ? Icons.radio_button_checked
              : Icons.radio_button_off,
          color: enabled ? const Color(0xFF087F78) : Colors.grey,
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(hint),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final quote = _quote;
    return PopScope(
      canPop: !_saving,
      child: Scaffold(
        backgroundColor: const Color(0xFFFFFCF5),
        appBar: AppBar(
          title: const Text(
            'Complete your booking',
            style: TextStyle(fontSize: 18),
          ),
          actions: [
            IconButton(
              tooltip: 'My bookings',
              onPressed: _saving
                  ? null
                  : () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => MyBookingsScreen(api: widget.api),
                      ),
                    ),
              icon: const Icon(Icons.receipt_long_outlined),
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : SafeArea(
                child: RefreshIndicator(
                  onRefresh: _saving ? () async {} : _refresh,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _form,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (_error != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 18),
                              child: Text(
                                _error!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                          _section('Your journey', [
                            if (widget.imageUrl != null)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: SizedBox(
                                  height: 140,
                                  width: double.infinity,
                                  child: TravelImage(url: widget.imageUrl),
                                ),
                              ),
                            const SizedBox(height: 12),
                            Text(
                              widget.tour['tourName'].toString(),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              '${_departure['departureDate']} → ${_departure['returnDate']}',
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '$_seats seats available · Vietnam local time',
                            ),
                            TextButton(
                              onPressed: _saving
                                  ? null
                                  : () => Navigator.of(context).pop(),
                              child: const Text('Choose another departure'),
                            ),
                          ]),
                          _section('Who is traveling?', [
                            _counter(
                              'Adults',
                              'Ages 18+',
                              _adults,
                              _adults > 1
                                  ? () => setState(() => _adults--)
                                  : null,
                              quote.travelers < math.min(_seats, 1000)
                                  ? () => setState(() => _adults++)
                                  : null,
                            ),
                            _counter(
                              'Children',
                              'Ages 2–17',
                              _ages.length,
                              _ages.isNotEmpty
                                  ? () => setState(() => _ages.removeLast())
                                  : null,
                              quote.travelers < math.min(_seats, 1000)
                                  ? () => setState(() => _ages.add(null))
                                  : null,
                            ),
                            for (int index = 0; index < _ages.length; index++)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: DropdownButtonFormField<int>(
                                  key: ValueKey('child-$index'),
                                  initialValue: _ages[index],
                                  decoration: InputDecoration(
                                    labelText: 'Child ${index + 1} age',
                                    border: const OutlineInputBorder(),
                                  ),
                                  items: List.generate(
                                    16,
                                    (i) => DropdownMenuItem(
                                      value: i + 2,
                                      child: Text('${i + 2} years old'),
                                    ),
                                  ),
                                  onChanged: _saving
                                      ? null
                                      : (age) =>
                                            setState(() => _ages[index] = age),
                                  validator: (age) => age == null
                                      ? 'Choose this child’s age.'
                                      : null,
                                ),
                              ),
                            const Text(
                              'Children must travel with an adult. Contact the organizer for travelers under 2.',
                            ),
                          ]),
                          _section('Make this trip your own', [
                            if (_extras.isEmpty)
                              const Text(
                                'No additional services are currently available for this departure.',
                              ),
                            for (final item in _extras)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 18),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    Text(item.provider),
                                    if (item.time != null)
                                      Text(
                                        'Departure ${item.time!.substring(0, 5)}',
                                      ),
                                    Text(
                                      '${travelMoney(item.price)} / ${item.unit} · ${item.available} available',
                                      style: const TextStyle(
                                        color: Color(0xFF087F78),
                                      ),
                                    ),
                                    if (item.unit == 'room / night')
                                      Text(
                                        'One night on ${_departure['departureDate']}. This is an extra charge.',
                                      ),
                                    DropdownButton<int>(
                                      isExpanded: true,
                                      value:
                                          (_quantities[item.key] ?? 0) <=
                                              math.min(item.available, 30)
                                          ? _quantities[item.key] ?? 0
                                          : 0,
                                      items: List.generate(
                                        math.min(item.available, 30) + 1,
                                        (i) => DropdownMenuItem(
                                          value: i,
                                          child: Text(
                                            i == 0
                                                ? 'Not added'
                                                : '$i ${item.unit}',
                                          ),
                                        ),
                                      ),
                                      onChanged: _saving
                                          ? null
                                          : (quantity) => setState(
                                              () => _quantities[item.key] =
                                                  quantity ?? 0,
                                            ),
                                    ),
                                  ],
                                ),
                              ),
                            const Text(
                              'Check service times and services already included in the tour before adding extras.',
                            ),
                          ]),
                          _section('Guest contact details', [
                            TextFormField(
                              key: const Key('booking-name'),
                              controller: _name,
                              enabled: !_saving,
                              decoration: const InputDecoration(
                                labelText: 'Full name',
                                border: OutlineInputBorder(),
                              ),
                              maxLength: 100,
                              validator: (value) =>
                                  validateRequired(value, 'Full name', 100),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              key: const Key('booking-phone'),
                              controller: _phone,
                              enabled: !_saving,
                              keyboardType: TextInputType.phone,
                              maxLength: 20,
                              decoration: const InputDecoration(
                                labelText: 'Mobile phone',
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) =>
                                  validateRequired(value, 'Mobile phone', 20) ??
                                  validateOptionalPhone(value),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              key: const Key('booking-email'),
                              controller: _email,
                              enabled: !_saving,
                              keyboardType: TextInputType.emailAddress,
                              maxLength: 100,
                              decoration: const InputDecoration(
                                labelText: 'Email for booking updates',
                                border: OutlineInputBorder(),
                              ),
                              validator: validateEmail,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _notes,
                              enabled: !_saving,
                              maxLength: 500,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                labelText: 'Special requests (optional)',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ]),
                          _section('Promo code', [
                            TextField(
                              controller: _code,
                              enabled: !_saving,
                              maxLength: 50,
                              textCapitalization: TextCapitalization.characters,
                              decoration: const InputDecoration(
                                labelText: 'Promo code',
                                border: OutlineInputBorder(),
                              ),
                              onChanged: (value) {
                                if (_promotion != null &&
                                    value.trim().toUpperCase() !=
                                        _promotion!['promoCode']) {
                                  setState(() => _promotion = null);
                                }
                              },
                            ),
                            TextButton(
                              onPressed: _applying || _saving
                                  ? null
                                  : _applyPromo,
                              child: Text(
                                _applying ? 'Checking…' : 'Apply code',
                              ),
                            ),
                            if (_promotion != null)
                              Text('Applied: ${_promotion!['promoCode']}'),
                            if (_promoError != null)
                              Text(
                                _promoError!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                          ]),
                          _section('Payment method', [
                            _paymentChoice(
                              'PayAfterConfirmation',
                              'Pay after confirmation',
                              'The organizer confirms the trip and provides payment instructions.',
                            ),
                            _paymentChoice(
                              'BankTransfer',
                              'Bank transfer',
                              'Bank details are provided after booking confirmation.',
                            ),
                            _paymentChoice(
                              'PayPalSandbox',
                              'PayPal Sandbox',
                              _paymentOptions['enabled'] != true
                                  ? 'Currently unavailable from the server.'
                                  : !supportsAppPayPal
                                  ? 'Available in the Android or iOS app.'
                                  : 'Secure test checkout in USD. No real funds.',
                              enabled: _paypal,
                            ),
                            if (_paymentError != null) Text(_paymentError!),
                            if (_method == 'PayPalSandbox' &&
                                (_paymentOptions['vndPerUsd'] as num? ?? 0) > 0)
                              Text(
                                'Estimated USD ${(quote.total / (_paymentOptions['vndPerUsd'] as num)).toStringAsFixed(2)}. The server confirms the final amount.',
                              ),
                          ]),
                          _section('Order summary', [
                            _line(
                              'Adults × $_adults',
                              travelMoney(quote.adultTotal),
                            ),
                            _line(
                              'Children × ${_ages.length}',
                              travelMoney(quote.childTotal),
                            ),
                            for (final item in _extras)
                              if ((_quantities[item.key] ?? 0) > 0)
                                _line(
                                  '${item.name} × ${_quantities[item.key]}',
                                  travelMoney(
                                    item.price * _quantities[item.key]!,
                                  ),
                                ),
                            const Divider(),
                            _line('Subtotal', travelMoney(quote.subtotal)),
                            if (_promotion != null)
                              _line(
                                'Discount',
                                '-${travelMoney(quote.discount)}',
                              ),
                            _line(
                              'Estimated total',
                              travelMoney(quote.total),
                              strong: true,
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'Current fares and availability are checked by the server before the booking is saved.',
                            ),
                          ]),
                          FilledButton.icon(
                            key: const Key('booking-submit'),
                            onPressed:
                                _saving ||
                                    _applying ||
                                    !_availabilityReady ||
                                    _uncertain
                                ? null
                                : _submit,
                            icon: const Icon(Icons.lock_outline),
                            label: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              child: Text(
                                _saving
                                    ? 'Saving your booking…'
                                    : '${_method == 'PayPalSandbox' ? 'Continue to PayPal' : 'Send booking request'} · ${travelMoney(quote.total)}',
                              ),
                            ),
                          ),
                          if (_uncertain)
                            TextButton(
                              onPressed: () => Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) =>
                                      MyBookingsScreen(api: widget.api),
                                ),
                              ),
                              child: const Text(
                                'Check My bookings before trying again',
                              ),
                            ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}
