import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { Circle, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Order } from "@/types";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import processingIcon from "@/assets/processing.svg";
import successIcon from "@/assets/success.svg";
import failedIcon from "@/assets/failed.svg";
import refreshIcon from "@/assets/refresh.svg";
import checkIcon from "@/assets/check.svg";
import crossIcon from "@/assets/cross.svg";
import innerFrameBg from "@/assets/inner-frame.png";
import optionBg from "@/assets/option-bg.png";
import textInputBg from "@/assets/text-input.png";
import hourGlassIcon from "@/assets/hour-glass.svg";
import darkCtaBg from "@/assets/darkbg-cta.png";

const ISSUE_CATEGORIES = [
    "I did not receive this order",
    "Order was delayed",
    "Wrong amount received",
    "Report a delivery partner fraud incident",
    "Report a safety incident",
    "Order cancelled but charged",
    "Other"
];

const NeedHelp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const order = location.state?.order as Order | null;
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [description, setDescription] = useState("");

    if (!order) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center text-white">
                <p>Order not found</p>
                <button onClick={() => navigate(-1)}>Back</button>
            </div>
        );
    }

    const getStatusConfig = (status: string) => {
        const s = status.toLowerCase();
        const isProcessing = s === 'processing' || s === 'out_for_delivery' || s === 'arrived';
        const isSuccess = s === 'success' || s === 'delivered';

        if (isProcessing) {
            return {
                color: isDarkMode ? '#FACC15' : '#C09A00',
                bgColor: '#FACC15',
                bgOpacity: 0.21,
                icon: processingIcon,
                statusIcon: refreshIcon,
                statusFilter: 'brightness(0) saturate(100%) invert(60%) sepia(59%) saturate(1914%) hue-rotate(18deg) brightness(95%) contrast(101%)',
                label: 'Processing'
            };
        } else if (isSuccess) {
            return {
                color: '#1CB956',
                bgColor: '#1CB956',
                bgOpacity: 0.21,
                icon: successIcon,
                statusIcon: checkIcon,
                statusFilter: isDarkMode ? 'invert(53%) sepia(76%) saturate(446%) hue-rotate(92deg) brightness(94%) contrast(92%)' : 'none',
                label: 'Success'
            };
        } else {
            return {
                color: '#FF1E1E',
                bgColor: '#FF1E1E',
                bgOpacity: 0.21,
                icon: failedIcon,
                statusIcon: crossIcon,
                label: s === 'cancelled' ? 'Cancelled' : 'Failed'
            };
        }
    };

    const config = getStatusConfig(order.status);
    const formatOrderDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            const timeStr = date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            if (isToday) {
                return `Today | ${timeStr}`;
            } else {
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleString('en-IN', { month: 'short' });
                return `${day} ${month} | ${timeStr}`;
            }
        } catch (e) {
            return "Today | 12:00 PM";
        }
    };

    const hexAlpha = Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0');

    return (
        <div
            className={`fixed inset-0 w-full flex flex-col ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}
            {/* Header */}
            <header className="px-5 pt-safe pt-4 pb-4 flex items-center justify-between relative z-10 shrink-0">
                <BackButton onClick={() => navigate(-1)} />

                <h1 className={`text-[20px] font-medium font-satoshi flex-1 text-center pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}>Need Help?</h1>
            </header>

            <main className="flex-1 px-5 pt-4 overflow-y-auto scrollbar-hide relative z-10 pb-32">
                {/* Order Summary Card (Mirrored from Bottom Sheet) */}
                <div
                    className="relative mb-6 mx-auto overflow-hidden"
                    style={{
                        width: '362px',
                        height: '137px',
                        background: isDarkMode
                            ? `linear-gradient(${config.bgColor}${hexAlpha}, ${config.bgColor}${hexAlpha}) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box`
                            : `${config.bgColor}36`, // 36 is ~21% opacity in hex
                        border: isDarkMode ? '0.63px solid transparent' : '1px solid #E9EAEB',
                        borderRadius: '12px',
                        backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
                        WebkitBackdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
                    }}
                >
                    {/* Status Frame */}
                    <div className="h-[25px] flex items-center pl-[13.5px]">
                        <div className="flex items-center gap-[6px]">
                            <img src={config.statusIcon} alt="" className="w-[14px] h-[14px]" style={!isDarkMode ? { filter: config.statusFilter } : undefined} />
                            <span className="text-[12px] font-bold font-satoshi tracking-wide" style={{ color: config.color }}>
                                {config.label}
                            </span>
                        </div>
                    </div>

                    <div
                        className={`!absolute top-[25px] left-0 w-full glass-container z-10 rounded-[12px] ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
                        style={{
                            height: '112px',
                            '--glass-radius': '12px'
                        } as any}
                    >
                        {isDarkMode && (
                            <>
                                <div className="glass-lens" />
                                <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                                <span className="glass-rim-v2" />
                            </>
                        )}

                        <div className="relative z-10 w-full h-full">
                            <img src={config.icon} alt="" className="absolute top-[17px] left-[17px] w-[35px] h-[35px]" style={!isDarkMode ? { filter: config.statusFilter } : undefined} />

                            <div className="absolute top-[17px] left-[65px] flex flex-col">
                                <span className={`text-[16px] font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {(order.meta_data as any)?.item_value ? `Ordered ₹${(order.meta_data as any).item_value} Cash` : (order.addresses?.label ? `Order to ${order.addresses.label}` : "Cash Order")}
                                </span>
                                <span className={`text-[12px] font-medium font-satoshi mt-1 ${isDarkMode ? 'text-white' : 'text-[#7E7E7E]'}`}>
                                    {formatOrderDate(order.created_at)}
                                </span>
                            </div>

                            <span className={`absolute top-[25px] right-[17px] text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                ₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>

                            <div className={`absolute left-[12px] h-[1px] ${isDarkMode ? 'bg-[#363636]' : 'bg-[#E9EAEB]'}`} style={{ top: '65px', width: '338px' }} />

                            <div className="absolute left-[17px] right-[17px] flex justify-between items-center px-0" style={{ top: '78px' }}>
                                <span className={`text-[12px] font-satoshi font-medium ${isDarkMode ? 'text-white' : 'text-[#7E7E7E]'}`}>Order ID</span>
                                <span className={`text-[12px] font-bold font-satoshi tracking-wider uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    DTP{order.id.substring(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Issue Category Section */}
                <section
                    className={`w-full mb-4 pb-[14px] glass-container glass-physics-clear relative z-10 rounded-[12px] ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
                    style={{
                        minHeight: '309px',
                        '--glass-radius': '12px'
                    } as any}
                >
                    {isDarkMode && (
                        <>
                            <div className="glass-lens" />
                            <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                            <span className="glass-rim-v2" />
                        </>
                    )}
                    
                    <div className="relative z-10">
                        <div className="pt-[14px] px-[14px] pb-[14px]">
                            <h3 className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Issue Category</h3>
                        </div>

                        <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#747474]/23' : 'bg-[#E9EAEB]'}`} />

                        <div className="flex flex-col">
                            {ISSUE_CATEGORIES.map((cat, idx) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex items-center gap-[12px] px-[14px] py-[8.5px] ${idx < ISSUE_CATEGORIES.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-[#E9EAEB]') : ''}`}
                                >
                                    {selectedCategory === cat ? (
                                        <div className="w-[18px] h-[18px] rounded-full bg-[#5260FE] flex items-center justify-center shrink-0">
                                            <div className="w-[6px] h-[6px] rounded-full bg-white" />
                                        </div>
                                    ) : (
                                        <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 ${isDarkMode ? 'border-[#5260FE]' : 'border-[#E6E8EB]'}`} />
                                    )}
                                    <span className={`text-[14px] font-satoshi font-normal text-left leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>{cat}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Description Section */}
                <section
                    className={`w-full mb-4 glass-container glass-physics-clear relative z-10 rounded-[12px] ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
                    style={{
                        minHeight: '166px',
                        '--glass-radius': '12px'
                    } as any}
                >
                    {isDarkMode && (
                        <>
                            <div className="glass-lens" />
                            <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                            <span className="glass-rim-v2" />
                        </>
                    )}

                    <div className="relative z-10 p-[14px]">
                        <h3 className={`text-[14px] font-medium font-satoshi mb-[14px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Describe your issue (Optional)</h3>
                        <div className="relative">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                                placeholder="Add any extra details about your issue..."
                                className={`w-full h-[85px] bg-transparent text-[14px] font-satoshi resize-none focus:outline-none ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-[#7E7E7E]'}`}
                            />
                            <span className={`absolute -bottom-1 right-0 text-[10px] font-satoshi ${isDarkMode ? 'text-white/20' : 'text-[#7E7E7E]'}`}>
                                {description.length}/200
                            </span>
                        </div>
                    </div>
                </section>
            </main>

            {/* Bottom Submit Button */}
            <div className={`fixed bottom-0 left-0 right-0 p-5 pb-safe pb-4 z-20 ${isDarkMode ? 'bg-[#0a0a12]/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md border-t border-[#E9EAEB]'}`}>
                <button
                    disabled={!selectedCategory}
                    className={`w-full h-12 rounded-full flex items-center justify-center text-white text-[16px] font-medium active:scale-95 transition-all
                        ${!selectedCategory ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
                    `}
                    style={{
                        backgroundColor: '#5260FE',
                    }}
                    onClick={() => {
                        // Handle Submit logic
                        navigate('/help/success');
                    }}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default NeedHelp;
