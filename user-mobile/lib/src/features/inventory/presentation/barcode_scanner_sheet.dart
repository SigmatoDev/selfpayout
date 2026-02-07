import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

Future<String?> showBarcodeScannerSheet(BuildContext context) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.black,
    builder: (_) => const _BarcodeScannerSheet(),
  );
}

class _BarcodeScannerSheet extends StatefulWidget {
  const _BarcodeScannerSheet();

  @override
  State<_BarcodeScannerSheet> createState() => _BarcodeScannerSheetState();
}

class _BarcodeScannerSheetState extends State<_BarcodeScannerSheet> {
  final MobileScannerController _controller = MobileScannerController();
  String? _capturedCode;
  bool _locked = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_locked) return;
    for (final barcode in capture.barcodes) {
      final value = barcode.rawValue;
      if (value != null && value.isNotEmpty) {
        setState(() {
          _capturedCode = value;
          _locked = true;
        });
        break;
      }
    }
  }

  void _useCode() {
    final code = _capturedCode;
    if (code == null) return;
    Navigator.of(context).pop(code);
  }

  void _scanAgain() {
    setState(() {
      _capturedCode = null;
      _locked = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          top: 16,
          left: 16,
          right: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 3,
              width: 60,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Scan barcode',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 12),
            AspectRatio(
              aspectRatio: 3 / 4,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    MobileScanner(
                      controller: _controller,
                      fit: BoxFit.cover,
                      overlayBuilder: (context, constraints) => _ScannerOverlay(code: _capturedCode),
                      onDetect: _onDetect,
                    ),
                    if (_capturedCode != null)
                      Container(
                        color: Colors.black.withValues(alpha: 0.45),
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check_circle, color: Colors.white, size: 48),
                            const SizedBox(height: 8),
                            Text(
                              _capturedCode!,
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _capturedCode == null ? null : _scanAgain,
                    icon: const Icon(Icons.restart_alt),
                    label: const Text('Scan again'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _capturedCode == null ? null : _useCode,
                    icon: const Icon(Icons.check),
                    label: const Text('Use code'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _ScannerOverlay extends StatelessWidget {
  const _ScannerOverlay({this.code});

  final String? code;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: true,
      child: Container(
        decoration: ShapeDecoration(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: (code == null ? Colors.white : Colors.greenAccent).withValues(alpha: 0.7),
              width: 3,
            ),
          ),
        ),
      ),
    );
  }
}
