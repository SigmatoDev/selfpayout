import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../network/api_client.dart';
import '../network/user_api.dart';
import '../storage/token_storage.dart';
import '../theme/theme_controller.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('SharedPreferences must be overridden at bootstrap.');
});

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return TokenStorage(prefs);
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final tokenStorage = ref.watch(tokenStorageProvider);
  return ApiClient(tokenStorage: tokenStorage);
});

final userApiProvider = Provider<UserApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return UserApi(client);
});

final themeControllerProvider = StateNotifierProvider<ThemeController, ThemeMode>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ThemeController(prefs);
});
