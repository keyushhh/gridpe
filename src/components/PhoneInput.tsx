import React, { memo, useCallback, useState } from 'react';
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const PhoneInputImpl = React.forwardRef<HTMLInputElement, PhoneInputProps>(({
  value,
  onChange,
  countryCode = "+91",
  placeholder = "Enter your mobile number",
  className,
  error,
  disabled,
  onFocus,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = e.target.value.replace(/\D/g, "");
      onChange(numericValue);
    },
    [onChange]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <div
      className={cn(
        "flex items-center h-[48px] rounded-full transition-all duration-200",
        "bg-[#F7F8FA] dark:bg-input border border-[#E6E8EB] dark:border-transparent",
        isFocused && !error && "ring-2 ring-primary/50 border-primary/50",
        error && "border-red-500 ring-1 ring-red-500",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div className="flex items-center px-4 border-r border-border/50">
        <span className="text-muted-foreground font-normal text-sm">
          {countryCode}
        </span>
      </div>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="tel-national"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 h-full bg-transparent px-4 text-sm font-normal text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        maxLength={10}
      />
    </div>
  );
});

export const PhoneInput = memo(PhoneInputImpl);
