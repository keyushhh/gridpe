-- Create a table to log incoming webhooks for debugging purposes
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    event_type TEXT,
    payload JSONB,
    vendor_data TEXT,
    error TEXT
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert/select
DROP POLICY IF EXISTS "Service role can do everything" ON public.webhook_logs;
CREATE POLICY "Service role can do everything" ON public.webhook_logs
    USING (true)
    WITH CHECK (true);
