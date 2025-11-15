import 'package:flutter/material.dart';

class AppTheme {
  static const _brandPrimary = Color(0xFFD00000);
  static const _brandAccent = Color(0xFFFF6B6B);
  static const _softSurface = Color(0xFFFFF3F3);
  static const _nightSurface = Color(0xFF160202);

  static ThemeData get lightTheme {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(seedColor: _brandPrimary, brightness: Brightness.light),
    );
    return base.copyWith(
      scaffoldBackgroundColor: _softSurface,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 6,
        shadowColor: Colors.black.withValues(alpha: 0.08),
        margin: EdgeInsets.zero,
        surfaceTintColor: Colors.white,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, letterSpacing: 0.2),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          minimumSize: const Size(0, 48),
          shadowColor: _brandPrimary.withValues(alpha: 0.35),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: _brandPrimary,
        unselectedItemColor: Color(0xFF9CA3AF),
        showUnselectedLabels: true,
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _brandPrimary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: _brandAccent,
        foregroundColor: Colors.white,
      ),
    );
  }

  static ThemeData get darkTheme {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(seedColor: _brandAccent, brightness: Brightness.dark),
    );
    return base.copyWith(
      scaffoldBackgroundColor: _nightSurface,
      cardTheme: CardThemeData(
        color: const Color(0xFF111C32),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 4,
        shadowColor: Colors.black.withValues(alpha: 0.4),
        margin: EdgeInsets.zero,
        surfaceTintColor: const Color(0xFF18213D),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF141C31),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF1E293B)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _brandAccent, width: 1.2),
        ),
        labelStyle: const TextStyle(fontSize: 13),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _brandAccent,
          foregroundColor: Colors.black87,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          minimumSize: const Size(0, 48),
          shadowColor: Colors.black.withValues(alpha: 0.3),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: _brandAccent,
        unselectedItemColor: Colors.white70,
        backgroundColor: Color(0xFF0F0F0F),
        showUnselectedLabels: true,
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _brandAccent,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: _brandAccent,
        foregroundColor: Colors.black,
      ),
    );
  }
}
