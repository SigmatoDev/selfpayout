import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cart/cart_controller.dart';
import '../../../models/user_models.dart';
import '../marketplace_providers.dart';
import 'product_details_screen.dart';

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  String _search = '';
  final List<String> _productImages = const [
    'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=700&q=80',
    'https://images.unsplash.com/photo-1481931715705-36f5f79f1f3d?auto=format&fit=crop&w=700&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80',
    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=700&q=80',
    'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=700&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=700&q=80',
  ];
  final List<String> _promoImages = const [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=900&q=80',
  ];
  int _promoIndex = 0;
  late final PageController _promoController = PageController(viewportFraction: 0.8);

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(marketplaceProductsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace'),
        actions: [
          IconButton(icon: const Icon(Icons.shopping_bag_outlined), onPressed: () {}),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            AspectRatio(
              aspectRatio: 9 / 12,
              child: Stack(
                children: [
                  PageView.builder(
                    itemCount: _promoImages.length,
                    controller: _promoController,
                    onPageChanged: (index) => setState(() => _promoIndex = index),
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: Image.network(
                            _promoImages[index],
                            fit: BoxFit.cover,
                          ),
                        ),
                      );
                    },
                  ),
                  Positioned(
                    bottom: 12,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_promoImages.length, (index) {
                        final isActive = index == _promoIndex;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          height: 6,
                          width: isActive ? 18 : 6,
                          decoration: BoxDecoration(
                            color: isActive ? Colors.white : Colors.white70,
                            borderRadius: BorderRadius.circular(12),
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Search fast moving products',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) => setState(() => _search = value),
            ),
            const SizedBox(height: 16),
            Text('Fast moving products', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 10),
            productsAsync.when(
              data: (products) {
                final filtered = products.where((product) {
                  if (_search.isEmpty) return true;
                  return product.name.toLowerCase().contains(_search.toLowerCase()) ||
                      product.retailer.shopName.toLowerCase().contains(_search.toLowerCase());
                }).toList();
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filtered.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.86,
                  ),
                  itemBuilder: (context, index) {
                    final product = filtered[index];
                    final imageUrl = _productImages[index % _productImages.length];
                    return InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ProductDetailsScreen(
                              product: product,
                              images: _productImages,
                            ),
                          ),
                        );
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 12,
                              offset: const Offset(0, 6),
                            )
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                              child: Image.network(
                                imageUrl,
                                height: 96,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 6),
                                  Text(
                                    product.retailer.shopName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 11, color: Colors.black54),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Text(
                                        '₹${product.price.toStringAsFixed(0)}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                          color: colorScheme.primary,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      if (product.mrp != null)
                                        Text(
                                          '₹${product.mrp!.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: Colors.black45,
                                            decoration: TextDecoration.lineThrough,
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
            ),
          ],
        ),
      ),
    );
  }
}
