import { ASSETS } from '@/constants/assets';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { helpCategories } from '@/lib/helpData';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
const HelpCategoryPage = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = categoryId ? helpCategories[categoryId] : null;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!category) {
    return (
      <div
        className="h-full w-full flex items-center justify-center bg-white text-black dark:bg-brand-bg-dark dark:text-white"
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
      className="fixed inset-0 w-full flex flex-col bg-white dark:bg-brand-bg-dark"
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
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Scrollable Content */}
      <div className="relative z-20 h-full w-full flex flex-col overflow-y-auto no-scrollbar safe-bottom pb-4">
        {/* Header */}
        <header className="px-5 safe-top pt-4 pb-4 flex items-center justify-center relative z-10 shrink-0 mb-[41px]">
          <div className="absolute left-5 z-20">
            <BackButton onClick={() => navigate(-1)} />
          </div>
          <h1
            className="text-[22px] font-medium font-satoshi text-black dark:text-white"
          >
            Help & Support
          </h1>
        </header>
        <main className="flex-1 px-5 relative z-10">
          <h2
            className="text-[16px] font-bold font-satoshi mb-[14px] uppercase px-4 text-black dark:text-white"
          >
            {category.title}
          </h2>
          <div
            className="w-full rounded-[13px] px-4 py-4 overflow-hidden flex flex-col transition-colors bg-white border border-brand-border-light shadow-sm dark:bg-black/20 dark:backdrop-blur-[25px] dark:border-white/10 dark:shadow-none"
          >
            {category.faqs.map((faq, idx) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div key={faq.id} className="flex flex-col">
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left active:bg-brand-bg-light dark:active:bg-white/5"
                  >
                    <span
                      className="text-[14px] font-normal font-satoshi text-black dark:text-white"
                    >
                      {faq.question}
                    </span>
                    {isExpanded ? (
                      <ChevronDown
                        className="text-brand-text-muted dark:text-white/40 w-5 h-5 shrink-0"
                      />
                    ) : (
                      <ChevronRight
                        className="text-brand-text-muted dark:text-white/40 w-5 h-5 shrink-0"
                      />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="pb-4 animate-in fade-in slide-in-from-top-1 duration-200 px-4">
                      <div
                        className="w-full h-[1px] border-t border-dashed mb-4 border-brand-border-light dark:border-white/20"
                      />
                      <p
                        className="text-[12px] leading-relaxed font-satoshi font-light text-black dark:text-white"
                      >
                        {faq.answer}
                      </p>
                    </div>
                  )}
                  {idx < category.faqs.length - 1 && (
                    <div
                      className="w-full h-[1px] bg-brand-border-light dark:bg-white/5"
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
                className="text-[40px] font-black font-satoshi tracking-tight leading-none text-black/40 dark:text-white/40"
              >
                Grid.Pe
              </h2>
              <p
                className="font-medium text-[14px] font-satoshi mt-[2px] px-[2px] text-black/40 dark:text-white/40"
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
