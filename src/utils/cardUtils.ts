import { supabase } from '@/lib/supabase';

export interface Card {
  id: string;
  card_holder_name: string;
  last_four: string;
  expiry_month: string;
  expiry_year: string;
  card_type: string;
  gateway_token_id: string | null;
  cashfree_instrument_id: string | null;
  cashfree_customer_id: string | null;
  is_default: boolean;
  gateway: string;
  created_at: string;
}

export const getCards = async (userId: string): Promise<Card[]> => {
  const { data, error } = await supabase
    .from('bank_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as any[]) as Card[];
};

export const setDefaultCard = async (
  cardId: string, 
  userId: string
): Promise<void> => {
  // First unset all defaults for this user
  await supabase
    .from('bank_cards')
    .update({ is_default: false } as any)
    .eq('user_id', userId);
  // Then set the new default
  await supabase
    .from('bank_cards')
    .update({ is_default: true } as any)
    .eq('id', cardId)
    .eq('user_id', userId);
};

export const removeCard = async (
  cardId: string,
  userId: string
): Promise<void> => {
  await supabase
    .from('bank_cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', userId);
};
