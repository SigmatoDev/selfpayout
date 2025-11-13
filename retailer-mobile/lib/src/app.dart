import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/di/providers.dart';
import 'core/language/language_controller.dart';
import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/controller/auth_controller.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/signup/presentation/signup_screen.dart';
import 'features/workspace/presentation/workspace_shell.dart';

class SelfcheckoutApp extends ConsumerWidget {
  const SelfcheckoutApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeControllerProvider);
    final language = ref.watch(languageControllerProvider);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Selfcheckout Retailer',
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

    void openSignup() {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const SignupScreen()),
      );
    }

    return authState.when(
      data: (user) {
        if (user != null) {
          return const WorkspaceShell();
        }
        return LoginScreen(
          onOpenSignup: openSignup,
        );
      },
      loading: () {
        if (tokenStorage.hasToken) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        return LoginScreen(
          onOpenSignup: openSignup,
          isBootstrapping: true,
        );
      },
      error: (error, _) {
        final message = error is ApiException ? error.message : 'Unable to sign in.';
        return LoginScreen(
          onOpenSignup: openSignup,
          initialError: message,
        );
      },
    );
  }
}
