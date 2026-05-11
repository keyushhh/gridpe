export interface Card {
  id: string;
  number: string;
  holder: string;
  expiry: string;
  cvv?: string;
  type: 'visa' | 'mastercard' | 'rupay' | null;
  isDefault: boolean;
  backgroundIndex: number;
}

const STORAGE_KEY = 'gridpe_user_cards';

export const getCards = (): Card[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load cards', e);
    return [];
  }
};

export const addCard = (card: Omit<Card, 'id' | 'isDefault' | 'backgroundIndex'>): Card => {
  const currentCards = getCards();

  const newCard: Card = {
    ...card,
    id: Date.now().toString(),
    isDefault: currentCards.length === 0,
    backgroundIndex: (currentCards.length % 6) + 1,
  };

  const updatedCards = [...currentCards, newCard];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
  return newCard;
};

export const removeCard = (id: string): void => {
  const currentCards = getCards();
  const cardToRemove = currentCards.find(c => c.id === id);
  if (!cardToRemove) return;

  const remainingCards = currentCards.filter(c => c.id !== id);

  if (cardToRemove.isDefault && remainingCards.length > 0) {
    remainingCards[0].isDefault = true;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingCards));
};

export const setDefaultCard = (id: string): void => {
  const currentCards = getCards();
  const updatedCards = currentCards.map(card => ({
    ...card,
    isDefault: card.id === id,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
};
