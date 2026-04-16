/**
 * Database Table schema types mirroring the Supabase structure.
 * These act as the foundation for domain types.
 */

export interface Tables {
  profiles: {
    id: string;
    full_name: string | null;
    name?: string | null; // UI alias
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    mpin_set?: boolean;
    mpin_hash?: string | null;
    kyc_status: string;
    wallet_tier?: string;
    current_tier_id?: string | null;
    scheduled_tier_id?: string | null;
    tier_change_date?: string | null;
    payment_status?: string | null;
    subscription_status?: string | null;
    reward_points?: number;
    is_passport_verified?: boolean;
    biometric_on?: boolean;
    created_at: string;
    updated_at: string;
  };
  orders: {
    id: string;
    user_id: string;
    amount: number;
    total_amount: number;
    status: string;
    payment_mode: string;
    address_id: string | null;
    rider_id: string | null;
    otp_code: string | null;
    delivery_fee: number;
    service_fee: number;
    gst: number;
    delivery_tip: number;
    rider_earnings: number;
    hub_id: string | null;
    pickup_location: string | null;
    delivery_location: string | null;
    delivery_address_text: string | null;
    customer_phone_number: string | null;
    order_type: string;
    meta_data: any;
    created_at: string;
    updated_at: string;
  };
  wallet_transactions: {
    id: string;
    user_id: string;
    type: 'credit' | 'debit' | 'held' | 'deposit';
    amount: number;
    status: string;
    description: string;
    reference_id: string | null;
    metadata: any;
    created_at: string;
  };
  addresses: {
    id: string;
    user_id: string;
    label?: string | null;
    apartment?: string | null;
    house?: string | null; // UI alias
    area: string | null;
    landmark?: string | null;
    city: string | null;
    state: string | null;
    latitude: number;
    longitude: number;
    plus_code?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    created_at: string;
  };
  bank_accounts: {
    id: string;
    user_id: string;
    bank_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
    ifsc_code: string;
    branch_name: string;
    is_default: boolean;
    logo_url: string | null;
    created_at: string;
  };
  payouts: {
    id: string;
    user_id: string;
    bank_account_id: string | null;
    upi_id: string | null;
    wallet_name: string | null;
    payout_method: 'bank_account' | 'upi' | 'wallet';
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'completed';
    currency: string;
    created_at: string;
  };
  riders: {
    id: string;
    full_name: string;
    email: string | null;
    phone_number: string | null;
    kyc_photo: string | null;
    kyc_status: string;
  };
  wallet_tiers: {
    id: string;
    name: string;
    max_wallet_balance: number;
    daily_withdraw_limit: number;
    subscription_price: number;
    created_at: string;
  };
}
