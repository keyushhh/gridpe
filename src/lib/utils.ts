import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the Haversine distance between two points in km
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const HUB_COORDS = {
  CASH: { lat: 12.9345, lng: 77.6101 }, // Koramangala Hub
  FX: { lat: 12.9784, lng: 77.6408 }, // Currency Hub
};

/**
 * Normalizes locality names to their respective city names
 */
export const normalizeCity = (city: string): string => {
  const cityMap: Record<string, string> = {
    Dispur: 'Guwahati',
    Khanapara: 'Guwahati',
    Jalukbari: 'Guwahati',
    Laban: 'Shillong',
    Mawlai: 'Shillong',
    Whitefield: 'Bangalore',
    Koramangala: 'Bangalore',
    Indiranagar: 'Bangalore',
    'Electronic City': 'Bangalore',
  };
  return cityMap[city] || city;
};
