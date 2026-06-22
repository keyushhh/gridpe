import { create } from 'zustand';
import { crashlytics } from '@/lib/crashlytics';
import { Preferences } from '@capacitor/preferences';
import { checkLocationPermission, requestLocationPermission, getCurrentPosition } from '@/utils/geolocation';
import { reverseGeocode, getDistance } from '@/utils/geoUtils';
import { fetchAddresses } from '@/lib/addresses';
import { supabase } from '@/lib/supabase';
import { getAddress, setAddress, removeAddress, ADDRESS_KEYS } from '@/utils/addressStorage';
import { readStorage, writeStorage, removeStorage } from '@/utils/storage';
import { SavedAddress } from '@/types';

const CACHE_KEY = 'last_known_location';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/* ── Capacitor Preferences helpers for address persistence ── */
async function getAddressPref(): Promise<SavedAddress | null> {
  try {
    const addr = await getAddress<SavedAddress>(ADDRESS_KEYS.SELECTED_ADDRESS, null);
    if (addr) return addr;
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to read address from Preferences', e);
  }
  return null;
}

async function setAddressPref(addr: SavedAddress): Promise<void> {
  try {
    await setAddress(ADDRESS_KEYS.SELECTED_ADDRESS, addr);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to write address to Preferences', e);
  }
}

async function removeAddressPref(): Promise<void> {
  try {
    await removeAddress(ADDRESS_KEYS.SELECTED_ADDRESS);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Failed to remove address from Preferences', e);
  }
}

export interface LocationState {
  activeAddressId: string | null;
  activeAddress: SavedAddress | null;
  isManualAddressSelected: boolean;
  
  lat: number | null;
  lng: number | null;
  shortName: string | null;
  fullAddress: string | null;
  splashAddress: string | null;
  
  loading: boolean;
  isRefreshing: boolean;
  permissionDenied: boolean;
  initialized: boolean;
  lastUpdated: number | null;

  // Actions
  setActiveAddress: (addr: SavedAddress | null, isManual?: boolean) => Promise<void>;
  initializeLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  clearLocation: () => Promise<void>;
  
  // Private helper
  _fetchFreshLocation: () => Promise<void>;
}

let isInitializing = false;
let isRefreshing = false;

export const useLocationStore = create<LocationState>((set, get) => ({
  activeAddressId: null,
  activeAddress: null,
  isManualAddressSelected: false,
  
  lat: null,
  lng: null,
  shortName: null,
  fullAddress: null,
  splashAddress: null,
  
  loading: true,
  isRefreshing: false,
  permissionDenied: false,
  initialized: false,
  lastUpdated: null,

  setActiveAddress: async (addr: SavedAddress | null, isManual: boolean = false) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id; // Need userId for namespaced storage

      if (!userId) {
        try { removeStorage('user_address', userId || ''); } catch (err) {
          if (import.meta.env.DEV) console.warn('[LocationStore] cleanup error:', err);
        }
        try { removeStorage('last_selected_address_id', userId || ''); } catch (err) {
          if (import.meta.env.DEV) console.warn('[LocationStore] cleanup error:', err);
        }
        await removeAddressPref();
        set((state) => ({ 
          activeAddress: null, 
          activeAddressId: null, 
          isManualAddressSelected: isManual || state.isManualAddressSelected 
        }));
        return;
      }

      // Persist into namespaced storage
      try { writeStorage('user_address', addr, userId); } catch (err) {
        if (import.meta.env.DEV) console.warn('[LocationStore] non-critical error:', err);
      }
      if (addr?.id) {
        try { writeStorage('last_selected_address_id', addr.id, userId); } catch (err) {
          if (import.meta.env.DEV) console.warn('[LocationStore] non-critical error:', err);
        }
      }

      if (addr) {
        await setAddressPref(addr);
      } else {
        await removeAddressPref();
      }

      set((state) => ({ 
        activeAddress: addr, 
        activeAddressId: addr?.id ?? null, 
        isManualAddressSelected: isManual || state.isManualAddressSelected 
      }));
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to set active address:', err);
      crashlytics.recordError(err instanceof Error ? err : new Error('useLocationStore failed to set active address'), 'useLocationStore.setActiveAddress');
      if (addr) {
        setAddressPref(addr).catch((e) => {
          if (import.meta.env.DEV) console.warn('[LocationStore] non-critical error:', e);
        });
      } else {
        removeAddressPref().catch((e) => {
          if (import.meta.env.DEV) console.warn('[LocationStore] non-critical error:', e);
        });
      }
      set((state) => ({ 
        activeAddress: addr, 
        activeAddressId: addr?.id ?? null, 
        isManualAddressSelected: isManual || state.isManualAddressSelected 
      }));
    }
  },

  _fetchFreshLocation: async () => {
    if (isRefreshing) return;
    isRefreshing = true;
    set({ isRefreshing: true, permissionDenied: false });

    try {
      let permission = await checkLocationPermission();
      if (permission.location !== 'granted') {
        permission = await requestLocationPermission();
      }

      if (permission.location !== 'granted') {
        set({ permissionDenied: true, isRefreshing: false, loading: false });
        isRefreshing = false;
        return;
      }

      const position = await getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;

      let newState: Partial<LocationState> = {};
      let needsGeocode = true;

      // Avoid reverse geocoding if coordinates are virtually identical to cache
      try {
        const { value } = await Preferences.get({ key: CACHE_KEY });
        if (value) {
          const cached = JSON.parse(value);
          if (
            cached?.lat &&
            cached?.lng &&
            Math.abs(cached.lat - latitude) < 0.0001 &&
            Math.abs(cached.lng - longitude) < 0.0001
          ) {
            // Just update timestamp
            const updatedCache = { ...cached, lastUpdated: Date.now() };
            await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(updatedCache) });
            newState = { ...updatedCache, isRefreshing: false, loading: false };
            needsGeocode = false;
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed reading cache during refresh', e);
      }

      if (needsGeocode) {
        const result = await reverseGeocode(latitude, longitude);
        
        const shortName = result.address?.suburb || result.address?.neighbourhood || result.address?.city || 'Current Location';
        const fullAddress = result.display_name || `${shortName}, Current Location`;
        const city = result.address?.city || result.address?.town || result.address?.village || result.address?.state || '';
        const splashAddress = shortName !== city && city ? `${shortName}, ${city}` : city || shortName;

        newState = {
          shortName,
          fullAddress,
          splashAddress,
          lat: latitude,
          lng: longitude,
          permissionDenied: false,
          lastUpdated: Date.now(),
        };

        try {
          const { value } = await Preferences.get({ key: CACHE_KEY });
          const currentCache = value ? JSON.parse(value) : {};
          const updatedCache = { ...currentCache, ...newState };
          await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(updatedCache) });
        } catch (e) {
          if (import.meta.env.DEV) console.warn('Failed saving cache', e);
        }
        
        newState.isRefreshing = false;
        newState.loading = false;
      }

      set(newState);

      // --- Smart Auto-Match Logic ---
      const currentState = get();
      if (!currentState.isManualAddressSelected && currentState.lat !== null && currentState.lng !== null) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          
          if (userId) {
            const addresses = await fetchAddresses(userId);
            const safeData = Array.isArray(addresses) ? addresses : [];
            if (safeData.length > 0) {
              for (const d of safeData) {
                if (d.latitude && d.longitude) {
                  const distanceMeters = getDistance(currentState.lat, currentState.lng, Number(d.latitude), Number(d.longitude));
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
                    
                    if (currentState.activeAddress?.id !== mappedAddr.id) {
                      await get().setActiveAddress(mappedAddr, false);
                    }
                    break;
                  }
                }
              }
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) console.error('Failed to auto-match address', e);
          crashlytics.recordError(e instanceof Error ? e : new Error('useLocationStore failed to auto-match address'), 'useLocationStore.autoMatchAddress');
        }
      }
      
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching fresh location:', err);
      crashlytics.recordError(err instanceof Error ? err : new Error('useLocationStore failed to fetch fresh location'), 'useLocationStore.fetchFreshLocation');
      // Fallback to whatever we have
      set({ isRefreshing: false, loading: false });
    } finally {
      isRefreshing = false;
    }
  },

  initializeLocation: async () => {
    const state = get();
    if (isInitializing || state.initialized) return;
    isInitializing = true;

    try {
      // 1. Initialize Active Address
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      let initialActiveAddress = null;
      let initialActiveAddressId = null;
      
      if (userId) {
        try {
          const savedAddr = await getAddressPref();
          if (savedAddr) {
            initialActiveAddress = savedAddr;
            initialActiveAddressId = savedAddr.id ?? null;
          } else {
            const addr = readStorage<SavedAddress>('user_address', userId);
            const lastId = readStorage<string>('last_selected_address_id', userId);
            if (addr) {
              initialActiveAddress = addr;
              initialActiveAddressId = addr.id ?? lastId ?? null;
            } else if (lastId) {
              initialActiveAddressId = lastId;
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn('Failed to load active address from storage', e);
        }
      }

      set({
        activeAddress: initialActiveAddress,
        activeAddressId: initialActiveAddressId,
      });

      // 2. Initialize GPS Location
      let cachedLocation = null;
      try {
        const { value } = await Preferences.get({ key: CACHE_KEY });
        if (value) {
          cachedLocation = JSON.parse(value);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed reading cache on init', e);
      }
      
      if (cachedLocation && cachedLocation.lat && cachedLocation.lng) {
        const age = Date.now() - (cachedLocation.lastUpdated || 0);
        
        // Hydrate immediately
        set({
          ...cachedLocation,
          initialized: true,
          loading: false,
          isRefreshing: age > CACHE_TTL_MS,
        });

        // Background refresh if stale
        if (age > CACHE_TTL_MS) {
          get()._fetchFreshLocation(); // Silent background fetch
        }
      } else {
        // No cache, need fresh fetch
        set({ initialized: true, loading: true });
        await get()._fetchFreshLocation();
      }
    } finally {
      isInitializing = false;
    }
  },

  refreshLocation: async () => {
    await get()._fetchFreshLocation();
  },

  clearLocation: async () => {
    await Preferences.remove({ key: CACHE_KEY });
    set({
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
  },
}));
