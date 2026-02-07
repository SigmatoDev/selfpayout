import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../workspace/workspace_providers.dart';

class PaymentsScreen extends ConsumerWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final retailerId = user?.retailerId;

    if (retailerId == null) {
      return const Center(child: Text('No retailer linked. Please sign in again.'));
    }

    final invoicesAsync = ref.watch(paymentsProvider(retailerId));

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(paymentsProvider(retailerId)),
      child: invoicesAsync.when(
        data: (invoices) {
          if (invoices.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: const [Text('No payments yet.')],
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: invoices.length,
            itemBuilder: (context, index) {
              final invoice = invoices[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('₹${invoice.totalAmount.toStringAsFixed(2)}',
                              style: const TextStyle(fontWeight: FontWeight.w700)),
                          Text(invoice.paymentMode.label),
                        ],
                      ),
                      Text(
                        invoice.createdAt.toLocal().toString(),
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      if (invoice.notes != null && invoice.notes!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(invoice.notes!, style: const TextStyle(fontSize: 12)),
                        ),
                      const SizedBox(height: 8),
                      ...invoice.items.take(3).map(
                        (item) => Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(child: Text(item.name)),
                            Text('${item.quantity} × ₹${item.price.toStringAsFixed(2)}'),
                          ],
                        ),
                      ),
                      if (invoice.items.length > 3)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            '+${invoice.items.length - 3} more',
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
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
