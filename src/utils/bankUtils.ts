import { ASSETS } from '@/constants/assets';
import { crashlytics } from '@/lib/crashlytics';
export interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  logo: string;
  isDefault: boolean;
  backgroundIndex?: number;
}
// Export available banks for the Linked Accounts flow
export const AVAILABLE_BANKS: BankAccount[] = [
  {
    id: '1',
    bankName: 'HDFC Bank',
    accountType: 'Savings Account',
    accountNumber: '12345678901234',
    ifsc: 'HDFC0001234',
    branch: 'HDFC Bank, Koramangala Branch',
    logo: ASSETS.HDFC_BANK_LOGO,
    isDefault: false,
  },
  {
    id: '2',
    bankName: 'IDFC Bank',
    accountType: 'Current Account',
    accountNumber: '98765432109876',
    ifsc: 'IDFC0004321',
    branch: 'IDFC Bank, Indiranagar Branch',
    logo: ASSETS.IDFC_BANK_LOGO,
    isDefault: false,
  },
  {
    id: '3',
    bankName: 'Axis Bank',
    accountType: 'Savings Account',
    accountNumber: '45612378901234',
    ifsc: 'UTIB0001234',
    branch: 'Axis Bank, Indiranagar Branch',
    logo: ASSETS.AXIS_BANK_LOGO,
    isDefault: false,
  },
  {
    id: '4',
    bankName: 'Kotak Bank',
    accountType: 'Savings Account',
    accountNumber: '78901234561234',
    ifsc: 'KKBK0001234',
    branch: 'Kotak Mahindra Bank, Koramangala Branch',
    logo: ASSETS.KOTAK_BANK_LOGO,
    isDefault: false,
  },
];
export const fetchBankDetails = async (ifsc: string) => {
  try {
    // NOTE: Using bankifsccode.com public IFSC API (free, no auth required).
    const response = await fetch(`https://api.bankifsccode.com/${ifsc}`);
    if (!response.ok) throw new Error('Invalid IFSC');
    return await response.json();
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error fetching bank details:', error);
    crashlytics.recordError(error instanceof Error ? error : new Error('bankUtils fetchBankDetails failed'), 'bankUtils.fetchBankDetails');
    return null;
  }
};
export const getBankLogo = (bankName: string) => {
  const name = bankName.toLowerCase();
  if (name.includes('hdfc')) return ASSETS.HDFC_BANK_LOGO;
  if (name.includes('idfc')) return ASSETS.IDFC_BANK_LOGO;
  if (name.includes('axis')) return ASSETS.AXIS_BANK_LOGO;
  if (name.includes('kotak')) return ASSETS.KOTAK_BANK_LOGO;
  return ASSETS.HDFC_BANK_LOGO;
};
