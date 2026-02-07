import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/language/language_controller.dart';
import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../restaurant/presentation/menu_screen.dart';
import '../../restaurant/presentation/tables_screen.dart';
import '../../ticketing/presentation/self_ticketing_screen.dart';

class RetailerProfileScreen extends ConsumerWidget {
  const RetailerProfileScreen({super.key, required this.user});

  final CurrentUser? user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeControllerProvider);
    final language = ref.watch(languageControllerProvider);

    final retailerName = user?.name ?? 'Retailer';
    final retailerId = user?.retailerId ?? 'RTL-0924-IND';
    final galleryImages = const [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=1200&q=80',
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Retailer Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ProfileHeader(
            name: retailerName,
            retailerId: retailerId,
            subtitle: 'Premium grocery and essentials',
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: 'Retailer information',
            children: [
              _InfoRow(label: 'Store name', value: retailerName),
              const _InfoRow(label: 'Store type', value: 'Kirana'),
              _InfoRow(label: 'Retailer ID', value: retailerId),
              const _InfoRow(label: 'Owner', value: 'Nuthan Raghunath'),
              const _InfoRow(label: 'Phone', value: '+91 90123 45678'),
              const _InfoRow(label: 'Email', value: 'hello@selfpayout.store'),
              const _InfoRow(label: 'Address', value: '28, MG Road, Bengaluru'),
              const _InfoRow(label: 'Operating hours', value: '7:00 AM - 11:00 PM'),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: 'Retailer description',
            children: const [
              Text(
                'We focus on fresh groceries, curated staples, and fast checkout. '
                'Our shelves are updated daily and we partner with 20+ local vendors.',
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: 'Store gallery',
            children: [
              SizedBox(
                height: 140,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: galleryImages.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) => ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      galleryImages[index],
                      width: 200,
                      height: 140,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text('Add more photos from the web dashboard.'),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: 'Team access',
            children: [
              const Text('Create a team so managers and cashiers can access the workspace.'),
              const SizedBox(height: 12),
              _TeamMemberTile(
                name: 'Aarav Singh',
                role: 'Store Manager',
                status: 'Active',
              ),
              const _TeamMemberTile(
                name: 'Meera Patel',
                role: 'Cashier',
                status: 'Invited',
              ),
              const _TeamMemberTile(
                name: 'Rohan Das',
                role: 'Inventory Lead',
                status: 'Active',
              ),
              const SizedBox(height: 12),
              const Text(
                'Owner permissions',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: const [
                  _PermissionChip(label: 'Add team members'),
                  _PermissionChip(label: 'Remove members'),
                  _PermissionChip(label: 'Edit roles'),
                  _PermissionChip(label: 'Manage inventory'),
                  _PermissionChip(label: 'Edit pricing'),
                  _PermissionChip(label: 'Export reports'),
                ],
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.group_add_outlined),
                label: const Text('Create team access'),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Team access setup is coming soon.')),
                  );
                },
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                icon: const Icon(Icons.person_remove_alt_1_outlined),
                label: const Text('Remove member'),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Select a member to remove.')),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InfoCard(
            title: 'Quick settings',
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.restaurant_menu),
                title: const Text('Menu configuration'),
                subtitle: const Text('Add or update menu categories and items'),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const MenuScreen()),
                  );
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.table_bar),
                title: const Text('Table configuration'),
                subtitle: const Text('Manage table labels and QR codes'),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const TablesScreen()),
                  );
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.confirmation_number_outlined),
                title: const Text('Ticket configuration'),
                subtitle: const Text('Manage ticketing events and tiers'),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SelfTicketingScreen()),
                  );
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode),
                title: Text(themeMode == ThemeMode.dark ? 'Switch to light mode' : 'Switch to dark mode'),
                onTap: () => ref.read(themeControllerProvider.notifier).toggle(),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.translate),
                title: Text('Language (${language.toggleLabel})'),
                onTap: () => ref.read(languageControllerProvider.notifier).toggle(),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.logout),
                title: const Text('Logout'),
                onTap: () => ref.read(authControllerProvider.notifier).logout(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PermissionChip extends StatelessWidget {
  const _PermissionChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.2)),
      ),
      child: Text(label, style: theme.textTheme.labelMedium),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.name,
    required this.retailerId,
    required this.subtitle,
  });

  final String name;
  final String retailerId;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.12),
            child: const Icon(Icons.storefront, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(subtitle, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                const SizedBox(height: 8),
                Text('Retailer ID: $retailerId', style: theme.textTheme.labelMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 4,
            child: Text(value, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

class _TeamMemberTile extends StatelessWidget {
  const _TeamMemberTile({
    required this.name,
    required this.role,
    required this.status,
  });

  final String name;
  final String role;
  final String status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.12),
        child: const Icon(Icons.person_outline),
      ),
      title: Text(name),
      subtitle: Text(role),
      onTap: () => _showMemberDialog(context),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(status, style: theme.textTheme.labelSmall),
      ),
    );
  }

  void _showMemberDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(name),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Role: $role'),
              const SizedBox(height: 12),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('Manage permissions'),
              ),
              const SizedBox(height: 8),
              const _DialogPermissionToggle(label: 'Billing access'),
              const _DialogPermissionToggle(label: 'Inventory edit'),
              const _DialogPermissionToggle(label: 'Reports view'),
              const _DialogPermissionToggle(label: 'Menu updates'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Saved permissions for $name.')),
                );
              },
              child: const Text('Save'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Removed $name from the team.')),
                );
              },
              child: const Text('Remove'),
            ),
          ],
        );
      },
    );
  }
}

class _DialogPermissionToggle extends StatefulWidget {
  const _DialogPermissionToggle({required this.label});

  final String label;

  @override
  State<_DialogPermissionToggle> createState() => _DialogPermissionToggleState();
}

class _DialogPermissionToggleState extends State<_DialogPermissionToggle> {
  bool _value = true;

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(widget.label),
      value: _value,
      onChanged: (value) => setState(() => _value = value ?? false),
    );
  }
}
