-- =============================================================================
-- REWARD POINTS AUTOMATED EXPIRATION SYSTEM
-- =============================================================================

-- 1. Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- 2. Create the expiration calculation function
CREATE OR REPLACE FUNCTION public.process_reward_expirations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    r RECORD;
    v_total_earned_expired INTEGER;
    v_total_spent_or_expired INTEGER;
    v_points_to_expire INTEGER;
BEGIN
    FOR r IN SELECT id FROM auth.users
    LOOP
        -- Calculate how many points were earned AND have passed their expiration date
        -- (e.g., points earned > 12 months ago)
        SELECT COALESCE(SUM(points_amount), 0) INTO v_total_earned_expired
        FROM public.reward_transactions
        WHERE user_id = r.id AND type = 'earned' AND expires_at <= NOW();

        -- Calculate how many points the user has ALREADY spent (redeemed) or expired
        SELECT COALESCE(SUM(points_amount), 0) INTO v_total_spent_or_expired
        FROM public.reward_transactions
        WHERE user_id = r.id AND (type = 'redeemed' OR type = 'expired');

        -- The difference is what should have been spent but wasn't
        v_points_to_expire := v_total_earned_expired - v_total_spent_or_expired;

        -- If greater than 0, these points are unused & expired
        IF v_points_to_expire > 0 THEN
            -- 1. Insert an 'expired' transaction to the ledger
            INSERT INTO public.reward_transactions (
                user_id, points_amount, activity_type, type, transaction_type, description
            ) VALUES (
                r.id, v_points_to_expire, 'system_expiration', 'expired', 'debit', 'Reward points expired after 12 months'
            );

            -- 2. Deduct from the user's profile balance, ensuring it doesn't go negative
            UPDATE public.profiles
            SET reward_points = GREATEST(COALESCE(reward_points, 0) - v_points_to_expire, 0)
            WHERE id = r.id;
        END IF;
    END LOOP;
END;
$$;

-- 3. Schedule the cron job to run every midnight
-- Wrap in a DO block to prevent errors if the job doesn't exist yet
DO $$
BEGIN
  PERFORM cron.unschedule('process-reward-expirations-midnight');
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore error if job doesn't exist
END;
$$;

-- Second, schedule the task
SELECT cron.schedule(
    'process-reward-expirations-midnight', -- Task Name
    '0 0 * * *',                           -- Cron Expression (At 00:00 every day)
    'SELECT public.process_reward_expirations();' -- Command to run
);
