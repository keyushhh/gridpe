-- Updated RPC to get order quote using slab-based pricing
-- GST is applied only to service fees (delivery, platform fees, and optional service amount).

CREATE OR REPLACE FUNCTION get_order_quote(
    p_amount NUMERIC,
    p_order_type TEXT,
    p_distance_km NUMERIC DEFAULT 1.2,
    p_service_amount NUMERIC DEFAULT 0
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_delivery_fee NUMERIC;
    v_platform_fee NUMERIC;
    v_gst_rate NUMERIC;
    v_gst NUMERIC;
    v_total_payable NUMERIC;
BEGIN
    -- 1. Lookup the correct slab
    SELECT delivery_fee, platform_fee, gst_rate
    INTO v_delivery_fee, v_platform_fee, v_gst_rate
    FROM public.fee_slabs
    WHERE order_type = p_order_type
      AND is_active = TRUE
      AND p_amount >= min_amount
      AND (max_amount IS NULL OR p_amount <= max_amount) -- changed to inclusive for standard slabs
    LIMIT 1;

    -- 2. Error if no slab found
    IF v_delivery_fee IS NULL THEN
        RAISE EXCEPTION 'No fee configuration found for order type % and amount %', p_order_type, p_amount;
    END IF;
    
    -- 3. Calculate GST and Total
    v_gst := (v_delivery_fee + v_platform_fee + p_service_amount) * v_gst_rate;
    v_total_payable := p_amount + v_delivery_fee + v_platform_fee + v_gst;

    RETURN jsonb_build_object(
        'item_value', p_amount,
        'delivery_fee', v_delivery_fee,
        'platform_fee', v_platform_fee,
        'gst', ROUND(v_gst, 2),
        'gst_rate', v_gst_rate,
        'total_payable', ROUND(v_total_payable, 2),
        'distance', p_distance_km,
        'service_amount', p_service_amount,
        'order_type', p_order_type
    );
END; $$;
