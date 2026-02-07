import 'package:shared_preferences/shared_preferences.dart';

class TokenStorage {
  TokenStorage(this._prefs);

  static const _key = 'selfcheckout_user_token';

  final SharedPreferences _prefs;

  String? get token => _prefs.getString(_key);

  bool get hasToken => token != null && token!.isNotEmpty;

  Future<void> save(String token) => _prefs.setString(_key, token);

  Future<void> clear() => _prefs.remove(_key);
}
