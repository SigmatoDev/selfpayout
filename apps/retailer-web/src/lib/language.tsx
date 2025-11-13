'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type SupportedLanguage = 'en' | 'hi';

type TranslationKey =
  | 'welcome'
  | 'billing'
  | 'inventory'
  | 'customers'
  | 'reports'
  | 'collect_payment'
  | 'offline_pending'
  | 'self_checkout';

const translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en: {
    welcome: 'Good day',
    billing: 'Billing',
    inventory: 'Inventory',
    customers: 'Customers',
    reports: 'Reports',
    collect_payment: 'Collect payment',
    offline_pending: 'bills waiting to sync',
    self_checkout: 'Self checkout'
  },
  hi: {
    welcome: 'नमस्ते',
    billing: 'बिलिंग',
    inventory: 'भंडार',
    customers: 'ग्राहक',
    reports: 'रिपोर्ट',
    collect_payment: 'भुगतान प्राप्त करें',
    offline_pending: 'सिंक के लिए बिल लंबित',
    self_checkout: 'स्वयं चेकआउट'
  }
};

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => translations[language][key] ?? key
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
