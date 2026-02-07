import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_client.dart';
import '../../../models/user_models.dart';

class AuthController extends AsyncNotifier<ConsumerProfile?> {
  @override
  Future<ConsumerProfile?> build() async {
    ref.keepAlive();
    final tokenStorage = ref.watch(tokenStorageProvider);
    if (!tokenStorage.hasToken) {
      return null;
    }

    try {
      return await ref.watch(userApiProvider).fetchProfile();
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        await tokenStorage.clear();
        return null;
      }
      rethrow;
    }
  }

  Future<void> requestOtp(String phone) async {
    await ref.read(userApiProvider).requestOtp(phone);
  }

  Future<void> verifyOtp(String phone, String otp) async {
    state = const AsyncLoading();
    try {
      debugPrint('AuthController: verifyOtp start for $phone');
      final result = await ref.read(userApiProvider).verifyOtp(phone, otp);
      debugPrint('AuthController: verifyOtp success, saving token');
      await ref.read(tokenStorageProvider).save(result.token);
      state = AsyncData(result.consumer);
      debugPrint(
        'AuthController: state updated, user name=${result.consumer.name ?? ''} address=${result.consumer.address ?? ''}',
      );
    } on ApiException catch (error, stackTrace) {
      debugPrint('AuthController: verifyOtp failed: ${error.message}');
      state = AsyncError(error, stackTrace);
    }
  }

  Future<void> updateProfile(ConsumerProfile profile) async {
    state = const AsyncLoading();
    try {
      final updated = await ref.read(userApiProvider).updateProfile(profile);
      state = AsyncData(updated);
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
    AsyncNotifierProvider<AuthController, ConsumerProfile?>(AuthController.new);
