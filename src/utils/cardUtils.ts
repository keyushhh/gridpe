import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';

export interface Card {
  id: string;
  number: string;
  holder: string;
  expiry: string;
  type: 'visa' | 'mastercard' | 'rupay' | null;
  isDefault: boolean;
  backgroundIndex: number;
}

const STORAGE_KEY = 'gridpe_user_cards';

export const getCards = async (): Promise<Card[]> => {
  try {
    // 1. Try SecureStorage first
    if (Capacitor.isNativePlatform()) {
      const secureStored = await SecureStorage.get(STORAGE_KEY);
      if (secureStored) {
        return JSON.parse(secureStored as string);
      }
    }

    // 2. Fallback to localStorage and migrate if found
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const cards: Card[] = JSON.parse(stored);
      // Strip CVVs if they accidentally exist in legacy data
      const cleanedCards = cards.map(({ cvv, ...rest }: any) => rest);
      
      if (Capacitor.isNativePlatform()) {
        console.warn('Migrating cards to SecureStorage...');
        await SecureStorage.set(STORAGE_KEY, JSON.stringify(cleanedCards));
        localStorage.removeItem(STORAGE_KEY);
      }
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
  
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.set(STORAGE_KEY, JSON.stringify(updatedCards));
  } else {
    // On web, store masked version for UI persistence only
    const maskedCards = updatedCards.map(c => ({
      ...c,
      number: maskPan(c.number)
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maskedCards));
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

  if (Capacitor.isNativePlatform()) {
    await SecureStorage.set(STORAGE_KEY, JSON.stringify(remainingCards));
  } else {
    const maskedCards = remainingCards.map(c => ({
      ...c,
      number: c.number.startsWith('XXXX') ? c.number : maskPan(c.number)
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maskedCards));
  }
};

export const setDefaultCard = async (id: string): Promise<void> => {
  const currentCards = await getCards();
  const updatedCards = currentCards.map(card => ({
    ...card,
    isDefault: card.id === id,
  }));
  
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.set(STORAGE_KEY, JSON.stringify(updatedCards));
  } else {
    const maskedCards = updatedCards.map(c => ({
      ...c,
      number: c.number.startsWith('XXXX') ? c.number : maskPan(c.number)
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maskedCards));
  }
};
