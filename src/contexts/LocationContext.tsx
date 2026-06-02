import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
import { checkLocationPermission, requestLocationPermission, getCurrentPosition } from '@/utils/geolocation';
import { reverseGeocode, getDistance } from '@/utils/geoUtils';
import { useUser } from '@/contexts/UserContext';
import { fetchAddresses } from '@/lib/addresses';

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
  const { profile, activeAddress, setActiveAddress, isManualAddressSelected } = useUser();
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

  // Smart Auto-Match Logic
  useEffect(() => {
    const autoMatchAddress = async () => {
      if (!profile?.id || state.lat === null || state.lng === null || isManualAddressSelected) {
        return;
      }
      try {
        const addresses = await fetchAddresses(profile.id);
        const safeData = Array.isArray(addresses) ? addresses : [];
        if (safeData.length > 0) {
          for (const d of safeData) {
            if (d.latitude && d.longitude) {
              const distanceMeters = getDistance(state.lat, state.lng, Number(d.latitude), Number(d.longitude));
              if (distanceMeters <= 100) { // 100 meters
                const mappedAddr = {
                  id: d.id,
                  user_id: d.user_id,
                  created_at: d.created_at,
                  label: d.label,
                  apartment: d.apartment,
                  contact_name: d.contact_name,
                  contact_phone: d.contact_phone,
                  plus_code: d.plus_code,
                  tag: d.label || 'Home',
                  house: d.apartment || '',
                  area: d.area || '',
                  landmark: d.landmark || '',
                  name: d.contact_name || '',
                  phone: d.contact_phone || '',
                  displayAddress: `${d.apartment ? d.apartment + ', ' : ''}${d.area || ''}${d.city ? ', ' + d.city : ''}`,
                  city: d.city || '',
                  state: d.state || '',
                  postcode: '', // Not stored
                  plusCode: d.plus_code || '',
                  latitude: d.latitude,
                  longitude: d.longitude,
                };
                
                if (activeAddress?.id !== mappedAddr.id) {
                  setActiveAddress(mappedAddr, false);
                }
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to auto-match address', e);
      }
    };
    autoMatchAddress();
  }, [state.lat, state.lng, profile?.id, isManualAddressSelected, activeAddress?.id, setActiveAddress]);

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
