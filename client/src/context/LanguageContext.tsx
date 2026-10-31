import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    subscriptions: 'Subscriptions',
    invoices: 'Invoices',
    payments: 'Payments',
    products: 'Products & Plans',
    customers: 'Customers',
    staff: 'Staff Management',
    ai_copilot: 'AI Intelligence',
    analytics: 'Analytics',
    quotations: 'Quotations',
    coupons: 'Coupons & Deals',
    audit_logs: 'Audit Logs',
    settings: 'Settings',
    logout: 'Log Out',
    mrr: 'Monthly Recurring Revenue',
    arr: 'Annual Recurring Revenue',
    churn_rate: 'Churn Rate',
    active_subs: 'Active Subscriptions',
    total_rev: 'Total Revenue',
    welcome_back: 'Welcome back',
  },
  es: {
    dashboard: 'Panel de Control',
    subscriptions: 'Suscripciones',
    invoices: 'Facturas',
    payments: 'Pagos',
    products: 'Productos y Planes',
    customers: 'Clientes',
    staff: 'Gestión de Personal',
    ai_copilot: 'Inteligencia IA',
    analytics: 'Analítica',
    quotations: 'Cotizaciones',
    coupons: 'Cupones',
    audit_logs: 'Registro de Auditoría',
    settings: 'Ajustes',
    logout: 'Cerrar Sesión',
    mrr: 'Ingresos Recurrentes Mensuales',
    arr: 'Ingresos Recurrentes Anuales',
    churn_rate: 'Tasa de Cancelación',
    active_subs: 'Suscripciones Activas',
    total_rev: 'Ingresos Totales',
    welcome_back: 'Bienvenido de nuevo',
  },
  fr: {
    dashboard: 'Tableau de Bord',
    subscriptions: 'Abonnements',
    invoices: 'Factures',
    payments: 'Paiements',
    products: 'Produits et Plans',
    customers: 'Clients',
    staff: 'Équipe',
    ai_copilot: 'Intelligence IA',
    analytics: 'Analytique',
    quotations: 'Devis',
    coupons: 'Coupons',
    audit_logs: "Journaux d'Audit",
    settings: 'Paramètres',
    logout: 'Se Déconnecter',
    mrr: 'Revenu Mensuel Récurrent',
    arr: 'Revenu Annuel Récurrent',
    churn_rate: "Taux d'Attrition",
    active_subs: 'Abonnements Actifs',
    total_rev: 'Revenu Total',
    welcome_back: 'Bon retour',
  },
  de: {
    dashboard: 'Übersicht',
    subscriptions: 'Abonnements',
    invoices: 'Rechnungen',
    payments: 'Zahlungen',
    products: 'Produkte & Pläne',
    customers: 'Kunden',
    staff: 'Mitarbeiter',
    ai_copilot: 'KI-Intelligenz',
    analytics: 'Analysen',
    quotations: 'Angebote',
    coupons: 'Gutscheine',
    audit_logs: 'Audit-Protokolle',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    mrr: 'Monatlich Wiederkehrender Umsatz',
    arr: 'Jährlich Wiederkehrender Umsatz',
    churn_rate: 'Abwanderungsrate',
    active_subs: 'Aktive Abonnements',
    total_rev: 'Gesamtumsatz',
    welcome_back: 'Willkommen zurück',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    subscriptions: 'सब्सक्रिप्शन',
    invoices: 'इनवॉइस',
    payments: 'भुगतान',
    products: 'उत्पाद और प्लान',
    customers: 'ग्राहक',
    staff: 'कर्मचारी प्रबंधन',
    ai_copilot: 'एआई बुद्धिमत्ता',
    analytics: 'विश्लेषण',
    quotations: 'कोटेशन',
    coupons: 'कूपन',
    audit_logs: 'ऑडिट लॉग्स',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    mrr: 'मासिक आवर्ती राजस्व (MRR)',
    arr: 'वार्षिक आवर्ती राजस्व (ARR)',
    churn_rate: 'चर्न रेट',
    active_subs: 'सक्रिय सब्सक्रिप्शन',
    total_rev: 'कुल राजस्व',
    welcome_back: 'वापसी पर स्वागत है',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('subflow_lang');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('subflow_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
