import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import chartLineIcon from "@/assets/chart-line.svg";
import arrowSwapIcon from "@/assets/Arrow/Arrow_Down_Up.svg";
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
import { useUser } from "@/contexts/UserContext";

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

    if (!isOpen) return null;

    const filteredCurrencies = Object.entries(currencies).filter(([code, name]) =>
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#0A0A0A] rounded-t-[32px] overflow-hidden border-t border-white/10 flex flex-col max-h-[85vh]">
                {/* Fixed Header */}
                <div className="p-6 pb-4">
                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                    <h3 className="text-[20px] font-bold mb-4 px-2">Select Currency</h3>

                    {/* Search Bar */}
                    <div
                        className="relative h-[44px] w-full mb-2 rounded-full overflow-hidden border border-white/10"
                        style={{
                            backgroundImage: `url(${searchBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40">
                            <img src={searchIcon} alt="search" className="w-full h-full" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={type === 'from' ? "Which currency do you want to convert?" : "Which currency do you want to convert to?"}
                            className="w-full h-full bg-transparent pl-12 pr-4 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors"
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
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${current === code ? 'bg-[#5260FE]/10 border border-[#5260FE]' : 'bg-white/5 border border-white/5'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20">
                                        <img
                                            src={`https://flagcdn.com/w160/${currencyToCountry[code] || 'un'}.png`}
                                            alt={code}
                                            className="w-full h-full object-cover scale-150"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-[16px] leading-tight">{code}</div>
                                        <div className="text-[12px] text-white/40">{name}</div>
                                    </div>
                                </div>
                                <div className="text-[16px] font-bold text-white/80 pr-2">
                                    {currencySymbols[code] || ''}
                                </div>
                            </button>
                        ))}
                        {filteredCurrencies.length === 0 && (
                            <div className="py-12 text-center text-white/20">
                                No currencies found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FxExchange = () => {
    const navigate = useNavigate();
    const { walletBalance, walletTier } = useUser();
    const [amount, setAmount] = useState<number>(100);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('INR');
    const [currencies, setCurCurrencies] = useState<Record<string, string>>({});
    const [fxRate, setFxRate] = useState<number>(87.36);
    const [isSwapped, setIsSwapped] = useState(false);
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
    const [isSelectingFrom, setIsSelectingFrom] = useState(false);
    const [isSelectingTo, setIsSelectingTo] = useState(false);
    const [timer, setTimer] = useState(600); // 10 minutes in seconds

    // Fetch Currencies and Live Rate
    useEffect(() => {
        const init = async () => {
            try {
                // Fetch Currencies
                const cRes = await fetch('https://api.frankfurter.app/currencies');
                const cData = await cRes.json();
                setCurCurrencies(cData);

                // Fetch Initial Rate
                const rRes = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`);
                const rData = await rRes.json();
                if (rData.rates && rData.rates[toCurrency]) {
                    setFxRate(rData.rates[toCurrency]);
                }
            } catch (error) {
                console.error("Failed to fetch FX data:", error);
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
    return (
        <div
            className="h-screen text-white font-satoshi flex flex-col relative overflow-y-auto scroll-smooth"
            style={{
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0A0A0A'
            }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/home')}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 active:scale-90 transition-transform"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-[18px] font-bold">FX Exchange</h1>
                <button
                    onClick={() => navigate('/live-rates', { state: { from: currentFrom, to: currentTo } })}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 active:scale-90 transition-transform"
                >
                    <img src={chartLineIcon} alt="Chart" className="w-5 h-5" />
                </button>
            </div>

            <div className="px-5">
                {/* Conversion Cards Container */}
                <div className="relative flex flex-col gap-2">
                    {/* From Card */}
                    <div
                        className="bg-[#191919]/[0.31] rounded-[20px] p-6 border border-white/5 relative h-[120px] flex flex-col justify-center backdrop-blur-[25px]"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white/40 text-[14px] font-medium">Convert</span>
                            <button
                                onClick={() => setIsSelectingFrom(true)}
                                className="absolute top-[15px] right-[15px] w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 bg-[#1A1A1A] rounded-full border border-white/10 active:scale-95 transition-transform overflow-hidden"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ring-white ring-inset flex-shrink-0">
                                        <img src={`https://flagcdn.com/w160/${currencyToCountry[currentFrom] || 'un'}.png`} alt={currentFrom} className="w-full h-full object-cover scale-150" />
                                    </div>
                                    <span className="text-[12px] font-medium font-satoshi uppercase">{currentFrom}</span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-white/60" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[32px] font-medium text-white">{currentFrom === 'USD' ? '$' : currentFrom === 'EUR' ? '€' : currentFrom === 'GBP' ? '£' : ''}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="bg-transparent text-[40px] font-bold w-full outline-none focus:ring-0 placeholder:text-white/20"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <button
                            onClick={() => setIsSwapped(!isSwapped)}
                            className="active:scale-90 transition-all"
                        >
                            <img src={arrowSwapIcon} alt="Swap" className="w-10 h-10" />
                        </button>
                    </div>

                    {/* To Card */}
                    <div
                        className="bg-[#191919]/[0.31] rounded-[20px] p-6 border border-white/5 relative h-[120px] flex flex-col justify-center backdrop-blur-[25px]"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white/40 text-[14px] font-medium">To</span>
                            <button
                                onClick={() => setIsSelectingTo(true)}
                                className="absolute top-[15px] right-[15px] w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 bg-[#1A1A1A] rounded-full border border-white/10 active:scale-95 transition-transform overflow-hidden"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ring-white ring-inset flex-shrink-0">
                                        <img src={`https://flagcdn.com/w160/${currencyToCountry[currentTo] || 'un'}.png`} alt={currentTo} className="w-full h-full object-cover scale-150" />
                                    </div>
                                    <span className="text-[12px] font-medium font-satoshi uppercase">{currentTo}</span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-white/60" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[32px] font-medium text-white">{currentTo === 'INR' ? '₹' : currentTo === 'EUR' ? '€' : currentTo === 'GBP' ? '£' : ''}</span>
                            <span className="text-[40px] font-bold truncate">
                                {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className={`mt-[18px] bg-[#191919]/[0.31] border border-white/5 backdrop-blur-[25px] overflow-hidden transition-all duration-300 relative ${isBreakdownOpen ? 'h-[270px] rounded-[13px]' : 'h-[64px] rounded-[8px]'}`}>
                    {/* Header Section */}
                    <div className={`pt-[14px] px-[12px] flex justify-between items-start ${!isBreakdownOpen ? 'pb-[12px]' : ''}`}>
                        <div className="text-left">
                            <h4 className="text-[15px] font-medium font-satoshi leading-tight">Price Breakdown</h4>
                            <p className="text-[13px] text-white font-satoshi mt-[6px]">Incl. all taxes & charges</p>
                        </div>
                        <button
                            onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                            className="w-6 h-6 flex items-center justify-center absolute top-[12px] right-[12px] active:scale-95 transition-transform"
                        >
                            <img
                                src={chevronSmall}
                                alt="Toggle"
                                className={`w-6 h-6 transition-transform duration-300 ${isBreakdownOpen ? 'rotate-180' : 'rotate-0'}`}
                            />
                        </button>
                    </div>

                    <div className={`px-[12px] flex flex-col items-center transition-opacity duration-300 ${isBreakdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {/* First Divider */}
                        <div className="h-[1px] bg-[#202020] w-[338px] mt-[10px]" />

                        <div className="w-full mt-[10px] flex flex-col gap-0">
                            {/* Base Rate */}
                            <div className="flex justify-between items-center h-[18px]">
                                <span className="text-[13px] font-regular font-satoshi text-white">Base Rate</span>
                                <span className="text-[13px] font-bold font-satoshi">1 {currentFrom} = {currencySymbols[currentTo] || ''}{fxRate.toFixed(2)}</span>
                            </div>

                            {/* Amount Entered */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className="text-[13px] font-regular font-satoshi text-white">
                                    Amount Entered: {currencySymbols[currentFrom] || ''}{amount}
                                </span>
                                <span className="text-[13px] font-bold font-satoshi">
                                    {currencySymbols[currentTo] || ''}{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Markup/Spread */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className="text-[13px] font-regular font-satoshi text-white">Markup/Spread (0.60%)</span>
                                <span className="text-[13px] font-bold font-satoshi">
                                    - {currencySymbols[currentTo] || ''}{markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Explanation Title */}
                            <p className="text-[13px] font-regular font-satoshi text-white/50 leading-tight mt-[12px]">
                                Markup/Spread (0.60%) – This is Grid.Pe's margin on conversion, lower than airport kiosks.
                            </p>

                            {/* Flat Fee */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className="text-[13px] font-regular font-satoshi text-white">Flat Fee</span>
                                <span className="text-[13px] font-bold font-satoshi">
                                    - {currencySymbols[currentTo] || ''}{flatFee}
                                </span>
                            </div>
                        </div>

                        {/* Second Divider */}
                        <div className="h-[1px] bg-[#202020] w-[338px] mt-[8px]" />

                        {/* Final Amount */}
                        <div className="w-full mt-[8px] flex justify-between items-center h-[20px]">
                            <span className="text-[15px] font-medium font-satoshi text-white">Final Amount You'll Receive</span>
                            <span className="text-[13px] font-bold font-satoshi">
                                {currencySymbols[currentTo] || ''}{finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Wallet Section */}
                <div
                    className="mt-4 h-[101px] rounded-[20px] relative overflow-hidden"
                    style={{
                        backgroundImage: `url(${tierBackgrounds[walletTier] || walletStarterBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <span className="absolute top-[16px] left-[56px] text-[14px] font-bold font-satoshi text-white">
                        Wallet Balance
                    </span>

                    <span className="absolute top-[13px] right-[22px] text-[20px] font-bold font-satoshi text-white">
                        ₹{walletBalance.toLocaleString('en-IN')}
                    </span>

                    <p className="absolute left-[16px] top-[51px] text-[13px] font-regular font-satoshi text-white w-[85%] leading-tight">
                        {hasInsufficientFunds
                            ? "Note: Your wallet has insufficient funds for this transaction. Please add money to continue."
                            : "Note: Your wallet balance must cover the converted amount to proceed."}
                    </p>
                </div>
            </div>

            {/* Footer / CTA */}
            <div className="px-5 pb-[60px] mt-[24px] flex flex-col items-center gap-[18px]">
                <p className="text-[12px] text-white/60">
                    (Rate locked for <span className="text-[#5260FE] font-bold">{formatTime(timer)}</span>)
                </p>
                <button
                    className="w-full h-[48px] bg-[#5260FE] rounded-full text-[16px] font-bold active:scale-95 transition-transform shadow-xl shadow-[#5260FE]/20"
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
        </div>
    );
};

export default FxExchange;
