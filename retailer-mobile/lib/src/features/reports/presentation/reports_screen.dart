import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/offline/offline_queue.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';
import '../../workspace/workspace_providers.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  bool _syncing = false;
  String? _feedback;

  @override
  Widget build(BuildContext context) {
    final summaryAsync = ref.watch(salesSummaryProvider);
    final ledgerAsync = ref.watch(ledgerProvider);
    final offlineQueue = ref.watch(offlineQueueControllerProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Daily snapshot', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        summaryAsync.when(
          data: (summary) => _buildSummaryCard(summary),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
        ),
        const SizedBox(height: 16),
        _buildOfflineCard(offlineQueue),
        const SizedBox(height: 16),
        ledgerAsync.when(
          data: (ledger) => _buildLedgerCard(ledger),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(SalesSummary? summary) {
    if (summary == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No sales captured today.'),
        ),
      );
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _summaryRow('Gross sales', summary.total),
            _summaryRow('Tax collected', summary.tax),
            const Divider(),
            ...summary.byPaymentMode.entries.map((entry) => _summaryRow(entry.key, entry.value)),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, double value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text('₹${value.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildOfflineCard(List<OfflineInvoiceEntry> queue) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Offline mode', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              queue.isEmpty ? 'All invoices synced.' : '${queue.length} bills waiting to sync.',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                ElevatedButton(
                  onPressed: queue.isEmpty || _syncing ? null : _syncOffline,
                  child: _syncing
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Sync now'),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: queue.isEmpty ? null : () => ref.read(offlineQueueControllerProvider.notifier).clear(),
                  child: const Text('Clear queue'),
                ),
              ],
            ),
            if (_feedback != null) ...[
              const SizedBox(height: 8),
              Text(_feedback!, style: const TextStyle(fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLedgerCard(List<LedgerEntry> ledger) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Outstanding ledger', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            if (ledger.isEmpty)
              const Text('All dues settled.', style: TextStyle(fontSize: 12))
            else
              ...ledger.map(
                (entry) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(entry.name),
                  subtitle: Text(entry.phone),
                  trailing: Text(
                    '₹${entry.balanceAmount.toStringAsFixed(2)}',
                    style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _syncOffline() async {
    final queueNotifier = ref.read(offlineQueueControllerProvider.notifier);
    final queue = ref.read(offlineQueueControllerProvider);
    if (queue.isEmpty) return;
    setState(() {
      _syncing = true;
      _feedback = null;
    });

    try {
      for (final entry in queue) {
        await ref.read(retailerApiProvider).createInvoice(entry.payload.toCreatePayload());
        queueNotifier.remove(entry.id);
      }
      setState(() {
        _feedback = 'Offline invoices synced successfully.';
        _syncing = false;
      });
    } on ApiException catch (error) {
      setState(() {
        _feedback = error.message;
        _syncing = false;
      });
    }
  }
}
