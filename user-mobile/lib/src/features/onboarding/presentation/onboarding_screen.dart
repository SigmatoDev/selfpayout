import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/auth/controller/auth_controller.dart';
import '../../../models/user_models.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key, required this.profile});

  final ConsumerProfile profile;

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  String _locationLabel = 'Home';
  String _locationHint = 'Bengaluru, Karnataka';
  bool _notifications = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _nameController.text = widget.profile.name ?? '';
    _emailController.text = widget.profile.email ?? '';
    _addressController.text = widget.profile.address ?? 'MG Road, Bengaluru, Karnataka 560001';
    _notifications = widget.profile.notificationsEnabled;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final address = _addressController.text.trim();
    if (name.length < 2) {
      setState(() => _error = 'Please enter your full name.');
      return;
    }
    if (address.length < 4) {
      setState(() => _error = 'Please enter a valid address.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final updated = widget.profile.copyWith(
        name: name,
        email: email.isEmpty ? null : email,
        address: '$address (${_locationLabel})',
        notificationsEnabled: _notifications,
      );
      await ref.read(authControllerProvider.notifier).updateProfile(updated);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Set up your profile'),
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Text(
              'Tell us a bit about you. This helps personalize your marketplace.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email (optional)'),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Address', style: Theme.of(context).textTheme.titleSmall),
                DropdownButton<String>(
                  value: _locationLabel,
                  underline: const SizedBox.shrink(),
                  items: const [
                    DropdownMenuItem(value: 'Home', child: Text('Home')),
                    DropdownMenuItem(value: 'Office', child: Text('Office')),
                    DropdownMenuItem(value: 'Other', child: Text('Other')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _locationLabel = value);
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _addressController,
              decoration: InputDecoration(
                labelText: 'Street address',
                helperText: 'Auto-filled to $_locationHint',
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _locationHint = 'Bengaluru, Karnataka';
                      _addressController.text = 'MG Road, Bengaluru, Karnataka 560001';
                    });
                  },
                  icon: const Icon(Icons.my_location),
                  label: const Text('Use current location'),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _locationHint = 'Bengaluru, Karnataka';
                    });
                  },
                  icon: const Icon(Icons.map_outlined),
                  label: const Text('Choose on map'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              value: _notifications,
              title: const Text('Enable notifications'),
              onChanged: (value) => setState(() => _notifications = value),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
              ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Continue'),
            ),
          ],
        ),
      ),
    );
  }
}
