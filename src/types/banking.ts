import { Tables } from './database';

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  branch_name: string;
  is_default: boolean;
  logo_url: string | null;
  created_at: string;

  // UI & Legacy Aliases
  bankName?: string; 
  accountNumber?: string;
  accountType?: string;
  ifsc?: string;
  branch?: string;
  isDefault?: boolean;
  logo?: string;
  backgroundIndex?: number;
}

export type Payout = Tables['payouts'] & {
  vpa?: string; // For UPI payouts
};
