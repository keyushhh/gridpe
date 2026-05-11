import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, className }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 shrink-0 flex items-center justify-center rounded-full glass-container glass-physics-search relative z-20 overflow-hidden active:scale-95 transition-transform",
        className
      )}
    >
      <div className="glass-lens" />
      <div 
        className="absolute inset-0 z-[1] pointer-events-none" 
        style={{ backgroundColor: 'var(--glass-tint)' }} 
      />
      <span className="glass-rim-v2" />
      <ChevronLeft className={cn("w-6 h-6 relative z-10", isDarkMode ? "text-white" : "text-black")} />
    </button>
  );
};

export default BackButton;
