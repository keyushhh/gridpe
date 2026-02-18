import bgDarkMode from "@/assets/bg-dark-mode.png";
import peLogo from "@/assets/pe_logo.svg";
import switchTabBg from "@/assets/switch tab.png";
import selectedTabBg from "@/assets/selected tab.png";
import buttonPrimary from "@/assets/button-primary-wide.png";

// Define the shape of our asset registry
// Each asset has a 'dark' and 'light' version
export interface AssetPair {
    dark: string;
    light: string;
}

export type AssetName = keyof typeof assets;

export const assets = {
    // Wallet Page Assets
    "wallet-bg": {
        dark: bgDarkMode,
        light: bgDarkMode, // TODO: Replace with light mode asset
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
