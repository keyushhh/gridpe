import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
import { checkLocationPermission, requestLocationPermission, getCurrentPosition } from '@/utils/geolocation';
import { reverseGeocode } from '@/utils/geoUtils';

const CACHE_KEY = 'last_known_location';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface LocationState {
  shortName: string | null;
  fullAddress: string | null;
  lat: number | null;
  lng: number | null;
  splashAddress: string | null;
  loading: boolean;
  isRefreshing: boolean;
  permissionDenied: boolean;
  initialized: boolean;
  lastUpdated: number | null;
}

interface LocationContextType extends LocationState {
  initializeLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  clearLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LocationState>({
    shortName: null,
    fullAddress: null,
    splashAddress: null,
    lat: null,
    lng: null,
    loading: true,
    isRefreshing: false,
    permissionDenied: false,
    initialized: false,
    lastUpdated: null,
  });

  const isInitializingRef = useRef(false);
  const isRefreshingRef = useRef(false);

  const updateState = (updates: Partial<LocationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const getCachedLocation = async (): Promise<LocationState | null> => {
    try {
      const { value } = await Preferences.get({ key: CACHE_KEY });
      if (value) {
        return JSON.parse(value) as LocationState;
      }
    } catch (err) {
      console.warn('Failed to get cached location', err);
    }
    return null;
  };

  const saveCachedLocation = async (locState: Partial<LocationState>) => {
    try {
      const { value } = await Preferences.get({ key: CACHE_KEY });
      const current = value ? JSON.parse(value) : {};
      const updated = { ...current, ...locState, lastUpdated: Date.now() };
      await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(updated) });
    } catch (err) {
      console.warn('Failed to save cached location', err);
    }
  };

  const fetchFreshLocation = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    updateState({ isRefreshing: true, permissionDenied: false });

    try {
      let permission = await checkLocationPermission();
      if (permission.location !== 'granted') {
        permission = await requestLocationPermission();
      }

      if (permission.location !== 'granted') {
        updateState({ permissionDenied: true, isRefreshing: false, loading: false });
        isRefreshingRef.current = false;
        return;
      }

      const position = await getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;

      // Avoid reverse geocoding if coordinates are virtually identical to cache
      const cached = await getCachedLocation();
      if (
        cached?.lat &&
        cached?.lng &&
        Math.abs(cached.lat - latitude) < 0.0001 &&
        Math.abs(cached.lng - longitude) < 0.0001
      ) {
        // Just update timestamp
        const updatedCache = { ...cached, lastUpdated: Date.now() };
        await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(updatedCache) });
        updateState({ ...updatedCache, isRefreshing: false, loading: false });
        isRefreshingRef.current = false;
        return;
      }

      const result = await reverseGeocode(latitude, longitude);
      
      const shortName = result.address?.suburb || result.address?.neighbourhood || result.address?.city || 'Current Location';
      const fullAddress = result.display_name || `${shortName}, Current Location`;
      const city = result.address?.city || result.address?.town || result.address?.village || result.address?.state || '';
      const splashAddress = shortName !== city && city ? `${shortName}, ${city}` : city || shortName;

      const newState = {
        shortName,
        fullAddress,
        splashAddress,
        lat: latitude,
        lng: longitude,
        permissionDenied: false,
        lastUpdated: Date.now(),
      };

      await saveCachedLocation(newState);
      updateState({ ...newState, isRefreshing: false, loading: false });
    } catch (err) {
      console.error('Error fetching fresh location:', err);
      // Fallback to whatever we have
      updateState({ isRefreshing: false, loading: false });
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const initializeLocation = async () => {
    if (isInitializingRef.current || state.initialized) return;
    isInitializingRef.current = true;

    try {
      const cached = await getCachedLocation();
      
      if (cached && cached.lat && cached.lng) {
        const age = Date.now() - (cached.lastUpdated || 0);
        
        // Hydrate immediately
        updateState({
          ...cached,
          initialized: true,
          loading: false,
          isRefreshing: age > CACHE_TTL_MS,
        });

        // Background refresh if stale
        if (age > CACHE_TTL_MS) {
          fetchFreshLocation(); // Silent background fetch
        }
      } else {
        // No cache, need fresh fetch
        updateState({ initialized: true, loading: true });
        await fetchFreshLocation();
      }
    } finally {
      isInitializingRef.current = false;
    }
  };

  const refreshLocation = async () => {
    await fetchFreshLocation();
  };

  const clearLocation = async () => {
    await Preferences.remove({ key: CACHE_KEY });
    updateState({
      shortName: null,
      fullAddress: null,
      splashAddress: null,
      lat: null,
      lng: null,
      loading: false,
      isRefreshing: false,
      permissionDenied: false,
      lastUpdated: null,
    });
  };

  return (
    <LocationContext.Provider
      value={{
        ...state,
        initializeLocation,
        refreshLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
