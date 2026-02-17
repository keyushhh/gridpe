import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import savedCardsBg from "@/assets/saved-card-bg.png";
import addIcon from "@/assets/my-cards-add-icon.png";
import BottomNavigation from "@/components/BottomNavigation";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import popupCardIcon from "@/assets/popup-card-icon.png";
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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [cards, setCards] = useState<Card[]>([]);
    const [isFabExpanded, setIsFabExpanded] = useState(false);
    const [isStacked, setIsStacked] = useState(true);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    // Tutorial State: 0 = none, 1 = tap, 2 = long press
    const [tutorialStep, setTutorialStep] = useState(0);

    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState<'remove' | 'default' | null>(null);

    // Track visibility per card
    const [visibleCardIds, setVisibleCardIds] = useState<Record<string, boolean>>({});

    // Long press refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    useEffect(() => {
        // Load cards on mount
        const loadedCards = getCards();
        setCards(loadedCards);

        // Default to stacked only if we have cards
        setIsStacked(loadedCards.length > 1);

        // Check for tutorial
        const hasSeenTutorial = localStorage.getItem("gridpe_stack_tutorial_seen");
        if (!hasSeenTutorial && loadedCards.length > 1) {
            setTutorialStep(1);
        }

        if (location.state?.cardAdded) {
            // Reload cards to get the new one
            const refreshedCards = getCards();
            setCards(refreshedCards);
            setShowSuccessModal(true);
            setIsStacked(refreshedCards.length > 1);

            // If we just added a card and now have >1, we might need to show tutorial if not seen
            if (!hasSeenTutorial && refreshedCards.length > 1) {
                setTutorialStep(1);
            }

            // Clean up state so refresh doesn't trigger it again
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

    // Click outside to collapse FAB or Close Menu
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
        e.stopPropagation(); // Prevent stack expansion when clicking eye
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

    // --- Long Press Handlers ---
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

    // Sort cards: Default first
    const sortedCards = [...cards].sort((a, b) => {
        if (a.isDefault === b.isDefault) return 0;
        return a.isDefault ? -1 : 1;
    });

    // Calculate blur class based on modals OR tutorial
    const contentBlurClass = showSuccessModal || tutorialStep > 0 ? 'blur-sm brightness-50' : '';

    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
            onClick={() => {
                if (!isStacked && cards.length > 1) {
                    setIsStacked(true);
                }
            }}
        >
            {/* Main Content with conditional blur */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ${contentBlurClass}`}>
                {/* Header - Back Button Removed */}
                <div className="px-5 pt-4 flex items-center justify-between">
                    <h1 className="text-foreground text-[20px] font-medium">My Cards</h1>
                </div>

                {/* Content */}
                <div className="px-5 mt-8 flex-1 overflow-y-auto overscroll-y-none scrollbar-hide pb-0">

                    {cards.length === 0 ? (
                        /* Empty State */
                        <div
                            className="w-full rounded-2xl p-4"
                            style={{
                                backgroundImage: `url(${savedCardsBg})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                height: "140px",
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-white text-[16px] font-medium">Saved Cards</h2>
                                <button
                                    onClick={() => navigate("/cards/add")}
                                    className="opacity-100 active:opacity-70 transition-opacity"
                                >
                                    <img src={addIcon} alt="Add" className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="h-[1px] bg-white/10 w-full mt-[15px] mb-[15px]" />
                            <p className="text-white/60 text-[14px]">
                                You haven’t added any cards yet.
                            </p>
                        </div>
                    ) : (
                        /* Cards View (Stacked or List) */
                        <div className={`transition-all duration-500 ease-in-out ${isStacked ? 'mt-4 relative h-[320px] w-full mx-auto' : 'flex flex-col gap-4'}`}>
                            {sortedCards.map((card, index) => {
                                const bgSrc = cardBackgrounds[(card.backgroundIndex - 1) % 6];
                                const isDefault = card.isDefault;
                                const isVisible = visibleCardIds[card.id] || false;
                                const isSelected = selectedCardId === card.id;

                                // Layout constants
                                const chipTop = isDefault ? 34 : 21;
                                const nameTop = isDefault ? 42 : 26;
                                const labelTop = isDefault ? 86 : 70;
                                const numberTop = isDefault ? 109 : 93;
                                const expiryTop = isDefault ? 145 : 129;
                                const logoBottom = 26;
                                const cardHeightValue = isDefault ? 212 : 192;
                                const cardHeight = `${cardHeightValue}px`;

                                // Stacking Logic
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
                                    boxShadow: "0px -4px 20px rgba(0,0,0,0.4)"
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
                                        {/* The Card Visual */}
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
                                            {/* Default Tag */}
                                            {isDefault && (
                                                <div
                                                    className="absolute top-0 left-0 w-full h-[24px] flex items-center justify-center z-10"
                                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.64)' }}
                                                >
                                                    <span className="text-white text-[10px] font-medium uppercase tracking-wider">DEFAULT</span>
                                                </div>
                                            )}

                                            <div className="relative w-full h-full px-[26px]">
                                                {/* Chip */}
                                                <div
                                                    className="absolute right-[26px] w-[40px] h-[30px] flex justify-end transition-all"
                                                    style={{ top: `${chipTop}px` }}
                                                >
                                                    <img src={chipIcon} alt="Chip" className="h-[28px] object-contain" />
                                                </div>

                                                {/* Name */}
                                                <div
                                                    className="absolute left-[26px] right-[70px] transition-all"
                                                    style={{ top: `${nameTop}px` }}
                                                >
                                                    <p className="text-white text-[16px] font-medium uppercase font-satoshi truncate">
                                                        {card.holder || "NO NAME"}
                                                    </p>
                                                </div>

                                                {/* Label */}
                                                <div
                                                    className="absolute left-[26px] transition-all"
                                                    style={{ top: `${labelTop}px` }}
                                                >
                                                    <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi">Card Number</p>
                                                </div>

                                                {/* Number + Eye */}
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

                                                {/* Expiry & CVV */}
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

                                                {/* Network Logo */}
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

                                        {/* Action Menu (Extending from behind) */}
                                        {!isStacked && isSelected && (
                                            <div
                                                className="w-full h-[60px] rounded-b-[16px] relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300"
                                                style={{
                                                    backgroundImage: `url(${expandContainerBg})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    marginTop: '-12px', // Pull it up to "connect" behind
                                                    // Padding adjustments handled inside flex container below
                                                    zIndex: 1, // Behind card
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="w-full h-full flex items-end justify-center pb-[14px]">
                                                    {/* Added items-end + pb-[14px] to position actions from bottom */}

                                                    {/* Default Card: Remove Only */}
                                                    {isDefault ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                                                            className="flex items-center gap-2 px-4 w-full justify-center opacity-80 hover:opacity-100 transition-opacity"
                                                        >
                                                            <img src={deleteIcon} alt="Remove" className="w-[18px] h-[18px] object-contain" />
                                                            <span className="text-[#FF3B30] text-[14px] font-medium">Remove Card</span>
                                                        </button>
                                                    ) : (
                                                        /* Non-Default: Remove (First) | Set Default (Second) */
                                                        <div className="w-full flex items-center h-[24px]">
                                                            {/* Fixed height for the row to contain text/icons properly if needed, but flex handles it.
                                                    The divider needs to stretch within THIS container.
                                                */}

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                                                                className="flex-1 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <img src={deleteIcon} alt="Remove" className="w-[18px] h-[18px] object-contain" />
                                                                <span className="text-[#FF3B30] text-[14px] font-medium">Remove Card</span>
                                                            </button>

                                                            {/* Divider - Self Stretch to fill height of the row */}
                                                            <div className="w-[1.5px] bg-[#2A2A2A] self-stretch" />

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDefaultClick(); }}
                                                                className="flex-1 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <img src={defaultIcon} alt="Default" className="w-[18px] h-[18px] object-contain" />
                                                                <span className="text-white text-[14px] font-medium">Set as Default?</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Cards Count (Only in Stacked View) */}
                            {isStacked && (
                                <div
                                    className="absolute w-full flex items-center justify-center transition-all duration-300 delay-100"
                                    style={{
                                        // Position below the front card. Front card top is approx 30-45px + 212px height.
                                        // Formula: (N-1)*15 + 212 + 20px padding
                                        top: `${(sortedCards.length - 1) * 15 + 212 + 24}px`
                                    }}
                                >
                                    <p className="text-white/60 text-[14px] font-satoshi">
                                        Cards added: {cards.length}
                                    </p>
                                </div>
                            )}

                            {/* Cards Count (In List View, standard flow) */}
                            {!isStacked && (
                                <div className="w-full flex items-center justify-center mt-2 pb-[100px]">
                                    <p className="text-white/60 text-[14px] font-satoshi">
                                        Cards added: {cards.length}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* FAB / Add Button */}
            <div
                id="fab-container"
                className={`fixed z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex items-center overflow-hidden ${contentBlurClass} ${tutorialStep > 0 ? 'pointer-events-none' : ''}`}
                style={{
                    bottom: "100px",
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

            {/* Bottom Navigation */}
            <div className={contentBlurClass}>
                <BottomNavigation activeTab="cards" isHidden={confirmAction !== null} />
            </div>

            {/* Confirmation Modal */}
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6">
                    <div
                        className="relative rounded-2xl p-6 max-w-[320px] w-full z-10 flex flex-col items-center text-center border border-white/10"
                        style={{
                            backgroundImage: `url(${popupBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <img src={popupCardIcon} alt="Card Success" className="w-8 h-8 mb-4 object-contain" />
                        <h2 className="text-white text-[18px] font-semibold mb-4">Card Added Successfully</h2>
                        <div className="bg-black rounded-xl w-full px-[12px] py-[11px]">
                            <p className="text-white text-[14px] leading-relaxed text-left">
                                Your card has been saved successfully. You can now use this card for withdrawals and payments.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSuccessModal(false)}
                        className="relative z-10 mt-6 px-8 py-3 rounded-full flex items-center justify-center gap-2"
                        style={{
                            backgroundImage: `url(${buttonCloseBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <X className="w-4 h-4 text-foreground" />
                        <span className="text-foreground text-[14px]">Close</span>
                    </button>
                </div>
            )}

            {/* Tutorial Overlay */}
            {tutorialStep > 0 && (
                <div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={handleTutorialClick}
                >
                    {/* Content */}
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
