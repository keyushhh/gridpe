import React from 'react';
import Skeleton from 'react-loading-skeleton';

const WalletSkeleton = () => {
  return (
    <div
      className="h-full w-full flex flex-col pt-4 px-5 safe-top bg-white dark:bg-brand-bg-dark"
    >
      {/* Header with Back Button and Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-full flex justify-between items-center mb-6">
          <Skeleton circle width={40} height={40} />
          <Skeleton width={159} height={57} />
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Tab Switcher */}
        <Skeleton width={362} height={62} borderRadius={31} />
      </div>

      {/* Content List */}
      <div className="flex-1 space-y-8 pt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton circle width={6} height={6} />
              <Skeleton width={200} height={18} />
            </div>
            <div className="pl-4">
              <Skeleton count={2} height={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Button */}
      <div className="safe-bottom pb-4 pt-4">
        <Skeleton width="100%" height={48} borderRadius={24} />
      </div>
    </div>
  );
};

export default WalletSkeleton;
