import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { helpCategories } from "@/lib/helpData";
import bgDarkMode from "@/assets/bg-dark-mode.png";

const HelpCategoryPage = () => {
    const navigate = useNavigate();
    const { categoryId } = useParams<{ categoryId: string }>();
    const category = categoryId ? helpCategories[categoryId] : null;
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (!category) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#0a0a12] text-white">
                Category not found
            </div>
        );
    }

    const toggleAccordion = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="fixed inset-0 bg-[#0a0a12]">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${bgDarkMode})`,
                    backgroundSize: "cover",
                    backgroundPosition: "top center",
                    backgroundRepeat: "no-repeat",
                }}
            />

            {/* Fixed Watermark Branding (Behind Content) */}
            <div className="fixed bottom-0 left-0 px-[25px] pb-[42px] z-10 pointer-events-none">
                <div className="flex flex-col items-start">
                    <h2 className="text-[40px] font-black text-white/40 font-satoshi tracking-tight leading-none">
                        Grid.Pe
                    </h2>
                    <p className="text-white/40 font-medium text-[14px] font-satoshi mt-[2px] px-[2px]">
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
                        className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 active:bg-white/10 absolute left-5"
                    >
                        <ChevronLeft className="text-white w-6 h-6" />
                    </button>
                    <h1 className="w-full text-center text-white text-[22px] font-medium font-satoshi">Help & Support</h1>
                </header>

                <main className="flex-1 px-5 relative z-10">
                    <h2 className="text-white text-[16px] font-bold font-satoshi mb-[18px] uppercase">{category.title}</h2>

                    <div
                        className="w-[363px] rounded-[13px] overflow-hidden border border-white/10 flex flex-col bg-black/20 backdrop-blur-[25px] gap-[3px]"
                    >
                        {category.faqs.map((faq, idx) => {
                            const isExpanded = expandedId === faq.id;
                            return (
                                <div key={faq.id} className="flex flex-col">
                                    <button
                                        onClick={() => toggleAccordion(faq.id)}
                                        className="w-full flex items-center justify-between pl-[14px] pr-4 py-[14px] active:bg-white/5 transition-colors text-left"
                                    >
                                        <span className="text-white text-[14px] font-normal font-satoshi pr-4">
                                            {faq.question}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDown className="text-white/40 w-5 h-5 shrink-0" />
                                        ) : (
                                            <ChevronRight className="text-white/40 w-5 h-5 shrink-0" />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-[14px] pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <p className="text-white/60 text-[12px] leading-relaxed font-satoshi font-normal">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}

                                    {idx < category.faqs.length - 1 && <div className="w-full h-[1px] bg-white/5 mx-[14px]" />}
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
