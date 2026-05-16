import { ASSETS } from '@/constants/assets';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BottomNavigation from '@/components/BottomNavigation';
import ConfirmationModal from '@/components/ConfirmationModal';
import { getCards, Card, removeCard, setDefaultCard } from '@/utils/cardUtils';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Import all saved card backgrounds
import { useWebScroll } from '@/hooks/useWebScroll';
const cardBackgrounds = [
  ASSETS.SAVED_CARD_1,
  ASSETS.SAVED_CARD_2,
  ASSETS.SAVED_CARD_3,
  ASSETS.SAVED_CARD_4,
  ASSETS.SAVED_CARD_5,
  ASSETS.SAVED_CARD_6,
];
const MyCards = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUser();
  const userId = profile?.id;
  const isDarkMode = useIsDarkMode();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [isStacked, setIsStacked] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [confirmAction, setConfirmAction] = useState<'remove' | 'default' | null>(null);
  const [visibleCardIds, setVisibleCardIds] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const fetchAllCards = async () => {
    const localCards = await getCards();
    if (!userId) {
      setCards(localCards);
      setIsStacked(localCards.length > 1);
      return;
    }
    try {
      const { data: dbCards, error } = await supabase
        .from('bank_cards')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      if (dbCards) {
        const mappedDbCards: Card[] = dbCards.map((db, index) => ({
          id: db.id.toString(),
          number: `**** **** **** ${db.last_four}`,
          holder: db.card_holder_name,
          expiry: `${db.expiry_month}/${db.expiry_year.toString().slice(-2)}`,
          type: db.card_type.toLowerCase() as any,
          isDefault: localCards.length === 0 && index === 0, // Fallback logic
          backgroundIndex: localCards.length + (index % 6) + 1,
        }));
        setCards([...localCards, ...mappedDbCards]);
        setIsStacked(localCards.length + mappedDbCards.length > 1);
      } else {
        setCards(localCards);
        setIsStacked(localCards.length > 1);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
      setCards(localCards);
      setIsStacked(localCards.length > 1);
    }
  };
  useEffect(() => {
    fetchAllCards();
  }, [userId]);
  useEffect(() => {
    if (location.state?.cardAdded) {
      setShowSuccessModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const handleTutorialClick = () => {
    if (tutorialStep === 1) {
      setTutorialStep(2);
    } else if (tutorialStep === 2) {
      setTutorialStep(0);
      localStorage.setItem('gridpe_stack_tutorial_seen', 'true');
    }
  };
  const handleFabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always expand first, then navigate
    if (isFabExpanded) {
      navigate(ROUTES.CARDS_ADD);
    } else {
      setIsFabExpanded(true);
    }
  };
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#fab-container') && isFabExpanded) {
        setIsFabExpanded(false);
      }
      // If clicking outside the currently selected card wrapper, clear selection
      const selectedWrapper = document.getElementById(`card-wrapper-${selectedCardId}`);
      if (
        selectedCardId &&
        (!target.closest('.card-wrapper') || (selectedWrapper && !selectedWrapper.contains(target)))
      ) {
        setSelectedCardId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isFabExpanded, selectedCardId]);
  const toggleCardVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleCardIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const handleRemoveClick = () => {
    setConfirmAction('remove');
  };
  const handleDefaultClick = () => {
    setConfirmAction('default');
  };
  const closeConfirmation = () => {
    setConfirmAction(null);
  };
  const formatCardNumber = (number: string) => {
    if (!number) return '';
    const cleanNumber = number.replace(/\s/g, '');
    // Always return masked format since we only store/fetch last 4 digits for security
    const last4 = cleanNumber.slice(-4);
    return `**** **** **** ${last4}`;
  };
  const startPress = (id: string) => {
    if (isStacked) return;
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setSelectedCardId(id);
    }, 500);
  };
  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const handleCardClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // If it was a long press, ignore the click
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (isStacked) {
      setIsStacked(false);
    } else {
      // Toggle selection logic
      if (selectedCardId === id) {
        setSelectedCardId(null);
      } else {
        setSelectedCardId(id);
      }
    }
  };
  // Reset selection when stack state changes
  useEffect(() => {
    if (isStacked) {
      setSelectedCardId(null);
    }
  }, [isStacked]);
  const sortedCards = [...cards].sort((a, b) => {
    if (a.isDefault === b.isDefault) return 0;
    return a.isDefault ? -1 : 1;
  });
  const contentBlurClass = showSuccessModal || tutorialStep > 0 ? 'blur-sm brightness-50' : '';
  return (
    <div
      className="min-h-full w-full flex flex-col justify-start safe-top relative"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
      onClick={() => {
        if (!isStacked && cards.length > 1) {
          setIsStacked(true);
        }
      }}
    >
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#5260FE',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${contentBlurClass}`}>
        <div className="px-5 pt-4 flex items-center justify-center relative z-10">
          <h1
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[20px] font-medium text-center w-full`}
          >
            My Cards
          </h1>
        </div>
        <div
          className="px-5 mt-8 flex-1 overflow-y-auto overscroll-y-contain scrollbar-hide pb-[calc(120px+env(safe-area-inset-bottom))] min-h-0"
          style={{ willChange: 'transform', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex flex-col min-h-full">
            {cards.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-10 pt-20">
                <div
                  className={`w-[120px] h-[120px] rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}
                >
                  <img
                    src={ASSETS.CARD_ICON}
                    alt="No cards"
                    className="w-12 h-12 opacity-40"
                    style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
                  />
                </div>
                <h2
                  className={`text-[20px] font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  No saved cards
                </h2>
                <p
                  className={`text-[14px] leading-relaxed mb-10 ${isDarkMode ? 'text-white/60' : 'text-black/40'}`}
                >
                  Add a card to your account for faster payments.
                </p>
                <button
                  onClick={() => navigate(ROUTES.CARDS_ADD)}
                  className={`w-full max-w-[240px] h-[48px] rounded-full font-medium transition-all active:scale-95 shadow-lg ${isDarkMode ? 'bg-white text-black shadow-white/5' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}
                >
                  Add a Card
                </button>
              </div>
            ) : (
              <div
                className={`transition-all duration-500 ease-in-out ${isStacked ? 'mt-4 relative h-[320px] w-full mx-auto' : 'flex flex-col gap-4'}`}
              >
                {sortedCards.map((card, index) => {
                  const bgSrc = cardBackgrounds[(card.backgroundIndex - 1) % 6];
                  const isDefault = card.isDefault;
                  const isVisible = visibleCardIds[card.id] || false;
                  const isSelected = selectedCardId === card.id;
                  const chipTop = isDefault ? 34 : 21;
                  const nameTop = isDefault ? 42 : 26;
                  const labelTop = isDefault ? 86 : 70;
                  const numberTop = isDefault ? 109 : 93;
                  const expiryTop = isDefault ? 145 : 129;
                  const logoBottom = 26;
                  const cardHeightValue = isDefault ? 212 : 192;
                  const cardHeight = `${cardHeightValue}px`;
                  const stackOffset = 15;
                  const stackScale = 0.05;
                  const stackedStyle = isStacked
                    ? {
                        position: 'absolute' as const,
                        top: `${(sortedCards.length - 1 - index) * stackOffset}px`,
                        left: 0,
                        right: 0,
                        zIndex: sortedCards.length - index,
                        transform: `scale(${1 - index * stackScale})`,
                        transformOrigin: 'top center',
                        cursor: 'pointer',
                        boxShadow: isDarkMode ? '0px -4px 20px rgba(0,0,0,0.4)' : 'none',
                      }
                    : {
                        position: 'relative' as const,
                        zIndex: isSelected ? 50 : 1, // Bring selected to front
                      };
                  return (
                    <div
                      key={card.id}
                      id={`card-wrapper-${card.id}`}
                      className={`card-wrapper transition-all duration-300 ease-in-out flex flex-col items-center w-full`}
                      onMouseDown={() => startPress(card.id)}
                      onMouseUp={endPress}
                      onMouseLeave={endPress}
                      onTouchStart={() => startPress(card.id)}
                      onTouchEnd={endPress}
                      onClick={e => handleCardClick(e, card.id)}
                      style={stackedStyle}
                    >
                      <div
                        className={`relative w-full rounded-[16px] overflow-hidden shrink-0 transition-all duration-[250ms] ease-in-out ${isStacked ? 'hover:brightness-110' : ''}`}
                        style={{
                          height: cardHeight,
                          backgroundImage: `url(${bgSrc})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          // White stroke on the card visual itself
                          border: isSelected ? '2px solid white' : 'none',
                          zIndex: 2, // Above the menu
                        }}
                      >
                        {isDefault && (
                          <div
                            className="absolute top-0 left-0 w-full h-[24px] flex items-center justify-center z-10"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.64)' }}
                          >
                            <span className="text-white text-[10px] font-medium uppercase tracking-wider">
                              DEFAULT
                            </span>
                          </div>
                        )}
                        <div className="relative w-full h-full px-[26px]">
                          <div
                            className="absolute right-[26px] w-[40px] h-[30px] flex justify-end transition-all"
                            style={{ top: `${chipTop}px` }}
                          >
                            <img
                              src={ASSETS.CARD_CHIP}
                              alt="Chip"
                              className="h-[28px] object-contain"
                            />
                          </div>
                          <div
                            className="absolute left-[26px] right-[70px] transition-all"
                            style={{ top: `${nameTop}px` }}
                          >
                            <p className="text-white text-[16px] font-medium uppercase font-satoshi truncate">
                              {card.holder || 'NO NAME'}
                            </p>
                          </div>
                          <div
                            className="absolute left-[26px] transition-all"
                            style={{ top: `${labelTop}px` }}
                          >
                            <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi">
                              Card Number
                            </p>
                          </div>
                          <div
                            className="absolute left-[26px] right-[26px] transition-all"
                            style={{ top: `${numberTop}px` }}
                          >
                            <p className="text-white text-[20px] font-bold font-satoshi tracking-widest h-[24px]">
                              {formatCardNumber(card.number)}
                            </p>
                          </div>
                          <div
                            className="absolute left-[26px] flex gap-8 transition-all"
                            style={{ top: `${expiryTop}px` }}
                          >
                            <div className="flex flex-col gap-[5px]">
                              <label className="text-[#C4C4C4] text-[14px] font-normal font-satoshi leading-none">
                                Expiry Date
                              </label>
                              <p className="text-white text-[13px] font-bold font-satoshi leading-none">
                                {card.expiry}
                              </p>
                            </div>
                            <div className="flex flex-col gap-[5px]">
                              <div className="flex items-center gap-3">
                                <label className="text-[#C4C4C4] text-[14px] font-normal font-satoshi leading-none">
                                  CVV
                                </label>
                                <button
                                  type="button"
                                  onClick={e => toggleCardVisibility(card.id, e)}
                                  className="text-white/60 hover:text-white shrink-0 z-20 transition-colors"
                                  aria-label={isVisible ? 'Hide CVV' : 'Show CVV'}
                                >
                                  {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                              </div>
                              <p className="text-white text-[14px] font-bold font-satoshi leading-none">
                                ***
                              </p>
                            </div>
                          </div>
                          <div
                            className="absolute right-[26px] h-[24px] transition-all"
                            style={{ bottom: `${logoBottom}px` }}
                          >
                            {card.type === 'visa' && (
                              <img
                                src={ASSETS.VISA_LOGO}
                                alt="Visa"
                                className="h-full object-contain"
                              />
                            )}
                            {card.type === 'mastercard' && (
                              <img
                                src={ASSETS.MASTERCARD_LOGO}
                                alt="Mastercard"
                                className="h-full object-contain"
                              />
                            )}
                            {card.type === 'rupay' && (
                              <img
                                src={ASSETS.RUPAY_LOGO}
                                alt="Rupay"
                                className="h-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      {!isStacked && isSelected && (
                        <div
                          className="w-full h-[66px] rounded-b-[16px] relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300"
                          style={
                            isDarkMode
                              ? {
                                  backgroundImage: `url(${ASSETS.EXPAND_CONTAINER_BG})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  marginTop: '-18px',
                                  zIndex: 1,
                                }
                              : {
                                  background: `linear-gradient(#F5F5F5, #F5F5F5) padding-box, linear-gradient(${isDefault ? 'to bottom, #FFFFFF, #FF2626' : 'to right, #FF2626, #FFD21F'}) border-box`,
                                  border: '1px solid transparent',
                                  marginTop: '-18px',
                                  zIndex: 1,
                                }
                          }
                          onClick={e => e.stopPropagation()}
                        >
                          {!isDarkMode && isDefault && (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                              style={{
                                top: '-35px',
                                width: '120px',
                                height: '40px',
                                backgroundColor: '#FF3B30',
                                filter: 'blur(30px)',
                                opacity: 0.6,
                              }}
                            />
                          )}
                          {!isDarkMode && !isDefault && (
                            <>
                              <div
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                  top: '-35px',
                                  left: '15%',
                                  width: '100px',
                                  height: '40px',
                                  backgroundColor: '#FF3B30',
                                  filter: 'blur(30px)',
                                  opacity: 0.6,
                                }}
                              />
                              <div
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                  top: '-35px',
                                  right: '15%',
                                  width: '100px',
                                  height: '40px',
                                  backgroundColor: '#FACC15',
                                  filter: 'blur(30px)',
                                  opacity: 0.6,
                                }}
                              />
                            </>
                          )}
                          <div className="w-full h-full flex items-end justify-center pb-[14px] relative z-10">
                            {isDefault ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      onClick={e => e.stopPropagation()}
                                      className="flex items-center gap-2 px-4 w-full justify-center opacity-80 hover:opacity-100 transition-opacity"
                                    >
                                      <img
                                        src={ASSETS.DELETE_ICON}
                                        alt="Remove"
                                        className="w-[18px] h-[18px] object-contain"
                                      />
                                      <span className="text-brand-error text-[14px] font-medium">
                                        Remove Card
                                      </span>
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className={`${isDarkMode ? 'bg-[#12121a] border-white/10 text-white' : 'bg-white'}`}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Card?</AlertDialogTitle>
                                      <AlertDialogDescription className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                        This card will be removed from your account. You can always add it back later.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className={`${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : ''}`}>Keep it</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={async () => {
                                          const card = cards.find(c => c.id === selectedCardId);
                                          const last4 = card ? card.number.slice(-4) : 'XXXX';
                                          await removeCard(selectedCardId!);
                                          navigate(ROUTES.CARD_REMOVE_SUCCESS, { state: { last4 } });
                                        }}
                                        className="bg-red-500 hover:bg-red-600 text-white border-none"
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                              <div className="w-full flex items-center h-[24px]">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        onClick={e => e.stopPropagation()}
                                        className="flex-1 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                                      >
                                        <img
                                          src={ASSETS.DELETE_ICON}
                                          alt="Remove"
                                          className="w-[18px] h-[18px] object-contain"
                                        />
                                        <span className="text-brand-error text-[14px] font-medium">
                                          Remove Card
                                        </span>
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className={`${isDarkMode ? 'bg-[#12121a] border-white/10 text-white' : 'bg-white'}`}>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Card?</AlertDialogTitle>
                                        <AlertDialogDescription className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                          This card will be removed from your account. You can always add it back later.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className={`${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : ''}`}>Keep it</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={async () => {
                                            const card = cards.find(c => c.id === selectedCardId);
                                            const last4 = card ? card.number.slice(-4) : 'XXXX';
                                            await removeCard(selectedCardId!);
                                            navigate(ROUTES.CARD_REMOVE_SUCCESS, { state: { last4 } });
                                          }}
                                          className="bg-red-500 hover:bg-red-600 text-white border-none"
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                <div
                                  className={`w-[1.5px] ${isDarkMode ? 'bg-[#2A2A2A]' : 'bg-white/20'} self-stretch`}
                                />
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDefaultClick();
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                                >
                                  <img
                                    src={ASSETS.DEFAULT_ICON}
                                    alt="Default"
                                    className="w-[18px] h-[18px] object-contain"
                                    style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
                                  />
                                  <span
                                    className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium`}
                                  >
                                    Set as Default?
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isStacked && (
                  <div
                    className="absolute w-full flex items-center justify-center transition-all duration-300 delay-100"
                    style={{
                      top: `${(sortedCards.length - 1) * 15 + 212 + 24}px`,
                    }}
                  >
                    <p
                      className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px] font-satoshi`}
                    >
                      Cards added: {cards.length}
                    </p>
                  </div>
                )}
                {!isStacked && (
                  <div className="w-full flex items-center justify-center mt-2 pb-[100px]">
                    <p
                      className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px] font-satoshi`}
                    >
                      Cards added: {cards.length}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        id="fab-container"
        className={`fixed z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex items-center overflow-hidden ${contentBlurClass} ${tutorialStep > 0 ? 'pointer-events-none' : ''}`}
        style={{
          bottom: '120px',
          right: '20px',
          height: '56px',
          width: isFabExpanded ? '180px' : '56px',
          borderRadius: '999px', // Always fully rounded
        }}
      >
        <button
          onClick={handleFabClick}
          className="w-full h-full relative flex items-center justify-center overflow-hidden"
          style={{ background: '#5260FE' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: '1px solid transparent',
              background:
                'linear-gradient(to top right, rgba(255,255,255,0.12), rgba(0,0,0,0.20)) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          <div className="flex items-center w-full h-full px-4 relative z-10">
            <div className="w-full h-full flex items-center justify-center">
              {isFabExpanded ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <img src={ASSETS.FAB_PLUS} alt="+" className="w-6 h-6 object-contain" />
                  <span className="text-white text-[14px] font-medium whitespace-nowrap">
                    Add New Card
                  </span>
                </div>
              ) : (
                <img src={ASSETS.FAB_PLUS} alt="+" className="w-6 h-6 object-contain" />
              )}
            </div>
          </div>
        </button>
      </div>
      <div className={contentBlurClass}>
        <BottomNavigation activeTab="cards" isHidden={confirmAction !== null} />
      </div>
      <ConfirmationModal
        isOpen={confirmAction === 'default'}
        onClose={closeConfirmation}
        title="Set as Default Card?"
        description="Are you sure you want to set this card as your Default card? This will replace your current default card."
        primaryButtonSrc={ASSETS.BUTTON_SET_DEFAULT}
        primaryText="Set as Default"
        onPrimaryClick={async () => {
          if (confirmAction === 'default' && selectedCardId) {
            await setDefaultCard(selectedCardId);
            const updated = await getCards();
            setCards(updated);
            setSelectedCardId(null);
            closeConfirmation();
          }
        }}
        secondaryButtonSrc={ASSETS.BUTTON_CANCEL_WIDE}
        secondaryText="Cancel"
      />
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className={`relative rounded-[13px] z-10 flex flex-col items-center ${isDarkMode ? 'border border-white/10' : ''}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.POPUP_BG})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    width: '362px',
                    height: '199px',
                  }
                : {
                    backgroundImage: `url(${ASSETS.CARD_POPUP_LIGHT})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    width: '362px',
                    height: '199px',
                  }
            }
          >
            <div className="flex items-center justify-center" style={{ marginTop: '22px' }}>
              <img
                src={isDarkMode ? ASSETS.POPUP_CARD_ICON : ASSETS.CARD_LINE_ICON}
                alt="Card Success"
                className="object-contain"
                style={{
                  width: '26px',
                  height: '26px',
                  filter: !isDarkMode ? 'brightness(0)' : undefined,
                }}
              />
            </div>
            <h2
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans text-center`}
              style={{ marginTop: '12px' }}
            >
              Card Added Successfully
            </h2>
            <div
              className={`${isDarkMode ? 'bg-black' : 'bg-white'} flex items-center px-4`}
              style={{
                marginTop: '24px',
                width: '318px',
                minHeight: '73px',
                borderRadius: '16px',
              }}
            >
              <p
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[120%] text-left font-sans`}
              >
                Your card has been saved successfully. You can now use this card for withdrawals and
                payments.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessModal(false)}
            className={cn(
              'relative z-10 mt-6 px-8 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden',
              isDarkMode ? 'glass-container glass-physics-clear grow-0' : 'bg-black'
            )}
            style={
              {
                '--glass-specular-intensity': '0.2',
              } as any
            }
          >
            {isDarkMode && (
              <>
                <div className="glass-lens" />
                <div
                  className="absolute inset-0 z-[1] pointer-events-none"
                  style={{ backgroundColor: 'var(--glass-tint)' }}
                />
                <span className="glass-rim-v2" />
              </>
            )}
            <X className="w-4 h-4 text-white relative z-10" />
            <span className="text-white text-[14px] font-sans relative z-10">Close</span>
          </button>
        </div>
      )}
      {tutorialStep > 0 && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={handleTutorialClick}
        >
          <div className="flex flex-col items-center text-center max-w-[320px] pb-32 animate-in zoom-in-95 duration-300">
            {tutorialStep === 1 && (
              <>
                <img
                  src={ASSETS.TUTORIAL_TAP}
                  alt="Tap"
                  className="w-[60px] h-[60px] object-contain mb-4"
                />
                <p className="text-white text-[15px] font-medium leading-relaxed">
                  Single tap to expand the cards list.
                </p>
              </>
            )}
            {tutorialStep === 2 && (
              <>
                <img
                  src={ASSETS.TUTORIAL_LONG_PRESS}
                  alt="Long Press"
                  className="w-[60px] h-[60px] object-contain mb-4"
                />
                <p className="text-white text-[15px] font-medium leading-relaxed">
                  Long press the card to expand additional actions such as deleting card, making
                  card primary.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default MyCards;
