-- Tracks a pending account-deletion request. NULL = no pending request.
-- Set when a user confirms deletion (via real MPIN check), cleared if they
-- tap "Take Me Back" during the grace period. Actual purge/processing of
-- deletion_requested_at accounts is a manual/ops step for now, not automated.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
