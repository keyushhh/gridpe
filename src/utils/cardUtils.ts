import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import { storageKey, readStorage, writeStorage } from '@/utils/storage';
import { supabase } from '@/lib/supabase';

export interface Card {
  id: string;
  number: string;
  holder: string;
  expiry: string;
  type: 'visa' | 'mastercard' | 'rupay' | null;
  isDefault: boolean;
  backgroundIndex: number;
}

const LEGACY_KEY = 'gridpe_user_cards';

export const getCards = async (): Promise<Card[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anon';
    const namespaced = storageKey('user_cards', userId);

    // 1. Try SecureStorage (native) with namespaced key
    if (Capacitor.isNativePlatform()) {
      const secureStored = await SecureStorage.get(namespaced);
      if (secureStored) return JSON.parse(secureStored as string);

      // Fallback to legacy key and migrate
      const legacy = await SecureStorage.get(LEGACY_KEY);
      if (legacy) {
        const cards: Card[] = JSON.parse(legacy as string);
        const cleanedCards = cards.map(({ cvv, ...rest }: any) => rest);
        await SecureStorage.set(namespaced, JSON.stringify(cleanedCards));
        await SecureStorage.remove(LEGACY_KEY).catch(() => {});
        return cleanedCards;
      }
    }

    // 2. Web: try namespaced localStorage
    const webStored = readStorage<Card[]>('user_cards', userId);
    if (webStored) return webStored;

    // 3. Legacy web key migrate
    const legacyWeb = localStorage.getItem(LEGACY_KEY);
    if (legacyWeb) {
      const cards: Card[] = JSON.parse(legacyWeb);
      const cleanedCards = cards.map(({ cvv, ...rest }: any) => rest);
      writeStorage('user_cards', cleanedCards, userId);
      localStorage.removeItem(LEGACY_KEY);
      return cleanedCards;
    }

    return [];
  } catch (e) {
    console.error('Failed to load cards', e);
    return [];
  }
};

const maskPan = (pan: string) => {
  const last4 = pan.slice(-4);
  return `XXXX-XXXX-XXXX-${last4}`;
};

export const addCard = async (card: Omit<Card, 'id' | 'isDefault' | 'backgroundIndex'>): Promise<Card> => {
  const currentCards = await getCards();

  const newCard: Card = {
    ...card,
    id: Date.now().toString(),
    isDefault: currentCards.length === 0,
    backgroundIndex: (currentCards.length % 6) + 1,
  };

  const updatedCards = [...currentCards, newCard];
  
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anon';
  const ns = storageKey('user_cards', userId);
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.set(ns, JSON.stringify(updatedCards));
  } else {
    const maskedCards = updatedCards.map(c => ({ ...c, number: maskPan(c.number) }));
    writeStorage('user_cards', maskedCards, userId);
  }
  return newCard;
};

export const removeCard = async (id: string): Promise<void> => {
  const currentCards = await getCards();
  const cardToRemove = currentCards.find(c => c.id === id);
  if (!cardToRemove) return;

  const remainingCards = currentCards.filter(c => c.id !== id);

  if (cardToRemove.isDefault && remainingCards.length > 0) {
    remainingCards[0].isDefault = true;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anon';
  const ns = storageKey('user_cards', userId);
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.set(ns, JSON.stringify(remainingCards));
  } else {
    const maskedCards = remainingCards.map(c => ({
      ...c,
      number: c.number.startsWith('XXXX') ? c.number : maskPan(c.number),
    }));
    writeStorage('user_cards', maskedCards, userId);
  }
};

export const setDefaultCard = async (id: string): Promise<void> => {
  const currentCards = await getCards();
  const updatedCards = currentCards.map(card => ({
    ...card,
    isDefault: card.id === id,
  }));
  
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anon';
  const ns = storageKey('user_cards', userId);
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.set(ns, JSON.stringify(updatedCards));
  } else {
    const maskedCards = updatedCards.map(c => ({
      ...c,
      number: c.number.startsWith('XXXX') ? c.number : maskPan(c.number),
    }));
    writeStorage('user_cards', maskedCards, userId);
  }
};
