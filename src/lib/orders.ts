import { supabase } from './supabase';
import { Address } from './addresses';

export interface Order {
  id: string;
  user_id: string;
  amount: number;
  status: string; // 'processing', 'out_for_delivery', 'delivered', 'cancelled'
  payment_mode: string; // 'wallet', 'cash', 'upi'
  address_id: string | null;
  created_at?: string;
  updated_at?: string;
  transaction_number?: string;
  order_type?: 'CASH_ORDER' | 'FX_EXCHANGE';
  metadata?: {
    failure_reason?: string;
    cancelled_by?: string;
    cancel_reason_type?: string;
    cancelled_at?: string;
    [key: string]: any;
  };
  // Join fields
  addresses?: Address;
  address?: Address; // Fallback for some components
}

// Internal helper to fetch addresses for a list of orders
const fetchAddressesForOrders = async (orders: any[]) => {
  const addressIds = Array.from(new Set(orders.map(o => o.address_id).filter(Boolean)));
  if (addressIds.length === 0) return orders;

  const { data: addresses, error } = await supabase
    .from('addresses')
    .select('*')
    .in('id', addressIds);

  if (error || !addresses) return orders;

  const addressMap = new Map(addresses.map(a => [a.id, a]));
  return orders.map(o => ({
    ...o,
    addresses: o.address_id ? addressMap.get(o.address_id) : undefined
  }));
};

// Internal helper to normalize orders from different tables
const normalizeOrder = (o: any, type: 'CASH_ORDER' | 'FX_EXCHANGE'): Order => ({
  ...o,
  amount: type === 'CASH_ORDER' ? (o.total_amount || o.item_value) : (o.total_amount || o.amount_total),
  order_type: type,
  created_at: o.created_at || o.updated_at,
  // Ensure addresses field is handled
  addresses: o.addresses
});

export const fetchRecentOrders = async (userId: string) => {
  const [cashRes, fxRes] = await Promise.all([
    supabase.from('cash_orders').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5),
    supabase.from('fx_orders').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5)
  ]);

  const orders = [
    ...(cashRes.data || []).map(o => normalizeOrder(o, 'CASH_ORDER')),
    ...(fxRes.data || []).map(o => normalizeOrder(o, 'FX_EXCHANGE'))
  ];

  const ordersWithAddresses = await fetchAddressesForOrders(orders);
  return ordersWithAddresses.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()).slice(0, 5);
};

export const getOrderById = async (orderId: string) => {
  const [cash, fx] = await Promise.all([
    supabase.from('cash_orders').select('*').eq('id', orderId).maybeSingle(),
    supabase.from('fx_orders').select('*').eq('id', orderId).maybeSingle()
  ]);

  let orderData = null;
  if (cash.data) orderData = normalizeOrder(cash.data, 'CASH_ORDER');
  else if (fx.data) orderData = normalizeOrder(fx.data, 'FX_EXCHANGE');

  if (orderData && orderData.address_id) {
    const { data: addr } = await supabase.from('addresses').select('*').eq('id', orderData.address_id).maybeSingle();
    if (addr) orderData.addresses = addr;
  }

  return orderData;
};

export const dev_updateOrderStatus = async (orderId: string, status: 'success' | 'failed' | 'cancelled', userId?: string) => {
  if (!import.meta.env.DEV) return;

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found");

  if (status === 'success') {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = userId || session?.user?.id || '00000000-0000-0000-0000-000000000000';
    const rpcName = order.order_type === 'FX_EXCHANGE' ? 'complete_fx_order' : 'complete_cash_order';
    
    const { data, error } = await supabase.rpc(rpcName, {
      p_order_id: orderId,
      p_user_id: uid
    });
    if (error) {
      alert(`RPC Network Error: ${error.message}`);
      throw error;
    }
    if (data && data.success === false) {
      alert(`RPC Database Error: ${data.error}`);
      throw new Error(data.error || 'RPC failed silently');
    }
    return;
  }

  let metadata: any = order.metadata || {};
  if (status === 'failed') {
    metadata.failure_reason = "Simulated dev failure";
  } else if (status === 'cancelled') {
    metadata.cancelled_by = "dev";
    metadata.cancel_reason_type = "Simulated dev cancellation";
    metadata.cancelled_at = new Date().toISOString();
  }

  const table = order.order_type === 'FX_EXCHANGE' ? 'fx_orders' : 'cash_orders';
  const { error } = await supabase
    .from(table)
    .update({ status, metadata, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw error;
};

export const fetchActiveOrders = async (userId: string) => {
  const [cashRes, fxRes] = await Promise.all([
    supabase.from('cash_orders').select('*').eq('user_id', userId).in('status', ['processing', 'out_for_delivery', 'arrived', 'pending']).order('updated_at', { ascending: false }),
    supabase.from('fx_orders').select('*').eq('user_id', userId).in('status', ['processing', 'out_for_delivery', 'arrived', 'pending']).order('updated_at', { ascending: false })
  ]);

  const orders = [
    ...(cashRes.data || []).map(o => normalizeOrder(o, 'CASH_ORDER')),
    ...(fxRes.data || []).map(o => normalizeOrder(o, 'FX_EXCHANGE'))
  ];

  const ordersWithAddresses = await fetchAddressesForOrders(orders);
  return ordersWithAddresses.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
};

export const fetchPastOrders = async (userId: string) => {
  const [cashRes, fxRes] = await Promise.all([
    supabase.from('cash_orders').select('*').eq('user_id', userId).in('status', ['delivered', 'success', 'failed', 'cancelled']).order('updated_at', { ascending: false }),
    supabase.from('fx_orders').select('*').eq('user_id', userId).in('status', ['delivered', 'success', 'failed', 'cancelled']).order('updated_at', { ascending: false })
  ]);

  const orders = [
    ...(cashRes.data || []).map(o => normalizeOrder(o, 'CASH_ORDER')),
    ...(fxRes.data || []).map(o => normalizeOrder(o, 'FX_EXCHANGE'))
  ];

  const ordersWithAddresses = await fetchAddressesForOrders(orders);
  return ordersWithAddresses.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
};

export const cancelOrder = async (orderId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { data, error } = await supabase.rpc('cancel_order', {
    p_order_id: orderId,
    p_user_id: session.user.id
  });

  if (error) throw error;
  if (data?.success === false) throw new Error(data.error || 'Failed to cancel order');
};

export const deliverOrder = async (orderId: string, userId: string, isFx: boolean = false) => {
  const rpcName = isFx ? 'complete_fx_order' : 'complete_cash_order';
  const { data, error } = await supabase.rpc(rpcName, {
    p_order_id: orderId,
    p_user_id: userId
  });

  if (error) throw error;
  if (data?.success === false) throw new Error(data.error || 'Failed to complete order');
};

export const dev_seedMockOrders = async (userId: string) => {
  if (!import.meta.env.DEV) return;

  const { data: addrData } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  const addressId = addrData?.[0]?.id || null;

  // For seeding, we'll just insert into cash_orders as a demonstration
  const mockOrders = [
    {
      user_id: userId,
      item_value: 1250.50,
      status: 'delivered',
      payment_mode: 'wallet',
      address_id: addressId,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      metadata: {}
    },
    {
      user_id: userId,
      item_value: 840.00,
      status: 'cancelled',
      payment_mode: 'wallet',
      address_id: addressId,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      metadata: {
        cancelled_by: 'user',
        cancel_reason_type: 'I changed my mind',
        cancelled_at: new Date(Date.now() - 86300000).toISOString()
      }
    }
  ];

  const { error } = await supabase.from('cash_orders').insert(mockOrders);
  if (error) throw error;
};
