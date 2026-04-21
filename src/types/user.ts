import { Tables } from './database';

export type Profile = Tables['profiles'] & {
  referral_code?: string;
};

export type Address = Tables['addresses'];

// BankAccount and Payout are now consolidated in banking.ts
// UI specific extension for Address selection
export interface SavedAddress extends Address {
  tag: string;
  displayAddress: string;
  house: string;
  area: string;
  landmark?: string;
  name?: string;
  phone?: string;
  postcode?: string;
  plusCode?: string;
}
