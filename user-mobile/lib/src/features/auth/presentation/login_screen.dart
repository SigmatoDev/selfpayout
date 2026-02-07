import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/language/language_controller.dart';
import '../../../core/widgets/gradient_button.dart';
import '../controller/auth_controller.dart';

const _demoPhone = '9876543210';
const _demoOtp = '123456';

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
  final _phoneController = TextEditingController(text: _demoPhone);
  final _otpController = TextEditingController(text: _demoOtp);

  String? _normalizeIndianPhone(String value) {
    final digitsOnly = value.replaceAll(RegExp(r'\D'), '');
    if (digitsOnly.length == 10 && RegExp(r'^[6-9]').hasMatch(digitsOnly)) {
      return digitsOnly;
    }
    if (digitsOnly.length == 12 && digitsOnly.startsWith('91')) {
      final candidate = digitsOnly.substring(2);
      if (RegExp(r'^[6-9]').hasMatch(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final phone = _normalizeIndianPhone(_phoneController.text.trim());
    if (phone == null) return;
    await ref.read(authControllerProvider.notifier).loginWithOtp(
          phone,
          _otpController.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final strings = ref.watch(languageStringsProvider);
    final isLoading = authState.isLoading || widget.isBootstrapping;
    final brandColor = Theme.of(context).colorScheme.primary;
    final logoCardColor = Theme.of(context).colorScheme.primary;
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
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Container(
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
                              child: Image.asset(
                                'assets/brand/sflogo.png',
                                height: 48,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Welcome to Self Payout',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Retailer workspace login',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: Colors.black54,
                                ),
                          ),
                          const SizedBox(height: 32),
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(10),
                            ],
                            decoration: InputDecoration(
                              labelText: 'Phone number',
                              hintText: '9876543210',
                              prefixText: '+91 ',
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(color: Theme.of(context).colorScheme.outline),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 1.4),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Phone number is required';
                              }
                              if (_normalizeIndianPhone(value) == null) {
                                return 'Enter a valid Indian mobile number';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _otpController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'OTP',
                              hintText: '123456',
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'OTP is required';
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
                          AppGradientButton(
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
