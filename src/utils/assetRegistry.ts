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
} as const;
