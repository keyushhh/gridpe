import React, { useContext, useEffect, useRef, useState } from 'react';
import { OTPInputContext } from 'input-otp';
import { cn } from '@/lib/utils';

const MASK_DELAY_MS = 1000;
const MASK_CHAR = '•';

interface MaskedInputOTPSlotProps extends React.ComponentPropsWithoutRef<'div'> {
  index: number;
}

/**
 * UPI-style MPIN slot. Shows the typed digit briefly (1s) then replaces it
 * with a bullet. Reveal/mask state is per-slot and self-managed: when a fresh
 * char arrives at this slot, it reveals + starts a timer; if the digit is
 * deleted before the timer fires, the timer is cancelled by cleanup. The
 * caller's MPIN state always holds the actual digits — this component only
 * controls what's *displayed*.
 */
export const MaskedInputOTPSlot = React.forwardRef<HTMLDivElement, MaskedInputOTPSlotProps>(
  ({ index, className, style, ...props }, ref) => {
    const ctx = useContext(OTPInputContext);
    const slot = ctx?.slots[index];
    const char = slot?.char;

    const [masked, setMasked] = useState(true);
    const prevCharRef = useRef<string | undefined>(undefined);

    useEffect(() => {
      if (char && char !== prevCharRef.current) {
        prevCharRef.current = char;
        setMasked(false);
        const timer = setTimeout(() => setMasked(true), MASK_DELAY_MS);
        return () => clearTimeout(timer);
      }
      if (!char) {
        prevCharRef.current = undefined;
        setMasked(true);
      }
    }, [char]);

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        style={style}
        {...props}
      >
        {char ? (masked ? MASK_CHAR : char) : ''}
      </div>
    );
  }
);
MaskedInputOTPSlot.displayName = 'MaskedInputOTPSlot';
