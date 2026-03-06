-- Add missing subscription and payment management columns to the profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid',
ADD COLUMN IF NOT EXISTS next_billing_date timestamp with time zone;
