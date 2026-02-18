import { useTheme } from "next-themes";
import { assets, AssetName } from "@/utils/assetRegistry";

/**
 * Hook to get the correct asset URL based on the current theme.
 * @param assetName - The logical name of the asset defined in assetRegistry.
 * @returns The URL of the asset for the current theme.
 */
export const useAsset = (assetName: AssetName): string => {
    const { theme } = useTheme();

    // Default to dark if theme is undefined or not 'light'
    // You can adjust this logic based on your default theme preference
    const isLight = theme === 'light';

    const assetPair = assets[assetName];

    if (!assetPair) {
        console.warn(`Asset '${assetName}' not found in registry.`);
        return "";
    }

    return isLight ? assetPair.light : assetPair.dark;
};
