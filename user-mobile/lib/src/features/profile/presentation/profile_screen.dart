import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/auth/controller/auth_controller.dart';
import '../../../models/user_models.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _avatarController = TextEditingController();
  final _addressController = TextEditingController();
  bool _notifications = true;
  bool _saving = false;
  String? _status;
  bool _initialized = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _avatarController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _syncControllers(ConsumerProfile profile) {
    if (_initialized) return;
    _nameController.text = profile.name ?? '';
    _emailController.text = profile.email ?? '';
    _avatarController.text = profile.avatarUrl ?? '';
    _addressController.text = profile.address ?? '';
    _notifications = profile.notificationsEnabled;
    _initialized = true;
  }

  Future<bool> _save(ConsumerProfile profile) async {
    setState(() {
      _saving = true;
      _status = null;
    });
    try {
      final updated = profile.copyWith(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        avatarUrl: _avatarController.text.trim(),
        address: _addressController.text.trim(),
        notificationsEnabled: _notifications,
      );
      await ref.read(authControllerProvider.notifier).updateProfile(updated);
      if (mounted) {
        setState(() => _status = 'Profile updated.');
      }
      return true;
    } catch (error) {
      setState(() => _status = error.toString());
      return false;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openEditSheet(ConsumerProfile profile) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: 20 + MediaQuery.of(sheetContext).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text('Edit Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(sheetContext).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _avatarController,
                decoration: const InputDecoration(labelText: 'Avatar image URL'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _addressController,
                decoration: const InputDecoration(labelText: 'Address'),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                value: _notifications,
                onChanged: (value) => setState(() => _notifications = value),
                title: const Text('Notifications'),
              ),
              if (_status != null)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(_status!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving
                      ? null
                      : () async {
                          final success = await _save(profile);
                          if (!mounted) return;
                          if (success) {
                            Navigator.of(sheetContext).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Profile updated')),
                            );
                          }
                        },
                  child: _saving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Save changes'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(authControllerProvider).valueOrNull;
    if (profile == null) {
      return const Center(child: CircularProgressIndicator());
    }

    _syncControllers(profile);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F3),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 56, 16, 24),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF7B3F3F), Color(0xFFB78E8E), Color(0xFFF7F5F3)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
                  onPressed: () => Navigator.of(context).maybePop(),
                ),
                const Expanded(
                  child: Center(
                    child: Text('My Profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.settings, color: Colors.white),
                  onPressed: () {},
                ),
              ],
            ),
          ),
          Container(
            transform: Matrix4.translationValues(0, -30, 0),
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                )
              ],
            ),
            child: Row(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: const Color(0xFFF0E7E7),
                      backgroundImage: profile.avatarUrl?.isNotEmpty == true ? NetworkImage(profile.avatarUrl!) : null,
                      child: profile.avatarUrl?.isNotEmpty == true
                          ? null
                          : const Icon(Icons.person, color: Color(0xFF7B3F3F), size: 32),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: CircleAvatar(
                        radius: 14,
                        backgroundColor: const Color(0xFF1F6FEB),
                        child: const Icon(Icons.edit, size: 14, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.name ?? 'Your profile',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile.email?.isNotEmpty == true ? profile.email! : profile.phone,
                        style: const TextStyle(fontSize: 12, color: Colors.black54),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: () => _openEditSheet(profile),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                        child: const Text('Edit Profile', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: const [
                _ProfileOptionTile(icon: Icons.favorite_border, label: 'Favourites'),
                _ProfileOptionTile(icon: Icons.download_for_offline_outlined, label: 'Downloads'),
                Divider(height: 24),
                _ProfileOptionTile(icon: Icons.language, label: 'Languages'),
                _ProfileOptionTile(icon: Icons.location_on_outlined, label: 'Location'),
                _ProfileOptionTile(icon: Icons.subscriptions_outlined, label: 'Subscription'),
                _ProfileOptionTile(icon: Icons.desktop_windows_outlined, label: 'Display'),
                Divider(height: 24),
                _ProfileOptionTile(icon: Icons.delete_outline, label: 'Clear Cache'),
                _ProfileOptionTile(icon: Icons.history, label: 'Clear History'),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextButton.icon(
              onPressed: () => ref.read(authControllerProvider.notifier).logout(),
              icon: const Icon(Icons.logout),
              label: const Text('Log Out'),
              style: TextButton.styleFrom(foregroundColor: Colors.black87),
            ),
          ),
          const SizedBox(height: 24),
          const Center(
            child: Text('App Version 2.3', style: TextStyle(fontSize: 11, color: Colors.black45)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _ProfileOptionTile extends StatelessWidget {
  const _ProfileOptionTile({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        child: Row(
          children: [
            Icon(icon, size: 22),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
            const Icon(Icons.chevron_right, size: 18),
          ],
        ),
      ),
    );
  }
}
