import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import savedCardsBg from "@/assets/saved-card-bg.png";
import addIcon from "@/assets/my-cards-add-icon.png";
import BottomNavigation from "@/components/BottomNavigation";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import popupCardIcon from "@/assets/popup-card-icon.png";
import cardPopupLight from "@/assets/card-popup-light.png";
import cardLineIcon from "@/assets/card-line-icon.svg";
import fabPlus from "@/assets/fab-plus.png";
import chipIcon from "@/assets/card-chip.png";
import mastercardLogo from "@/assets/mastercard-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import rupayLogo from "@/assets/rupay-logo.png";
import defaultIcon from "@/assets/default-icon.png";
import deleteIcon from "@/assets/delete-icon.png";
import expandContainerBg from "@/assets/expand-container-bg.png";
import ConfirmationModal from "@/components/ConfirmationModal";
import buttonRemoveCard from "@/assets/button-remove-card.png";
import buttonSetDefault from "@/assets/button-set-default.png";
import buttonCancelWide from "@/assets/button-cancel-wide.png";
import tutorialTap from "@/assets/tutorial-tap.png";
import tutorialLongPress from "@/assets/tutorial-long-press.png";
import { getCards, Card, removeCard, setDefaultCard } from "@/utils/cardUtils";
import { supabase, USER_ID } from "@/lib/supabase";

// Import all saved card backgrounds
import savedCard1 from "@/assets/saved-card-1.png";
import savedCard2 from "@/assets/saved-card-2.png";
import savedCard3 from "@/assets/saved-card-3.png";
import savedCard4 from "@/assets/saved-card-4.png";
import savedCard5 from "@/assets/saved-card-5.png";
import savedCard6 from "@/assets/saved-card-6.png";

const cardBackgrounds = [savedCard1, savedCard2, savedCard3, savedCard4, savedCard5, savedCard6];

const MyCards = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';
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
        const localCards = getCards();

        try {
            const { data: dbCards, error } = await supabase
                .from('bank_cards')
                .select('*')
                .eq('user_id', USER_ID);

            if (error) throw error;

            if (dbCards) {
                const mappedDbCards: Card[] = dbCards.map((db, index) => ({
                    id: db.id.toString(),
                    number: `**** **** **** ${db.last_four}`,
                    holder: db.card_holder_name,
                    expiry: `${db.expiry_month}/${db.expiry_year.toString().slice(-2)}`,
                    type: db.card_type.toLowerCase() as any,
                    isDefault: localCards.length === 0 && index === 0, // Fallback logic
                    backgroundIndex: (localCards.length + index % 6) + 1
                }));

                setCards([...localCards, ...mappedDbCards]);
                setIsStacked(localCards.length + mappedDbCards.length > 1);
            } else {
                setCards(localCards);
                setIsStacked(localCards.length > 1);
            }
        } catch (err) {
            console.error("Error fetching cards:", err);
            setCards(localCards);
            setIsStacked(localCards.length > 1);
        }
    };

    useEffect(() => {
        fetchAllCards();

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
            localStorage.setItem("gridpe_stack_tutorial_seen", "true");
        }
    };

    const handleFabClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Always expand first, then navigate
        if (isFabExpanded) {
            navigate("/cards/add");
        } else {
            setIsFabExpanded(true);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("#fab-container") && isFabExpanded) {
                setIsFabExpanded(false);
            }

            // If clicking outside the currently selected card wrapper, clear selection
            const selectedWrapper = document.getElementById(`card-wrapper-${selectedCardId}`);
            if (selectedCardId && (!target.closest(".card-wrapper") || (selectedWrapper && !selectedWrapper.contains(target)))) {
                setSelectedCardId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isFabExpanded, selectedCardId]);

    const toggleCardVisibility = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setVisibleCardIds(prev => ({
            ...prev,
            [id]: !prev[id]
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

    const formatCardNumber = (num: string) => {
        if (!num) return "";
        const chunks = num.match(/.{1,4}/g) || [];
        return chunks.join(" ");
    };

    const getMaskedCardNumber = (num: string) => {
        if (!num) return "";
        const last4 = num.slice(-4);
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
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                willChange: 'transform',
                transform: 'translateZ(0)'
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
                        backgroundColor: "#5260FE",
                        filter: "blur(60px)",
                        opacity: 0.8,
                        mixBlendMode: "normal"
                    }}
                />
            )}
            <div className={`flex flex-col flex-1 transition-all duration-300 ${contentBlurClass}`}>
                <div className="px-5 pt-4 flex items-center justify-center relative z-10">
                    <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[20px] font-medium text-center w-full`}>My Cards</h1>
                </div>

                <div 
                    className="px-5 mt-8 flex-1 overflow-y-auto overscroll-y-contain scrollbar-hide pb-[120px] min-h-0"
                    style={{ willChange: 'transform', WebkitOverflowScrolling: 'touch' }}
                >

                    {cards.length === 0 ? (
                        <div
                            className={`w-full rounded-2xl p-4 ${!isDarkMode ? 'border border-[#E9EAEB]' : ''}`}
                            style={isDarkMode ? {
                                backgroundImage: `url(${savedCardsBg})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                height: "140px",
                            } : {
                                backgroundColor: "#FFFFFF",
                                height: "140px",
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium`}>Saved Cards</h2>
                                <button
                                    onClick={() => navigate("/cards/add")}
                                    className="opacity-100 active:opacity-70 transition-opacity"
                                >
                                    <img src={addIcon} alt="Add" className="w-5 h-5" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                                </button>
                            </div>
                            <div className={`h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-[#E9EAEB]'} w-full mt-[15px] mb-[15px]`} />
                            <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px]`}>
                                You haven't added any cards yet.
                            </p>
                        </div>
                    ) : (
                        <div className={`transition-all duration-500 ease-in-out ${isStacked ? 'mt-4 relative h-[320px] w-full mx-auto' : 'flex flex-col gap-4'}`}>
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

                                const stackedStyle = isStacked ? {
                                    position: "absolute" as const,
                                    top: `${(sortedCards.length - 1 - index) * stackOffset}px`,
                                    left: 0,
                                    right: 0,
                                    zIndex: sortedCards.length - index,
                                    transform: `scale(${1 - (index * stackScale)})`,
                                    transformOrigin: "top center",
                                    cursor: "pointer",
                                    boxShadow: isDarkMode ? "0px -4px 20px rgba(0,0,0,0.4)" : "none"
                                } : {
                                    position: "relative" as const,
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
                                        onClick={(e) => handleCardClick(e, card.id)}
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
                                                    <span className="text-white text-[10px] font-medium uppercase tracking-wider">DEFAULT</span>
                                                </div>
                                            )}

                                            <div className="relative w-full h-full px-[26px]">
                                                <div
                                                    className="absolute right-[26px] w-[40px] h-[30px] flex justify-end transition-all"
                                                    style={{ top: `${chipTop}px` }}
                                                >
                                                    <img src={chipIcon} alt="Chip" className="h-[28px] object-contain" />
                                                </div>

                                                <div
                                                    className="absolute left-[26px] right-[70px] transition-all"
                                                    style={{ top: `${nameTop}px` }}
                                                >
                                                    <p className="text-white text-[16px] font-medium uppercase font-satoshi truncate">
                                                        {card.holder || "NO NAME"}
                                                    </p>
                                                </div>

                                                <div
                                                    className="absolute left-[26px] transition-all"
                                                    style={{ top: `${labelTop}px` }}
                                                >
                                                    <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi">Card Number</p>
                                                </div>

                                                <div
                                                    className="absolute left-[26px] right-[26px] flex items-center justify-between transition-all"
                                                    style={{ top: `${numberTop}px` }}
                                                >
                                                    <div className="relative flex-1 mr-4">
                                                        <p className="text-white text-[20px] font-bold font-satoshi tracking-widest h-[24px]">
                                                            {isVisible ? formatCardNumber(card.number) : getMaskedCardNumber(card.number)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleCardVisibility(card.id, e)}
                                                        className="text-white shrink-0 z-20 hover:text-white/80"
                                                    >
                                                        {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                                                    </button>
                                                </div>

                                                <div
                                                    className="absolute left-[26px] flex gap-8 transition-all"
                                                    style={{ top: `${expiryTop}px` }}
                                                >
                                                    <div className="flex flex-col gap-[5px]">
                                                        <label className="text-[#C4C4C4] text-[14px] font-normal font-satoshi leading-none">Expiry Date</label>
                                                        <p className="text-white text-[13px] font-bold font-satoshi leading-none">
                                                            {card.expiry}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-[5px]">
                                                        <label className="text-[#C4C4C4] text-[14px] font-normal font-satoshi leading-none">CVV</label>
                                                        <p className="text-white text-[14px] font-bold font-satoshi leading-none">
                                                            {isVisible ? (card.cvv || "123") : "***"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div
                                                    className="absolute right-[26px] h-[24px] transition-all"
                                                    style={{ bottom: `${logoBottom}px` }}
                                                >
                                                    {card.type === "visa" && <img src={visaLogo} alt="Visa" className="h-full object-contain" />}
                                                    {card.type === "mastercard" && <img src={mastercardLogo} alt="Mastercard" className="h-full object-contain" />}
                                                    {card.type === "rupay" && <img src={rupayLogo} alt="Rupay" className="h-full object-contain" />}
                                                </div>
                                            </div>
                                        </div>

                                        {!isStacked && isSelected && (
                                            <div
                                                className="w-full h-[66px] rounded-b-[16px] relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300"
                                                style={isDarkMode ? {
                                                    backgroundImage: `url(${expandContainerBg})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    marginTop: '-18px',
                                                    zIndex: 1,
                                                } : {
                                                    background: `linear-gradient(#F5F5F5, #F5F5F5) padding-box, linear-gradient(${isDefault ? 'to bottom, #FFFFFF, #FF2626' : 'to right, #FF2626, #FFD21F'}) border-box`,
                                                    border: '1px solid transparent',
                                                    marginTop: '-18px',
                                                    zIndex: 1,
                                                }}
                                                onClick={(e) => e.stopPropagation()}
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
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                                                            className="flex items-center gap-2 px-4 w-full justify-center opacity-80 hover:opacity-100 transition-opacity"
                                                        >
                                                            <img src={deleteIcon} alt="Remove" className="w-[18px] h-[18px] object-contain" />
                                                            <span className="text-[#FF3B30] text-[14px] font-medium">Remove Card</span>
                                                        </button>
                                                    ) : (
                                                        <div className="w-full flex items-center h-[24px]">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                                                                className="flex-1 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <img src={deleteIcon} alt="Remove" className="w-[18px] h-[18px] object-contain" />
                                                                <span className="text-[#FF3B30] text-[14px] font-medium">Remove Card</span>
                                                            </button>

                                                            <div className={`w-[1.5px] ${isDarkMode ? 'bg-[#2A2A2A]' : 'bg-white/20'} self-stretch`} />

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDefaultClick(); }}
                                                                className="flex-1 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <img src={defaultIcon} alt="Default" className="w-[18px] h-[18px] object-contain" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                                                                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium`}>Set as Default?</span>
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
                                        top: `${(sortedCards.length - 1) * 15 + 212 + 24}px`
                                    }}
                                >
                                    <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px] font-satoshi`}>
                                        Cards added: {cards.length}
                                    </p>
                                </div>
                            )}

                            {!isStacked && (
                                <div className="w-full flex items-center justify-center mt-2 pb-[100px]">
                                    <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px] font-satoshi`}>
                                        Cards added: {cards.length}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div
                id="fab-container"
                className={`fixed z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex items-center overflow-hidden ${contentBlurClass} ${tutorialStep > 0 ? 'pointer-events-none' : ''}`}
                style={{
                    bottom: "120px",
                    right: "20px",
                    height: "56px",
                    width: isFabExpanded ? "180px" : "56px",
                    borderRadius: "999px", // Always fully rounded
                }}
            >
                <button
                    onClick={handleFabClick}
                    className="w-full h-full relative flex items-center justify-center overflow-hidden"
                    style={{ background: "#5260FE" }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            border: "1px solid transparent",
                            background: "linear-gradient(to top right, rgba(255,255,255,0.12), rgba(0,0,0,0.20)) border-box",
                            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    />

                    <div className="flex items-center w-full h-full px-4 relative z-10">
                        <div className="w-full h-full flex items-center justify-center">
                            {isFabExpanded ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <img src={fabPlus} alt="+" className="w-6 h-6 object-contain" />
                                    <span className="text-white text-[14px] font-medium whitespace-nowrap">
                                        Add New Card
                                    </span>
                                </div>
                            ) : (
                                <img src={fabPlus} alt="+" className="w-6 h-6 object-contain" />
                            )}
                        </div>
                    </div>
                </button>
            </div>

            <div className={contentBlurClass}>
                <BottomNavigation activeTab="cards" isHidden={confirmAction !== null} />
            </div>

            <ConfirmationModal
                isOpen={confirmAction !== null}
                onClose={closeConfirmation}
                title={confirmAction === 'remove' ? "Remove Card?" : "Set as Default Card?"}
                description={
                    confirmAction === 'remove'
                        ? "Are you sure you want to remove this card? This action is irreversible."
                        : "Are you sure you want to set this card as your Default card? This will replace your current default card."
                }
                primaryButtonSrc={confirmAction === 'remove' ? buttonRemoveCard : buttonSetDefault}
                primaryText={confirmAction === 'remove' ? "Remove Card" : "Set as Default"}
                onPrimaryClick={() => {
                    if (confirmAction === 'remove' && selectedCardId) {
                        const card = cards.find(c => c.id === selectedCardId);
                        const last4 = card ? card.number.slice(-4) : 'XXXX';
                        removeCard(selectedCardId);
                        navigate("/card-remove-success", { state: { last4 } });
                    } else if (confirmAction === 'default' && selectedCardId) {
                        setDefaultCard(selectedCardId);
                        // Refresh local state to reflect change immediately
                        setCards(getCards());
                        setSelectedCardId(null);
                        closeConfirmation();
                    }
                }}
                secondaryButtonSrc={buttonCancelWide}
                secondaryText="Cancel"
            />

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className={`relative rounded-[13px] z-10 flex flex-col items-center ${isDarkMode ? 'border border-white/10' : ''}`}
                        style={isDarkMode ? {
                            backgroundImage: `url(${popupBg})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            width: '362px',
                            height: '199px',
                        } : {
                            backgroundImage: `url(${cardPopupLight})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            width: '362px',
                            height: '199px',
                        }}
                    >
                        <div className="flex items-center justify-center" style={{ marginTop: '22px' }}>
                            <img
                                src={isDarkMode ? popupCardIcon : cardLineIcon}
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
                                height: '73px',
                                borderRadius: '16px',
                            }}
                        >
                            <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[120%] text-left font-sans`}>
                                Your card has been saved successfully. You can now use this card for withdrawals and payments.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSuccessModal(false)}
                        className={`relative z-10 mt-6 px-8 py-3 rounded-full flex items-center justify-center gap-2 ${!isDarkMode ? 'border-none' : ''}`}
                        style={isDarkMode ? {
                            backgroundImage: `url(${buttonCloseBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        } : {
                            backgroundColor: '#5260FE',
                        }}
                    >
                        <X className={`w-4 h-4 ${isDarkMode ? 'text-foreground' : 'text-white'}`} />
                        <span className={`${isDarkMode ? 'text-foreground' : 'text-white'} text-[14px]`}>Close</span>
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
                                    src={tutorialTap}
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
                                    src={tutorialLongPress}
                                    alt="Long Press"
                                    className="w-[60px] h-[60px] object-contain mb-4"
                                />
                                <p className="text-white text-[15px] font-medium leading-relaxed">
                                    Long press the card to expand additional actions such as deleting card, making card primary.
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
