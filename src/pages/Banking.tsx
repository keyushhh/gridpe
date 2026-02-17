import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, X, Eye, EyeOff } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import savedCardsBg from "@/assets/saved-card-bg.png";
import addIcon from "@/assets/my-cards-add-icon.png";
import BottomNavigation from "@/components/BottomNavigation";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import popupCardIcon from "@/assets/popup-card-icon.png";
import fabPlus from "@/assets/fab-plus.png";
import defaultIcon from "@/assets/default-icon.png";
import deleteIcon from "@/assets/delete-icon.png";
import expandContainerBg from "@/assets/expand-container-bg.png";
import ConfirmationModal from "@/components/ConfirmationModal";
import buttonRemoveCard from "@/assets/button-remove-card.png";
import buttonSetDefault from "@/assets/button-set-default.png";
import buttonCancelWide from "@/assets/button-cancel-wide.png";
import bankDefaultCardBg from "@/assets/bank-default-card.png";
import tutorialTap from "@/assets/tutorial-tap.png";
import tutorialLongPress from "@/assets/tutorial-long-press.png";

import {
    getBankAccounts,
    addSelectedAccounts,
    removeBankAccount,
    setDefaultBankAccount,
    BankAccount
} from "@/utils/bankUtils";

const Banking = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isFabExpanded, setIsFabExpanded] = useState(false);
    const [isStacked, setIsStacked] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    // Tutorial State: 0 = none, 1 = tap, 2 = long press
    const [tutorialStep, setTutorialStep] = useState(0);

    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState<'remove' | 'default' | null>(null);

    // Track visibility per account
    const [visibleAccountIds, setVisibleAccountIds] = useState<Record<string, boolean>>({});

    // Long press refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    useEffect(() => {
        // Check if we came from LinkedAccounts flow
        let currentAccounts = getBankAccounts();

        if (location.state?.accountsAdded && location.state?.selectedAccounts) {
            const selected = location.state.selectedAccounts;
            currentAccounts = addSelectedAccounts(selected);
            setAccounts(currentAccounts);
            setShowSuccessModal(true);
            setIsStacked(currentAccounts.length > 1);
            // Clean up state
            window.history.replaceState({}, document.title);
        } else {
            setAccounts(currentAccounts);
            setIsStacked(currentAccounts.length > 1);
        }

        // Check for tutorial
        const hasSeenTutorial = localStorage.getItem("gridpe_stack_tutorial_seen");
        if (!hasSeenTutorial && currentAccounts.length > 1) {
            setTutorialStep(1);
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
        if (isFabExpanded) {
            navigate("/banking/add");
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

            const selectedWrapper = document.getElementById(`account-wrapper-${selectedAccountId}`);
            if (selectedAccountId && (!target.closest(".account-wrapper") || (selectedWrapper && !selectedWrapper.contains(target)))) {
                setSelectedAccountId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isFabExpanded, selectedAccountId]);

    const toggleAccountVisibility = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setVisibleAccountIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleRemoveClick = () => setConfirmAction('remove');
    const handleDefaultClick = () => setConfirmAction('default');
    const closeConfirmation = () => setConfirmAction(null);

    // --- Masking Logic ---
    const formatAccountNumber = (num: string) => {
        return num.match(/.{1,4}/g)?.join(" ") || num;
    };

    const getMaskedAccountNumber = (num: string) => {
        return "****************";
    };

    // --- Long Press Handlers ---
    const startPress = (id: string) => {
        if (isStacked) return;
        isLongPressRef.current = false;
        timerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setSelectedAccountId(id);
        }, 500);
    };

    const endPress = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleAccountClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (isLongPressRef.current) {
            isLongPressRef.current = false;
            return;
        }

        if (isStacked) {
            setIsStacked(false);
        } else {
            if (selectedAccountId === id) {
                setSelectedAccountId(null);
            } else {
                setSelectedAccountId(id);
            }
        }
    };

    useEffect(() => {
        if (isStacked) setSelectedAccountId(null);
    }, [isStacked]);

    const sortedAccounts = [...accounts].sort((a, b) => {
        if (a.isDefault === b.isDefault) return 0;
        return a.isDefault ? -1 : 1;
    });

    // Calculate blur class
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
                if (!isStacked && accounts.length > 1) setIsStacked(true);
            }}
        >
            {/* Main Content */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ${contentBlurClass}`}>

                {/* Header */}
                <div className="px-5 pt-12 flex items-center justify-between shrink-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-colors hover:bg-white/10"
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-foreground text-[18px] font-semibold">Banking</h1>
                    <div className="w-10" />
                </div>

                {/* Content */}
                <div className="px-5 mt-8 flex-1 overflow-y-auto overscroll-y-none scrollbar-hide pb-0">

                    {accounts.length === 0 ? (
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
                                <h2 className="text-white text-[16px] font-medium">Bank Accounts</h2>
                                <button
                                    onClick={() => navigate("/banking/add")}
                                    className="opacity-100 active:opacity-70 transition-opacity"
                                >
                                    <img src={addIcon} alt="Add" className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="h-[1px] bg-white/10 w-full mt-[15px] mb-[15px]" />
                            <p className="text-white/60 text-[14px]">
                                You don’t have any bank accounts added yet.
                                <br />
                                Please add a bank account to proceed.
                            </p>
                        </div>
                    ) : (
                        /* Populated State (Stack/List) */
                        <div className={`transition-all duration-500 ease-in-out ${isStacked ? 'mt-4 relative h-[320px] w-full mx-auto' : 'flex flex-col gap-4'}`}>
                            {sortedAccounts.map((account, index) => {
                                const isDefault = account.isDefault;
                                const isVisible = visibleAccountIds[account.id] || false;
                                const isSelected = selectedAccountId === account.id;

                                // Layout adjustments for Default vs Normal
                                const accountHeightValue = isDefault ? 234 : 210;
                                const accountHeight = `${accountHeightValue}px`;

                                // Stacking Logic
                                const stackOffset = 15;
                                const stackScale = 0.05;
                                const stackedStyle = isStacked ? {
                                    position: "absolute" as const,
                                    top: `${(sortedAccounts.length - 1 - index) * stackOffset}px`,
                                    left: 0,
                                    right: 0,
                                    zIndex: sortedAccounts.length - index,
                                    transform: `scale(${1 - (index * stackScale)})`,
                                    transformOrigin: "top center",
                                    cursor: "pointer",
                                    boxShadow: "0px -4px 20px rgba(0,0,0,0.4)"
                                } : {
                                    position: "relative" as const,
                                    zIndex: isSelected ? 50 : 1,
                                };

                                return (
                                    <div
                                        key={account.id}
                                        id={`account-wrapper-${account.id}`}
                                        className={`account-wrapper transition-all duration-300 ease-in-out flex flex-col items-center w-full`}
                                        onMouseDown={() => startPress(account.id)}
                                        onMouseUp={endPress}
                                        onMouseLeave={endPress}
                                        onTouchStart={() => startPress(account.id)}
                                        onTouchEnd={endPress}
                                        onClick={(e) => handleAccountClick(e, account.id)}
                                        style={stackedStyle}
                                    >
                                        {/* Bank Card Visual */}
                                        <div
                                            className={`relative w-full rounded-[16px] overflow-hidden shrink-0 transition-all duration-[250ms] ease-in-out ${isStacked ? 'hover:brightness-110' : ''}`}
                                            style={{
                                                height: accountHeight,
                                                backgroundImage: `url(${bankDefaultCardBg})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                border: isSelected ? '2px solid white' : 'none',
                                                zIndex: 2,
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

                                            {/* Content Container (Flex) */}
                                            <div className={`absolute inset-0 px-[22px] flex flex-col justify-start ${isDefault ? 'pt-[44px] pb-[40px]' : 'pt-[20px] pb-[40px]'}`}>

                                                <div className="flex flex-col gap-[10px] w-full">

                                                    {/* Block 1: Account Number Section */}
                                                    <div className="w-full">
                                                        {/* Header Row: Label + Pill */}
                                                        <div className="flex items-center justify-between h-[22px]">
                                                            <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi leading-none">
                                                                Account Number
                                                            </p>
                                                            {/* Savings Account Pill */}
                                                            <div
                                                                className="rounded-full flex items-center justify-center"
                                                                style={{
                                                                    width: '92px',
                                                                    height: '22px',
                                                                    padding: '5px 7px',
                                                                    backgroundColor: 'rgba(6, 6, 6, 0.51)'
                                                                }}
                                                            >
                                                                <span className="text-[#C4C4C4] text-[10px] font-medium whitespace-nowrap">
                                                                    {account.accountType}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Account Number Value */}
                                                        <div className="flex items-center gap-4 mt-[4px]">
                                                            <p className="text-white text-[18px] font-bold font-satoshi tracking-wider truncate">
                                                                {isVisible ? formatAccountNumber(account.accountNumber) : getMaskedAccountNumber(account.accountNumber)}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => toggleAccountVisibility(account.id, e)}
                                                                className="text-white/80 hover:text-white shrink-0"
                                                            >
                                                                {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Block 2: IFSC Code Section */}
                                                    <div className="w-full">
                                                        <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi mb-0.5">IFSC Code</p>
                                                        <p className="text-white text-[15px] font-medium font-satoshi">
                                                            {account.ifsc}
                                                        </p>
                                                    </div>

                                                    {/* Block 3: Footer Section (Branch + Logo) */}
                                                    <div className="w-full flex items-end justify-between">
                                                        <div className="max-w-[70%]">
                                                            <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi mb-0.5">Branch</p>
                                                            <p className="text-white text-[14px] font-medium font-satoshi leading-tight truncate">
                                                                {account.branch}
                                                            </p>
                                                        </div>

                                                        {/* Bank Logo */}
                                                        <div className="w-[48px] h-[48px] flex items-center justify-end">
                                                            <img src={account.logo} alt="Bank" className="h-[32px] w-auto object-contain" />
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                        </div>

                                        {/* Action Menu */}
                                        {!isStacked && isSelected && (
                                            <div
                                                className="w-full h-[60px] rounded-b-[16px] relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300"
                                                style={{
                                                    backgroundImage: `url(${expandContainerBg})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    marginTop: '-12px',
                                                    zIndex: 1,
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="w-full h-full flex items-end justify-center pb-[14px]">
                                                    {isDefault ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                                                            className="flex items-center gap-2 px-4 w-full justify-center opacity-80 hover:opacity-100 transition-opacity"
                                                        >
                                                            <img src={deleteIcon} alt="Remove" className="w-[18px] h-[18px] object-contain" />
                                                            <span className="text-[#FF3B30] text-[14px] font-medium">Remove Account</span>
                                                        </button>
                                                    ) : (
                                                        <div className="w-full flex items-center h-[24px]">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                                                                className="flex-1 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <img src={deleteIcon} alt="Remove" className="w-[18px] h-[18px] object-contain" />
                                                                <span className="text-[#FF3B30] text-[14px] font-medium">Remove Account</span>
                                                            </button>
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

                            {/* Count */}
                            <div className={`w-full flex items-center justify-center transition-all duration-300 ${isStacked ? 'absolute' : 'mt-2 pb-[100px]'}`}
                                style={isStacked ? {
                                    top: `${(sortedAccounts.length - 1) * 15 + 234 + 24}px`
                                } : {}}
                            >
                                <p className="text-white/60 text-[14px] font-satoshi">
                                    Accounts added: {accounts.length}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FAB */}
            <div
                id="fab-container"
                className={`fixed z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex items-center overflow-hidden ${contentBlurClass} ${tutorialStep > 0 ? 'pointer-events-none' : ''}`}
                style={{
                    bottom: "100px",
                    right: "20px",
                    height: "56px",
                    width: isFabExpanded ? "240px" : "56px", // Wider for "Add New Bank Account"
                    borderRadius: "999px",
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
                                        Add New Bank Account
                                    </span>
                                </div>
                            ) : (
                                <img src={fabPlus} alt="+" className="w-6 h-6 object-contain" />
                            )}
                        </div>
                    </div>
                </button>
            </div>

            {/* Bottom Nav */}
            <div className={contentBlurClass}>
                <BottomNavigation activeTab="cards" isHidden={confirmAction !== null} />
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmAction !== null}
                onClose={closeConfirmation}
                title={confirmAction === 'remove' ? "Remove Account?" : "Set as Default Account?"}
                description={
                    confirmAction === 'remove'
                        ? "Are you sure you want to remove this bank account?"
                        : "Are you sure you want to set this account as your Default? This will replace your current default account."
                }
                primaryButtonSrc={confirmAction === 'remove' ? buttonRemoveCard : buttonSetDefault}
                primaryText={confirmAction === 'remove' ? "Remove Account" : "Set as Default"}
                onPrimaryClick={() => {
                    if (confirmAction === 'remove' && selectedAccountId) {
                        // Find account to get last 4 digits
                        const accountToRemove = accounts.find(a => a.id === selectedAccountId);
                        const last4 = accountToRemove ? accountToRemove.accountNumber.slice(-4) : 'XXXX';

                        // Implementation for removal
                        removeBankAccount(selectedAccountId);

                        // Navigate to success page
                        closeConfirmation();
                        navigate("/bank-remove-success", { state: { last4 } });
                    } else if (confirmAction === 'default' && selectedAccountId) {
                        // Implementation for default
                        const updated = setDefaultBankAccount(selectedAccountId);
                        setAccounts(updated);
                        setIsStacked(updated.length > 0);
                        setSelectedAccountId(null);
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
                        <img src={popupCardIcon} alt="Success" className="w-8 h-8 mb-4 object-contain" />
                        <h2 className="text-white text-[18px] font-semibold mb-4">Bank Account Added Successfully</h2>
                        <div className="bg-black rounded-xl w-full px-[12px] py-[11px]">
                            <p className="text-white text-[14px] leading-relaxed text-left">
                                Your bank account has been saved successfully. You can now use this account for withdrawals and deposits.
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

export default Banking;
