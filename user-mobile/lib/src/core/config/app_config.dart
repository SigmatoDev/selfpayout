class AppConfig {
  static const _base = String.fromEnvironment(
    'API_BASE_URL',
     defaultValue: 'http://localhost:4000/api',
   // defaultValue: 'https://api.selfpayout.com/api',
    
  );
  static const _deepLinkBase = String.fromEnvironment(
    'DEEPLINK_BASE',
    defaultValue: 'selfcheckout://table',
  );

  static String get apiBaseUrl => _base.endsWith('/') ? _base : '$_base/';
  static String get deepLinkBase => _deepLinkBase;
}
