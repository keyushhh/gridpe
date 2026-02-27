import { supabase } from './supabase';
import { Address } from './addresses';

export interface Order {
  id: string;
  user_id: string;
  amount: number;
  status: string; // 'processing', 'out_for_delivery', 'delivered', 'cancelled'
  payment_mode: string; // 'wallet', 'cash', 'upi'
  address_id: string | null;
  created_at: string;
  updated_at?: string;
  transaction_number?: string;
  metadata?: {
    failure_reason?: string;
    cancelled_by?: string;
    cancel_reason_type?: string;
    cancelled_at?: string;
    [key: string]: any;
  };
  // Join fields
  addresses?: Address;
}

export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'addresses'>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
};

export const fetchRecentOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, addresses(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data as Order[];
};

export const dev_updateOrderStatus = async (orderId: string, status: 'success' | 'failed' | 'cancelled') => {
  if (!import.meta.env.DEV) return;

  let metadata: any = {};
  if (status === 'failed') {
    metadata = { failure_reason: "Simulated dev failure" };
  } else if (status === 'cancelled') {
    metadata = {
      cancelled_by: "dev",
      cancel_reason_type: "Simulated dev cancellation",
      cancelled_at: new Date().toISOString()
    };
  }

  const { error } = await supabase
    .from('orders')
    .update({ status, metadata })
    .eq('id', orderId);

  if (error) throw error;
};

export const fetchActiveOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, addresses(*)')
    .eq('user_id', userId)
    .in('status', ['processing', 'out_for_delivery', 'arrived'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
};

export const fetchPastOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, addresses(*)')
    .eq('user_id', userId)
    .in('status', ['delivered', 'success', 'failed', 'cancelled'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
};
export const cancelOrder = async (orderId: string) => {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      metadata: {
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'user'
      }
    })
    .eq('id', orderId);

  if (error) throw error;
};

export const deliverOrder = async (orderId: string) => {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) throw error;
};

export const dev_seedMockOrders = async (userId: string) => {
  if (!import.meta.env.DEV) return;

  const { data: addrData } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  const addressId = addrData?.[0]?.id || null;

  const mockOrders = [
    {
      user_id: userId,
      amount: 1250.50,
      status: 'success',
      payment_mode: 'wallet',
      address_id: addressId,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      metadata: {}
    },
    {
      user_id: userId,
      amount: 840.00,
      status: 'cancelled',
      payment_mode: 'wallet',
      address_id: addressId,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      metadata: {
        cancelled_by: 'user',
        cancel_reason_type: 'I changed my mind',
        cancelled_at: new Date(Date.now() - 86300000).toISOString()
      }
    },
    {
      user_id: userId,
      amount: 2100.25,
      status: 'failed',
      payment_mode: 'wallet',
      address_id: addressId,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      metadata: {
        failure_reason: 'Insufficient funds'
      }
    }
  ];

  const { error } = await supabase.from('orders').insert(mockOrders);
  if (error) throw error;
};
