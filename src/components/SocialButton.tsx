import React from 'react';
import { cn } from '@/lib/utils';

interface SocialButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  label: string;
}

export const SocialButton = ({ icon, onClick, className, label }: SocialButtonProps) => {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200',
        'bg-secondary border border-border',
        'hover:bg-muted hover:scale-105',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        className
      )}
    >
      {icon}
    </button>
  );
};
