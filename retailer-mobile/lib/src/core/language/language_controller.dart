import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum SupportedLanguage { en, hi }

extension SupportedLanguageX on SupportedLanguage {
  String get code => switch (this) {
        SupportedLanguage.en => 'en',
        SupportedLanguage.hi => 'hi',
      };

  String get toggleLabel => switch (this) {
        SupportedLanguage.en => 'हिन्दी',
        SupportedLanguage.hi => 'English',
      };
}

enum TranslationKey {
  welcome,
  billing,
  inventory,
  customers,
  reports,
  collectPayment,
  offlinePending,
  selfCheckout,
}

const Map<SupportedLanguage, Map<TranslationKey, String>> _translations = {
  SupportedLanguage.en: {
    TranslationKey.welcome: 'Good day',
    TranslationKey.billing: 'Billing',
    TranslationKey.inventory: 'Inventory',
    TranslationKey.customers: 'Customers',
    TranslationKey.reports: 'Reports',
    TranslationKey.collectPayment: 'Collect payment',
    TranslationKey.offlinePending: 'bills waiting to sync',
    TranslationKey.selfCheckout: 'Self checkout',
  },
  SupportedLanguage.hi: {
    TranslationKey.welcome: 'नमस्ते',
    TranslationKey.billing: 'बिलिंग',
    TranslationKey.inventory: 'भंडार',
    TranslationKey.customers: 'ग्राहक',
    TranslationKey.reports: 'रिपोर्ट',
    TranslationKey.collectPayment: 'भुगतान प्राप्त करें',
    TranslationKey.offlinePending: 'सिंक के लिए बिल लंबित',
    TranslationKey.selfCheckout: 'स्वयं चेकआउट',
  },
};

class LanguageStrings {
  const LanguageStrings(this.language);

  final SupportedLanguage language;

  String label(TranslationKey key) => _translations[language]?[key] ?? key.name;
}

class LanguageController extends StateNotifier<SupportedLanguage> {
  LanguageController(this._prefs) : super(_initialLanguage(_prefs));

  static const _storageKey = 'selfcheckout_lang';

  final SharedPreferences _prefs;

  void toggle() {
    final next = state == SupportedLanguage.en ? SupportedLanguage.hi : SupportedLanguage.en;
    setLanguage(next);
  }

  void setLanguage(SupportedLanguage language) {
    state = language;
    _prefs.setString(_storageKey, language.code);
  }

  static SupportedLanguage _initialLanguage(SharedPreferences prefs) {
    final stored = prefs.getString(_storageKey);
    if (stored == SupportedLanguage.hi.code) {
      return SupportedLanguage.hi;
    }
    return SupportedLanguage.en;
  }
}
