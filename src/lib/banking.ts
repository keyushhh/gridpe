import { supabase, USER_ID } from './supabase';

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_type: string;
  account_number: string; // Plain text for insertion
  masked_number?: string; // From view
  encrypted_raw?: string; // Encrypted text/ID from view
  account_holder_name: string;
  ifsc_code: string;
  branch_name: string;
  is_default: boolean;
  created_at?: string;
  logo_url?: string;
}

export interface Payout {
  id: string;
  user_id: string;
  bank_account_id?: string | null;
  upi_id?: string | null;
  wallet_name?: string | null;
  payout_method: 'bank_account' | 'upi' | 'wallet';
  amount: number;
  status: 'pending' | 'success' | 'failed';
  currency: string;
  created_at?: string;
}

export const fetchBankAccounts = async (userId: string = USER_ID) => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as BankAccount[];
};

export const createBankAccount = async (account: Omit<BankAccount, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(account)
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
};

export const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
};

export const deleteBankAccount = async (id: string) => {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const setDefaultBankAccount = async (id: string, userId: string = USER_ID) => {
  // First, unset any existing default
  const { error: unsetError } = await supabase
    .from('bank_accounts')
    .update({ is_default: false })
    .eq('user_id', userId);

  if (unsetError) throw unsetError;

  // Set the new default
  const { data, error } = await supabase
    .from('bank_accounts')
    .update({ is_default: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
};

export const createPayout = async (payout: Omit<Payout, 'id' | 'created_at' | 'currency' | 'status'>) => {
    const { data, error } = await supabase
      .from('payouts')
      .insert({
          ...payout,
          status: 'pending',
          currency: 'INR'
      })
      .select()
      .single();
  
    if (error) throw error;
    return data as Payout;
};

export const initiateUPIDisbursement = async (amount: number, upiId: string, userId: string = USER_ID) => {
    const { data, error } = await supabase.functions.invoke('create-payout', {
        body: { amount, upi_id: upiId, user_id: userId }
    });

    if (error) throw error;
    return data;
};

export const verifyVPA = async (upiId: string) => {
    const { data, error } = await supabase.functions.invoke('create-payout', {
        body: { upi_id: upiId, action: 'verify-vpa' }
    });

    if (error) throw error;
    return data;
};
