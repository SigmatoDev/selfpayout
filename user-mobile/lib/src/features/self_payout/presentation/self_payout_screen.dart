import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../models/user_models.dart';
import '../../auth/controller/auth_controller.dart';
import 'menu_screen.dart';
import 'qr_scan_screen.dart';

class SelfPayoutScreen extends ConsumerStatefulWidget {
  const SelfPayoutScreen({super.key});

  @override
  ConsumerState<SelfPayoutScreen> createState() => _SelfPayoutScreenState();
}

class _SelfPayoutScreenState extends ConsumerState<SelfPayoutScreen> {
  String _storeType = 'RESTAURANT';
  String _retailerCode = '';
  String _tableNumber = '';
  String _guestCount = '';
  String _trainNumber = '';
  String _coach = '';
  String _seat = '';
  bool _groupOrder = false;
  String? _status;
  bool _loadingTables = false;
  List<TableInfo> _tables = [];

  Future<void> _scanQr() async {
    final code = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const QrScanScreen()),
    );
    if (code == null) return;
    setState(() => _retailerCode = code.trim());
    if (_storeType == 'RESTAURANT') {
      await _loadTables();
    }
  }

  Future<void> _loadTables() async {
    if (_retailerCode.isEmpty) return;
    setState(() {
      _loadingTables = true;
      _status = null;
    });
    try {
      final tables = await ref.read(userApiProvider).fetchPublicTables(_retailerCode);
      setState(() => _tables = tables);
    } catch (error) {
      setState(() => _status = error.toString());
    } finally {
      setState(() => _loadingTables = false);
    }
  }

  Future<void> _startSession() async {
    setState(() => _status = null);
    if (_retailerCode.isEmpty) {
      setState(() => _status = 'Enter store code or scan QR.');
      return;
    }
    final context = <String, String>{};
    if (_storeType == 'RESTAURANT') {
      if (_tableNumber.isNotEmpty) context['tableNumber'] = _tableNumber;
      if (_guestCount.isNotEmpty) context['guestCount'] = _guestCount;
    }
    if (_storeType == 'TRAIN') {
      if (_trainNumber.isEmpty) {
        setState(() => _status = 'Train number is required.');
        return;
      }
      context['trainNumber'] = _trainNumber;
      if (_coach.isNotEmpty) context['coach'] = _coach;
      if (_seat.isNotEmpty) context['seat'] = _seat;
    }

    try {
      final user = ref.read(authControllerProvider).valueOrNull;
      final session = await ref.read(userApiProvider).startSession(
            retailerCode: _retailerCode,
            storeType: _storeType,
            customerPhone: user?.phone,
            groupOrder: _groupOrder,
            context: context.isEmpty ? null : context,
          );
      setState(() => _status = 'Session started. Code: ${session.securityCode}');
    } catch (error) {
      setState(() => _status = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Start self-checkout', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                decoration: const InputDecoration(labelText: 'Store code'),
                onChanged: (value) => setState(() => _retailerCode = value.trim()),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _scanQr,
              icon: const Icon(Icons.qr_code_2_rounded, color: Color(0xFFD00000)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: ['KIRANA', 'RESTAURANT', 'TRAIN'].map((type) {
            final selected = _storeType == type;
            return ChoiceChip(
              label: Text(type),
              selected: selected,
              onSelected: (_) => setState(() => _storeType = type),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        if (_storeType == 'RESTAURANT') ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Table'),
              TextButton(
                onPressed: _loadTables,
                child: _loadingTables ? const Text('Loading...') : const Text('Refresh tables'),
              ),
            ],
          ),
          if (_tables.isNotEmpty)
            Wrap(
              spacing: 8,
              children: _tables
                  .map(
                    (table) => ActionChip(
                      label: Text(table.label),
                      onPressed: () => setState(() => _tableNumber = table.label),
                    ),
                  )
                  .toList(),
            ),
          const SizedBox(height: 8),
          TextField(
            decoration: const InputDecoration(labelText: 'Table number'),
            onChanged: (value) => setState(() => _tableNumber = value),
          ),
          const SizedBox(height: 8),
          TextField(
            decoration: const InputDecoration(labelText: 'Guests'),
            onChanged: (value) => setState(() => _guestCount = value),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: _retailerCode.isEmpty
                  ? null
                  : () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => MenuScreen(retailerId: _retailerCode)),
                      );
                    },
              icon: const Icon(Icons.restaurant_menu),
              label: const Text('View menu'),
            ),
          ),
        ],
        if (_storeType == 'TRAIN') ...[
          const SizedBox(height: 8),
          TextField(
            decoration: const InputDecoration(labelText: 'Train number'),
            onChanged: (value) => setState(() => _trainNumber = value),
          ),
          const SizedBox(height: 8),
          TextField(
            decoration: const InputDecoration(labelText: 'Coach'),
            onChanged: (value) => setState(() => _coach = value),
          ),
          const SizedBox(height: 8),
          TextField(
            decoration: const InputDecoration(labelText: 'Seat'),
            onChanged: (value) => setState(() => _seat = value),
          ),
        ],
        const SizedBox(height: 8),
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          value: _groupOrder,
          onChanged: (value) => setState(() => _groupOrder = value),
          title: const Text('Group order'),
          subtitle: const Text('Allow others to scan and add items'),
        ),
        if (_status != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_status!, style: const TextStyle(fontSize: 12, color: Colors.redAccent)),
          ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _startSession,
          child: const Text('Start session'),
        ),
      ],
    );
  }
}
