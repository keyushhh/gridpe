-- Drop the restrictive check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;

-- Drop deprecated legacy columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wallet_tier;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wallet_tier_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS current_tier_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS scheduled_tier_id;
