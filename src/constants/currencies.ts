export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  countryCode: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'United States Dollar', symbol: '$', flag: '🇺🇸', countryCode: 'us' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', countryCode: 'in' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', countryCode: 'eu' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', countryCode: 'gb' },
  { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'AED', flag: '🇦🇪', countryCode: 'ae' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', countryCode: 'sg' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', countryCode: 'ca' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', countryCode: 'au' },
];

export const CURRENCY_MAP: Record<string, CurrencyInfo> = Object.fromEntries(
  CURRENCIES.map(currency => [currency.code, currency])
) as Record<string, CurrencyInfo>;

export const CURRENCY_NAMES: Record<string, string> = Object.fromEntries(
  CURRENCIES.map(currency => [currency.code, currency.name])
);

export const currencySymbols: Record<string, string> = Object.fromEntries(
  CURRENCIES.map(currency => [currency.code, currency.symbol])
);

export const currencyFlags: Record<string, string> = Object.fromEntries(
  CURRENCIES.map(currency => [currency.code, currency.flag])
);
