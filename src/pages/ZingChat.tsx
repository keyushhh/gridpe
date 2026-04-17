import { useNavigate } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import addCircleIcon from "@/assets/add-circle.svg";
import sendIcon from "@/assets/send.svg";
import deliveredIcon from "@/assets/delivered-chat.svg";
import userAvatar from "@/assets/avatar.png";
import zingSmall from "@/assets/zing-small.png";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";

interface Message {
    id: string;
    sender: 'zing' | 'user';
    text: string[];
    timestamp: string;
    type?: 'text' | 'actions';
    actions?: string[];
    status?: 'sent' | 'delivered' | 'read';
    image?: string;
}

const ZingChat = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'zing',
            text: ["Hi, I’m Zing!", "What can I help you with today?"],
            timestamp: "",
            type: 'text'
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatTime = () => {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    const sessionTime = useRef(formatTime());

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const fetchZingReply = async (input: string) => {
        setIsThinking(true);
        try {

            const { data, error } = await supabase.functions.invoke("zing-ai", {
                body: {
                    message: input,
                    hasImage: !!messages[messages.length - 1]?.image
                }
            });

            if (error) {
                throw error;
            }


            const zingReply: Message = {
                id: Date.now().toString(),
                sender: 'zing',
                text: [data.reply],
                timestamp: formatTime(),
                type: 'text'
            };
            setMessages(prev => [...prev, zingReply]);
        } catch (error: any) {
            console.error("Zing Brain Error:", error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                sender: 'zing',
                text: [
                    "Whoops! My battery's a bit low or I'm having a brain freeze. 🧊",
                    `Debug Info: ${error.message || "Unknown error"}`
                ],
                timestamp: formatTime(),
                type: 'text'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleQuickAction = (action: string) => {
        setHasInteracted(true);
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: [action],
            timestamp: formatTime(),
            status: 'read'
        };

        setMessages(prev => [...prev, userMsg]);
        fetchZingReply(action);
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        setHasInteracted(true);
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: [inputValue],
            timestamp: formatTime(),
            status: 'read'
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = inputValue;
        setInputValue("");
        fetchZingReply(currentInput);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setHasInteracted(true);
            const userMsg: Message = {
                id: Date.now().toString(),
                sender: 'user',
                text: ["Attached an image"],
                image: base64String,
                timestamp: formatTime(),
                status: 'read'
            };
            setMessages(prev => [...prev, userMsg]);
            fetchZingReply("Analyze this image for me.");
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className={`fixed inset-0 w-full flex flex-col safe-area-top transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                willChange: 'transform',
                transform: 'translateZ(0)'
            }}
        >
            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}
            <header className="px-5 pt-4 pb-4 flex items-center relative z-20 shrink-0">
                <div className="absolute left-5">
                    <BackButton onClick={() => navigate(-1)} />
                </div>

                <h1 className={`w-full text-center text-[18px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Chat with Zing</h1>
            </header>

            <main
                ref={scrollRef}
                className="flex-1 px-5 pt-4 overflow-y-auto no-scrollbar relative z-10 flex flex-col"
                style={{ willChange: 'transform', WebkitOverflowScrolling: 'touch' }}
            >
                <div className={`flex flex-col items-center gap-1 mb-8 shrink-0 transition-opacity ${isDarkMode ? 'opacity-40' : 'opacity-60'}`}>
                    <span className={`text-[12px] font-medium font-satoshi tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Session Started</span>
                    <span className={`text-[12px] font-medium font-satoshi tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Today {sessionTime.current}</span>
                </div>

                <div className="flex-1" />

                <div className="flex flex-col gap-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-end gap-[12px] max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                {msg.sender === 'zing' ? (
                                    <div className="w-[60px] h-[60px] shrink-0 transform -mb-1 flex items-center justify-center">
                                        {!hasInteracted ? (
                                            <DotLottieReact
                                                src="https://lottie.host/dec60184-c95b-480f-9bdb-e23f2f3545ab/SOlm7P1CIz.lottie"
                                                loop
                                                autoplay
                                            />
                                        ) : (
                                            <img
                                                src={zingSmall}
                                                alt="Zing"
                                                className="w-[35px] h-[24px] object-contain mb-2"
                                                width={35}
                                                height={24}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0 mb-2">
                                        <img src={userAvatar} alt="User" className="w-full h-full object-cover" width={40} height={40} />
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <div
                                        className={`p-4 flex flex-col gap-2 transition-colors ${msg.sender === 'zing'
                                            ? `w-fit max-w-[249px] backdrop-blur-[25px] rounded-t-[18px] rounded-br-[18px] rounded-bl-0 ${isDarkMode
                                                ? 'bg-white/[0.03] border border-white/10'
                                                : 'bg-[#F7F8FA] border border-[#E9EAEB]'
                                            }`
                                            : `backdrop-blur-[25px] rounded-t-[18px] rounded-bl-[18px] rounded-br-0 ${isDarkMode
                                                ? 'bg-white/[0.06] border border-white/10'
                                                : 'bg-[#5260FE]/[0.05] border border-[#5260FE]/10'
                                            }`
                                            }`}
                                    >
                                        {msg.image && (
                                            <div className="w-full rounded-lg overflow-hidden mb-2">
                                                <img src={msg.image} alt="Attached" className="w-full h-auto object-contain max-h-[200px]" />
                                            </div>
                                        )}
                                        {msg.text.map((t, i) => (
                                            <p key={i} className={`text-[13px] font-normal font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                {t}
                                            </p>
                                        ))}
                                    </div>

                                    {msg.sender === 'user' && (
                                        <div className="flex items-center gap-1 self-end mr-1 mt-[-4px]">
                                            <span className={`text-[11px] font-medium font-satoshi transition-colors ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{msg.timestamp}</span>
                                            <img
                                                src={deliveredIcon}
                                                alt=""
                                                className={`w-3.5 h-3.5 transition-all ${isDarkMode ? 'opacity-60' : 'opacity-100'}`}
                                                style={!isDarkMode ? { filter: 'brightness(0) saturate(100%) invert(43%) sepia(74%) saturate(4975%) hue-rotate(226deg) brightness(101%) contrast(101%)' } : {}}
                                            />
                                        </div>
                                    )}

                                    {msg.type === 'actions' && msg.actions && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.actions.map(action => (
                                                <button
                                                    key={action}
                                                    onClick={() => handleQuickAction(action)}
                                                    className={`h-[36px] px-4 rounded-full text-[13px] font-medium font-satoshi transition-colors ${isDarkMode
                                                        ? 'bg-[#5260FE]/20 border border-[#5260FE]/40 text-[#A5ADFF] active:bg-[#5260FE]/30'
                                                        : 'bg-[#5260FE]/10 border border-[#5260FE]/20 text-[#5260FE] active:bg-[#5260FE]/20'
                                                        }`}
                                                >
                                                    {action}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex items-end gap-[12px] max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-[60px] h-[60px] shrink-0 transform -mb-1">
                                <DotLottieReact
                                    src="https://lottie.host/dec60184-c95b-480f-9bdb-e23f2f3545ab/SOlm7P1CIz.lottie"
                                    loop
                                    autoplay
                                />
                            </div>
                            <div className={`backdrop-blur-[25px] border rounded-t-[18px] rounded-br-[18px] rounded-bl-0 px-4 py-3 flex gap-1 mb-2 transition-colors ${isDarkMode
                                ? 'bg-white/[0.03] border-white/10'
                                : 'bg-[#F7F8FA] border-[#E9EAEB]'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isDarkMode ? 'bg-white/40' : 'bg-black/20'}`} />
                                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isDarkMode ? 'bg-white/40' : 'bg-black/20'}`} />
                                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-white/40' : 'bg-black/20'}`} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-[28px] shrink-0" />
            </main>

            <div className="px-5 pb-20 relative z-20 mt-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <div className={`w-full h-[48px] backdrop-blur-[25px] border rounded-full flex items-center px-[18px] transition-all duration-300 ${isDarkMode
                    ? 'bg-white/[0.03] border-white/10'
                    : 'bg-white border-[#E9EAEB] shadow-sm'
                    }`}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Start typing..."
                        className={`bg-transparent text-[15px] font-normal font-satoshi flex-1 outline-none transition-colors ${isDarkMode
                            ? 'text-white placeholder:text-white/30'
                            : 'text-black placeholder:text-black/30'
                            }`}
                    />
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-1 active:scale-95 hover:scale-105 transition-transform opacity-80 cursor-pointer ${!isDarkMode ? 'grayscale invert' : ''}`}
                        >
                            <img src={addCircleIcon} alt="Add" className="w-[22px] h-[22px] pointer-events-none" width={22} height={22} />
                        </button>
                        <button
                            onClick={handleSend}
                            className={`p-1 active:scale-95 hover:scale-110 transition-transform cursor-pointer ${!isDarkMode ? 'grayscale invert' : ''}`}
                        >
                            <img src={sendIcon} alt="Send" className="w-[22px] h-[22px] pointer-events-none" width={22} height={22} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZingChat;
