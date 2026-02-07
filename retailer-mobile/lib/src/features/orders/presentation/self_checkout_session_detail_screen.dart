import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../models/models.dart';
import '../../workspace/workspace_providers.dart';

class SelfCheckoutSessionDetailScreen extends ConsumerWidget {
  const SelfCheckoutSessionDetailScreen({super.key, required this.session});

  final CheckoutSession session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Order ${session.id.substring(0, 8)}'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(session.customerPhone ?? 'Walk-in',
                      style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text('Table: ${session.tableNumber ?? 'Counter'}'),
                  Text('Status: ${session.status.apiValue}'),
                  const SizedBox(height: 8),
                  _StatusChip(status: session.status.apiValue),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Items', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  ...session.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Expanded(child: Text(item.name)),
                          Text('x${item.quantity}'),
                          const SizedBox(width: 12),
                          Text('₹${(item.price * item.quantity).toStringAsFixed(0)}'),
                        ],
                      ),
                    ),
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total'),
                      Text('₹${session.totalAmount.toStringAsFixed(0)}',
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: session.status == SessionStatus.approved
                      ? null
                      : () async {
                          await ref.read(retailerApiProvider).verifySession(session.id);
                          ref.invalidate(selfCheckoutSessionsProvider(SessionStatus.submitted));
                          ref.invalidate(selfCheckoutSessionsProvider(SessionStatus.approved));
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Order approved.')),
                            );
                          }
                        },
                  child: const Text('Approve'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: session.status == SessionStatus.paid
                      ? null
                      : () async {
                          await ref.read(retailerApiProvider).markSessionPaid(session.id);
                          ref.invalidate(selfCheckoutSessionsProvider(SessionStatus.submitted));
                          ref.invalidate(selfCheckoutSessionsProvider(SessionStatus.paid));
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Payment marked as paid.')),
                            );
                          }
                        },
                  child: const Text('Mark paid'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(status, style: theme.textTheme.labelSmall),
    );
  }
}
