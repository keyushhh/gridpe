-- Fix handle_new_user trigger: it still referenced profiles.wallet_tier, which
-- was dropped in 20260611000000_remove_wallet_tiers.sql. Because this trigger
-- fires AFTER INSERT ON auth.users, the stale column reference aborted the
-- transaction for EVERY new signup since that column was removed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, kyc_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    'pending'
  );
  RETURN new;
END;
$function$;
