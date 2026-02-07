import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../marketplace_providers.dart';
import 'store_detail_screen.dart';

class SelfBillingStoresScreen extends ConsumerStatefulWidget {
  const SelfBillingStoresScreen({super.key});

  @override
  ConsumerState<SelfBillingStoresScreen> createState() => _SelfBillingStoresScreenState();
}

class _SelfBillingStoresScreenState extends ConsumerState<SelfBillingStoresScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  static const List<String> _filters = ['Nearby', 'Popular', 'Fresh picks'];
  static const List<String> _kiranaImages = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=900&q=80'
  ];
  static const List<String> _fallbackImages = [
    'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1481931715705-36f5f79f1f3d?auto=format&fit=crop&w=900&q=80'
  ];
  static const String _selfBillingBadge = 'Self billing';

  bool _isSelfBillingStore(String storeType) {
    final normalized = storeType.trim().toLowerCase();
    return normalized.contains('kirana');
  }

  String _imageForStore(String storeType, int index) {
    final normalized = storeType.trim().toLowerCase();
    final pool = normalized.contains('kirana') ? _kiranaImages : _fallbackImages;
    return pool[index % pool.length];
  }

  @override
  Widget build(BuildContext context) {
    final storesAsync = ref.watch(marketplaceStoresProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Self Billing Stores'),
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: storesAsync.when(
          data: (stores) {
            final filtered = stores.where((store) {
              if (!_isSelfBillingStore(store.storeType)) return false;
              if (_search.isEmpty) return true;
              final term = _search.toLowerCase();
              return store.shopName.toLowerCase().contains(term);
            }).toList();
            if (filtered.isEmpty) {
              return const Center(
                child: Text('No self billing stores available right now.'),
              );
            }
            return Stack(
              children: [
                GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 152, 16, 20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
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
                                  height: 120,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                ),
                                Positioned(
                                  left: 10,
                                  top: 10,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                    child: const Text('★ 4.6', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                  ),
                                ),
                                Positioned(
                                  right: 10,
                                  top: 10,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                    child: Text(
                                      _selfBillingBadge,
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: colorScheme.primary),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundColor: colorScheme.secondary.withOpacity(0.25),
                                      child: Text(
                                        store.shopName.substring(0, 1).toUpperCase(),
                                        style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.w700),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        store.shopName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  store.storeType.toLowerCase(),
                                  style: const TextStyle(fontSize: 11, color: Colors.black54),
                                ),
                                const SizedBox(height: 10),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(builder: (_) => StoreDetailScreen(store: store)),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: colorScheme.primary,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                    ),
                                    child: const Text('Explore'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
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
                Positioned(
                  left: 16,
                  right: 16,
                  top: 64,
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'Search self billing stores',
                      prefixIcon: Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    onChanged: (value) => setState(() => _search = value.trim()),
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
