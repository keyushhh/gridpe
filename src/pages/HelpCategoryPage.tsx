import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { helpCategories } from "@/lib/helpData";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";

const HelpCategoryPage = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { categoryId } = useParams<{ categoryId: string }>();
    const category = categoryId ? helpCategories[categoryId] : null;
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (!category) {
        return (
            <div className={`h-full w-full flex items-center justify-center ${isDarkMode ? 'bg-[#0a0a12] text-white' : 'bg-white text-black'}`}>
                Category not found
            </div>
        );
    }

    const toggleAccordion = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className={`fixed inset-0 ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-white'}`}>
            {/* Background Image */}
            {isDarkMode && (
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url(${bgDarkMode})`,
                        backgroundSize: "cover",
                        backgroundPosition: "top center",
                        backgroundRepeat: "no-repeat",
                    }}
                />
            )}

            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}

            {/* Fixed Watermark Branding (Behind Content) */}
            <div className="fixed bottom-0 left-0 px-[25px] pb-[42px] z-10 pointer-events-none">
                <div className="flex flex-col items-start">
                    <h2 className={`text-[40px] font-black font-satoshi tracking-tight leading-none ${isDarkMode ? 'text-white/40' : 'text-[#E9EAEB]'}`}>
                        Grid.Pe
                    </h2>
                    <p className={`font-medium text-[14px] font-satoshi mt-[2px] px-[2px] ${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'}`}>
                        We turn ‘WTF?’ into ‘Aah, okay.
                    </p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="relative z-20 h-full w-full flex flex-col safe-area-top overflow-y-auto no-scrollbar pb-[150px]">
                {/* Header */}
                <header className="px-5 pt-12 pb-4 flex items-center relative z-10 shrink-0 mb-[41px]">
                    <button
                        onClick={() => navigate(-1)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/5 border border-white/10 active:bg-white/10' : 'bg-white border border-[#E9EAEB] active:bg-[#F7F8FA]'}`}
                    >
                        <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    </button>
                    <h1 className={`w-full text-center text-[22px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Help & Support</h1>
                </header>

                <main className="flex-1 px-5 relative z-10">
                    <h2 className={`text-[16px] font-bold font-satoshi mb-[18px] uppercase ${isDarkMode ? 'text-white' : 'text-[#7E7E7E]'}`}>{category.title}</h2>

                    <div
                        className={`w-[363px] rounded-[13px] overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-black/20 backdrop-blur-[25px] border border-white/10' : 'bg-white border border-[#E9EAEB] shadow-sm'} gap-[3px]`}
                    >
                        {category.faqs.map((faq, idx) => {
                            const isExpanded = expandedId === faq.id;
                            return (
                                <div key={faq.id} className="flex flex-col">
                                    <button
                                        onClick={() => toggleAccordion(faq.id)}
                                        className={`w-full flex items-center justify-between pl-[14px] pr-4 py-[14px] transition-colors text-left ${isDarkMode ? 'active:bg-white/5' : 'active:bg-[#F7F8FA]'}`}
                                    >
                                        <span className={`text-[14px] font-normal font-satoshi pr-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {faq.question}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDown className={`${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'} w-5 h-5 shrink-0`} />
                                        ) : (
                                            <ChevronRight className={`${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'} w-5 h-5 shrink-0`} />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-[14px] pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <p className={`text-[12px] leading-relaxed font-satoshi font-normal ${isDarkMode ? 'text-white/60' : 'text-[#4A4A4A]'}`}>
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}

                                    {idx < category.faqs.length - 1 && <div className={`w-full h-[1px] mx-[14px] ${isDarkMode ? 'bg-white/5' : 'bg-[#E9EAEB]'}`} />}
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HelpCategoryPage;
