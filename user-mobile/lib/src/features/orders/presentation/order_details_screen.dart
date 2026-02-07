import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../orders_provider.dart';

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({super.key, required this.invoice});

  final OrderInvoice invoice;

  String get _qrPayload => 'INV|${invoice.id}|${invoice.total.toStringAsFixed(0)}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order details'),
        backgroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFFFAD4E5),
                child: Text(
                  invoice.storeName.substring(0, 1).toUpperCase(),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(invoice.storeName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(invoice.id, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: invoice.status == 'Pending' ? const Color(0xFFFFF7ED) : const Color(0xFFEFFDF4),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  invoice.status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: invoice.status == 'Pending' ? const Color(0xFFEA580C) : const Color(0xFF15803D),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Items',
            child: Column(
              children: invoice.items
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.quantity}x ${item.name}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text('₹${(item.price * item.quantity).toStringAsFixed(0)}'),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Total',
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Payable amount', style: TextStyle(fontWeight: FontWeight.w700)),
                Text('₹${invoice.total.toStringAsFixed(0)}',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Order QR',
            child: Column(
              children: [
                const Text(
                  'Show this QR to the seller for verification.',
                  style: TextStyle(fontSize: 12, color: Colors.black54),
                ),
                const SizedBox(height: 12),
                QrImageView(
                  data: _qrPayload,
                  size: 180,
                ),
              ],
            ),
          ),
        ],
      ),
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
