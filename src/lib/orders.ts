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
  // Join fields
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

  // 1. Fetch order details for refund calculation (Total Payable)
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, user_id, status, total_amount, amount') // Using total_amount as fallback if total_payable isn't found
    .eq('id', orderId)
    .single();

  if (fetchError || !order) throw new Error("Order not found");
  if (order.status === 'delivered' || order.status === 'picked_up') {
    throw new Error("This order cannot be cancelled anymore.");
  }

  // 2. Perform cancellation update
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ 
      status: 'cancelled',
      cancelled_by: 'user',
      cancelled_at: new Date().toISOString(),
      cancel_reason_type: reasonType,
      cancel_reason_text: reasonText
    })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) throw updateError;

  // 3. Process Refund (Total Payable: total_amount)
  const refundAmount = order.total_amount || order.amount;
  
  // Update wallet balance
  const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
    p_user_id: userId,
    p_amount: refundAmount
  });

  if (walletError) {
    console.error("Wallet refund failed, but order was cancelled. Manual intervention required:", walletError);
  } else {
    // 4. Create single transaction record
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      order_id: orderId,
      amount: refundAmount,
      type: 'refund',
      description: `Refund for Order #${orderId.slice(0, 8).toUpperCase()}: +₹${refundAmount}`,
      status: 'success'
    });
  }

  return updatedOrder;
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
