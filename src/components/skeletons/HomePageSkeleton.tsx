import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

const HomePageSkeleton = () => {
  const isDarkMode = useIsDarkMode();

  return (
    <div
      className={`h-full w-full flex flex-col pt-4 px-5 safe-top pb-24 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <Skeleton width={80} height={14} />
          <Skeleton width={180} height={18} />
        </div>
        <Skeleton circle width={48} height={48} />
      </div>

      {/* Balance Section */}
      <div className="flex flex-col items-center mb-8 space-y-4">
        <Skeleton width={120} height={14} />
        <Skeleton width={200} height={40} />
        <Skeleton width={160} height={44} borderRadius={22} />
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-8 mb-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton circle width={52} height={52} />
            <Skeleton width={60} height={12} />
          </div>
        ))}
      </div>

      {/* Banner/Active Order */}
      <div className="w-full mb-8">
        <Skeleton height={140} borderRadius={13} />
      </div>

      {/* Recent History Label */}
      <div className="mb-4">
        <Skeleton width={100} height={16} />
      </div>

      {/* History Items */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-[13px] border border-white/5 bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Skeleton circle width={40} height={40} />
              <div className="space-y-1">
                <Skeleton width={120} height={16} />
                <Skeleton width={80} height={12} />
              </div>
            </div>
            <div className="text-right">
              <Skeleton width={60} height={16} />
              <Skeleton width={40} height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePageSkeleton;
