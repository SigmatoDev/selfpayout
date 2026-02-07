import 'package:flutter/material.dart';

class AppTheme {
  static const _brandPrimary = Color(0xFFFF6B8A);
  static const _brandSecondary = Color(0xFFFFB6C8);
  static const _brandTertiary = Color(0xFFFFD2C2);
  static const _softSurface = Color(0xFFFFFFFF);
  static const _softBackground = Color(0xFFFFF5EC);
  static const _nightSurface = Color(0xFF1C1618);
  static const _nightBackground = Color(0xFF120E10);

  static ThemeData get lightTheme {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: _brandPrimary,
        onPrimary: Colors.white,
        secondary: _brandSecondary,
        onSecondary: Color(0xFF3D1B26),
        tertiary: _brandTertiary,
        onTertiary: Color(0xFF4A2A1A),
        error: Color(0xFFE5484D),
        onError: Colors.white,
        background: _softBackground,
        onBackground: Color(0xFF1E1B16),
        surface: _softSurface,
        onSurface: Color(0xFF1E1B16),
        surfaceVariant: Color(0xFFFFE6DA),
        onSurfaceVariant: Color(0xFF5B4B44),
        outline: Color(0xFFE7C5B9),
        shadow: Colors.black,
        inverseSurface: Color(0xFF2F2A27),
        onInverseSurface: Color(0xFFF8F2EE),
        inversePrimary: Color(0xFFFFB6C8),
      ),
    );
    return base.copyWith(
      scaffoldBackgroundColor: _softBackground,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      cardTheme: CardThemeData(
        color: _softSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.04),
        margin: EdgeInsets.zero,
        surfaceTintColor: _softSurface,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _softSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFF1D7CC)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _brandPrimary, width: 1.2),
        ),
        labelStyle: const TextStyle(fontSize: 13),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _brandPrimary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, letterSpacing: 0.2),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          minimumSize: const Size(0, 48),
          shadowColor: _brandPrimary.withValues(alpha: 0.35),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: _brandPrimary,
        unselectedItemColor: Color(0xFF9D7B73),
        showUnselectedLabels: true,
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _brandPrimary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: _brandSecondary,
        foregroundColor: Color(0xFF3D1B26),
      ),
    );
  }

  static ThemeData get darkTheme {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme(
        brightness: Brightness.dark,
        primary: Color(0xFFFF8FA8),
        onPrimary: Color(0xFF2E111B),
        secondary: Color(0xFFFFB6C8),
        onSecondary: Color(0xFF2F111B),
        tertiary: Color(0xFFFFD2C2),
        onTertiary: Color(0xFF3D2317),
        error: Color(0xFFFF8A8A),
        onError: Color(0xFF320D0D),
        background: _nightBackground,
        onBackground: Color(0xFFF4EAE5),
        surface: _nightSurface,
        onSurface: Color(0xFFF4EAE5),
        surfaceVariant: Color(0xFF2A2225),
        onSurfaceVariant: Color(0xFFE1C5BB),
        outline: Color(0xFF7A5C52),
        shadow: Colors.black,
        inverseSurface: Color(0xFFEDE3DE),
        onInverseSurface: Color(0xFF1F1A1C),
        inversePrimary: Color(0xFFFF6B8A),
      ),
    );
    return base.copyWith(
      scaffoldBackgroundColor: _nightBackground,
      cardTheme: CardThemeData(
        color: const Color(0xFF20171A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 4,
        shadowColor: Colors.black.withValues(alpha: 0.4),
        margin: EdgeInsets.zero,
        surfaceTintColor: const Color(0xFF2A1C20),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF241B1F),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF3A2A2F)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFFF8FA8), width: 1.2),
        ),
        labelStyle: const TextStyle(fontSize: 13),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFFF8FA8),
          foregroundColor: const Color(0xFF2E111B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          minimumSize: const Size(0, 48),
          shadowColor: Colors.black.withValues(alpha: 0.3),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: Color(0xFFFF8FA8),
        unselectedItemColor: Color(0xFFDDC1B6),
        backgroundColor: Color(0xFF171114),
        showUnselectedLabels: true,
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: const Color(0xFFFFB6C8),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: Color(0xFFFFB6C8),
        foregroundColor: Color(0xFF2E111B),
      ),
    );
  }
}
