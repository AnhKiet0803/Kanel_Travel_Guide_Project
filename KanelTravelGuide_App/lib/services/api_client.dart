// Small HTTP client for the Karnel backend (ASP.NET Core Web API, see KanelTravelGuide_BE/docs/api-endpoints.md).
// The backend signs in with a JWT, so after login set [token] and every request carries
// "Authorization: Bearer <token>". Extend this class (do not duplicate it) when more screens need the API.
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// An error from the API or the network. [statusCode] is 0 when the server could not be reached.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode = 0});

  final String message;
  final int statusCode;

  @override
  String toString() => message;
}

/// Base URL of the API. Override with `--dart-define=API_BASE_URL=http://<ip>:5011/api`
/// (needed on a real phone; use the PC's LAN address).
String defaultBaseUrl() {
  const fromEnvironment = String.fromEnvironment('API_BASE_URL');
  if (fromEnvironment.isNotEmpty) return fromEnvironment;
  // The Android emulator reaches the host machine through 10.0.2.2.
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:5011/api';
  }
  return 'http://localhost:5011/api';
}

class ApiClient {
  ApiClient({String? baseUrl, http.Client? httpClient, this.token})
      : baseUrl = (baseUrl ?? defaultBaseUrl()).replaceAll(RegExp(r'/$'), ''),
        _http = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  /// JWT returned by `POST /auth/login`; null when nobody is signed in.
  String? token;

  Future<dynamic> get(String path) => _send('GET', path);

  Future<dynamic> post(String path, [Object? body]) => _send('POST', path, body);

  Future<dynamic> put(String path, [Object? body]) => _send('PUT', path, body);

  Future<dynamic> _send(String method, String path, [Object? body]) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token!.isNotEmpty) 'Authorization': 'Bearer $token',
    };
    final encoded = body == null ? null : jsonEncode(body);

    final http.Response response;
    try {
      response = await switch (method) {
        'POST' => _http.post(uri, headers: headers, body: encoded),
        'PUT' => _http.put(uri, headers: headers, body: encoded),
        _ => _http.get(uri, headers: headers),
      };
    } catch (_) {
      throw ApiException('Cannot reach the server. Please try again later.');
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(_errorMessage(response), statusCode: response.statusCode);
    }
    if (response.statusCode == 204 || response.bodyBytes.isEmpty) return null;
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  // ASP.NET returns { errors: { Field: ['...'] } } for invalid data, or { title, detail } / { message } otherwise.
  String _errorMessage(http.Response response) {
    const fallback = 'Something went wrong. Please try again.';
    try {
      final problem = jsonDecode(utf8.decode(response.bodyBytes));
      if (problem is Map) {
        final errors = problem['errors'];
        if (errors is Map && errors.isNotEmpty) {
          final first = errors.values.first;
          if (first is List && first.isNotEmpty) return first.first.toString();
          if (first is String) return first;
        }
        final detail = problem['detail'];
        if (detail is String && detail.isNotEmpty) return detail;
        final message = problem['message'];
        if (message is String && message.isNotEmpty) return message;
      }
    } catch (_) {
      // not JSON: keep the default message
    }
    return fallback;
  }
}
