import { Preferences } from '@capacitor/preferences';

export const ADDRESS_KEYS = {
  SELECTED_ADDRESS: 'gridpe_selected_address',
  USER_ADDRESS: 'gridpe_user_address',
} as const;

export type AddressStorageKey = typeof ADDRESS_KEYS[keyof typeof ADDRESS_KEYS];

export const getAddress = async <T>(
  key: AddressStorageKey, 
  fallback: T | null = null
): Promise<T | null> => {
  try {
    const { value } = await Preferences.get({ key });
    if (value === null) return fallback;
    return JSON.parse(value) as T;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[addressStorage.get failed]', key, err);
    return fallback;
  }
};

export const setAddress = async <T>(
  key: AddressStorageKey, 
  value: T
): Promise<void> => {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[addressStorage.set failed]', key, err);
  }
};

export const removeAddress = async (key: AddressStorageKey): Promise<void> => {
  try {
    await Preferences.remove({ key });
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[addressStorage.remove failed]', key, err);
  }
};

export const migrateAddressKey = async (key: AddressStorageKey): Promise<void> => {
  try {
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      await Preferences.set({ key, value: localValue });
      localStorage.removeItem(key);
      if (import.meta.env.DEV) console.log('[addressStorage] migrated', key);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[addressStorage] migration failed', key, err);
  }
};
