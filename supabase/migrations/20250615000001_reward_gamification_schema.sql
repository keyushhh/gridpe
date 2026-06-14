-- 1. Add missing columns to existing tables (if not already there)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reward_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_order_date DATE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS reward_points_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reward_points_redeemed INTEGER NOT NULL DEFAULT 0;

-- 2. Create reward_transactions table
CREATE TABLE IF NOT EXISTS reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus', 'referral', 'streak_bonus', 'badge_bonus')),
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('order', 'referral', 'badge', 'streak', 'manual')),
  description TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 months'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create badges table (master list of all possible badges)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('order_count', 'total_spent', 'streak_days', 'referral_count', 'first_action')),
  criteria_value INTEGER NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 5. Create achievements table (milestone tracker)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('first_order', 'order_5', 'order_10', 'order_25', 'order_50', 'referral_1', 'referral_5', 'streak_7', 'streak_30', 'pro_member')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, achievement_type)
);

-- 6. Seed the badges master list (use INSERT ... ON CONFLICT DO NOTHING)
INSERT INTO badges (slug, name, description, icon_name, points_reward, criteria_type, criteria_value, tier) VALUES
('first_order', 'First Step', 'Placed your first cash delivery order', 'ShoppingBag', 100, 'first_action', 1, 'bronze'),
('order_5', 'Getting Started', 'Completed 5 orders', 'Package', 250, 'order_count', 5, 'bronze'),
('order_10', 'Regular', 'Completed 10 orders', 'Star', 500, 'order_count', 10, 'silver'),
('order_25', 'Power User', 'Completed 25 orders', 'Zap', 1000, 'order_count', 25, 'gold'),
('order_50', 'Grid Elite', 'Completed 50 orders', 'Crown', 2500, 'order_count', 50, 'platinum'),
('streak_7', 'Week Warrior', '7-day order streak', 'Flame', 500, 'streak_days', 7, 'silver'),
('streak_30', 'Monthly Master', '30-day order streak', 'Trophy', 2000, 'streak_days', 30, 'gold'),
('referral_1', 'Connector', 'Referred your first friend', 'Users', 500, 'referral_count', 1, 'bronze'),
('referral_5', 'Community Builder', 'Referred 5 friends', 'Network', 2000, 'referral_count', 5, 'gold')
ON CONFLICT (slug) DO NOTHING;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_type ON reward_transactions(type);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_expires_at ON reward_transactions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 8. Generate referral codes for all existing profiles that don't have one
UPDATE profiles 
SET referral_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- 9. IMPORTANT — RLS
-- Keep RLS disabled on all new tables for now (matching existing dev pattern).
-- These will be secured before production with auth.uid() policies.
ALTER TABLE reward_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
