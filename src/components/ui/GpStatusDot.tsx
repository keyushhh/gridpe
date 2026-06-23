interface GpStatusDotProps {
  status: 'active' | 'pending' | 'cancelled' | 'delivered' | 'warning' | 'review';
  className?: string;
}

const statusConfig: Record<GpStatusDotProps['status'], { bg: string; shadow: string }> = {
  active: {
    bg: 'bg-brand-success',
    shadow: 'shadow-[0_0_8px_rgba(28,185,86,0.5)]',
  },
  delivered: {
    bg: 'bg-brand-success',
    shadow: 'shadow-[0_0_8px_rgba(28,185,86,0.5)]',
  },
  pending: {
    bg: 'bg-brand-warning',
    shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.5)]',
  },
  review: {
    bg: 'bg-brand-warning-gold',
    shadow: 'shadow-[0_0_8px_rgba(234,179,8,0.5)]',
  },
  warning: {
    bg: 'bg-brand-amber',
    shadow: 'shadow-[0_0_8px_rgba(255,149,0,0.5)]',
  },
  cancelled: {
    bg: 'bg-brand-error-light',
    shadow: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  },
};

export function GpStatusDot({ status, className = '' }: GpStatusDotProps) {
  const { bg, shadow } = statusConfig[status];

  return (
    <div
      className={`w-[12px] h-[12px] rounded-full ${bg} ${shadow} ${className}`}
    />
  );
}

export default GpStatusDot;
