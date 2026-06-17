import { ASSETS } from '@/constants/assets';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { hapticMedium } from '@/utils/haptics';
import { ChevronRight } from 'lucide-react';
interface SlideToPayProps {
  onComplete: () => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}
export const SlideToPay: React.FC<SlideToPayProps> = ({
  onComplete,
  className = '',
  disabled = false,
  label = 'Confirm and Place Order',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragXRef = useRef(0);
  const [completed, setCompleted] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDarkMode = useIsDarkMode();
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (completed || disabled) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX - dragXRef.current;
  };
  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || completed || disabled || !trackRef.current || !thumbRef.current) return;
      const clientX =
        'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const newX = clientX - startX.current;
      const trackWidth = trackRef.current.clientWidth;
      const thumbWidth = thumbRef.current.clientWidth;
      const maxDrag = trackWidth - thumbWidth - trackWidth * 0.05;
      if (newX >= 0 && newX <= maxDrag) {
        setDragX(newX);
        dragXRef.current = newX;
      } else if (newX > maxDrag) {
        setDragX(maxDrag);
        dragXRef.current = maxDrag;
      }
    },
    [isDragging, completed, disabled]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging || completed) return;
    setIsDragging(false);
    if (!trackRef.current || !thumbRef.current) return;
    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    const maxDrag = trackWidth - thumbWidth - trackWidth * 0.05;
    if (dragXRef.current > maxDrag * 0.85) {
      hapticMedium();
      setCompleted(true);
      setDragX(maxDrag);
      dragXRef.current = maxDrag;
      const t = setTimeout(() => {
        if (mounted.current) onComplete();
      }, 2000);
      if (false) clearTimeout(t);
    } else {
      setDragX(0);
      dragXRef.current = 0;
    }
  }, [isDragging, completed, onComplete]);
  useEffect(() => {
    // touchmove must be `passive: true` on Android, or the WebView treats every
    // event as cancelable and serialises it on the main thread → drag jank.
    const passive: AddEventListenerOptions = { passive: true };
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, passive);
      window.addEventListener('touchend', handleEnd, passive);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);
  return (
    <div
      ref={trackRef}
      data-testid="slide-to-pay-track"
      className={`relative w-full select-none ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${className}`}
      style={{
        aspectRatio: '1444/256',
        backgroundImage: completed
          ? `url(${ASSETS.SLIDE_TO_PAY_SUCCESS})`
          : isDarkMode
            ? `url(${ASSETS.SLIDE_TO_PAY_TRACK})`
            : 'none',
        backgroundColor: !isDarkMode && !completed ? '#000000' : 'transparent',
        border: !isDarkMode && !completed ? '1px solid #000000' : 'none',
        borderRadius: !isDarkMode ? '9999px' : '0',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s ease, background-color 0.3s ease, border 0.3s ease',
      }}
    >
      {/* Overlay Text */}
      <div
        data-testid="slide-to-pay-text"
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300`}
      >
        <span
          className={`text-[16px] font-medium font-sans tracking-wide drop-shadow-md text-white ${!completed && 'ml-8'}`}
        >
          {completed ? 'Verifying Order' : label}
        </span>
      </div>
      {/* Thumb - Hide when completed */}
      {!completed && (
        <div
          ref={thumbRef}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          className="absolute top-1/2 left-[2%] cursor-grab active:cursor-grabbing z-10 flex items-center justify-center"
          style={{
            transform: `translate3d(${dragX}px, -50%, 0)`,
            transition: isDragging
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            willChange: 'transform',
            height: '82%',
            aspectRatio: '1/1',
            backgroundImage: !isDarkMode ? 'none' : `url(${ASSETS.SWIPE_CIRCLE})`,
            backgroundColor: !isDarkMode ? '#0D992F' : 'transparent',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            borderRadius: '50%', // Ensure it's a circle
            filter: !isDarkMode ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none',
          }}
        >
          {/* Swipe Icon */}
          {!isDarkMode ? (
            <ChevronRight className="text-white w-8 h-8" />
          ) : (
            <img loading="lazy"
              src={ASSETS.SWIPE}
              alt=""
              className="w-[40%] h-[40%] object-contain pointer-events-none"
            />
          )}
        </div>
      )}
    </div>
  );
};
