import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../models/models.dart';

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
