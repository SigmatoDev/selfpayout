import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../cart_controller.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartControllerProvider);
    final marketplaceItems = cart.where((item) => item.source == CartSource.marketplace).toList();
    final selfBillingItems = cart.where((item) => item.source == CartSource.selfBilling).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Your cart')),
      body: cart.isEmpty
          ? const Center(child: Text('Cart is empty.'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _CartSection(title: 'Marketplace', items: marketplaceItems),
                const SizedBox(height: 16),
                _CartSection(title: 'Self billing', items: selfBillingItems),
                const SizedBox(height: 16),
                const _TicketSection(),
              ],
            ),
    );
  }
}

class _CartSection extends StatelessWidget {
  const _CartSection({required this.title, required this.items});

  final String title;
  final List<CartItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return _SectionCard(
        title: title,
        child: const Text('No items added yet.', style: TextStyle(color: Colors.black54)),
      );
    }
    return _SectionCard(
      title: title,
      child: Column(
        children: items
            .map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  tileColor: Colors.white,
                  title: Text(item.product.name),
                  subtitle: Text('Store: ${item.product.retailer.shopName}'),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('₹${item.product.price.toStringAsFixed(0)}'),
                      Text('x${item.quantity}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _TicketSection extends StatelessWidget {
  const _TicketSection();

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Tickets',
      child: const Text('No tickets in cart yet.', style: TextStyle(color: Colors.black54)),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}
