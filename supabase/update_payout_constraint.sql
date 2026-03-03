-- Migration to update payouts_payout_method_check constraint
-- Includes 'card', 'upi', 'bank_transfer', and optionally 'wallet' if needed.

ALTER TABLE payouts 
DROP CONSTRAINT IF EXISTS payouts_payout_method_check;

ALTER TABLE payouts 
ADD CONSTRAINT payouts_payout_method_check 
CHECK (payout_method IN ('upi', 'bank_transfer', 'card', 'wallet'));
