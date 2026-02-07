import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/di/providers.dart';
import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/controller/auth_controller.dart';
import 'features/auth/presentation/auth_flow.dart';
import 'features/auth/presentation/splash_screen.dart';
import 'features/dashboard/presentation/user_shell.dart';
import 'features/onboarding/presentation/onboarding_screen.dart';

class SelfPayoutApp extends ConsumerWidget {
  const SelfPayoutApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeControllerProvider);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'SelfPayout',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      home: const SplashGate(),
    );
  }
}

class SplashGate extends StatefulWidget {
  const SplashGate({super.key});

  @override
  State<SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<SplashGate> {
  bool _showSplash = true;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 3), () {
      if (!mounted) return;
      setState(() => _showSplash = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return _showSplash ? const UserSplashScreen() : const AuthGate();
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

    if (isBootstrapping) {
      return const UserSplashScreen();
    }

    if (authState.hasError) {
      final asyncError = authState.asError;
      final message = asyncError?.error is ApiException
          ? (asyncError!.error as ApiException).message
          : 'Unable to sign in.';
      return Scaffold(
        body: Column(
          children: [
            Expanded(child: AuthFlow(key: ValueKey(message))),
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(message, style: const TextStyle(color: Colors.redAccent)),
            ),
          ],
        ),
      );
    }

    final user = authState.value;
    if (user != null) {
      if ((user.name == null || user.name!.isEmpty) || (user.address == null || user.address!.isEmpty)) {
        return OnboardingScreen(profile: user);
      }
      return const UserShell();
    }

    return const AuthFlow();
  }
}
