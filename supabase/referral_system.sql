-- =============================================================================
-- REFERRAL SYSTEM INTEGRATION
-- =============================================================================

-- 1. Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Create the referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending' or 'completed'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(referred_id) -- A user can only be referred once
);

-- Secure the referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" 
ON public.referrals FOR SELECT TO authenticated 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
CREATE POLICY "Users can insert referrals" 
ON public.referrals FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = referred_id);

-- 3. Function to generate a random 6-character alphanumeric string
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
    is_unique BOOLEAN := false;
BEGIN
    WHILE NOT is_unique LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * 36)::int + 1, 1);
        END LOOP;
        
        -- Check uniqueness
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = result) THEN
            is_unique := true;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- 4. Trigger to auto-generate referral code for new profiles OR during an update if missing
CREATE OR REPLACE FUNCTION set_referral_code_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_referral_code ON public.profiles;
CREATE TRIGGER ensure_referral_code
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION set_referral_code_trigger();

-- Backfill existing profiles with referral codes
UPDATE public.profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- 5. Helper function to process referrals on first order
CREATE OR REPLACE FUNCTION process_referral_reward(p_user_id UUID, p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_referral_id UUID;
    v_referrer_id UUID;
    v_cash_order_count INTEGER;
    v_fx_order_count INTEGER;
    v_total_orders INTEGER;
BEGIN
    -- Check if there is a pending referral for this user
    SELECT id, referrer_id INTO v_referral_id, v_referrer_id 
    FROM public.referrals 
    WHERE referred_id = p_user_id AND status = 'pending';

    -- If no pending referral, exit early
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Check if this is truly their first delivered order
    SELECT COUNT(*) INTO v_cash_order_count FROM public.cash_orders WHERE user_id = p_user_id AND status = 'delivered';
    SELECT COUNT(*) INTO v_fx_order_count FROM public.fx_orders WHERE user_id = p_user_id AND status = 'delivered';
    v_total_orders := v_cash_order_count + v_fx_order_count;

    -- If exactly 1 delivered order (the one that just completed), process the reward
    IF v_total_orders = 1 THEN
        -- Mark referral as completed
        UPDATE public.referrals SET status = 'completed', updated_at = now() WHERE id = v_referral_id;

        -- Reward the Referrer with 10,000 points (Rs 250)
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (v_referrer_id, 10000, 'referral_bonus', 'earned', 'credit', 'Bonus for referring a new active user', p_order_id);

        -- Update Referrer balance safely
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 10000 WHERE id = v_referrer_id;
    END IF;
END;
$$;

-- 6. Update complete_cash_order to call process_referral_reward
CREATE OR REPLACE FUNCTION complete_cash_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_amount NUMERIC;
    v_tx_amount NUMERIC;
BEGIN
    -- 1. Get transaction amount first (if still held)
    SELECT amount INTO v_tx_amount 
    FROM public.wallet_transactions 
    WHERE order_id = p_order_id AND status = 'held'
    FOR UPDATE;

    -- 2. Update order status if not already delivered
    UPDATE public.cash_orders 
    SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING item_value INTO v_amount;

    -- 3. Check if we need to proceed (either order was updated OR tx is still held)
    IF v_amount IS NULL AND v_tx_amount IS NULL THEN
        RETURN jsonb_build_object('success', true, 'note', 'Already completed');
    END IF;

    -- 4. If transaction is still held, deduct balance and complete it
    IF v_tx_amount IS NOT NULL THEN
        UPDATE public.wallets 
        SET available_balance = available_balance - v_tx_amount
        WHERE user_id = p_user_id;

        UPDATE public.wallet_transactions 
        SET status = 'completed', 
            description = 'Cash Order Completion'
        WHERE order_id = p_order_id AND status = 'held';
    END IF;

    -- 5. Credit Rewards (if not already awarded)
    IF COALESCE(v_amount, 0) >= 500 AND NOT EXISTS (SELECT 1 FROM public.reward_transactions WHERE reference_id = p_order_id AND activity_type = 'order_delivery') THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'order_delivery', 'earned', 'credit', 'Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    -- 6. Process Referral Rewards (if any)
    IF v_amount IS NOT NULL THEN
        PERFORM process_referral_reward(p_user_id, p_order_id);
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;


-- 7. Update complete_fx_order to call process_referral_reward
CREATE OR REPLACE FUNCTION complete_fx_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_amount NUMERIC;
    v_tx_amount NUMERIC;
BEGIN
    -- 1. Get transaction amount first (if still held)
    SELECT amount INTO v_tx_amount 
    FROM public.wallet_transactions 
    WHERE order_id = p_order_id AND status = 'held'
    FOR UPDATE;

    -- 2. Update order status if not already delivered
    UPDATE public.fx_orders 
    SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING amount_total INTO v_amount;

    -- 3. Check if we need to proceed
    IF v_amount IS NULL AND v_tx_amount IS NULL THEN
        RETURN jsonb_build_object('success', true, 'note', 'Already completed');
    END IF;

    -- 4. If transaction is still held, deduct balance and complete it
    IF v_tx_amount IS NOT NULL THEN
        UPDATE public.wallets 
        SET available_balance = available_balance - v_tx_amount
        WHERE user_id = p_user_id;

        UPDATE public.wallet_transactions 
        SET status = 'completed', 
            description = 'FX Exchange Completion'
        WHERE order_id = p_order_id AND status = 'held';
    END IF;

    -- 5. Credit Rewards (only if not already awarded)
    IF COALESCE(v_amount, 0) >= 500 AND NOT EXISTS (SELECT 1 FROM public.reward_transactions WHERE reference_id = p_order_id AND activity_type = 'fx_exchange') THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'fx_exchange', 'earned', 'credit', 'FX Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    -- 6. Process Referral Rewards (if any)
    IF v_amount IS NOT NULL THEN
        PERFORM process_referral_reward(p_user_id, p_order_id);
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 8. RPC to record a new referral upon signup
CREATE OR REPLACE FUNCTION process_new_referral(p_referred_id UUID, p_referral_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_referrer_id UUID;
BEGIN
    -- Look up the UUID of the referrer using the 6-character code
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_referral_code;

    -- If the code is invalid or not found, just return silently
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
    END IF;

    -- Prevent self-referrals (just in case)
    IF v_referrer_id = p_referred_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
    END IF;

    -- Insert the pending referral
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    VALUES (v_referrer_id, p_referred_id, 'pending')
    ON CONFLICT (referred_id) DO NOTHING; -- Ensure they are only referred once

    RETURN jsonb_build_object('success', true);
END;
$$;
