import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import pillContainerBg from "@/assets/pill-container-bg.png";
import backspaceIcon from "@/assets/backspace.png";
import backspaceIconLight from "@/assets/backspace.png";
import { Button } from "@/components/ui/button";
import emptyCheckboxIcon from "@/assets/empty-checkbox.svg";
import checkedCheckboxIcon from "@/assets/check-box-selected.png";
import cancelCta from "@/assets/cancel-cta.png";

import starterWithdraw from "@/assets/starter-withdraw.png";
import proWithdraw from "@/assets/pro-withdraw.png";
import eliteWithdraw from "@/assets/elite-withdraw.png";
import supremeWithdraw from "@/assets/supreme-withdraw.png";

import starterWithdrawLight from "@/assets/light-cards/starter-withdraw-light.png";
import proWithdrawLight from "@/assets/light-cards/pro-withdraw-light.png";
import eliteWithdrawLight from "@/assets/light-cards/elite-withdraw-light.png";
import supremeWithdrawLight from "@/assets/light-cards/supreme-withdraw-light.png";

const tierWithdrawMap = {
    'Starter': starterWithdraw,
    'Pro': proWithdraw,
    'Elite': eliteWithdraw,
    'Supreme': supremeWithdraw
};

const tierWithdrawMapLight = {
    'Starter': starterWithdrawLight,
    'Pro': proWithdrawLight,
    'Elite': eliteWithdrawLight,
    'Supreme': supremeWithdrawLight
};

const USER_ID = "414c977e-6f70-4f57-bfa1-af0a8a2053a4";

interface Withdrawal {
    id: string;
    amount: number;
    status: string;
    created_at: string;
}

const WalletWithdraw = () => {
    const navigate = useNavigate();
    const { walletTier } = useUser();
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';

    const [amount, setAmount] = useState<string>("0.00");
    const [showKeypad, setShowKeypad] = useState<boolean>(false);
    const [withdrawFull, setWithdrawFull] = useState<boolean>(false);

    // Backend Integration State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

    const withdrawalLimits: Record<string, number> = {
        'Starter': 3000,
        'Pro': 10000,
        'Elite': 50000,
        'Supreme': walletBalance
    };
    const currentLimit = withdrawalLimits[walletTier] || 3000;

    const fetchData = async () => {
        // Fetch wallets
        const { data: walletData } = await supabase
            .from("wallets")
            .select("available_balance, held_balance")
            .eq("user_id", USER_ID)
            .single();

        if (walletData) {
            setWalletBalance(walletData.available_balance || 0);
        }

        // Fetch wallet_transactions (as specified by task requirements)
        await supabase
            .from("wallet_transactions")
            .select("*")
            .eq("user_id", USER_ID);

        // Fetch withdrawals history
        const { data: wData } = await supabase
            .from("withdrawals")
            .select("*")
            .eq("user_id", USER_ID)
            .order("created_at", { ascending: false });

        if (wData) {
            setWithdrawals(wData);
        }
    };

    useEffect(() => {
        fetchData();

        const channel = supabase.channel('wallet-withdraw-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${USER_ID}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${USER_ID}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${USER_ID}` }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleKeyPress = (key: string) => {
        setAmount((prev) => {
            if (prev === "0.00") return key === "." ? "0." : key;
            if (key === "." && prev.includes(".")) return prev;
            if (prev.includes(".")) {
                const [, decimal] = prev.split(".");
                if (decimal && decimal.length >= 2) return prev;
            }
            return prev + key;
        });
        if (withdrawFull) setWithdrawFull(false);
        setError(null);
    };

    const handleBackspace = () => {
        setAmount((prev) => {
            if (prev.length <= 1) return "0.00";
            if (prev === "0.00") return "0.00";
            return prev.slice(0, -1);
        });
        if (withdrawFull) setWithdrawFull(false);
        setError(null);
    };

    const handlePillClick = (val: string) => {
        setAmount(val);
        if (withdrawFull) setWithdrawFull(false);
        setError(null);
    };

    const KeypadButton = ({ label, onClick, icon }: { label?: string; onClick?: () => void; icon?: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`w-[113px] h-[65px] rounded-xl flex items-center justify-center transition-colors group bg-black active:bg-[#5260FE]`}
            disabled={loading}
        >
            {icon ? (
                <div className="group-active:brightness-200">
                    <div className="brightness-0 invert">{icon}</div>
                </div>
            ) : (
                <span className="text-white group-active:text-white font-bold font-sans text-[32px]">{label}</span>
            )}
        </button>
    );

    const isZero = amount === "0.00";
    const amountVal = parseFloat(amount);
    const canWithdraw = amountVal > 0 && amountVal <= Math.min(walletBalance, currentLimit) && walletBalance > 0 && !loading;

    const handleWithdraw = () => {
        if (!canWithdraw) return;
        navigate('/select-payment-method', { state: { amount: amountVal } });
    };

    const isWalletLocked = walletBalance > 0 && amountVal > walletBalance;

    return (
        <div
            className={`h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom ${isDarkMode ? '' : 'bg-white'}`}
            style={isDarkMode ? {
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            } : {}}
        >
            {!isDarkMode && (
                <div
                    className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
                    style={{ backgroundColor: "#5260FE", filter: "blur(60px)", opacity: 0.8 }}
                />
            )}

            {/* Header */}
            <div className="px-5 pt-12 flex items-center justify-between z-10 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/10' : 'bg-[#F5F5F5] border border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans`}>
                    Withdraw
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar" onClick={() => setShowKeypad(false)}>
                {/* Banner Section */}
                <div className="px-5 mt-[39px] z-10 shrink-0">
                    <div
                        className={`w-full h-[120px] rounded-[18px] flex flex-col justify-start pt-6 px-6 relative overflow-hidden ${isDarkMode ? '' : 'border border-[#E9EAEB]'}`}
                        style={{
                            backgroundImage: `url(${isDarkMode ? tierWithdrawMap[walletTier as keyof typeof tierWithdrawMap] : tierWithdrawMapLight[walletTier as keyof typeof tierWithdrawMap]})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans`}>
                            WALLET BALANCE
                        </span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[34px] font-bold font-sans mt-[10px]`}>
                            ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center pt-[32px] z-10 shrink-0">
                    <div
                        onClick={(e) => { e.stopPropagation(); setShowKeypad(true); }}
                        className={`flex items-center justify-center transition-opacity duration-200 cursor-pointer ${isZero ? 'opacity-50' : 'opacity-100'}`}
                    >
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[32px] font-normal font-sans mr-1`}>₹</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[32px] font-bold font-sans`}>{amount}</span>
                    </div>

                    <div className={`w-[238px] h-[1px] mt-[4.5px] ${isDarkMode ? 'bg-[#373737]' : 'bg-[#E9EAEB]'}`} />

                    <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[12px] font-sans font-normal mt-[8px]`}>
                        Total Available Balance ₹ {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>

                    {error && (
                        <p className={`text-[#FF3B30] text-[12px] font-medium font-sans mt-[8px] max-w-[80%] text-center`}>
                            {error}
                        </p>
                    )}

                    <div className="flex gap-4 mt-[17px]">
                        {["500", "1000", "5000"].map((val) => (
                            <button
                                key={val}
                                onClick={(e) => { e.stopPropagation(); handlePillClick(val); }}
                                className="relative h-[30px] flex items-center justify-center px-3 py-[6px] transition-transform active:scale-95 disabled:opacity-50"
                                disabled={parseFloat(val) > walletBalance || parseFloat(val) > currentLimit}
                            >
                                <div
                                    className="absolute inset-0 w-full h-full"
                                    style={isDarkMode ? { backgroundImage: `url(${pillContainerBg})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" } : { backgroundColor: '#000000', borderRadius: '15px' }}
                                />
                                <span className={`relative z-10 text-white text-[12px] font-medium font-sans`}>
                                    ₹{val}
                                </span>
                            </button>
                        ))}
                    </div>

                    {!showKeypad && (
                        <>
                            <div className="w-full flex flex-col items-center mt-[23px]">
                                <div
                                    className={`flex items-center gap-2 ${walletTier === 'Supreme' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    onClick={() => {
                                        if (walletTier === 'Supreme') {
                                            const newVal = !withdrawFull;
                                            setWithdrawFull(newVal);
                                            if (newVal) setAmount(walletBalance.toFixed(2));
                                            setError(null);
                                        }
                                    }}
                                >
                                    <img
                                        src={withdrawFull ? checkedCheckboxIcon : emptyCheckboxIcon}
                                        alt=""
                                        className="w-5 h-5"
                                        style={(!withdrawFull && !isDarkMode) ? { filter: 'invert(1)' } : (walletTier !== 'Supreme' ? { filter: 'brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(6%) hue-rotate(188deg) brightness(97%) contrast(89%)' } : {})}
                                    />
                                    <span className={`${walletTier === 'Supreme' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-[#767676]'} text-[14px] font-medium font-sans`}>Withdraw full wallet balance</span>
                                </div>
                            </div>

                            {walletTier !== 'Supreme' && (
                                <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-normal font-sans mt-[11px] leading-snug text-center w-[360px]`}>
                                    Your current wallet plan does not allow you to withdraw your full wallet balance.
                                </p>
                            )}

                            <div className={`relative mt-[24px] mx-auto w-[362px] rounded-[13px] overflow-hidden ${isDarkMode ? '' : 'border border-[#E9EAEB]'}`}>
                                {isDarkMode && (
                                    <div
                                        className="absolute inset-0 rounded-[13px] pointer-events-none"
                                        style={{ padding: '0.63px', background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(0,0,0,0.20))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor' }}
                                    />
                                )}
                                <div
                                    className={`w-full h-full px-[12px] py-[8px] flex flex-col ${isDarkMode ? 'backdrop-blur-[25.02px]' : ''}`}
                                    style={{ backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'transparent' }}
                                >
                                    <h3 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Please note:</h3>
                                    <div className="flex flex-col gap-[10px] mt-[14px]">
                                        {[
                                            "Withdrawals take up to 30 minutes to reflect in your account.",
                                            "The amount will be sent to your linked payment method only.",
                                            "You can’t add money again for the next 24 hours after a withdrawal."
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex gap-[10px]">
                                                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] leading-tight mt-1`}>•</span>
                                                <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-snug text-left`}>
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>


                        </>
                    )}
                </div>
            </div>

            {/* Keypad Section */}
            <div
                className={`w-full relative rounded-t-[32px] overflow-hidden shrink-0 ${isDarkMode ? '' : 'bg-[#FAFAFA] border-t border-[#E9EAEB]'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {isDarkMode && (
                    <div
                        className="absolute inset-0 rounded-t-[32px] pointer-events-none"
                        style={{ padding: '0.63px', background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(0,0,0,0.20))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor' }}
                    />
                )}
                <div
                    className="w-full h-full p-[20px] pb-[40px] backdrop-blur-[25px]"
                    style={{ backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 0.31)' : 'transparent' }}
                >
                    <div className="flex flex-col gap-[10px] items-center relative z-10">
                        {showKeypad && (
                            <>
                                <div className="flex gap-[10px]">
                                    <KeypadButton label="1" onClick={() => handleKeyPress("1")} />
                                    <KeypadButton label="2" onClick={() => handleKeyPress("2")} />
                                    <KeypadButton label="3" onClick={() => handleKeyPress("3")} />
                                </div>
                                <div className="flex gap-[10px]">
                                    <KeypadButton label="4" onClick={() => handleKeyPress("4")} />
                                    <KeypadButton label="5" onClick={() => handleKeyPress("5")} />
                                    <KeypadButton label="6" onClick={() => handleKeyPress("6")} />
                                </div>
                                <div className="flex gap-[10px]">
                                    <KeypadButton label="7" onClick={() => handleKeyPress("7")} />
                                    <KeypadButton label="8" onClick={() => handleKeyPress("8")} />
                                    <KeypadButton label="9" onClick={() => handleKeyPress("9")} />
                                </div>
                                <div className="flex gap-[10px]">
                                    <KeypadButton label="." onClick={() => handleKeyPress(".")} />
                                    <KeypadButton label="0" onClick={() => handleKeyPress("0")} />
                                    <KeypadButton
                                        onClick={handleBackspace}
                                        icon={<img src={isDarkMode ? backspaceIcon : backspaceIconLight} alt="Backspace" className={`w-[18px] h-[18px] object-contain ${isDarkMode ? '' : 'brightness-0'}`} />}
                                    />
                                </div>
                            </>
                        )}

                        <div className={`w-full flex flex-col gap-[10px] ${showKeypad ? 'mt-[32px]' : 'mt-0'}`}>
                            <Button
                                onClick={handleWithdraw}
                                disabled={!canWithdraw}
                                className={`w-full h-[48px] text-white rounded-full text-[16px] font-medium font-sans ${canWithdraw
                                    ? "bg-[#5260FE] hover:bg-[#5260FE]/90"
                                    : (isDarkMode ? "bg-[#5260FE]/50 cursor-not-allowed" : "bg-black/30 cursor-not-allowed")
                                    }`}
                            >
                                {loading ? "Processing..." : isWalletLocked ? "Insufficient Balance" : isZero ? "Enter Amount" : "Proceed"}
                            </Button>
                            <button
                                onClick={() => navigate(-1)}
                                className={`w-full h-[48px] rounded-full ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium active:scale-95 transition-transform flex items-center justify-center ${isDarkMode ? '' : 'bg-[#F2F2F2] border border-[#E9EAEB]'}`}
                                style={isDarkMode ? { backgroundImage: `url(${cancelCta})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : {}}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletWithdraw;
