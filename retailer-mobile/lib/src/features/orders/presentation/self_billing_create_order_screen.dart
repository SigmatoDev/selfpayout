import 'package:flutter/material.dart';

import 'self_billing_order_detail_screen.dart';

class SelfBillingCreateOrderScreen extends StatefulWidget {
  const SelfBillingCreateOrderScreen({super.key});

  @override
  State<SelfBillingCreateOrderScreen> createState() => _SelfBillingCreateOrderScreenState();
}

class _SelfBillingCreateOrderScreenState extends State<SelfBillingCreateOrderScreen> {
  int _selectedCategoryIndex = 0;
  final TextEditingController _phoneController = TextEditingController();
  final List<_CartLine> _cart = [];

  final List<_CatalogSection> _catalog = const [
    _CatalogSection(
      name: 'Staples',
      items: [
        _CatalogItem(name: 'Aashirvaad Atta 5kg', price: 320),
        _CatalogItem(name: 'Tata Salt 1kg', price: 28),
        _CatalogItem(name: 'Fortune Sunflower Oil 1L', price: 150),
      ],
    ),
    _CatalogSection(
      name: 'Dairy & Eggs',
      items: [
        _CatalogItem(name: 'Amul Butter 500g', price: 275),
        _CatalogItem(name: 'Britannia Bread', price: 40),
        _CatalogItem(name: 'Eggs (12 pack)', price: 74),
      ],
    ),
    _CatalogSection(
      name: 'Snacks',
      items: [
        _CatalogItem(name: 'Maggi 2-min', price: 12),
        _CatalogItem(name: 'Colgate Toothpaste 200g', price: 105),
      ],
    ),
  ];

  final Map<String, String> _categoryImages = const {
    'Staples':
        'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=400&q=80',
    'Dairy & Eggs':
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    'Snacks':
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&q=80',
  };

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final total = _cart.fold<double>(0, (sum, line) => sum + (line.item.price * line.quantity));
    final selectedSection = _catalog[_selectedCategoryIndex];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create self billing order'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Customer phone',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 98,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _catalog.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final section = _catalog[index];
                final isSelected = index == _selectedCategoryIndex;
                final imageUrl = _categoryImages[section.name] ??
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
                      section.name,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          Text('Items', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...selectedSection.items.map(
            (item) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(item.name),
              subtitle: Text('₹${item.price.toStringAsFixed(0)}'),
              trailing: IconButton(
                icon: const Icon(Icons.add_circle_outline),
                onPressed: () => _addToCart(item),
              ),
            ),
          ),
          if (_cart.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Cart', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ..._cart.map(
              (line) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
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
                Text('₹${total.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
              ],
            ),
          ],
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
                    onPressed: () => _submit(total),
                    child: const Text('Bill order'),
                  ),
                ],
              ),
            ),
    );
  }

  void _addToCart(_CatalogItem item) {
    setState(() {
      final index = _cart.indexWhere((line) => line.item.name == item.name);
      if (index >= 0) {
        _cart[index] = _cart[index].copyWith(quantity: _cart[index].quantity + 1);
      } else {
        _cart.add(_CartLine(item: item, quantity: 1));
      }
    });
  }

  void _submit(double total) {
    final phone = _phoneController.text.trim().isEmpty ? 'Walk-in' : _phoneController.text.trim();
    final order = SelfBillingOrder(
      orderId: 'SB-${DateTime.now().millisecondsSinceEpoch % 10000}',
      customerPhone: phone,
      submittedAt: 'Just now',
      items: _cart
          .map((line) => SelfBillingItem(name: line.item.name, price: line.item.price, quantity: line.quantity))
          .toList(),
      total: total,
      status: 'Submitted',
    );
    Navigator.of(context).pop(order);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Self billing order created.')),
    );
  }
}

class _CatalogItem {
  const _CatalogItem({required this.name, required this.price});

  final String name;
  final double price;
}

class _CatalogSection {
  const _CatalogSection({required this.name, required this.items});

  final String name;
  final List<_CatalogItem> items;
}

class _CartLine {
  const _CartLine({required this.item, required this.quantity});

  final _CatalogItem item;
  final int quantity;

  _CartLine copyWith({int? quantity}) => _CartLine(item: item, quantity: quantity ?? this.quantity);
}
