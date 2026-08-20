import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useBackButtonHandler } from '@/hooks/useBackButtonHandler';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { useCustomToaster } from '@/contexts/CustomToasterContext';

export interface LanguageOption {
  code: string;
  nativeLabel: string;
  englishLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', englishLabel: 'English' },
  { code: 'hi', nativeLabel: 'हिंदी', englishLabel: 'Hindi' },
  { code: 'kn', nativeLabel: 'ಕನ್ನಡ', englishLabel: 'Kannada' },
  { code: 'ta', nativeLabel: 'தமிழ்', englishLabel: 'Tamil' },
  { code: 'te', nativeLabel: 'తెలుగు', englishLabel: 'Telugu' },
];

interface LanguageSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  userId: string | undefined;
  onLanguageUpdated: (newLang: string) => void;
}

export const LanguageSelectionSheet: React.FC<LanguageSelectionSheetProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  userId,
  onLanguageUpdated,
}) => {
  const isDarkMode = useIsDarkMode();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const { showToaster } = useCustomToaster();
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  useBodyScrollLock(isOpen);
  useBackButtonHandler(isOpen, onClose);

  if (!isOpen) return null;

  const handleCloseSafe = (e?: React.MouseEvent | TouchEvent | Event) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (updatingCode) return;
    onClose();
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 150) {
      handleCloseSafe();
    }
  };

  const handleSelectLanguage = async (code: string) => {
    if (code === currentLanguage) {
      onClose();
      return;
    }

    if (!userId) {
      showToaster('Session error. Please log in again.', 'error');
      return;
    }

    setUpdatingCode(code);
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ preferred_language: code })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      onLanguageUpdated(code);
      showToaster('App language updated successfully!', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update language preference';
      showToaster(msg, 'error');
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-10 ${
          isAndroid ? 'bg-black/60 pointer-events-auto' : 'bg-black/50 backdrop-blur-[4px] pointer-events-auto'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleCloseSafe(e);
        }}
      />

      {/* Sheet Container */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="fixed bottom-0 left-0 right-0 max-h-[80vh] rounded-t-[36px] flex flex-col pointer-events-auto z-20 overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.75)' : 'rgba(255, 255, 255, 0.96)',
          borderTop: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.08)',
          borderLeft: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.08)',
          borderRight: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: isDarkMode ? '0px -10px 40px rgba(0, 0, 0, 0.4)' : '0px -10px 40px rgba(0, 0, 0, 0.15)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
          willChange: 'transform',
        }}
      >
        {/* Drag Handle */}
        <div
          className={`w-10 h-1.5 rounded-full mx-auto mt-3 shrink-0 ${
            isDarkMode ? 'bg-white/20' : 'bg-black/20'
          }`}
        />

        {/* Header */}
        <div
          className="shrink-0 px-6 pt-4 pb-3 flex justify-between items-center"
          style={{
            boxShadow: isDarkMode
              ? 'inset 0 -1px 0 rgba(255,255,255,0.06)'
              : 'inset 0 -1px 0 rgba(0,0,0,0.06)',
          }}
        >
          <div>
            <h2 className={`text-[18px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Zing’s Language
            </h2>
            <p className="text-[12px] text-muted-foreground font-satoshi mt-0.5">
              Choose the language Zing uses to reply
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleCloseSafe(e);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          </button>
        </div>

        {/* Language Options List */}
        <div className="px-6 py-5 overflow-y-auto space-y-3">
          {SUPPORTED_LANGUAGES.map((lang, index) => {
            const isSelected = (currentLanguage || 'en') === lang.code;
            const isUpdating = updatingCode === lang.code;

            return (
              <button
                key={lang.code}
                disabled={!!updatingCode}
                onClick={() => handleSelectLanguage(lang.code)}
                style={{ animationDelay: `${index * 40}ms` }}
                className={`w-full h-[64px] px-4 rounded-[18px] flex items-center justify-between transition-all duration-200 border animate-in fade-in slide-in-from-bottom-2 ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-brand-primary/15 border-brand-primary text-white shadow-lg'
                      : 'bg-white border-brand-primary text-black shadow-[0px_4px_20px_rgba(82,96,254,0.18)]'
                    : isDarkMode
                      ? 'bg-[#0D0D0D]/60 border-white/5 text-white hover:bg-white/5 active:scale-[0.99]'
                      : 'bg-[#F8F9FB] border-black/5 text-black hover:bg-black/5 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-extrabold tracking-wide transition-colors ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-md'
                        : isDarkMode
                          ? 'bg-white/10 text-white/80'
                          : 'bg-black/5 text-black/70'
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[17px] font-bold font-satoshi">{lang.nativeLabel}</span>
                    {lang.code !== 'en' && (
                      <span className="text-[12px] font-medium opacity-70 font-satoshi mt-1">{lang.englishLabel}</span>
                    )}
                  </div>
                </div>

                {isUpdating ? (
                  <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                ) : isSelected ? (
                  <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full border ${
                      isDarkMode ? 'border-white/20' : 'border-black/20'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default LanguageSelectionSheet;
