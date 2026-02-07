import '../../models/models.dart';
import 'api_client.dart';
import '../../features/ticketing/presentation/ticket_models.dart';
import '../../features/ticketing/presentation/ticket_order_detail_screen.dart';
import '../../features/orders/presentation/marketplace_order_detail_screen.dart';
import '../../features/orders/presentation/counter_order_models.dart';

class RetailerApi {
  RetailerApi(this._client);

  final ApiClient _client;

  Future<LoginResult> loginWithOtp(String phone, String otp) {
    return _client.post<LoginResult>(
      'auth/login-otp',
      body: {
        'phone': phone,
        'otp': otp,
        'role': 'RETAILER_ADMIN',
      },
      parser: (data) => LoginResult.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<CurrentUser> fetchCurrentUser() {
    return _client.get<CurrentUser>(
      'auth/me',
      (data) => CurrentUser.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<InventoryItem>> fetchInventory() {
    return _client.get<List<InventoryItem>>(
      'inventory',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => InventoryItem.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<InventoryItem> createInventoryItem(String retailerId, InventoryItemRequest request) {
    return _client.post<InventoryItem>(
      'inventory',
      body: request.toJson(retailerId),
      parser: (data) => InventoryItem.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<BulkUploadResponse> uploadInventoryBulk(
    String retailerId,
    List<InventoryItemRequest> rows,
  ) {
    return _client.post<BulkUploadResponse>(
      'inventory/bulk',
      body: {
        'retailerId': retailerId,
        'items': rows.map((row) => row.toJson(retailerId)).toList(),
      },
      parser: (data) => BulkUploadResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<Customer>> fetchCustomers() {
    return _client.get<List<Customer>>(
      'customers',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => Customer.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<Customer> addCustomer(CustomerPayload payload) {
    return _client.post<Customer>(
      'customers',
      body: payload.toJson(),
      parser: (data) => Customer.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<CustomerInvoice>> fetchCustomerHistory(String customerId) {
    return _client.get<List<CustomerInvoice>>(
      'customers/$customerId/history',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => CustomerInvoice.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<InvoiceResult> createInvoice(CreateInvoicePayload payload) {
    return _client.post<InvoiceResult>(
      'receipts',
      body: payload.toJson(),
      parser: (data) {
        if (data is Map<String, dynamic> && data['invoice'] is Map<String, dynamic>) {
          return InvoiceResult.fromJson(data['invoice'] as Map<String, dynamic>);
        }
        return InvoiceResult.fromJson(data as Map<String, dynamic>);
      },
    );
  }

  Future<SalesSummary?> fetchSalesSummary() {
    return _client.get<SalesSummary?>(
      'sales/summary',
      (data) => data == null ? null : SalesSummary.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<LedgerEntry>> fetchLedger() {
    return _client.get<List<LedgerEntry>>(
      'sales/ledger',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => LedgerEntry.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<List<CheckoutSession>> fetchSelfCheckoutSessions(SessionStatus status) {
    return _client.get<List<CheckoutSession>>(
      'self-checkout/sessions',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => CheckoutSession.fromJson(item as Map<String, dynamic>))
          .toList(),
      queryParameters: {'status': status.apiValue},
    );
  }

  Future<void> markSessionPaid(String sessionId) {
    return _client.postVoid(
      'self-checkout/sessions/$sessionId/mark-payment',
      body: {'paymentMode': 'UPI'},
    );
  }

  Future<void> verifySession(String sessionId) {
    return _client.postVoid(
      'self-checkout/sessions/$sessionId/verify',
      body: {'guardId': 'STORE'},
    );
  }

  Future<MenuResponse> fetchRestaurantMenu(String retailerId) {
    return _client.get<MenuResponse>(
      'restaurants/$retailerId/menu',
      (data) => MenuResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<MenuResponse> saveRestaurantMenu(String retailerId, Map<String, dynamic> payload) {
    return _client.post<MenuResponse>(
      'restaurants/$retailerId/menu',
      body: payload,
      parser: (data) => MenuResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<TableInfo>> fetchTables(String retailerId) {
    return _client.get<List<TableInfo>>(
      'restaurants/$retailerId/tables',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => TableInfo.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<TableInfo> upsertTable(String retailerId, {required String label, required int capacity}) {
    return _client.post<TableInfo>(
      'restaurants/$retailerId/tables',
      body: {'label': label, 'capacity': capacity},
      parser: (data) => TableInfo.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> deleteTable(String retailerId, String tableId) {
    return _client.deleteVoid('restaurants/$retailerId/tables/$tableId');
  }

  Future<List<PaymentInvoice>> fetchInvoices(String retailerId) {
    return _client.get<List<PaymentInvoice>>(
      'receipts',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => PaymentInvoice.fromJson(item as Map<String, dynamic>))
          .toList(),
      queryParameters: {'retailerId': retailerId},
    );
  }

  Future<void> submitSignup(SignupPayload payload) {
    return _client.postVoid('retailers/signup', body: payload.toJson());
  }

  Future<List<TicketDetail>> fetchTicketEvents(String retailerId) {
    return _client.get<List<TicketDetail>>(
      'ticketing/retailers/$retailerId/events',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => TicketDetail.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<TicketDetail> fetchTicketEvent(String eventId) {
    return _client.get<TicketDetail>(
      'ticketing/events/$eventId',
      (data) => TicketDetail.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<TicketOrder>> fetchTicketOrders(String retailerId) {
    return _client.get<List<TicketOrder>>(
      'ticketing/retailers/$retailerId/orders',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => TicketOrder.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<List<MarketplaceOrder>> fetchMarketplaceOrders(String retailerId) {
    return _client.get<List<MarketplaceOrder>>(
      'marketplace/retailers/$retailerId/orders',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => MarketplaceOrder.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<MarketplaceOrder> updateMarketplaceOrderStatus(String retailerId, String orderId, String status) {
    return _client.patch<MarketplaceOrder>(
      'marketplace/retailers/$retailerId/orders/$orderId/status',
      body: {'status': status},
      parser: (data) => MarketplaceOrder.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<CounterOrder>> fetchCounterOrders() {
    return _client.get<List<CounterOrder>>(
      'counter/orders',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => CounterOrder.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<CounterOrder> createCounterOrder(Map<String, dynamic> payload) {
    return _client.post<CounterOrder>(
      'counter/orders',
      body: payload,
      parser: (data) => CounterOrder.fromJson(data as Map<String, dynamic>),
    );
  }
}
