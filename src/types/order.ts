import { Tables } from './database';
import { Address } from './user';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'arrived'
  | 'delivered'
  | 'cancelled'
  | 'failed'
  | 'processing'
  | 'success'
  | 'out_for_delivery';

export interface Rider {
  id: string;
  full_name: string;
  email?: string | null;
  phone_number: string | null;
  kyc_photo?: string | null;
  kyc_status?: string;
  kyc_dob?: string;
  kyc_gender?: string;
  kyc_type?: string;
  kyc_number?: string;
  kyc_id_url?: string;
  profile_photo?: string | null;
}

export interface BaseOrderMetadata {
  client_source?: string;
  quote_id?: string;
  delivery_address?: string;
  delivery_text?: string;
  delivery_fee?: number;
  service_fee?: number;
  gst?: number;
  delivery_tip?: number;
  reward_points?: number;
  cancelled_by?: 'user' | 'system' | 'partner';
  cancelled_at?: string;
  cancel_reason_type?: string;
  cancel_reason_text?: string;
}

export interface CashOrderMetadata extends BaseOrderMetadata {
  type: 'CASH_ORDER';
  item_value: number;
  // Legacy support for UI reads
  isFx?: boolean;
  receive_amount?: number;
  receiveAmount?: number;
}

export interface FxOrderMetadata extends BaseOrderMetadata {
  type: 'FX_EXCHANGE';
  is_fx: true;
  isFx?: true;
  from_currency: string;
  to_currency: string;
  toCurrency?: string;
  fx_rate: number;
  source_amount: number;
  receive_amount: number;
  receiveAmount?: number;
  hold_amount: number;
  markup_amount: number;
  flat_fee: number;
  base_rate?: number;
  markup?: number;
}

export interface RiderKycMetadata {
  type: 'RIDER_KYC_REPORT';
  report_reason: string;
  report_details?: string;
  reported_at: string;
  cancel_reason_type?: string;
}

export type OrderMetadata = CashOrderMetadata | FxOrderMetadata | RiderKycMetadata;

export interface Order {
  id: string;
  user_id: string;
  amount: number;
  total_amount: number;
  status: OrderStatus;
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
  meta_data: OrderMetadata | null;
  created_at: string;
  updated_at: string;

  // UI Extensions
  addresses?: Address;
  address?: Address; // Fallback for legacy components
  rider?: Rider;
  order_ratings?: Array<{
    id: string;
    stars: number;
    recommend_solo: boolean | null;
    feedback: string | null;
    tip_amount: number;
  }>;
}
