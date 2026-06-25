export interface OrderMessage {
  id: string;
  order_id: string;
  sender_type: 'rider' | 'customer';
  sender_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  icon_name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  description: string;
  points_reward: number;
  criteria_type: string;
  criteria_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badges?: Badge;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  earned_at: string;
  points_awarded: number;
}

export const CUSTOMER_QUICK_REPLIES = [
  'Ok, thank you!',
  'Please hurry',
  'I am at the door',
  'Call me please',
  'Leave it at the door',
  'Coming downstairs',
] as const;

export type CustomerQuickReply = typeof CUSTOMER_QUICK_REPLIES[number];
