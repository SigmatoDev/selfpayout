import '../../models/user_models.dart';
import '../../features/ticketing/presentation/ticket_models.dart';
import 'api_client.dart';

class UserApi {
  UserApi(this._client);

  final ApiClient _client;

  Future<void> requestOtp(String phone) {
    return _client.postVoid(
      'consumers/auth/request-otp',
      body: {'phone': phone},
    );
  }

  Future<AuthResult> verifyOtp(String phone, String otp) {
    return _client.post<AuthResult>(
      'consumers/auth/verify-otp',
      body: {'phone': phone, 'otp': otp},
      parser: (data) => AuthResult.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<ConsumerProfile> fetchProfile() {
    return _client.get<ConsumerProfile>(
      'consumers/me',
      (data) => ConsumerProfile.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<ConsumerProfile> updateProfile(ConsumerProfile profile) {
    return _client.patch<ConsumerProfile>(
      'consumers/me',
      body: {
        'name': profile.name,
        'email': profile.email,
        'avatarUrl': profile.avatarUrl,
        'address': profile.address,
        'notificationsEnabled': profile.notificationsEnabled,
      }..removeWhere((key, value) => value == null || (value is String && value.trim().isEmpty)),
      parser: (data) => ConsumerProfile.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<StoreSummary>> fetchStores() {
    return _client.get<List<StoreSummary>>(
      'retailers/public',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => StoreSummary.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<List<String>> fetchCategories({String? retailerId}) {
    return _client.get<List<String>>(
      'inventory/public/categories',
      (data) => (data as List<dynamic>? ?? []).map((item) => item.toString()).toList(),
      queryParameters: retailerId == null ? null : {'retailerId': retailerId},
    );
  }

  Future<List<MarketplaceProduct>> fetchProducts({
    String? retailerId,
    String? search,
    String? category,
  }) {
    final params = <String, dynamic>{};
    if (retailerId != null) params['retailerId'] = retailerId;
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (category != null && category.isNotEmpty) params['category'] = category;
    return _client.get<List<MarketplaceProduct>>(
      'inventory/public',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => MarketplaceProduct.fromJson(item as Map<String, dynamic>))
          .toList(),
      queryParameters: params.isEmpty ? null : params,
    );
  }

  Future<List<TableInfo>> fetchPublicTables(String retailerId) {
    return _client.get<List<TableInfo>>(
      'restaurants/$retailerId/public-tables',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => TableInfo.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<MenuResponse> fetchMenu(String retailerId) {
    return _client.get<MenuResponse>(
      'restaurants/$retailerId/menu',
      (data) => MenuResponse.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<CheckoutSession> startSession({
    required String retailerCode,
    required String storeType,
    String? customerPhone,
    bool? groupOrder,
    Map<String, String>? context,
  }) {
    return _client.post<CheckoutSession>(
      'self-checkout/sessions',
      body: {
        'retailerCode': retailerCode,
        'storeType': storeType,
        'customerPhone': customerPhone,
        'groupOrder': groupOrder,
        'context': context,
      }..removeWhere((key, value) => value == null),
      parser: (data) => CheckoutSession.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<TicketDetail>> fetchTicketEvents({String? retailerId, String? search}) {
    final params = <String, dynamic>{};
    if (retailerId != null && retailerId.isNotEmpty) params['retailerId'] = retailerId;
    if (search != null && search.isNotEmpty) params['search'] = search;
    return _client.get<List<TicketDetail>>(
      'ticketing/events',
      (data) => (data as List<dynamic>? ?? [])
          .map((item) => TicketDetail.fromJson(item as Map<String, dynamic>))
          .toList(),
      queryParameters: params.isEmpty ? null : params,
    );
  }

  Future<TicketDetail> fetchTicketEvent(String eventId) {
    return _client.get<TicketDetail>(
      'ticketing/events/$eventId',
      (data) => TicketDetail.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> createTicketOrder({
    required String eventId,
    required String buyerPhone,
    String? buyerName,
    required List<Map<String, dynamic>> tiers,
  }) {
    return _client.postVoid(
      'ticketing/orders',
      body: {
        'eventId': eventId,
        'buyerPhone': buyerPhone,
        'buyerName': buyerName,
        'tiers': tiers
      }..removeWhere((key, value) => value == null),
    );
  }

  Future<void> createMarketplaceOrder({
    required String retailerId,
    required String buyerPhone,
    String? buyerName,
    String? deliveryAddress,
    required List<Map<String, dynamic>> items,
  }) {
    return _client.postVoid(
      'marketplace/orders',
      body: {
        'retailerId': retailerId,
        'buyerPhone': buyerPhone,
        'buyerName': buyerName,
        'deliveryAddress': deliveryAddress,
        'items': items,
      }..removeWhere((key, value) => value == null),
    );
  }
}
