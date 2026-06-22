export const STORAGE_PREFIX = 'gridpe';

export const storageKey = (key: string, userId?: string) => {
  const uid = userId ?? 'anon';
  return `${uid}::${STORAGE_PREFIX}::${key}`;
};

export const readStorage = <T = any>(key: string, userId?: string): T | null => {
  const k = storageKey(key, userId);
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    try { localStorage.removeItem(k); } catch {};
    return null;
  }
};

export const writeStorage = (key: string, value: unknown, userId?: string) => {
  const k = storageKey(key, userId);
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('writeStorage failed', k, e);
  }
};

export const removeStorage = (key: string, userId?: string) => {
  const k = storageKey(key, userId);
  try { localStorage.removeItem(k); } catch (e) { if (import.meta.env.DEV) console.warn('removeStorage failed', k, e); }
};

export const purgeOtherUsersStorage = (currentUserId?: string) => {
  try {
    const keepPrefix = currentUserId ? `${currentUserId}::${STORAGE_PREFIX}::` : null;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (keepPrefix) {
        if (!k.startsWith(keepPrefix) && k.includes(`::${STORAGE_PREFIX}::`)) keysToRemove.push(k);
      } else {
        if (k.includes(`::${STORAGE_PREFIX}::`)) keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('purgeOtherUsersStorage failed', e);
  }
};

export default {
  storageKey,
  readStorage,
  writeStorage,
  removeStorage,
  purgeOtherUsersStorage,
};
