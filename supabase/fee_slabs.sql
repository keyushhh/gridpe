-- Slab-based fee configuration table
CREATE TABLE IF NOT EXISTS public.fee_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL,         -- 'cash' or 'fx'
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC,               -- NULL means no upper limit
  delivery_fee NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  gst_rate NUMERIC NOT NULL DEFAULT 0.18,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_fee_slabs_lookup ON public.fee_slabs (order_type, min_amount, max_amount) WHERE is_active = TRUE;

-- Seed Data (Cash Orders)
INSERT INTO public.fee_slabs (order_type, min_amount, max_amount, delivery_fee, platform_fee) VALUES
  ('cash', 0,      999,   8.00,  4.00),
  ('cash', 1000,   1999,  12.00, 5.00),
  ('cash', 2000,   4999,  15.00, 6.00),
  ('cash', 5000,   NULL,  20.00, 8.00)
ON CONFLICT DO NOTHING;

-- Seed Data (FX Orders)
INSERT INTO public.fee_slabs (order_type, min_amount, max_amount, delivery_fee, platform_fee) VALUES
  ('fx', 0,      999,   8.00,  4.00),
  ('fx', 1000,   1999,  12.00, 5.00),
  ('fx', 2000,   4999,  15.00, 6.00),
  ('fx', 5000,   NULL,  20.00, 8.00)
ON CONFLICT DO NOTHING;
