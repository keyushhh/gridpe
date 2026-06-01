export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_type: 'rider' | 'customer';
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export const CUSTOMER_QUICK_REPLIES = [
  'Ok, thank you!',
  'Please hurry',
  'I am at the door',
  'Call me please',
  'Leave it at the door',
  'Coming downstairs',
] as const;

export type CustomerQuickReply = typeof CUSTOMER_QUICK_REPLIES[number];

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
    push_token?: string | null;
    is_fx_enabled?: boolean | null;
    is_onboarded?: boolean | null;
    terms_accepted_at?: string | null;
    terms_version?: string | null;
    created_at: string;
    updated_at: string;
  };
  order_messages: {
    id: string;
    order_id: string;
    sender_type: 'rider' | 'customer';
    sender_id: string;
    message: string;
    created_at: string;
    read_at: string | null;
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
    meta_data: Json | null;
    created_at: string;
    updated_at: string;
  };
  wallet_transactions: {
    id: string;
    user_id: string;
    type: 'credit' | 'debit' | 'held' | 'deposit' | 'hold';
    amount: number;
    status: string;
    description: string;
    reference_id: string | null;
    metadata: Record<string, unknown> | null;
    order_id?: string | null;
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
    vpa?: string | null;
    created_at: string;
  };
  riders: {
    id: string;
    full_name: string;
    email: string | null;
    phone_number: string | null;
    kyc_dob?: string | null;
    kyc_gender?: string | null;
    kyc_type?: string | null;
    kyc_number?: string | null;
    kyc_photo: string | null;
    kyc_id_url?: string | null;
    profile_photo?: string | null;
    kyc_status: string;
  };
  wallet_tiers: {
    id: string;
    name: string;
    max_wallet_balance: number;
    daily_withdraw_limit: number;
    daily_topup_limit?: number;
    subscription_price: number;
    created_at: string;
  };
  reward_transactions: {
    id: string;
    user_id: string;
    type: string;
    amount: number;
    points_amount: number;
    reference_id: string | null;
    description: string;
    created_at: string;
    expires_at: string;
  };
  order_ratings: {
    id: string;
    order_id?: string;
    stars: number;
    recommend_solo: boolean | null;
    feedback: string | null;
    tip_amount: number;
    created_at?: string;
  };
  bank_cards: {
    id: string | number;
    user_id: string;
    last_four: string;
    card_holder_name: string;
    expiry_month: number | string;
    expiry_year: number | string;
    card_type: string;
    razorpay_token_id?: string | null;
    created_at?: string;
  };
  user_subscriptions: {
    id: string;
    user_id: string;
    status: string;
    current_period_end: string;
    created_at?: string;
  };
  wallets: {
    id: string;
    user_id: string;
    balance?: number;
    available_balance?: number;
    held_balance?: number;
    tier_id?: string | null;
    created_at?: string;
  };
  withdrawals: {
    id: string;
    user_id: string;
    amount: number;
    status: string;
    created_at: string;
  };
  hubs: {
    id: string;
    location_name: string;
    city: string;
    created_at?: string;
  };
  user_legal_consents: {
    id: string;
    user_id: string;
    document_type: string;
    document_id: string;
    accepted_at: string;
    created_at?: string;
  };
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Tables['profiles'];
        Insert: Partial<Tables['profiles']>;
        Update: Partial<Tables['profiles']>;
        Relationships: [];
      };
      order_messages: {
        Row: Tables['order_messages'];
        Insert: Partial<Tables['order_messages']>;
        Update: Partial<Tables['order_messages']>;
        Relationships: [];
      };
      orders: {
        Row: Tables['orders'];
        Insert: Partial<Tables['orders']>;
        Update: Partial<Tables['orders']>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: Tables['wallet_transactions'];
        Insert: Partial<Tables['wallet_transactions']>;
        Update: Partial<Tables['wallet_transactions']>;
        Relationships: [];
      };
      addresses: {
        Row: Tables['addresses'];
        Insert: Partial<Tables['addresses']>;
        Update: Partial<Tables['addresses']>;
        Relationships: [];
      };
      bank_accounts: {
        Row: Tables['bank_accounts'];
        Insert: Partial<Tables['bank_accounts']>;
        Update: Partial<Tables['bank_accounts']>;
        Relationships: [];
      };
      payouts: {
        Row: Tables['payouts'];
        Insert: Partial<Tables['payouts']>;
        Update: Partial<Tables['payouts']>;
        Relationships: [];
      };
      riders: {
        Row: Tables['riders'];
        Insert: Partial<Tables['riders']>;
        Update: Partial<Tables['riders']>;
        Relationships: [];
      };
      wallet_tiers: {
        Row: Tables['wallet_tiers'];
        Insert: Partial<Tables['wallet_tiers']>;
        Update: Partial<Tables['wallet_tiers']>;
        Relationships: [];
      };
      reward_transactions: {
        Row: Tables['reward_transactions'];
        Insert: Partial<Tables['reward_transactions']>;
        Update: Partial<Tables['reward_transactions']>;
        Relationships: [];
      };
      order_ratings: {
        Row: Tables['order_ratings'];
        Insert: Partial<Tables['order_ratings']>;
        Update: Partial<Tables['order_ratings']>;
        Relationships: [];
      };
      bank_cards: {
        Row: Tables['bank_cards'];
        Insert: Partial<Tables['bank_cards']>;
        Update: Partial<Tables['bank_cards']>;
        Relationships: [];
      };
      user_subscriptions: {
        Row: Tables['user_subscriptions'];
        Insert: Partial<Tables['user_subscriptions']>;
        Update: Partial<Tables['user_subscriptions']>;
        Relationships: [];
      };
      wallets: {
        Row: Tables['wallets'];
        Insert: Partial<Tables['wallets']>;
        Update: Partial<Tables['wallets']>;
        Relationships: [];
      };
      withdrawals: {
        Row: Tables['withdrawals'];
        Insert: Partial<Tables['withdrawals']>;
        Update: Partial<Tables['withdrawals']>;
        Relationships: [];
      };
      hubs: {
        Row: Tables['hubs'];
        Insert: Partial<Tables['hubs']>;
        Update: Partial<Tables['hubs']>;
        Relationships: [];
      };
      user_legal_consents: {
        Row: Tables['user_legal_consents'];
        Insert: Partial<Tables['user_legal_consents']>;
        Update: Partial<Tables['user_legal_consents']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      cancel_order: {
        Args: {
          p_order_id: string;
          p_user_id: string;
          p_cancel_reason_type: string;
          p_cancel_reason_text: string;
        };
        Returns: { success: boolean; error?: string };
      };
      wallet_withdraw: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_payout_method: string;
          p_vpa: string | null;
          p_description: string;
        };
        Returns: { success: boolean; error?: string };
      };
      complete_cash_order: {
        Args: {
          p_order_id: string;
          p_user_id: string;
        };
        Returns: { success: boolean; error?: string };
      };
      complete_fx_order: {
        Args: {
          p_order_id: string;
          p_user_id: string;
        };
        Returns: { success: boolean; error?: string };
      };
      get_order_quote: {
        Args: {
          p_amount: number;
          p_order_type: string;
          p_distance_km: number;
        };
        Returns: { delivery_fee: number; platform_fee: number; gst: number; gst_rate: number; total_payable: number; };
      };
      check_service_availability: {
        Args: {
          p_lat: number;
          p_lng: number;
        };
        Returns: string | null;
      };
      wallet_hold: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_order_id: string | null;
          p_description: string;
        };
        Returns: { success: boolean; error?: string };
      };
      calculate_rider_earning: {
        Args: {
          dist_km: number;
          cash_amount: number;
        };
        Returns: string;
      };
      schedule_downgrade: {
        Args: {
          p_user_id: string;
          p_tier_name: string;
          p_tier_change_date: string;
        };
        Returns: { success: boolean; error?: string };
      };
      apply_tier_forfeiture: {
        Args: {
          p_user_id: string;
        };
        Returns: { success: boolean; error?: string };
      };
      wallet_deposit: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description: string;
          p_reference_id: string;
          p_metadata?: Record<string, unknown>;
        };
        Returns: { success: boolean; error?: string };
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
