import { Tables } from './database';
import { Address } from './user';

export type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'arrived' | 'delivered' | 'cancelled' | 'failed' | 'processing' | 'success' | 'out_for_delivery';

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
}

export interface CashOrderMetadata {
  type: 'CASH_ORDER';
  item_value: number;
  delivery_text?: string;
  cancelled_by?: string;
  cancel_reason_type?: string;
  cancel_reason_text?: string;
  cancelled_at?: string;
  isFx?: boolean;
}

export interface FxExchangeMetadata {
  type: 'FX_EXCHANGE';
  source_currency: string;
  target_currency: string;
  exchange_rate: number;
  source_amount: number;
  isFx?: boolean;
  toCurrency?: string;
  receiveAmount?: number;
}

export interface RiderKycMetadata {
  type: 'RIDER_KYC_REPORT';
  report_reason: string;
  report_details?: string;
  reported_at: string;
}

export type OrderMetadata = CashOrderMetadata | FxExchangeMetadata | RiderKycMetadata;

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
}
