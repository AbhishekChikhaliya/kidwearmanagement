import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'en' | 'gu';

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    suppliers: 'Suppliers',
    sales: 'Sales',
    reports: 'Reports',
    settings: 'Settings',
    categories: 'Categories',
    // Dashboard
    totalProducts: 'Total Products',
    totalCategories: 'Total Categories',
    lowStockItems: 'Low Stock Items',
    todaysSales: 'Today\'s Sales',
    lowStockAlerts: 'Low Stock Alerts',
    stockDistribution: 'Stock Distribution',
    salesTrend: 'Sales Trend (Last 7 Days)',
    recentOrders: 'Recent Purchase Orders',
    piecesLeft: 'pieces left',
    noLowStock: 'All stock levels are healthy!',
    noRecentOrders: 'No recent orders',
    // Auth
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    signUp: 'Sign Up',
    signingUp: 'Signing up...',
    noAccount: 'Don\'t have an account?',
    haveAccount: 'Already have an account?',
    appName: 'KidWear Retail Manager',
    appTagline: 'Smart inventory management for children\'s clothing shops',
    // Status
    ordered: 'Ordered',
    received: 'Received',
    pending: 'Pending',
    // General
    pieces: 'pcs',
    quantity: 'Quantity',
    product: 'Product',
    supplier: 'Supplier',
    status: 'Status',
    date: 'Date',
    darkMode: 'Dark Mode',
    language: 'Language',
  },
  gu: {
    dashboard: 'ડેશબોર્ડ',
    products: 'પ્રોડક્ટ્સ',
    orders: 'ઓર્ડર્સ',
    suppliers: 'સપ્લાયર્સ',
    sales: 'વેચાણ',
    reports: 'રિપોર્ટ્સ',
    settings: 'સેટિંગ્સ',
    categories: 'કેટેગરી',
    totalProducts: 'કુલ પ્રોડક્ટ્સ',
    totalCategories: 'કુલ કેટેગરી',
    lowStockItems: 'ઓછો સ્ટોક',
    todaysSales: 'આજનું વેચાણ',
    lowStockAlerts: 'ઓછા સ્ટોકની ચેતવણી',
    stockDistribution: 'સ્ટોક વિતરણ',
    salesTrend: 'વેચાણ ટ્રેન્ડ (છેલ્લા ૭ દિવસ)',
    recentOrders: 'તાજેતરના ઓર્ડર્સ',
    piecesLeft: 'પીસ બાકી',
    noLowStock: 'બધા સ્ટોક લેવલ સારા છે!',
    noRecentOrders: 'કોઈ તાજેતરના ઓર્ડર નથી',
    login: 'લોગિન',
    logout: 'લોગઆઉટ',
    email: 'ઇમેઇલ',
    password: 'પાસવર્ડ',
    signIn: 'સાઇન ઇન',
    signingIn: 'સાઇન ઇન થઈ રહ્યું છે...',
    signUp: 'સાઇન અપ',
    signingUp: 'સાઇન અપ થઈ રહ્યું છે...',
    noAccount: 'એકાઉન્ટ નથી?',
    haveAccount: 'પહેલેથી એકાઉન્ટ છે?',
    appName: 'KidWear રિટેલ મેનેજર',
    appTagline: 'બાળકોના કપડાંની દુકાન માટે સ્માર્ટ ઇન્વેન્ટરી મેનેજમેન્ટ',
    ordered: 'ઓર્ડર કરેલ',
    received: 'મળેલ',
    pending: 'બાકી',
    pieces: 'પીસ',
    quantity: 'જથ્થો',
    product: 'પ્રોડક્ટ',
    supplier: 'સપ્લાયર',
    status: 'સ્ટેટસ',
    date: 'તારીખ',
    darkMode: 'ડાર્ક મોડ',
    language: 'ભાષા',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('kidwear-lang') as Language) || 'en';
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('kidwear-lang', lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
