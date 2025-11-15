import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/language/language_controller.dart';
import '../controller/auth_controller.dart';

const _demoEmail = 'demo@shop.com';
const _demoPassword = 'Retail@123';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({
    super.key,
    required this.onOpenSignup,
    this.initialError,
    this.isBootstrapping = false,
  });

  final VoidCallback onOpenSignup;
  final String? initialError;
  final bool isBootstrapping;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: _demoEmail);
  final _passwordController = TextEditingController(text: _demoPassword);

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authControllerProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final strings = ref.watch(languageStringsProvider);
    final isLoading = authState.isLoading || widget.isBootstrapping;
    final brandColor = Theme.of(context).colorScheme.primary;
    const logoCardColor = Color(0xFFD00000);
    final errorText = widget.initialError;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              brandColor.withValues(alpha: 0.2),
              Colors.transparent,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: logoCardColor,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: logoCardColor.withValues(alpha: 0.35),
                                  blurRadius: 28,
                                  offset: const Offset(0, 12),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Image.asset(
                                'assets/brand/selfpayout_logo.png',
                                height: 48,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            strings.label(TranslationKey.welcome),
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: Colors.black54,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Retailer workspace login',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 32),
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Shop email',
                              hintText: 'you@shop.com',
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Email is required';
                              }
                              if (!value.contains('@')) {
                                return 'Enter a valid email';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Password',
                              hintText: '••••••',
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Password is required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          if (errorText != null)
                            Text(
                              errorText,
                              style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                            ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: isLoading ? null : _submit,
                            child: isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Text('Sign in'),
                          ),
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: widget.onOpenSignup,
                            child: Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 6,
                              children: [
                                const Text('New retailer?', style: TextStyle(fontSize: 13)),
                                Text(
                                  'Apply for onboarding',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Theme.of(context).colorScheme.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
