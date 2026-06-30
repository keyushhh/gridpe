import { supabase } from './supabase';
import { Order, Address } from '@/types';

// Internal helper to fetch addresses for a list of orders
const fetchAddressesForOrders = async <T extends { address_id: string | null }>(
  orders: T[]
): Promise<(T & { addresses?: Address | null })[]> => {
  const addressIds = Array.from(
    new Set(orders.map(o => o.address_id).filter((id): id is string => !!id))
  );
  if (addressIds.length === 0) return orders;

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .in('id', addressIds);

  if (error || !data) return orders;
  const addresses = data as Address[];

  const addressMap = new Map(addresses.map(a => [a.id, a]));
  return orders.map(o => ({
    ...o,
    addresses: o.address_id ? addressMap.get(o.address_id) : undefined,
  }));
};

// Internal helper to normalize orders from different tables
const normalizeOrder = (o: Order, type: 'CASH_ORDER' | 'FX_EXCHANGE'): Order => ({
  ...o,
  amount: type === 'CASH_ORDER' ? o.total_amount || o.amount : o.total_amount || o.amount,
  order_type: type,
  created_at: o.created_at || o.updated_at,
  // Ensure addresses field is handled
  addresses: o.addresses,
});

export const fetchRecentOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, rider:riders(id, full_name, email, phone_number, kyc_dob, kyc_gender, kyc_type, kyc_number, kyc_photo, kyc_id_url), order_ratings(id, stars, recommend_solo, feedback, tip_amount)'
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error || !data) return [];

  const ordersWithAddresses = await fetchAddressesForOrders(data as any[]);
  return ordersWithAddresses as Order[];
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const { data: orderData, error } = await supabase
    .from('orders')
    .select(
      '*, rider:riders(id, full_name, email, phone_number, kyc_dob, kyc_gender, kyc_type, kyc_number, kyc_photo, kyc_id_url), order_ratings(id, stars, recommend_solo, feedback, tip_amount)'
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error || !orderData) return null;

  if (orderData.address_id) {
    const { data: addr } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', orderData.address_id)
      .maybeSingle();
    if (addr) (orderData as any).addresses = addr;
  }

  return orderData as unknown as Order;
};

export const fetchActiveOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, rider:riders(id, full_name, email, phone_number, kyc_dob, kyc_gender, kyc_type, kyc_number, kyc_photo, kyc_id_url), order_ratings(id, stars, recommend_solo, feedback, tip_amount)'
    )
    .eq('user_id', userId)
    .in('status', ['payment_captured', 'processing', 'out_for_delivery', 'arrived', 'pending', 'accepted', 'picked_up'])
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  const ordersWithAddresses = await fetchAddressesForOrders(data as any[]);
  return ordersWithAddresses as Order[];
};

export const fetchPastOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_ratings(id, stars, recommend_solo, feedback, tip_amount)')
    .eq('user_id', userId)
    .in('status', ['delivered', 'success', 'failed', 'cancelled'])
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  const ordersWithAddresses = await fetchAddressesForOrders(data as any[]);
  return ordersWithAddresses as Order[];
};

export const cancelOrder = async (orderId: string, reasonType: string, reasonText: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const userId = session.user.id;

  // 1. Fetch order details for diagnostic logging
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, user_id, status, total_amount, amount')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) throw new Error('Order not found');

  // Add requested log for confirmation

  // 2. Perform atomic cancellation update via RPC
  // This RPC handles: Order status update, FULL total_amount refund, and transaction record.
  const { data, error: rpcError } = await supabase.rpc('cancel_order', {
    p_order_id: orderId,
    p_user_id: userId,
    p_cancel_reason_type: reasonType,
    p_cancel_reason_text: reasonText,
  });

  if (rpcError) throw rpcError;
  const result = data as { success: boolean; error?: string } | null;
  if (!result || result.success === false) {
    throw new Error(result?.error || 'Failed to cancel order');
  }

  return result;
};

export const deliverOrder = async (orderId: string, userId: string, isFx: boolean = false) => {
  const rpcName = isFx ? 'complete_fx_order' : 'complete_cash_order';
  const { data, error } = await supabase.rpc(rpcName, {
    p_order_id: orderId,
    p_user_id: userId,
  });

  if (error) throw error;
  const result = data as { success: boolean; error?: string } | null;
  if (result?.success === false) throw new Error(result.error || 'Failed to complete order');
};

export const dev_seedMockOrders = async (userId: string) => {
  if (!import.meta.env.DEV) return;

  const { data: addrData } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  const addressId = (addrData as { id: string }[] | null)?.[0]?.id || null;

  // For seeding, we'll insert into the unified orders table
  const mockOrders = [
    {
      user_id: userId,
      amount: 1250.5,
      total_amount: 1350.0,
      status: 'delivered',
      type: 'cash',
      payment_mode: 'cash',
      address_id: addressId,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      meta_data: { type: 'CASH_ORDER', item_value: 1250.5 },
    },
    {
      user_id: userId,
      amount: 840.0,
      total_amount: 940.0,
      status: 'cancelled',
      type: 'cash',
      payment_mode: 'cash',
      address_id: addressId,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      meta_data: {
        type: 'CASH_ORDER',
        item_value: 840.0,
        cancelled_by: 'user',
        cancel_reason_type: 'I changed my mind',
        cancelled_at: new Date(Date.now() - 86300000).toISOString(),
      },
    },
  ];

  const { data: insertedOrders, error } = await supabase
    .from('orders')
    .insert(mockOrders)
    .select('id, amount, created_at, status');

  if (error) throw error;

  if (insertedOrders && insertedOrders.length > 0) {
    const deliveredOrder = insertedOrders.find(o => o.status === 'delivered');
    if (deliveredOrder) {
      const mockReward = {
        user_id: userId,
        type: 'earned',
        amount: deliveredOrder.amount,
        points_amount: Math.round(deliveredOrder.amount * 40),
        reference_id: deliveredOrder.id,
        description: 'Earned from Cash Delivery',
        created_at: deliveredOrder.created_at,
        expires_at: new Date(new Date(deliveredOrder.created_at).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { error: rewardErr } = await supabase
        .from('reward_transactions')
        .insert([mockReward]);

      if (rewardErr) {
        if (import.meta.env.DEV) { console.error('Error seeding reward transaction:', rewardErr); }
      }
    }
  }
};
