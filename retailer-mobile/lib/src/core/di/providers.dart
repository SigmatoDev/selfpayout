import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../language/language_controller.dart';
import '../network/api_client.dart';
import '../network/retailer_api.dart';
import '../offline/offline_queue.dart';
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

final retailerApiProvider = Provider<RetailerApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return RetailerApi(client);
});

final themeControllerProvider = StateNotifierProvider<ThemeController, ThemeMode>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ThemeController(prefs);
});

final languageControllerProvider = StateNotifierProvider<LanguageController, SupportedLanguage>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return LanguageController(prefs);
});

final languageStringsProvider = Provider<LanguageStrings>((ref) {
  final language = ref.watch(languageControllerProvider);
  return LanguageStrings(language);
});

final offlineQueueServiceProvider = Provider<OfflineQueueService>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return OfflineQueueService(prefs);
});

final offlineQueueControllerProvider =
    StateNotifierProvider<OfflineQueueController, List<OfflineInvoiceEntry>>((ref) {
  final service = ref.watch(offlineQueueServiceProvider);
  return OfflineQueueController(service);
});
