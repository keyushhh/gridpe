import { Tables } from './database';

export type Profile = Tables<'profiles'> & {
  referral_code?: string;
  country?: string;
  kyc_document_type?: string;
};

export type Address = Tables<'addresses'>;

// BankAccount and Payout are now consolidated in banking.ts
// UI specific extension for Address selection
export interface SavedAddress extends Omit<Address, 'landmark'> {
  tag: string;
  displayAddress: string;
  house: string;
  area: string;
  landmark?: string;
  name?: string;
  phone?: string;
  postcode?: string;
  plusCode?: string;
  address_line?: string;
  full_address?: string;
}
