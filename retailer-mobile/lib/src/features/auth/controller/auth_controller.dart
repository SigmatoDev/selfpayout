import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';

class AuthController extends AsyncNotifier<CurrentUser?> {
  @override
  Future<CurrentUser?> build() async {
    final tokenStorage = ref.watch(tokenStorageProvider);
    if (!tokenStorage.hasToken) {
      return null;
    }

    try {
      return await ref.watch(retailerApiProvider).fetchCurrentUser();
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        await tokenStorage.clear();
        return null;
      }
      rethrow;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final result = await ref.read(retailerApiProvider).login(email, password);
      await ref.read(tokenStorageProvider).save(result.token);
      state = AsyncData(result.user);
    } on ApiException catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }

  Future<void> logout() async {
    await ref.read(tokenStorageProvider).clear();
    state = const AsyncData(null);
  }
}

final authControllerProvider =
    AsyncNotifierProvider<AuthController, CurrentUser?>(AuthController.new);
