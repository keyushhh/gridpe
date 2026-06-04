CREATE TABLE IF NOT EXISTS rider_interest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public inserts, no auth required
ALTER TABLE rider_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public inserts" ON rider_interest
  FOR INSERT TO anon WITH CHECK (true);
