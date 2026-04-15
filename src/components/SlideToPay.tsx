import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from "next-themes";
import { hapticMedium } from "@/utils/haptics";
import { ChevronRight } from 'lucide-react';
import slideTrack from '@/assets/slide-to-pay-track.png';
import slideSuccess from '@/assets/slide-to-pay-success.png';
import swipeCircle from '@/assets/swipe-circle.png';
import swipeIcon from '@/assets/swipe.svg';

interface SlideToPayProps {
  onComplete: () => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export const SlideToPay: React.FC<SlideToPayProps> = ({ onComplete, className = "", disabled = false, label = "Confirm and Place Order" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [completed, setCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (completed || disabled) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX - dragX;
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || completed || disabled || !trackRef.current || !thumbRef.current) return;

    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const newX = clientX - startX.current;

    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    const maxDrag = trackWidth - thumbWidth - (trackWidth * 0.05);

    if (newX >= 0 && newX <= maxDrag) {
      setDragX(newX);
    } else if (newX > maxDrag) {
      setDragX(maxDrag);
    }
  };

  const handleEnd = () => {
    if (!isDragging || completed) return;
    setIsDragging(false);

    if (!trackRef.current || !thumbRef.current) return;

    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    const maxDrag = trackWidth - thumbWidth - (trackWidth * 0.05);

    if (dragX > maxDrag * 0.85) {
      hapticMedium();
      setCompleted(true);
      setDragX(maxDrag);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setDragX(0);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
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
  }, [isDragging, dragX, completed]);

  return (
    <div
      ref={trackRef}
      data-testid="slide-to-pay-track"
      className={`relative w-full select-none ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${className}`}
      style={{
        aspectRatio: '1444/256',
        backgroundImage: completed
          ? `url(${slideSuccess})`
          : isDarkMode
            ? `url(${slideTrack})`
            : 'none',
        backgroundColor: !isDarkMode && !completed ? '#000000' : 'transparent',
        border: !isDarkMode && !completed ? '1px solid #000000' : 'none',
        borderRadius: !isDarkMode ? '9999px' : '0',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s ease, background-color 0.3s ease, border 0.3s ease'
      }}
    >
      {/* Overlay Text */}
      <div
        data-testid="slide-to-pay-text"
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300`}
      >
        <span className={`text-[16px] font-medium font-sans tracking-wide drop-shadow-md text-white ${!completed && 'ml-8'}`}>
          {completed ? "Verifying Order" : label}
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
            transform: `translate(${dragX}px, -50%)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            height: '82%',
            aspectRatio: '1/1',
            backgroundImage: !isDarkMode ? 'none' : `url(${swipeCircle})`,
            backgroundColor: !isDarkMode ? '#0D992F' : 'transparent',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            borderRadius: '50%', // Ensure it's a circle
            filter: !isDarkMode ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none'
          }}
        >
          {/* Swipe Icon */}
          {!isDarkMode ? (
            <ChevronRight className="text-white w-8 h-8" />
          ) : (
            <img
              src={swipeIcon}
              alt=""
              className="w-[40%] h-[40%] object-contain pointer-events-none"
            />
          )}
        </div>
      )}
    </div>
  );
};
