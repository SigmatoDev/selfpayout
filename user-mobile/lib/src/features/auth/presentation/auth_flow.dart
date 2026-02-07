import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/gradient_button.dart';
import '../controller/auth_controller.dart';

class AuthFlow extends ConsumerStatefulWidget {
  const AuthFlow({super.key});

  @override
  ConsumerState<AuthFlow> createState() => _AuthFlowState();
}

class _AuthFlowState extends ConsumerState<AuthFlow> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _otpFocusNode = FocusNode();
  bool _sentOtp = false;
  bool _isLoading = false;
  String? _error;

  String? _normalizeIndianPhone() {
    final raw = _phoneController.text.trim().replaceAll(RegExp(r'\\s+'), '');
    final digitsOnly = raw.replaceAll(RegExp(r'\\D'), '');
    if (digitsOnly.length == 10) {
      return digitsOnly;
    }
    if (digitsOnly.length == 12 && digitsOnly.startsWith('91')) {
      return digitsOnly.substring(2);
    }
    return null;
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _otpFocusNode.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final normalizedPhone = _normalizeIndianPhone();
    if (normalizedPhone == null) {
      setState(() {
        _error = 'Enter a valid 10-digit Indian mobile number.';
      });
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).requestOtp(normalizedPhone);
      setState(() {
        _sentOtp = true;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _otpFocusNode.requestFocus();
        }
      });
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    final normalizedPhone = _normalizeIndianPhone();
    if (normalizedPhone == null) {
      setState(() {
        _error = 'Enter a valid 10-digit Indian mobile number.';
      });
      return;
    }
    debugPrint('AuthFlow: verifying OTP for $normalizedPhone');
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(
            normalizedPhone,
            _otpController.text.trim(),
          );
      debugPrint('AuthFlow: verifyOtp completed');
    } catch (error) {
      debugPrint('AuthFlow: verifyOtp error: $error');
      setState(() => _error = error.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final brandColor = Theme.of(context).colorScheme.primary;

    if (_sentOtp) {
      final phone = _normalizeIndianPhone();
      final displayPhone = phone?.isNotEmpty == true ? phone! : 'your phone';
      final otpText = _otpController.text;

      return Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: _isLoading
                          ? null
                          : () {
                              setState(() {
                                _sentOtp = false;
                                _otpController.clear();
                              });
                            },
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'OTP verification',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  'We sent a 6-digit code to',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                ),
                const SizedBox(height: 6),
                Text(
                  displayPhone,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 28),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 360),
                  child: TextField(
                    controller: _otpController,
                    focusNode: _otpFocusNode,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    maxLength: 6,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    enableSuggestions: false,
                    autocorrect: false,
                    textAlign: TextAlign.left,
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 4),
                    decoration: InputDecoration(
                      alignLabelWithHint: true,
                      labelText: '6-digit code',
                      counterText: '',
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Theme.of(context).colorScheme.outline),
                      ),
                      focusedBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: brandColor, width: 1.8),
                      ),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(height: 16),
                if (_error != null)
                  Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: AppGradientButton(
                    onPressed: _isLoading ? null : _verifyOtp,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Confirm & continue'),
                  ),
                ),
                const SizedBox(height: 14),
                Align(
                  alignment: Alignment.center,
                  child: TextButton(
                    onPressed: _isLoading ? null : _requestOtp,
                    child: const Text('Resend OTP'),
                  ),
                ),
                const SizedBox(height: 8),
                const Align(
                  alignment: Alignment.center,
                  child: Text(
                    'Use OTP 123456 for now.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 24),
            const Icon(Icons.local_mall_outlined, size: 48, color: Color(0xFFD00000)),
            const SizedBox(height: 16),
            Text(
              _sentOtp ? 'Verify OTP' : 'Welcome to SelfPayout',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              _sentOtp
                  ? 'Enter the 6-digit OTP sent to your phone.'
                  : 'Use your phone number to continue. OTP is required for login.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(10),
                  ],
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    prefixText: '+91 ',
                    hintText: '9876543210',
                  ),
                  enabled: !_sentOtp,
                ),
            const SizedBox(height: 16),
            if (_sentOtp)
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'OTP'),
              ),
            const SizedBox(height: 16),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
            const SizedBox(height: 12),
            AppGradientButton(
              onPressed: _isLoading ? null : (_sentOtp ? _verifyOtp : _requestOtp),
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(_sentOtp ? 'Verify & continue' : 'Send OTP'),
            ),
            if (_sentOtp)
              TextButton(
                onPressed: _isLoading ? null : _requestOtp,
                child: const Text('Resend OTP'),
              ),
            const SizedBox(height: 16),
            const Text(
              'Use OTP 123456 for now.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
