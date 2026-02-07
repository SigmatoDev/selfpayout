import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/models.dart';
import '../../workspace/workspace_providers.dart';
import 'self_checkout_session_detail_screen.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  int _filterIndex = 0;

  @override
  Widget build(BuildContext context) {
    final filters = ['All', 'New', 'Paid', 'Approved'];
    final sessionsAsync = ref.watch(selfCheckoutSessionsProvider(SessionStatus.submitted));
    final paidSessionsAsync = ref.watch(selfCheckoutSessionsProvider(SessionStatus.paid));
    final approvedSessionsAsync = ref.watch(selfCheckoutSessionsProvider(SessionStatus.approved));

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Text('Orders', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(
              filters.length,
              (index) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(filters[index]),
                  selected: _filterIndex == index,
                  onSelected: (_) => setState(() => _filterIndex = index),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        _buildSessionsList(context, _filterIndex, sessionsAsync, paidSessionsAsync, approvedSessionsAsync),
      ],
    );
  }

  Widget _buildSessionsList(
    BuildContext context,
    int filterIndex,
    AsyncValue<List<CheckoutSession>> submittedAsync,
    AsyncValue<List<CheckoutSession>> paidAsync,
    AsyncValue<List<CheckoutSession>> approvedAsync,
  ) {
    AsyncValue<List<CheckoutSession>> active;
    switch (filterIndex) {
      case 1:
        active = submittedAsync;
        break;
      case 2:
        active = paidAsync;
        break;
      case 3:
        active = approvedAsync;
        break;
      default:
        active = AsyncValue.data([
          ...submittedAsync.valueOrNull ?? [],
          ...paidAsync.valueOrNull ?? [],
          ...approvedAsync.valueOrNull ?? [],
        ]);
        break;
    }

    return active.when(
      data: (sessions) {
        if (sessions.isEmpty) {
          return const Text(
            'No orders received here yet.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          );
        }
        return Column(
          children: sessions
              .map(
                (session) => Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                      child: const Icon(Icons.receipt_long),
                    ),
                    title: Text(session.customerPhone ?? 'Walk-in'),
                    subtitle: Text('${session.id.substring(0, 8)} • ${session.tableNumber ?? 'Counter'}'),
                    trailing: _OrdersStatusChip(status: session.status.apiValue),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => SelfCheckoutSessionDetailScreen(session: session),
                        ),
                      );
                    },
                  ),
                ),
              )
              .toList(),
        );
      },
      loading: () => const Center(child: Padding(
        padding: EdgeInsets.all(12),
        child: CircularProgressIndicator(),
      )),
      error: (error, _) => Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
    );
  }
}

class _OrdersStatusChip extends StatelessWidget {
  const _OrdersStatusChip({required this.status});

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
