import { useIsDarkMode } from '@/hooks/useIsDarkMode';

interface GpButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const ButtonSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v8z"
    />
  </svg>
);

export function GpButton({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  children,
  type = 'button',
}: GpButtonProps) {
  const isDarkMode = useIsDarkMode();

  const base =
    'rounded-full active:scale-95 transition-all flex items-center justify-center font-satoshi font-medium text-[16px] select-none';

  const sizes = {
    md: 'h-[48px]',
    lg: 'h-[52px]',
  };

  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
    secondary: isDarkMode
      ? 'bg-transparent border border-white/20 text-white hover:bg-white/5'
      : 'bg-transparent border border-brand-border-light text-black hover:bg-black/5',
    destructive: 'bg-brand-error-light text-white hover:bg-brand-error-light/90',
  };

  const width = fullWidth ? 'w-full' : '';

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${base}
        ${sizes[size]}
        ${variants[variant]}
        ${width}
        ${isDisabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {isLoading ? <ButtonSpinner /> : children}
    </button>
  );
}

export default GpButton;
