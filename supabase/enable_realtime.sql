-- Enable Realtime for wallets and wallet_transactions tables
-- This ensures the frontend receives updates when the balance changes.

BEGIN;
  -- Add tables to the 'supabase_realtime' publication
  ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
  ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
COMMIT;
