class ConsumerProfile {
  ConsumerProfile({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    this.avatarUrl,
    this.address,
    required this.notificationsEnabled,
  });

  final String id;
  final String phone;
  final String? name;
  final String? email;
  final String? avatarUrl;
  final String? address;
  final bool notificationsEnabled;

  factory ConsumerProfile.fromJson(Map<String, dynamic> json) => ConsumerProfile(
        id: json['id'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        name: json['name'] as String?,
        email: json['email'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        address: json['address'] as String?,
        notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      );

  ConsumerProfile copyWith({
    String? name,
    String? email,
    String? avatarUrl,
    String? address,
    bool? notificationsEnabled,
  }) =>
      ConsumerProfile(
        id: id,
        phone: phone,
        name: name ?? this.name,
        email: email ?? this.email,
        avatarUrl: avatarUrl ?? this.avatarUrl,
        address: address ?? this.address,
        notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      );
}

class AuthResult {
  AuthResult({required this.token, required this.consumer});

  final String token;
  final ConsumerProfile consumer;

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
        token: json['token'] as String? ?? '',
        consumer: ConsumerProfile.fromJson(json['consumer'] as Map<String, dynamic>? ?? {}),
      );
}

class StoreSummary {
  StoreSummary({
    required this.id,
    required this.shopName,
    required this.storeType,
  });

  final String id;
  final String shopName;
  final String storeType;

  factory StoreSummary.fromJson(Map<String, dynamic> json) => StoreSummary(
        id: json['id'] as String? ?? '',
        shopName: json['shopName'] as String? ?? '',
        storeType: json['storeType'] as String? ?? 'KIRANA',
      );
}

class MarketplaceProduct {
  MarketplaceProduct({
    required this.id,
    required this.sku,
    required this.name,
    required this.price,
    this.mrp,
    this.category,
    required this.retailer,
  });

  final String id;
  final String sku;
  final String name;
  final double price;
  final double? mrp;
  final String? category;
  final StoreSummary retailer;

  factory MarketplaceProduct.fromJson(Map<String, dynamic> json) => MarketplaceProduct(
        id: json['id'] as String? ?? '',
        sku: json['sku'] as String? ?? '',
        name: json['name'] as String? ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        mrp: (json['mrp'] as num?)?.toDouble(),
        category: json['category'] as String?,
        retailer: StoreSummary.fromJson(json['retailer'] as Map<String, dynamic>? ?? {}),
      );
}

class TableInfo {
  TableInfo({
    required this.id,
    required this.retailerId,
    required this.label,
    required this.capacity,
    required this.status,
  });

  final String id;
  final String retailerId;
  final String label;
  final int capacity;
  final String status;

  factory TableInfo.fromJson(Map<String, dynamic> json) => TableInfo(
        id: json['id'] as String? ?? '',
        retailerId: json['retailerId'] as String? ?? '',
        label: json['label'] as String? ?? '',
        capacity: json['capacity'] as int? ?? 0,
        status: json['status'] as String? ?? 'AVAILABLE',
      );
}

class MenuResponse {
  MenuResponse({required this.categories});

  final List<MenuCategory> categories;

  factory MenuResponse.fromJson(Map<String, dynamic> json) => MenuResponse(
        categories: (json['categories'] as List<dynamic>? ?? [])
            .map((item) => MenuCategory.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
}

class MenuCategory {
  MenuCategory({required this.name, required this.items, this.description});

  final String name;
  final String? description;
  final List<MenuItem> items;

  factory MenuCategory.fromJson(Map<String, dynamic> json) => MenuCategory(
        name: json['name'] as String? ?? '',
        description: json['description'] as String?,
        items: (json['items'] as List<dynamic>? ?? [])
            .map((item) => MenuItem.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
}

class MenuItem {
  MenuItem({
    required this.name,
    required this.sku,
    required this.price,
    required this.taxPercentage,
    required this.isAvailable,
  });

  final String name;
  final String sku;
  final double price;
  final double taxPercentage;
  final bool isAvailable;

  factory MenuItem.fromJson(Map<String, dynamic> json) => MenuItem(
        name: json['name'] as String? ?? '',
        sku: json['sku'] as String? ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        taxPercentage: (json['taxPercentage'] as num?)?.toDouble() ?? 0,
        isAvailable: json['isAvailable'] as bool? ?? true,
      );
}

class CheckoutSession {
  CheckoutSession({required this.id, required this.securityCode});

  final String id;
  final String securityCode;

  factory CheckoutSession.fromJson(Map<String, dynamic> json) => CheckoutSession(
        id: json['id'] as String? ?? '',
        securityCode: json['securityCode'] as String? ?? '',
      );
}

