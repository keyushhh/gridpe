-- 1A. Drop the old user_subscriptions table cleanly:
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- 1B. Create new user_subscriptions table:
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) 
    ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'free' 
    CHECK (plan_tier IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'expired', 'cancelled')),
  billing_cycle TEXT 
    CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_paid NUMERIC,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_subscriptions_active_user 
  ON public.user_subscriptions(user_id) 
  WHERE status = 'active';

CREATE INDEX idx_user_subscriptions_user_id 
  ON public.user_subscriptions(user_id);

CREATE INDEX idx_user_subscriptions_expires_at 
  ON public.user_subscriptions(expires_at);

-- 1C. Add plan_tier column to profiles table:
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS plan_tier TEXT 
  NOT NULL DEFAULT 'free'
  CHECK (plan_tier IN ('free', 'pro'));

-- 1D. Add Pro fee slabs to fee_slabs table:
ALTER TABLE public.fee_slabs 
  ADD COLUMN IF NOT EXISTS plan_tier TEXT 
  NOT NULL DEFAULT 'free'
  CHECK (plan_tier IN ('free', 'pro'));

UPDATE public.fee_slabs 
  SET plan_tier = 'free' 
  WHERE plan_tier IS NULL OR plan_tier = '';

INSERT INTO public.fee_slabs 
  (order_type, plan_tier, min_amount, max_amount, 
   delivery_fee, platform_fee, gst_rate, is_active)
VALUES
  -- Pro cash slabs (discounted delivery fee)
  ('cash', 'pro', 0, 999, 5.00, 4.00, 0.18, true),
  ('cash', 'pro', 1000, 1999, 8.00, 5.00, 0.18, true),
  ('cash', 'pro', 2000, 4999, 10.00, 6.00, 0.18, true),
  ('cash', 'pro', 5000, NULL, 13.00, 8.00, 0.18, true),
  -- Pro FX slabs (discounted delivery fee)
  ('fx', 'pro', 0, 999, 5.00, 4.00, 0.18, true),
  ('fx', 'pro', 1000, 1999, 8.00, 5.00, 0.18, true),
  ('fx', 'pro', 2000, 4999, 10.00, 6.00, 0.18, true),
  ('fx', 'pro', 5000, NULL, 13.00, 8.00, 0.18, true);

-- 1E. Create withdrawal limits table:
CREATE TABLE public.withdrawal_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL 
    CHECK (plan_tier IN ('free', 'pro')),
  daily_limit NUMERIC NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.withdrawal_limits 
  (plan_tier, daily_limit, monthly_limit)
VALUES
  ('free', 5000, 25000),
  ('pro', 50000, 200000);

-- 1F. Create helper function to get user's active plan tier:
CREATE OR REPLACE FUNCTION public.get_user_plan_tier(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_tier TEXT;
BEGIN
  SELECT plan_tier 
  INTO v_plan_tier
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_plan_tier, 'free');
END;
$$;

-- 1G. Update get_order_quote function to accept user_id and return tier-based fees:
CREATE OR REPLACE FUNCTION public.get_order_quote(
  p_amount NUMERIC,
  p_order_type TEXT,
  p_distance_km NUMERIC DEFAULT 0,
  p_service_amount NUMERIC DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delivery_fee NUMERIC;
  v_platform_fee NUMERIC;
  v_gst_rate NUMERIC;
  v_gst NUMERIC;
  v_total_payable NUMERIC;
  v_plan_tier TEXT;
BEGIN
  -- Get user plan tier
  IF p_user_id IS NOT NULL THEN
    v_plan_tier := public.get_user_plan_tier(p_user_id);
  ELSE
    v_plan_tier := 'free';
  END IF;

  -- Lookup correct slab for user's tier
  SELECT delivery_fee, platform_fee, gst_rate
  INTO v_delivery_fee, v_platform_fee, v_gst_rate
  FROM public.fee_slabs
  WHERE order_type = p_order_type
    AND plan_tier = v_plan_tier
    AND is_active = TRUE
    AND p_amount >= min_amount
    AND (max_amount IS NULL OR p_amount <= max_amount)
  LIMIT 1;

  -- Fallback to free tier if no pro slab found
  IF v_delivery_fee IS NULL AND v_plan_tier = 'pro' THEN
    SELECT delivery_fee, platform_fee, gst_rate
    INTO v_delivery_fee, v_platform_fee, v_gst_rate
    FROM public.fee_slabs
    WHERE order_type = p_order_type
      AND plan_tier = 'free'
      AND is_active = TRUE
      AND p_amount >= min_amount
      AND (max_amount IS NULL OR p_amount <= max_amount)
    LIMIT 1;
  END IF;

  IF v_delivery_fee IS NULL THEN
    RAISE EXCEPTION 
      'No fee configuration found for order type % and amount %', 
      p_order_type, p_amount;
  END IF;

  -- Calculate GST and Total
  v_gst := (v_delivery_fee + v_platform_fee + p_service_amount) * v_gst_rate;
  v_total_payable := p_amount + v_delivery_fee + v_platform_fee + v_gst;

  RETURN jsonb_build_object(
    'item_value', p_amount,
    'delivery_fee', v_delivery_fee,
    'platform_fee', v_platform_fee,
    'gst', ROUND(v_gst, 2),
    'gst_rate', v_gst_rate,
    'total_payable', ROUND(v_total_payable, 2),
    'service_amount', p_service_amount,
    'plan_tier', v_plan_tier
  );
END;
$$;

-- 1H. Create withdrawal limit check function:
CREATE OR REPLACE FUNCTION public.check_withdrawal_limits(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_tier TEXT;
  v_daily_limit NUMERIC;
  v_monthly_limit NUMERIC;
  v_daily_used NUMERIC;
  v_monthly_used NUMERIC;
BEGIN
  -- Get user plan tier
  v_plan_tier := public.get_user_plan_tier(p_user_id);
  
  -- Get limits for tier
  SELECT daily_limit, monthly_limit
  INTO v_daily_limit, v_monthly_limit
  FROM public.withdrawal_limits
  WHERE plan_tier = v_plan_tier
    AND is_active = TRUE
  LIMIT 1;

  -- Calculate today's usage
  SELECT COALESCE(SUM(amount), 0)
  INTO v_daily_used
  FROM public.orders
  WHERE user_id = p_user_id
    AND order_type = 'cash'
    AND status NOT IN ('cancelled', 'failed')
    AND created_at >= CURRENT_DATE;

  -- Calculate this month's usage
  SELECT COALESCE(SUM(amount), 0)
  INTO v_monthly_used
  FROM public.orders
  WHERE user_id = p_user_id
    AND order_type = 'cash'
    AND status NOT IN ('cancelled', 'failed')
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);

  RETURN jsonb_build_object(
    'allowed', (
      (v_daily_used + p_amount) <= v_daily_limit 
      AND 
      (v_monthly_used + p_amount) <= v_monthly_limit
    ),
    'plan_tier', v_plan_tier,
    'daily_limit', v_daily_limit,
    'monthly_limit', v_monthly_limit,
    'daily_used', v_daily_used,
    'monthly_used', v_monthly_used,
    'daily_remaining', (v_daily_limit - v_daily_used),
    'monthly_remaining', (v_monthly_limit - v_monthly_used)
  );
END;
$$;
