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
      const { error } = await supabase
        .from('profiles')
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
          isAndroid ? 'bg-black/60 pointer-events-auto' : 'bg-black/40 backdrop-blur-[2px] pointer-events-auto'
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
          boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.5)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
          willChange: 'transform',
          backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
        }}
      >
        {/* Drag Handle */}
        <div
          className={`w-10 h-1.5 rounded-full mx-auto mt-3 shrink-0 ${
            isDarkMode ? 'bg-white/20' : 'bg-black/20'
          }`}
        />

        {/* Header */}
        <div className="shrink-0 px-5 pt-4 pb-3 flex justify-between items-center border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className={`text-[18px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Select App Language
            </h2>
            <p className="text-[12px] text-muted-foreground font-satoshi mt-0.5">
              Choose your preferred language for app text and support
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleCloseSafe(e);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              isDarkMode ? 'bg-white/10' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          </button>
        </div>

        {/* Language Options List */}
        <div className="px-5 py-4 overflow-y-auto space-y-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = (currentLanguage || 'en') === lang.code;
            const isUpdating = updatingCode === lang.code;

            return (
              <button
                key={lang.code}
                disabled={!!updatingCode}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full h-[56px] px-4 rounded-[16px] flex items-center justify-between transition-all duration-200 ${
                  isDarkMode
                    ? isSelected
                      ? 'bg-brand-primary/20 border border-brand-primary/50 text-white'
                      : 'bg-white/5 border border-white/5 text-white hover:bg-white/10 active:scale-[0.99]'
                    : isSelected
                      ? 'bg-brand-primary/10 border border-brand-primary/40 text-black'
                      : 'bg-[#F2F4F7] border border-black/5 text-black hover:bg-black/5 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      isSelected
                        ? 'bg-brand-primary text-white'
                        : isDarkMode
                          ? 'bg-white/10 text-white/70'
                          : 'bg-black/10 text-black/70'
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[15px] font-semibold font-satoshi">{lang.nativeLabel}</span>
                    {lang.code !== 'en' && (
                      <span className="text-[12px] opacity-70 font-satoshi">{lang.englishLabel}</span>
                    )}
                  </div>
                </div>

                {isUpdating ? (
                  <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                ) : isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full border ${
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
