import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import addCircleIcon from "@/assets/add-circle.svg";
import sendIcon from "@/assets/send.svg";
import deliveredIcon from "@/assets/delivered-chat.svg";
import userAvatar from "@/assets/avatar.png";
import { supabase } from "@/lib/supabase";

interface Message {
    id: string;
    sender: 'zing' | 'user';
    text: string[];
    timestamp: string;
    type?: 'text' | 'actions';
    actions?: string[];
    status?: 'sent' | 'delivered' | 'read';
}

const ZingChat = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);
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

    const formatTime = () => {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const fetchZingReply = async (input: string) => {
        setIsThinking(true);
        try {
            const { data, error } = await supabase.functions.invoke('zing-ai', {
                body: { message: input }
            });

            if (error) throw error;

            const zingReply: Message = {
                id: Date.now().toString(),
                sender: 'zing',
                text: [data.reply],
                timestamp: formatTime(),
                type: 'text'
            };
            setMessages(prev => [...prev, zingReply]);
        } catch (error) {
            console.error("Zing Brain Error:", error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                sender: 'zing',
                text: ["Whoops! My battery's a bit low or I'm having a brain freeze. 🧊", "Try again in a bit, yeah?"],
                timestamp: formatTime(),
                type: 'text'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleAction = (action: string) => {
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

    return (
        <div
            className="fixed inset-0 w-full flex flex-col bg-[#0a0a12] safe-area-top"
            style={{
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <header className="px-5 pt-12 pb-4 flex items-center relative z-20 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 active:bg-white/10 absolute left-5"
                >
                    <ChevronLeft className="text-white w-6 h-6" />
                </button>
                <h1 className="w-full text-center text-white text-[22px] font-medium font-satoshi">New Chat</h1>
            </header>

            {/* Chat Area */}
            <main
                ref={scrollRef}
                className="flex-1 px-5 pt-8 overflow-y-auto no-scrollbar relative z-10 flex flex-col gap-6"
            >
                {/* Session Markers */}
                <div className="flex flex-col items-center gap-1 mb-4 opacity-40">
                    <span className="text-white text-[12px] font-medium font-satoshi tracking-tight">Session Started</span>
                    <span className="text-white text-[12px] font-medium font-satoshi tracking-tight">Today {formatTime()}</span>
                </div>

                {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-[12px] max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.sender === 'zing' ? (
                                <div className="w-[60px] h-[60px] shrink-0 transform -mb-1">
                                    <DotLottieReact
                                        src="https://lottie.host/dec60184-c95b-480f-9bdb-e23f2f3545ab/SOlm7P1CIz.lottie"
                                        loop
                                        autoplay
                                    />
                                </div>
                            ) : (
                                <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0 mb-6">
                                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <div
                                    className={`p-4 flex flex-col gap-1 ${msg.sender === 'zing'
                                        ? 'w-[249px] bg-white/[0.03] backdrop-blur-[25px] border border-white/10 rounded-t-[18px] rounded-br-[18px] rounded-bl-0'
                                        : 'bg-white/[0.06] backdrop-blur-[25px] border border-white/10 rounded-t-[18px] rounded-bl-[18px] rounded-br-0'
                                        }`}
                                >
                                    {msg.text.map((t, i) => (
                                        <p key={i} className="text-white text-[13px] font-normal font-satoshi leading-tight">
                                            {t}
                                        </p>
                                    ))}
                                </div>

                                {msg.sender === 'user' && (
                                    <div className="flex items-center gap-1 self-end mr-1 mt-[-4px]">
                                        <span className="text-white/40 text-[11px] font-medium font-satoshi">{msg.timestamp}</span>
                                        <img src={deliveredIcon} alt="" className="w-3.5 h-3.5 opacity-60" />
                                    </div>
                                )}

                                {msg.type === 'actions' && msg.actions && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {msg.actions.map(action => (
                                            <button
                                                key={action}
                                                onClick={() => handleAction(action)}
                                                className="h-[36px] px-4 rounded-full bg-[#5260FE]/20 border border-[#5260FE]/40 text-[#A5ADFF] text-[13px] font-medium font-satoshi active:bg-[#5260FE]/30 transition-colors"
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
                        <div className="bg-white/[0.03] backdrop-blur-[25px] border border-white/10 rounded-t-[18px] rounded-br-[18px] rounded-bl-0 px-4 py-3 flex gap-1 mb-2">
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}

                <div className="h-[100px] shrink-0" />
            </main>

            {/* Input Bar */}
            <div className="px-5 pb-[42px] relative z-20 mt-auto">
                <div className="w-full h-[58px] bg-white/[0.03] backdrop-blur-[25px] border border-white/10 rounded-[24px] flex items-center px-[18px]">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Start typing..."
                        className="bg-transparent text-white text-[15px] font-normal font-satoshi flex-1 outline-none placeholder:text-white/30"
                    />
                    <div className="flex items-center gap-[14px] ml-2">
                        <button className="active:scale-95 transition-transform opacity-80">
                            <img src={addCircleIcon} alt="Add" className="w-[22px] h-[22px]" />
                        </button>
                        <button
                            onClick={handleSend}
                            className="active:scale-95 transition-transform"
                        >
                            <img src={sendIcon} alt="Send" className="w-[22px] h-[22px]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZingChat;
