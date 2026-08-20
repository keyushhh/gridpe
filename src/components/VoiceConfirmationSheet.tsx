import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Check, Edit3, Volume2, VolumeX, Loader2, Mic } from 'lucide-react';
import { GpButton } from '@gridpe-app/ui';
import { supabase } from '@/lib/supabase';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { crashlytics } from '@/lib/crashlytics';

export interface VoiceConfirmationSheetProps {
  isOpen: boolean;
  amount: number;
  transcript: string;
  preferredLanguage?: string;
  isDarkMode?: boolean;
  onConfirm: (amount: number) => void;
  onEditManually: () => void;
  onClose: () => void;
}

const getConfirmationLabel = (lang: string): string => {
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi':
      return 'क्या आपका मतलब';
    case 'bn':
      return 'আপনি কি বোঝাতে চেয়েছেন';
    case 'kn':
      return 'ನಿಮ್ಮ ಉದ್ದೇಶ';
    case 'ta':
      return 'நீங்கள் குறிப்பது';
    case 'te':
      return 'మీరు అనుకుంటున్నది';
    case 'mr':
      return 'तुमचा अर्थ';
    case 'gu':
      return 'શું તમારો મતલબ';
    case 'pa':
      return 'ਕੀ ਤੁਹਾਡਾ ਮਤਲਬ';
    case 'ml':
      return 'നിങ്ങൾ ഉദ്ദേശിച്ചത്';
    case 'od':
      return 'ଆପଣଙ୍କ ଅର୍ଥ';
    case 'as':
      return 'আপুনি বুজাইছে';
    default:
      return 'Did you mean';
  }
};

const getConfirmButtonText = (amt: number, lang: string): string => {
  const formatted = `₹${amt.toLocaleString('en-IN')}`;
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi':
      return `हाँ, ${formatted} चुनें`;
    case 'bn':
      return `হ্যাঁ, ${formatted} ব্যবহার করুন`;
    case 'kn':
      return `ಹೌದು, ${formatted} ಬಳಸಿ`;
    case 'ta':
      return `ஆம், ${formatted} பயன்படுத்தவும்`;
    case 'te':
      return `అవును, ${formatted} ఉపయోగించండి`;
    case 'mr':
      return `होय, ${formatted} वापरा`;
    case 'gu':
      return `હા, ${formatted} વાપરો`;
    case 'pa':
      return `ਹਾਂ, ${formatted} ਵਰਤੋ`;
    case 'ml':
      return `അതെ, ${formatted} ഉപയോഗിക്കുക`;
    case 'od':
      return `ହଁ, ${formatted} ବ୍ୟବହାର କରନ୍ତୁ`;
    case 'as':
      return `হয়, ${formatted} ব্যৱহাৰ কৰক`;
    default:
      return `Yes, Use ${formatted}`;
  }
};

const getConfirmationSentence = (amt: number, lang: string): string => {
  const formatted = amt.toLocaleString('en-IN');
  const code = (lang || 'en').split('-')[0].toLowerCase();
  switch (code) {
    case 'hi':
      return `क्या आपका मतलब ${formatted} रुपये है?`;
    case 'bn':
      return `আপনি কি ${formatted} টাকা বোঝাতে চেয়েছেন?`;
    case 'kn':
      return `ನಿಮ್ಮ ಉದ್ದೇಶ ${formatted} ರೂಪಾಯಿಗಳೇ?`;
    case 'ta':
      return `நீங்கள் ${formatted} ரூபாயைக் குறிக்கிறீர்களா?`;
    case 'te':
      return `మీరు ${formatted} రూపాయలు అని అనుకుంటున్నారా?`;
    case 'mr':
      return `तुमचा अर्थ ${formatted} रुपये आहे का?`;
    case 'gu':
      return `શું તમારો મતલબ ${formatted} રૂપિયા છે?`;
    case 'pa':
      return `ਕੀ ਤੁਹਾਡਾ ਮਤਲਬ ${formatted} ਰੁਪਏ ਹੈ?`;
    case 'ml':
      return `നിങ്ങൾ ഉദ്ദേശിച്ചത് ${formatted} രൂപയാണോ?`;
    case 'od':
      return `ଆପଣଙ୍କ ଅର୍ଥ ${formatted} ଟଙ୍କା କି?`;
    case 'as':
      return `আপুনি ${formatted} টকা বুজাইছে নেকি?`;
    default:
      return `Did you mean ${formatted} rupees?`;
  }
};

export const VoiceConfirmationSheet: React.FC<VoiceConfirmationSheetProps> = ({
  isOpen,
  amount,
  transcript,
  preferredLanguage = 'en',
  isDarkMode = false,
  onConfirm,
  onEditManually,
  onClose,
}) => {
  const { showToaster } = useCustomToaster();
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopTtsAudio = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
    setTtsState('idle');
  };

  const handlePlayTts = async () => {
    if (ttsState === 'playing') {
      stopTtsAudio();
      return;
    }

    if (ttsState === 'loading') return;

    setTtsState('loading');
    try {
      const promptText = getConfirmationSentence(amount, preferredLanguage);
      console.log('[TTS DEBUG] Invoking voice-order-tts with:', { promptText, preferredLanguage });

      const { data, error } = await supabase.functions.invoke('voice-order-tts', {
        body: {
          text: promptText,
          preferred_language: preferredLanguage,
        },
      });

      console.log('[TTS DEBUG] voice-order-tts response:', {
        hasData: !!data,
        audioBase64Length: data?.audioBase64 ? data.audioBase64.length : 0,
        mimeType: data?.mimeType,
        error: data?.error || error,
        rawPayload: data,
      });

      if (error || data?.error || !data?.audioBase64) {
        throw error || new Error(data?.error || 'No audio returned from TTS service');
      }

      stopTtsAudio();

      const mimeType = data.mimeType || 'audio/wav';
      const audioUrl = `data:${mimeType};base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        console.log('[TTS DEBUG] Audio playback completed normally');
        setTtsState('idle');
        activeAudioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('[TTS DEBUG] audio.onerror fired:', {
          event: e,
          errorCode: audio.error?.code,
          errorMessage: audio.error?.message,
        });
        setTtsState('idle');
        activeAudioRef.current = null;
        showToaster("Couldn't play audio, please read the amount above", 'error');
      };

      audio.onpause = () => {
        setTtsState('idle');
      };

      try {
        console.log('[TTS DEBUG] Calling audio.play()...');
        await audio.play();
        console.log('[TTS DEBUG] audio.play() promise resolved successfully');
        setTtsState('playing');
      } catch (playErr: any) {
        console.error('[TTS DEBUG] audio.play() threw error:', {
          name: playErr?.name,
          message: playErr?.message,
          playErr,
        });
        throw playErr;
      }
    } catch (err) {
      console.error('[TTS DEBUG] handlePlayTts top-level catch:', err);
      setTtsState('idle');
      crashlytics.recordError(
        err instanceof Error ? err : new Error(String(err)),
        'VoiceConfirmationSheet.playTts'
      );
      showToaster("Couldn't play audio, please read the amount above", 'error');
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 140) {
      stopTtsAudio();
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopTtsAudio();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopTtsAudio();
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
          {/* Backdrop with frosted blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              stopTtsAudio();
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`w-full max-w-[440px] rounded-t-[32px] sm:rounded-b-[32px] sm:mb-4 px-6 pt-3 pb-8 relative z-10 overflow-hidden select-none ${
              isDarkMode
                ? 'bg-[#12131A]/95 text-white border-t border-white/10 shadow-[0_-16px_48px_rgba(0,0,0,0.6)]'
                : 'bg-white/95 text-slate-900 border-t border-slate-200/80 shadow-[0_-16px_48px_rgba(0,0,0,0.12)]'
            } backdrop-blur-2xl`}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
            }}
          >
            {/* Ambient Radial Glow at the top */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 pointer-events-none rounded-full blur-3xl opacity-25"
              style={{
                background: 'radial-gradient(ellipse at center, #5260FE 0%, #818CF8 40%, transparent 70%)',
              }}
            />

            {/* Drag Handle Bar */}
            <div className="flex justify-center mb-4">
              <div
                className={`w-10 h-1.5 rounded-full transition-colors ${
                  isDarkMode ? 'bg-white/20 hover:bg-white/30' : 'bg-black/15 hover:bg-black/25'
                }`}
              />
            </div>

            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-[18px] font-bold font-sans tracking-tight">
                Confirm Spoken Amount
              </h3>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopTtsAudio();
                  onClose();
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/15 text-white/70 hover:text-white border border-white/5'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transcript Card ("What was heard") */}
            {transcript && (
              <div
                className={`relative rounded-2xl p-3.5 mb-4 border transition-all ${
                  isDarkMode
                    ? 'bg-white/[0.04] border-white/[0.08] text-white/90 shadow-inner'
                    : 'bg-slate-50/80 border-slate-200/70 text-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
                  <Mic className="w-3 h-3" />
                  <span>Spoken Voice Input</span>
                </div>
                <p className="text-[13.5px] italic leading-relaxed font-sans font-normal opacity-90 pl-0.5">
                  &ldquo;{transcript}&rdquo;
                </p>
              </div>
            )}

            {/* Hero Amount Recognition Box */}
            <div
              className={`relative rounded-3xl p-5 my-3 text-center border overflow-hidden ${
                isDarkMode
                  ? 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                  : 'bg-gradient-to-b from-indigo-50/60 to-white border-indigo-100/80 shadow-sm'
              }`}
            >
              {/* Top Subtext */}
              <div className="flex items-center justify-center">
                <span
                  className={`text-[13px] font-medium tracking-wide ${
                    isDarkMode ? 'text-white/60' : 'text-slate-500'
                  }`}
                >
                  {getConfirmationLabel(preferredLanguage)}
                </span>
              </div>

              {/* Big Amount Number + Simple Speaker Icon right after */}
              <div className="mt-1 flex items-center justify-center gap-2">
                <span
                  className={`text-[42px] leading-tight font-extrabold font-sans tracking-tight ${
                    isDarkMode
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 drop-shadow-[0_2px_16px_rgba(82,96,254,0.3)]'
                      : 'text-brand-primary'
                  }`}
                >
                  ₹{amount.toLocaleString('en-IN')}
                </span>

                {/* Speaker icon (no circle, just icon) */}
                <button
                  type="button"
                  onClick={handlePlayTts}
                  disabled={ttsState === 'loading'}
                  aria-label={ttsState === 'playing' ? 'Stop audio playback' : 'Play audio confirmation'}
                  className={`p-1.5 transition-all active:scale-90 inline-flex items-center justify-center cursor-pointer ${
                    ttsState === 'playing'
                      ? 'text-brand-primary-light animate-pulse'
                      : isDarkMode
                        ? 'text-white/80 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ttsState === 'loading' ? (
                    <Loader2 className={`w-5 h-5 animate-spin ${isDarkMode ? 'text-white' : 'text-slate-700'}`} />
                  ) : ttsState === 'playing' ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons Stack - Perfectly matching GpButtons */}
            <div className="flex flex-col gap-3 mt-6 relative z-10">
              {/* Primary Action Button */}
              <GpButton
                onClick={() => {
                  stopTtsAudio();
                  onConfirm(amount);
                }}
                size="lg"
                variant="primary"
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                {getConfirmButtonText(amount, preferredLanguage)}
              </GpButton>

              {/* Secondary Edit Manually Button */}
              <GpButton
                onClick={() => {
                  stopTtsAudio();
                  onEditManually();
                }}
                size="lg"
                variant="secondary"
                className="w-full"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Manually
              </GpButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoiceConfirmationSheet;
