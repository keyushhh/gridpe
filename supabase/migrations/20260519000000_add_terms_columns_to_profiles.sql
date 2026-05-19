-- Add terms and conditions acceptance tracking columns to the profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS terms_version text;
