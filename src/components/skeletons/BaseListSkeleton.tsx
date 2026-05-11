import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { useTheme } from 'next-themes';

interface BaseListSkeletonProps {
  rows?: number;
}

const BaseListSkeleton: React.FC<BaseListSkeletonProps> = ({ rows = 5 }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';

  return (
    <div className="w-full flex flex-col gap-4" data-testid="base-list-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center justify-between p-4 rounded-[12px] border ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}
        >
          <div className="flex items-center gap-4 w-full">
            <Skeleton circle width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BaseListSkeleton;
