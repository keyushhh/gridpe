import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check, Edit3, Volume2, VolumeX, Loader2 } from 'lucide-react';
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopTtsAudio();
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full max-w-[480px] rounded-t-[32px] p-6 pb-8 relative z-10 shadow-2xl border-t ${
              isDarkMode
                ? 'bg-brand-surface-dark border-white/10 text-white'
                : 'bg-white border-black/5 text-black'
            }`}
          >
            {/* Handle Bar */}
            <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold font-sans">Confirm Spoken Amount</h3>
                  <p className={`text-[12px] ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                    Verified via Sarvam Saaras AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopTtsAudio();
                  onClose();
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-black/5 hover:bg-black/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transcript && (
              <div
                className={`p-3 rounded-xl mb-4 text-[13px] italic ${
                  isDarkMode ? 'bg-white/5 text-white/80' : 'bg-black/5 text-black/80'
                }`}
              >
                &ldquo;{transcript}&rdquo;
              </div>
            )}

            <div className="text-center my-4 py-2">
              <div className="flex items-center justify-center gap-2">
                <p className={`text-[14px] font-medium ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                  {getConfirmationLabel(preferredLanguage)}
                </p>
                <button
                  type="button"
                  onClick={handlePlayTts}
                  disabled={ttsState === 'loading'}
                  aria-label={ttsState === 'playing' ? 'Stop audio' : 'Play spoken confirmation'}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    ttsState === 'playing'
                      ? 'bg-brand-primary text-white shadow-sm animate-pulse'
                      : ttsState === 'loading'
                        ? 'bg-brand-primary/20 text-brand-primary cursor-wait'
                        : isDarkMode
                          ? 'bg-white/10 hover:bg-white/15 text-white'
                          : 'bg-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  {ttsState === 'loading' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  ) : ttsState === 'playing' ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-brand-primary" />
                  )}
                </button>
              </div>
              <p className="text-[36px] font-bold font-sans text-brand-primary mt-1">
                ₹{amount.toLocaleString('en-IN')}?
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-6">
              <GpButton
                onClick={() => {
                  stopTtsAudio();
                  onConfirm(amount);
                }}
                className="w-full h-[48px] bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full text-[15px] font-medium font-sans"
              >
                <Check className="w-4 h-4 mr-1.5" />
                {getConfirmButtonText(amount, preferredLanguage)}
              </GpButton>

              <button
                type="button"
                onClick={() => {
                  stopTtsAudio();
                  onEditManually();
                }}
                className={`w-full h-[44px] rounded-full text-[14px] font-medium font-sans flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/15 text-white'
                    : 'bg-black/5 hover:bg-black/10 text-black'
                }`}
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit Manually
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoiceConfirmationSheet;
