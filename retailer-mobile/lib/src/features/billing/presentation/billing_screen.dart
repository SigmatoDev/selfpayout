import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/di/providers.dart';
import '../../../core/language/language_controller.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../workspace/workspace_providers.dart';

class BillingScreen extends ConsumerStatefulWidget {
  const BillingScreen({super.key});

  @override
  ConsumerState<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends ConsumerState<BillingScreen> {
  final _searchController = TextEditingController();
  final _customerPhoneController = TextEditingController();

  final List<_CartItem> _cart = [];
  PaymentMode _paymentMode = PaymentMode.cash;
  bool _isSubmitting = false;
  InvoiceResult? _lastInvoice;
  String? _statusMessage;

  @override
  void dispose() {
    _searchController.dispose();
    _customerPhoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inventoryAsync = ref.watch(inventoryProvider);
    final strings = ref.watch(languageStringsProvider);
    final offlineQueue = ref.watch(offlineQueueControllerProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(inventoryProvider),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          _buildSearchBar(inventoryAsync, strings),
          const SizedBox(height: 16),
          _buildCartSection(strings),
          const SizedBox(height: 16),
          _buildPaymentSection(),
          const SizedBox(height: 16),
          _buildTotalsSection(strings, offlineQueue.length),
        ],
      ),
    );
  }

  Widget _buildSearchBar(AsyncValue<List<InventoryItem>> inventoryAsync, LanguageStrings strings) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Scan barcode or search item',
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => setState(() {
                          _searchController.clear();
                        }),
                      ),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            inventoryAsync.when(
              data: (inventory) {
                final filtered = _filteredInventory(inventory);
                if (filtered.isEmpty) {
                  return const Text(
                    'No matches. Try another term.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  );
                }
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: filtered
                      .map(
                        (item) => OutlinedButton(
                          onPressed: () => _addToCart(item),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text('₹${item.price.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const Center(child: Padding(
                padding: EdgeInsets.all(8.0),
                child: CircularProgressIndicator(),
              )),
              error: (error, _) => Text(
                error.toString(),
                style: const TextStyle(color: Colors.redAccent),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartSection(LanguageStrings strings) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Cart (${_cart.length} items)', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            if (_cart.isEmpty)
              const Text(
                'Add items from the quick pick grid to build a cart.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ..._cart.map(_buildCartRow),
          ],
        ),
      ),
    );
  }

  Widget _buildCartRow(_CartItem item) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(
                  '${item.quantity} × ₹${item.price.toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 80,
            child: TextFormField(
              key: ValueKey('${item.sku}-${item.price}'),
              initialValue: item.price.toStringAsFixed(2),
              decoration: const InputDecoration(labelText: 'Price'),
              keyboardType: TextInputType.number,
              onChanged: (value) => _updatePrice(item.sku, double.tryParse(value) ?? item.price),
            ),
          ),
          const SizedBox(width: 12),
          Row(
            children: [
              IconButton(
                onPressed: () => _updateQuantity(item.sku, -1),
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w600)),
              IconButton(
                onPressed: () => _updateQuantity(item.sku, 1),
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _customerPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Customer phone (optional)'),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<PaymentMode>(
              value: _paymentMode,
              items: PaymentMode.values
                  .map((mode) => DropdownMenuItem(value: mode, child: Text(mode.label)))
                  .toList(),
              onChanged: (mode) {
                if (mode != null) {
                  setState(() => _paymentMode = mode);
                }
              },
              decoration: const InputDecoration(labelText: 'Payment mode'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTotalsSection(LanguageStrings strings, int offlineCount) {
    final totals = _calculateTotals();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTotalRow('Subtotal', totals.subtotal),
            _buildTotalRow('Tax', totals.tax),
            const Divider(height: 24),
            _buildTotalRow('Total', totals.total, isEmphasis: true),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _cart.isEmpty || _isSubmitting ? null : _handleCollectPayment,
              child: _isSubmitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(strings.label(TranslationKey.collectPayment)),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                _statusMessage!,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
            if (_lastInvoice != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: () => Share.share(
                      'Receipt ${_lastInvoice!.id} • Total ₹${_lastInvoice!.totalAmount.toStringAsFixed(2)}',
                    ),
                    icon: const Icon(Icons.share_rounded),
                    label: const Text('Share'),
                  ),
                ],
              ),
            ],
            if (offlineCount > 0) ...[
              const SizedBox(height: 12),
              Text(
                '$offlineCount offline ${strings.label(TranslationKey.offlinePending)}',
                style: const TextStyle(fontSize: 12, color: Colors.amber),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTotalRow(String label, double value, {bool isEmphasis = false}) {
    final textStyle = isEmphasis
        ? Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)
        : Theme.of(context).textTheme.bodyLarge;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text('₹${value.toStringAsFixed(2)}', style: textStyle),
        ],
      ),
    );
  }

  List<InventoryItem> _filteredInventory(List<InventoryItem> all) {
    final term = _searchController.text.trim().toLowerCase();
    if (term.isEmpty) {
      return all.take(8).toList();
    }
    return all
        .where((item) => item.name.toLowerCase().contains(term) || item.sku.toLowerCase().contains(term))
        .take(8)
        .toList();
  }

  void _addToCart(InventoryItem item) {
    setState(() {
      final existing = _cart.indexWhere((cartItem) => cartItem.sku == item.sku);
      if (existing >= 0) {
        _cart[existing] = _cart[existing].copyWith(quantity: _cart[existing].quantity + 1);
      } else {
        _cart.add(
          _CartItem(
            sku: item.sku,
            name: item.name,
            price: item.price,
            quantity: 1,
            taxPercentage: item.taxPercentage,
          ),
        );
      }
    });
  }

  void _updateQuantity(String sku, int delta) {
    setState(() {
      final index = _cart.indexWhere((item) => item.sku == sku);
      if (index >= 0) {
        final nextQuantity = (_cart[index].quantity + delta).clamp(0, 999);
        if (nextQuantity == 0) {
          _cart.removeAt(index);
        } else {
          _cart[index] = _cart[index].copyWith(quantity: nextQuantity);
        }
      }
    });
  }

  void _updatePrice(String sku, double price) {
    setState(() {
      final index = _cart.indexWhere((item) => item.sku == sku);
      if (index >= 0) {
        _cart[index] = _cart[index].copyWith(price: price);
      }
    });
  }

  _Totals _calculateTotals() {
    final subtotal = _cart.fold<double>(
      0,
      (previousValue, item) => previousValue + (item.price * item.quantity),
    );
    final tax = _cart.fold<double>(
      0,
      (previousValue, item) =>
          previousValue + ((item.price * item.quantity) * (item.taxPercentage / 100)),
    );
    return _Totals(subtotal: subtotal, tax: tax, total: subtotal + tax);
  }

  Future<void> _handleCollectPayment() async {
    if (_cart.isEmpty) return;
    setState(() {
      _isSubmitting = true;
      _statusMessage = null;
    });

    final payload = CreateInvoicePayload(
      paymentMode: _paymentMode,
      customerPhone: _customerPhoneController.text.trim().isEmpty ? null : _customerPhoneController.text.trim(),
      items: _cart
          .map(
            (item) => InvoiceItemPayload(
              sku: item.sku,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              taxPercentage: item.taxPercentage,
            ),
          )
          .toList(),
    );

    try {
      final result = await ref.read(retailerApiProvider).createInvoice(payload);
      setState(() {
        _cart.clear();
        _lastInvoice = result;
        _statusMessage = 'Payment captured successfully.';
      });
    } on ApiException catch (error) {
      final user = ref.read(authControllerProvider).valueOrNull;
      if (user?.retailerId != null) {
        ref.read(offlineQueueControllerProvider.notifier).enqueue(
              OfflineInvoicePayload(
                retailerId: user!.retailerId!,
                paymentMode: _paymentMode,
                customerPhone:
                    _customerPhoneController.text.trim().isEmpty ? null : _customerPhoneController.text.trim(),
                items: payload.items,
              ),
            );
        setState(() {
          _cart.clear();
          _statusMessage = 'Offline: invoice stored and will sync automatically.';
        });
      } else {
        setState(() {
          _statusMessage = error.message;
        });
      }
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }
}

class _Totals {
  const _Totals({required this.subtotal, required this.tax, required this.total});
  final double subtotal;
  final double tax;
  final double total;
}

class _CartItem {
  const _CartItem({
    required this.sku,
    required this.name,
    required this.price,
    required this.quantity,
    required this.taxPercentage,
  });

  final String sku;
  final String name;
  final double price;
  final int quantity;
  final double taxPercentage;

  _CartItem copyWith({double? price, int? quantity}) => _CartItem(
        sku: sku,
        name: name,
        price: price ?? this.price,
        quantity: quantity ?? this.quantity,
        taxPercentage: taxPercentage,
      );
}
