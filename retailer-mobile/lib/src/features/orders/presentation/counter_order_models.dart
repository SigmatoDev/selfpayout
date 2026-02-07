class CounterOrder {
  const CounterOrder({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
    required this.items,
  });

  final String id;
  final String? customerName;
  final String? customerPhone;
  final String status;
  final double totalAmount;
  final String createdAt;
  final List<CounterOrderItem> items;

  factory CounterOrder.fromJson(Map<String, dynamic> json) => CounterOrder(
        id: json['id'] as String? ?? '',
        customerName: json['customerName'] as String?,
        customerPhone: json['customerPhone'] as String?,
        status: json['status'] as String? ?? '',
        totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
        createdAt: json['createdAt'] as String? ?? '',
        items: (json['items'] as List<dynamic>? ?? [])
            .map((item) => CounterOrderItem.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
}

class CounterOrderItem {
  const CounterOrderItem({
    required this.name,
    required this.sku,
    required this.price,
    required this.quantity,
  });

  final String name;
  final String? sku;
  final double price;
  final int quantity;

  factory CounterOrderItem.fromJson(Map<String, dynamic> json) => CounterOrderItem(
        name: json['name'] as String? ?? '',
        sku: json['sku'] as String?,
        price: (json['price'] as num?)?.toDouble() ?? 0,
        quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      );
}
