-- =============================================================================
-- Atomic RPC: apply_tier_forfeiture
-- SECURITY DEFINER bypasses RLS. Handles the full haircut:
--   1. Inserts the tier_adjustment debit transaction
--   2. Caps available_balance on the wallets table
--   3. Flips current_tier_id and clears scheduled state on profiles
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_tier_forfeiture(
    p_user_id UUID,
    p_new_tier_id UUID,
    p_new_limit NUMERIC,
    p_current_balance NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_excess NUMERIC;
    v_tier_name TEXT;
BEGIN
    -- Get the tier name for logging
    SELECT name INTO v_tier_name FROM wallet_tiers WHERE id = p_new_tier_id;

    -- 1. Calculate excess
    v_excess := p_current_balance - p_new_limit;

    -- 2. If over-limit, insert the adjustment transaction and cap the balance
    IF v_excess > 0 THEN
        INSERT INTO wallet_transactions (
            user_id, transaction_type, amount, status, description, metadata
        ) VALUES (
            p_user_id,
            'tier_adjustment',
            v_excess,
            'completed',
            'Tier Limit Adjustment',
            jsonb_build_object(
                'scheduled_tier', COALESCE(v_tier_name, p_new_tier_id::text),
                'limit_enforced', p_new_limit,
                'burn_amount', v_excess,
                'previous_balance', p_current_balance
            )
        );

        -- Cap the wallet balance
        UPDATE wallets
        SET available_balance = p_new_limit
        WHERE user_id = p_user_id;
    END IF;

    -- 3. Flip the tier and clear the scheduled state
    UPDATE profiles
    SET current_tier_id = p_new_tier_id,
        scheduled_tier_id = NULL,
        tier_change_date = NULL
    WHERE id = p_user_id;

    -- 4. Also update the wallets table tier
    UPDATE wallets
    SET tier_id = p_new_tier_id
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'new_tier', COALESCE(v_tier_name, 'unknown'),
        'previous_balance', p_current_balance,
        'new_balance', CASE WHEN v_excess > 0 THEN p_new_limit ELSE p_current_balance END,
        'forfeited', GREATEST(v_excess, 0)
    );
END;
$$;
