import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { ChevronDown } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid } from 'recharts';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { formatFxAmount } from '@/utils/format';
import { CURRENCY_NAMES, CURRENCY_MAP, currencySymbols } from '@/constants/currencies';
import CardSkeleton from '@/components/skeletons/CardSkeleton';

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
                    <span className="flex items-center justify-center w-full h-full text-[18px]">
                      {CURRENCY_MAP[code]?.flag || '🏳'}
                    </span>
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
                  {CURRENCY_MAP[code]?.symbol || currencySymbols[code] || ''}
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
  const isSameCurrency = currentFrom === currentTo;

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
      setCurrencies(CURRENCY_NAMES);
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
        if (isSameCurrency) {
          setFxRate(1);
          setHistory([]);
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
          return;
        }
        const params = new URLSearchParams({
          from: currentFrom,
          to: currentTo,
        });
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fx-rates?${params.toString()}`;

        const response = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        });

        if (response.ok) {
          const data = await response.json();
          if (currentFrom === 'AED' || currentTo === 'AED') {
            console.debug('LiveRates AED raw response:', { url, data });
          }
          if (!data.rates) {
            throw new Error('Edge function response missing rates');
          }
          const crossRate = computeCrossRate(data, currentFrom, currentTo);
          if (crossRate !== null) {
            setFxRate(crossRate);
          } else {
            throw new Error(`Required rates not found: ${JSON.stringify(data)}`);
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
                    <span className="flex items-center justify-center w-full h-full text-[18px]">
                      {CURRENCY_MAP[currentFrom]?.flag || '🏳'}
                    </span>
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
                {CURRENCY_MAP[currentFrom]?.symbol || currencySymbols[currentFrom] || ''}
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
              disabled={isSameCurrency}
              className={`active:scale-90 transition-all border-none shadow-none bg-transparent outline-none ring-0 p-0 ${isSameCurrency ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <img loading="lazy"
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
                    <span className="flex items-center justify-center w-full h-full text-[18px]">
                      {CURRENCY_MAP[currentTo]?.flag || '🏳'}
                    </span>
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
                {CURRENCY_MAP[currentTo]?.symbol || currencySymbols[currentTo] || ''}
              </span>
              <span className={`text-[40px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {formatFxAmount(parseFloat(amount || '0') * fxRate)}
              </span>
            </div>
          </div>
        </div>
        {(history.length > 0 || isLoadingHistory) && (
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
                  <CardSkeleton height={180} />
                  <p className={`text-[12px] mt-4 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                    Fetching historical trends...
                  </p>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        )}
        {/* CTA */}
        <div className="mt-12 safe-bottom pb-4">
          {isSameCurrency && (
            <p className={`text-[14px] text-center mb-3 ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
              Please select different currencies to convert.
            </p>
          )}
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
            disabled={isSameCurrency}
            className={`w-full h-[48px] bg-primary rounded-full text-[16px] font-medium active:scale-95 transition-transform shadow-xl ${isDarkMode ? 'shadow-primary/20 text-white' : 'shadow-primary/30 text-white'} ${isSameCurrency ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Exchange Currency
          </button>
        </div>
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
    </div>
  );
};
export default LiveRates;
