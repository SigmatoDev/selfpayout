import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../models/models.dart';
import '../ticketing/presentation/ticket_models.dart';
import '../ticketing/presentation/ticket_order_detail_screen.dart';
import '../orders/presentation/marketplace_order_detail_screen.dart';
import '../orders/presentation/counter_order_models.dart';

final inventoryProvider = FutureProvider<List<InventoryItem>>((ref) {
  return ref.watch(retailerApiProvider).fetchInventory();
});

final customersProvider = FutureProvider<List<Customer>>((ref) {
  return ref.watch(retailerApiProvider).fetchCustomers();
});

final customerHistoryProvider =
    FutureProvider.family<List<CustomerInvoice>, String>((ref, customerId) {
  return ref.watch(retailerApiProvider).fetchCustomerHistory(customerId);
});

final salesSummaryProvider = FutureProvider<SalesSummary?>((ref) {
  return ref.watch(retailerApiProvider).fetchSalesSummary();
});

final ledgerProvider = FutureProvider<List<LedgerEntry>>((ref) {
  return ref.watch(retailerApiProvider).fetchLedger();
});

final selfCheckoutSessionsProvider =
    FutureProvider.family<List<CheckoutSession>, SessionStatus>((ref, status) {
  return ref.watch(retailerApiProvider).fetchSelfCheckoutSessions(status);
});

final restaurantMenuProvider =
    FutureProvider.family<MenuResponse, String>((ref, retailerId) {
  return ref.watch(retailerApiProvider).fetchRestaurantMenu(retailerId);
});

final restaurantTablesProvider =
    FutureProvider.family<List<TableInfo>, String>((ref, retailerId) {
  return ref.watch(retailerApiProvider).fetchTables(retailerId);
});

final paymentsProvider =
    FutureProvider.family<List<PaymentInvoice>, String>((ref, retailerId) {
  return ref.watch(retailerApiProvider).fetchInvoices(retailerId);
});

final ticketEventsProvider = FutureProvider.family<List<TicketDetail>, String>((ref, retailerId) {
  return ref.watch(retailerApiProvider).fetchTicketEvents(retailerId);
});

final ticketOrdersProvider = FutureProvider.family<List<TicketOrder>, String>((ref, retailerId) {
  return ref.watch(retailerApiProvider).fetchTicketOrders(retailerId);
});

final marketplaceOrdersProvider = FutureProvider.family<List<MarketplaceOrder>, String>((ref, retailerId) {
  return ref.watch(retailerApiProvider).fetchMarketplaceOrders(retailerId);
});

final counterOrdersProvider = FutureProvider<List<CounterOrder>>((ref) {
  return ref.watch(retailerApiProvider).fetchCounterOrders();
});
