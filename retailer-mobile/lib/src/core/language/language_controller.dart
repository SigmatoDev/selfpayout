import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum SupportedLanguage { en, hi, ka }

extension SupportedLanguageX on SupportedLanguage {
  String get code => switch (this) {
        SupportedLanguage.en => 'en',
        SupportedLanguage.hi => 'hi',
        SupportedLanguage.ka => 'ka',
      };

  String get toggleLabel => switch (this) {
        SupportedLanguage.en => 'हिन्दी',
        SupportedLanguage.hi => 'ಕನ್ನಡ',
        SupportedLanguage.ka => 'English',
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
  SupportedLanguage.ka: {
    TranslationKey.welcome: 'ನಮಸ್ಕಾರ',
    TranslationKey.billing: 'ಬಿಲ್ಲಿಂಗ್',
    TranslationKey.inventory: 'ಸಾಗರಣೆ',
    TranslationKey.customers: 'ಗ್ರಾಹಕರು',
    TranslationKey.reports: 'ವರದಿಗಳು',
    TranslationKey.collectPayment: 'ಪಾವತಿ ಸಂಗ್ರಹಣೆ',
    TranslationKey.offlinePending: 'ಸಿಂಕ್‌ಗೆ ಕಾಯುವ ಬಿಲ್ಲುಗಳು',
    TranslationKey.selfCheckout: 'ಸ್ವಯಂ ಪಾವತಿ',
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
    final all = SupportedLanguage.values;
    final currentIndex = all.indexOf(state);
    final next = all[(currentIndex + 1) % all.length];
    setLanguage(next);
  }

  void setLanguage(SupportedLanguage language) {
    state = language;
    _prefs.setString(_storageKey, language.code);
  }

  static SupportedLanguage _initialLanguage(SharedPreferences prefs) {
    final stored = prefs.getString(_storageKey);
    if (stored != null) {
      for (final value in SupportedLanguage.values) {
        if (value.code == stored) {
          return value;
        }
      }
    }
    return SupportedLanguage.en;
  }
}
