import 'package:flutter_riverpod/flutter_riverpod.dart';

class OrderItem {
  const OrderItem({required this.name, required this.quantity, required this.price});

  final String name;
  final int quantity;
  final double price;
}

class OrderInvoice {
  const OrderInvoice({
    required this.id,
    required this.storeName,
    required this.total,
    required this.status,
    required this.items,
  });

  final String id;
  final String storeName;
  final double total;
  final String status;
  final List<OrderItem> items;
}

class OrdersController extends StateNotifier<List<OrderInvoice>> {
  OrdersController() : super(const []);

  void addInvoice(OrderInvoice invoice) {
    state = [invoice, ...state];
  }
}

final ordersProvider = StateNotifierProvider<OrdersController, List<OrderInvoice>>(
  (ref) => OrdersController(),
);
