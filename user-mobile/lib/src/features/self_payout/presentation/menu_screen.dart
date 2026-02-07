import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../models/user_models.dart';

class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key, required this.retailerId});

  final String retailerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menuAsync = ref.watch(
      FutureProvider.autoDispose<MenuResponse>(
        (ref) => ref.watch(userApiProvider).fetchMenu(retailerId),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Menu')),
      body: menuAsync.when(
        data: (menu) => ListView(
          padding: const EdgeInsets.all(16),
          children: menu.categories
              .map(
                (category) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(category.name, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ...category.items.map(
                      (item) => ListTile(
                        contentPadding: const EdgeInsets.symmetric(vertical: 4),
                        title: Text(item.name),
                        subtitle: Text('₹${item.price.toStringAsFixed(0)}'),
                        trailing: item.isAvailable
                            ? const Icon(Icons.check_circle_outline, color: Colors.green)
                            : const Icon(Icons.remove_circle_outline, color: Colors.grey),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              )
              .toList(),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString(), style: const TextStyle(color: Colors.redAccent))),
      ),
    );
  }
}
