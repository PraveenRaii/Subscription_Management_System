import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'INR' | 'USD' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, fromCurrency?: Currency) => string;
  convertAmount: (amount: number, fromCurrency?: Currency) => number;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const EXCHANGE_RATES: Record<Currency, number> = {
  INR: 1,
  USD: 1 / 84, // 1 USD ≈ 84 INR
  EUR: 1 / 92, // 1 EUR ≈ 92 INR
};

const SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('billflow_currency') || localStorage.getItem('subflow_currency');
    if (saved === 'INR' || saved === 'USD' || saved === 'EUR') return saved;
    return 'INR';
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('billflow_currency', c);
  };

  const convertAmount = (amount: number, fromCurrency: Currency = 'INR'): number => {
    if (fromCurrency === currency) return amount;
    // convert fromCurrency to INR base
    const inrBase = fromCurrency === 'INR' ? amount : amount / EXCHANGE_RATES[fromCurrency];
    // convert INR base to target currency
    return Math.round(inrBase * EXCHANGE_RATES[currency]);
  };

  const formatCurrency = (amount: number, fromCurrency: Currency = 'INR'): string => {
    const converted = convertAmount(amount, fromCurrency);
    const sym = SYMBOLS[currency];
    return `${sym} ${converted.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        convertAmount,
        symbol: SYMBOLS[currency],
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
