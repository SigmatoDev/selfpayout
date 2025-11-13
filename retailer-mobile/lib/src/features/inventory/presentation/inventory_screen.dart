import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../workspace/workspace_providers.dart';
import '../utils/inventory_csv_parser.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  final _searchController = TextEditingController();
  final _skuController = TextEditingController();
  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _mrpController = TextEditingController();
  final _taxController = TextEditingController(text: '0');
  final _stockController = TextEditingController(text: '0');
  final _unitController = TextEditingController(text: 'pcs');
  final _barcodeController = TextEditingController();

  bool _showForm = false;
  bool _isSubmitting = false;
  List<InventoryItemRequest> _bulkItems = [];
  String? _bulkFileName;
  String? _bulkFeedback;
  bool _bulkUploading = false;
  bool _bulkSuccess = false;

  @override
  void dispose() {
    _searchController.dispose();
    _skuController.dispose();
    _nameController.dispose();
    _priceController.dispose();
    _mrpController.dispose();
    _taxController.dispose();
    _stockController.dispose();
    _unitController.dispose();
    _barcodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inventoryAsync = ref.watch(inventoryProvider);
    final user = ref.watch(authControllerProvider).valueOrNull;

    if (user?.retailerId == null) {
      return const Center(child: Text('Retailer ID missing. Complete setup to manage inventory.'));
    }

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(inventoryProvider),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          _buildToolbar(),
          if (_showForm) _buildCreateForm(user!.retailerId!),
          _buildBulkCard(user!.retailerId!),
          const SizedBox(height: 16),
          inventoryAsync.when(
            data: (items) => _buildInventoryList(items),
            loading: () => const Center(child: Padding(
              padding: EdgeInsets.all(24.0),
              child: CircularProgressIndicator(),
            )),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolbar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(labelText: 'Search inventory'),
              onChanged: (_) => setState(() {}),
            ),
          ),
          const SizedBox(width: 12),
          OutlinedButton.icon(
            onPressed: () => setState(() => _showForm = !_showForm),
            icon: Icon(_showForm ? Icons.close : Icons.add),
            label: Text(_showForm ? 'Cancel' : 'Add item'),
          ),
        ],
      ),
    );
  }

  Widget _buildCreateForm(String retailerId) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('New inventory item', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.8,
              children: [
                _buildField(_skuController, 'SKU'),
                _buildField(_nameController, 'Name'),
                _buildField(_priceController, 'Price', keyboardType: TextInputType.number),
                _buildField(_mrpController, 'MRP (optional)', keyboardType: TextInputType.number),
                _buildField(_taxController, 'Tax %', keyboardType: TextInputType.number),
                _buildField(_stockController, 'Stock qty', keyboardType: TextInputType.number),
                _buildField(_unitController, 'Unit'),
                _buildField(_barcodeController, 'Barcode (optional)'),
              ],
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : () => _handleCreateItem(retailerId),
                child: _isSubmitting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Save item'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulkCard(String retailerId) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bulk upload', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            const Text(
              'Upload a CSV with sku,name,price,taxPercentage,stockQuantity columns.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                ElevatedButton.icon(
                  onPressed: _bulkUploading ? null : _pickBulkFile,
                  icon: const Icon(Icons.upload_file),
                  label: Text(_bulkUploading ? 'Reading...' : 'Choose CSV'),
                ),
                const SizedBox(width: 12),
                if (_bulkFileName != null)
                  Expanded(
                    child: Text(
                      '$_bulkFileName • ${_bulkItems.length} row(s)',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed:
                  _bulkItems.isEmpty || _bulkUploading ? null : () => _handleBulkUpload(retailerId),
              child: const Text('Upload items'),
            ),
            if (_bulkFeedback != null) ...[
              const SizedBox(height: 8),
              Text(
                _bulkFeedback!,
                style: TextStyle(
                  fontSize: 12,
                  color: _bulkSuccess ? Colors.teal : Colors.redAccent,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryList(List<InventoryItem> items) {
    final query = _searchController.text.trim().toLowerCase();
    final filtered = query.isEmpty
        ? items
        : items
            .where(
              (item) => item.name.toLowerCase().contains(query) || item.sku.toLowerCase().contains(query),
            )
            .toList();

    if (filtered.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: Text('No inventory items match the search.')),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemBuilder: (context, index) {
        final item = filtered[index];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          tileColor: Theme.of(context).cardColor,
          title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('SKU ${item.sku} • Stock ${item.stockQuantity} • Tax ${item.taxPercentage}%'),
          trailing: Text('₹${item.price.toStringAsFixed(2)}'),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: filtered.length,
    );
  }

  Widget _buildField(
    TextEditingController controller,
    String label, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(labelText: label),
    );
  }

  Future<void> _handleCreateItem(String retailerId) async {
    if (_skuController.text.trim().isEmpty || _nameController.text.trim().isEmpty) {
      setState(() => _bulkFeedback = 'SKU and Name are required.');
      return;
    }
    final price = double.tryParse(_priceController.text.trim());
    if (price == null) {
      setState(() => _bulkFeedback = 'Price must be a number.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _bulkFeedback = null;
    });

    try {
      final request = InventoryItemRequest(
        sku: _skuController.text.trim(),
        name: _nameController.text.trim(),
        price: price,
        mrp: _mrpController.text.trim().isEmpty ? null : double.tryParse(_mrpController.text.trim()),
        taxPercentage: double.tryParse(_taxController.text.trim()) ?? 0,
        stockQuantity: int.tryParse(_stockController.text.trim()) ?? 0,
        unit: _unitController.text.trim().isEmpty ? 'pcs' : _unitController.text.trim(),
        barcode: _barcodeController.text.trim().isEmpty ? null : _barcodeController.text.trim(),
      );
      await ref.read(retailerApiProvider).createInventoryItem(retailerId, request);
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _skuController.clear();
          _nameController.clear();
          _priceController.clear();
          _mrpController.clear();
          _barcodeController.clear();
          _bulkFeedback = 'Item created successfully.';
          _bulkSuccess = true;
        });
        ref.invalidate(inventoryProvider);
      }
    } on ApiException catch (error) {
      setState(() {
        _isSubmitting = false;
        _bulkFeedback = error.message;
        _bulkSuccess = false;
      });
    }
  }

  Future<void> _pickBulkFile() async {
    setState(() {
      _bulkUploading = true;
      _bulkFeedback = null;
    });
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['csv'],
        withData: true,
      );
      if (result == null || result.files.isEmpty) {
        setState(() {
          _bulkUploading = false;
          _bulkItems = [];
          _bulkFileName = null;
        });
        return;
      }
      final file = result.files.first;
      final bytes = file.bytes ?? await File(file.path!).readAsBytes();
      final content = utf8.decode(bytes);
      final parsed = InventoryCsvParser.parse(content);
      setState(() {
        _bulkItems = parsed;
        _bulkFileName = file.name;
        _bulkUploading = false;
        _bulkFeedback = 'Ready to upload ${parsed.length} row(s).';
        _bulkSuccess = true;
      });
    } on FormatException catch (error) {
      setState(() {
        _bulkUploading = false;
        _bulkFeedback = error.message;
        _bulkItems = [];
        _bulkSuccess = false;
      });
    }
  }

  Future<void> _handleBulkUpload(String retailerId) async {
    setState(() {
      _bulkUploading = true;
      _bulkFeedback = null;
    });
    try {
      await ref.read(retailerApiProvider).uploadInventoryBulk(retailerId, _bulkItems);
      setState(() {
        _bulkUploading = false;
        _bulkFeedback = 'Uploaded ${_bulkItems.length} rows successfully.';
        _bulkItems = [];
        _bulkFileName = null;
        _bulkSuccess = true;
      });
      ref.invalidate(inventoryProvider);
    } on ApiException catch (error) {
      setState(() {
        _bulkUploading = false;
        _bulkFeedback = error.message;
        _bulkSuccess = false;
      });
    }
  }
}
