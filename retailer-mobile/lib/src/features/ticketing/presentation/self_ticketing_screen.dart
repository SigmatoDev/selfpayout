import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/controller/auth_controller.dart';
import '../../workspace/workspace_providers.dart';
import 'ticket_detail_screen.dart';
import 'ticket_models.dart';

class SelfTicketingScreen extends ConsumerStatefulWidget {
  const SelfTicketingScreen({super.key});

  @override
  ConsumerState<SelfTicketingScreen> createState() => _SelfTicketingScreenState();
}

class _SelfTicketingScreenState extends ConsumerState<SelfTicketingScreen> {
  String _search = '';
  static const List<String> _filters = ['Today', 'Weekend', 'Under 300'];

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final user = ref.watch(authControllerProvider).valueOrNull;
    final retailerId = user?.retailerId;

    if (retailerId == null) {
      return const Center(child: Text('No retailer linked. Please sign in again.'));
    }

    final eventsAsync = ref.watch(ticketEventsProvider(retailerId));
    final filteredEvents = eventsAsync.whenData((events) {
      if (_search.trim().isEmpty) return events;
      final term = _search.toLowerCase();
      return events
          .where(
            (ticket) =>
                ticket.title.toLowerCase().contains(term) ||
                ticket.venue.toLowerCase().contains(term) ||
                ticket.location.toLowerCase().contains(term),
          )
          .toList();
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Self Ticketing'),
        backgroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          filteredEvents.when(
            data: (events) => ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 96, 16, 16),
              itemCount: events.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final ticket = events[index];
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colorScheme.outline),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          ticket.imageUrl,
                          height: 140,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              ticket.title,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: colorScheme.secondary.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '₹${ticket.price.toStringAsFixed(0)}',
                              style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.venue,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.date,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor: colorScheme.surfaceVariant,
                            child: const Icon(Icons.confirmation_number_outlined, size: 16),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${ticket.owner} • Verified event',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                          Text(
                            'Self ticketing',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => TicketDetailScreen(ticket: ticket)),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: colorScheme.primary),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('View details'),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(child: Text(error.toString())),
          ),
          Positioned(
            left: 16,
            right: 16,
            top: 12,
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search events or venues',
                    prefixIcon: Icon(Icons.search),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (value) => setState(() => _search = value),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      )
                    ],
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _filters
                          .map(
                            (filter) => Container(
                              margin: const EdgeInsets.only(right: 10),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: colorScheme.primary.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                filter,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: colorScheme.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
