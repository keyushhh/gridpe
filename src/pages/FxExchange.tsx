import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import chartLineIcon from "@/assets/chart-line.svg";
import arrowSwapIcon from "@/assets/Arrow/Arrow_Down_Up.svg";
import arrowSwapIconLight from "@/assets/Arrow_Down_Up-light.svg";
import currencyIcon from "@/assets/currency.svg";
import diamondIcon from "@/assets/diamond.png";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import searchIcon from "@/assets/search.svg";
import searchBg from "@/assets/search-bg.png";
import chevronSmall from "@/assets/chevron-small.svg";
import walletStarterBg from "@/assets/fx-wallet-starter.png";
import walletProBg from "@/assets/fx-wallet-pro.png";
import walletEliteBg from "@/assets/fx-wallet-elite.png";
import walletSupremeBg from "@/assets/fx-wallet-supreme.png";
import walletStarterBgLight from "@/assets/light-cards/fx-wallet-starter-light.png";
import walletProBgLight from "@/assets/light-cards/fx-wallet-pro-light.png";
import walletEliteBgLight from "@/assets/light-cards/fx-wallet-elite-light.png";
import walletSupremeBgLight from "@/assets/light-cards/fx-wallet-supreme-light.png";
import iconPassport from "@/assets/icon-passport.png";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "next-themes";
import bgLight from "@/assets/bg-light.png";
import { formatINR } from "@/utils/format";
import { supabase } from "@/lib/supabase";

const currencyToCountry: Record<string, string> = {
    AUD: 'au', BRL: 'br', CAD: 'ca', CHF: 'ch', CNY: 'cn', CZK: 'cz', DKK: 'dk', EUR: 'eu',
    GBP: 'gb', HKD: 'hk', HUF: 'hu', IDR: 'id', ILS: 'il', INR: 'in', ISK: 'is', JPY: 'jp',
    KRW: 'kr', MXN: 'mx', MYR: 'my', NOK: 'no', NZD: 'nz', PHP: 'ph', PLN: 'pl', RON: 'ro',
    SEK: 'se', SGD: 'sg', THB: 'th', TRY: 'tr', USD: 'us', ZAR: 'za'
};

const currencySymbols: Record<string, string> = {
    AUD: '$', BRL: 'R$', CAD: '$', CHF: 'Fr', CNY: '¥', CZK: 'Kč', DKK: 'kr', EUR: '€',
    GBP: '£', HKD: '$', HUF: 'Ft', IDR: 'Rp', ILS: '₪', INR: '₹', ISK: 'kr', JPY: '¥',
    KRW: '₩', MXN: '$', MYR: 'RM', NOK: 'kr', NZD: '$', PHP: '₱', PLN: 'zł', RON: 'lei',
    SEK: 'kr', SGD: '$', THB: '฿', TRY: '₺', USD: '$', ZAR: 'R'
};

interface CurrencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
    current: string;
    currencies: Record<string, string>;
    type: 'from' | 'to';
}

const CurrencyModal = ({ isOpen, onClose, onSelect, current, currencies, type }: CurrencyModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";

    if (!isOpen) return null;

    const filteredCurrencies = Object.entries(currencies).filter(([code, name]) =>
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md ${isDarkMode ? "bg-[#0A0A0A]" : "bg-white"} rounded-t-[32px] overflow-hidden border-t ${isDarkMode ? "border-white/10" : "border-black/5"} flex flex-col max-h-[85vh]`}>
                {/* Fixed Header */}
                <div className="p-6 pb-4">
                    <div className={`w-12 h-1 ${isDarkMode ? "bg-white/20" : "bg-black/10"} rounded-full mx-auto mb-6`} />
                    <h3 className={`text-[20px] font-bold mb-4 px-2 ${isDarkMode ? "text-white" : "text-black"}`}>Select Currency</h3>

                    {/* Search Bar */}
                    <div
                        className={`relative h-[44px] w-full mb-2 rounded-full overflow-hidden border ${isDarkMode ? "border-white/10" : "border-black/5"}`}
                        style={{
                            backgroundImage: isDarkMode ? `url(${searchBg})` : 'none',
                            backgroundColor: isDarkMode ? 'transparent' : '#F5F5F7',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40">
                            <img src={searchIcon} alt="search" className={`w-full h-full ${!isDarkMode ? "invert" : ""}`} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={type === 'from' ? "Which currency do you want to convert?" : "Which currency do you want to convert to?"}
                            className={`w-full h-full bg-transparent pl-12 pr-4 text-[14px] ${isDarkMode ? "text-white placeholder:text-white/20" : "text-black placeholder:text-black/30"} outline-none transition-colors`}
                        />
                    </div>
                </div>

                {/* Scrolling List */}
                <div className="px-6 pb-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 gap-2">
                        {filteredCurrencies.map(([code, name]) => (
                            <button
                                key={code}
                                onClick={() => { onSelect(code); onClose(); setSearchQuery(''); }}
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${current === code
                                    ? (isDarkMode ? 'bg-[#5260FE]/10 border border-[#5260FE]' : 'bg-[#5260FE]/5 border border-[#5260FE]')
                                    : (isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-[#F2F2F7] border border-transparent')}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full overflow-hidden ring-1 ${isDarkMode ? "ring-white/20" : "ring-black/5"}`}>
                                        <img
                                            src={`https://flagcdn.com/w160/${currencyToCountry[code] || 'un'}.png`}
                                            alt={code}
                                            className="w-full h-full object-cover scale-150"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <div className={`font-bold text-[16px] leading-tight ${isDarkMode ? "text-white" : "text-black"}`}>{code}</div>
                                        <div className={`text-[12px] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{name}</div>
                                    </div>
                                </div>
                                <div className={`text-[16px] font-bold ${isDarkMode ? "text-white/80" : "text-black/80"} pr-2`}>
                                    {currencySymbols[code] || ''}
                                </div>
                            </button>
                        ))}
                        {filteredCurrencies.length === 0 && (
                            <div className={`py-12 text-center ${isDarkMode ? "text-white/20" : "text-black/20"}`}>
                                No currencies found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PassportUpgradeModal = ({ isOpen }: { isOpen: boolean }) => {
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 transition-all duration-500 animate-in fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <div className={`relative w-full max-w-sm ${isDarkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-[32px] p-8 shadow-2xl border ${isDarkMode ? "border-white/10" : "border-black/5"} flex flex-col items-center text-center transform transition-all duration-500 animate-in zoom-in-95`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? "bg-[#5260FE]/10" : "bg-[#5260FE]/5"}`}>
                    <img src={iconPassport} alt="Passport" className="w-10 h-10 object-contain" />
                </div>
                <h3 className={`text-[22px] font-bold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>Passport Upgrade Required</h3>
                <p className={`text-[15px] mb-8 leading-relaxed ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                    In compliance with international regulations, FX transactions require a valid Passport verification.
                </p>
                <div className="w-full space-y-3">
                    <button
                        onClick={() => navigate('/kyc-form?flow=fx_upgrade')}
                        className="w-full h-[52px] bg-[#5260FE] text-white rounded-full font-bold text-[16px] shadow-lg shadow-[#5260FE]/30 active:scale-95 transition-all"
                    >
                        Upgrade Now
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className={`w-full h-[52px] rounded-full font-medium text-[15px] active:scale-95 transition-all ${isDarkMode ? "text-white/40 border border-white/10" : "text-black/40 border border-black/5"}`}
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

const FxExchange = () => {
    const { profile, isPassportVerified, kycStatus } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const { walletTier, walletLimit, walletBalance } = useUser();
    const isWalletLimitReached = walletBalance >= walletLimit;

    // Initial State from navigation
    const { amount: initialAmount, from: initialFrom, to: initialTo } = location.state || {};

    const [amount, setAmount] = useState<number>(initialAmount || 1);
    const [fromCurrency, setFromCurrency] = useState(initialFrom || 'USD');
    const [toCurrency, setToCurrency] = useState(initialTo || 'INR');
    const [currencies, setCurCurrencies] = useState<Record<string, string>>({});
    const [fxRate, setFxRate] = useState<number>(87.36);
    const [isSwapped, setIsSwapped] = useState(false);
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
    const [isSelectingFrom, setIsSelectingFrom] = useState(false);
    const [isSelectingTo, setIsSelectingTo] = useState(false);
    const [timer, setTimer] = useState(600); // 10 minutes in seconds
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";

    // Fetch Currencies and Live Rate
    useEffect(() => {
        const init = async () => {
            try {
                // Fetch Currencies - Use static list as requested to avoid Frankfurter CORS
                const fallbackCurrencies = {
                    USD: "United States Dollar",
                    INR: "Indian Rupee",
                    EUR: "Euro",
                    GBP: "British Pound",
                    AED: "United Arab Emirates Dirham"
                };
                setCurCurrencies(fallbackCurrencies);

                // Fetch Initial Rate from secure Edge Function
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fx-rates?from=${fromCurrency}&to=${toCurrency}`, {
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.rates && data.rates[toCurrency]) {
                        setFxRate(data.rates[toCurrency]);
                    } else if (toCurrency === 'INR') {
                        setFxRate(83.45); // Fallback for INR
                    }
                } else {
                    throw new Error('Edge function returned error');
                }
            } catch (error) {
                console.error("Failed to fetch FX data:", error);
                if (toCurrency === 'INR') {
                    setFxRate(83.45);
                }
            }
        };
        init();
    }, [fromCurrency, toCurrency]);

    // Timer logic
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const markupPercent = 0.006;
    const flatFee = 150;

    const currentFrom = isSwapped ? toCurrency : fromCurrency;
    const currentTo = isSwapped ? fromCurrency : toCurrency;

    const convertedAmount = amount * fxRate;
    const markupAmount = convertedAmount * markupPercent;
    const finalAmount = convertedAmount - markupAmount - flatFee;

    const hasInsufficientFunds = walletBalance < finalAmount;

    const tierBackgrounds = {
        Starter: walletStarterBg,
        Pro: walletProBg,
        Elite: walletEliteBg,
        Supreme: walletSupremeBg
    };

    const tierBackgroundsLight = {
        Starter: walletStarterBgLight,
        Pro: walletProBgLight,
        Elite: walletEliteBgLight,
        Supreme: walletSupremeBgLight
    };
    return (
        <div
            className={`h-screen ${isDarkMode ? 'text-white' : 'text-black'} font-satoshi flex flex-col relative overflow-y-auto scroll-smooth no-scrollbar`}
            style={{
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : `none`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: isDarkMode ? '#0A0A0A' : '#FFFFFF'
            }}
        >
            {/* Light Mode Purple Glow Orb */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-[200px] h-[50px] rounded-full pointer-events-none z-0"
                    style={{
                        backgroundColor: "#5260FE",
                        filter: "blur(70px)",
                        opacity: 0.6,
                        mixBlendMode: "normal"
                    }}
                />
            )}
            {/* Header */}
            <div className="px-5 safe-top pt-4 pb-6 flex items-center justify-between">
                <BackButton onClick={() => navigate('/home')} />
                <h1 className="text-[18px] font-bold">FX Exchange</h1>
                <button
                    onClick={() => navigate('/live-rates', { state: { from: currentFrom, to: currentTo } })}
                    className={`w-10 h-10 rounded-full border ${isDarkMode ? "border-white/10 bg-white/5" : "border-[#E6E8EB] bg-black/5"} flex items-center justify-center active:scale-90 transition-transform`}
                >
                    <img src={chartLineIcon} alt="Chart" className={`w-5 h-5 ${!isDarkMode ? "invert" : ""}`} />
                </button>
            </div>

            <div className="px-5">
                {/* Conversion Cards Container */}
                <div className="relative flex flex-col gap-2">
                    {/* From Card */}
                    <div
                        className={`${isDarkMode ? "bg-[#191919]/[0.31] border-white/5" : "bg-white border-[#E6E8EB] shadow-sm"} rounded-[20px] p-6 border relative min-h-[120px] flex flex-col justify-center backdrop-blur-[25px]`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className={`${isDarkMode ? "text-white/40" : "text-black/40"} text-[14px] font-medium`}>Convert</span>
                            <button
                                onClick={() => setIsSelectingFrom(true)}
                                className={`absolute top-[15px] right-[15px] w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 ${isDarkMode ? "bg-[#1A1A1A] border-white/10" : "bg-white border-[#E6E8EB]"} rounded-full border active:scale-95 transition-transform overflow-hidden`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ${isDarkMode ? "ring-white" : "ring-black/20"} ring-inset flex-shrink-0`}>
                                        <img src={`https://flagcdn.com/w160/${currencyToCountry[currentFrom] || 'un'}.png`} alt={currentFrom} className="w-full h-full object-cover scale-150" />
                                    </div>
                                    <span className={`text-[12px] font-medium font-satoshi uppercase ${isDarkMode ? "text-white" : "text-black"}`}>{currentFrom}</span>
                                </div>
                                <ChevronDown className={`w-3 h-3 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[32px] font-medium ${isDarkMode ? "text-white" : "text-black"}`}>{currentFrom === 'USD' ? '$' : currentFrom === 'EUR' ? '€' : currentFrom === 'GBP' ? '£' : ''}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className={`bg-transparent text-[40px] font-bold w-full outline-none focus:ring-0 ${isDarkMode ? "text-white placeholder:text-white/20" : "text-black placeholder:text-black/20"}`}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <button
                            onClick={() => setIsSwapped(!isSwapped)}
                            className="active:scale-90 transition-all border-none shadow-none bg-transparent outline-none ring-0 p-0"
                        >
                            <img src={isDarkMode ? arrowSwapIcon : arrowSwapIconLight} alt="Swap" className="w-10 h-10 border-none outline-none shadow-none" />
                        </button>
                    </div>

                    {/* To Card */}
                    <div
                        className={`${isDarkMode ? "bg-[#191919]/[0.31] border-white/5" : "bg-white border-[#E6E8EB] shadow-sm"} rounded-[20px] p-6 border relative min-h-[120px] flex flex-col justify-center backdrop-blur-[25px]`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className={`${isDarkMode ? "text-white/40" : "text-black/40"} text-[14px] font-medium`}>To</span>
                            <button
                                onClick={() => setIsSelectingTo(true)}
                                className={`absolute top-[15px] right-[15px] w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 ${isDarkMode ? "bg-[#1A1A1A] border-white/10" : "bg-white border-[#E6E8EB]"} rounded-full border active:scale-95 transition-transform overflow-hidden`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ${isDarkMode ? "ring-white" : "ring-black/20"} ring-inset flex-shrink-0`}>
                                        <img src={`https://flagcdn.com/w160/${currencyToCountry[currentTo] || 'un'}.png`} alt={currentTo} className="w-full h-full object-cover scale-150" />
                                    </div>
                                    <span className={`text-[12px] font-medium font-satoshi uppercase ${isDarkMode ? "text-white" : "text-black"}`}>{currentTo}</span>
                                </div>
                                <ChevronDown className={`w-3 h-3 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[32px] font-medium ${isDarkMode ? "text-white" : "text-black"}`}>{currentTo === 'INR' ? '₹' : currentTo === 'EUR' ? '€' : currentTo === 'GBP' ? '£' : ''}</span>
                            <span className={`text-[40px] font-bold truncate ${isDarkMode ? "text-white" : "text-black"}`}>
                                {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className={`mt-[18px] ${isDarkMode ? "bg-[#191919]/[0.31] border-white/5" : "bg-white border-[#E6E8EB] shadow-sm"} border backdrop-blur-[25px] overflow-hidden transition-all duration-300 relative ${isBreakdownOpen ? 'min-h-[270px] rounded-[13px]' : 'min-h-[64px] rounded-[8px]'}`}>
                    {/* Header Section */}
                    <div className={`pt-[14px] px-[12px] flex justify-between items-start ${!isBreakdownOpen ? 'pb-[12px]' : ''}`}>
                        <div className="text-left">
                            <h4 className={`text-[15px] font-medium font-satoshi leading-tight ${isDarkMode ? "text-white" : "text-black"}`}>Price Breakdown</h4>
                            <p className={`text-[13px] font-satoshi mt-[6px] ${isDarkMode ? "text-white" : "text-black font-medium"}`}>Incl. all taxes & charges</p>
                        </div>
                        <button
                            onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                            className="w-6 h-6 flex items-center justify-center absolute top-[12px] right-[12px] active:scale-95 transition-transform"
                        >
                            <img
                                src={chevronSmall}
                                alt="Toggle"
                                className={`w-6 h-6 transition-transform duration-300 ${isBreakdownOpen ? 'rotate-180' : 'rotate-0'} ${!isDarkMode ? "invert" : ""}`}
                            />
                        </button>
                    </div>

                    <div className={`px-[12px] flex flex-col items-center transition-opacity duration-300 ${isBreakdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {/* First Divider */}
                        <div className={`h-[1px] ${isDarkMode ? "bg-[#202020]" : "bg-[#E6E8EB]"} w-[338px] mt-[10px]`} />

                        <div className="w-full mt-[10px] flex flex-col gap-0 text-[13px] font-satoshi">
                            {/* Base Rate */}
                            <div className="flex justify-between items-center h-[18px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Base Rate</span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>1 {currentFrom} = {currencySymbols[currentTo] || ''}{fxRate.toFixed(2)}</span>
                            </div>

                            {/* Amount Entered */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>
                                    Amount Entered: {currencySymbols[currentFrom] || ''}{amount}
                                </span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {currencySymbols[currentTo] || ''}{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Markup/Spread */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Markup/Spread (0.60%)</span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    - {currencySymbols[currentTo] || ''}{markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Explanation Title */}
                            <p className={`text-[13px] font-regular leading-tight mt-[12px] ${isDarkMode ? "text-white/50" : "text-black"}`}>
                                Markup/Spread (0.60%) – This is Grid.Pe's margin on conversion, lower than airport kiosks.
                            </p>

                            {/* Flat Fee */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Flat Fee</span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    - {currencySymbols[currentTo] || ''}{flatFee}
                                </span>
                            </div>
                        </div>

                        {/* Second Divider */}
                        <div className={`h-[1px] ${isDarkMode ? "bg-[#202020]" : "bg-[#E6E8EB]"} w-[338px] mt-[8px]`} />

                        {/* Final Amount */}
                        <div className="w-full mt-[8px] flex justify-between items-center h-[20px]">
                            <span className={`text-[15px] font-medium font-satoshi ${isDarkMode ? "text-white" : "text-black"}`}>Final Amount You'll Receive</span>
                            <span className={`text-[13px] font-bold font-satoshi ${isDarkMode ? "text-white" : "text-black"}`}>
                                {currencySymbols[currentTo] || ''}{finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Wallet Section */}
                <div
                    className={`${!isDarkMode ? "border border-[#E6E8EB]" : ""} mt-4 min-h-[101px] rounded-[20px] relative overflow-hidden`}
                    style={{
                        backgroundImage: `url(${isDarkMode ? (tierBackgrounds[walletTier] || walletStarterBg) : (tierBackgroundsLight[walletTier] || walletStarterBgLight)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <span className={`absolute top-[16px] left-[56px] text-[14px] font-bold font-satoshi ${isDarkMode ? "text-white" : "text-black"}`}>
                        Wallet Balance
                    </span>

                    <span className={`absolute top-[13px] right-[22px] text-[20px] font-bold font-satoshi ${isDarkMode ? "text-white" : "text-black"}`}>
                        {formatINR(walletBalance)}
                    </span>

                    <p className={`absolute left-[16px] top-[51px] text-[13px] font-regular font-satoshi w-[85%] leading-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                        {hasInsufficientFunds
                            ? "Note: Your wallet has insufficient funds for this transaction. Please add money to continue."
                            : "Note: Your wallet balance must cover the converted amount to proceed."}
                    </p>

                </div>
            </div>

            {/* Footer / CTA */}
            <div className="px-5 safe-bottom pb-4 mt-auto flex flex-col items-center gap-[18px]">
                <p className={`text-[12px] ${isDarkMode ? "text-white/60" : "text-black"}`}>
                    (Rate locked for <span className="text-[#5260FE] font-bold">{formatTime(timer)}</span>)
                </p>
                <button
                    className={`w-full h-[48px] bg-[#5260FE] rounded-full text-[16px] font-medium active:scale-95 transition-transform shadow-xl ${isDarkMode ? "shadow-[#5260FE]/20 text-white" : "shadow-[#5260FE]/30 text-white"} disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={false}
                    onClick={() => {
                        if (hasInsufficientFunds) {
                            navigate('/wallet-add-money');
                        } else {
                            navigate('/fx-exchange-summary', {
                                state: {
                                    amount: amount,
                                    fxRate: fxRate,
                                    fromCurrency: currentFrom,
                                    toCurrency: currentTo,
                                    convertedAmount: convertedAmount,
                                    markupAmount: markupAmount,
                                    flatFee: flatFee,
                                    finalAmount: finalAmount,
                                    markupPercent: markupPercent,
                                    currencySymbols: currencySymbols
                                }
                            });
                        }
                    }}
                >
                    {hasInsufficientFunds ? "Add Money to Wallet" : "Proceed to Order"}
                </button>

            </div>

            {/* Modals */}
            <CurrencyModal
                isOpen={isSelectingFrom}
                onClose={() => setIsSelectingFrom(false)}
                onSelect={(code) => isSwapped ? setToCurrency(code) : setFromCurrency(code)}
                current={currentFrom}
                currencies={currencies}
                type="from"
            />
            <CurrencyModal
                isOpen={isSelectingTo}
                onClose={() => setIsSelectingTo(false)}
                onSelect={(code) => isSwapped ? setFromCurrency(code) : setToCurrency(code)}
                current={currentTo}
                currencies={currencies}
                type="to"
            />
            <PassportUpgradeModal 
                isOpen={kycStatus === 'verified' && !isPassportVerified} 
            />
        </div>
    );
};

export default FxExchange;
