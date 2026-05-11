import { ASSETS } from '@/constants/assets';
import { useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
const tierLimits: Record<string, number> = {
  Starter: 5000,
  Pro: 15000,
  Elite: 50000,
  Supreme: 150000,
};
interface BalanceAlertProps {
  className?: string;
}
const BalanceAlert = ({ className = '' }: BalanceAlertProps) => {
  const { walletBalance, scheduledDowngrade } = useUser();
  const alertData = useMemo(() => {
    if (!scheduledDowngrade || walletBalance <= 0) return null;
    const limit = tierLimits[scheduledDowngrade.tier] || 0;
    if (walletBalance <= limit) return null;
    const excess = walletBalance - limit;
    const targetDate = new Date(scheduledDowngrade.effectiveDate);
    const diffTime = targetDate.getTime() - new Date().getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return { days: diffDays, excess, targetTier: scheduledDowngrade.tier };
  }, [scheduledDowngrade, walletBalance]);
  if (!alertData) return null;
  return (
    <div
      className={`p-4 rounded-[13px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#FF3B30]/20 flex items-center justify-center shrink-0">
        <img src={ASSETS.FAILED} alt="Alert" className="w-6 h-6" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-[#FF4248] text-[14px] font-bold font-satoshi leading-tight">
          Balance Alert
        </p>
        <p className="text-[#FF4248]/80 text-[12px] font-medium font-satoshi mt-1 leading-tight">
          You have {alertData.days} days to use ₹
          {Math.floor(alertData.excess).toLocaleString('en-IN')} before it expires due to{' '}
          {alertData.targetTier} limit.
        </p>
      </div>
    </div>
  );
};
export default BalanceAlert;
