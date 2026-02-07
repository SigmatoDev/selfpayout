import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../models/models.dart';
import 'order_detail_screen.dart';

class CounterOrderScreen extends ConsumerStatefulWidget {
  const CounterOrderScreen({
    super.key,
    required this.onSubmit,
    required this.customerName,
    required this.customerPhone,
  });

  final ValueChanged<MockOrder> onSubmit;
  final String customerName;
  final String customerPhone;

  @override
  ConsumerState<CounterOrderScreen> createState() => _CounterOrderScreenState();
}

class _CounterOrderScreenState extends ConsumerState<CounterOrderScreen> {
  int _selectedCategoryIndex = 0;
  final List<_CartLine> _cart = [];
  String _selectedTable = 'T-01';
  late final TextEditingController _customerController =
      TextEditingController(text: widget.customerName);
  late final String _customerPhone = widget.customerPhone;

  final List<MenuCategory> _menu = [
    MenuCategory(
      id: 'cat-starters',
      name: 'Starters',
      items: [
        MenuItem(
          id: 'item-st-01',
          name: 'Crispy Corn',
          sku: 'ST-01',
          price: 120,
          taxPercentage: 5,
          tags: const ['starter'],
          isAvailable: true,
          addOnGroups: const [],
        ),
        MenuItem(
          id: 'item-st-02',
          name: 'Paneer Tikka',
          sku: 'ST-02',
          price: 180,
          taxPercentage: 5,
          tags: const ['starter'],
          isAvailable: true,
          addOnGroups: const [],
        ),
        MenuItem(
          id: 'item-st-03',
          name: 'Veg Manchurian',
          sku: 'ST-03',
          price: 160,
          taxPercentage: 5,
          tags: const ['starter'],
          isAvailable: true,
          addOnGroups: const [],
        ),
      ],
    ),
    MenuCategory(
      id: 'cat-main',
      name: 'Main course',
      items: [
        MenuItem(
          id: 'item-mc-01',
          name: 'Veg Biryani',
          sku: 'MC-01',
          price: 220,
          taxPercentage: 5,
          tags: const ['main'],
          isAvailable: true,
          addOnGroups: const [],
        ),
        MenuItem(
          id: 'item-mc-02',
          name: 'Dal Tadka',
          sku: 'MC-02',
          price: 160,
          taxPercentage: 5,
          tags: const ['main'],
          isAvailable: true,
          addOnGroups: const [],
        ),
        MenuItem(
          id: 'item-mc-03',
          name: 'Paneer Butter Masala',
          sku: 'MC-03',
          price: 240,
          taxPercentage: 5,
          tags: const ['main'],
          isAvailable: true,
          addOnGroups: const [],
        ),
      ],
    ),
    MenuCategory(
      id: 'cat-bev',
      name: 'Beverages',
      items: [
        MenuItem(
          id: 'item-bv-01',
          name: 'Lemon Soda',
          sku: 'BV-01',
          price: 60,
          taxPercentage: 5,
          tags: const ['beverage'],
          isAvailable: true,
          addOnGroups: const [],
        ),
        MenuItem(
          id: 'item-bv-02',
          name: 'Cold Coffee',
          sku: 'BV-02',
          price: 120,
          taxPercentage: 5,
          tags: const ['beverage'],
          isAvailable: true,
          addOnGroups: const [],
        ),
      ],
    ),
  ];

  final Map<String, String> _categoryImages = const {
    'Starters':
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&q=80',
    'Main course':
        'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=400&q=80',
    'Beverages':
        'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=400&q=80',
  };

  final List<String> _tables = const ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07'];

  @override
  void dispose() {
    _customerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selectedCategory = _menu[_selectedCategoryIndex];
    final total = _cart.fold<double>(0, (sum, line) => sum + (line.item.price * line.quantity));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Counter order'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                const Icon(Icons.person, size: 18),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${_customerController.text} • $_customerPhone',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _customerController,
                  decoration: const InputDecoration(
                    labelText: 'Customer name',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              DropdownButton<String>(
                value: _selectedTable,
                items: _tables.map((table) => DropdownMenuItem(value: table, child: Text(table))).toList(),
                onChanged: (value) => setState(() => _selectedTable = value ?? _selectedTable),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 98,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _menu.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final category = _menu[index];
                final isSelected = index == _selectedCategoryIndex;
                final imageUrl = _categoryImages[category.name] ??
                    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80';
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategoryIndex = index),
                  child: Container(
                    width: 120,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFFE5E7EB),
                        width: 2,
                      ),
                      image: DecorationImage(
                        image: NetworkImage(imageUrl),
                        fit: BoxFit.cover,
                        colorFilter: ColorFilter.mode(
                          Colors.black.withValues(alpha: 0.28),
                          BlendMode.darken,
                        ),
                      ),
                    ),
                    padding: const EdgeInsets.all(10),
                    alignment: Alignment.bottomLeft,
                    child: Text(
                      category.name,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          _MenuSection(
            category: selectedCategory,
            onAdd: (item) => _addToCart(item),
          ),
          const SizedBox(height: 16),
          if (_cart.isNotEmpty) _CartSummary(cart: _cart, total: total),
        ],
      ),
      bottomNavigationBar: _cart.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              decoration: const BoxDecoration(
                color: Color(0xFFFDE047),
                border: Border(top: BorderSide(color: Color(0xFFFCD34D))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${_cart.length} items', style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text('₹${total.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  ElevatedButton(
                    onPressed: () => _submitOrder(context),
                    child: const Text('Take payment'),
                  ),
                ],
              ),
            ),
    );
  }

  void _addToCart(MenuItem item) {
    setState(() {
      final index = _cart.indexWhere((line) => line.item.sku == item.sku);
      if (index >= 0) {
        _cart[index] = _cart[index].copyWith(quantity: _cart[index].quantity + 1);
      } else {
        _cart.add(_CartLine(item: item, quantity: 1));
      }
    });
  }

  Future<void> _submitOrder(BuildContext context) async {
    final orderId = '#CNT-${DateTime.now().millisecondsSinceEpoch % 10000}';
    final items = _cart
        .map((line) => MockOrderItem(name: line.item.name, price: line.item.price, quantity: line.quantity))
        .toList();
    final order = MockOrder(
      orderId: orderId,
      customerName: _customerController.text.trim().isEmpty ? 'Walk-in customer' : _customerController.text.trim(),
      customerPhone: _customerPhone,
      tableId: _selectedTable,
      status: 'Accepted',
      items: items,
    );
    widget.onSubmit(order);
    await ref.read(retailerApiProvider).createCounterOrder({
      'customerName': _customerController.text.trim().isEmpty ? 'Walk-in customer' : _customerController.text.trim(),
      'customerPhone': _customerPhone,
      'paymentMode': 'CASH',
      'items': _cart
          .map(
            (line) => {
              'name': line.item.name,
              'sku': line.item.sku,
              'price': line.item.price,
              'quantity': line.quantity,
            },
          )
          .toList(),
    });
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order accepted and payment recorded.')),
    );
  }
}

class _MenuSection extends StatelessWidget {
  const _MenuSection({required this.category, required this.onAdd});

  final MenuCategory category;
  final ValueChanged<MenuItem> onAdd;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(category.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        ...category.items.map(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                _thumbnailFor(item.name),
                width: 52,
                height: 52,
                fit: BoxFit.cover,
              ),
            ),
            title: Text(item.name),
            subtitle: Text('₹${item.price.toStringAsFixed(0)}'),
            trailing: item.isAvailable
                ? IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: () => onAdd(item),
                  )
                : const Icon(Icons.remove_circle_outline, color: Colors.grey),
          ),
        ),
      ],
    );
  }
}

String _thumbnailFor(String name) {
  final seed = name.length % 3;
  switch (seed) {
    case 0:
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80';
    case 1:
      return 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=200&q=80';
    default:
      return 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=200&q=80';
  }
}

class _CartSummary extends StatelessWidget {
  const _CartSummary({required this.cart, required this.total});

  final List<_CartLine> cart;
  final double total;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Cart summary', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            ...cart.map(
              (line) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(line.item.name)),
                    Text('x${line.quantity}'),
                    const SizedBox(width: 10),
                    Text('₹${(line.item.price * line.quantity).toStringAsFixed(0)}'),
                  ],
                ),
              ),
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total'),
                Text('₹${total.toStringAsFixed(0)}'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CartLine {
  const _CartLine({required this.item, required this.quantity});

  final MenuItem item;
  final int quantity;

  _CartLine copyWith({int? quantity}) => _CartLine(item: item, quantity: quantity ?? this.quantity);
}
