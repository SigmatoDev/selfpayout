import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/di/providers.dart';
import '../../../core/language/language_controller.dart';
import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../billing/presentation/billing_screen.dart';
import '../../customers/presentation/customers_screen.dart';
import '../../inventory/presentation/inventory_screen.dart';
import '../../payments/presentation/payments_screen.dart';
import '../../restaurant/presentation/menu_screen.dart';
import '../../restaurant/presentation/tables_screen.dart';
import '../../reports/presentation/reports_screen.dart';

class WorkspaceShell extends ConsumerStatefulWidget {
  const WorkspaceShell({super.key});

  @override
  ConsumerState<WorkspaceShell> createState() => _WorkspaceShellState();
}

class _WorkspaceShellState extends ConsumerState<WorkspaceShell> {
  int _currentIndex = 0;
  bool _compactHeader = false;
  bool _checkedOnboarding = false;
  bool _showTour = false;
  int _tourStep = 0;

  late final List<_WorkspaceTab> _tabs = [
    _WorkspaceTab(
      icon: Icons.point_of_sale,
      translationKey: TranslationKey.billing,
      child: const BillingScreen(),
    ),
    _WorkspaceTab(
      icon: Icons.inventory_2,
      translationKey: TranslationKey.inventory,
      child: const InventoryScreen(),
    ),
    _WorkspaceTab(
      icon: Icons.people_alt_rounded,
      translationKey: TranslationKey.customers,
      child: const CustomersScreen(),
    ),
    _WorkspaceTab(
      icon: Icons.receipt_long,
      translationKey: TranslationKey.collectPayment,
      child: const PaymentsScreen(),
    ),
    _WorkspaceTab(
      icon: Icons.restaurant_menu,
      translationKey: TranslationKey.menu,
      child: const MenuScreen(),
    ),
    _WorkspaceTab(
      icon: Icons.table_bar,
      translationKey: TranslationKey.tables,
      child: const TablesScreen(),
    ),
    _WorkspaceTab(
      icon: Icons.stacked_bar_chart_rounded,
      translationKey: TranslationKey.reports,
      child: const ReportsScreen(),
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeShowOnboarding());
  }

  Future<void> _maybeShowOnboarding() async {
    if (_checkedOnboarding) return;
    _checkedOnboarding = true;
    final prefs = await SharedPreferences.getInstance();
    const key = 'selfcheckout_retailer_onboarding_seen_v1';
    final hasSeen = prefs.getBool(key) ?? false;
    if (hasSeen || !mounted) return;
    setState(() {
      _showTour = true;
      _tourStep = 0;
      _currentIndex = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final strings = ref.watch(languageStringsProvider);
    final user = ref.watch(authControllerProvider).valueOrNull;

    final scaffold = Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _Header(user: user, compact: _compactHeader),
            Expanded(
              child: NotificationListener<ScrollNotification>(
                onNotification: (notification) {
                  if (notification.metrics.axis == Axis.vertical) {
                    final shouldCompact = notification.metrics.pixels > 40;
                    if (shouldCompact != _compactHeader) {
                      setState(() => _compactHeader = shouldCompact);
                    }
                  }
                  return false;
                },
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: IndexedStack(
                    key: ValueKey(_currentIndex),
                    index: _currentIndex,
                    children: _tabs
                        .map(
                          (tab) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            child: tab.child,
                          ),
                        )
                        .toList(),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (value) => setState(() => _currentIndex = value),
        items: _tabs
            .map(
              (tab) => BottomNavigationBarItem(
                icon: Icon(tab.icon),
                label: strings.label(tab.translationKey),
              ),
            )
            .toList(),
      ),
    );

    if (!_showTour) return scaffold;

    return Stack(
      children: [
        scaffold,
        _GuidedTourOverlay(
          step: _tourStep,
          onNext: _advanceTour,
          onSkip: _dismissTour,
        ),
      ],
    );
  }

  void _dismissTour() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('selfcheckout_retailer_onboarding_seen_v1', true);
    if (!mounted) return;
    setState(() => _showTour = false);
  }

  void _advanceTour() {
    final nextStep = _tourStep + 1;
    if (nextStep >= _GuidedTourOverlay.totalSteps) {
      _dismissTour();
      return;
    }
    setState(() {
      _tourStep = nextStep;
      if (_tourStep == 0 || _tourStep == 1) {
        _currentIndex = 0;
      } else if (_tourStep == 2) {
        _currentIndex = 5;
      }
    });
  }
}

class _WorkspaceTab {
  const _WorkspaceTab({
    required this.icon,
    required this.translationKey,
    required this.child,
  });

  final IconData icon;
  final TranslationKey translationKey;
  final Widget child;
}

enum _HeaderMenuAction { toggleTheme, toggleLanguage, logout }

class _Header extends ConsumerWidget {
  const _Header({this.user, required this.compact});

  final CurrentUser? user;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = ref.watch(languageStringsProvider);
    final themeMode = ref.watch(themeControllerProvider);
    final language = ref.watch(languageControllerProvider);

    const brandColor = Color(0xFFD00000);
    void handleMenuSelection(_HeaderMenuAction action) {
      switch (action) {
        case _HeaderMenuAction.toggleTheme:
          ref.read(themeControllerProvider.notifier).toggle();
          break;
        case _HeaderMenuAction.toggleLanguage:
          ref.read(languageControllerProvider.notifier).toggle();
          break;
        case _HeaderMenuAction.logout:
          ref.read(authControllerProvider.notifier).logout();
          break;
      }
    }

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            brandColor.withValues(alpha: 0.18),
            Colors.transparent,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: brandColor,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: brandColor.withValues(alpha: 0.35),
                            blurRadius: 22,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/brand/selfpayout_logo.png',
                        height: 28,
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(width: 12),
                    AnimatedOpacity(
                      duration: const Duration(milliseconds: 200),
                      opacity: compact ? 0 : 1,
                      child: compact
                          ? const SizedBox.shrink()
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'SelfPayout Retailer',
                                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                        letterSpacing: 0.6,
                                        color: Theme.of(context).colorScheme.outline,
                                      ),
                                ),
                                Text(
                                  user?.name ?? 'Retailer',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
                PopupMenuButton<_HeaderMenuAction>(
                  icon: const Icon(Icons.menu),
                  tooltip: 'Menu',
                  onSelected: handleMenuSelection,
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: _HeaderMenuAction.toggleTheme,
                      child: Row(
                        children: [
                          Icon(themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode, size: 18),
                          const SizedBox(width: 8),
                          Text(themeMode == ThemeMode.dark ? 'Light mode' : 'Dark mode'),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: _HeaderMenuAction.toggleLanguage,
                      child: Row(
                        children: [
                          const Icon(Icons.translate, size: 18),
                          const SizedBox(width: 8),
                          Text('Language (${language.toggleLabel})'),
                        ],
                      ),
                    ),
                    const PopupMenuDivider(),
                    const PopupMenuItem(
                      value: _HeaderMenuAction.logout,
                      child: Row(
                        children: [
                          Icon(Icons.logout, size: 18),
                          SizedBox(width: 8),
                          Text('Logout'),
                        ],
                      ),
                    ),
                  ],
                )
              ],
            ),
            const SizedBox(height: 12),
            AnimatedCrossFade(
              crossFadeState: compact ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
              firstChild: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${strings.label(TranslationKey.welcome)}, ${user?.name ?? 'Retailer'}!',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  const Text('Quick billing, customer tracking, and offline-ready workflows.'),
                ],
              ),
              secondChild: const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuidedTourOverlay extends StatelessWidget {
  const _GuidedTourOverlay({
    required this.step,
    required this.onNext,
    required this.onSkip,
  });

  final int step;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  static const totalSteps = 3;

  @override
  Widget build(BuildContext context) {
    final steps = [
      const _TourStep(
        title: 'Billing hub',
        message: 'Self-checkout sessions now appear on top of Billing.',
        alignment: Alignment(0, -0.4),
      ),
      const _TourStep(
        title: 'Scan items',
        message: 'Tap the QR icon near the item search to scan barcodes quickly.',
        alignment: Alignment(0, 0.1),
      ),
      const _TourStep(
        title: 'Table QR codes',
        message: 'Go to Tables to view, download, or print QR codes.',
        alignment: Alignment(0, 0.6),
      ),
    ];

    final current = steps[step.clamp(0, steps.length - 1)];

    return Positioned.fill(
      child: Material(
        color: Colors.black54,
        child: Stack(
          children: [
            Align(
              alignment: current.alignment,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _TourCard(
                  title: current.title,
                  message: current.message,
                  step: step + 1,
                  total: steps.length,
                  onNext: onNext,
                  onSkip: onSkip,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TourStep {
  const _TourStep({
    required this.title,
    required this.message,
    required this.alignment,
  });

  final String title;
  final String message;
  final Alignment alignment;
}

class _TourCard extends StatelessWidget {
  const _TourCard({
    required this.title,
    required this.message,
    required this.step,
    required this.total,
    required this.onNext,
    required this.onSkip,
  });

  final String title;
  final String message;
  final int step;
  final int total;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(message, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Step $step of $total', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Row(
                  children: [
                    TextButton(onPressed: onSkip, child: const Text('Skip')),
                    const SizedBox(width: 8),
                    ElevatedButton(onPressed: onNext, child: Text(step == total ? 'Done' : 'Next')),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
