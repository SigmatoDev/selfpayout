import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../models/models.dart';

class OfflineInvoiceEntry {
  OfflineInvoiceEntry({
    required this.id,
    required this.payload,
    required this.createdAt,
  });

  final String id;
  final OfflineInvoicePayload payload;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'createdAt': createdAt.toIso8601String(),
        'payload': payload.toJson(),
      };

  factory OfflineInvoiceEntry.fromJson(Map<String, dynamic> json) => OfflineInvoiceEntry(
        id: json['id'] as String,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
        payload: OfflineInvoicePayload.fromJson(json['payload'] as Map<String, dynamic>),
      );
}

class OfflineQueueService {
  OfflineQueueService(this._prefs);

  static const _storageKey = 'selfcheckout_offline_invoices';
  static const _uuid = Uuid();

  final SharedPreferences _prefs;

  List<OfflineInvoiceEntry> readQueue() {
    final raw = _prefs.getString(_storageKey);
    if (raw == null) return const <OfflineInvoiceEntry>[];
    try {
      final decoded = jsonDecode(raw) as List<dynamic>;
      return decoded
          .map((entry) => OfflineInvoiceEntry.fromJson(entry as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const <OfflineInvoiceEntry>[];
    }
  }

  List<OfflineInvoiceEntry> enqueue(OfflineInvoicePayload payload) {
    final queue = [...readQueue()];
    queue.add(
      OfflineInvoiceEntry(
        id: _uuid.v4(),
        payload: payload,
        createdAt: DateTime.now(),
      ),
    );
    _write(queue);
    return queue;
  }

  List<OfflineInvoiceEntry> clear() {
    _prefs.remove(_storageKey);
    return const <OfflineInvoiceEntry>[];
  }

  List<OfflineInvoiceEntry> remove(String id) {
    final queue = readQueue().where((entry) => entry.id != id).toList();
    _write(queue);
    return queue;
  }

  void _write(List<OfflineInvoiceEntry> queue) {
    final payload = queue.map((entry) => entry.toJson()).toList();
    _prefs.setString(_storageKey, jsonEncode(payload));
  }
}

class OfflineQueueController extends StateNotifier<List<OfflineInvoiceEntry>> {
  OfflineQueueController(this._service) : super(_service.readQueue());

  final OfflineQueueService _service;

  void enqueue(OfflineInvoicePayload payload) {
    state = _service.enqueue(payload);
  }

  void clear() {
    state = _service.clear();
  }

  void remove(String id) {
    state = _service.remove(id);
  }

  void refresh() {
    state = _service.readQueue();
  }
}
