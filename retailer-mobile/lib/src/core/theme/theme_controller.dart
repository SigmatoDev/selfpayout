import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeController extends StateNotifier<ThemeMode> {
  ThemeController(this._prefs) : super(_initialTheme(_prefs));

  static const _storageKey = 'selfcheckout_theme_mode';

  final SharedPreferences _prefs;

  void toggle() {
    final next = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = next;
    _prefs.setString(_storageKey, next.name);
  }

  void setMode(ThemeMode mode) {
    state = mode;
    _prefs.setString(_storageKey, mode.name);
  }

  static ThemeMode _initialTheme(SharedPreferences prefs) {
    final stored = prefs.getString(_storageKey);
    switch (stored) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.light;
    }
  }
}
