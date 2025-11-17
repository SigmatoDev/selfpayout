import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/di/providers.dart';
import 'core/language/language_controller.dart';
import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/controller/auth_controller.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/splash_screen.dart';
import 'features/signup/presentation/signup_screen.dart';
import 'features/workspace/presentation/workspace_shell.dart';

class SelfPayoutApp extends ConsumerWidget {
  const SelfPayoutApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeControllerProvider);
    final language = ref.watch(languageControllerProvider);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'SelfPayout Retailer',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      locale: Locale(language.code),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final tokenStorage = ref.watch(tokenStorageProvider);
    final hasToken = tokenStorage.hasToken;
    final isBootstrapping = hasToken && (authState.isLoading || (!authState.hasValue && !authState.hasError));

    void openSignup() {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const SignupScreen()),
      );
    }

    if (isBootstrapping) {
      return const AppSplashScreen();
    }

    if (authState.hasError) {
      final asyncError = authState.asError;
      final message = asyncError?.error is ApiException
          ? (asyncError!.error as ApiException).message
          : 'Unable to sign in.';
      return LoginScreen(
        onOpenSignup: openSignup,
        initialError: message,
      );
    }

    final user = authState.value;
    if (user != null) {
      return const WorkspaceShell();
    }

    return LoginScreen(
      onOpenSignup: openSignup,
      isBootstrapping: hasToken,
    );
  }
}
