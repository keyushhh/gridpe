import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";
import React, {  useState, useEffect, useRef  } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import BackButton from "@/components/ui/BackButton";
import { X, Eye, EyeOff } from "lucide-react";
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
    fetchBankAccounts,
    deleteBankAccount,
    setDefaultBankAccount as setSupabaseDefault,
    BankAccount
} from "@/lib/banking";
import { getBankLogo } from "@/utils/bankUtils";
import { useWebScroll } from "@/hooks/useWebScroll";

const Banking = () => {
  const { containerOverflow } = useWebScroll();
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useUser();
    const userId = profile?.id;
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isFabExpanded, setIsFabExpanded] = useState(false);
    const [isStacked, setIsStacked] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    const [tutorialStep, setTutorialStep] = useState(0);

    const [confirmAction, setConfirmAction] = useState<'remove' | 'default' | null>(null);

    const [visibleAccountIds, setVisibleAccountIds] = useState<Record<string, boolean>>({});

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    useEffect(() => {
        const loadAccounts = async () => {
            if (!userId) return;
            try {
                const data = await fetchBankAccounts(userId);
                setAccounts(data);
                setIsStacked(data.length > 1);

                if (location.state?.accountsAdded) {
                    setShowSuccessModal(true);
                    window.history.replaceState({}, document.title);
                }
            } catch (error) {
                console.error("Error loading bank accounts:", error);
            }
        };

        loadAccounts();

        const hasSeenTutorial = localStorage.getItem("gridpe_stack_tutorial_seen");
        if (!hasSeenTutorial && accounts.length > 1) {
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

    const formatAccountNumber = (num: string) => {
        return num.match(/.{1,4}/g)?.join(" ") || num;
    };

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
        if (a.is_default === b.is_default) return 0;
        return a.is_default ? -1 : 1;
    });

    const contentBlurClass = showSuccessModal || tutorialStep > 0 ? 'blur-sm brightness-50' : '';

    return (
        <div
            className={`h-full w-full ${containerOverflow} flex flex-col safe-area-top safe-area-bottom relative`}
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                willChange: 'transform',
                transform: 'translateZ(0)'
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

            <div className={`flex flex-col flex-1 transition-all duration-300 ${contentBlurClass} min-h-0 overflow-hidden`}>

                <div className="px-5 pt-4 flex items-center justify-between shrink-0 relative z-10">
                    <BackButton onClick={() => navigate("/settings")} />

                    <h1 className={`${isDarkMode ? 'text-foreground' : 'text-black'} text-[18px] font-semibold`}>Banking</h1>
                    <div className="w-10" />
                </div>

                <div 
                    className="px-5 mt-8 flex-1 overflow-y-auto overscroll-y-contain scrollbar-hide pb-[calc(120px+env(safe-area-inset-bottom))] min-h-0"
                    style={{ willChange: 'transform', WebkitOverflowScrolling: 'touch' }}
                >

                    {accounts.length === 0 ? (
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
                                <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium`}>Bank Accounts</h2>
                                <button
                                    onClick={() => navigate("/banking/add")}
                                    className="opacity-100 active:opacity-70 transition-opacity"
                                >
                                    <img src={addIcon} alt="Add" className="w-5 h-5" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                                </button>
                            </div>
                            <div className={`h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-[#E9EAEB]'} w-full mt-[15px] mb-[15px]`} />
                            <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px]`}>
                                You don’t have any bank accounts added yet.
                                <br />
                                Please add a bank account to proceed.
                            </p>
                        </div>
                    ) : (
                        <div className={`transition-all duration-500 ease-in-out ${isStacked ? 'mt-4 relative h-[320px] w-full mx-auto' : 'flex flex-col gap-4'}`}>
                            {sortedAccounts.map((account, index) => {
                                const isDefault = account.is_default;
                                const isSelected = selectedAccountId === account.id;

                                const accountHeightValue = isDefault ? 234 : 210;
                                const accountHeight = `${accountHeightValue}px`;

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
                                            {isDefault && (
                                                <div
                                                    className="absolute top-0 left-0 w-full h-[24px] flex items-center justify-center z-10"
                                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.64)' }}
                                                >
                                                    <span className="text-white text-[10px] font-medium uppercase tracking-wider">DEFAULT</span>
                                                </div>
                                            )}

                                            <div className={`absolute inset-0 px-[22px] flex flex-col justify-start ${isDefault ? 'pt-[44px] pb-[40px]' : 'pt-[20px] pb-[40px]'}`}>

                                                <div className="flex flex-col gap-[10px] w-full">

                                                    <div className="w-full">
                                                        <div className="flex items-center justify-between h-[22px]">
                                                            <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi leading-none">
                                                                Account Number
                                                            </p>
                                                            {/* Account Type Pill */}
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
                                                                    {account.account_type}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-[4px]">
                                                            <p className="text-white text-[18px] font-bold font-satoshi tracking-wider truncate">
                                                                {visibleAccountIds[account.id]
                                                                    ? formatAccountNumber(account.account_number)
                                                                    : account.account_number.slice(-4).padStart(account.account_number.length, '*')
                                                                }
                                                            </p>
                                                            <button
                                                                onClick={(e) => toggleAccountVisibility(account.id, e)}
                                                                className="text-white/60 hover:text-white transition-colors ml-2 shrink-0"
                                                            >
                                                                {visibleAccountIds[account.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Block 2: IFSC Code Section */}
                                                    <div className="w-full">
                                                        <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi mb-0.5">IFSC Code</p>
                                                        <p className="text-white text-[15px] font-medium font-satoshi">
                                                            {account.ifsc_code}
                                                        </p>
                                                    </div>

                                                    <div className="w-full flex items-end justify-between">
                                                        <div className="max-w-[70%]">
                                                            <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi mb-0.5">Branch</p>
                                                            <p className="text-white text-[14px] font-medium font-satoshi leading-tight truncate">
                                                                {account.branch_name}
                                                            </p>
                                                        </div>

                                                        <div className="w-[48px] h-[48px] flex items-center justify-end">
                                                            <img src={getBankLogo(account.bank_name)} alt="Bank" className="h-[32px] w-auto object-contain" />
                                                        </div>
                                                    </div>

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

                            <div className={`w-full flex items-center justify-center transition-all duration-300 ${isStacked ? 'absolute' : 'mt-2 pb-[40px]'}`}
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

            <div
                id="fab-container"
                className={`fixed z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex items-center overflow-hidden ${contentBlurClass} ${tutorialStep > 0 ? 'pointer-events-none' : ''}`}
                style={{
                    bottom: "120px",
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
                <BottomNavigation activeTab="" isHidden={confirmAction !== null} />
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
                onPrimaryClick={async () => {
                    if (confirmAction === 'remove' && selectedAccountId && userId) {
                        // Find account to get last 4 digits
                        const accountToRemove = accounts.find(a => a.id === selectedAccountId);
                        const last4 = accountToRemove?.account_number?.slice(-4) || 'XXXX';

                        // Implementation for removal
                        try {
                            await deleteBankAccount(selectedAccountId, userId);
                            setAccounts(prev => prev.filter(a => a.id !== selectedAccountId));
                            closeConfirmation();
                            navigate("/bank-remove-success", { state: { last4 } });
                        } catch (error) {
                            console.error("Error removing bank account:", error);
                        }
                    } else if (confirmAction === 'default' && selectedAccountId && userId) {
                        // Implementation for default
                        try {
                            const updatedAccount = await setSupabaseDefault(selectedAccountId, userId);
                            // Refresh accounts to reflect default change
                            const updatedList = await fetchBankAccounts(userId);
                            setAccounts(updatedList);
                            setIsStacked(updatedList.length > 0);
                            setSelectedAccountId(null);
                            closeConfirmation();
                        } catch (error) {
                            console.error("Error setting default bank account:", error);
                        }
                    }
                }}
                secondaryButtonSrc={buttonCancelWide}
                secondaryText="Cancel"
            />

            {/* Success Modal */}
            {
                showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6">
                        {/* Background blur overlay */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        {/* Popup Box – 362x199px, radius 13px */}
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
                            {/* Icon – 26x26, 22px from top */}
                            <div className="flex items-center justify-center" style={{ marginTop: '22px' }}>
                                <img
                                    src={isDarkMode ? popupCardIcon : cardLineIcon}
                                    alt="Success"
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
                                Bank Account Added Successfully
                            </h2>

                            {/* Inner Container – 318x73px, radius 16px, 24px below heading */}
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
                                    Your bank account has been saved successfully. You can now use this account for withdrawals and deposits.
                                </p>
                            </div>
                        </div>
                        <button
                        onClick={() => setShowSuccessModal(false)}
                        className={cn(
                            "relative z-10 mt-6 px-8 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden",
                            isDarkMode ? "glass-container glass-physics-clear grow-0" : "bg-black"
                        )}
                        style={{
                            '--glass-specular-intensity': '0.2'
                        } as any}
                    >
                        {isDarkMode && (
                            <>
                                <div className="glass-lens" />
                                <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                                <span className="glass-rim-v2" />
                            </>
                        )}
                        <X className="w-4 h-4 text-white relative z-10" />
                        <span className="text-white text-[14px] font-sans relative z-10">Close</span>
                    </button>
                    </div>
                )
            }

            {
                tutorialStep > 0 && (
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
                )
            }
        </div >
    );
};

export default Banking;



