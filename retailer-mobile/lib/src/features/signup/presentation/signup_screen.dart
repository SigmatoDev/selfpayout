import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_client.dart';
import '../../../models/models.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _ownerController = TextEditingController();
  final _shopController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _gstController = TextEditingController();
  final _planController = TextEditingController();
  final _aadharController = TextEditingController();
  final _panController = TextEditingController();

  bool _gstEnabled = false;
  String _language = 'en';
  bool _isSubmitting = false;
  String? _statusMessage;
  bool _statusSuccess = false;

  PlatformFile? _aadharFile;
  PlatformFile? _panFile;

  @override
  void dispose() {
    _ownerController.dispose();
    _shopController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _gstController.dispose();
    _planController.dispose();
    _aadharController.dispose();
    _panController.dispose();
    super.dispose();
  }

  Future<void> _pickDocument(bool isAadhar) async {
    final result = await FilePicker.platform.pickFiles(
      withData: true,
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'png', 'jpg', 'jpeg'],
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    if ((file.size / (1024 * 1024)) > 8) {
      setState(() {
        _statusMessage = 'Selected file exceeds 8MB.';
        _statusSuccess = false;
      });
      return;
    }
    setState(() {
      if (isAadhar) {
        _aadharFile = file;
      } else {
        _panFile = file;
      }
      _statusMessage = null;
    });
  }

  Future<DocumentUpload> _buildDocumentPayload(PlatformFile file) async {
    final bytes = file.bytes ??
        await File(file.path!).readAsBytes();
    final base64Data = base64Encode(bytes);
    final ext = file.extension?.toLowerCase();
    final contentType = switch (ext) {
      'png' => 'image/png',
      'jpg' || 'jpeg' => 'image/jpeg',
      'pdf' => 'application/pdf',
      _ => 'application/octet-stream',
    };
    return DocumentUpload(
      fileName: file.name,
      contentType: contentType,
      data: base64Data,
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_gstEnabled && _gstController.text.trim().isEmpty) {
      setState(() {
        _statusMessage = 'GST number is required when GST is enabled.';
        _statusSuccess = false;
      });
      return;
    }
    if (_aadharFile == null || _panFile == null) {
      setState(() {
        _statusMessage = 'Please upload Aadhaar and PAN documents.';
        _statusSuccess = false;
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _statusMessage = null;
    });

    try {
      final documents = {
        'aadhar': await _buildDocumentPayload(_aadharFile!),
        'pan': await _buildDocumentPayload(_panFile!),
      };

      final payload = SignupPayload(
        ownerName: _ownerController.text.trim(),
        shopName: _shopController.text.trim(),
        contactEmail: _emailController.text.trim(),
        contactPhone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        gstEnabled: _gstEnabled,
        gstNumber: _gstController.text.trim().isEmpty ? null : _gstController.text.trim(),
        subscriptionPlanId: _planController.text.trim().isEmpty ? null : _planController.text.trim(),
        languagePreference: _language,
        aadharNumber: _aadharController.text.trim(),
        panNumber: _panController.text.trim(),
        documents: documents,
      );

      await ref.read(retailerApiProvider).submitSignup(payload);

      if (mounted) {
        setState(() {
          _statusMessage =
              'Thanks! Your application has been submitted. We will reach out post review.';
          _statusSuccess = true;
          _isSubmitting = false;
          _formKey.currentState?.reset();
          _gstEnabled = false;
          _language = 'en';
          _aadharFile = null;
          _panFile = null;
        });
      }
    } on ApiException catch (error) {
      setState(() {
        _statusMessage = error.message;
        _statusSuccess = false;
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Retailer onboarding'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Share your business details and documents. A success specialist will review and enable access.',
                  style: TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 24),
                _buildTextField(
                  controller: _ownerController,
                  label: 'Owner name',
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _shopController,
                  label: 'Store / brand name',
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _emailController,
                  label: 'Contact email',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Required';
                    if (!value.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _phoneController,
                  label: 'Contact phone',
                  keyboardType: TextInputType.phone,
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _addressController,
                  label: 'Registered address',
                  maxLines: 3,
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _gstEnabled,
                  title: const Text('GST Registered'),
                  subtitle: const Text('Enable if you charge GST on invoices'),
                  onChanged: (value) => setState(() => _gstEnabled = value),
                ),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _gstController,
                  label: 'GST number',
                  enabled: _gstEnabled,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _language,
                  items: const [
                    DropdownMenuItem(value: 'en', child: Text('English')),
                    DropdownMenuItem(value: 'hi', child: Text('हिन्दी')),
                    DropdownMenuItem(value: 'ka', child: Text('ಕನ್ನಡ')),
                  ],
                  decoration: const InputDecoration(labelText: 'Language preference'),
                  onChanged: (value) => setState(() => _language = value ?? 'en'),
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _planController,
                  label: 'Subscription plan (optional)',
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _aadharController,
                  label: 'Aadhaar number',
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 16),
                _buildUploader(
                  label: 'Upload Aadhaar (PDF / Image)',
                  fileName: _aadharFile?.name,
                  onTap: () => _pickDocument(true),
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _panController,
                  label: 'PAN number',
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 16),
                _buildUploader(
                  label: 'Upload PAN (PDF / Image)',
                  fileName: _panFile?.name,
                  onTap: () => _pickDocument(false),
                ),
                const SizedBox(height: 24),
                if (_statusMessage != null)
                  Text(
                    _statusMessage!,
                    style: TextStyle(
                      color: _statusSuccess ? Colors.teal : Colors.redAccent,
                    ),
                  ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                        )
                      : const Text('Submit application'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  TextFormField _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool enabled = true,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      enabled: enabled,
      decoration: InputDecoration(labelText: label),
      validator: validator,
    );
  }

  Widget _buildUploader({
    required String label,
    required VoidCallback onTap,
    String? fileName,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Row(
          children: [
            const Icon(Icons.upload_file_rounded),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    fileName ?? 'Tap to choose a file (max 8MB)',
                    style: TextStyle(
                      fontSize: 12,
                      color: fileName == null ? Colors.grey : Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String? _requiredValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }
}
