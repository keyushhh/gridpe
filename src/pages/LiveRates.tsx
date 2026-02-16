import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, CartesianGrid } from "recharts";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import ArrowDownUp from "@/assets/Arrow/Arrow_Down_Up.svg";
import activeRangeBg from "@/assets/active-range.png";

const currencyToCountry: Record<string, string> = {
    USD: 'us', INR: 'in', EUR: 'eu', GBP: 'gb', JPY: 'jp', AUD: 'au', CAD: 'ca', CHF: 'ch', CNY: 'cn', AED: 'ae', SAR: 'sa'
};

const currencySymbols: Record<string, string> = {
    USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr', CNY: '¥', AED: 'د.إ', SAR: 'ر.س'
};

const CurrencyModal = ({ isOpen, onClose, onSelect, current, currencies, type }: {
    isOpen: boolean; onClose: () => void; onSelect: (code: string) => void;
    current: string; currencies: Record<string, string>; type: 'from' | 'to'
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    if (!isOpen) return null;

    const filteredCurrencies = Object.entries(currencies).filter(([code, name]) =>
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#0A0A0A] rounded-t-[32px] sm:rounded-[32px] border border-white/10 flex flex-col h-[80vh] overflow-hidden">
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[20px] font-bold">Select Currency ({type === 'from' ? 'Sell' : 'Buy'})</h2>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>

                    <div
                        className="relative h-[44px] w-full mb-2 rounded-full overflow-hidden border border-white/10"
                        style={{ backgroundImage: `url('/src/assets/search-bg.png')`, backgroundSize: 'cover' }}
                    >
                        <input
                            type="text"
                            placeholder={`Search ${type === 'from' ? 'base' : 'target'} currency`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full bg-transparent px-5 outline-none text-[14px] placeholder:text-white/40"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-1">
                        {filteredCurrencies.map(([code, name]) => (
                            <button
                                key={code}
                                onClick={() => { onSelect(code); onClose(); }}
                                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${current === code ? 'bg-[#5260FE]/20 border border-[#5260FE]/50' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
                                        <img src={`https://flagcdn.com/w160/${currencyToCountry[code] || 'un'}.png`} alt={code} className="w-full h-full object-cover scale-150" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-[16px]">{code}</div>
                                        <div className="text-[12px] text-white/40">{name}</div>
                                    </div>
                                </div>
                                <span className={`text-[16px] font-bold ${current === code ? 'text-[#5260FE]' : 'text-white/40'}`}>
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

const LiveRates = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialFrom = location.state?.from || 'USD';
    const initialTo = location.state?.to || 'INR';

    const [fromCurrency, setFromCurrency] = useState(initialFrom);
    const [toCurrency, setToCurrency] = useState(initialTo);
    const [currencies, setCurrencies] = useState<Record<string, string>>({});
    const [fxRate, setFxRate] = useState<number>(0);
    const [history, setHistory] = useState<any[]>([]);
    const [activeRange, setActiveRange] = useState('1M');
    const [timestamp, setTimestamp] = useState("");
    const [isSwapped, setIsSwapped] = useState(false);

    const [isSelectingFrom, setIsSelectingFrom] = useState(false);
    const [isSelectingTo, setIsSelectingTo] = useState(false);

    const currentFrom = isSwapped ? toCurrency : fromCurrency;
    const currentTo = isSwapped ? fromCurrency : toCurrency;

    const ranges = ['1D', '5D', '1M', '1Y', '5Y', 'Max'];

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch('https://api.frankfurter.app/currencies');
                const data = await res.json();
                setCurrencies(data);
            } catch (err) {
                console.error("Error fetching currencies:", err);
            }
        };
        fetchCurrencies();
    }, []);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch(`https://api.frankfurter.app/latest?from=${currentFrom}&to=${currentTo}`);
                const data = await res.json();
                if (data.rates && data.rates[currentTo]) {
                    setFxRate(data.rates[currentTo]);
                    const now = new Date();
                    const options: any = { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };
                    setTimestamp(now.toLocaleDateString('en-GB', options).replace(',', ''));
                }

                // Fetch Historical Data
                let startDate = new Date();
                if (activeRange === '1D') startDate.setDate(startDate.getDate() - 1);
                else if (activeRange === '5D') startDate.setDate(startDate.getDate() - 5);
                else if (activeRange === '1M') startDate.setMonth(startDate.getMonth() - 1);
                else if (activeRange === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
                else if (activeRange === '5Y') startDate.setFullYear(startDate.getFullYear() - 5);
                else startDate.setFullYear(startDate.getFullYear() - 10);

                const startStr = startDate.toISOString().split('T')[0];
                const histRes = await fetch(`https://api.frankfurter.app/${startStr}..?from=${currentFrom}&to=${currentTo}`);
                const histData = await histRes.json();

                if (histData.rates) {
                    const formatted = Object.entries(histData.rates).map(([date, rates]: [string, any]) => ({
                        date,
                        rate: rates[currentTo]
                    }));
                    setHistory(formatted);
                }
            } catch (err) {
                console.error("Error fetching rates:", err);
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
            className="h-screen text-white font-satoshi flex flex-col relative overflow-y-auto scroll-smooth"
            style={{
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0A0A0A'
            }}
        >
            {/* Header */}
            <div className="px-5 pt-12 pb-2 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 active:scale-90 transition-transform"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-[18px] font-bold">Live Rates</h1>
                <div className="w-10" />
            </div>

            {/* Timestamp */}
            <div className="text-center mb-8">
                <p className="text-[#A0A0A0] text-[14px]">{timestamp || "18 Aug, 10:40 am UTC"}</p>
            </div>

            <div className="px-5">
                {/* Conversion Cards Container */}
                <div className="relative flex flex-col gap-2">
                    {/* From Card */}
                    <div className="bg-[#191919]/[0.31] rounded-[20px] p-6 border border-white/5 relative h-[120px] flex flex-col justify-center backdrop-blur-[25px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white/40 text-[14px] font-medium">Convert</span>
                            <button
                                onClick={() => setIsSelectingFrom(true)}
                                className="w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 bg-[#1A1A1A] rounded-full border border-white/10 active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ring-white">
                                        <img src={`https://flagcdn.com/w160/${currencyToCountry[currentFrom]}.png`} alt={currentFrom} className="w-full h-full object-cover scale-150" />
                                    </div>
                                    <span className="text-[12px] font-medium uppercase">{currentFrom}</span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-white/60" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 leading-tight">
                            <span className="text-[32px] font-medium text-white">
                                {currencySymbols[currentFrom] || ''}
                            </span>
                            <span className="text-[40px] font-bold text-white">100</span>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <button
                            onClick={() => setIsSwapped(!isSwapped)}
                            className="active:scale-90 transition-all"
                        >
                            <img src={ArrowDownUp} alt="Swap" className="w-10 h-10" />
                        </button>
                    </div>

                    {/* To Card */}
                    <div className="bg-[#191919]/[0.31] rounded-[20px] p-6 border border-white/5 relative h-[120px] flex flex-col justify-center backdrop-blur-[25px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white/40 text-[14px] font-medium">To</span>
                            <button
                                onClick={() => setIsSelectingTo(true)}
                                className="w-[86px] h-[28px] flex items-center justify-between pl-[6px] pr-3 bg-[#1A1A1A] rounded-full border border-white/10 active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full overflow-hidden ring-[0.5px] ring-white">
                                        <img src={`https://flagcdn.com/w160/${currencyToCountry[currentTo]}.png`} alt={currentTo} className="w-full h-full object-cover scale-150" />
                                    </div>
                                    <span className="text-[12px] font-medium uppercase">{currentTo}</span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-white/60" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 leading-tight">
                            <span className="text-[32px] font-medium text-white">
                                {currencySymbols[currentTo] || ''}
                            </span>
                            <span className="text-[40px] font-bold text-white">
                                {(100 * fxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Graph Container */}
                <div className="mt-[18px] bg-[#191919]/[0.31] rounded-[13px] border border-white/5 pt-[17px] backdrop-blur-[25px] h-[277px] flex flex-col relative overflow-hidden">
                    {/* Range Selector */}
                    <div className="flex justify-between items-center mb-6 relative ml-[14px] mr-[13px]">
                        {ranges.map((range) => (
                            <button
                                key={range}
                                onClick={() => setActiveRange(range)}
                                className={`text-[13px] font-medium w-[37px] h-[37px] flex items-center justify-center rounded-full transition-all relative z-10 ${activeRange === range ? 'text-white' : 'text-white/40'}`}
                                style={activeRange === range ? {
                                    backgroundImage: `url(${activeRangeBg})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                } : {}}
                            >
                                <span className="relative z-20">{range}</span>
                            </button>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history} margin={{ top: 10, right: 13, left: 14, bottom: 24 }}>
                                <defs>
                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }}
                                    dy={15}
                                    ticks={history.length > 2 ? [history[Math.floor(history.length * 0.25)].date, history[history.length - 1].date] : []}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                    }}
                                />
                                <YAxis
                                    orientation="left"
                                    domain={['dataMin', 'dataMax']}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }}
                                    width={30}
                                    dx={0}
                                    ticks={getYTickValues()}
                                    tickFormatter={(val) => val.toFixed(1)}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#22C55E' }}
                                    labelClassName="hidden"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#22C55E"
                                    fillOpacity={1}
                                    fill="url(#colorRate)"
                                    strokeWidth={2}
                                    animationDuration={1100}
                                    animationEasing="ease-in-out"
                                    isAnimationActive={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-12 mb-10">
                    <button
                        onClick={() => navigate('/fx-exchange')}
                        className="w-full h-[48px] bg-[#5260FE] rounded-full text-[16px] font-bold active:scale-95 transition-transform"
                    >
                        Exchange Currency
                    </button>
                </div>
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

export default LiveRates;
