import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../auth/controller/auth_controller.dart';

class MarketplaceOrder {
  const MarketplaceOrder({
    required this.orderId,
    required this.customerName,
    required this.customerPhone,
    required this.submittedAt,
    required this.status,
    required this.items,
    required this.total,
    required this.deliveryAddress,
  });

  final String orderId;
  final String customerName;
  final String customerPhone;
  final String submittedAt;
  final String status;
  final List<MarketplaceOrderItem> items;
  final double total;
  final String deliveryAddress;

  factory MarketplaceOrder.fromJson(Map<String, dynamic> json) => MarketplaceOrder(
        orderId: json['id'] as String? ?? '',
        customerName: json['buyerName'] as String? ?? '',
        customerPhone: json['buyerPhone'] as String? ?? '',
        submittedAt: json['createdAt'] as String? ?? '',
        status: json['status'] as String? ?? '',
        items: (json['items'] as List<dynamic>? ?? [])
            .map((item) => MarketplaceOrderItem.fromJson(item as Map<String, dynamic>))
            .toList(),
        total: (json['totalAmount'] as num?)?.toDouble() ?? 0,
        deliveryAddress: json['deliveryAddress'] as String? ?? '',
      );
}

class MarketplaceOrderItem {
  const MarketplaceOrderItem({required this.name, required this.price, required this.quantity});

  final String name;
  final double price;
  final int quantity;

  factory MarketplaceOrderItem.fromJson(Map<String, dynamic> json) => MarketplaceOrderItem(
        name: json['name'] as String? ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      );
}

class MarketplaceOrderDetailScreen extends ConsumerStatefulWidget {
  const MarketplaceOrderDetailScreen({super.key, required this.order});

  final MarketplaceOrder order;

  @override
  ConsumerState<MarketplaceOrderDetailScreen> createState() => _MarketplaceOrderDetailScreenState();
}

class _MarketplaceOrderDetailScreenState extends ConsumerState<MarketplaceOrderDetailScreen> {
  late String _status;

  @override
  void initState() {
    super.initState();
    _status = widget.order.status;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final order = widget.order;
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
                  Text('Name: ${order.customerName}'),
                  Text('Placed: ${order.submittedAt}'),
                  Text('Status: $_status'),
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
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Delivery', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(order.deliveryAddress),
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
                  Text('Order processing', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  _OrderStep(label: 'Order received', done: true),
                  _OrderStep(label: 'Packing', done: _status != 'SUBMITTED'),
                  _OrderStep(label: 'Shipped', done: _status == 'SHIPPED' || _status == 'DELIVERED'),
                  _OrderStep(label: 'Delivered', done: _status == 'DELIVERED'),
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
                  Text('Update status', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _status,
                    items: const [
                      DropdownMenuItem(value: 'SUBMITTED', child: Text('Submitted')),
                      DropdownMenuItem(value: 'ACCEPTED', child: Text('Accepted')),
                      DropdownMenuItem(value: 'PACKING', child: Text('Packing')),
                      DropdownMenuItem(value: 'SHIPPED', child: Text('Shipped')),
                      DropdownMenuItem(value: 'DELIVERED', child: Text('Delivered')),
                      DropdownMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
                    ],
                    onChanged: (value) => setState(() => _status = value ?? _status),
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () async {
                      final user = ref.read(authControllerProvider).valueOrNull;
                      if (user?.retailerId == null) return;
                      final updated = await ref
                          .read(retailerApiProvider)
                          .updateMarketplaceOrderStatus(user!.retailerId!, order.orderId, _status);
                      if (mounted) {
                        setState(() => _status = updated.status);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Order status updated to ${updated.status}.')),
                        );
                      }
                    },
                    child: const Text('Save status'),
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

class _OrderStep extends StatelessWidget {
  const _OrderStep({required this.label, required this.done});

  final String label;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(done ? Icons.check_circle : Icons.radio_button_unchecked,
              color: done ? Colors.green : Colors.grey, size: 18),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }
}
