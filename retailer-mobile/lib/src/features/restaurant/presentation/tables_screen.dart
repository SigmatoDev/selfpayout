import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/config/app_config.dart';
import '../../../core/di/providers.dart';
import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../workspace/workspace_providers.dart';

class TablesScreen extends ConsumerStatefulWidget {
  const TablesScreen({super.key});

  @override
  ConsumerState<TablesScreen> createState() => _TablesScreenState();
}

class _TablesScreenState extends ConsumerState<TablesScreen> {
  final _labelController = TextEditingController();
  final _capacityController = TextEditingController(text: '2');
  String? _error;
  bool _isSaving = false;

  @override
  void dispose() {
    _labelController.dispose();
    _capacityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final retailerId = user?.retailerId;

    if (retailerId == null) {
      return const Center(child: Text('No retailer linked. Please sign in again.'));
    }

    final tablesAsync = ref.watch(restaurantTablesProvider(retailerId));

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(restaurantTablesProvider(retailerId));
      },
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Add / update table', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _labelController,
                          decoration: const InputDecoration(
                            labelText: 'Label',
                            hintText: 'T1, Patio-3',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      SizedBox(
                        width: 90,
                        child: TextField(
                          controller: _capacityController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Capacity'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _isSaving ? null : () => _saveTable(retailerId),
                    child: _isSaving
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save table'),
                  ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          tablesAsync.when(
            data: (tables) {
              if (tables.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No tables configured.'),
                );
              }
              return Column(
                children: tables
                    .map(
                      (table) => Card(
                        child: ListTile(
                          title: Text('${table.label} • capacity ${table.capacity}'),
                          subtitle: Text('Status: ${table.status}'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                tooltip: 'View QR',
                                icon: const Icon(Icons.qr_code_rounded),
                                onPressed: () => _showQrDialog(table),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline),
                                onPressed: () => _deleteTable(retailerId, table.id),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveTable(String retailerId) async {
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      final capacity = int.tryParse(_capacityController.text.trim()) ?? 2;
      final table = await ref.read(retailerApiProvider).upsertTable(
            retailerId,
            label: _labelController.text.trim(),
            capacity: capacity,
          );
      ref.invalidate(restaurantTablesProvider(retailerId));
      _labelController.clear();
      if (mounted) {
        _showQrDialog(table);
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _deleteTable(String retailerId, String tableId) async {
    try {
      await ref.read(retailerApiProvider).deleteTable(retailerId, tableId);
      ref.invalidate(restaurantTablesProvider(retailerId));
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  String _tableQrData(TableInfo table) {
    final base = Uri.parse(AppConfig.deepLinkBase);
    final uri = base.replace(queryParameters: {
      'retailerId': table.retailerId,
      'tableId': table.id,
      'label': table.label,
    });
    return uri.toString();
  }

  String _safeFileName(String input) {
    final sanitized = input.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    return sanitized.isEmpty ? 'table' : sanitized;
  }

  Future<File> _buildQrFile(TableInfo table) async {
    final painter = QrPainter(
      data: _tableQrData(table),
      version: QrVersions.auto,
      gapless: true,
    );
    final imageData = await painter.toImageData(600, format: ui.ImageByteFormat.png);
    if (imageData == null) {
      throw Exception('Unable to generate QR code.');
    }
    final bytes = imageData.buffer.asUint8List();
    final directory = await getApplicationDocumentsDirectory();
    final filename = 'qr-${_safeFileName(table.label)}-${table.id.substring(0, 6)}.png';
    final file = File('${directory.path}/$filename');
    await file.writeAsBytes(bytes);
    return file;
  }

  Future<void> _downloadQr(TableInfo table) async {
    try {
      final file = await _buildQrFile(table);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Saved QR to ${file.path}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save QR: $e')),
      );
    }
  }

  Future<void> _shareQr(TableInfo table) async {
    try {
      final file = await _buildQrFile(table);
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'QR for table ${table.label}',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to share QR: $e')),
      );
    }
  }

  void _showQrDialog(TableInfo table) {
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Table ${table.label} QR'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              QrImageView(
                data: _tableQrData(table),
                size: 180,
              ),
              const SizedBox(height: 12),
              Text('Capacity ${table.capacity}', style: const TextStyle(fontSize: 12)),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Close'),
            ),
            TextButton(
              onPressed: () => _downloadQr(table),
              child: const Text('Download'),
            ),
            ElevatedButton(
              onPressed: () => _shareQr(table),
              child: const Text('Share/Print'),
            ),
          ],
        );
      },
    );
  }
}
