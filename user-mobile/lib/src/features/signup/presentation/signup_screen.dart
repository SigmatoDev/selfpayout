import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
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
  final _stepKeys = List.generate(3, (_) => GlobalKey<FormState>());
  final _ownerController = TextEditingController();
  final _shopController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _gstController = TextEditingController();
  final _aadharController = TextEditingController();
  final _panController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _gstEnabled = false;
  String _language = 'en';
  int _currentStep = 0;
  bool _isSubmitting = false;
  String? _statusMessage;
  bool _statusSuccess = false;
  double? _addressLat;
  double? _addressLng;
  String? _addressStatus;
  bool _gstVerified = false;
  String? _gstStatus;
  Map<String, String>? _gstInfo;

  PlatformFile? _aadharFile;
  PlatformFile? _panFile;
  Uint8List? _aadharBytes;
  Uint8List? _panBytes;
  _DocumentState _aadharState = const _DocumentState(message: 'Upload Aadhaar document');
  _DocumentState _panState = const _DocumentState(message: 'Upload PAN document');

  bool get _hasPendingUploads => _aadharState.isUploading || _panState.isUploading;

  @override
  void initState() {
    super.initState();
    _gstController.addListener(_resetGstVerification);
    _addressController.addListener(_resetAddressSelection);
  }

  void _resetGstVerification() {
    if (_gstVerified || _gstInfo != null || _gstStatus != null) {
      setState(() {
        _gstVerified = false;
        _gstInfo = null;
        _gstStatus = null;
      });
    }
  }

  void _resetAddressSelection() {
    if (_addressLat != null || _addressLng != null || _addressStatus != null) {
      setState(() {
        _addressLat = null;
        _addressLng = null;
        _addressStatus = null;
      });
    }
  }

  @override
  void dispose() {
    _ownerController.dispose();
    _shopController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _gstController.dispose();
    _aadharController.dispose();
    _panController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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
      _setDocumentState(isAadhar, const _DocumentState(message: 'File exceeds 8MB'));
      return;
    }

    final label = isAadhar ? 'Aadhaar' : 'PAN';
    _setDocumentState(
      isAadhar,
      _DocumentState(isUploading: true, progress: 0.15, message: 'Preparing $label file...'),
    );

    try {
      final rawBytes = await _loadFileBytes(file);
      _setDocumentState(
        isAadhar,
        _DocumentState(isUploading: true, progress: 0.5, message: 'Compressing $label...'),
      );
      final processed = await _compressIfNeeded(rawBytes, file.extension);
      _setDocumentState(
        isAadhar,
        _DocumentState(isUploading: true, progress: 0.85, message: 'Encoding $label...'),
      );

      setState(() {
        if (isAadhar) {
          _aadharFile = file;
          _aadharBytes = processed;
        } else {
          _panFile = file;
          _panBytes = processed;
        }
        _statusMessage = null;
      });

      _setDocumentState(
        isAadhar,
        _DocumentState(isUploading: false, progress: 1, message: '$label ready to submit'),
      );
    } catch (_) {
      _setDocumentState(
        isAadhar,
        _DocumentState(isUploading: false, progress: 0, message: 'Failed to process $label'),
      );
      setState(() {
        _statusMessage = 'Unable to process $label document. Please try again.';
        _statusSuccess = false;
      });
    }
  }

  Future<Uint8List> _loadFileBytes(PlatformFile file) async {
    if (file.bytes != null) {
      return Uint8List.fromList(file.bytes!);
    }
    if (file.path == null) {
      throw Exception('File data unavailable');
    }
    final data = await File(file.path!).readAsBytes();
    return Uint8List.fromList(data);
  }

  Future<Uint8List> _compressIfNeeded(Uint8List bytes, String? extension) async {
    final ext = extension?.toLowerCase();
    if (ext == null || (ext != 'png' && ext != 'jpg' && ext != 'jpeg')) {
      return bytes;
    }
    final compressed = await FlutterImageCompress.compressWithList(
      bytes,
      minWidth: 1280,
      minHeight: 720,
      quality: 70,
    );
    return Uint8List.fromList(compressed);
  }

  Future<DocumentUpload> _buildDocumentPayload(PlatformFile file, Uint8List bytes) async {
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
    if (!_validateAllSteps()) return;
    if (_gstEnabled && _gstController.text.trim().isEmpty) {
      setState(() {
        _statusMessage = 'GST number is required when GST is enabled.';
        _statusSuccess = false;
      });
      return;
    }
    if (_gstEnabled && !_gstVerified) {
      setState(() {
        _statusMessage = 'Please verify GST before submitting.';
        _statusSuccess = false;
      });
      return;
    }
    if (_addressLat == null || _addressLng == null) {
      setState(() {
        _statusMessage = 'Please validate the address on maps.';
        _statusSuccess = false;
      });
      return;
    }
    if (_hasPendingUploads) {
      setState(() {
        _statusMessage = 'Please wait for document uploads to finish.';
        _statusSuccess = false;
      });
      return;
    }
    if (_aadharFile == null || _panFile == null || _aadharBytes == null || _panBytes == null) {
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
        'aadhar': await _buildDocumentPayload(_aadharFile!, _aadharBytes!),
        'pan': await _buildDocumentPayload(_panFile!, _panBytes!),
      };

      final payload = SignupPayload(
        ownerName: _ownerController.text.trim(),
        shopName: _shopController.text.trim(),
        contactEmail: _emailController.text.trim(),
        contactPhone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        gstEnabled: _gstEnabled,
        gstNumber: _gstController.text.trim().isEmpty ? null : _gstController.text.trim(),
        languagePreference: _language,
        aadharNumber: _aadharController.text.trim(),
        panNumber: _panController.text.trim(),
        password: _passwordController.text.trim(),
        documents: documents,
      );

      await ref.read(retailerApiProvider).submitSignup(payload);

      if (mounted) {
        setState(() {
          _statusMessage =
              'Thanks! Your application has been submitted. We will reach out post review.';
          _statusSuccess = true;
          _isSubmitting = false;
          for (var key in _stepKeys) {
            key.currentState?.reset();
          }
          _ownerController.clear();
          _shopController.clear();
          _emailController.clear();
          _phoneController.clear();
          _addressController.clear();
          _gstController.clear();
          _addressLat = null;
          _addressLng = null;
          _addressStatus = null;
          _gstVerified = false;
          _gstStatus = null;
          _gstInfo = null;
          _aadharController.clear();
          _panController.clear();
          _gstEnabled = false;
          _language = 'en';
          _aadharFile = null;
          _panFile = null;
          _aadharBytes = null;
          _panBytes = null;
          _aadharState = const _DocumentState(message: 'Upload Aadhaar document');
          _panState = const _DocumentState(message: 'Upload PAN document');
          _currentStep = 0;
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
    final steps = [
      Step(
        title: const Text('Profile'),
        state: _stepState(0),
        isActive: _currentStep >= 0,
        content: _buildProfileForm(),
      ),
      Step(
        title: const Text('Business'),
        state: _stepState(1),
        isActive: _currentStep >= 1,
        content: _buildBusinessForm(),
      ),
      Step(
        title: const Text('Verification'),
        state: _stepState(2),
        isActive: _currentStep >= 2,
        content: _buildVerificationForm(),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Retailer onboarding'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Expanded(
                child: Stepper(
                  type: StepperType.vertical,
                  currentStep: _currentStep,
                  onStepContinue: _handleContinue,
                  onStepCancel: _handleBack,
                  onStepTapped: _handleStepTapped,
                  controlsBuilder: (context, details) {
                    final isLast = _currentStep == steps.length - 1;
                    return Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Row(
                        children: [
                          ElevatedButton(
                            onPressed: _isSubmitting ? null : details.onStepContinue,
                            child: _isSubmitting && isLast
                                ? const SizedBox(
                                    height: 18,
                                    width: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : Text(isLast ? 'Submit application' : 'Next'),
                          ),
                          const SizedBox(width: 12),
                          if (_currentStep > 0)
                            TextButton(
                              onPressed: _isSubmitting ? null : details.onStepCancel,
                              child: const Text('Back'),
                            ),
                        ],
                      ),
                    );
                  },
                  steps: steps,
                ),
              ),
              if (_statusMessage != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    _statusMessage!,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: _statusSuccess ? Colors.teal : Colors.redAccent),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  StepState _stepState(int step) {
    if (_currentStep > step) return StepState.complete;
    if (_currentStep == step) return StepState.editing;
    return StepState.indexed;
  }

  void _handleContinue() {
    final isLast = _currentStep == _stepKeys.length - 1;
    if (!_validateStep(_currentStep)) return;
    if (_currentStep == 1 && (_addressLat == null || _addressLng == null)) {
      setState(() {
        _statusMessage = 'Please validate the address on maps.';
        _statusSuccess = false;
      });
      return;
    }
    if (_currentStep == 1 && _gstEnabled && !_gstVerified) {
      setState(() {
        _statusMessage = 'Please verify GST before continuing.';
        _statusSuccess = false;
      });
      return;
    }
    if (_hasPendingUploads) {
      setState(() {
        _statusMessage = 'Please wait for document uploads to finish.';
        _statusSuccess = false;
      });
      return;
    }
    if (isLast) {
      _submit();
    } else {
      setState(() => _currentStep += 1);
    }
  }

  void _handleBack() {
    if (_currentStep == 0) return;
    setState(() => _currentStep -= 1);
  }

  void _handleStepTapped(int step) {
    if (step > _currentStep && !_validateStep(_currentStep)) {
      return;
    }
    if (_isSubmitting) return;
    setState(() => _currentStep = step);
  }

  bool _validateStep(int index) {
    final formState = _stepKeys[index].currentState;
    return formState?.validate() ?? true;
  }

  bool _validateAllSteps() {
    for (var i = 0; i < _stepKeys.length; i += 1) {
      if (!_validateStep(i)) {
        setState(() => _currentStep = i);
        return false;
      }
    }
    return true;
  }

  Widget _buildProfileForm() {
    return Form(
      key: _stepKeys[0],
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
            validator: _emailValidator,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _phoneController,
            label: 'Contact phone',
            keyboardType: TextInputType.phone,
            validator: _phoneValidator,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          ),
        ],
      ),
    );
  }

  Widget _buildBusinessForm() {
    return Form(
      key: _stepKeys[1],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField(
            controller: _addressController,
            label: 'Registered address',
            maxLines: 3,
            validator: _requiredValidator,
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Validate address on maps', style: TextStyle(fontSize: 12, color: Colors.grey)),
              TextButton.icon(
                onPressed: _searchAddress,
                icon: const Icon(Icons.map_outlined, size: 18),
                label: const Text('Search'),
              ),
            ],
          ),
          if (_addressStatus != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                _addressStatus!,
                style: TextStyle(
                  fontSize: 12,
                  color: (_addressLat != null && _addressLng != null) ? Colors.green : Colors.redAccent,
                ),
              ),
            ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _gstEnabled,
            title: const Text('GST registered'),
            subtitle: const Text('Enable if you charge GST on invoices'),
            onChanged: (value) => setState(() {
              _gstEnabled = value;
              _gstVerified = false;
              _gstInfo = null;
              _gstStatus = null;
            }),
          ),
          const SizedBox(height: 8),
          _buildTextField(
            controller: _gstController,
            label: 'GST number',
            enabled: _gstEnabled,
          ),
          if (_gstEnabled)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Verify GST details', style: TextStyle(fontSize: 12, color: Colors.grey)),
                TextButton.icon(
                  onPressed: _verifyGst,
                  icon: const Icon(Icons.verified_outlined, size: 18),
                  label: const Text('Verify'),
                ),
              ],
            ),
          if (_gstStatus != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                _gstStatus!,
                style: TextStyle(
                  fontSize: 12,
                  color: _gstVerified ? Colors.green : Colors.redAccent,
                ),
              ),
            ),
          if (_gstInfo != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Legal name: ${_gstInfo!['legalName'] ?? '-'}'),
                  Text('Trade name: ${_gstInfo!['tradeName'] ?? '-'}'),
                  Text('Status: ${_gstInfo!['status'] ?? '-'}'),
                  Text('State: ${_gstInfo!['state'] ?? '-'}'),
                ],
              ),
            ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _language,
            decoration: const InputDecoration(labelText: 'Language preference'),
            items: const [
              DropdownMenuItem(value: 'en', child: Text('English')),
              DropdownMenuItem(value: 'hi', child: Text('हिन्दी')),
              DropdownMenuItem(value: 'ka', child: Text('ಕನ್ನಡ')),
            ],
            onChanged: (value) => setState(() => _language = value ?? 'en'),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationForm() {
    return Form(
      key: _stepKeys[2],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField(
            controller: _aadharController,
            label: 'Aadhaar number',
            keyboardType: TextInputType.number,
            validator: _aadhaarValidator,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          ),
          const SizedBox(height: 16),
          _buildUploader(
            label: 'Upload Aadhaar (PDF / Image)',
            fileName: _aadharFile?.name,
            onTap: () => _pickDocument(true),
            state: _aadharState,
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
            state: _panState,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _passwordController,
            label: 'Set a password',
            obscureText: true,
            validator: _passwordValidator,
          ),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _confirmPasswordController,
            label: 'Confirm password',
            obscureText: true,
            validator: _confirmPasswordValidator,
          ),
        ],
      ),
    );
  }

  TextFormField _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool enabled = true,
    bool obscureText = false,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      enabled: enabled,
      obscureText: obscureText,
      decoration: InputDecoration(labelText: label),
      validator: validator,
      inputFormatters: inputFormatters,
    );
  }

  Widget _buildUploader({
    required String label,
    required VoidCallback onTap,
    required _DocumentState state,
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
                  if (fileName != null)
                    Row(
                      children: [
                        Icon(Icons.check_circle, size: 16, color: Colors.green.shade600),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            fileName,
                            style: const TextStyle(fontSize: 12, color: Colors.green),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    )
                  else
                    const Text(
                      'Tap to choose a file (max 8MB)',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  const SizedBox(height: 8),
                  if (state.isUploading)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LinearProgressIndicator(
                          value: state.progress > 0 && state.progress <= 1 ? state.progress : null,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          state.message ?? 'Uploading...',
                          style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.primary),
                        ),
                      ],
                    )
                  else if (state.message != null)
                    Text(
                      state.message!,
                      style: TextStyle(
                        fontSize: 12,
                        color: fileName != null ? Colors.green : Colors.grey,
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

  void _setDocumentState(bool isAadhar, _DocumentState state) {
    setState(() {
      if (isAadhar) {
        _aadharState = state;
      } else {
        _panState = state;
      }
    });
  }

  String? _requiredValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }

  String? _emailValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  String? _phoneValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final digits = value.replaceAll(RegExp(r'\s+'), '');
    final phoneRegex = RegExp(r'^[6-9]\d{9}$');
    if (!phoneRegex.hasMatch(digits)) {
      return 'Enter a valid 10-digit phone number';
    }
    return null;
  }

  String? _aadhaarValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Aadhaar number is required';
    }
    final digits = value.replaceAll(RegExp(r'\s+'), '');
    final aadhaarRegex = RegExp(r'^[2-9]\d{11}$');
    if (!aadhaarRegex.hasMatch(digits)) {
      return 'Enter a valid 12-digit Aadhaar number';
    }
    return null;
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Password is required';
    }
    if (value.trim().length < 8) {
      return 'Minimum 8 characters';
    }
    return null;
  }

  String? _confirmPasswordValidator(String? value) {
    if (value != _passwordController.text.trim()) {
      return 'Passwords do not match';
    }
    return null;
  }

  void _searchAddress() {
    final address = _addressController.text.trim();
    if (address.isEmpty) {
      setState(() {
        _addressStatus = 'Enter an address before searching.';
      });
      return;
    }
    setState(() {
      _addressLat = 12.9716;
      _addressLng = 77.5946;
      _addressStatus = 'Location pinned at 12.9716, 77.5946 (demo).';
    });
  }

  void _verifyGst() {
    final gst = _gstController.text.trim().toUpperCase();
    if (gst.isEmpty) {
      setState(() {
        _gstVerified = false;
        _gstInfo = null;
        _gstStatus = 'Enter a GST number to verify.';
      });
      return;
    }
    final gstRegex = RegExp(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$');
    if (!gstRegex.hasMatch(gst)) {
      setState(() {
        _gstVerified = false;
        _gstInfo = null;
        _gstStatus = 'Invalid GST format.';
      });
      return;
    }
    setState(() {
      _gstVerified = true;
      _gstStatus = 'GST verified (demo).';
      _gstInfo = {
        'legalName': 'Demo Retailer Pvt Ltd',
        'tradeName': _shopController.text.trim().isEmpty ? 'Demo Retailer' : _shopController.text.trim(),
        'status': 'Active',
        'state': 'Karnataka',
      };
    });
  }
}

class _DocumentState {
  const _DocumentState({
    this.isUploading = false,
    this.progress = 0,
    this.message,
  });

  final bool isUploading;
  final double progress;
  final String? message;
}
