import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Pause, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Sliders,
  PhoneOff,
  ArrowRight,
  Settings
} from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';

export type VoiceConversationState = 'listening' | 'thinking' | 'speaking' | 'idle';

export interface SlotState {
  amount: number | null;
  addressLabel: string | null;
  confirmed: boolean;
}


export interface VoiceConversationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (slots: SlotState) => void;
}

interface ScriptStep {
  stepIndex: number;
  assistantPrompt: string;
  userReply: string;
  updatedSlots: Partial<SlotState>;
  isFinal?: boolean;
}

const CONVERSATION_SCRIPT: ScriptStep[] = [
  {
    stepIndex: 0,
    assistantPrompt: 'How much cash do you need?',
    userReply: '2000',
    updatedSlots: { amount: 2000 },
  },
  {
    stepIndex: 1,
    assistantPrompt: 'Delivering ₹2000 to your default address, Home — is that right?',
    userReply: 'yes',
    updatedSlots: { addressLabel: 'Home' },
  },
  {
    stepIndex: 2,
    assistantPrompt: 'Confirm ₹2000 to Home?',
    userReply: 'yes',
    updatedSlots: { confirmed: true },
  },
  {
    stepIndex: 3,
    assistantPrompt: 'Done! Your ₹2000 is on the way.',
    userReply: '',
    updatedSlots: {},
    isFinal: true,
  },
];

/**
 * Animated Aurora Purple Flow Canvas
 * Softened, single-hue #5260FE aurora plumes fading naturally into deep pitch black (#000000).
 */
const AuroraPurpleBackground: React.FC<{ conversationState: VoiceConversationState; isHold: boolean }> = ({
  conversationState,
  isHold,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = (canvas.width = window.innerWidth * dpr);
    let h = (canvas.height = window.innerHeight * dpr);

    // Drifting particle motes
    const PARTICLE_COUNT = 45;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * (h * 0.75),
      r: (0.4 + Math.random() * 1.4) * dpr,
      o: 0.12 + Math.random() * 0.55,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      vy: (0.1 + Math.random() * 0.4) * dpr,
    }));

    let time = 0;

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, w, h);

      // 1. Base deep pitch black fill
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // 2. Softened Multi-Node Organic Asymmetrical Plumes (#5260FE: rgb 82, 96, 254)
      // Plume 1: Main Center-Left Plume
      const p1x = w * (0.38 + Math.sin(time * 0.7) * 0.12);
      const p1y = h * (0.32 + Math.cos(time * 0.5) * 0.08);
      const p1r = Math.max(w, h) * (0.58 + Math.sin(time * 0.6) * 0.05);
      const g1 = ctx.createRadialGradient(p1x, p1y, 0, p1x, p1y, p1r);
      g1.addColorStop(0, 'rgba(82, 96, 254, 0.40)');
      g1.addColorStop(0.38, 'rgba(82, 96, 254, 0.20)');
      g1.addColorStop(0.72, 'rgba(82, 96, 254, 0.04)');
      g1.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Plume 2: Deep Right-Side Flow
      const p2x = w * (0.72 + Math.cos(time * 0.6) * 0.14);
      const p2y = h * (0.42 + Math.sin(time * 0.8) * 0.1);
      const p2r = Math.max(w, h) * (0.62 + Math.cos(time * 0.5) * 0.06);
      const g2 = ctx.createRadialGradient(p2x, p2y, 0, p2x, p2y, p2r);
      g2.addColorStop(0, 'rgba(82, 96, 254, 0.35)');
      g2.addColorStop(0.42, 'rgba(82, 96, 254, 0.16)');
      g2.addColorStop(0.78, 'rgba(82, 96, 254, 0.03)');
      g2.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Plume 3: Center Ambient Tongue
      const stateBoost = isHold ? 0.15 : conversationState === 'speaking' ? 0.32 : conversationState === 'listening' ? 0.36 : conversationState === 'thinking' ? 0.40 : 0.25;
      const p3x = w * (0.5 + Math.sin(time * 0.9) * 0.08);
      const p3y = h * (0.50 + Math.cos(time * 0.7) * 0.07);
      const p3r = Math.max(w, h) * 0.46;
      const g3 = ctx.createRadialGradient(p3x, p3y, 0, p3x, p3y, p3r);
      g3.addColorStop(0, `rgba(82, 96, 254, ${stateBoost})`);
      g3.addColorStop(0.5, `rgba(82, 96, 254, ${stateBoost * 0.35})`);
      g3.addColorStop(0.85, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Plume 4: Top-Left Header Wash
      const p4x = w * (0.15 + Math.cos(time * 0.4) * 0.1);
      const p4y = h * (0.12 + Math.sin(time * 0.6) * 0.06);
      const p4r = Math.max(w, h) * 0.45;
      const g4 = ctx.createRadialGradient(p4x, p4y, 0, p4x, p4y, p4r);
      g4.addColorStop(0, 'rgba(82, 96, 254, 0.30)');
      g4.addColorStop(0.55, 'rgba(82, 96, 254, 0.10)');
      g4.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = g4;
      ctx.fillRect(0, 0, w, h);

      // 3. Softened Animated Organic Undulating Wave Contour (Full Screen Fill)
      ctx.save();
      const waveGrad = ctx.createRadialGradient(w * 0.5 + Math.sin(time * 0.5) * (w * 0.2), 0, 0, w * 0.5 + Math.sin(time * 0.5) * (w * 0.2), 0, h * 0.85);
      waveGrad.addColorStop(0, 'rgba(82, 96, 254, 0.32)');
      waveGrad.addColorStop(0.45, 'rgba(82, 96, 254, 0.14)');
      waveGrad.addColorStop(0.8, 'rgba(82, 96, 254, 0.02)');
      waveGrad.addColorStop(1, 'rgba(82, 96, 254, 0)');
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 4. Drifting Particle Motes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const verticalFade = Math.max(0, Math.min(1, 1 - (p.y / (h * 0.75))));
        if (verticalFade > 0.04) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.o * verticalFade * 0.75})`;
          ctx.fill();
        }
      }

      // 5. Seamless Full-Screen Bottom Darkness Dissolve (0 to h, completely eliminating any seams)
      const bottomDarkness = ctx.createLinearGradient(0, 0, 0, h);
      bottomDarkness.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottomDarkness.addColorStop(0.38, 'rgba(0, 0, 0, 0)');
      bottomDarkness.addColorStop(0.58, 'rgba(0, 0, 0, 0.45)');
      bottomDarkness.addColorStop(0.82, 'rgba(0, 0, 0, 0.92)');
      bottomDarkness.addColorStop(1, '#000000');
      ctx.fillStyle = bottomDarkness;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [conversationState, isHold]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
};

export const VoiceConversationOverlay: React.FC<VoiceConversationOverlayProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  // Client-side state machine
  const [conversationState, setConversationState] = useState<VoiceConversationState>('speaking');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [slots, setSlots] = useState<SlotState>({
    amount: null,
    addressLabel: null,
    confirmed: false,
  });
  const [isHold, setIsHold] = useState<boolean>(false);
  const [showDevControls, setShowDevControls] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');

  // Full reset
  const handleReset = useCallback(() => {
    setCurrentStepIndex(0);
    setConversationState('speaking');
    setSlots({
      amount: null,
      addressLabel: null,
      confirmed: false,
    });
    setCurrentTranscript('');
    setIsHold(false);
  }, []);

  const handleEnd = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  // Jump directly to a step index in the script
  const goToStep = useCallback((stepIdx: number) => {
    const clampedIndex = Math.max(0, Math.min(stepIdx, CONVERSATION_SCRIPT.length - 1));
    const step = CONVERSATION_SCRIPT[clampedIndex];
    setCurrentStepIndex(clampedIndex);

    const cumulativeSlots: SlotState = {
      amount: null,
      addressLabel: null,
      confirmed: false,
    };
    for (let i = 0; i < clampedIndex; i++) {
      Object.assign(cumulativeSlots, CONVERSATION_SCRIPT[i].updatedSlots);
    }
    setSlots(cumulativeSlots);
    setCurrentTranscript('');
    setConversationState('speaking');
    setIsHold(false);
  }, []);

  // Simulate user answering the current prompt
  const handleSimulateUserReply = useCallback(() => {
    const step = CONVERSATION_SCRIPT[currentStepIndex];
    if (step.isFinal) {
      if (onComplete) {
        onComplete(slots);
      }
      return;
    }

    // 1. Show user reply transcript and set state to 'thinking'
    setCurrentTranscript(step.userReply);
    setConversationState('thinking');

    // 2. Fill slot
    const updated = { ...slots, ...step.updatedSlots };
    setSlots(updated);

    // 3. Advance to next step
    if (currentStepIndex < CONVERSATION_SCRIPT.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setConversationState('speaking');
      if (CONVERSATION_SCRIPT[nextIdx].isFinal && onComplete) {
        onComplete(updated);
      }
    }
  }, [currentStepIndex, slots, onComplete]);

  // Reset to Step 1 whenever overlay opens
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen, handleReset]);

  // Handle Hold toggle
  const toggleHold = () => {
    if (isHold) {
      setIsHold(false);
      setConversationState('speaking');
    } else {
      setIsHold(true);
      setConversationState('idle');
    }
  };

  if (!isOpen) return null;

  const currentStep = CONVERSATION_SCRIPT[Math.min(currentStepIndex, CONVERSATION_SCRIPT.length - 1)];

  const getOrbState = (): 'working' | 'listening' | 'composing' | 'breathing' => {
    switch (conversationState) {
      case 'listening':
        return 'listening';
      case 'thinking':
        return 'working';
      case 'speaking':
        return 'composing';
      case 'idle':
      default:
        return 'breathing';
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden select-none bg-[#000000] font-satoshi"
        style={{
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        {/* ================= HORIZONTAL TOP-TO-BOTTOM ANIMATED PURPLE AURORA CANOPY (#5260FE) ================= */}
        <AuroraPurpleBackground conversationState={conversationState} isHold={isHold} />

        {/* ================= SUBTLE CINEMATIC FILM GRAIN TEXTURE ================= */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-[2]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
          aria-hidden="true"
        />

        {/* ================= TOP HEADER BAR (Minimal: Dev Settings Only) ================= */}
        <div className="relative z-10 flex items-center justify-end px-6 pt-12 pb-2 safe-top">
          <button
            type="button"
            onClick={() => setShowDevControls((prev) => !prev)}
            aria-label="Toggle Dev Controls"
            title="Toggle Dev Scaffolding Panel"
            className={`p-2 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
              showDevControls
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* ================= CENTER SECTION (ThinkingOrb + Single Prompt) ================= */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto w-full text-center -translate-y-6 sm:-translate-y-8">

          {/* ThinkingOrb with luminous ambient glow behind it (scaled to 100px) */}
          <div className="relative mb-7 flex items-center justify-center w-[100px] h-[100px]">
            
            {/* Tier 1: Wide Outer Radiant Halo (220px) */}
            <motion.div
              animate={{
                scale: conversationState === 'speaking' ? [1, 1.25, 1] : conversationState === 'listening' ? [1, 1.35, 1] : conversationState === 'thinking' ? [1.1, 1.45, 1.1] : [0.95, 1.15, 0.95],
                opacity: isHold ? 0.35 : conversationState === 'thinking' ? [0.8, 1, 0.8] : conversationState === 'listening' ? [0.75, 0.95, 0.75] : [0.6, 0.85, 0.6],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-14 rounded-full pointer-events-none blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(82, 96, 254, 0.75) 0%, rgba(82, 96, 254, 0.35) 45%, transparent 72%)',
              }}
            />

            {/* Tier 2: Focused Mid-Core Glow (140px) */}
            <motion.div
              animate={{
                scale: conversationState === 'speaking' ? [1, 1.18, 1] : [1, 1.1, 1],
                opacity: isHold ? 0.4 : [0.7, 0.95, 0.7],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-5 rounded-full pointer-events-none blur-lg"
              style={{
                background: 'radial-gradient(circle, rgba(82, 96, 254, 0.9) 0%, rgba(82, 96, 254, 0.5) 55%, transparent 75%)',
              }}
            />

            {/* ThinkingOrb from 'thinking-orbs' scaled to 100px with photon drop-shadow */}
            <div 
              className="relative z-10"
              style={{ 
                transform: 'scale(1.5625)', 
                transformOrigin: 'center',
                filter: 'drop-shadow(0 0 16px rgba(82, 96, 254, 0.75)) drop-shadow(0 0 32px rgba(82, 96, 254, 0.45))',
              }}
            >
              <ThinkingOrb
                state={getOrbState()}
                size={64}
                speed={0.70}
                theme="dark"
              />
            </div>
          </div>

          {/* Single Assistant Prompt Text */}
          <motion.div
            key={currentStep?.assistantPrompt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-5"
          >
            <h1 className="text-[20px] sm:text-[22px] font-medium font-satoshi text-white/95 tracking-normal leading-[1.35] text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {currentStep?.assistantPrompt || 'Listening...'}
            </h1>
          </motion.div>

          {/* User Spoken Transcript */}
          <div className="min-h-[48px] flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {currentTranscript ? (
                <motion.div
                  key={currentTranscript}
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  className="px-4 py-2 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl shadow-lg inline-flex items-center gap-2"
                >
                  <Mic className="w-3.5 h-3.5 text-[#8E97FD] animate-pulse shrink-0" />
                  <span className="text-[14px] text-white/95 font-normal italic font-satoshi">
                    &ldquo;{currentTranscript}&rdquo;
                  </span>
                </motion.div>
              ) : conversationState === 'listening' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-2 text-white/60 text-[13px] font-normal font-satoshi"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5260FE] animate-ping" />
                  <span>Speak your answer now...</span>
                </motion.div>
              ) : conversationState === 'thinking' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-2 text-[#8E97FD] text-[13px] font-medium font-satoshi"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Placing order & processing...</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* ================= BOTTOM CONTROLS (Clean Circular Buttons) ================= */}
        <div className="relative z-10 px-6 pb-12 safe-bottom flex flex-col items-center gap-3.5">
          
          {/* Circular Action Icons: Hold & End */}
          <div className="flex items-center justify-center gap-6">
            {/* Hold Button (Clean Frosted Circle, No Glow) */}
            <button
              type="button"
              onClick={toggleHold}
              aria-label={isHold ? 'Resume conversation' : 'Hold conversation'}
              title={isHold ? 'Resume' : 'Hold'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 border backdrop-blur-2xl cursor-pointer ${
                isHold
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border-white/[0.12]'
              }`}
            >
              {isHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>

            {/* End Call Button (Clean Red Circle, No Glow — Also Closes Overlay) */}
            <button
              type="button"
              onClick={handleEnd}
              aria-label="End conversation and close"
              title="End conversation"
              className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/35 text-red-400 hover:text-red-300 flex items-center justify-center transition-all duration-200 active:scale-90 backdrop-blur-2xl cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* ================= DEV TEST SCAFFOLDING PANEL (TOGGLEABLE) ================= */}
          <AnimatePresence>
            {showDevControls && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-sm rounded-2xl p-3.5 bg-black/90 border border-amber-500/30 backdrop-blur-2xl shadow-2xl mt-1 font-satoshi"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3 h-3" /> Dev Test Scaffolding
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-white/60 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Step 1
                  </button>
                </div>

                {/* Step Advance Trigger */}
                {!currentStep.isFinal && (
                  <button
                    type="button"
                    onClick={handleSimulateUserReply}
                    className="w-full mb-2.5 py-2 px-3 rounded-xl bg-[#5260FE]/35 hover:bg-[#5260FE]/50 border border-[#5260FE]/40 text-white text-[12px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm font-satoshi"
                  >
                    <span>Simulate Mock Reply: &ldquo;{currentStep.userReply}&rdquo;</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Step Jump Grid */}
                <div className="mb-2">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 font-semibold">
                    Script Steps:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CONVERSATION_SCRIPT.map((step, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToStep(idx)}
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all cursor-pointer font-satoshi ${
                          currentStepIndex === idx
                            ? 'bg-[#5260FE]/30 text-[#C4C9FE] border-[#5260FE]/60 font-bold'
                            : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Step {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orb State Force Buttons (The 4 exact requested states) */}
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 font-semibold">
                    Orb State (Exact 4 Presets):
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Breathing', state: 'idle' as const },
                      { label: 'Listening', state: 'listening' as const },
                      { label: 'Composing', state: 'speaking' as const },
                      { label: 'Working', state: 'thinking' as const },
                    ].map(({ label, state }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setConversationState(state)}
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-medium capitalize border transition-all cursor-pointer font-satoshi ${
                          conversationState === state
                            ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 font-bold'
                            : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AnimatePresence>
  );
};

export default VoiceConversationOverlay;
