import { ASSETS } from '@/constants/assets';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { useUser } from '@/contexts/UserContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { formatINR, formatFxAmount } from '@/utils/format';
import { CURRENCY_NAMES, CURRENCY_MAP, currencySymbols } from '@/constants/currencies';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  current: string;
  currencies: Record<string, string>;
  type: 'from' | 'to';
}
const CurrencyModal = ({
  isOpen,
  onClose,
  onSelect,
  current,
  currencies,
  type,
}: CurrencyModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isDarkMode = useIsDarkMode();
  if (!isOpen) return null;
  const filteredCurrencies = Object.entries(currencies).filter(
    ([code, name]) =>
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-md rounded-t-[32px] overflow-hidden border-t ${isDarkMode ? 'border-t-solid' : 'bg-background border-border'} flex flex-col max-h-[85vh]`}
        style={isDarkMode ? {
          backgroundColor: 'rgba(25, 25, 25, 0.31)',
          borderTopColor: 'rgba(255, 255, 255, 0.12)',
          borderTopWidth: '0.63px',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
        } : undefined}
      >
        {/* Fixed Header */}
        <div className="p-6 pb-4">
          <div
            className={`w-12 h-1 ${isDarkMode ? 'bg-white/20' : 'bg-black/10'} rounded-full mx-auto mb-6`}
          />
          <h3
            className={`text-[20px] font-bold mb-4 px-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Select Currency
          </h3>
          {/* Search Bar */}
          <div
            className={`relative h-[44px] w-full mb-2 rounded-full overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-border'}`}
            style={{
              backgroundImage: isDarkMode ? `url(${ASSETS.SEARCH_BG})` : 'none',
              backgroundColor: isDarkMode ? 'transparent' : 'hsl(var(--muted))',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40">
              <img
                src={ASSETS.SEARCH}
                alt="search"
                className={`w-full h-full ${!isDarkMode ? 'invert' : ''}`}
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                type === 'from'
                  ? 'Which currency do you want to convert?'
                  : 'Which currency do you want to convert to?'
              }
              className={`w-full h-full bg-transparent pl-12 pr-4 text-[14px] ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/30'} outline-none transition-colors`}
            />
          </div>
        </div>
        {/* Scrolling List */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-2">
            {filteredCurrencies.map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  onSelect(code);
                  onClose();
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  current === code
                    ? isDarkMode
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-primary/5 border border-primary'
                    : isDarkMode
                      ? 'bg-white/5 border border-white/5'
                      : 'bg-muted/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full overflow-hidden ring-1 ${isDarkMode ? 'ring-white/20' : 'ring-black/5'}`}
                  >
                    <span className="flex items-center justify-center w-full h-full text-[18px]">
                      {CURRENCY_MAP[code]?.flag || '🏳'}
                    </span>
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-bold text-[16px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      {code}
                    </div>
                    <div
                      className={`text-[12px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                    >
                      {name}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-[16px] font-bold ${isDarkMode ? 'text-white/80' : 'text-black/80'} pr-2`}
                >
                  {CURRENCY_MAP[code]?.symbol || currencySymbols[code] || ''}
                </div>
              </button>
            ))}
            {filteredCurrencies.length === 0 && (
              <div
                className={`py-12 text-center ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}
              >
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
  const isDarkMode = useIsDarkMode();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 transition-all duration-500 animate-in fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className={`relative w-full max-w-sm ${isDarkMode ? 'bg-neutral-900' : 'bg-background'} rounded-[32px] p-8 shadow-2xl border ${isDarkMode ? 'border-white/10' : 'border-border'} flex flex-col items-center text-center transform transition-all duration-500 animate-in zoom-in-95`}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-primary/10' : 'bg-primary/5'}`}
        >
          <img src={ASSETS.ICON_PASSPORT} alt="Passport" className="w-10 h-10 object-contain" />
        </div>
        <h3 className={`text-[22px] font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Passport Upgrade Required
        </h3>
        <p
          className={`text-[15px] mb-8 leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}
        >
          In compliance with international regulations, FX transactions require a valid Passport
          verification.
        </p>
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate(ROUTES.KYC_FORM + '?flow=fx_upgrade')}
            className="w-full h-[52px] bg-primary text-white rounded-full font-bold text-[16px] shadow-lg shadow-primary/30 active:scale-95 transition-all"
          >
            Upgrade Now
          </button>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className={`w-full h-[52px] rounded-full font-medium text-[15px] active:scale-95 transition-all ${isDarkMode ? 'text-white/40 border border-white/10' : 'text-black/40 border border-border'}`}
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
  // NOTE: No isSwapped flag — swap button directly swaps fromCurrency/toCurrency
  // which triggers the rate-fetch effect automatically.
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
  const [isSelectingFrom, setIsSelectingFrom] = useState(false);
  const [isSelectingTo, setIsSelectingTo] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const isDarkMode = useIsDarkMode();

  const [inputValue, setInputValue] = useState<string>((initialAmount || 1).toString());
  const isSameCurrency = fromCurrency === toCurrency;

  const handleSelectFromCurrency = (code: string) => {
    if (code === currentTo) {
      setFromCurrency(code);
      setToCurrency(currentFrom);
      return;
    }
    setFromCurrency(code);
  };

  const handleSelectToCurrency = (code: string) => {
    if (code === currentFrom) {
      setToCurrency(code);
      setFromCurrency(currentTo);
      return;
    }
    setToCurrency(code);
  };

  const computeCrossRate = (data: any, from: string, to: string): number | null => {
    if (from === to) return 1;
    const rates = data.rates ?? {};
    const base = (data.base as string) || 'USD';
    const fromRate = rates[from];
    const toRate = rates[to];

    if (typeof toRate === 'number' && typeof fromRate === 'number') {
      return toRate / fromRate;
    }
    if (base === from && typeof toRate === 'number') {
      return toRate;
    }
    if (base === to && typeof fromRate === 'number') {
      return 1 / fromRate;
    }
    if (base === 'USD') {
      if (typeof toRate === 'number' && typeof fromRate === 'number') {
        return toRate / fromRate;
      }
      if (from === 'USD' && typeof toRate === 'number') {
        return toRate;
      }
      if (to === 'USD' && typeof fromRate === 'number') {
        return 1 / fromRate;
      }
    }
    return null;
  };

  const handleAmountChange = (val: string) => {
    // Only allow numbers and one decimal point
    let cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Strip leading zeros if followed by other digits
    if (/^0[0-9]/.test(cleaned)) {
      cleaned = cleaned.replace(/^0+/, '');
      if (cleaned === '') cleaned = '0';
    }

    setInputValue(cleaned);

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
  };

  // Sync state if updated externally
  useEffect(() => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) && amount === 0) {
      return;
    }
    if (parsed !== amount) {
      setInputValue(amount.toString());
    }
  }, [amount]);
  // Fetch Currencies and Live Rate
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch Currencies - Use static list as requested to avoid Frankfurter CORS
        setCurCurrencies(CURRENCY_NAMES);

        if (isSameCurrency) {
          setFxRate(1);
          return;
        }

        const params = new URLSearchParams({
          from: fromCurrency,
          to: toCurrency,
        });
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fx-rates?${params.toString()}`;

        const response = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });
        if (!response.ok) {
          throw new Error(`Edge function returned error status: ${response.status}`);
        }

        const data = await response.json();
        if (fromCurrency === 'AED' || toCurrency === 'AED') {
          console.debug('FX AED raw response:', { url, data });
        }

        if (!data.rates) {
          throw new Error('Edge function response missing rates object');
        }

        const crossRate = computeCrossRate(data, fromCurrency, toCurrency);
        if (crossRate !== null) {
          setFxRate(crossRate);
        } else {
          throw new Error(`Required rates not found in response: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        console.error('Failed to fetch FX data:', error);
        toast.error('Failed to fetch live exchange rates. Using fallback rates.');
        if (isSameCurrency) {
          setFxRate(1);
        } else if (fromCurrency === 'USD' && toCurrency === 'INR') {
          setFxRate(83.45);
        } else if (fromCurrency === 'INR' && toCurrency === 'USD') {
          setFxRate(1 / 83.45);
        } else if (toCurrency === 'INR') {
          setFxRate(83.45);
        } else if (fromCurrency === 'INR') {
          setFxRate(1 / 83.45);
        } else {
          setFxRate(1.0);
        }
      }
    };
    init();
  }, [fromCurrency, toCurrency, isSameCurrency]);
  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const markupPercent = 0.006;
  const FLAT_FEE_INR = 150; // Flat fee is always ₹150
  const currentFrom = fromCurrency;
  const currentTo = toCurrency;

  // Core conversion: amount in FROM currency → amount in TO currency
  const convertedAmount = amount * fxRate;
  const markupAmount = convertedAmount * markupPercent;

  // Convert the flat fee (₹150) into the TO-currency so it can be
  // subtracted from the converted output consistently.
  const flatFeeInToCurrency = (() => {
    if (currentTo === 'INR') return FLAT_FEE_INR;
    if (currentFrom === 'INR') return FLAT_FEE_INR * fxRate;
    // Neither side is INR — approximate via the rate (fee is small)
    // Edge function always returns FROM→TO, so we can't easily get INR rate.
    // Use a reasonable fallback: ₹150 ≈ $1.75 when USD≈86
    return FLAT_FEE_INR / 86;
  })();

  const rawFinalAmount = convertedAmount - markupAmount - flatFeeInToCurrency;
  // Guard: never show a negative final amount
  const isBelowMinimum = rawFinalAmount <= 0;
  const finalAmount = isBelowMinimum ? 0 : rawFinalAmount;
  const hasInsufficientFunds = walletBalance < finalAmount;
  const tierBackgrounds = {
    Starter: ASSETS.FX_WALLET_STARTER,
    Pro: ASSETS.FX_WALLET_PRO,
    Elite: ASSETS.FX_WALLET_ELITE,
    Supreme: ASSETS.FX_WALLET_SUPREME,
  };
  const tierBackgroundsLight = {
    Starter: ASSETS.FX_WALLET_STARTER_LIGHT,
    Pro: ASSETS.FX_WALLET_PRO_LIGHT,
    Elite: ASSETS.FX_WALLET_ELITE_LIGHT,
    Supreme: ASSETS.FX_WALLET_SUPREME_LIGHT,
  };
  return (
    <div
      className={`h-screen ${isDarkMode ? 'text-white' : 'text-black'} font-satoshi flex flex-col relative overflow-y-auto scroll-smooth no-scrollbar bg-background`}
      style={{
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : `none`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light Mode Purple Glow Orb */}
      {!isDarkMode && (
        <div
          className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-[200px] h-[50px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            filter: 'blur(70px)',
            opacity: 0.6,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="px-5 safe-top pt-4 pb-6 flex items-center justify-between">
        <BackButton onClick={() => navigate(ROUTES.HOME)} />
        <h1 className="text-[18px] font-bold">FX Exchange</h1>
        <button
          onClick={() =>
            navigate(ROUTES.LIVE_RATES, { state: { from: currentFrom, to: currentTo } })
          }
          className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-border bg-black/5'} flex items-center justify-center active:scale-90 transition-transform`}
        >
          <img
            src={ASSETS.CHART_LINE}
            alt="Chart"
            className={`w-5 h-5 ${!isDarkMode ? 'invert' : ''}`}
          />
        </button>
      </div>
      <div className="px-5">
        {/* Conversion Cards Container */}
        <div className="relative flex flex-col gap-2">
          {/* From Card */}
          <div
            className={`${isDarkMode ? 'border-solid' : 'bg-background border-border shadow-sm'} rounded-[20px] p-6 border relative min-h-[120px] flex flex-col justify-center backdrop-blur-[25px]`}
            style={isDarkMode ? {
              backgroundColor: 'rgba(25, 25, 25, 0.31)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: '0.63px',
            } : undefined}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[14px] font-medium`}
              >
                Convert
              </span>
              <button
                onClick={() => setIsSelectingFrom(true)}
                className={`absolute top-[15px] right-[15px] w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 rounded-full border active:scale-95 transition-transform overflow-hidden ${
                  isDarkMode
                    ? 'text-white border-solid'
                    : 'text-black bg-black/5 border-black/10'
                }`}
                style={isDarkMode ? {
                  backgroundColor: 'rgba(25, 25, 25, 0.31)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderWidth: '0.63px',
                } : undefined}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ${isDarkMode ? 'ring-white/20' : 'ring-black/10'} ring-inset flex-shrink-0`}
                  >
                    <span className="flex items-center justify-center w-full h-full text-[18px]">
                      {CURRENCY_MAP[currentFrom]?.flag || '🏳'}
                    </span>
                  </div>
                  <span
                    className={`text-[12px] font-bold font-satoshi uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {currentFrom}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 ${isDarkMode ? 'text-white' : 'text-black'}`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[32px] font-medium ${isDarkMode ? 'text-white' : 'text-black'} font-satoshi`}
              >
                {CURRENCY_MAP[currentFrom]?.symbol || currencySymbols[currentFrom] || ''}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={e => handleAmountChange(e.target.value)}
                className={`bg-transparent text-[40px] font-bold w-full outline-none focus:ring-0 ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/20'} font-satoshi fx-convert-input`}
                placeholder="0"
              />
            </div>
          </div>
          {/* Swap Button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <button
              onClick={() => {
                const prevFrom = fromCurrency;
                const prevTo = toCurrency;
                setFromCurrency(prevTo);
                setToCurrency(prevFrom);
              }}
              disabled={isSameCurrency}
              className={`active:scale-90 transition-all border-none shadow-none bg-transparent outline-none ring-0 p-0 ${isSameCurrency ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <img
                src={isDarkMode ? ASSETS.ARROW_DOWN_UP : ASSETS.ARROW_DOWN_UP_LIGHT}
                alt="Swap"
                className="w-10 h-10 border-none outline-none shadow-none"
              />
            </button>
          </div>
          {/* To Card */}
          <div
            className={`${isDarkMode ? 'border-solid' : 'bg-background border-border shadow-sm'} rounded-[20px] p-6 border relative min-h-[120px] flex flex-col justify-center backdrop-blur-[25px]`}
            style={isDarkMode ? {
              backgroundColor: 'rgba(25, 25, 25, 0.31)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: '0.63px',
            } : undefined}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[14px] font-medium`}
              >
                To
              </span>
              <button
                onClick={() => setIsSelectingTo(true)}
                className={`absolute top-[15px] right-[15px] w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 rounded-full border active:scale-95 transition-transform overflow-hidden ${
                  isDarkMode
                    ? 'text-white border-solid'
                    : 'text-black bg-black/5 border-black/10'
                }`}
                style={isDarkMode ? {
                  backgroundColor: 'rgba(25, 25, 25, 0.31)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  borderWidth: '0.63px',
                } : undefined}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ${isDarkMode ? 'ring-white/20' : 'ring-black/10'} ring-inset flex-shrink-0`}
                  >
                    <span className="flex items-center justify-center w-full h-full text-[18px]">
                      {CURRENCY_MAP[currentTo]?.flag || '🏳'}
                    </span>
                  </div>
                  <span
                    className={`text-[12px] font-bold font-satoshi uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {currentTo}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 ${isDarkMode ? 'text-white' : 'text-black'}`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[32px] font-medium ${isDarkMode ? 'text-white' : 'text-black'} font-satoshi`}
              >
                {CURRENCY_MAP[currentTo]?.symbol || currencySymbols[currentTo] || ''}
              </span>
              <span
                className={`text-[40px] font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'} font-satoshi`}
              >
                {formatFxAmount(convertedAmount)}
              </span>
            </div>
          </div>
        </div>
        {/* Price Breakdown */}
        <div
          className={`mt-[18px] ${isDarkMode ? 'border-solid' : 'bg-background border-border shadow-sm'} border backdrop-blur-[25px] overflow-hidden transition-all duration-300 relative ${isBreakdownOpen ? 'min-h-[270px] rounded-[13px]' : 'min-h-[64px] rounded-[8px]'}`}
          style={isDarkMode ? {
            backgroundColor: 'rgba(25, 25, 25, 0.31)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: '0.63px',
          } : undefined}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .fx-convert-input {
              font-size: 40px !important;
              font-weight: 700 !important;
              font-family: 'Satoshi', sans-serif !important;
            }
          `}} />
          {/* Header Section */}
          <div
            className={`pt-[14px] px-[12px] flex justify-between items-start ${!isBreakdownOpen ? 'pb-[12px]' : ''}`}
          >
            <div className="text-left">
              <h4
                className={`text-[15px] font-medium font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Price Breakdown
              </h4>
              <p
                className={`text-[13px] font-satoshi mt-[6px] ${isDarkMode ? 'text-white' : 'text-black font-medium'}`}
              >
                Incl. all taxes & charges
              </p>
            </div>
            <button
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="w-6 h-6 flex items-center justify-center absolute top-[12px] right-[12px] active:scale-95 transition-transform"
            >
              <img
                src={ASSETS.CHEVRON_SMALL}
                alt="Toggle"
                className={`w-6 h-6 transition-transform duration-300 ${isBreakdownOpen ? 'rotate-180' : 'rotate-0'} ${!isDarkMode ? 'invert' : ''}`}
              />
            </button>
          </div>
          <div
            className={`px-[12px] flex flex-col items-center transition-opacity duration-300 ${isBreakdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {/* First Divider */}
            <div className={`h-[1px] bg-border w-[338px] mt-[10px]`} />
            <div className="w-full mt-[10px] flex flex-col gap-0 text-[13px] font-satoshi">
              {/* Base Rate */}
              <div className="flex justify-between items-center h-[18px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>Base Rate</span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  1 {currentFrom} = {CURRENCY_MAP[currentTo]?.symbol || currencySymbols[currentTo] || ''}
                  {formatFxAmount(fxRate)}
                </span>
              </div>
              {/* Amount Entered */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Amount Entered: {CURRENCY_MAP[currentFrom]?.symbol || currencySymbols[currentFrom] || ''}
                  {amount}
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {CURRENCY_MAP[currentTo]?.symbol || currencySymbols[currentTo] || ''}
                  {formatFxAmount(convertedAmount)}
                </span>
              </div>
              {/* Markup/Spread */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Markup/Spread (0.60%)
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  - {CURRENCY_MAP[currentTo]?.symbol || currencySymbols[currentTo] || ''}
                  {markupAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {/* Explanation Title */}
              <p
                className={`text-[13px] font-regular leading-tight mt-[12px] ${isDarkMode ? 'text-white/50' : 'text-black'}`}
              >
                Markup/Spread (0.60%) – This is Grid.Pe's margin on conversion, lower than airport
                kiosks.
              </p>
              {/* Flat Fee */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>Flat Fee</span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {CURRENCY_MAP[currentTo]?.symbol || currencySymbols[currentTo] || ''}
                  {flatFeeInToCurrency < 1 ? flatFeeInToCurrency.toFixed(4) : flatFeeInToCurrency.toFixed(2)}
                </span>
              </div>
            </div>
            {/* Second Divider */}
            <div className={`h-[1px] bg-border w-[338px] mt-[8px]`} />
            {/* Final Amount */}
            <div className="w-full mt-[8px] flex justify-between items-center h-[20px]">
              <span
                className={`text-[15px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Final Amount You'll Receive
              </span>
              <span
                className={`text-[13px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {isBelowMinimum ? (
                  <span className="text-destructive">Amount too low</span>
                ) : (
                  <>
                    {CURRENCY_MAP[currentTo]?.symbol || currencySymbols[currentTo] || ''}
                    {formatFxAmount(finalAmount)}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
        {/* Wallet Section */}
        <div
          className={`${!isDarkMode ? 'border border-border' : ''} mt-4 min-h-[101px] rounded-[20px] relative overflow-hidden`}
          style={{
            backgroundImage: `url(${isDarkMode ? tierBackgrounds[walletTier] || ASSETS.FX_WALLET_STARTER : tierBackgroundsLight[walletTier] || ASSETS.FX_WALLET_STARTER_LIGHT})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span
            className={`absolute top-[16px] left-[56px] text-[14px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Wallet Balance
          </span>
          <span
            className={`absolute top-[13px] right-[22px] text-[20px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {formatINR(walletBalance)}
          </span>
          <p
            className={`absolute left-[16px] top-[51px] text-[13px] font-regular font-satoshi w-[85%] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {hasInsufficientFunds
              ? 'Note: Your wallet has insufficient funds for this transaction. Please add money to continue.'
              : 'Note: Your wallet balance must cover the converted amount to proceed.'}
          </p>
        </div>
      </div>
      {/* Footer / CTA */}
      <div className="px-5 safe-bottom pb-4 mt-auto flex flex-col items-center gap-[18px]">
        <p className={`text-[12px] ${isDarkMode ? 'text-white/60' : 'text-black'}`}>
          (Rate locked for <span className="text-primary font-bold">{formatTime(timer)}</span>)
        </p>
        {isSameCurrency && (
          <p className={`text-[14px] text-center ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
            Please select different currencies to convert.
          </p>
        )}
        <button
          className={`w-full h-[48px] bg-primary rounded-full text-[16px] font-medium active:scale-95 transition-transform shadow-xl ${isDarkMode ? 'shadow-primary/20 text-white' : 'shadow-primary/30 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isBelowMinimum || isSameCurrency}
          onClick={() => {
            if (hasInsufficientFunds) {
              navigate(ROUTES.WALLET_ADD_MONEY);
            } else {
              navigate(ROUTES.FX_EXCHANGE_SUMMARY, {
                state: {
                  amount: amount,
                  fxRate: fxRate,
                  fromCurrency: currentFrom,
                  toCurrency: currentTo,
                  convertedAmount: convertedAmount,
                  markupAmount: markupAmount,
                  flatFee: flatFeeInToCurrency,
                  finalAmount: finalAmount,
                  markupPercent: markupPercent,
                  currencySymbols: currencySymbols,
                },
              });
            }
          }}
        >
          {hasInsufficientFunds ? 'Add Money to Wallet' : 'Proceed to Order'}
        </button>
      </div>
      {/* Modals */}
      <CurrencyModal
        isOpen={isSelectingFrom}
        onClose={() => setIsSelectingFrom(false)}
        onSelect={handleSelectFromCurrency}
        current={currentFrom}
        currencies={currencies}
        type="from"
      />
      <CurrencyModal
        isOpen={isSelectingTo}
        onClose={() => setIsSelectingTo(false)}
        onSelect={handleSelectToCurrency}
        current={currentTo}
        currencies={currencies}
        type="to"
      />
      <PassportUpgradeModal isOpen={kycStatus === 'verified' && !isPassportVerified} />
    </div>
  );
};
export default FxExchange;
