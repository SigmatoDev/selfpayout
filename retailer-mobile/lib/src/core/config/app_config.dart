class AppConfig {
  static const _base = String.fromEnvironment(
    'API_BASE_URL',
    // defaultValue: 'http://localhost:4000/api',
    defaultValue: 'https://api.selfpayout.com/api',
    
  );

  static String get apiBaseUrl => _base.endsWith('/') ? _base : '$_base/';
}
