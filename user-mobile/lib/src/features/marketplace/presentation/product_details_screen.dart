import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cart/cart_controller.dart';
import '../../../models/user_models.dart';

class ProductDetailsScreen extends ConsumerStatefulWidget {
  const ProductDetailsScreen({super.key, required this.product, required this.images});

  final MarketplaceProduct product;
  final List<String> images;

  @override
  ConsumerState<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends ConsumerState<ProductDetailsScreen> {
  int _currentIndex = 0;
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final colorScheme = Theme.of(context).colorScheme;
    final images = widget.images;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Product details'),
        backgroundColor: Colors.white,
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Color(0x14000000),
                blurRadius: 12,
                offset: Offset(0, -4),
              )
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    ref
                        .read(cartControllerProvider.notifier)
                        .addProduct(product, source: CartSource.marketplace, quantity: _quantity);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Added to cart')),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Add to cart'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    ref
                        .read(cartControllerProvider.notifier)
                        .addProduct(product, source: CartSource.marketplace, quantity: _quantity);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Added to cart')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Buy now'),
                ),
              ),
            ],
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          SizedBox(
            height: 260,
            child: Stack(
              children: [
                PageView.builder(
                  itemCount: images.length,
                  controller: PageController(viewportFraction: 0.8),
                  onPageChanged: (index) => setState(() => _currentIndex = index),
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.network(
                          images[index],
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
                    children: List.generate(images.length, (index) {
                      final isActive = index == _currentIndex;
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
          Text(product.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(product.retailer.shopName, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '₹${product.price.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 8),
              if (product.mrp != null)
                Text(
                  '₹${product.mrp!.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.black45,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              const SizedBox(width: 8),
              const Text('★ 4.6', style: TextStyle(fontSize: 12, color: Colors.black54)),
            ],
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Select quantity',
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: _quantity == 1 ? null : () => setState(() => _quantity -= 1),
                ),
                Text(_quantity.toString(), style: const TextStyle(fontWeight: FontWeight.w700)),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  onPressed: () => setState(() => _quantity += 1),
                ),
                const Spacer(),
                Text('Subtotal ₹${(product.price * _quantity).toStringAsFixed(0)}',
                    style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'About this item',
            child: const Text(
              'Freshly sourced, quality-checked, and packed with care. Perfect for daily essentials and quick restocks.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Delivery & offers',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Free delivery above ₹299', style: TextStyle(fontSize: 12)),
                SizedBox(height: 6),
                Text('Packed within 30 minutes', style: TextStyle(fontSize: 12)),
                SizedBox(height: 6),
                Text('Best before 48 hours', style: TextStyle(fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Alternate products',
            child: SizedBox(
              height: 160,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  return Container(
                    width: 140,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: Image.network(
                            images[index],
                            height: 90,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Recommended pick', style: const TextStyle(fontSize: 11, color: Colors.black54)),
                              const SizedBox(height: 4),
                              Text(
                                widget.product.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 4),
                              Text('₹${widget.product.price.toStringAsFixed(0)}',
                                  style: const TextStyle(fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}
