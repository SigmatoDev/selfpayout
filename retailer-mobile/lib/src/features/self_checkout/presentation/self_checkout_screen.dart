import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';
import '../../workspace/workspace_providers.dart';

class SelfCheckoutScreen extends ConsumerStatefulWidget {
  const SelfCheckoutScreen({super.key});

  @override
  ConsumerState<SelfCheckoutScreen> createState() => _SelfCheckoutScreenState();
}

class _SelfCheckoutScreenState extends ConsumerState<SelfCheckoutScreen> {
  SessionStatus _status = SessionStatus.submitted;
  String? _actionSessionId;
  String? _feedback;

  @override
  Widget build(BuildContext context) {
    final sessionsAsync = ref.watch(selfCheckoutSessionsProvider(_status));

    return Column(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: SessionStatus.values
                .map(
                  (status) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(status.label),
                      selected: _status == status,
                      onSelected: (_) => setState(() => _status = status),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        Expanded(
          child: sessionsAsync.when(
            data: (sessions) {
              if (sessions.isEmpty) {
                return const Center(child: Text('No sessions in this state.'));
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: sessions.length,
                itemBuilder: (context, index) {
                  final session = sessions[index];
                  return _SessionCard(
                    session: session,
                    isProcessing: _actionSessionId == session.id,
                    onMarkPaid: session.status == SessionStatus.submitted
                        ? () => _markPaid(session.id)
                        : null,
                    onVerify: session.status == SessionStatus.paid
                        ? () => _verify(session.id)
                        : null,
                    feedback: _feedback,
                    showFeedback: _actionSessionId == session.id && _feedback != null,
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _markPaid(String sessionId) async {
    setState(() {
      _actionSessionId = sessionId;
      _feedback = null;
    });
    try {
      await ref.read(retailerApiProvider).markSessionPaid(sessionId);
      ref.invalidate(selfCheckoutSessionsProvider(_status));
    } on ApiException catch (error) {
      setState(() => _feedback = error.message);
    } finally {
      setState(() => _actionSessionId = null);
    }
  }

  Future<void> _verify(String sessionId) async {
    setState(() {
      _actionSessionId = sessionId;
      _feedback = null;
    });
    try {
      await ref.read(retailerApiProvider).verifySession(sessionId);
      ref.invalidate(selfCheckoutSessionsProvider(_status));
    } on ApiException catch (error) {
      setState(() => _feedback = error.message);
    } finally {
      setState(() => _actionSessionId = null);
    }
  }
}

class _SessionCard extends StatelessWidget {
  const _SessionCard({
    required this.session,
    this.onMarkPaid,
    this.onVerify,
    required this.isProcessing,
    this.feedback,
    this.showFeedback = false,
  });

  final CheckoutSession session;
  final VoidCallback? onMarkPaid;
  final VoidCallback? onVerify;
  final bool isProcessing;
  final String? feedback;
  final bool showFeedback;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Session #${session.id.substring(0, 8)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                Chip(label: Text(session.status.label)),
              ],
            ),
            const SizedBox(height: 8),
            Text('Store type: ${session.storeType}'),
            if (session.context != null)
              Wrap(
                spacing: 8,
                children: session.context!.entries
                    .map((entry) => Chip(label: Text('${entry.key}: ${entry.value}')))
                    .toList(),
              ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Security code: ${session.securityCode}'),
                  Text('Total items: ${session.items.length}'),
                  ...session.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text(item.name)),
                          Text('₹${(item.price * item.quantity).toStringAsFixed(2)}'),
                        ],
                      ),
                    ),
                  ),
                  if (session.status != SessionStatus.submitted)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Center(
                        child: QrImageView(
                          data: 'SELFCHK|${session.id}|${session.securityCode}',
                          size: 120,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text('Total: ₹${session.totalAmount.toStringAsFixed(2)}'),
            if (session.invoice != null)
              Text('Invoice ${session.invoice!.id.substring(0, 8)} via ${session.invoice!.paymentMode.apiValue}'),
            const SizedBox(height: 12),
            Row(
              children: [
                if (onMarkPaid != null)
                  ElevatedButton(
                    onPressed: isProcessing ? null : onMarkPaid,
                    child: isProcessing
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Mark payment'),
                  ),
                if (onVerify != null)
                  OutlinedButton(
                    onPressed: isProcessing ? null : onVerify,
                    child: const Text('Guard confirm'),
                  ),
              ],
            ),
            if (showFeedback && feedback != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(feedback!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
              ),
          ],
        ),
      ),
    );
  }
}
