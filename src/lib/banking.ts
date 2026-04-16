import { supabase, USER_ID } from './supabase';
import { BankAccount, Payout } from '@/types';
export type { BankAccount, Payout };

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
