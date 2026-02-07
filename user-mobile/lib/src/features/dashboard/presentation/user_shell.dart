import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/marketplace/presentation/marketplace_screen.dart';
import '../../../features/profile/presentation/profile_screen.dart';
import '../../../features/orders/presentation/orders_screen.dart';
import 'home_screen.dart';

class UserShell extends ConsumerStatefulWidget {
  const UserShell({super.key});

  @override
  ConsumerState<UserShell> createState() => _UserShellState();
}

class _UserShellState extends ConsumerState<UserShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const HomeScreen(),
      const MarketplaceScreen(),
      const OrdersScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _index,
          children: pages,
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (value) => setState(() => _index = value),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.storefront_outlined), label: 'Market'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Orders'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}
