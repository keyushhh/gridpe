import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { ChevronDown } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BaseListSkeleton from '@/components/skeletons/BaseListSkeleton';
const currencyToCountry: Record<string, string> = {
  USD: 'us',
  INR: 'in',
  EUR: 'eu',
  GBP: 'gb',
  JPY: 'jp',
  AUD: 'au',
  CAD: 'ca',
  CHF: 'ch',
  CNY: 'cn',
  AED: 'ae',
  SAR: 'sa',
};
const currencySymbols: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  CNY: '¥',
  AED: 'د.إ',
  SAR: 'ر.س',
};
const CurrencyModal = ({
  isOpen,
  onClose,
  onSelect,
  current,
  currencies,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  current: string;
  currencies: Record<string, string>;
  type: 'from' | 'to';
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isDarkMode = useIsDarkMode();
  if (!isOpen) return null;
  const filteredCurrencies = Object.entries(currencies).filter(
    ([code, name]) =>
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg ${isDarkMode ? 'bg-background border-white/10' : 'bg-background border-border'} rounded-t-[32px] sm:rounded-[32px] border flex flex-col h-[80vh] overflow-hidden`}
      >
        <div className="p-6 pb-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Select Currency ({type === 'from' ? 'Sell' : 'Buy'})
            </h2>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
            >
              <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
          </div>
          <div
            className={`relative h-[44px] w-full mb-2 rounded-full overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-border'}`}
            style={{
              backgroundImage: isDarkMode ? `url('/src/assets/search-bg.png')` : 'none',
              backgroundSize: 'cover',
              backgroundColor: isDarkMode ? 'transparent' : 'hsl(var(--muted))',
            }}
          >
            <input
              type="text"
              placeholder={`Search ${type === 'from' ? 'base' : 'target'} currency`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full h-full bg-transparent px-5 outline-none text-[14px] ${isDarkMode ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'}`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-1">
            {filteredCurrencies.map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  onSelect(code);
                  onClose();
                }}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${current === code ? (isDarkMode ? 'bg-primary/20 border border-primary/50' : 'bg-primary/10 border border-primary/30') : isDarkMode ? 'hover:bg-white/5 border border-transparent' : 'hover:bg-black/5 border border-transparent'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
                    <img
                      src={`https://flagcdn.com/w160/${currencyToCountry[code] || 'un'}.png`}
                      alt={code}
                      className="w-full h-full object-cover scale-150"
                    />
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-bold text-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}
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
                <span
                  className={`text-[16px] font-bold ${current === code ? 'text-primary' : 'text-white/40'}`}
                >
                  {currencySymbols[code] || ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface HistoryPoint {
  date: string;
  rate: number;
}

const LiveRates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const initialFrom = location.state?.from || 'USD';
  const initialTo = location.state?.to || 'INR';
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState<string>('1');
  const [fxRate, setFxRate] = useState<number>(0);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [activeRange, setActiveRange] = useState('1M');
  const [timestamp, setTimestamp] = useState('');
  // NOTE: No isSwapped flag — swap button directly swaps currencies
  const [isSelectingFrom, setIsSelectingFrom] = useState(false);
  const [isSelectingTo, setIsSelectingTo] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const currentFrom = fromCurrency;
  const currentTo = toCurrency;
  const isTrendingUp = history.length > 1 ? history[history.length - 1].rate >= history[0].rate : true;
  const chartColor = isTrendingUp ? '#22C55E' : '#EF4444';
  const ranges = ['1D', '5D', '1M', '1Y', '5Y', 'Max'];
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Strip leading zeros if followed by other digits (e.g. "05" -> "5", but keep "0" and "0.")
    if (/^0[0-9]/.test(val)) {
      val = val.replace(/^0+/, '');
    }
    
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };
  useEffect(() => {
    const fetchCurrencies = async () => {
      // Use static list as requested to avoid Frankfurter CORS
      const fallbackCurrencies = {
        USD: 'United States Dollar',
        INR: 'Indian Rupee',
        EUR: 'Euro',
        GBP: 'British Pound',
        AED: 'United Arab Emirates Dirham',
      };
      setCurrencies(fallbackCurrencies);
    };
    fetchCurrencies();
  }, []);
  const fetchHistoricalData = async (from: string, to: string, range: string) => {
    try {
      setIsLoadingHistory(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      switch (range) {
        case '1D':
          startDate.setDate(startDate.getDate() - 2);
          break; // 2 days for trend
        case '5D':
          startDate.setDate(startDate.getDate() - 5);
          break;
        case '1M':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '1Y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case '5Y':
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
        case 'Max':
          startDate.setFullYear(2000, 0, 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }
      const startDateStr = startDate.toISOString().split('T')[0];
      const response = await fetch(
        `https://api.frankfurter.dev/v1/${startDateStr}..${endDate}?base=${from}&symbols=${to}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.rates) {
          const formattedHistory = Object.entries(data.rates).map(
            ([date, rates]) => ({
              date,
              rate: (rates as Record<string, number>)[to],
            })
          );
          setHistory(formattedHistory);
        }
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Build the edge-function URL the same way as FxExchange
        let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fx-rates`;
        if (currentFrom === 'USD') {
          url += `?from=USD&to=${currentTo}`;
        } else if (currentTo === 'USD') {
          url += `?from=USD&to=${currentFrom}`;
        } else {
          url += `?from=USD`;
        }

        const response = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            if (currentFrom === 'USD' && data.rates[currentTo]) {
              setFxRate(data.rates[currentTo]);
            } else if (currentTo === 'USD' && data.rates[currentFrom]) {
              setFxRate(1 / data.rates[currentFrom]);
            } else if (data.rates[currentTo] && data.rates[currentFrom]) {
              setFxRate(data.rates[currentTo] / data.rates[currentFrom]);
            } else if (currentTo === 'INR') {
              setFxRate(83.45);
            } else if (currentFrom === 'INR') {
              setFxRate(1 / 83.45);
            } else {
              throw new Error('Required rates not found');
            }
          } else {
            throw new Error('Edge function response missing rates');
          }
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short',
          };
          setTimestamp(now.toLocaleDateString('en-GB', options).replace(',', ''));
        } else {
          throw new Error('Edge function error');
        }
        // Fetch real historical data from Frankfurter API
        fetchHistoricalData(currentFrom, currentTo, activeRange);
      } catch (err) {
        console.error('Error fetching rates:', err);
        if (currentFrom === 'INR') {
          setFxRate(1 / 83.45);
        } else if (currentTo === 'INR') {
          setFxRate(83.45);
        } else {
          setFxRate(1.0);
        }
        setHistory([]);
      }
    };
    fetchRates();
  }, [currentFrom, currentTo, activeRange]);
  const getYTickValues = () => {
    if (history.length === 0) return [];
    const rates = history.map(h => h.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    if (min === max) {
      return [min * 0.98, min * 0.99, min, min * 1.01, min * 1.02];
    }
    const range = max - min;
    const step = range / 4;
    return [min, min + step, min + 2 * step, min + 3 * step, max];
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
      <style dangerouslySetInnerHTML={{ __html: `
        .fx-convert-input {
          font-size: 40px !important;
          font-weight: 700 !important;
          font-family: 'Satoshi', sans-serif !important;
        }
      `}} />
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
      <div className="px-5 safe-top pt-4 pb-2 flex items-center justify-between">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-[18px] font-bold">Live Rates</h1>
        <div className="w-10" />
      </div>
      {/* Timestamp */}
      <div className="text-center mb-8">
        <p
          className={`${isDarkMode ? 'text-muted-foreground' : 'text-black/50 font-medium'} text-[14px]`}
        >
          {timestamp || '18 Aug, 10:40 am UTC'}
        </p>
      </div>
      <div className="px-5">
        {/* Conversion Cards Container */}
        <div className="relative flex flex-col gap-2">
          {/* From Card */}
          <div
            className={`${isDarkMode ? 'border-solid' : 'bg-background border-border'} rounded-[20px] p-6 border relative h-[120px] flex flex-col justify-center backdrop-blur-[25px]`}
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
                className={`w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 rounded-full border active:scale-95 transition-transform ${
                  isDarkMode 
                    ? 'border-solid text-white' 
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
                    className={`w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ${isDarkMode ? 'ring-white/20' : 'ring-black/10'}`}
                  >
                    <img
                      src={`https://flagcdn.com/w160/${currencyToCountry[currentFrom]}.png`}
                      alt={currentFrom}
                      className="w-full h-full object-cover scale-150"
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {currentFrom}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 ${isDarkMode ? 'text-white' : 'text-black'}`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 leading-tight">
              <span
                className={`text-[32px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {currencySymbols[currentFrom] || ''}
              </span>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className={`fx-convert-input bg-transparent outline-none border-none w-full ${isDarkMode ? 'text-white' : 'text-black'}`}
                inputMode="decimal"
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
              className="active:scale-90 transition-all border-none shadow-none bg-transparent outline-none ring-0 p-0"
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
            className={`${isDarkMode ? 'border-solid' : 'bg-background border-border'} rounded-[20px] p-6 border relative h-[120px] flex flex-col justify-center backdrop-blur-[25px]`}
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
                className={`w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 rounded-full border active:scale-95 transition-transform ${
                  isDarkMode 
                    ? 'border-solid text-white' 
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
                    className={`w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ${isDarkMode ? 'ring-white/20' : 'ring-black/10'}`}
                  >
                    <img
                      src={`https://flagcdn.com/w160/${currencyToCountry[currentTo]}.png`}
                      alt={currentTo}
                      className="w-full h-full object-cover scale-150"
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {currentTo}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 ${isDarkMode ? 'text-white' : 'text-black'}`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 leading-tight">
              <span
                className={`text-[32px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {currencySymbols[currentTo] || ''}
              </span>
              <span className={`text-[40px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {(parseFloat(amount || '0') * fxRate).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
        {/* Graph Container */}
        <div
          className={`mt-[18px] ${isDarkMode ? 'border-solid' : 'bg-background border-border'} rounded-[13px] border pt-[17px] backdrop-blur-[25px] h-[277px] flex flex-col relative overflow-hidden`}
          style={isDarkMode ? {
            backgroundColor: 'rgba(25, 25, 25, 0.31)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: '0.63px',
          } : undefined}
        >
          {/* Range Selector */}
          <div className="flex justify-between items-center mb-6 relative ml-[14px] mr-[13px]">
            {ranges.map(range => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`text-[13px] font-medium w-[37px] h-[37px] flex items-center justify-center rounded-full transition-all relative z-10 ${activeRange === range ? 'text-white bg-primary' : isDarkMode ? 'text-white/40' : 'text-black/40'}`}
              >
                <span className="relative z-20">{range}</span>
              </button>
            ))}
          </div>
          {/* Chart */}
          <div className="flex-1 w-full relative">
            {isLoadingHistory ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <BaseListSkeleton rows={5} />
                <p className={`text-[12px] mt-4 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                  Fetching historical trends...
                </p>
              </div>
            ) : history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 13, left: 14, bottom: 24 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'hsl(var(--border))'}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                    dy={15}
                    ticks={
                      history.length > 2
                        ? [
                            history[Math.floor(history.length * 0.25)].date,
                            history[history.length - 1].date,
                          ]
                        : []
                    }
                    tickFormatter={val => {
                      const d = new Date(val);
                      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    }}
                  />
                  <YAxis
                    orientation="left"
                    domain={['dataMin', 'dataMax']}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                    width={30}
                    dx={0}
                    ticks={getYTickValues()}
                    tickFormatter={val => val < 0.1 ? val.toFixed(4) : val < 1 ? val.toFixed(3) : val.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={
                      isDarkMode
                        ? {
                            backgroundColor: 'rgba(25, 25, 25, 0.31)',
                            border: '0.63px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#FFFFFF',
                            backdropFilter: 'blur(25px)',
                            WebkitBackdropFilter: 'blur(25px)',
                          }
                        : {
                            backgroundColor: '#FFFFFF',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#000000',
                          }
                    }
                    itemStyle={{ color: chartColor }}
                    labelClassName="hidden"
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke={chartColor}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                    strokeWidth={2}
                    animationDuration={1100}
                    animationEasing="ease-in-out"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div
                  className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
                >
                  <svg
                    className={`w-6 h-6 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p
                  className={`text-[14px] font-medium leading-snug ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}
                >
                  Historical Data Temporarily Unavailable
                </p>
                <p className={`text-[12px] mt-1 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                  We're updating our secure data feeds. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
        {/* CTA */}
        <div className="mt-12 safe-bottom pb-4">
          <button
            onClick={() =>
              navigate(ROUTES.FX_EXCHANGE, {
                state: {
                  amount: parseFloat(amount || '1'),
                  from: currentFrom,
                  to: currentTo,
                },
              })
            }
            className={`w-full h-[48px] bg-primary rounded-full text-[16px] font-medium active:scale-95 transition-transform shadow-xl ${isDarkMode ? 'shadow-primary/20 text-white' : 'shadow-primary/30 text-white'}`}
          >
            Exchange Currency
          </button>
        </div>
      </div>
      {/* Modals */}
      <CurrencyModal
        isOpen={isSelectingFrom}
        onClose={() => setIsSelectingFrom(false)}
        onSelect={code => setFromCurrency(code)}
        current={currentFrom}
        currencies={currencies}
        type="from"
      />
      <CurrencyModal
        isOpen={isSelectingTo}
        onClose={() => setIsSelectingTo(false)}
        onSelect={code => setToCurrency(code)}
        current={currentTo}
        currencies={currencies}
        type="to"
      />
    </div>
  );
};
export default LiveRates;
