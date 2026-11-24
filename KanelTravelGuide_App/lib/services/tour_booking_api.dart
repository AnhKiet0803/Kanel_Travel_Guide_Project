import '../models/tour_checkout.dart';
import 'api_client.dart';

class TourBookingApi {
  TourBookingApi(this.client);
  final ApiClient client;
  static List<Map<String, dynamic>> list(dynamic data) => (data as List)
      .map((item) => Map<String, dynamic>.from(item as Map))
      .toList();
  Future<Map<String, dynamic>> paymentOptions() async =>
      Map<String, dynamic>.from(
        await client.get('/payments/paypal/options') as Map,
      );
  Future<List<Map<String, dynamic>>> promotions() async =>
      list(await client.get('/promotions?activeOnly=true'));
  Future<List<TourExtra>> extras(int tourId, String date) async {
    final links = list(await client.get('/tours/$tourId/extras'));
    final serviceIds = links
        .map((link) => link['serviceItemId'])
        .whereType<num>()
        .map((id) => id.toInt())
        .toSet();
    final scheduleIds = links
        .map((link) => link['scheduleId'])
        .whereType<num>()
        .map((id) => id.toInt())
        .toSet();
    final providerIds = links
        .map((link) => link['providerId'])
        .whereType<num>()
        .map((id) => id.toInt())
        .toSet();
    final providers = await Future.wait(
      providerIds.map(
        (id) async => Map<String, dynamic>.from(
          await client.get('/services/$id?date=$date') as Map,
        ),
      ),
    );
    final result = <TourExtra>[];
    for (final provider in providers) {
      final dining = provider['serviceType'] == 'Restaurant';
      for (final item in list(provider['items'])) {
        final id = (item['itemId'] as num).toInt();
        final price = (item['price'] as num).toDouble();
        final available = (item['remainingQuantity'] as num?)?.toInt() ?? 0;
        if (serviceIds.contains(id) &&
            item['isAvailable'] == true &&
            price > 0 &&
            available > 0) {
          result.add(
            TourExtra(
              id: id,
              kind: 'service',
              name: item['itemName'].toString(),
              provider: provider['providerName'].toString(),
              price: price,
              available: available,
              unit: dining ? 'dining option' : 'room / night',
            ),
          );
        }
      }
    }
    if (scheduleIds.isNotEmpty) {
      for (final item in list(
        await client.get('/schedules?date=$date&status=Running'),
      )) {
        final id = (item['scheduleId'] as num).toInt();
        final price = (item['ticketPrice'] as num).toDouble();
        final available = (item['remainingSeats'] as num?)?.toInt() ?? 0;
        if (scheduleIds.contains(id) &&
            item['status'] == 'Running' &&
            price > 0 &&
            available > 0) {
          result.add(
            TourExtra(
              id: id,
              kind: 'transport',
              name: item['vehicleName'].toString(),
              provider:
                  '${item['departureLocationName']} → ${item['destinationLocationName']}',
              price: price,
              available: available,
              unit: 'ticket',
              time: item['departureTime']?.toString(),
            ),
          );
        }
      }
    }
    return result;
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async =>
      Map<String, dynamic>.from(await client.post('/bookings', data) as Map);
  Future<Map<String, dynamic>> booking(int id) async =>
      Map<String, dynamic>.from(await client.get('/bookings/$id') as Map);
  Future<List<Map<String, dynamic>>> bookings() async =>
      list(await client.get('/bookings'));
  Future<Map<String, dynamic>> order(int id) async => Map<String, dynamic>.from(
    await client.post('/payments/paypal/$id/order') as Map,
  );
  Future<Map<String, dynamic>> capture(int id) async =>
      Map<String, dynamic>.from(
        await client.post('/payments/paypal/$id/capture') as Map,
      );
}
