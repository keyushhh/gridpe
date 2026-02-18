import bgDarkMode from "@/assets/bg-dark-mode.png";
import bgLightMode from "@/assets/bg-light.png";
import peLogo from "@/assets/pe_logo.svg";
import switchTabBg from "@/assets/switch tab.png";
import selectedTabBg from "@/assets/selected tab.png";
import buttonPrimary from "@/assets/button-primary-wide.png";

// Social Icons
import iconGoogle from "@/assets/icon-google.svg";
import iconApple from "@/assets/icon-apple.svg";
import iconX from "@/assets/frame-2095585539.svg";
import iconGoogleLight from "@/assets/google-light.svg";
import iconAppleLight from "@/assets/apple-light.svg";
import iconXLight from "@/assets/twitter-light.svg";
import otpInputField from "@/assets/otp-input-field.png";
import buttonBiometricBg from "@/assets/button-biometric-bg.png";
import mpinInputSuccess from "@/assets/mpin-input-success.png";
import iconOrderCashLight from "@/assets/order-cash-light.svg";
import iconWalletLightButton from "@/assets/wallet-light.png";
import iconFxLightButton from "@/assets/fx-light.png";
import iconAddMoneyLightButton from "@/assets/add money-light.png";
import iconWallet from "@/assets/wallet.svg";
import iconFxConvert from "@/assets/fx-convert.svg";
import iconOrderCash from "@/assets/order-cash.svg";
import iconCashOrderNew from "@/assets/cash-order-icon.svg";
import orderCashBg from "@/assets/order-cash-button-bg.png";
import circleButtonBg from "@/assets/circle-button.png";
import addIcon from "@/assets/add-icon.svg";
import giftIcon from "@/assets/gift-icon.svg";
import addMoneyIconSvg from "@/assets/add-money-icon.svg";
import currencyIconSvg from "@/assets/currency-icon.svg";
import bannerBg from "@/assets/banner-bg-new.png";
import securityIncomplete from "@/assets/security-incomplete.png";
import securityComplete from "@/assets/security-complete.png";
import securityPending from "@/assets/security-pending.png";
import securityActiveLight from "@/assets/security-active-light.png";
import securityPendingLight from "@/assets/security-pending-light.png";
import securityIncompleteLight from "@/assets/security-incomplete-light.png";
import editIcon from "@/assets/edit icon.png";
import linkedCardsLight from "@/assets/linked-cards.svg";
import bankInfoLight from "@/assets/bank-info.svg";
import notifsLight from "@/assets/notifs-light.svg";
import darkModeLight from "@/assets/light-mode.svg";
import logoutLight from "@/assets/logout-icon.svg";

// Social Icons (Existing) AND New Dark Mode Icons for Settings
import iconLinkedCards from "@/assets/icon-linked-cards.svg";
import iconBankAcc from "@/assets/icon-bank-acc.svg";
import iconNotifications from "@/assets/icon-notifications.svg";
import iconDarkMode from "@/assets/icon-dark-mode.svg";
import iconLogout from "@/assets/icon-logout.svg";

// Define the shape of our asset registry
// Each asset has a 'dark' and 'light' version
export interface AssetPair {
    dark: string;
    light: string;
}

export type AssetName = keyof typeof assets;

export const assets = {
    // Global Assets
    "main-bg": {
        dark: bgDarkMode,
        light: bgLightMode,
    },
    "icon-google": {
        dark: iconGoogle,
        light: iconGoogleLight,
    },
    "icon-apple": {
        dark: iconApple,
        light: iconAppleLight,
    },
    "icon-x": {
        dark: iconX,
        light: iconXLight,
    },
    "otp-input-bg": {
        dark: otpInputField,
        light: "", // No background image in light mode, uses CSS color
    },
    "button-biometric-bg": {
        dark: buttonBiometricBg,
        light: "", // No background image in light mode, uses CSS color
    },
    "mpin-input-success": {
        dark: mpinInputSuccess,
        light: "", // No background image in light mode, uses CSS color
    },

    // Home Page Assets
    "icon-wallet": {
        dark: iconWallet,
        light: iconWallet, // Using SVG directly
    },
    "icon-fx": {
        dark: iconFxConvert,
        light: currencyIconSvg, // Using currency-icon.svg
    },
    "icon-order-cash": {
        dark: iconOrderCash,
        light: iconCashOrderNew,
    },
    // New Add Money Button Asset (since it replaces the circle bg entirely in light mode)
    "icon-add-money": {
        dark: addIcon, // This is just the inner icon for dark mode
        light: addMoneyIconSvg, // Using add-money-icon.svg
    },
    "circle-button-bg": {
        dark: circleButtonBg,
        light: "", // No circle background in light mode, as we use the full image
    },
    "order-cash-bg": {
        dark: orderCashBg,
        light: "", // Use CSS bg-black
    },
    "banner-bg": {
        dark: bannerBg,
        light: "", // Use CSS bg-black
    },
    // Wallet Page Assets
    "wallet-bg": {
        dark: bgDarkMode,
        light: bgLightMode,
    },
    "pe-logo": {
        dark: peLogo,
        light: peLogo, // TODO: Replace with light mode asset
    },
    "switch-tab-bg": {
        dark: switchTabBg,
        light: switchTabBg, // TODO: Replace with light mode asset
    },
    "selected-tab-bg": {
        dark: selectedTabBg,
        light: selectedTabBg, // TODO: Replace with light mode asset
    },
    "button-primary": {
        dark: buttonPrimary,
        light: buttonPrimary, // TODO: Replace with light mode asset
    },

    // Add more assets here as we refactor other pages
    "icon-gift": {
        dark: giftIcon,
        light: giftIcon,
    },
    // Settings Page Assets
    "security-complete": {
        dark: securityComplete,
        light: securityActiveLight,
    },
    "security-pending": {
        dark: securityPending,
        light: securityPendingLight,
    },
    "security-incomplete": {
        dark: securityIncomplete,
        light: securityIncompleteLight,
    },
    "icon-edit": {
        dark: "", // Use Lucide Pencil
        light: editIcon,
    },
    "icon-linked-cards": {
        dark: iconLinkedCards,
        light: linkedCardsLight,
    },
    "icon-bank-acc": {
        dark: iconBankAcc,
        light: bankInfoLight,
    },
    "icon-notifs": {
        dark: iconNotifications,
        light: notifsLight,
    },
    "icon-dark-mode": {
        dark: iconDarkMode,
        light: darkModeLight,
    },
    "icon-logout": {
        dark: iconLogout,
        light: logoutLight,
    },
} as const;
