import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cart/presentation/cart_screen.dart';
import '../../../features/cart/cart_controller.dart';
import '../../auth/controller/auth_controller.dart';
import '../../../core/di/providers.dart';
import '../../../models/user_models.dart';
import '../marketplace_providers.dart';
import '../../self_payout/presentation/menu_screen.dart';
import 'invoice_details_screen.dart';
import '../../orders/orders_provider.dart';

class StoreBillingScreen extends ConsumerStatefulWidget {
  const StoreBillingScreen({super.key, required this.store});

  final StoreSummary store;

  @override
  ConsumerState<StoreBillingScreen> createState() => _StoreBillingScreenState();
}

class _StoreBillingScreenState extends ConsumerState<StoreBillingScreen> {
  String _search = '';
  bool _locationSheetShown = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _locationSheetShown) return;
      _locationSheetShown = true;
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
                const Text('Confirm store location', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(
                  'You are ordering from ${widget.store.shopName}. Please confirm your location for accurate availability.',
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 18, color: Colors.black54),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text('Current location: MG Road, Bengaluru', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(sheetContext).pop(),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Confirm location'),
                  ),
                ),
              ],
            ),
          );
        },
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(marketplaceProductsProvider);
    final cartItems = ref.watch(cartControllerProvider);
    final storeCartItems = cartItems
        .where((item) => item.product.retailer.id == widget.store.id && item.source == CartSource.selfBilling)
        .toList();
    final storeCartQuantity = storeCartItems.fold<int>(0, (sum, item) => sum + item.quantity);
    final total = storeCartItems.fold<double>(
      0,
      (sum, item) => sum + (item.product.price * item.quantity),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.store.shopName),
        actions: [
          IconButton(
            tooltip: 'Scan barcode',
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Barcode scan coming soon')),
              );
            },
          ),
          IconButton(
            tooltip: 'Cart',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CartScreen()),
              );
            },
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.shopping_bag_outlined),
                if (storeCartQuantity > 0)
                  Positioned(
                    right: -6,
                    top: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.redAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        storeCartQuantity.toString(),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (widget.store.storeType == 'RESTAURANT')
            IconButton(
              tooltip: 'Menu',
              icon: const Icon(Icons.restaurant_menu),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => MenuScreen(retailerId: widget.store.id)),
                );
              },
            ),
        ],
      ),
      bottomNavigationBar: storeCartItems.isEmpty
          ? null
          : SafeArea(
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
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total', style: TextStyle(fontSize: 12, color: Colors.black54)),
                          Text(
                            '₹${total.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        final invoiceId = 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
                        ref.read(ordersProvider.notifier).addInvoice(
                              OrderInvoice(
                                id: invoiceId,
                                storeName: widget.store.shopName,
                                total: total,
                                status: 'Pending',
                                items: storeCartItems
                                    .map(
                                      (item) => OrderItem(
                                        name: item.product.name,
                                        quantity: item.quantity,
                                        price: item.product.price,
                                      ),
                                    )
                                    .toList(),
                              ),
                            );
                        final profile = ref.read(authControllerProvider).valueOrNull;
                        if (profile != null) {
                          await ref.read(userApiProvider).createMarketplaceOrder(
                                retailerId: widget.store.id,
                                buyerPhone: profile.phone,
                                buyerName: profile.name,
                                deliveryAddress: profile.address,
                                items: storeCartItems
                                    .map(
                                      (item) => {
                                            'inventoryItemId': item.product.id,
                                            'quantity': item.quantity,
                                          },
                                    )
                                    .toList(),
                              );
                        }
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => InvoiceDetailsScreen(
                              store: widget.store,
                              items: List<CartItem>.from(storeCartItems),
                              total: total,
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Create invoice'),
                    ),
                  ],
                ),
              ),
            ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          TextField(
            decoration: const InputDecoration(
              labelText: 'Search products',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) => setState(() => _search = value),
          ),
          const SizedBox(height: 16),
          if (storeCartItems.isNotEmpty)
            _CartSummary(
              items: storeCartItems,
              total: total,
              onRemove: (product) => ref
                  .read(cartControllerProvider.notifier)
                  .removeProduct(product, source: CartSource.selfBilling),
            ),
          if (storeCartItems.isNotEmpty) const SizedBox(height: 16),
          productsAsync.when(
            data: (products) {
              final filtered = products.where((product) {
                if (product.retailer.id != widget.store.id) return false;
                if (_search.isEmpty) return true;
                return product.name.toLowerCase().contains(_search.toLowerCase());
              }).toList();
              if (filtered.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text('No items found for this store.')),
                );
              }
              final grouped = <String, List<MarketplaceProduct>>{};
              for (final product in filtered) {
                final key = (product.category?.trim().isNotEmpty == true) ? product.category!.trim() : 'Items';
                grouped.putIfAbsent(key, () => []).add(product);
              }
              return Column(
                children: grouped.entries
                    .map(
                      (entry) => _CategorySection(
                        title: entry.key,
                        items: entry.value,
                      ),
                    )
                    .toList(),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}


class _CartSummary extends StatelessWidget {
  const _CartSummary({
    required this.items,
    required this.total,
    required this.onRemove,
  });

  final List<CartItem> items;
  final double total;
  final void Function(MarketplaceProduct product) onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F7F7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Your list', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
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
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: () => onRemove(item.product),
                  ),
                ],
              ),
            ),
          ),
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total', style: TextStyle(fontWeight: FontWeight.w700)),
              Text('₹${total.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  const _CategorySection({required this.title, required this.items});

  final String title;
  final List<MarketplaceProduct> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        ...items.map((product) => _ProductTile(product: product)),
        const SizedBox(height: 12),
      ],
    );
  }
}

class _ProductTile extends ConsumerWidget {
  const _ProductTile({required this.product});

  final MarketplaceProduct product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartItems = ref.watch(cartControllerProvider);
    final existing =
        cartItems.where((item) => item.product.id == product.id && item.source == CartSource.selfBilling).toList();
    final quantity = existing.isEmpty ? 0 : existing.first.quantity;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      tileColor: Colors.white,
      title: Text(product.name),
      subtitle: Text('${product.category ?? 'Item'} • ${product.retailer.shopName}'),
      trailing: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('₹${product.price.toStringAsFixed(0)}',
              style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFD00000))),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.remove_circle_outline, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints.tightFor(width: 28, height: 28),
                onPressed: quantity == 0
                    ? null
                    : () => ref.read(cartControllerProvider.notifier).removeProduct(
                          product,
                          source: CartSource.selfBilling,
                        ),
              ),
              Text(quantity.toString(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
              IconButton(
                icon: const Icon(Icons.add_circle_outline, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints.tightFor(width: 28, height: 28),
                onPressed: () => ref.read(cartControllerProvider.notifier).addProduct(
                      product,
                      source: CartSource.selfBilling,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
