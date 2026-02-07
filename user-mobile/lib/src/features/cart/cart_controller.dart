import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/user_models.dart';

enum CartSource { marketplace, selfBilling, ticket }

class CartItem {
  CartItem({required this.product, required this.quantity, required this.source});

  final MarketplaceProduct product;
  final int quantity;
  final CartSource source;

  CartItem copyWith({int? quantity}) =>
      CartItem(product: product, quantity: quantity ?? this.quantity, source: source);
}

class CartController extends StateNotifier<List<CartItem>> {
  CartController() : super(const []);

  void addProduct(MarketplaceProduct product, {CartSource source = CartSource.marketplace, int quantity = 1}) {
    final index = state.indexWhere((item) => item.product.id == product.id && item.source == source);
    if (index == -1) {
      state = [...state, CartItem(product: product, quantity: quantity, source: source)];
    } else {
      final item = state[index];
      final updated = item.copyWith(quantity: item.quantity + quantity);
      state = [
        ...state.sublist(0, index),
        updated,
        ...state.sublist(index + 1),
      ];
    }
  }

  void removeProduct(MarketplaceProduct product, {CartSource source = CartSource.marketplace}) {
    final index = state.indexWhere((item) => item.product.id == product.id && item.source == source);
    if (index == -1) return;
    final item = state[index];
    final nextQty = item.quantity - 1;
    if (nextQty <= 0) {
      state = [...state]..removeAt(index);
    } else {
      final updated = item.copyWith(quantity: nextQty);
      state = [
        ...state.sublist(0, index),
        updated,
        ...state.sublist(index + 1),
      ];
    }
  }

  void clear() {
    state = const [];
  }
}

final cartControllerProvider = StateNotifierProvider<CartController, List<CartItem>>(
  (ref) => CartController(),
);
