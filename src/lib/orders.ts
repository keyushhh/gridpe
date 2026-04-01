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
  rider_id?: string | null;
  otp_code?: string | null;
  service_fee?: number;
  total_amount?: number;
  delivery_fee?: number;
  metadata?: {
    failure_reason?: string;
    cancelled_by?: string;
    cancel_reason_type?: string;
    cancelled_at?: string;
    [key: string]: any;
  };
  addresses?: Address;
  address?: Address; // Fallback for some components
  rider?: {
    id: string;
    full_name: string;
    email?: string;
    phone_number?: string;
    kyc_dob?: string;
    kyc_gender?: string;
    kyc_type?: string; 
    kyc_number?: string;
    kyc_photo?: string;
    kyc_id_url?: string;
  };
}

// Security: Explicitly exclude sensitive financial data for rider-facing views.
export const RIDER_ORDER_SELECT = `
  id, 
  user_id, 
  status, 
  rider_earnings, 
  delivery_tip, 
  delivery_fee, 
  pickup_location, 
  delivery_address_text, 
  customer_phone_number, 
  otp_code, 
  delivery_location, 
  created_at, 
  accepted_at, 
  city, 
  zone_id, 
  hub_id
`.replace(/\s+/g, '');

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
  const { data, error } = await supabase
    .from('orders')
    .select('*, rider:riders(id, full_name, email, phone_number, kyc_dob, kyc_gender, kyc_type, kyc_number, kyc_photo, kyc_id_url)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error || !data) return [];

  const ordersWithAddresses = await fetchAddressesForOrders(data);
  return ordersWithAddresses;
};

export const getOrderById = async (orderId: string) => {
  const { data: orderData, error } = await supabase
    .from('orders')
    .select('*, rider:riders(id, full_name, email, phone_number, kyc_dob, kyc_gender, kyc_type, kyc_number, kyc_photo, kyc_id_url)')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !orderData) return null;

  if (orderData.address_id) {
    const { data: addr } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', orderData.address_id)
      .maybeSingle();
    if (addr) orderData.addresses = addr;
  }

  return orderData;
};



export const fetchActiveOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, rider:riders(id, full_name, email, phone_number, kyc_dob, kyc_gender, kyc_type, kyc_number, kyc_photo, kyc_id_url)')
    .eq('user_id', userId)
    .in('status', ['processing', 'out_for_delivery', 'arrived', 'pending', 'accepted', 'picked_up'])
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  const ordersWithAddresses = await fetchAddressesForOrders(data);
  return ordersWithAddresses;
};

export const fetchPastOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['delivered', 'success', 'failed', 'cancelled'])
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  const ordersWithAddresses = await fetchAddressesForOrders(data);
  return ordersWithAddresses;
};

export const cancelOrder = async (orderId: string, reasonType: string, reasonText: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  console.log('Attempting to cancel orderId:', orderId);

  // 1. Fetch order details for diagnostic logging
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, user_id, status, total_amount, amount')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) throw new Error("Order not found");

  // Add requested log for confirmation
  console.log('Refund amount:', order.total_amount, 'vs item value:', order.amount);

  // 2. Perform atomic cancellation update via RPC
  // This RPC handles: Order status update, FULL total_amount refund, and transaction record.
  const { data, error: rpcError } = await supabase.rpc('cancel_order', {
    p_order_id: orderId,
    p_user_id: userId,
    p_cancel_reason_type: reasonType,
    p_cancel_reason_text: reasonText
  });

  if (rpcError) throw rpcError;
  if (!data || data.success === false) {
    throw new Error(data?.error || "Failed to cancel order");
  }

  return data;
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

  // For seeding, we'll insert into the unified orders table
  const mockOrders = [
    {
      user_id: userId,
      amount: 1250.50,
      total_amount: 1350.00,
      status: 'delivered',
      type: 'cash',
      payment_mode: 'wallet',
      address_id: addressId,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      meta_data: { item_value: 1250.50 }
    },
    {
      user_id: userId,
      amount: 840.00,
      total_amount: 940.00,
      status: 'cancelled',
      type: 'cash',
      payment_mode: 'wallet',
      address_id: addressId,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      meta_data: {
        cancelled_by: 'user',
        cancel_reason_type: 'I changed my mind',
        cancelled_at: new Date(Date.now() - 86300000).toISOString()
      }
    }
  ];

  const { error } = await supabase.from('orders').insert(mockOrders);
  if (error) throw error;
};

/** 
 * RIDER-SPECIFIC HELPERS (Secure)
 * These utilize RIDER_ORDER_SELECT to ensure sensitive financial data 
 * is never sent to rider-facing application components.
 */

export const getRiderOrderById = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(RIDER_ORDER_SELECT)
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchAvailableOrders = async (city: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(RIDER_ORDER_SELECT)
    .eq('status', 'pending')
    .eq('city', city)
    .is('rider_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchRiderActiveOrders = async (riderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(RIDER_ORDER_SELECT)
    .eq('rider_id', riderId)
    .in('status', ['accepted', 'picked_up', 'arrived'])
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};
