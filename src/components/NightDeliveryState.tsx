import { ASSETS } from '@/constants/assets';
import React from 'react';
import { ChevronDown, Home, Briefcase, Users, MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { SavedAddress } from '@/types/user';
interface NightDeliveryStateProps {
  isDarkMode: boolean;
  savedAddress: SavedAddress | null;
  profileImage: string | null;
  name: string | null;
  planTier: string;
  onAddressClick: () => void;
  onProfileClick: () => void;
}
const NightDeliveryState: React.FC<NightDeliveryStateProps> = ({
  isDarkMode,
  savedAddress,
  profileImage,
  name,
  planTier,
  onAddressClick,
  onProfileClick,
}) => {
  const getAddressDisplay = () => {
    if (!savedAddress) return 'Add Address';
    const parts = [savedAddress.house, savedAddress.area];
    return parts.filter(Boolean).join(', ');
  };
  const renderAddressIcon = () => {
    const IconProps = {
      size: 14,
      color: isDarkMode ? '#FFFFFF' : '#5260FE',
      strokeWidth: 2.5,
    };
    if (!savedAddress) return <Home {...IconProps} />;
    switch (savedAddress.tag) {
      case 'Home':
        return <Home {...IconProps} />;
      case 'Work':
        return <Briefcase {...IconProps} />;
      case 'Friends & Family':
        return <Users {...IconProps} />;
      case 'Other':
        return <MapPin {...IconProps} />;
      default:
        return <Home {...IconProps} />;
    }
  };
  return (
    <div
      id="DeliveryStatusContainer"
      className={cn(
        'w-full rounded-b-[32px] flex flex-col relative overflow-hidden shrink-0 pb-[8px]',
        isDarkMode ? 'bg-black/50' : 'bg-white/80'
      )}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Top Row: Header Elements */}
      <div className="px-5 pt-4 flex items-start justify-between relative z-10 safe-top">
        <div className="space-y-1 max-w-[70%]">
          {savedAddress ? (
            <div className="flex items-center gap-1">
              {renderAddressIcon()}
              <p className="text-[14px] font-bold text-foreground font-satoshi tracking-wider uppercase">
                {savedAddress.tag}
              </p>
            </div>
          ) : (
            <p
              className="text-[14px] text-black dark:text-muted-foreground font-medium tracking-wider"
              style={{ fontVariant: 'small-caps' }}
            >
              {name ? `hi, ${name.split(' ')[0]}` : 'delivering'}
            </p>
          )}
          <button
            onClick={onAddressClick}
            className="flex items-center gap-1 text-foreground text-[14px] font-normal w-full"
          >
            <span className="truncate block text-black dark:text-foreground">
              {getAddressDisplay()}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0 text-black dark:text-foreground" />
          </button>
        </div>
        <button onClick={onProfileClick}>
          <img loading="lazy"
            src={profileImage || ASSETS.AVATAR}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover"
          />
        </button>
      </div>
      {/* Middle Content */}
      <div className="px-5 flex items-start justify-between" style={{ marginTop: '25px', marginBottom: '2px' }}>
        <div className="flex flex-col items-start max-w-[65%]">
          <h2 className="text-[20px] font-bold font-satoshi text-foreground leading-tight">
            You want cash now? Bold.
          </h2>
          <p className="text-[14px] font-normal font-satoshi text-foreground/80 mt-[6px] leading-snug">
            {planTier === 'pro'
              ? "We're back at 6 AM. Pro members can schedule now."
              : "Pro members can schedule now to skip the morning queue."}
          </p>
        </div>
        {/* Right side Illustration: Lottie Animation */}
        <div
          className="w-[140px] h-[140px] flex items-center justify-center mr-2"
          style={{ marginTop: '-35px', marginBottom: '-20px' }}
        >
          <DotLottieReact
            src="https://lottie.host/421c2864-0fa9-4840-b130-3d06580e97a6/aGb0cAR9AZ.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    </div>
  );
};
export default NightDeliveryState;
