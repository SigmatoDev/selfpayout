import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../features/cart/cart_controller.dart';
import '../../../models/user_models.dart';

class InvoiceDetailsScreen extends StatefulWidget {
  const InvoiceDetailsScreen({
    super.key,
    required this.store,
    required this.items,
    required this.total,
  });

  final StoreSummary store;
  final List<CartItem> items;
  final double total;

  @override
  State<InvoiceDetailsScreen> createState() => _InvoiceDetailsScreenState();
}

class _InvoiceDetailsScreenState extends State<InvoiceDetailsScreen> {
  bool _confirmed = false;
  bool _verified = false;

  String get _qrPayload => 'INV|${widget.store.id}|${widget.total.toStringAsFixed(0)}';

  void _showUpiSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Pay with UPI', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _UpiOption(label: 'Google Pay', onTap: () => _handleUpiPay(sheetContext)),
              _UpiOption(label: 'PhonePe', onTap: () => _handleUpiPay(sheetContext)),
              _UpiOption(label: 'Paytm', onTap: () => _handleUpiPay(sheetContext)),
            ],
          ),
        );
      },
    );
  }

  void _handleUpiPay(BuildContext sheetContext) {
    Navigator.of(sheetContext).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening UPI app...')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice details'),
        backgroundColor: Colors.white,
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Color(0x14000000),
                blurRadius: 12,
                offset: Offset(0, -4),
              )
            ],
          ),
          child: _buildFooterButton(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFFFAD4E5),
                child: Text(
                  widget.store.shopName.substring(0, 1).toUpperCase(),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.store.shopName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    const Text('Invoice created', style: TextStyle(fontSize: 12, color: Colors.black54)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Items',
            child: Column(
              children: widget.items
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.quantity}x ${item.product.name}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text('₹${(item.product.price * item.quantity).toStringAsFixed(0)}'),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Payable amount',
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontWeight: FontWeight.w700)),
                Text('₹${widget.total.toStringAsFixed(0)}',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_confirmed)
            _SectionCard(
              title: 'Seller verification',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Ask the seller to scan this QR to verify your invoice.',
                    style: TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  Center(
                    child: QrImageView(
                      data: _qrPayload,
                      size: 180,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (!_verified)
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => setState(() => _verified = true),
                        child: const Text('Mark as verified'),
                      ),
                    ),
                ],
              ),
            ),
          if (!_confirmed)
            const Text(
              'Confirm the invoice to generate the QR code for seller verification.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          const SizedBox(height: 12),
          const Text(
            'Show the QR at the cash counter to associate and make payment.',
            style: TextStyle(fontSize: 12, color: Colors.black54),
          ),
          const SizedBox(height: 6),
          const Text(
            'Pay through cash • pay in counter • pay online',
            style: TextStyle(fontSize: 12, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterButton() {
    if (!_confirmed) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () => setState(() => _confirmed = true),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Text('Confirm invoice'),
        ),
      );
    }
    if (!_verified) {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          onPressed: null,
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Text('Waiting for seller verification'),
        ),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _showUpiSheet,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: const Text('Pay now'),
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

class _UpiOption extends StatelessWidget {
  const _UpiOption({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.account_balance_wallet_outlined),
      title: Text(label),
      onTap: onTap,
    );
  }
}
