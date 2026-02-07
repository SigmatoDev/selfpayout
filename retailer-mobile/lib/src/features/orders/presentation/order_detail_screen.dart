import 'package:flutter/material.dart';

class MockOrder {
  const MockOrder({
    required this.orderId,
    required this.customerName,
    required this.customerPhone,
    required this.tableId,
    required this.status,
    required this.items,
  });

  final String orderId;
  final String customerName;
  final String customerPhone;
  final String tableId;
  final String status;
  final List<MockOrderItem> items;

  double get total => items.fold(0, (sum, item) => sum + (item.price * item.quantity));
}

class MockOrderItem {
  const MockOrderItem({
    required this.name,
    required this.price,
    required this.quantity,
  });

  final String name;
  final double price;
  final int quantity;
}

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key, required this.order});

  final MockOrder order;

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  static const List<String> _statuses = ['Received', 'Preparing', 'Ready', 'Completed'];
  late String _status;
  late List<MockOrderItem> _editableItems;
  final TextEditingController _menuSearchController = TextEditingController();
  final List<MockOrderItem> _menuCatalog = const [
    MockOrderItem(name: 'Masala Dosa', price: 120, quantity: 1),
    MockOrderItem(name: 'Filter Coffee', price: 60, quantity: 1),
    MockOrderItem(name: 'Paneer Tikka Wrap', price: 190, quantity: 1),
    MockOrderItem(name: 'Lime Soda', price: 70, quantity: 1),
    MockOrderItem(name: 'Veg Pulao', price: 160, quantity: 1),
    MockOrderItem(name: 'Gulab Jamun', price: 80, quantity: 1),
    MockOrderItem(name: 'Idli Sambar', price: 90, quantity: 1),
    MockOrderItem(name: 'Butter Naan', price: 35, quantity: 1),
  ];

  @override
  void initState() {
    super.initState();
    _status = widget.order.status;
    _editableItems = widget.order.items
        .map((item) => MockOrderItem(name: item.name, price: item.price, quantity: item.quantity))
        .toList();
  }

  @override
  void dispose() {
    _menuSearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final order = widget.order;
    final editableTotal =
        _editableItems.fold(0.0, (sum, item) => sum + (item.price * item.quantity));

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
                  Text('Customer: ${order.customerName}'),
                  Text('Order ID: ${order.orderId}'),
                  Text('Table ID: ${order.tableId}'),
                  const SizedBox(height: 8),
                  _StatusChip(status: _status),
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
                  ..._editableItems.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Expanded(child: Text(item.name)),
                          Text('x${item.quantity}', style: theme.textTheme.bodySmall),
                          const SizedBox(width: 12),
                          Text('₹${(item.price * item.quantity).toStringAsFixed(2)}'),
                          const SizedBox(width: 12),
                          _QtyButton(
                            icon: Icons.remove,
                            onPressed: item.quantity <= 1
                                ? null
                                : () => setState(() {
                                      _editableItems = _editableItems
                                          .map(
                                            (current) => current.name == item.name
                                                ? MockOrderItem(
                                                    name: current.name,
                                                    price: current.price,
                                                    quantity: current.quantity - 1,
                                                  )
                                                : current,
                                          )
                                          .toList();
                                    }),
                          ),
                          _QtyButton(
                            icon: Icons.add,
                            onPressed: () => setState(() {
                              _editableItems = _editableItems
                                  .map(
                                    (current) => current.name == item.name
                                        ? MockOrderItem(
                                            name: current.name,
                                            price: current.price,
                                            quantity: current.quantity + 1,
                                          )
                                        : current,
                                  )
                                  .toList();
                            }),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Total', style: theme.textTheme.titleSmall),
                      Text('₹${editableTotal.toStringAsFixed(2)}', style: theme.textTheme.titleSmall),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      children: [
                        TextButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Order edits saved.')),
                            );
                          },
                          icon: const Icon(Icons.edit_outlined),
                          label: const Text('Save edits'),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => _showAddItemDialog(context),
                          icon: const Icon(Icons.add),
                          label: const Text('Add item'),
                        ),
                      ],
                    ),
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
                  Text('Update status', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _status,
                    items: _statuses
                        .map((status) => DropdownMenuItem(value: status, child: Text(status)))
                        .toList(),
                    onChanged: (value) => setState(() => _status = value ?? _status),
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Order status updated to $_status')),
                      );
                    },
                    child: const Text('Save status'),
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
                  Text('Cancel order', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  const TextField(
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: 'Cancellation reason',
                      hintText: 'Add a short note for the customer',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Order cancelled.')),
                        );
                      },
                      child: const Text(
                        'Cancel order',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddItemDialog(BuildContext context) {
    _menuSearchController.clear();
    showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final term = _menuSearchController.text.trim().toLowerCase();
            final filtered = term.isEmpty
                ? _menuCatalog
                : _menuCatalog.where((item) => item.name.toLowerCase().contains(term)).toList();
            return AlertDialog(
              title: const Text('Add menu item'),
              content: SizedBox(
                width: 320,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: _menuSearchController,
                      decoration: const InputDecoration(
                        labelText: 'Search menu',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (_) => setDialogState(() {}),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 220,
                      child: ListView.separated(
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          return ListTile(
                            title: Text(item.name),
                            subtitle: Text('₹${item.price.toStringAsFixed(2)}'),
                            trailing: const Icon(Icons.add_circle_outline),
                            onTap: () {
                              setState(() {
                                final existingIndex =
                                    _editableItems.indexWhere((entry) => entry.name == item.name);
                                if (existingIndex >= 0) {
                                  final existing = _editableItems[existingIndex];
                                  _editableItems[existingIndex] = MockOrderItem(
                                    name: existing.name,
                                    price: existing.price,
                                    quantity: existing.quantity + 1,
                                  );
                                } else {
                                  _editableItems = [
                                    ..._editableItems,
                                    MockOrderItem(name: item.name, price: item.price, quantity: 1),
                                  ];
                                }
                              });
                              Navigator.of(context).pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('${item.name} added to order.')),
                              );
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Close'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(icon, size: 18),
      onPressed: onPressed,
      tooltip: onPressed == null ? 'Minimum qty' : null,
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(status, style: theme.textTheme.labelMedium),
    );
  }
}
