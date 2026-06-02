import React from 'react';
import Skeleton from 'react-loading-skeleton';

interface CardSkeletonProps {
  height?: number | string;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ height = 160 }) => {
  return (
    <div
      className="w-full rounded-[20px] p-5 flex flex-col justify-between bg-black/5 border border-black/5 dark:bg-white/5 dark:border-white/5"
      style={{ height }}
      data-testid="card-skeleton"
    >
      <div className="space-y-3">
        <Skeleton width="50%" height={24} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="70%" height={16} />
      </div>
      <Skeleton width="40%" height={36} borderRadius={18} />
    </div>
  );
};

export default CardSkeleton;
