import 'package:flutter/material.dart';

class SelfBillingOrder {
  const SelfBillingOrder({
    required this.orderId,
    required this.customerPhone,
    required this.submittedAt,
    required this.items,
    required this.total,
    required this.status,
  });

  final String orderId;
  final String customerPhone;
  final String submittedAt;
  final List<SelfBillingItem> items;
  final double total;
  final String status;
}

class SelfBillingItem {
  const SelfBillingItem({required this.name, required this.price, required this.quantity});

  final String name;
  final double price;
  final int quantity;
}

class SelfBillingOrderDetailScreen extends StatelessWidget {
  const SelfBillingOrderDetailScreen({super.key, required this.order});

  final SelfBillingOrder order;

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
                  Text(order.customerPhone, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text('Submitted: ${order.submittedAt}'),
                  Text('Status: ${order.status}'),
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
                  ...order.items.map(
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
                      Text('₹${order.total.toStringAsFixed(0)}',
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Order confirmed.')),
                );
              },
              child: const Text('Confirm order'),
            ),
          ),
        ],
      ),
    );
  }
}
