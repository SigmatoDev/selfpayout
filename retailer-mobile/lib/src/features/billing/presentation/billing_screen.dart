import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/di/providers.dart';
import '../../../core/language/language_controller.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../orders/presentation/counter_order_screen.dart';
import '../../ticketing/presentation/self_ticketing_screen.dart';
import '../../ticketing/presentation/ticket_order_detail_screen.dart';
import '../../orders/presentation/self_billing_create_order_screen.dart';
import '../../orders/presentation/marketplace_order_detail_screen.dart';
import '../../orders/presentation/self_checkout_session_detail_screen.dart';
import '../../orders/presentation/counter_order_detail_screen.dart';
import '../../orders/presentation/counter_order_models.dart';
import '../../orders/presentation/self_billing_order_detail_screen.dart';
import '../../workspace/workspace_providers.dart';
import '../../inventory/presentation/barcode_scanner_sheet.dart';

class BillingScreen extends ConsumerStatefulWidget {
  const BillingScreen({super.key});

  @override
  ConsumerState<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends ConsumerState<BillingScreen> {
  final _searchController = TextEditingController();
  final _customerPhoneController = TextEditingController();

  final List<_CartItem> _cart = [];
  int _orderTabIndex = 0;
  PaymentMode _paymentMode = PaymentMode.cash;
  bool _isSubmitting = false;
  InvoiceResult? _lastInvoice;
  String? _statusMessage;
  Customer? _selectedCustomer;

  @override
  void initState() {
    super.initState();
    _customerPhoneController.addListener(_handleCustomerLookup);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _customerPhoneController
      ..removeListener(_handleCustomerLookup)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderStatus = _orderTabIndex == 0 ? SessionStatus.submitted : SessionStatus.approved;
    final sessionsAsync = ref.watch(selfCheckoutSessionsProvider(orderStatus));
    final user = ref.watch(authControllerProvider).valueOrNull;
    final retailerId = user?.retailerId;
    final ticketOrdersAsync =
        retailerId == null ? const AsyncValue<List<TicketOrder>>.data([]) : ref.watch(ticketOrdersProvider(retailerId));
    final marketplaceOrdersAsync = retailerId == null
        ? const AsyncValue<List<MarketplaceOrder>>.data([])
        : ref.watch(marketplaceOrdersProvider(retailerId));
    final counterOrdersAsync = ref.watch(counterOrdersProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(selfCheckoutSessionsProvider(SessionStatus.submitted));
        ref.invalidate(selfCheckoutSessionsProvider(SessionStatus.approved));
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 8).copyWith(bottom: 120),
        children: [
          _buildOrdersSection(context, sessionsAsync),
          const SizedBox(height: 16),
          _TicketOrdersSection(
            ordersAsync: ticketOrdersAsync,
            onOpen: (order) {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => TicketOrderDetailScreen(order: order)),
              );
            },
          ),
          const SizedBox(height: 16),
          _SelfBillingOrdersSection(
            sessionsAsync: sessionsAsync,
            onOpen: (session) {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => SelfCheckoutSessionDetailScreen(session: session)),
              );
            },
            onCreate: () {
              Navigator.of(context)
                  .push<SelfBillingOrder>(
                    MaterialPageRoute(
                      builder: (_) => const SelfBillingCreateOrderScreen(),
                    ),
                  )
                  .then((order) {
                if (order == null) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Order created locally.')),
                );
              });
            },
          ),
          const SizedBox(height: 16),
          _MarketplaceOrdersSection(
            ordersAsync: marketplaceOrdersAsync,
            onOpen: (order) {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => MarketplaceOrderDetailScreen(order: order)),
              );
            },
          ),
          const SizedBox(height: 16),
          _CounterOrdersSection(
            ordersAsync: counterOrdersAsync,
            onOpen: (order) {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => CounterOrderDetailScreen(order: order)),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersSection(BuildContext context, AsyncValue<List<CheckoutSession>> sessionsAsync) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Orders', style: Theme.of(context).textTheme.titleMedium),
                OutlinedButton.icon(
                  onPressed: () => _openCounterOrder(context),
                  icon: const Icon(Icons.add),
                  label: const Text('Take order'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('New')),
                ButtonSegment(value: 1, label: Text('Accepted')),
              ],
              selected: {_orderTabIndex},
              onSelectionChanged: (selection) => setState(() => _orderTabIndex = selection.first),
            ),
            const SizedBox(height: 12),
            sessionsAsync.when(
              data: (sessions) {
                if (sessions.isEmpty) {
                  return const Text(
                    'No orders received yet.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  );
                }
                return Column(
                  children: sessions
                      .map(
                        (session) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                            child: const Icon(Icons.receipt_long),
                          ),
                          title: Text(session.customerPhone ?? 'Walk-in'),
                          subtitle: Text(
                            '${session.id.substring(0, 8)} • ${session.tableNumber ?? 'Counter'}',
                          ),
                          trailing: Wrap(
                            spacing: 8,
                            children: [
                              const _OrderSourceChip(source: _OrderSource.qr),
                              TextButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => SelfCheckoutSessionDetailScreen(session: session),
                                    ),
                                  );
                                },
                                child: const Text('View'),
                              ),
                              IconButton(
                                tooltip: 'Print',
                                icon: const Icon(Icons.print),
                                onPressed: () => _showPrintPreview(context, session),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: CircularProgressIndicator()),
              ),
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

  void _showPrintPreview(BuildContext context, CheckoutSession order) {
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Print preview'),
          content: SizedBox(
            width: 280,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Order ${order.id}', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text('Customer: ${order.customerPhone ?? 'Walk-in'}'),
                Text('Table: ${order.tableNumber ?? 'Counter'}'),
                const Divider(height: 24),
                ...order.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Expanded(child: Text(item.name)),
                        Text('x${item.quantity}'),
                        const SizedBox(width: 8),
                        Text('₹${(item.price * item.quantity).toStringAsFixed(2)}'),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total'),
                    Text('₹${order.totalAmount.toStringAsFixed(2)}'),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sent to carbon printer.')),
                );
              },
              icon: const Icon(Icons.print),
              label: const Text('Print'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSearchBar(
    AsyncValue<List<InventoryItem>> inventoryAsync,
    LanguageStrings strings,
    Map<String, List<InventoryItem>> categoryMap,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (categoryMap.isNotEmpty) ...[
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: categoryMap.entries
                      .map(
                        (entry) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ActionChip(
                            label: Text(entry.key),
                            onPressed: () => _openCategoryPicker(entry.key, entry.value),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Items', style: Theme.of(context).textTheme.titleSmall),
                IconButton(
                  tooltip: 'Scan barcode',
                  icon: const Icon(Icons.qr_code_scanner),
                  onPressed: _handleScanBarcode,
                ),
              ],
            ),
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Scan barcode or search item',
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => setState(() {
                          _searchController.clear();
                        }),
                      )
                    : null,
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
        padding: const EdgeInsets.all(12),
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

  Widget _buildPaymentSection(AsyncValue<List<Customer>> customersAsync) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _customerPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Customer phone (optional)'),
            ),
            const SizedBox(height: 8),
            customersAsync.when(
              data: (_) => const SizedBox.shrink(),
              loading: () => const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text('Loading customers...', style: TextStyle(fontSize: 12, color: Colors.grey)),
              ),
              error: (error, _) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  error.toString(),
                  style: const TextStyle(fontSize: 12, color: Colors.redAccent),
                ),
              ),
            ),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: _selectedCustomer != null
                  ? ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.person),
                      title: Text(_selectedCustomer!.name),
                      subtitle: Text(_selectedCustomer!.phone),
                    )
                  : (_customerPhoneController.text.isEmpty
                      ? const SizedBox.shrink()
                      : const Text(
                          'No customer found with this phone.',
                          style: TextStyle(fontSize: 12, color: Colors.redAccent),
                        )),
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
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTotalRow('Subtotal', totals.subtotal),
            _buildTotalRow('Tax', totals.tax),
            const Divider(height: 24),
            _buildTotalRow('Total', totals.total, isEmphasis: true),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed:
                  _cart.isEmpty || _isSubmitting || _selectedCustomer == null ? null : _handleCollectPayment,
              child: _isSubmitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(strings.label(TranslationKey.collectPayment)),
            ),
            if (_selectedCustomer == null)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Enter a known customer phone to continue.',
                  style: TextStyle(fontSize: 12, color: Colors.redAccent),
                ),
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

  Future<void> _handleScanBarcode() async {
    final code = await showBarcodeScannerSheet(context);
    if (code == null) return;
    final normalized = code.trim();
    setState(() {
      _searchController.text = normalized;
    });

    final inventory = ref.read(inventoryProvider).valueOrNull;
    InventoryItem? match;
    if (inventory != null) {
      for (final item in inventory) {
        final barcode = item.barcode?.trim();
        if (barcode != null && barcode == normalized) {
          match = item;
          break;
        }
      }
    }

    if (match != null) {
      _addToCart(match);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added ${match.name} to cart')),
      );
    } else if (mounted) {
      final externalItem = _cartItemFromBarcodeData(normalized);
      if (externalItem != null) {
        _addCustomCartItem(externalItem);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Added ${externalItem.name} from barcode data')),
          );
        }
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No item found for barcode $normalized')),
        );
      }
    }
  }

  void _handleCustomerLookup() {
    final phone = _customerPhoneController.text.trim();
    final customers = ref.read(customersProvider).valueOrNull ?? [];
    final match = customers.firstWhereOrNull((customer) => customer.phone == phone);
    setState(() {
      _selectedCustomer = match;
    });
  }

  void _openCategoryPicker(String category, List<InventoryItem> items) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.8,
          builder: (context, controller) {
            return Container(
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('$category items', style: Theme.of(context).textTheme.titleMedium),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      controller: controller,
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return ListTile(
                          title: Text(item.name),
                          subtitle: Text('₹${item.price.toStringAsFixed(2)}'),
                          trailing: IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () {
                              _addToCart(item);
                              Navigator.of(context).pop();
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  List<InventoryItem> _filteredInventory(List<InventoryItem> all) {
    final term = _searchController.text.trim().toLowerCase();
    if (term.isEmpty) {
      return all.take(8).toList();
    }
    return all
        .where((item) {
          final barcode = item.barcode?.toLowerCase();
          return item.name.toLowerCase().contains(term) ||
              item.sku.toLowerCase().contains(term) ||
              (barcode != null && barcode.contains(term));
        })
        .take(8)
        .toList();
  }

  void _addCustomCartItem(_CartItem newItem) {
    setState(() {
      final existing = _cart.indexWhere((cartItem) => cartItem.sku == newItem.sku);
      if (existing >= 0) {
        _cart[existing] = _cart[existing].copyWith(
          quantity: _cart[existing].quantity + newItem.quantity,
          price: newItem.price,
        );
      } else {
        _cart.add(newItem);
      }
    });
  }

  _CartItem? _cartItemFromBarcodeData(String raw) {
    if (raw.isEmpty) return null;

    final jsonItem = _cartItemFromJson(raw);
    if (jsonItem != null) return jsonItem;

    final pipeItem = _cartItemFromDelimited(raw, delimiter: '|');
    if (pipeItem != null) return pipeItem;

    final commaItem = _cartItemFromDelimited(raw, delimiter: ',');
    if (commaItem != null) return commaItem;

    final numericPrice = double.tryParse(raw);
    if (numericPrice != null) {
      return _CartItem(
        sku: raw,
        name: 'Barcode item',
        price: numericPrice,
        quantity: 1,
        taxPercentage: 0,
      );
    }

    return null;
  }

  _CartItem? _cartItemFromJson(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return null;
      final price = _coerceToDouble(decoded['price']);
      if (price == null) return null;
      final sku = (decoded['sku'] as String?)?.trim().isNotEmpty == true ? decoded['sku'].toString() : raw;
      final name = (decoded['name'] as String?)?.trim().isNotEmpty == true ? decoded['name'].toString() : 'Barcode item';
      final parsedQuantity = (decoded['quantity'] as num?)?.toInt() ?? 1;
      final quantity = parsedQuantity < 1
          ? 1
          : parsedQuantity > 999
              ? 999
              : parsedQuantity;
      final tax = _coerceToDouble(decoded['tax']) ?? 0;

      return _CartItem(sku: sku, name: name, price: price, quantity: quantity, taxPercentage: tax);
    } catch (_) {
      return null;
    }
  }

  _CartItem? _cartItemFromDelimited(String raw, {required String delimiter}) {
    if (!raw.contains(delimiter)) return null;
    final parts = raw.split(delimiter).map((part) => part.trim()).where((element) => element.isNotEmpty).toList();
    if (parts.length < 2) return null;
    final price = double.tryParse(parts.last);
    if (price == null) return null;

    String sku;
    String name;
    if (parts.length >= 3) {
      sku = parts[0];
      name = parts[1];
    } else {
      sku = parts[0];
      name = parts[0];
    }

    return _CartItem(
      sku: sku,
      name: name,
      price: price,
      quantity: 1,
      taxPercentage: 0,
    );
  }

  double? _coerceToDouble(dynamic raw) {
    if (raw == null) return null;
    if (raw is num) return raw.toDouble();
    return double.tryParse(raw.toString());
  }

  Map<String, List<InventoryItem>> _groupInventoryByCategory(List<InventoryItem> items) {
    final map = <String, List<InventoryItem>>{};
    for (final item in items) {
      final key = (item.category?.isNotEmpty ?? false) ? item.category!.trim() : 'All items';
      map.putIfAbsent(key, () => []).add(item);
    }
    return map;
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
    if (_cart.isEmpty || _selectedCustomer == null) return;
    setState(() {
      _isSubmitting = true;
      _statusMessage = null;
    });

    final payload = CreateInvoicePayload(
      paymentMode: _paymentMode,
      customerPhone: _selectedCustomer?.phone,
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

  void _openCounterOrder(BuildContext context) {
    showDialog<_CounterCustomerPayload>(
      context: context,
      builder: (context) => const _CounterCustomerDialog(),
    ).then((payload) {
      if (payload == null) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => CounterOrderScreen(
            customerName: payload.name,
            customerPhone: payload.phone,
            onSubmit: (order) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Counter order captured.')),
              );
            },
          ),
        ),
      );
    });
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

class _OrderStatusChip extends StatelessWidget {
  const _OrderStatusChip({required this.status});

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

enum _OrderSource { qr, counter }

class _OrderSourceChip extends StatelessWidget {
  const _OrderSourceChip({required this.source});

  final _OrderSource source;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isCounter = source == _OrderSource.counter;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isCounter
            ? const Color(0xFFFDE68A)
            : theme.colorScheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        isCounter ? 'CO' : 'QR',
        style: theme.textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _TicketingCard extends StatelessWidget {
  const _TicketingCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: const LinearGradient(
            colors: [Color(0xFF111827), Color(0xFF1F2937)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: const Icon(Icons.confirmation_number_outlined, color: Colors.white, size: 30),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Self ticketing',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Browse events, manage tickets, and capture bookings.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white70,
                        ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.white70, size: 16),
          ],
        ),
      ),
    );
  }
}

class _TicketOrdersSection extends StatelessWidget {
  const _TicketOrdersSection({required this.ordersAsync, required this.onOpen});

  final AsyncValue<List<TicketOrder>> ordersAsync;
  final ValueChanged<TicketOrder> onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Latest ticket orders', style: Theme.of(context).textTheme.titleMedium),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SelfTicketingScreen()),
                    );
                  },
                  child: const Text('Buy ticket'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ordersAsync.when(
              data: (orders) {
                if (orders.isEmpty) {
                  return const Text(
                    'No ticket orders yet.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  );
                }
                return Column(
                  children: orders
                      .map(
                        (order) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                            child: const Icon(Icons.confirmation_number_outlined),
                          ),
                          title: Text(order.buyerPhone),
                          subtitle: Text('${order.orderId} • ${order.eventName}'),
                          trailing: _TicketOrderStatus(status: order.status),
                          onTap: () => onOpen(order),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: CircularProgressIndicator()),
              ),
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
}

class _TicketOrderStatus extends StatelessWidget {
  const _TicketOrderStatus({required this.status});

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

class _SelfBillingOrdersSection extends StatelessWidget {
  const _SelfBillingOrdersSection({
    required this.sessionsAsync,
    required this.onOpen,
    required this.onCreate,
  });

  final AsyncValue<List<CheckoutSession>> sessionsAsync;
  final ValueChanged<CheckoutSession> onOpen;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Latest self billing orders', style: Theme.of(context).textTheme.titleMedium),
                TextButton(
                  onPressed: onCreate,
                  child: const Text('Create order'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            sessionsAsync.when(
              data: (sessions) {
                if (sessions.isEmpty) {
                  return const Text(
                    'No self billing orders yet.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  );
                }
                return Column(
                  children: sessions
                      .map(
                        (session) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                            child: const Icon(Icons.qr_code),
                          ),
                          title: Text(session.customerPhone ?? 'Walk-in'),
                          subtitle: Text('${session.id.substring(0, 8)} • ${session.items.length} items'),
                          trailing: _TicketOrderStatus(status: session.status.apiValue),
                          onTap: () => onOpen(session),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: CircularProgressIndicator()),
              ),
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
}

class _MarketplaceOrdersSection extends StatelessWidget {
  const _MarketplaceOrdersSection({required this.ordersAsync, required this.onOpen});

  final AsyncValue<List<MarketplaceOrder>> ordersAsync;
  final ValueChanged<MarketplaceOrder> onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Latest marketplace orders', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ordersAsync.when(
              data: (orders) {
                if (orders.isEmpty) {
                  return const Text(
                    'No marketplace orders yet.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  );
                }
                return Column(
                  children: orders
                      .map(
                        (order) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                            child: const Icon(Icons.local_shipping_outlined),
                          ),
                          title: Text(order.customerPhone),
                          subtitle: Text('${order.orderId} • ${order.status}'),
                          trailing: _TicketOrderStatus(status: order.status),
                          onTap: () => onOpen(order),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: CircularProgressIndicator()),
              ),
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
}

class _CounterOrdersSection extends StatelessWidget {
  const _CounterOrdersSection({required this.ordersAsync, required this.onOpen});

  final AsyncValue<List<CounterOrder>> ordersAsync;
  final ValueChanged<CounterOrder> onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Counter orders', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ordersAsync.when(
              data: (orders) {
                if (orders.isEmpty) {
                  return const Text(
                    'No counter orders yet.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  );
                }
                return Column(
                  children: orders
                      .map(
                        (order) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                            child: const Icon(Icons.point_of_sale),
                          ),
                          title: Text(order.customerPhone ?? 'Walk-in'),
                          subtitle: Text('${order.id.substring(0, 8)} • ${order.status}'),
                          trailing: _TicketOrderStatus(status: order.status),
                          onTap: () => onOpen(order),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: CircularProgressIndicator()),
              ),
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
}

class _CounterCustomerPayload {
  const _CounterCustomerPayload({required this.name, required this.phone});

  final String name;
  final String phone;
}

class _CounterCustomerDialog extends StatefulWidget {
  const _CounterCustomerDialog();

  @override
  State<_CounterCustomerDialog> createState() => _CounterCustomerDialogState();
}

class _CounterCustomerDialogState extends State<_CounterCustomerDialog> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _validated = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Customer verification'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Customer name (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Phone number',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'OTP',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _validateOtp,
                child: const Text('Validate'),
              ),
            ],
          ),
          if (_validated)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 16),
                  SizedBox(width: 6),
                  Text('OTP verified'),
                ],
              ),
            ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
            ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _validated ? _submit : null,
          child: const Text('Continue'),
        ),
      ],
    );
  }

  void _validateOtp() {
    setState(() => _error = null);
    if (_phoneController.text.trim().isEmpty) {
      setState(() => _error = 'Enter phone number first.');
      return;
    }
    if (_otpController.text.trim() != '1234') {
      setState(() => _error = 'Invalid OTP. Use 1234 for now.');
      return;
    }
    setState(() => _validated = true);
  }

  void _submit() {
    final phone = _phoneController.text.trim();
    final name = _nameController.text.trim().isEmpty ? 'Walk-in customer' : _nameController.text.trim();
    Navigator.of(context).pop(_CounterCustomerPayload(name: name, phone: phone));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Customer saved.')),
    );
  }
}
