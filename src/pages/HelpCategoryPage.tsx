import { ASSETS } from '@/constants/assets';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { helpCategories } from '@/lib/helpData';
import { useTheme } from 'next-themes';
const HelpCategoryPage = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = categoryId ? helpCategories[categoryId] : null;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!category) {
    return (
      <div
        className={`h-full w-full flex items-center justify-center ${isDarkMode ? 'bg-[#0a0a12] text-white' : 'bg-white text-black'}`}
      >
        Category not found
      </div>
    );
  }
  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  return (
    <div
      className={`fixed inset-0 w-full flex flex-col ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
    >
      {/* Background Image */}
      {isDarkMode && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${ASSETS.BG_DARK_MODE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      {/* Light Mode Purple Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Scrollable Content */}
      <div className="relative z-20 h-full w-full flex flex-col overflow-y-auto no-scrollbar safe-bottom pb-4">
        {/* Header */}
        <header className="px-5 safe-top pt-4 pb-4 flex items-center justify-center relative z-10 shrink-0 mb-[41px]">
          <div className="absolute left-5 z-20">
            <BackButton onClick={() => navigate(-1)} />
          </div>
          <h1
            className={`text-[22px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Help & Support
          </h1>
        </header>
        <main className="flex-1 px-5 relative z-10">
          <h2
            className={`text-[16px] font-bold font-satoshi mb-[14px] uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {category.title}
          </h2>
          <div
            className={`w-[363px] rounded-[13px] p-[10px] overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-black/20 backdrop-blur-[25px] border border-white/10' : 'bg-white border border-[#E9EAEB] shadow-sm'}`}
          >
            {category.faqs.map((faq, idx) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div key={faq.id} className="flex flex-col">
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className={`w-full flex items-center justify-between py-[10px] pr-[5px] transition-colors text-left ${isDarkMode ? 'active:bg-white/5' : 'active:bg-[#F7F8FA]'}`}
                  >
                    <span
                      className={`text-[14px] font-normal font-satoshi pr-4 ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      {faq.question}
                    </span>
                    {isExpanded ? (
                      <ChevronDown
                        className={`${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'} w-5 h-5 shrink-0`}
                      />
                    ) : (
                      <ChevronRight
                        className={`${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'} w-5 h-5 shrink-0`}
                      />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div
                        className={`w-[calc(100%+20px)] mx-[-10px] h-[1px] border-t border-dashed mb-4 ${isDarkMode ? 'border-white/20' : 'border-[#E6E8EB]'}`}
                      />
                      <p
                        className={`text-[12px] leading-relaxed font-satoshi font-light ${isDarkMode ? 'text-white' : 'text-black'}`}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  )}
                  {idx < category.faqs.length - 1 && (
                    <div
                      className={`w-[calc(100%+20px)] mx-[-10px] h-[1px] ${isDarkMode ? 'bg-white/5' : 'bg-[#E9EAEB]'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Footer Watermark (Inside scrollable content) */}
          <div className="mt-32 pb-4">
            <div className="flex flex-col items-start">
              <h2
                className={`text-[40px] font-black font-satoshi tracking-tight leading-none ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
              >
                Grid.Pe
              </h2>
              <p
                className={`font-medium text-[14px] font-satoshi mt-[2px] px-[2px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
              >
                We turn ‘WTF?’ into ‘Aah, okay.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default HelpCategoryPage;
