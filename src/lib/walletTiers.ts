import { WalletTier } from "@/contexts/UserContext";

import starterDiamond from "@/assets/starter diamond.png";
import proDiamond from "@/assets/pro.png";
import eliteDiamond from "@/assets/elite.png";
import supremeDiamond from "@/assets/supreme.png";
import freeChip from "@/assets/free chip.png";
import proChip from "@/assets/pro chip.png";
import eliteChip from "@/assets/elite chip.png";
import supremeChip from "@/assets/supreme chip.png";

// Dark carousel card overrides (Starter-specific)
import starterSelectedDark from "@/assets/dark-carousel/starter-selected-dark.png";
import starterNonselectedDark from "@/assets/dark-carousel/starter-nonselected-dark.png";
import proSelectedDark from "@/assets/dark-carousel/pro-selected-dark.png";
import proNonselectedDark from "@/assets/dark-carousel/pro-nonselected-dark.png";
import eliteSelectedDark from "@/assets/dark-carousel/elite-selected-dark.png";
import eliteNonselectedDark from "@/assets/dark-carousel/elite-nonselected-dark.png";
import supremeSelectedDark from "@/assets/dark-carousel/supreme-selected-dark.png";
import supremeNonselectedDark from "@/assets/dark-carousel/supreme-nonselected-dark.png";

// New assets
import starterExpand from "@/assets/starter-expand.png";
import proExpand from "@/assets/pro-expand.png";
import eliteExpand from "@/assets/elite-expand.png";
import supremeExpand from "@/assets/supreme-expand.png";

import starterExpandLight from "@/assets/light-cards/starter-expand-light.png";
import proExpandLight from "@/assets/light-cards/pro-expand-light.png";
import eliteExpandLight from "@/assets/light-cards/elite-expand-light.png";
import supremeExpandLight from "@/assets/light-cards/supreme-expand-light.png";

import infoBg from "@/assets/info bg.png";

// New Card Assets
import starterCard from "@/assets/wallet-starter.png";
import proCard from "@/assets/pro-created.png";
import eliteCard from "@/assets/elite-created.png";
import supremeCard from "@/assets/supreme-created.png";

import starterCardLight from "@/assets/light-cards/wallet-created-starter-light.png";
import proCardLight from "@/assets/light-cards/wallet-created-pro-light.png";
import eliteCardLight from "@/assets/light-cards/wallet-created-elite-light.png";
import supremeCardLight from "@/assets/light-cards/wallet-created-supreme-light.png";

// Settings Card Assets
import starterSettings from "@/assets/starter-settings.png";
import proSettings from "@/assets/pro-settings.png";
import eliteSettings from "@/assets/elite-settings.png";
import supremeSettings from "@/assets/supreme-settings.png";

import starterSettingsLight from "@/assets/light-cards/starter-settings-light.png";
import proSettingsLight from "@/assets/light-cards/pro-settings-light.png";
import eliteSettingsLight from "@/assets/light-cards/elite-settings-light.png";
import supremeSettingsLight from "@/assets/light-cards/supreme-settings-light.png";

// Carousel Card Assets (Light)
import starterSelectedLight from "@/assets/light-cards/starter-selected-light.png";
import proSelectedLight from "@/assets/light-cards/pro-selected-light.png";
import eliteSelectedLight from "@/assets/light-cards/elite-selected-light.png";
import supremeSelectedLight from "@/assets/light-cards/supreme-selected-light.png";

import starterNonselectedLight from "@/assets/light-cards/starter-nonselected-light.png";
import proNonselectedLight from "@/assets/light-cards/pro-nonselected-light.png";
import eliteNonselectedLight from "@/assets/light-cards/elite-nonselected-light.png";
import supremeNonselectedLight from "@/assets/light-cards/supreme-nonselected-light.png";

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
    infoBg: string;
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
    dailyTopUpLimit: "₹5,000/day",
    withdrawals: "Up to ₹3,000 (takes under 30 mins, we swear)",
    verification: "Mobile number + vibes",
    detailedVerification: "Mobile number + vibes",
    limitations: "Add money cooldown, withdraw cannot exceed ₹3,000 a day.",
    detailedLimitations: "1. 24-hour nap after each withdrawal 2. ₹3K/day top-up cap 3. No FX Conversion",

    whyTitle: "Why you’re on STARTER?",
    whyContent: [
        "No KYC, no drama",
        "Bare minimum, but works",
        "Perfect if you're just testing the waters or scared of commitment"
    ],
    powerTitle: "Craving more power?",
    powerContent: "Upgrade to PRO, ELITE, or SUPREME\nGet higher limits, faster everything, and the good stuff we don't offer free users.",
    downgradeTitle: "Downgrade Options",
    downgradeContent: "You can’t.\nYou're already at rock bottom.\nBut hey, we love you anyway.\n(Still curious? Go to Settings > Manage Subscription)",

    note: "Starter is always free — and always mildly disappointing.\nBest for ghosting big transactions. Ideal for light use, tight budgets, and commitment-phobes.",
    buttonText: "Compare Plans",
    buttonAction: "/wallet-settings",
    infoHeight: "228px"
};

export const tiers: TierConfig[] = [
    {
        name: "Starter",
        badge: "Free",
        chip: freeChip,
        diamond: starterDiamond,
        walletLimit: "₹5,000",
        withdrawLimit: "₹5,000",

        headerTitle: "STARTER",
        headerSubtitle: "₹5,000 / wallet limit",
        headerImage: starterExpand,
        infoBg: infoBg,

        ...placeholderContent,
        withdrawals: "Up to ₹3,000 (takes under 30 mins, we swear)",
        limitations: "Withdraw limit of ₹3,000 is applied."
    },
    {
        name: "Pro",
        badge: "₹25/month",
        chip: proChip,
        diamond: proDiamond,
        walletLimit: "₹15,000",
        withdrawLimit: "₹10,000",

        headerTitle: "PRO",
        headerSubtitle: "₹15,000 / wallet limit",
        headerImage: proExpand,
        infoBg: infoBg,

        ...placeholderContent,
        dailyTopUpLimit: "₹10,000/day",
        withdrawals: "Up to ₹10,000 (takes under 30 mins, we swear)",
        limitations: "Add money cooldown, withdraw cannot exceed ₹10,000 a day.",
        detailedLimitations: "1. Still has a 24-hour timeout after withdrawals (we all need a nap) 2. Max ₹10K/day top-up cap. You’re powerful, not unstoppable",
        infoHeight: "auto",

        whyTitle: "Why upgrade to Pro?",
        whyContent: [
            "Finally, some breathing room in your wallet",
            "Unlock faster top-ups — because cash emergencies are real",
            "Supports FX Exchange",
            "Basically, you get to flex — legally"
        ],

        powerTitle: "",
        powerContent: "",

        downgradeTitle: "How to upgrade?",
        downgradeContent: "1. Do your KYC (you knew this was coming)\n2. Upload PAN & Address proof (yes, readable please)\n3. Boom — enjoy your new powers instantly",

        note: "PRO costs ₹50. Your documents and a smidge of effort. We promise it's less painful than filling out a government form.",
        buttonText: "Upgrade Now",
        buttonAction: "/add-payment-method",
    },
    {
        name: "Elite",
        badge: "₹50/month",
        chip: eliteChip,
        diamond: eliteDiamond,

        headerTitle: "ELITE",
        headerSubtitle: "₹1,00,000 / wallet limit",
        headerImage: eliteExpand,
        infoBg: infoBg,

        ...placeholderContent,
        verification: "PAN, Address proof",
        detailedVerification: "PAN & Address proof (the usual drill)",
        walletLimit: "₹50,000",
        dailyTopUpLimit: "₹25,000/day",
        withdrawLimit: "₹50,000",
        withdrawals: "Up to ₹50,000 (takes under 30 mins, we swear)",
        detailedLimitations: "1. 24-hour post withdrawals cooldown 2. ₹25K/day top-up cap. Try not to break the matrix",
        limitations: "No limitations, withdraw cannot exceed ₹25,000 a day.",
        infoHeight: "auto",

        whyTitle: "Why upgrade to Elite?",
        whyContent: [
            "You're done playing in the kiddie pool",
            "Big wallet = big moves = big dopamine",
            "Fast, seamless top-ups. Blink and it's done",
            "Supports FX Exchange",
            "Priority processing. Because queues are for peasants"
        ],

        powerTitle: "",
        powerContent: "",

        downgradeTitle: "How to upgrade?",
        downgradeContent: "1. Upload your KYC (yes, again)\n2. Pay ₹50/month — aka less than one sad coffee\n3. Instantly unlock the ELITE mode. Speed. Status. Swagger.",

        note: "Auto-renews monthly. Cancel whenever you stop feeling fancy.",
        buttonText: "Upgrade Now",
        buttonAction: "/add-payment-method",
    },
    {
        name: "Supreme",
        badge: "₹100/month",
        chip: supremeChip,
        diamond: supremeDiamond,

        headerTitle: "SUPREME",
        headerSubtitle: "No limit / wallet limit",
        headerImage: supremeExpand,
        infoBg: infoBg,

        ...placeholderContent,
        verification: "PAN, Address proof",
        detailedVerification: "PAN & Address proof (KYC, of course)",
        walletLimit: "₹150,000",
        dailyTopUpLimit: "₹100,000/day",
        withdrawLimit: "Full wallet balance",
        withdrawals: "Your whole damn balance. Whenever. No caps.",
        detailedLimitations: "1. LMAO. None.",
        limitations: "No limitations.",
        infoHeight: "auto",

        whyTitle: "Why upgrade to Supreme?",
        whyContent: [
            "You don't wait. You withdraw. Fully. Instantly.",
            "No cooldowns. No daily caps. No rules.",
            "Built for business bosses, chaos wizards, and cashflow junkies",
            "Priority withdrawals & dedicated support minions",
            "Max top-ups. Max freedom. Max you.",
            "Supports FX Exchange"
        ],

        powerTitle: "",
        powerContent: "",

        downgradeTitle: "How to upgrade?",
        downgradeContent: "1. Be ELITE (duh)\n2. Drop in your business proof (optional — but hey, adds instant legitimacy).\n3. Pay ₹100/month — it's cheaper than your ego, I promise\n4. Tap 'Upgrade'. Shatter ceilings. Enter beast mode.",

        note: "SUPREME is your no-limits, god-tier wallet plan. Cancel anytime. But why would you?",
        buttonText: "Upgrade Now",
        buttonAction: "/add-payment-method",
    },
];

export const tierIconMap: Record<WalletTier, string> = {
    Starter: starterDiamond,
    Pro: proDiamond,
    Elite: eliteDiamond,
    Supreme: supremeDiamond,
};

export const tierCardMap: Record<WalletTier, string> = {
    Starter: starterCard,
    Pro: proCard,
    Elite: eliteCard,
    Supreme: supremeCard,
};

export const tierCardMapLight: Record<WalletTier, string> = {
    Starter: starterCardLight,
    Pro: proCardLight,
    Elite: eliteCardLight,
    Supreme: supremeCardLight,
};

export const tierSettingsCardMap: Record<WalletTier, string> = {
    Starter: starterSettings,
    Pro: proSettings,
    Elite: eliteSettings,
    Supreme: supremeSettings,
};

export const tierSettingsCardMapLight: Record<WalletTier, string> = {
    Starter: starterSettingsLight,
    Pro: proSettingsLight,
    Elite: eliteSettingsLight,
    Supreme: supremeSettingsLight,
};

export const tierCarouselActiveMap: Record<WalletTier, string> = {
    Starter: starterSelectedLight,
    Pro: proSelectedLight,
    Elite: eliteSelectedLight,
    Supreme: supremeSelectedLight,
};

export const tierCarouselInactiveMap: Record<WalletTier, string> = {
    Starter: starterNonselectedLight,
    Pro: proNonselectedLight,
    Elite: eliteNonselectedLight,
    Supreme: supremeNonselectedLight,
};

export const tierChipColorMap: Record<WalletTier, string> = {
    Starter: '#000000',
    Pro: '#2F82FF',
    Elite: '#B158E7',
    Supreme: '#FF6A8E',
};

export const tierExpandCardMapLight: Record<WalletTier, string> = {
    Starter: starterExpandLight,
    Pro: proExpandLight,
    Elite: eliteExpandLight,
    Supreme: supremeExpandLight,
};

export const tierCarouselActiveMapDark: Record<WalletTier, string> = {
    Starter: starterSelectedDark,
    Pro: proSelectedDark,
    Elite: eliteSelectedDark,
    Supreme: supremeSelectedDark,
};

export const tierCarouselInactiveMapDark: Record<WalletTier, string> = {
    Starter: starterNonselectedDark,
    Pro: proNonselectedDark,
    Elite: eliteNonselectedDark,
    Supreme: supremeNonselectedDark,
};

export { starterSelectedDark, starterNonselectedDark };
