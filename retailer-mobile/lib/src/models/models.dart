import 'package:flutter/foundation.dart';

@immutable
class CurrentUser {
  const CurrentUser({
    required this.id,
    required this.name,
    this.retailerId,
  });

  final String id;
  final String name;
  final String? retailerId;

  factory CurrentUser.fromJson(Map<String, dynamic> json) => CurrentUser(
        id: json['id'] as String,
        name: json['name'] as String? ?? 'Retailer',
        retailerId: json['retailerId'] as String?,
      );
}

@immutable
class LoginResult {
  const LoginResult({required this.token, required this.user});

  final String token;
  final CurrentUser user;

  factory LoginResult.fromJson(Map<String, dynamic> json) => LoginResult(
        token: json['token'] as String,
        user: CurrentUser.fromJson(json['user'] as Map<String, dynamic>),
      );
}

enum PaymentMode { cash, upi, card }

extension PaymentModeX on PaymentMode {
  String get apiValue => switch (this) {
        PaymentMode.cash => 'CASH',
        PaymentMode.upi => 'UPI',
        PaymentMode.card => 'CARD',
      };

  String get label => switch (this) {
        PaymentMode.cash => 'Cash',
        PaymentMode.upi => 'UPI',
        PaymentMode.card => 'Card',
      };

  static PaymentMode fromApi(String raw) {
    switch (raw.toUpperCase()) {
      case 'UPI':
        return PaymentMode.upi;
      case 'CARD':
        return PaymentMode.card;
      default:
        return PaymentMode.cash;
    }
  }
}

@immutable
class InventoryItem {
  const InventoryItem({
    required this.id,
    required this.sku,
    required this.name,
    required this.price,
    required this.taxPercentage,
    required this.stockQuantity,
    this.mrp,
    this.unit,
    this.barcode,
  });

  final String id;
  final String sku;
  final String name;
  final double price;
  final double taxPercentage;
  final int stockQuantity;
  final double? mrp;
  final String? unit;
  final String? barcode;

  factory InventoryItem.fromJson(Map<String, dynamic> json) => InventoryItem(
        id: json['id'] as String,
        sku: json['sku'] as String,
        name: json['name'] as String? ?? 'Item',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        taxPercentage: (json['taxPercentage'] as num?)?.toDouble() ?? 0,
        stockQuantity: (json['stockQuantity'] as num?)?.toInt() ?? 0,
        mrp: (json['mrp'] as num?)?.toDouble(),
        unit: json['unit'] as String?,
        barcode: json['barcode'] as String?,
      );
}

class InventoryItemRequest {
  InventoryItemRequest({
    required this.sku,
    required this.name,
    required this.price,
    this.mrp,
    this.taxPercentage = 0,
    this.stockQuantity = 0,
    this.unit = 'pcs',
    this.barcode,
  });

  final String sku;
  final String name;
  final double price;
  final double? mrp;
  final double taxPercentage;
  final int stockQuantity;
  final String unit;
  final String? barcode;

  Map<String, dynamic> toJson(String retailerId) => {
        'retailerId': retailerId,
        'sku': sku,
        'name': name,
        'price': price,
        'mrp': mrp,
        'taxPercentage': taxPercentage,
        'stockQuantity': stockQuantity,
        'unit': unit,
        'barcode': barcode,
      }..removeWhere((key, value) => value == null);
}

@immutable
class BulkUploadResponse {
  const BulkUploadResponse({required this.message, required this.count});

  final String message;
  final int count;

  factory BulkUploadResponse.fromJson(Map<String, dynamic> json) => BulkUploadResponse(
        message: json['message'] as String? ?? 'Uploaded',
        count: (json['count'] as num?)?.toInt() ?? 0,
      );
}

@immutable
class Customer {
  const Customer({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.balanceAmount,
  });

  final String id;
  final String name;
  final String phone;
  final String? email;
  final double balanceAmount;

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
        id: json['id'] as String,
        name: json['name'] as String? ?? 'Customer',
        phone: json['phone'] as String? ?? '',
        email: json['email'] as String?,
        balanceAmount: (json['balanceAmount'] as num?)?.toDouble() ?? 0,
      );
}

class CustomerPayload {
  CustomerPayload({
    required this.name,
    required this.phone,
    this.email,
    this.notes,
  });

  final String name;
  final String phone;
  final String? email;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'email': email,
        'notes': notes,
      }..removeWhere((key, value) => value == null || (value is String && value.isEmpty));
}

class InvoiceItemPayload {
  InvoiceItemPayload({
    required this.sku,
    required this.name,
    required this.quantity,
    required this.price,
    required this.taxPercentage,
  });

  final String sku;
  final String name;
  final int quantity;
  final double price;
  final double taxPercentage;

  Map<String, dynamic> toJson() => {
        'sku': sku,
        'name': name,
        'quantity': quantity,
        'price': price,
        'taxPercentage': taxPercentage,
      };

  factory InvoiceItemPayload.fromJson(Map<String, dynamic> json) => InvoiceItemPayload(
        sku: json['sku'] as String,
        name: json['name'] as String? ?? '',
        quantity: (json['quantity'] as num?)?.toInt() ?? 0,
        price: (json['price'] as num?)?.toDouble() ?? 0,
        taxPercentage: (json['taxPercentage'] as num?)?.toDouble() ?? 0,
      );
}

class CreateInvoicePayload {
  CreateInvoicePayload({
    required this.paymentMode,
    required this.items,
    this.customerPhone,
    this.notes,
  });

  final PaymentMode paymentMode;
  final List<InvoiceItemPayload> items;
  final String? customerPhone;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'paymentMode': paymentMode.apiValue,
        'customerPhone': customerPhone,
        'notes': notes,
        'items': items.map((item) => item.toJson()).toList(),
      }..removeWhere((key, value) => value == null);
}

@immutable
class InvoiceResult {
  const InvoiceResult({required this.id, required this.totalAmount});

  final String id;
  final double totalAmount;

  factory InvoiceResult.fromJson(Map<String, dynamic> json) => InvoiceResult(
        id: json['id'] as String,
        totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      );
}

@immutable
class SalesSummary {
  const SalesSummary({required this.total, required this.tax, required this.byPaymentMode});

  final double total;
  final double tax;
  final Map<String, double> byPaymentMode;

  factory SalesSummary.fromJson(Map<String, dynamic> json) {
    final raw = json['byPaymentMode'] as Map<String, dynamic>? ?? {};
    final mapped = raw.map((key, value) => MapEntry(key, (value as num?)?.toDouble() ?? 0));
    return SalesSummary(
      total: (json['total'] as num?)?.toDouble() ?? 0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0,
      byPaymentMode: mapped,
    );
  }
}

@immutable
class LedgerEntry {
  const LedgerEntry({
    required this.id,
    required this.name,
    required this.phone,
    required this.balanceAmount,
  });

  final String id;
  final String name;
  final String phone;
  final double balanceAmount;

  factory LedgerEntry.fromJson(Map<String, dynamic> json) => LedgerEntry(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        balanceAmount: (json['balanceAmount'] as num?)?.toDouble() ?? 0,
      );
}

enum SessionStatus { submitted, paid, approved }

extension SessionStatusX on SessionStatus {
  String get apiValue => switch (this) {
        SessionStatus.submitted => 'SUBMITTED',
        SessionStatus.paid => 'PAID',
        SessionStatus.approved => 'APPROVED',
      };

  String get label => apiValue.toLowerCase();

  static SessionStatus fromApi(String raw) {
    switch (raw.toUpperCase()) {
      case 'PAID':
        return SessionStatus.paid;
      case 'APPROVED':
        return SessionStatus.approved;
      default:
        return SessionStatus.submitted;
    }
  }
}

@immutable
class CheckoutItem {
  const CheckoutItem({
    required this.id,
    required this.sku,
    required this.name,
    required this.quantity,
    required this.price,
    required this.taxPercentage,
  });

  final String id;
  final String sku;
  final String name;
  final int quantity;
  final double price;
  final double taxPercentage;

  factory CheckoutItem.fromJson(Map<String, dynamic> json) => CheckoutItem(
        id: json['id'] as String,
        sku: json['sku'] as String? ?? '',
        name: json['name'] as String? ?? '',
        quantity: (json['quantity'] as num?)?.toInt() ?? 0,
        price: (json['price'] as num?)?.toDouble() ?? 0,
        taxPercentage: (json['taxPercentage'] as num?)?.toDouble() ?? 0,
      );
}

@immutable
class CheckoutInvoice {
  const CheckoutInvoice({
    required this.id,
    required this.totalAmount,
    required this.paymentMode,
    required this.createdAt,
  });

  final String id;
  final double totalAmount;
  final PaymentMode paymentMode;
  final DateTime createdAt;

  factory CheckoutInvoice.fromJson(Map<String, dynamic> json) => CheckoutInvoice(
        id: json['id'] as String,
        totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
        paymentMode: PaymentModeX.fromApi(json['paymentMode'] as String? ?? 'CASH'),
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      );
}

@immutable
class CheckoutSession {
  const CheckoutSession({
    required this.id,
    required this.retailerId,
    required this.status,
    required this.securityCode,
    required this.totalAmount,
    required this.createdAt,
    required this.storeType,
    required this.items,
    this.customerPhone,
    this.context,
    this.invoice,
  });

  final String id;
  final String retailerId;
  final SessionStatus status;
  final String securityCode;
  final double totalAmount;
  final DateTime createdAt;
  final String storeType;
  final String? customerPhone;
  final Map<String, dynamic>? context;
  final List<CheckoutItem> items;
  final CheckoutInvoice? invoice;

  factory CheckoutSession.fromJson(Map<String, dynamic> json) => CheckoutSession(
        id: json['id'] as String,
        retailerId: json['retailerId'] as String? ?? '',
        status: SessionStatusX.fromApi(json['status'] as String? ?? 'SUBMITTED'),
        securityCode: json['securityCode'] as String? ?? '',
        totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
        storeType: json['storeType'] as String? ?? 'KIRANA',
        customerPhone: json['customerPhone'] as String?,
        context: json['context'] as Map<String, dynamic>?,
        items: (json['items'] as List<dynamic>? ?? [])
            .map((item) => CheckoutItem.fromJson(item as Map<String, dynamic>))
            .toList(),
        invoice: json['invoice'] != null
            ? CheckoutInvoice.fromJson(json['invoice'] as Map<String, dynamic>)
            : null,
      );
}

@immutable
class DocumentUpload {
  const DocumentUpload({
    required this.fileName,
    required this.contentType,
    required this.data,
  });

  final String fileName;
  final String contentType;
  final String data;

  Map<String, dynamic> toJson() => {
        'fileName': fileName,
        'contentType': contentType,
        'data': data,
      };
}

class SignupPayload {
  SignupPayload({
    required this.ownerName,
    required this.shopName,
    required this.contactEmail,
    required this.contactPhone,
    required this.address,
    required this.gstEnabled,
    required this.languagePreference,
    required this.aadharNumber,
    required this.panNumber,
    this.gstNumber,
    this.documents = const <String, DocumentUpload>{},
  });

  final String ownerName;
  final String shopName;
  final String contactEmail;
  final String contactPhone;
  final String address;
  final bool gstEnabled;
  final String languagePreference;
  final String? gstNumber;
  final String aadharNumber;
  final String panNumber;
  final Map<String, DocumentUpload> documents;

  Map<String, dynamic> toJson() => {
        'ownerName': ownerName,
        'shopName': shopName,
        'contactEmail': contactEmail,
        'contactPhone': contactPhone,
        'address': address,
        'gstEnabled': gstEnabled,
        'gstNumber': gstEnabled ? gstNumber : null,
        'languagePreference': languagePreference,
        'aadharNumber': aadharNumber,
        'panNumber': panNumber,
        'documents': documents.map((key, value) => MapEntry(key, value.toJson())),
      }..removeWhere((key, value) => value == null);
}

class OfflineInvoicePayload {
  OfflineInvoicePayload({
    required this.retailerId,
    required this.paymentMode,
    required this.items,
    this.customerPhone,
    this.notes,
  });

  final String retailerId;
  final PaymentMode paymentMode;
  final List<InvoiceItemPayload> items;
  final String? customerPhone;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'retailerId': retailerId,
        'paymentMode': paymentMode.apiValue,
        'customerPhone': customerPhone,
        'notes': notes,
        'items': items.map((item) => item.toJson()).toList(),
      }..removeWhere((key, value) => value == null);

  factory OfflineInvoicePayload.fromJson(Map<String, dynamic> json) => OfflineInvoicePayload(
        retailerId: json['retailerId'] as String? ?? '',
        paymentMode: PaymentModeX.fromApi(json['paymentMode'] as String? ?? 'CASH'),
        customerPhone: json['customerPhone'] as String?,
        notes: json['notes'] as String?,
        items: (json['items'] as List<dynamic>? ?? [])
            .map((item) => InvoiceItemPayload.fromJson(item as Map<String, dynamic>))
            .toList(),
      );

  CreateInvoicePayload toCreatePayload() => CreateInvoicePayload(
        paymentMode: paymentMode,
        customerPhone: customerPhone,
        notes: notes,
        items: items,
      );
}
