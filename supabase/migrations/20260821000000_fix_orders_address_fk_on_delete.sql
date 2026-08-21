-- Migration: Allow deleting addresses without breaking foreign key constraints on past orders
-- Ensures orders.address_id, cash_orders.address_id, fx_orders.address_id are set to NULL when an address is deleted.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_orders_address' AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT fk_orders_address;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cash_orders_address_id_fkey' AND table_name = 'cash_orders'
  ) THEN
    ALTER TABLE public.cash_orders DROP CONSTRAINT cash_orders_address_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fx_orders_address_id_fkey' AND table_name = 'fx_orders'
  ) THEN
    ALTER TABLE public.fx_orders DROP CONSTRAINT fx_orders_address_id_fkey;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.orders
  ADD CONSTRAINT fk_orders_address
  FOREIGN KEY (address_id)
  REFERENCES public.addresses(id)
  ON DELETE SET NULL;

-- Security Definer RPC to atomically unbind and delete a user address
CREATE OR REPLACE FUNCTION public.delete_user_address(p_address_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Unlink foreign keys from orders, cash_orders, and fx_orders
  UPDATE public.orders SET address_id = NULL WHERE address_id = p_address_id AND user_id = p_user_id;
  UPDATE public.cash_orders SET address_id = NULL WHERE address_id = p_address_id AND user_id = p_user_id;
  UPDATE public.fx_orders SET address_id = NULL WHERE address_id = p_address_id AND user_id = p_user_id;

  -- Delete address
  DELETE FROM public.addresses WHERE id = p_address_id AND user_id = p_user_id;
END;
$$;
