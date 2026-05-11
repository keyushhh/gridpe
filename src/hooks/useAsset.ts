import { useTheme } from 'next-themes';

/**
 * Hook to get the correct asset URL based on the current theme.
 * @param darkAsset - The URL of the asset for dark mode.
 * @param lightAsset - The URL of the asset for light mode.
 * @returns The URL of the correct asset.
 */
export const useAsset = (darkAsset: string, lightAsset: string): string => {
  const { resolvedTheme } = useTheme();
  // Default to darkAsset when resolvedTheme is not 'light'
  return resolvedTheme === 'light' ? lightAsset : darkAsset;
};
