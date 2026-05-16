import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'btn-gradient text-white hover:brightness-110',
        glass:
          'glass-container text-white dark:text-foreground transition-all duration-300 hover:brightness-110 active:scale-[0.98]',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 rounded-full px-4 text-sm',
        lg: 'h-14 rounded-full px-8 text-lg',
        icon: 'h-12 w-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    if (variant === 'glass') {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {/* Layer 1: Bottom Refraction (SVG Filter) */}
          <div className="glass-lens" />

          {/* Layer 2: Middle Tint (Color foundations) */}
          <div
            className="absolute inset-0 z-[1.5] pointer-events-none rounded-inherit"
            style={{ backgroundColor: 'var(--glass-tint)' }}
          />

          {/* Layer 3: Top-most 'Contour Stroke' (Specular Rim) */}
          <span className="glass-rim-v2" />

          {/* Layer 4: Clear Content (Sharp Text/Icons) */}
          <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
        </Comp>
      );
    }

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
