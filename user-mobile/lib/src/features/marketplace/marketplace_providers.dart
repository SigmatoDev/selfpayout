import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../models/user_models.dart';

const bool _useMockMarketplace = false;

final marketplaceStoresProvider = FutureProvider<List<StoreSummary>>((ref) async {
  if (_useMockMarketplace) {
    return _mockStores;
  }
  return ref.watch(userApiProvider).fetchStores();
});

final marketplaceCategoriesProvider = FutureProvider<List<String>>((ref) async {
  if (_useMockMarketplace) {
    return _mockCategories;
  }
  return ref.watch(userApiProvider).fetchCategories();
});

final marketplaceProductsProvider = FutureProvider<List<MarketplaceProduct>>((ref) async {
  if (_useMockMarketplace) {
    return _mockProducts;
  }
  return ref.watch(userApiProvider).fetchProducts();
});

const _mockCategories = [
  'Groceries',
  'Fresh',
  'Beverages',
  'Snacks',
  'Household',
  'Personal care',
];

final _mockStores = [
  StoreSummary(id: 'kirana-001', shopName: 'Green Basket Kirana', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-002', shopName: 'City Daily Mart', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-003', shopName: 'Fresh Lane', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-004', shopName: 'Morning Harvest', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-005', shopName: 'Neighborhood Cart', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-006', shopName: 'Bright Basket', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-007', shopName: 'Cornerstone Grocers', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-008', shopName: 'Everyday Essentials', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-009', shopName: 'Sunrise Kirana', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-010', shopName: 'Metro Provisioning', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-011', shopName: 'Quick Cart', storeType: 'KIRANA'),
  StoreSummary(id: 'kirana-012', shopName: 'Fresh & Fine', storeType: 'KIRANA'),
  StoreSummary(id: 'rest-001', shopName: 'Spice Route', storeType: 'RESTAURANT'),
  StoreSummary(id: 'rest-002', shopName: 'Bowl & Co.', storeType: 'RESTAURANT'),
  StoreSummary(id: 'rest-003', shopName: 'Tandoor Tales', storeType: 'RESTAURANT'),
];

final _mockProducts = [
  MarketplaceProduct(
    id: 'prod-001',
    sku: 'GR001',
    name: 'Organic Bananas',
    price: 58,
    mrp: 72,
    category: 'Fresh',
    retailer: _mockStores[0],
  ),
  MarketplaceProduct(
    id: 'prod-002',
    sku: 'GR002',
    name: 'A2 Milk 1L',
    price: 72,
    mrp: 80,
    category: 'Beverages',
    retailer: _mockStores[1],
  ),
  MarketplaceProduct(
    id: 'prod-003',
    sku: 'GR003',
    name: 'Brown Bread',
    price: 38,
    mrp: 45,
    category: 'Groceries',
    retailer: _mockStores[2],
  ),
  MarketplaceProduct(
    id: 'prod-004',
    sku: 'SN001',
    name: 'Masala Chips',
    price: 25,
    mrp: 30,
    category: 'Snacks',
    retailer: _mockStores[0],
  ),
  MarketplaceProduct(
    id: 'prod-005',
    sku: 'HC001',
    name: 'Dishwash Liquid',
    price: 110,
    mrp: 135,
    category: 'Household',
    retailer: _mockStores[1],
  ),
  MarketplaceProduct(
    id: 'prod-006',
    sku: 'PC001',
    name: 'Aloe Face Wash',
    price: 160,
    mrp: 195,
    category: 'Personal care',
    retailer: _mockStores[2],
  ),
  MarketplaceProduct(
    id: 'prod-007',
    sku: 'GR004',
    name: 'Toor Dal 1kg',
    price: 118,
    mrp: 140,
    category: 'Groceries',
    retailer: _mockStores[3],
  ),
  MarketplaceProduct(
    id: 'prod-008',
    sku: 'GR005',
    name: 'Paneer 200g',
    price: 84,
    mrp: 95,
    category: 'Fresh',
    retailer: _mockStores[4],
  ),
  MarketplaceProduct(
    id: 'prod-009',
    sku: 'BV001',
    name: 'Cold Coffee 250ml',
    price: 55,
    mrp: 65,
    category: 'Beverages',
    retailer: _mockStores[5],
  ),
  MarketplaceProduct(
    id: 'prod-010',
    sku: 'SN002',
    name: 'Roasted Peanuts',
    price: 42,
    mrp: 55,
    category: 'Snacks',
    retailer: _mockStores[6],
  ),
  MarketplaceProduct(
    id: 'prod-011',
    sku: 'HC002',
    name: 'Floor Cleaner 1L',
    price: 145,
    mrp: 175,
    category: 'Household',
    retailer: _mockStores[7],
  ),
  MarketplaceProduct(
    id: 'prod-012',
    sku: 'PC002',
    name: 'Herbal Shampoo 180ml',
    price: 138,
    mrp: 160,
    category: 'Personal care',
    retailer: _mockStores[8],
  ),
  MarketplaceProduct(
    id: 'prod-013',
    sku: 'GR006',
    name: 'Basmati Rice 1kg',
    price: 132,
    mrp: 155,
    category: 'Groceries',
    retailer: _mockStores[9],
  ),
  MarketplaceProduct(
    id: 'prod-014',
    sku: 'FR001',
    name: 'Tomato 1kg',
    price: 48,
    mrp: 60,
    category: 'Fresh',
    retailer: _mockStores[10],
  ),
  MarketplaceProduct(
    id: 'prod-015',
    sku: 'BV002',
    name: 'Lemon Soda 500ml',
    price: 38,
    mrp: 45,
    category: 'Beverages',
    retailer: _mockStores[11],
  ),
  MarketplaceProduct(
    id: 'prod-016',
    sku: 'SN003',
    name: 'Millet Cookies',
    price: 65,
    mrp: 80,
    category: 'Snacks',
    retailer: _mockStores[3],
  ),
  MarketplaceProduct(
    id: 'prod-017',
    sku: 'HC003',
    name: 'Laundry Detergent 1kg',
    price: 170,
    mrp: 205,
    category: 'Household',
    retailer: _mockStores[4],
  ),
  MarketplaceProduct(
    id: 'prod-018',
    sku: 'PC003',
    name: 'Toothpaste Twin Pack',
    price: 96,
    mrp: 120,
    category: 'Personal care',
    retailer: _mockStores[5],
  ),
  MarketplaceProduct(
    id: 'prod-019',
    sku: 'GR007',
    name: 'Moong Dal 1kg',
    price: 125,
    mrp: 150,
    category: 'Groceries',
    retailer: _mockStores[6],
  ),
  MarketplaceProduct(
    id: 'prod-020',
    sku: 'FR002',
    name: 'Apple Pack 4 pcs',
    price: 140,
    mrp: 170,
    category: 'Fresh',
    retailer: _mockStores[7],
  ),
  MarketplaceProduct(
    id: 'prod-021',
    sku: 'BV003',
    name: 'Tender Coconut',
    price: 52,
    mrp: 60,
    category: 'Beverages',
    retailer: _mockStores[8],
  ),
  MarketplaceProduct(
    id: 'prod-022',
    sku: 'SN004',
    name: 'Trail Mix 200g',
    price: 110,
    mrp: 135,
    category: 'Snacks',
    retailer: _mockStores[9],
  ),
  MarketplaceProduct(
    id: 'prod-023',
    sku: 'HC004',
    name: 'Garbage Bags 30 pcs',
    price: 85,
    mrp: 105,
    category: 'Household',
    retailer: _mockStores[10],
  ),
  MarketplaceProduct(
    id: 'prod-024',
    sku: 'PC004',
    name: 'Body Lotion 200ml',
    price: 155,
    mrp: 190,
    category: 'Personal care',
    retailer: _mockStores[11],
  ),
];
