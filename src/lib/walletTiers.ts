import { ASSETS } from '@/constants/assets';
import { WalletTier } from '@/contexts/UserContext';
import { supabase } from './supabase';
// ... (rest of imports remain same)
// Dark carousel card overrides (Starter-specific)
// New assets
// New Card Assets
// Settings Card Assets
// Carousel Card Assets (Light)
export type { WalletTier };
export interface TierConfig {
  name: WalletTier;
  badge: string;
  chip: string;
  diamond: string;
  // Detailed page fields
  headerTitle: string;
  headerSubtitle: string;
  headerImage: string;
  infobg: string;
  infoHeight: string; // Dynamic height for info container
  // Info sections
  verification: string;
  detailedVerification: string; // Separate verification for detail page
  walletLimit: string;
  dailyTopUpLimit: string;
  withdrawals: string;
  withdrawLimit: string; // Existing, keep for compatibility
  limitations: string;
  detailedLimitations: string; // Separate limitations for detail page
  // Custom Sections
  whyTitle: string;
  whyContent: string[];
  powerTitle: string;
  powerContent: string;
  downgradeTitle: string;
  downgradeContent: string;
  note: string;
  // Button
  buttonText: string;
  buttonAction: string;
}
const placeholderContent = {
  dailyTopUpLimit: '₹5,000/day',
  withdrawals: 'Up to ₹3,000 (takes under 30 mins, we swear)',
  verification: 'Mobile number + vibes',
  detailedVerification: 'Mobile number + vibes',
  limitations: 'Add money cooldown, withdraw cannot exceed ₹3,000 a day.',
  detailedLimitations:
    '1. 24-hour nap after each withdrawal 2. ₹3K/day top-up cap 3. No FX Conversion',
  whyTitle: 'Why you’re on STARTER?',
  whyContent: [
    'No KYC, no drama',
    'Bare minimum, but works',
    "Perfect if you're just testing the waters or scared of commitment",
  ],
  powerTitle: 'Craving more power?',
  powerContent:
    "Upgrade to PRO, ELITE, or SUPREME\nGet higher limits, faster everything, and the good stuff we don't offer free users.",
  downgradeTitle: 'Downgrade Options',
  downgradeContent:
    "You can’t.\nYou're already at rock bottom.\nBut hey, we love you anyway.\n(Still curious? Go to Settings > Manage Subscription)",
  note: 'Starter is always free — and always mildly disappointing.\nBest for ghosting big transactions. Ideal for light use, tight budgets, and commitment-phobes.',
  buttonText: 'Compare Plans',
  buttonAction: '/wallet-settings',
  infoHeight: '228px',
};
export const tiers: TierConfig[] = [
  {
    name: 'Starter',
    badge: 'Free',
    chip: ASSETS.FREECHIP,
    diamond: ASSETS.STARTERDIAMOND,
    walletLimit: '₹5,000',
    withdrawLimit: '₹3,000',
    headerTitle: 'STARTER',
    headerSubtitle: '₹5,000 / wallet limit',
    headerImage: ASSETS.STARTER_EXPAND,
    infobg: ASSETS.INFOBG,
    ...placeholderContent,
    withdrawals: 'Up to ₹3,000 (takes under 30 mins, we swear)',
    limitations: 'Withdraw limit of ₹3,000 is applied.',
  },
  {
    name: 'Pro',
    badge: '₹25/month',
    chip: ASSETS.PROCHIP,
    diamond: ASSETS.PRO,
    walletLimit: '₹15,000',
    withdrawLimit: '₹10,000',
    headerTitle: 'PRO',
    headerSubtitle: '₹15,000 / wallet limit',
    headerImage: ASSETS.PRO_EXPAND,
    infobg: ASSETS.INFOBG,
    ...placeholderContent,
    dailyTopUpLimit: '₹10,000/day',
    withdrawals: 'Up to ₹10,000 (takes under 30 mins, we swear)',
    limitations: 'Add money cooldown, withdraw cannot exceed ₹10,000 a day.',
    detailedLimitations:
      '1. Still has a 24-hour timeout after withdrawals (we all need a nap) 2. Max ₹10K/day top-up cap. You’re powerful, not unstoppable',
    infoHeight: 'auto',
    whyTitle: 'Why upgrade to Pro?',
    whyContent: [
      'Finally, some breathing room in your wallet',
      'Unlock faster top-ups — because cash emergencies are real',
      'Supports FX Exchange',
      'Basically, you get to flex — legally',
    ],
    powerTitle: '',
    powerContent: '',
    downgradeTitle: 'How to upgrade?',
    downgradeContent:
      '1. Do your KYC (you knew this was coming)\n2. Upload PAN & Address proof (yes, readable please)\n3. Boom — enjoy your new powers instantly',
    note: "PRO costs ₹50. Your documents and a smidge of effort. We promise it's less painful than filling out a government form.",
    buttonText: 'Upgrade Now',
    buttonAction: '/subscription-details',
  },
  {
    name: 'Elite',
    badge: '₹50/month',
    chip: ASSETS.ELITECHIP,
    diamond: ASSETS.ELITE,
    headerTitle: 'ELITE',
    headerSubtitle: '₹1,00,000 / wallet limit',
    headerImage: ASSETS.ELITE_EXPAND,
    infobg: ASSETS.INFOBG,
    ...placeholderContent,
    verification: 'PAN, Address proof',
    detailedVerification: 'PAN & Address proof (the usual drill)',
    walletLimit: '₹50,000',
    dailyTopUpLimit: '₹25,000/day',
    withdrawLimit: '₹50,000',
    withdrawals: 'Up to ₹50,000 (takes under 30 mins, we swear)',
    detailedLimitations:
      '1. 24-hour post withdrawals cooldown 2. ₹25K/day top-up cap. Try not to break the matrix',
    limitations: 'No limitations, withdraw cannot exceed ₹25,000 a day.',
    infoHeight: 'auto',
    whyTitle: 'Why upgrade to Elite?',
    whyContent: [
      "You're done playing in the kiddie pool",
      'Big wallet = big moves = big dopamine',
      "Fast, seamless top-ups. Blink and it's done",
      'Supports FX Exchange',
      'Priority processing. Because queues are for peasants',
    ],
    powerTitle: '',
    powerContent: '',
    downgradeTitle: 'How to upgrade?',
    downgradeContent:
      '1. Upload your KYC (yes, again)\n2. Pay ₹50/month — aka less than one sad coffee\n3. Instantly unlock the ELITE mode. Speed. Status. Swagger.',
    note: 'Auto-renews monthly. Cancel whenever you stop feeling fancy.',
    buttonText: 'Upgrade Now',
    buttonAction: '/subscription-details',
  },
  {
    name: 'Supreme',
    badge: '₹100/month',
    chip: ASSETS.SUPREMECHIP,
    diamond: ASSETS.SUPREME,
    headerTitle: 'SUPREME',
    headerSubtitle: 'No limit / wallet limit',
    headerImage: ASSETS.SUPREME_EXPAND,
    infobg: ASSETS.INFOBG,
    ...placeholderContent,
    verification: 'PAN, Address proof',
    detailedVerification: 'PAN & Address proof (KYC, of course)',
    walletLimit: '₹150,000',
    dailyTopUpLimit: '₹100,000/day',
    withdrawLimit: 'Full wallet balance',
    withdrawals: 'Your whole damn balance. Whenever. No caps.',
    detailedLimitations: '1. LMAO. None.',
    limitations: 'No limitations.',
    infoHeight: 'auto',
    whyTitle: 'Why upgrade to Supreme?',
    whyContent: [
      "You don't wait. You withdraw. Fully. Instantly.",
      'No cooldowns. No daily caps. No rules.',
      'Built for business bosses, chaos wizards, and cashflow junkies',
      'Priority withdrawals & dedicated support minions',
      'Max top-ups. Max freedom. Max you.',
      'Supports FX Exchange',
    ],
    powerTitle: '',
    powerContent: '',
    downgradeTitle: 'How to upgrade?',
    downgradeContent:
      "1. Be ELITE (duh)\n2. Drop in your business proof (optional — but hey, adds instant legitimacy).\n3. Pay ₹100/month — it's cheaper than your ego, I promise\n4. Tap 'Upgrade'. Shatter ceilings. Enter beast mode.",
    note: 'SUPREME is your no-limits, god-tier wallet plan. Cancel anytime. But why would you?',
    buttonText: 'Upgrade Now',
    buttonAction: '/subscription-details',
  },
];
export const tierIconMap: Record<WalletTier, string> = {
  Starter: ASSETS.STARTERDIAMOND,
  Pro: ASSETS.PRO,
  Elite: ASSETS.ELITE,
  Supreme: ASSETS.SUPREME,
};
export const tierCardMap: Record<WalletTier, string> = {
  Starter: ASSETS.WALLET_STARTER,
  Pro: ASSETS.PRO_CREATED,
  Elite: ASSETS.ELITE_CREATED,
  Supreme: ASSETS.SUPREME_CREATED,
};
export const tierCardMapLight: Record<WalletTier, string> = {
  Starter: ASSETS.WALLET_CREATED_STARTER_LIGHT,
  Pro: ASSETS.WALLET_CREATED_PRO_LIGHT,
  Elite: ASSETS.WALLET_CREATED_ELITE_LIGHT,
  Supreme: ASSETS.WALLET_CREATED_SUPREME_LIGHT,
};
export const tierSettingsCardMap: Record<WalletTier, string> = {
  Starter: ASSETS.STARTER_SETTINGS,
  Pro: ASSETS.PRO_SETTINGS,
  Elite: ASSETS.ELITE_SETTINGS,
  Supreme: ASSETS.SUPREME_SETTINGS,
};
export const tierSettingsCardMapLight: Record<WalletTier, string> = {
  Starter: ASSETS.STARTER_SETTINGS_LIGHT,
  Pro: ASSETS.PRO_SETTINGS_LIGHT,
  Elite: ASSETS.ELITE_SETTINGS_LIGHT,
  Supreme: ASSETS.SUPREME_SETTINGS_LIGHT,
};
export const tierCarouselActiveMap: Record<WalletTier, string> = {
  Starter: ASSETS.STARTER_SELECTED_LIGHT,
  Pro: ASSETS.PRO_SELECTED_LIGHT,
  Elite: ASSETS.ELITE_SELECTED_LIGHT,
  Supreme: ASSETS.SUPREME_SELECTED_LIGHT,
};
export const tierCarouselInactiveMap: Record<WalletTier, string> = {
  Starter: ASSETS.STARTER_NONSELECTED_LIGHT,
  Pro: ASSETS.PRO_NONSELECTED_LIGHT,
  Elite: ASSETS.ELITE_NONSELECTED_LIGHT,
  Supreme: ASSETS.SUPREME_NONSELECTED_LIGHT,
};
export const tierChipColorMap: Record<WalletTier, string> = {
  Starter: '#000000',
  Pro: '#2F82FF',
  Elite: '#B158E7',
  Supreme: '#FF6A8E',
};
export const tierExpandCardMapLight: Record<WalletTier, string> = {
  Starter: ASSETS.STARTER_EXPAND_LIGHT,
  Pro: ASSETS.PRO_EXPAND_LIGHT,
  Elite: ASSETS.ELITE_EXPAND_LIGHT,
  Supreme: ASSETS.SUPREME_EXPAND_LIGHT,
};
export const tierCarouselActiveMapDark: Record<WalletTier, string> = {
  Starter: ASSETS.STARTER_SELECTED_DARK,
  Pro: ASSETS.PRO_SELECTED_DARK,
  Elite: ASSETS.ELITE_SELECTED_DARK,
  Supreme: ASSETS.SUPREME_SELECTED_DARK,
};
export const tierCarouselInactiveMapDark: Record<WalletTier, string> = {
  Starter: ASSETS.STARTER_NONSELECTED_DARK,
  Pro: ASSETS.PRO_NONSELECTED_DARK,
  Elite: ASSETS.ELITE_NONSELECTED_DARK,
  Supreme: ASSETS.SUPREME_NONSELECTED_DARK,
};
/**
 * Fetches tier subscription prices from the database.
 */
export const fetchTierPrices = async (): Promise<Record<string, number>> => {
  const { data, error } = await supabase.from('wallet_tiers').select('name, subscription_price');
  if (error) throw error;
  const priceMap: Record<string, number> = {};
  data?.forEach(t => {
    priceMap[t.name.toLowerCase()] = Number(t.subscription_price) || 0;
  });
  return priceMap;
};
