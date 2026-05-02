import { supabase } from './supabase';
import { BankAccount, Payout } from '@/types';
export type { BankAccount, Payout };

export const fetchBankAccounts = async (userId: string) => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as BankAccount[];
};

export const createBankAccount = async (account: Omit<BankAccount, 'id' | 'created_at'>) => {
  const insertPayload = {
    user_id: account.user_id,
    bank_name: account.bank_name,
    account_type: account.account_type,
    account_number: account.account_number,
    account_holder_name: account.account_holder_name,
    ifsc_code: account.ifsc_code,
    branch_name: account.branch_name,
    is_default: account.is_default,
  };

  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
};

export const deleteBankAccount = async (id: string, userId: string) => {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};

export const setDefaultBankAccount = async (id: string, userId: string) => {
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

export const initiateUPIDisbursement = async (amount: number, upiId: string, userId: string) => {
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
