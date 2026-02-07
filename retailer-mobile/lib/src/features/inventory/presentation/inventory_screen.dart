import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:barcode_widget/barcode_widget.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';
import '../../auth/controller/auth_controller.dart';
import '../../workspace/workspace_providers.dart';
import '../utils/inventory_csv_parser.dart';
import 'barcode_scanner_sheet.dart';
import 'inventory_edit_sheet.dart';

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
  final _categoryController = TextEditingController();
  final GlobalKey _barcodePreviewKey = GlobalKey();

  bool _showForm = false;
  bool _isSubmitting = false;
  bool _isSavingBarcode = false;
  List<InventoryItemRequest> _bulkItems = [];
  String? _bulkFileName;
  String? _bulkFeedback;
  bool _bulkUploading = false;
  bool _bulkSuccess = false;
  String? _barcodeStatusMessage;
  bool _barcodeStatusSuccess = false;

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
    _categoryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inventoryAsync = ref.watch(inventoryProvider);
    final availableCategories = _availableCategories(inventoryAsync.valueOrNull);
    final user = ref.watch(authControllerProvider).valueOrNull;

    if (user?.retailerId == null) {
      return const Center(child: Text('Retailer ID missing. Complete setup to manage inventory.'));
    }
    final retailerId = user!.retailerId!;

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(inventoryProvider),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 8).copyWith(bottom: 120),
        children: [
          _buildToolbar(),
          if (_showForm) _buildCreateForm(retailerId, availableCategories),
          _buildBulkCard(retailerId),
          const SizedBox(height: 16),
          inventoryAsync.when(
            data: (items) => _buildInventoryList(items, retailerId),
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
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

  Widget _buildToolbar() {
    return Padding(
      padding: const EdgeInsets.all(12),
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

  Widget _buildCreateForm(String retailerId, List<String> categorySuggestions) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('New inventory item', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            const Text(
              'These products are visible to customers in the marketplace.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            if (categorySuggestions.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: categorySuggestions
                    .map(
                      (category) => InputChip(
                        label: Text(category),
                        onSelected: (_) => setState(() => _categoryController.text = category),
                      ),
                    )
                    .toList(),
              ),
            ],
            const SizedBox(height: 16),
            LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 640;
                final crossAxisCount = isWide ? 2 : 1;
                final aspectRatio = isWide ? 3.2 : 4.2;
                return GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: aspectRatio,
                  children: [
                _buildField(_skuController, 'SKU'),
                _buildField(_nameController, 'Name'),
                _buildField(_priceController, 'Price', keyboardType: TextInputType.number),
                _buildField(_mrpController, 'MRP (optional)', keyboardType: TextInputType.number),
                _buildField(_taxController, 'Tax %', keyboardType: TextInputType.number),
                _buildField(_stockController, 'Stock qty', keyboardType: TextInputType.number),
                _buildField(_unitController, 'Unit'),
                _buildField(_categoryController, 'Category (optional)'),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildField(
                      _barcodeController,
                      'Barcode (optional)',
                      onChanged: (_) => setState(() {}),
                      suffixIcon: IconButton(
                        tooltip: 'Scan barcode',
                        onPressed: () => _scanIntoController(_barcodeController),
                        icon: const Icon(Icons.qr_code_scanner),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      children: [
                        OutlinedButton.icon(
                          onPressed: _generateBarcodeValue,
                          icon: const Icon(Icons.auto_awesome),
                          label: const Text('Generate'),
                        ),
                        OutlinedButton.icon(
                          onPressed:
                              _barcodeController.text.trim().isEmpty || _isSavingBarcode ? null : _saveBarcodeImage,
                          icon: _isSavingBarcode
                              ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.print),
                          label: Text(_isSavingBarcode ? 'Saving...' : 'Save barcode'),
                        ),
                      ],
                    ),
                    if (_barcodeController.text.trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      RepaintBoundary(
                        key: _barcodePreviewKey,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                            color: Colors.white,
                          ),
                          child: BarcodeWidget(
                            barcode: Barcode.code128(),
                            data: _barcodeController.text.trim(),
                            drawText: true,
                            color: Theme.of(context).colorScheme.primary,
                            height: 80,
                          ),
                        ),
                      ),
                    ],
                    if (_barcodeStatusMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          _barcodeStatusMessage!,
                          style: TextStyle(
                            fontSize: 12,
                            color: _barcodeStatusSuccess ? Colors.green : Colors.redAccent,
                          ),
                        ),
                      ),
                  ],
                ),
                  ],
                );
              },
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
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
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

  Widget _buildInventoryList(List<InventoryItem> items, String retailerId) {
    final query = _searchController.text.trim().toLowerCase();
    final filtered = query.isEmpty
        ? items
        : items
            .where(
              (item) =>
                  item.name.toLowerCase().contains(query) ||
                  item.sku.toLowerCase().contains(query) ||
                  (item.category?.toLowerCase().contains(query) ?? false),
            )
            .toList();
    final grouped = _groupInventoryByCategory(filtered);

    if (filtered.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: Text('No inventory items match the search.')),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: grouped.map((entry) {
        final category = entry.key;
        final sectionItems = entry.value;
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(category, style: Theme.of(context).textTheme.titleMedium),
              ),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 8),
                itemBuilder: (context, index) {
                  final item = sectionItems[index];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    tileColor: Theme.of(context).cardColor,
                    title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('SKU ${item.sku} • Stock ${item.stockQuantity} • Tax ${item.taxPercentage}%'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('₹${item.price.toStringAsFixed(2)}'),
                        IconButton(
                          onPressed: () => _openEditSheet(retailerId, item),
                          tooltip: 'Edit item',
                          iconSize: 20,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints.tightFor(width: 32, height: 32),
                          icon: const Icon(Icons.edit_outlined),
                        ),
                      ],
                    ),
                    onTap: () => _openEditSheet(retailerId, item),
                  );
                },
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemCount: sectionItems.length,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildField(
    TextEditingController controller,
    String label, {
    TextInputType keyboardType = TextInputType.text,
    Widget? suffixIcon,
    ValueChanged<String>? onChanged,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(labelText: label, suffixIcon: suffixIcon),
      onChanged: onChanged,
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
        category: _categoryController.text.trim().isEmpty ? null : _categoryController.text.trim(),
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
          _categoryController.clear();
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

  Future<void> _scanIntoController(TextEditingController controller) async {
    final code = await showBarcodeScannerSheet(context);
    if (code != null) {
      setState(() {
        controller.text = code;
      });
    }
  }

  Future<void> _openEditSheet(String retailerId, InventoryItem item) async {
    final updatedRequest = await showModalBottomSheet<InventoryItemRequest>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => InventoryEditSheet(item: item, initialCategory: item.category),
    );
    if (updatedRequest == null) return;

    final navigator = Navigator.of(context, rootNavigator: true);
    final messenger = ScaffoldMessenger.of(context);
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    try {
      await ref.read(retailerApiProvider).createInventoryItem(retailerId, updatedRequest);
      ref.invalidate(inventoryProvider);
      if (mounted) {
        messenger.showSnackBar(const SnackBar(content: Text('Inventory item updated')));
      }
    } on ApiException catch (error) {
      if (mounted) {
        messenger.showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (navigator.mounted) {
        navigator.pop();
      }
    }
  }

  void _generateBarcodeValue() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    setState(() {
      _barcodeController.text = 'SC$timestamp';
      _barcodeStatusMessage = 'Barcode generated. Save or print as needed.';
      _barcodeStatusSuccess = true;
    });
  }

  Future<void> _saveBarcodeImage() async {
    final code = _barcodeController.text.trim();
    if (code.isEmpty) {
      setState(() {
        _barcodeStatusMessage = 'Enter or generate a barcode first.';
        _barcodeStatusSuccess = false;
      });
      return;
    }

    final boundary = _barcodePreviewKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) {
      setState(() {
        _barcodeStatusMessage = 'Barcode preview not ready. Try again.';
        _barcodeStatusSuccess = false;
      });
      return;
    }

    setState(() {
      _isSavingBarcode = true;
      _barcodeStatusMessage = null;
    });

    try {
      final image = await boundary.toImage(pixelRatio: 3);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      final bytes = byteData!.buffer.asUint8List();
      final directory = await getApplicationDocumentsDirectory();
      final folder = Directory('${directory.path}/barcodes');
      await folder.create(recursive: true);
      final safeCode = code.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
      final file =
          File('${folder.path}/$safeCode-${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(bytes);
      if (!mounted) return;
      setState(() {
        _isSavingBarcode = false;
        _barcodeStatusMessage = 'Barcode saved to ${file.path}';
        _barcodeStatusSuccess = true;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isSavingBarcode = false;
        _barcodeStatusMessage = 'Failed to save barcode: $error';
        _barcodeStatusSuccess = false;
      });
    }
  }

  List<String> _availableCategories(List<InventoryItem>? items) {
    if (items == null) return [];
    final set = <String>{};
    for (final item in items) {
      final category = item.category?.trim();
      if (category != null && category.isNotEmpty) {
        set.add(category);
      }
    }
    final list = set.toList()..sort();
    return list;
  }

  List<MapEntry<String, List<InventoryItem>>> _groupInventoryByCategory(List<InventoryItem> items) {
    final buckets = <String, List<InventoryItem>>{};
    for (final item in items) {
      final key = (item.category?.trim().isNotEmpty ?? false) ? item.category!.trim() : 'Uncategorized';
      buckets.putIfAbsent(key, () => []).add(item);
    }
    final keys = buckets.keys.toList()..sort();
    return keys.map((key) => MapEntry(key, buckets[key]!)).toList();
  }
}
