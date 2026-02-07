import 'package:flutter/material.dart';

import '../../../models/user_models.dart';

class SelfOrderingBillingScreen extends StatefulWidget {
  const SelfOrderingBillingScreen({super.key, required this.store});

  final StoreSummary store;

  @override
  State<SelfOrderingBillingScreen> createState() => _SelfOrderingBillingScreenState();
}

class _SelfOrderingBillingScreenState extends State<SelfOrderingBillingScreen> {
  String? _selectedTable;
  int _selectedCategoryIndex = 0;

  final List<String> _tables = const ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
  final List<MenuCategory> _menu = [
    MenuCategory(
      name: 'Starters',
      items: [
        MenuItem(name: 'Crispy Corn', sku: 'ST-01', price: 120, taxPercentage: 5, isAvailable: true),
        MenuItem(name: 'Paneer Tikka', sku: 'ST-02', price: 180, taxPercentage: 5, isAvailable: true),
        MenuItem(name: 'Veg Manchurian', sku: 'ST-03', price: 160, taxPercentage: 5, isAvailable: false),
      ],
    ),
    MenuCategory(
      name: 'Main course',
      items: [
        MenuItem(name: 'Veg Biryani', sku: 'MC-01', price: 220, taxPercentage: 5, isAvailable: true),
        MenuItem(name: 'Dal Tadka', sku: 'MC-02', price: 160, taxPercentage: 5, isAvailable: true),
        MenuItem(name: 'Paneer Butter Masala', sku: 'MC-03', price: 240, taxPercentage: 5, isAvailable: true),
      ],
    ),
    MenuCategory(
      name: 'Beverages',
      items: [
        MenuItem(name: 'Lemon Soda', sku: 'BV-01', price: 60, taxPercentage: 5, isAvailable: true),
        MenuItem(name: 'Cold Coffee', sku: 'BV-02', price: 120, taxPercentage: 5, isAvailable: true),
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

  final List<_CartLine> _cart = [];

  @override
  Widget build(BuildContext context) {
    final selectedCategory = _menu[_selectedCategoryIndex];
    final cartTotal = _cart.fold<double>(0, (sum, line) => sum + (line.item.price * line.quantity));
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.store.shopName} Menu'),
        backgroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          _SectionCard(
            title: 'Table',
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_selectedTable == null)
                  const Text('No table selected', style: TextStyle(color: Colors.black54)),
                if (_selectedTable != null)
                  Chip(
                    label: Text(_selectedTable!),
                    backgroundColor: const Color(0xFFF3F4F6),
                  ),
                TextButton(
                  onPressed: () => _showTablePicker(context),
                  child: Text(_selectedTable == null ? 'Select table' : 'Change'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_selectedTable == null)
            const Text(
              'Pick your table to view the menu.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          if (_selectedTable != null) ...[
            Text('Menu for $_selectedTable', style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
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
          ],
        ],
      ),
      bottomNavigationBar: _cart.isEmpty
          ? null
          : GestureDetector(
              onTap: () => _showCartSheet(context),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                color: const Color(0xFFFDE047),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${_cart.length} items', style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text('₹${cartTotal.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    const Icon(Icons.keyboard_arrow_up),
                  ],
                ),
              ),
            ),
    );
  }

  void _showTablePicker(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Select table'),
          content: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _tables.map((table) {
              final isSelected = _selectedTable == table;
              return ChoiceChip(
                label: Text(table),
                selected: isSelected,
                onSelected: (_) {
                  setState(() => _selectedTable = table);
                  Navigator.of(context).pop();
                },
              );
            }).toList(),
          ),
        );
      },
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

  void _showCartSheet(BuildContext context) {
    final total = _cart.fold<double>(0, (sum, line) => sum + (line.item.price * line.quantity));
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your order', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 12),
              ..._cart.map(
                (line) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Expanded(child: Text(line.item.name)),
                      Text('x${line.quantity}'),
                      const SizedBox(width: 12),
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
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Order submitted.')),
                    );
                  },
                  child: const Text('Submit order'),
                ),
              ),
            ],
          ),
        );
      },
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
        const SizedBox(height: 12),
      ],
    );
  }
}

class _CartLine {
  const _CartLine({required this.item, required this.quantity});

  final MenuItem item;
  final int quantity;

  _CartLine copyWith({int? quantity}) => _CartLine(item: item, quantity: quantity ?? this.quantity);
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
