import 'dart:io';
import 'dart:ui' as ui;

import 'package:barcode_widget/barcode_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';

import '../../../models/models.dart';
import 'barcode_scanner_sheet.dart';

class InventoryEditSheet extends StatefulWidget {
  const InventoryEditSheet({super.key, required this.item, this.initialCategory});

  final InventoryItem item;
  final String? initialCategory;

  @override
  State<InventoryEditSheet> createState() => _InventoryEditSheetState();
}

class _InventoryEditSheetState extends State<InventoryEditSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _skuController = TextEditingController(text: widget.item.sku);
  late final TextEditingController _nameController = TextEditingController(text: widget.item.name);
  late final TextEditingController _priceController =
      TextEditingController(text: widget.item.price.toStringAsFixed(2));
  late final TextEditingController _mrpController =
      TextEditingController(text: widget.item.mrp?.toStringAsFixed(2) ?? '');
  late final TextEditingController _taxController =
      TextEditingController(text: widget.item.taxPercentage.toStringAsFixed(2));
  late final TextEditingController _stockController =
      TextEditingController(text: widget.item.stockQuantity.toString());
  late final TextEditingController _unitController = TextEditingController(text: widget.item.unit ?? 'pcs');
  late final TextEditingController _barcodeController = TextEditingController(text: widget.item.barcode ?? '');
  late final TextEditingController _categoryController =
      TextEditingController(text: widget.initialCategory ?? widget.item.category ?? '');
  final GlobalKey _barcodePreviewKey = GlobalKey();
  bool _isSavingBarcode = false;
  String? _barcodeStatusMessage;
  bool _barcodeStatusSuccess = false;

  @override
  void dispose() {
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

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final price = double.parse(_priceController.text.trim());
    final mrpText = _mrpController.text.trim();
    final tax = double.parse(_taxController.text.trim());
    final stock = int.parse(_stockController.text.trim());
    final request = InventoryItemRequest(
      sku: _skuController.text.trim(),
      name: _nameController.text.trim(),
      price: price,
      mrp: mrpText.isEmpty ? null : double.parse(mrpText),
      taxPercentage: tax,
      stockQuantity: stock,
      unit: _unitController.text.trim().isEmpty ? 'pcs' : _unitController.text.trim(),
      barcode: _barcodeController.text.trim().isEmpty ? null : _barcodeController.text.trim(),
      category: _categoryController.text.trim().isEmpty ? null : _categoryController.text.trim(),
    );
    Navigator.of(context).pop(request);
  }

  Future<void> _scanBarcode() async {
    final code = await showBarcodeScannerSheet(context);
    if (code != null) {
      setState(() {
        _barcodeController.text = code;
        _barcodeStatusMessage = null;
      });
    }
  }

  void _generateBarcode() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    setState(() {
      _barcodeController.text = 'SC$timestamp';
      _barcodeStatusMessage = 'Barcode generated.';
      _barcodeStatusSuccess = true;
    });
  }

  Future<void> _saveBarcodeImage() async {
    final code = _barcodeController.text.trim();
    if (code.isEmpty) {
      setState(() {
        _barcodeStatusMessage = 'Enter or scan a barcode first.';
        _barcodeStatusSuccess = false;
      });
      return;
    }
    final boundary = _barcodePreviewKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) {
      setState(() {
        _barcodeStatusMessage = 'Barcode preview not ready.';
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
      final dir = await getApplicationDocumentsDirectory();
      final folder = Directory('${dir.path}/barcodes');
      await folder.create(recursive: true);
      final safeCode = code.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
      final file = File('${folder.path}/$safeCode-${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(bytes);
      if (!mounted) return;
      setState(() {
        _isSavingBarcode = false;
        _barcodeStatusMessage = 'Saved barcode to ${file.path}';
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

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              controller: scrollController,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Edit ${widget.item.name}', style: Theme.of(context).textTheme.titleLarge),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(_skuController, 'SKU', validator: _requiredValidator),
                  const SizedBox(height: 12),
                  _buildTextField(_nameController, 'Item name', validator: _requiredValidator),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                      _priceController,
                      'Price',
                      keyboardType: TextInputType.number,
                      validator: _numberValidator,
                    ),
                  ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildTextField(
                          _mrpController,
                          'MRP',
                          keyboardType: TextInputType.number,
                          validator: _optionalNumberValidator,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          _taxController,
                          'Tax %',
                          keyboardType: TextInputType.number,
                          validator: _numberValidator,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildTextField(
                          _stockController,
                          'Stock qty',
                          keyboardType: TextInputType.number,
                          validator: _intValidator,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildTextField(_unitController, 'Unit', validator: _requiredValidator),
                  const SizedBox(height: 12),
                  _buildTextField(_categoryController, 'Category (optional)'),
                  const SizedBox(height: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        controller: _barcodeController,
                        decoration: InputDecoration(
                          labelText: 'Barcode',
                          suffixIcon: IconButton(
                            onPressed: _scanBarcode,
                            icon: const Icon(Icons.qr_code_scanner),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 12,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: _generateBarcode,
                            icon: const Icon(Icons.auto_awesome),
                            label: const Text('Generate'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _barcodeController.text.trim().isEmpty || _isSavingBarcode
                                ? null
                                : _saveBarcodeImage,
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
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _save,
                      icon: const Icon(Icons.save),
                      label: const Text('Update item'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  TextFormField _buildTextField(
    TextEditingController controller,
    String label, {
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    ValueChanged<String>? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(labelText: label),
      validator: validator,
      keyboardType: keyboardType,
      onChanged: onChanged,
    );
  }

  String? _requiredValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }

  String? _numberValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return double.tryParse(value.trim()) == null ? 'Enter a number' : null;
  }

  String? _optionalNumberValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }
    return double.tryParse(value.trim()) == null ? 'Enter a number' : null;
  }

  String? _intValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return int.tryParse(value.trim()) == null ? 'Enter a whole number' : null;
  }
}
