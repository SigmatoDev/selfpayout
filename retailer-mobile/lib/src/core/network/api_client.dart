import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  ApiClient({required TokenStorage tokenStorage})
      : _tokenStorage = tokenStorage,
        _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 30),
          ),
        );

  final Dio _dio;
  final TokenStorage _tokenStorage;

  Future<T> get<T>(
    String path,
    T Function(dynamic data) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        path,
        queryParameters: queryParameters,
        options: _options(),
      );
      return parser(_unwrap(response.data));
    } on DioException catch (error) {
      throw _mapException(error);
    }
  }

  Future<T> post<T>(
    String path, {
    Map<String, dynamic>? body,
    required T Function(dynamic data) parser,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        path,
        data: body,
        options: _options(),
      );
      return parser(_unwrap(response.data));
    } on DioException catch (error) {
      throw _mapException(error);
    }
  }

  Future<void> postVoid(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    try {
      await _dio.post<dynamic>(
        path,
        data: body,
        options: _options(),
      );
    } on DioException catch (error) {
      throw _mapException(error);
    }
  }

  Options _options() {
    final headers = <String, dynamic>{
      'Content-Type': 'application/json',
    };
    final token = _tokenStorage.token;
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return Options(headers: headers);
  }

  dynamic _unwrap(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'];
    }
    return data;
  }

  ApiException _mapException(DioException error) {
    final status = error.response?.statusCode;
    if (status == 401) {
      _tokenStorage.clear();
    }

    final data = error.response?.data;
    String message;
    if (data is Map<String, dynamic> && data['message'] is String) {
      message = data['message'] as String;
    } else if (error.message != null && error.message!.isNotEmpty) {
      message = error.message!;
    } else {
      message = 'Request failed';
    }

    return ApiException(message, statusCode: status);
  }
}
