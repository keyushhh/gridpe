import { useIsDarkMode } from './useIsDarkMode';

/**
 * Hook to get the correct asset URL based on the current theme.
 * @param darkAsset - The URL of the asset for dark mode.
 * @param lightAsset - The URL of the asset for light mode.
 * @returns The URL of the correct asset.
 */
export const useAsset = (darkAsset: string, lightAsset: string): string => {
  const isDarkMode = useIsDarkMode();
  // Default to darkAsset when in dark mode
  return isDarkMode ? darkAsset : lightAsset;
};
