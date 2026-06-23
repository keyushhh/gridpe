import { useIsDarkMode } from '@/hooks/useIsDarkMode';

interface GpSectionLabelProps {
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

export function GpSectionLabel({
  size = 'md',
  className = '',
  children,
}: GpSectionLabelProps) {
  const isDarkMode = useIsDarkMode();

  const sizes = {
    sm: 'text-[12px]',
    md: 'text-[14px]',
  };

  return (
    <p
      className={`
        ${sizes[size]}
        font-bold font-sans tracking-widest uppercase mb-[6px]
        ${isDarkMode ? 'text-brand-text-muted' : 'text-black/50'}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </p>
  );
}

export default GpSectionLabel;
