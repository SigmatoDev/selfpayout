import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/controller/auth_controller.dart';
import '../../workspace/workspace_providers.dart';

class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final retailerId = user?.retailerId;

    if (retailerId == null) {
      return const Center(child: Text('No retailer linked. Please sign in again.'));
    }

    final menuAsync = ref.watch(restaurantMenuProvider(retailerId));

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(restaurantMenuProvider(retailerId));
      },
      child: menuAsync.when(
        data: (menu) {
          if (menu.categories.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: const [
                Text('No menu published yet. Add categories via the web app.'),
              ],
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: menu.categories.length,
            itemBuilder: (context, index) {
              final category = menu.categories[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(category.name, style: Theme.of(context).textTheme.titleMedium),
                      if (category.description?.isNotEmpty == true)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            category.description ?? '',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      const SizedBox(height: 8),
                      ...category.items.map(
                        (item) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                  Text('₹${item.price.toStringAsFixed(2)}'),
                                ],
                              ),
                              Text('SKU ${item.sku}', style: const TextStyle(fontSize: 12)),
                              if (item.addOnGroups.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: item.addOnGroups.map((group) {
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 4),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('${group.name} (${group.min}-${group.max})',
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                            Wrap(
                                              spacing: 6,
                                              children: group.options
                                                  .map(
                                                    (option) => Chip(
                                                      label: Text(
                                                        '${option.label}${option.price > 0 ? ' +₹${option.price}' : ''}',
                                                      ),
                                                      visualDensity: VisualDensity.compact,
                                                    ),
                                                  )
                                                  .toList(),
                                            ),
                                          ],
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
          ],
        ),
      ),
    );
  }
}
