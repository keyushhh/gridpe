import { Tables } from './database';

export type WalletTier = 'Starter' | 'Pro' | 'Elite' | 'Supreme';

export interface TierConfig {
  name: WalletTier;
  color: string;
  min_balance: number;
  perks: string[];
}

export interface DepositMetadata {
  type: 'deposit';
  gateway?: string;
  reference_id?: string;
  description?: string;
  [key: string]: any;
}

export interface WithdrawalMetadata {
  type: 'withdrawal';
  payout_method: 'bank_account' | 'upi' | 'wallet';
  bank_account_id?: string;
  upi_id?: string;
  wallet_name?: string;
  [key: string]: any;
}

export interface OrderPaymentMetadata {
  type: 'order_payment';
  order_id: string;
  order_type?: string;
  [key: string]: any;
}

export interface RewardMetadata {
  type: 'reward';
  activity: string;
  points: number;
  [key: string]: any;
}

export type TransactionMetadata = DepositMetadata | WithdrawalMetadata | OrderPaymentMetadata | RewardMetadata;

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'held' | 'deposit';
  amount: number;
  status: string;
  description: string;
  reference_id?: string | null;
  metadata?: TransactionMetadata | null;
  created_at: string;
  
  // UI & Legacy Aliases
  transaction_type?: 'credit' | 'debit' | 'held' | 'deposit'; 
  date?: string; 
  payout_method?: string;
  vpa?: string;
}
