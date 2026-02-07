import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../marketplace/marketplace_providers.dart';
import '../../marketplace/presentation/marketplace_screen.dart';
import '../../marketplace/presentation/store_detail_screen.dart';
import '../../marketplace/presentation/self_billing_stores_screen.dart';
import '../../marketplace/presentation/self_ordering_stores_screen.dart';
import '../../auth/controller/auth_controller.dart';
import '../../profile/presentation/profile_screen.dart';
import '../../ticketing/presentation/self_ticketing_screen.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../models/user_models.dart';

final trendingCategoriesProvider = StateProvider<String?>((ref) => null);

class _PendingInvoice {
  const _PendingInvoice({
    required this.id,
    required this.storeName,
    required this.items,
    required this.total,
  });

  final String id;
  final String storeName;
  final List<Map<String, dynamic>> items;
  final double total;
}

final pendingInvoiceProvider = StateProvider<_PendingInvoice?>(
  (ref) => const _PendingInvoice(
    id: 'inv-1001',
    storeName: 'Green Basket Kirana',
    items: [
      {'name': 'Organic Bananas', 'qty': 2, 'price': 58},
      {'name': 'Masala Chips', 'qty': 1, 'price': 25},
      {'name': 'A2 Milk 1L', 'qty': 1, 'price': 72},
    ],
    total: 213,
  ),
);

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(marketplaceProductsProvider);
    final storesAsync = ref.watch(marketplaceStoresProvider);
    final profile = ref.watch(authControllerProvider).valueOrNull;
    final selectedCategory = ref.watch(trendingCategoriesProvider);
    final pendingInvoice = ref.watch(pendingInvoiceProvider);
    final colorScheme = Theme.of(context).colorScheme;
    const trendingCategories = [
      {'label': 'Groceries', 'icon': Icons.shopping_bag_outlined},
      {'label': 'Fresh', 'icon': Icons.local_florist_outlined},
      {'label': 'Beverages', 'icon': Icons.local_drink_outlined},
      {'label': 'Snacks', 'icon': Icons.cookie_outlined},
      {'label': 'Household', 'icon': Icons.home_outlined},
      {'label': 'Personal care', 'icon': Icons.spa_outlined},
    ];
    const storeThumbnails = [
      'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg?auto=compress&cs=tinysrgb&w=600',
    ];

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: 300,
          backgroundColor: colorScheme.primary,
          elevation: 0,
          automaticallyImplyLeading: false,
          flexibleSpace: LayoutBuilder(
            builder: (context, constraints) {
              final topPadding = MediaQuery.of(context).padding.top;
              final maxHeight = 300 + topPadding;
              final minHeight = kToolbarHeight + topPadding;
              final currentHeight = constraints.biggest.height;
              final t = ((currentHeight - minHeight) / (maxHeight - minHeight)).clamp(0.0, 1.0);

              return Container(
                color: colorScheme.primary,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.asset('assets/bg/bg.png', fit: BoxFit.cover),
                    Container(color: colorScheme.primary.withOpacity(0.55)),
                    SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                        child: Transform.translate(
                          offset: Offset(0, -24 * (1 - t)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Opacity(
                                opacity: 0.6 + (0.4 * t),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _LocationLine(
                                      locationName: 'Home',
                                      address: '700 3rd cross art street, 1st flo...',
                                      showAddress: t > 0.35,
                                    ),
                                    Row(
                                      children: [
                                        IconButton(
                                          onPressed: () {},
                                          icon: const Icon(Icons.notifications_none, color: Colors.white),
                                        ),
                                        InkWell(
                                          borderRadius: BorderRadius.circular(18),
                                          onTap: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(builder: (_) => const ProfileScreen()),
                                            );
                                          },
                                          child: CircleAvatar(
                                            radius: 18,
                                            backgroundColor: Colors.white.withOpacity(0.2),
                                            backgroundImage: profile?.avatarUrl?.isNotEmpty == true
                                                ? NetworkImage(profile!.avatarUrl!)
                                                : null,
                                            child: profile?.avatarUrl?.isNotEmpty == true
                                                ? null
                                                : const Icon(Icons.person_outline, color: Colors.white),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (t > 0.05)
                                Opacity(
                                  opacity: t,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: const [
                                      SizedBox(height: 4),
                                      _SearchBarTicker(
                                        terms: ['dosa', 'groceries', 'fresh fruits', 'snacks', 'cold drinks'],
                                      ),
                                    ],
                                  ),
                                ),
                              const Spacer(),
                              if (t > 0.05)
                                Opacity(
                                  opacity: t,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      LayoutBuilder(
                                        builder: (context, constraints) => SizedBox(
                                          width: constraints.maxWidth * 0.6,
                                          child: RichText(
                                            textAlign: TextAlign.left,
                                            text: TextSpan(
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .headlineSmall
                                                  ?.copyWith(color: Colors.white),
                                              children: const [
                                                TextSpan(text: 'All the aisles you love, '),
                                                TextSpan(
                                                  text: 'right in your pocket.',
                                                  style: TextStyle(fontWeight: FontWeight.w700),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      SizedBox(
                                        width: 190,
                                        child: AppGradientButton(
                                          onPressed: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(builder: (_) => const MarketplaceScreen()),
                                            );
                                          },
                                          child: const Text('Explore stores'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _HeaderIconButton(
                      assetPath: 'assets/spo-icons/checkout.png',
                      label: 'Self Billing',
                      tooltip: 'Self billing',
                                      labelColor: colorScheme.onSurface,
                      backgroundColor: colorScheme.surfaceVariant,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const SelfBillingStoresScreen()),
                        );
                      },
                    ),
                    _HeaderIconButton(
                      assetPath: 'assets/spo-icons/stores.png',
                      label: 'Marketplace',
                      tooltip: 'Marketplace',
                                      labelColor: colorScheme.onSurface,
                                      backgroundColor: colorScheme.surfaceVariant,
                                      onTap: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(builder: (_) => const MarketplaceScreen()),
                        );
                      },
                    ),
                    _HeaderIconButton(
                      assetPath: 'assets/spo-icons/orders.png',
                      label: 'Self Ordering',
                      tooltip: 'Self ordering',
                      labelColor: colorScheme.onSurface,
                      backgroundColor: colorScheme.surfaceVariant,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const SelfOrderingStoresScreen()),
                        );
                      },
                    ),
                    _HeaderIconButton(
                      assetPath: 'assets/spo-icons/scan.png',
                      label: 'Self Ticketing',
                      tooltip: 'Self ticketing',
                      labelColor: colorScheme.onSurface,
                      backgroundColor: colorScheme.surfaceVariant,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const SelfTicketingScreen()),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (pendingInvoice != null)
                  GestureDetector(
                    onTap: () {
                      showDialog<void>(
                        context: context,
                        builder: (dialogContext) => AlertDialog(
                          title: const Text('Pending invoice'),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Store: ${pendingInvoice.storeName}'),
                              const SizedBox(height: 10),
                              ...pendingInvoice.items.map(
                                (item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          '${item['qty']}x ${item['name']}',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      Text('₹${item['price']}'),
                                    ],
                                  ),
                                ),
                              ),
                              const Divider(),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total', style: TextStyle(fontWeight: FontWeight.w700)),
                                  Text('₹${pendingInvoice.total}',
                                      style: const TextStyle(fontWeight: FontWeight.w700)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Unpaid • Awaiting seller confirmation',
                                style: TextStyle(fontSize: 12, color: Colors.black54),
                              ),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(dialogContext).pop(),
                              child: const Text('Close'),
                            ),
                            TextButton(
                              onPressed: () {
                                ref.read(pendingInvoiceProvider.notifier).state = null;
                                Navigator.of(dialogContext).pop();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Invoice confirmed')),
                                );
                              },
                              child: const Text('Confirm invoice'),
                            ),
                          ],
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFED7AA)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Color(0xFFEA580C)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Pending invoice for ${pendingInvoice.storeName}',
                                  style: const TextStyle(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Tap to review and confirm',
                                  style: TextStyle(fontSize: 12, color: Colors.black54),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right),
                        ],
                      ),
                    ),
                  ),
                const Text(
                  'Nearby picks and stores around you',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const MarketplaceScreen()),
                        );
                      },
                      icon: const Icon(Icons.more_horiz),
                      label: const Text('More'),
                    ),
                  ],
                ),
                SizedBox(
                  height: 40,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: trendingCategories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final category = trendingCategories[index]['label'] as String;
                      final icon = trendingCategories[index]['icon'] as IconData;
                      final isSelected = selectedCategory == category;
                      return ChoiceChip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              icon,
                              size: 16,
                              color: colorScheme.primary,
                            ),
                            const SizedBox(width: 6),
                            Text(category),
                          ],
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            ref.read(trendingCategoriesProvider.notifier).state = category;
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const MarketplaceScreen()),
                            );
                          } else {
                            ref.read(trendingCategoriesProvider.notifier).state = null;
                          }
                        },
                        selectedColor: colorScheme.primary.withOpacity(0.15),
                        labelStyle: TextStyle(
                          color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        ),
                        side: BorderSide(color: colorScheme.outline),
                        backgroundColor: Colors.white,
                      );
                    },
                  ),
                ),
                const SizedBox(height: 12),
                _SectionHeader(title: 'Most ordered from stores online'),
                const SizedBox(height: 8),
                productsAsync.when(
                  data: (products) => _ProductRow(products: products.take(6).toList()),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (error, _) => Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
                ),
                const SizedBox(height: 2),
                _SectionHeader(title: 'Stores near you'),
                const SizedBox(height: 8),
                storesAsync.when(
                  data: (stores) {
                    final limitedStores = stores.take(6).toList();
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: limitedStores.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.8,
                      ),
                      itemBuilder: (context, index) {
                        final store = limitedStores[index];
                        return _StoreTile(
                          store: store,
                          rating: 4.6 - (index % 3) * 0.2,
                          thumbnailUrl: storeThumbnails[index % storeThumbnails.length],
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
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        TextButton(onPressed: () {}, child: const Text('See all')),
      ],
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.assetPath,
    required this.label,
    required this.tooltip,
    required this.labelColor,
    required this.backgroundColor,
    required this.onTap,
  });

  final String assetPath;
  final String label;
  final String tooltip;
  final Color labelColor;
  final Color backgroundColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  color: backgroundColor,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Image.asset(
                    assetPath,
                    width: 42,
                    height: 42,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: labelColor, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationLine extends StatelessWidget {
  const _LocationLine({
    required this.locationName,
    required this.address,
    this.showAddress = true,
  });

  final String locationName;
  final String address;
  final bool showAddress;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.location_on_outlined, color: Colors.white, size: 18),
            const SizedBox(width: 6),
            Text(
              locationName,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down, color: Colors.white70, size: 18),
          ],
        ),
        if (showAddress) ...[
          const SizedBox(height: 4),
          Text(
            address,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ],
    );
  }
}

class _SearchBarTicker extends StatefulWidget {
  const _SearchBarTicker({required this.terms});

  final List<String> terms;

  @override
  State<_SearchBarTicker> createState() => _SearchBarTickerState();
}

class _SearchBarTickerState extends State<_SearchBarTicker> {
  static const _cycleDuration = Duration(seconds: 2);
  static const _transitionDuration = Duration(milliseconds: 350);
  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(_cycleDuration, (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _index = (_index + 1) % widget.terms.length;
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.search, color: colorScheme.outline),
          const SizedBox(width: 12),
          Expanded(
            child: SizedBox(
              height: 22,
              child: AnimatedSwitcher(
                duration: _transitionDuration,
                transitionBuilder: (child, animation) {
                  final tween = Tween<Offset>(begin: const Offset(0, 0.6), end: Offset.zero);
                  return ClipRect(
                    child: SlideTransition(
                      position: tween.animate(animation),
                      child: FadeTransition(opacity: animation, child: child),
                    ),
                  );
                },
                child: Text(
                  'Search "${widget.terms[_index]}"',
                  key: ValueKey(widget.terms[_index]),
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: colorScheme.onSurfaceVariant),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
          Container(
            width: 1,
            height: 24,
            color: colorScheme.outline,
          ),
          const SizedBox(width: 12),
          Icon(Icons.mic_none, color: colorScheme.primary),
        ],
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  const _ProductRow({required this.products});

  final List<MarketplaceProduct> products;

  String _capitalize(String value) {
    if (value.isEmpty) {
      return value;
    }
    return value[0].toUpperCase() + value.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return const Text('No products found.', style: TextStyle(color: Colors.grey));
    }
    const fallbackImages = [
      'https://images.pexels.com/photos/4393667/pexels-photo-4393667.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/616402/pexels-photo-616402.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/4397920/pexels-photo-4397920.jpeg?auto=compress&cs=tinysrgb&w=600',
    ];
    return SizedBox(
      height: 170,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: products.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final product = products[index];
          return Container(
            width: 160,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: const Color(0xFFF8FAFC),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    fallbackImages[index % fallbackImages.length],
                    height: 80,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 80,
                      color: const Color(0xFFF3F4F6),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _capitalize(product.name),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${product.price.toStringAsFixed(0)}',
                  style: TextStyle(fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.primary),
                ),
                const Spacer(),
                Text(
                  product.retailer.shopName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StoreTile extends StatelessWidget {
  const _StoreTile({
    required this.store,
    required this.rating,
    required this.thumbnailUrl,
  });

  final StoreSummary store;
  final double rating;
  final String thumbnailUrl;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => StoreDetailScreen(store: store)),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: LinearGradient(
            colors: [
              Theme.of(context).colorScheme.primary,
              Theme.of(context).colorScheme.secondary,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(color: Theme.of(context).colorScheme.outline),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                thumbnailUrl,
                width: 56,
                height: 56,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  width: 56,
                  height: 56,
                  color: const Color(0xFFF3F4F6),
                  child: const Icon(Icons.storefront, color: Color(0xFF9CA3AF), size: 18),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    store.shopName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    store.storeType.toLowerCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onPrimary.withOpacity(0.8),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Color(0xFFFBBF24), size: 14),
                      const SizedBox(width: 4),
                      Text(
                        rating.toStringAsFixed(1),
                        style: const TextStyle(fontSize: 12, color: Colors.white),
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
  }
}
