-- =======================================================================================
-- Atomic RPC: schedule_downgrade
-- Looks up the Target Tier ID and updates the user's profile with the scheduled
-- downgrade and effective date, without changing the current active tier.
-- =======================================================================================

CREATE OR REPLACE FUNCTION schedule_downgrade(
    p_user_id UUID,
    p_tier_name TEXT,
    p_tier_change_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Look up the ID for the target tier
    SELECT id INTO v_tier_id
    FROM wallet_tiers
    WHERE name ILIKE p_tier_name;

    IF v_tier_id IS NULL THEN
        RAISE EXCEPTION 'Tier not found for name: %', p_tier_name;
    END IF;

    -- 2. Update the user's profile with the scheduled tier and date
    -- Note that we specifically do NOT touch current_tier_id
    UPDATE profiles
    SET 
        scheduled_tier_id = v_tier_id,
        tier_change_date = p_tier_change_date,
        payment_status = 'pending'
    WHERE id = p_user_id;

    -- Format return JSON 
    SELECT jsonb_build_object(
        'user_id', p_user_id,
        'scheduled_tier_id', v_tier_id,
        'scheduled_tier_name', p_tier_name,
        'tier_change_date', p_tier_change_date,
        'status', 'scheduled'
    ) INTO v_result;

    RETURN v_result;
END;
$$;
