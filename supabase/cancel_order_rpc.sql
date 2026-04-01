-- =============================================================================
-- Atomic Order Cancellation & Full Refund RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id UUID,
  p_user_id UUID,
  p_cancel_reason_type TEXT,
  p_cancel_reason_text TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- 1. Fetch order and lock it to prevent concurrent status updates
  SELECT * INTO v_order FROM orders
  WHERE id = p_order_id 
    AND user_id = p_user_id
    AND status NOT IN ('delivered', 'cancelled', 'picked_up')
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or already completed/picked up/cancelled');
  END IF;
  
  -- 2. Cancel the order
  UPDATE orders SET
    status = 'cancelled',
    cancelled_by = 'user',
    cancelled_at = now(),
    cancel_reason_type = p_cancel_reason_type,
    cancel_reason_text = p_cancel_reason_text
  WHERE id = p_order_id;
  
  -- 3. Refund FULL total_amount to available_balance
  -- total_amount includes item_value + delivery_fee + gst + platform_fee + delivery_tip
  UPDATE wallets SET
    available_balance = available_balance + v_order.total_amount
  WHERE user_id = p_user_id;
  
  -- 4. Insert transaction record for the refund
  INSERT INTO wallet_transactions (user_id, order_id, amount, type, status, description)
  VALUES (
    p_user_id, 
    p_order_id, 
    v_order.total_amount, 
    'refund', 
    'completed', 
    'Refund for Cancelled Order #' || UPPER(LEFT(p_order_id::text, 8))
  );
  
  -- 5. Return success result
  RETURN jsonb_build_object(
    'success', true,
    'refunded_amount', v_order.total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
