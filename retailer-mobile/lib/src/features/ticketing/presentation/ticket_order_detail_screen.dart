import 'package:flutter/material.dart';

class TicketOrder {
  const TicketOrder({
    required this.orderId,
    required this.eventName,
    required this.buyerName,
    required this.buyerPhone,
    required this.tickets,
    required this.total,
    required this.status,
    required this.bookedAt,
  });

  final String orderId;
  final String eventName;
  final String buyerName;
  final String buyerPhone;
  final int tickets;
  final double total;
  final String status;
  final String bookedAt;

  factory TicketOrder.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>? ?? []);
    final ticketsCount = json['ticketsCount'] as num?;
    final computedCount = items.fold<int>(
      0,
      (sum, item) => sum + ((item as Map<String, dynamic>)['quantity'] as num? ?? 0).toInt(),
    );
    return TicketOrder(
      orderId: json['id'] as String? ?? '',
      eventName: (json['event'] as Map<String, dynamic>?)?['title'] as String? ?? '',
      buyerName: json['buyerName'] as String? ?? '',
      buyerPhone: json['buyerPhone'] as String? ?? '',
      tickets: (ticketsCount ?? computedCount).toInt(),
      total: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? '',
      bookedAt: json['bookedAt'] as String? ?? '',
    );
  }
}

class TicketOrderDetailScreen extends StatelessWidget {
  const TicketOrderDetailScreen({super.key, required this.order});

  final TicketOrder order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Order ${order.orderId}'),
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
                  Text(order.eventName, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text('Order ID: ${order.orderId}'),
                  Text('Booked: ${order.bookedAt}'),
                  const SizedBox(height: 8),
                  _StatusChip(status: order.status),
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
                  Text('Buyer', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(order.buyerPhone, style: theme.textTheme.titleMedium),
                  Text(order.buyerName, style: theme.textTheme.bodySmall),
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
                  Text('Tickets', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${order.tickets} tickets'),
                      Text('₹${order.total.toStringAsFixed(0)}',
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
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
