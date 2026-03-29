import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPinOff } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";

const NotAvailable = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';

    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Background Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#FF3B30] rounded-full blur-[100px] opacity-20 pointer-events-none z-0" />
            )}

            <div className="flex-none px-5 pt-[24px] flex items-center justify-between z-10 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/10' : 'bg-white border border-[#E6E8EB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center z-10">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${isDarkMode ? 'bg-white/5' : 'bg-red-50'}`}>
                    <MapPinOff className={`w-12 h-12 ${isDarkMode ? 'text-white/60' : 'text-[#FF3B30]'}`} />
                </div>
                
                <h1 className={`text-[24px] font-bold font-sans mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Service Not Available
                </h1>
                
                <p className={`text-[16px] font-normal font-sans leading-relaxed mb-12 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                    We're sorry! GridPe is currently not serving this location. We are working hard to expand our zones quickly.
                </p>

                <button
                    onClick={() => navigate("/")}
                    className="w-full h-[56px] rounded-full bg-[#5260FE] text-white font-bold font-sans text-[16px] active:scale-95 transition-transform"
                    style={{
                        boxShadow: "0px 8px 24px rgba(82, 96, 254, 0.25)"
                    }}
                >
                    Back to Home
                </button>
                
                <p className={`mt-6 text-[14px] font-medium font-sans underline underline-offset-4 cursor-pointer ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}
                   onClick={() => navigate("/add-address-details")}>
                    Try another address
                </p>
            </div>
        </div>
    );
};

export default NotAvailable;
