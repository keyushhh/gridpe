import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { useTheme } from 'next-themes';

const OrderDetailsSkeleton = () => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';

  return (
    <div
      className={`h-full w-full flex flex-col pt-4 px-5 safe-top ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="w-6" />
        <Skeleton width={150} height={20} />
        <Skeleton width={24} height={24} />
      </div>

      {/* Main Status Icon and Amount */}
      <div className="flex flex-col items-center mb-10">
        <Skeleton circle width={62} height={62} className="mb-8" />
        <Skeleton width={180} height={24} className="mb-2" />
        <Skeleton width={120} height={32} />
      </div>

      {/* Delivery Status & Map Block */}
      <div className="w-full mb-8">
        <div className="bg-black/20 h-10 w-full rounded-t-[14px]" />
        <div className="p-4 border border-white/5 rounded-b-[14px] flex justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton width="90%" height={16} />
            <Skeleton width="70%" height={14} />
          </div>
          <Skeleton width={110} height={82} borderRadius={8} />
        </div>
      </div>

      {/* Transaction Details Block */}
      <div className="w-full p-4 border border-white/5 rounded-[13px] space-y-4">
        <Skeleton width={140} height={18} />
        <div className="h-[1px] bg-white/5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between">
            <Skeleton width={100} height={14} />
            <Skeleton width={120} height={14} />
          </div>
        ))}
        <Skeleton count={2} height={12} />
      </div>

      {/* Bottom Button */}
      <div className="mt-auto safe-bottom pb-4 pt-8">
        <Skeleton width="100%" height={48} borderRadius={24} />
      </div>
    </div>
  );
};

export default OrderDetailsSkeleton;
