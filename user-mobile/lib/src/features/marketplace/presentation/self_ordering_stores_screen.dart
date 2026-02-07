import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../marketplace_providers.dart';
import 'self_ordering_store_detail_screen.dart';

class SelfOrderingStoresScreen extends ConsumerWidget {
  const SelfOrderingStoresScreen({super.key});

  static const List<String> _filters = ['Nearby', 'Top rated', 'Family friendly'];
  static const List<String> _restaurantImages = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1421622548261-c45bfe178854?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=80'
  ];
  static const List<String> _fallbackImages = [
    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80'
  ];

  bool _isRestaurant(String storeType) {
    return storeType.trim().toUpperCase() == 'RESTAURANT';
  }

  String _imageForStore(String storeType, int index) {
    final normalized = storeType.trim().toUpperCase();
    final pool = normalized == 'RESTAURANT' ? _restaurantImages : _fallbackImages;
    return pool[index % pool.length];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storesAsync = ref.watch(marketplaceStoresProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Self Ordering'),
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: storesAsync.when(
          data: (stores) {
            final filtered = stores.where((store) => _isRestaurant(store.storeType)).toList();
            if (filtered.isEmpty) {
              return const Center(child: Text('No self ordering restaurants available right now.'));
            }
            return Stack(
              children: [
                ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 96, 16, 20),
                  itemBuilder: (context, index) {
                    final store = filtered[index];
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
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
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                            child: Stack(
                              children: [
                                Image.network(
                                  _imageForStore(store.storeType, index),
                                  height: 150,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                ),
                                Positioned(
                                  left: 12,
                                  top: 12,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                    child: const Text('★ 4.7', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: colorScheme.secondary.withOpacity(0.25),
                                  child: Text(
                                    store.shopName.substring(0, 1).toUpperCase(),
                                    style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w700),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(store.shopName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 4),
                                      const Text('Self ordering available', style: TextStyle(fontSize: 12, color: Colors.black54)),
                                    ],
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(builder: (_) => SelfOrderingStoreDetailScreen(store: store)),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: colorScheme.primary,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                  child: const Text('Explore'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemCount: filtered.length,
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  top: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        )
                      ],
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _filters
                            .map(
                              (filter) => Container(
                                margin: const EdgeInsets.only(right: 10),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: colorScheme.primary.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  filter,
                                  style: TextStyle(fontSize: 12, color: colorScheme.primary, fontWeight: FontWeight.w600),
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
          ),
        ),
      ),
    );
  }
}
