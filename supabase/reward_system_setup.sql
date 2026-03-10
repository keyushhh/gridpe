-- =============================================================================
-- FINAL REWARDS & ORDER SYSTEM FIX (CONSOLIDATED)
-- =============================================================================

-- 1. Profiles Sync System
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reward_points BIGINT DEFAULT 0;

-- 2. Ensure Order Tables match Frontend Model
-- For cash_orders
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id);
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS gst NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS delivery_tip NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;

-- For fx_orders
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id);
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS gst NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS delivery_tip NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;

-- 3. Reward Transactions Ledger
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL, -- renamed from amount to match fixed schema
    activity_type TEXT, -- added to track source of rewards
    type TEXT NOT NULL, -- 'earned', 'redeemed'
    transaction_type TEXT, -- 'credit', 'debit'
    description TEXT,
    reference_id UUID, -- order_id or redemption_id
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '12 months')
);

-- Ensure columns exist if table already existed
ALTER TABLE IF EXISTS public.reward_transactions 
ADD COLUMN IF NOT EXISTS points_amount INTEGER,
ADD COLUMN IF NOT EXISTS activity_type TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT;

-- 4. Enable RLS and Set Policies with DROP guards
ALTER TABLE public.cash_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

-- Cash Orders Policies
DROP POLICY IF EXISTS "Users can view their own cash orders" ON public.cash_orders;
CREATE POLICY "Users can view their own cash orders" 
ON public.cash_orders FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- FX Orders Policies
DROP POLICY IF EXISTS "Users can view their own fx orders" ON public.fx_orders;
CREATE POLICY "Users can view their own fx orders" 
ON public.fx_orders FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Reward Transactions Policies
DROP POLICY IF EXISTS "Users can view their own reward transactions" ON public.reward_transactions;
CREATE POLICY "Users can view their own reward transactions" 
ON public.reward_transactions FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reward transactions" ON public.reward_transactions;
CREATE POLICY "Users can insert their own reward transactions" 
ON public.reward_transactions FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 5. Updated RPC: create_cash_order
CREATE OR REPLACE FUNCTION create_cash_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC, -- This is the item_value
    p_order_type TEXT,
    p_delivery_fee NUMERIC DEFAULT 0,
    p_platform_fee NUMERIC DEFAULT 0,
    p_gst NUMERIC DEFAULT 0,
    p_delivery_tip NUMERIC DEFAULT 0,
    p_total_amount NUMERIC DEFAULT 0,
    p_meta_data JSONB DEFAULT '{}'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- [DEFERRED DEDUCTION] Balance is no longer deducted here.
    -- It will be deducted in complete_cash_order.

    INSERT INTO public.cash_orders (
        user_id, address_id, item_value, delivery_fee, platform_fee, gst, delivery_tip, total_amount, status, payment_mode, metadata
    ) VALUES (
        p_user_id, p_address_id, p_amount, p_delivery_fee, p_platform_fee, p_gst, p_delivery_tip,
        COALESCE(NULLIF(p_total_amount, 0), p_amount + p_delivery_fee + p_platform_fee + p_gst + p_delivery_tip),
        'processing', 'wallet', p_meta_data
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.wallet_transactions (
        user_id, type, amount, status, description, order_id, metadata
    ) VALUES (
        p_user_id, 'debit', COALESCE(NULLIF(p_total_amount, 0), p_amount + p_delivery_fee + p_platform_fee + p_gst + p_delivery_tip), 
        'held', 'Cash Order Placement', v_order_id, p_meta_data || jsonb_build_object('order_id', v_order_id)
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 6. Updated RPC: create_fx_order (Matched with cleanup script)
CREATE OR REPLACE FUNCTION create_fx_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC, -- amount to receive (INR)
    p_order_type TEXT,
    p_delivery_fee NUMERIC DEFAULT 0,
    p_platform_fee NUMERIC DEFAULT 0,
    p_gst NUMERIC DEFAULT 0,
    p_delivery_tip NUMERIC DEFAULT 0,
    p_total_amount NUMERIC DEFAULT 0, -- amount to pay/hold (INR)
    p_meta_data JSONB DEFAULT '{}'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
    v_hold_amount NUMERIC;
BEGIN
    -- Determine hold amount
    v_hold_amount := COALESCE(NULLIF(p_total_amount, 0), p_amount);
    
    -- [DEFERRED DEDUCTION] Balance is no longer deducted here.
    -- It will be deducted in complete_fx_order.

    INSERT INTO public.fx_orders (
        user_id, address_id, amount_total, delivery_fee, platform_fee, gst, delivery_tip, total_amount, status, payment_mode, metadata
    ) VALUES (
        p_user_id, p_address_id, p_amount, p_delivery_fee, p_platform_fee, p_gst, p_delivery_tip,
        v_hold_amount, 'processing', 'wallet', p_meta_data
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.wallet_transactions (
        user_id, type, amount, status, description, order_id, metadata
    ) VALUES (
        p_user_id, 'debit', v_hold_amount, 'held', 'FX Exchange Placement', v_order_id, p_meta_data || jsonb_build_object('order_id', v_order_id, 'isFx', true)
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 7. Atomic Completion & Reward Movement
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
        -- If both are null, it means it's truly not found or already fully completed
        -- We return success: true but with a note if already completed to avoid frontend errors
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

    -- 5. Credit Rewards (only if not already awarded - avoid double counting)
    -- We check if a reward transaction already exists for this order
    IF COALESCE(v_amount, 0) >= 500 AND NOT EXISTS (SELECT 1 FROM public.reward_transactions WHERE reference_id = p_order_id AND activity_type = 'order_delivery') THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'order_delivery', 'earned', 'credit', 'Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

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
            description = 'FX Exchange Completion'
        WHERE order_id = p_order_id AND status = 'held';
    END IF;

    -- 5. Credit Rewards (only if not already awarded)
    IF COALESCE(v_amount, 0) >= 500 AND NOT EXISTS (SELECT 1 FROM public.reward_transactions WHERE reference_id = p_order_id AND activity_type = 'fx_exchange') THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'fx_exchange', 'earned', 'credit', 'FX Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 8. Cancel Order RPC: Atomically returns funds
CREATE OR REPLACE FUNCTION cancel_order(p_order_id UUID, p_user_id UUID, p_reason TEXT DEFAULT 'Cancelled by user')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_is_fx BOOLEAN;
    v_hold_amount NUMERIC;
BEGIN
    -- 1. Determine order type and check existence
    IF EXISTS (SELECT 1 FROM public.cash_orders WHERE id = p_order_id AND user_id = p_user_id) THEN
        v_is_fx := FALSE;
    ELSIF EXISTS (SELECT 1 FROM public.fx_orders WHERE id = p_order_id AND user_id = p_user_id) THEN
        v_is_fx := TRUE;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- 2. Check if already cancelled/delivered
    IF v_is_fx THEN
        IF EXISTS (SELECT 1 FROM public.fx_orders WHERE id = p_order_id AND status IN ('cancelled', 'delivered')) THEN
             RETURN jsonb_build_object('success', false, 'error', 'Order already final');
        END IF;
        UPDATE public.fx_orders 
        SET status = 'cancelled', 
            metadata = metadata || jsonb_build_object('cancelled_at', now(), 'cancel_reason', p_reason)
        WHERE id = p_order_id;
    ELSE
        IF EXISTS (SELECT 1 FROM public.cash_orders WHERE id = p_order_id AND status IN ('cancelled', 'delivered')) THEN
             RETURN jsonb_build_object('success', false, 'error', 'Order already final');
        END IF;
        UPDATE public.cash_orders 
        SET status = 'cancelled', 
            metadata = metadata || jsonb_build_object('cancelled_at', now(), 'cancel_reason', p_reason)
        WHERE id = p_order_id;
    END IF;

    -- 3. Release held funds (Mark as cancelled)
    UPDATE public.wallet_transactions 
    SET status = 'cancelled', 
        description = 'Hold Released: Order Cancelled'
    WHERE order_id = p_order_id AND status = 'held';

    RETURN jsonb_build_object('success', true);
END; $$;
