import 'package:flutter/material.dart';

String travelMoney(Object? value) {
  if (value is! num) return 'Price on request';
  final digits = value.round().toString();
  return '${digits.replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')} ₫';
}

class TravelImage extends StatelessWidget {
  const TravelImage({super.key, required this.url});
  final String? url;
  @override
  Widget build(BuildContext context) {
    Widget placeholder() => const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFD8F4DC), Color(0xFFBCEAF2)],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.landscape_outlined,
          size: 48,
          color: Color(0xFF38A29A),
        ),
      ),
    );
    return url == null
        ? placeholder()
        : Image.network(
            url!,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => placeholder(),
          );
  }
}
