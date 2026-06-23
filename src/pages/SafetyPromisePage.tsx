import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useAsset } from '@/hooks/useAsset';
import { ASSETS } from '@/constants/assets';
import safetyGradient from '@/assets/safety-gradient.png';
import safetyIllustration from '@/assets/safety-illustration.svg';
import logo from '@/assets/logo.svg';
import { X } from 'lucide-react';

const SafetyPromisePage = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${mainBg})` }}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-8 safe-top pt-8">
        {/* Banner Section */}
        <div
          className="relative w-full rounded-[24px] overflow-hidden"
          style={{
            backgroundImage: `url(${safetyGradient})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => navigate(-1)}
              className="w-[32px] h-[32px] rounded-full border-[1.5px] border-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <X size={16} color="white" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center pt-3 pb-3 px-4">
            <img loading="lazy"
              src={safetyIllustration}
              alt="Safety Illustration"
              className="w-[75px] h-[72px] mb-3 object-contain"
            />
            <h2 className="font-satoshi font-bold text-[16px] text-white text-center">
              Safety Promise
            </h2>
            <p className="font-satoshi font-medium text-[14px] text-white text-center mt-1.5 w-[220px] leading-[1.3]">
              Your cash, protected every step of the way.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-4 bg-brand-surface-mid rounded-[24px] p-5 pb-8 border border-white/[0.05]">
          <h2 className="font-satoshi font-bold text-[22px] text-white leading-tight">
            Why We're Different
          </h2>
          <p className="font-satoshi text-[14px] text-white/90 mt-1.5 leading-relaxed">
            A new way to access cash. A familiar feeling of security.
          </p>

          <p className="font-satoshi text-[14px] text-white/80 mt-6 leading-relaxed">
            At Grid.Pe, we believe convenience should never come at the cost of confidence. While having cash delivered to your doorstep may feel like a completely new experience, the principles behind it are simple: transparency, accountability, and trust.
          </p>

          <p className="font-satoshi text-[14px] text-white/80 mt-6 leading-relaxed">
            Every order is designed to be secure from start to finish, with verified delivery partners, real-time tracking, delivery verification working together behind the scenes. We don't just focus on getting cash to your doorstep. We focus on making sure you feel confident every step of the way.
          </p>

          <p className="font-satoshi text-[14px] text-white/80 mt-6 leading-relaxed">
            Because your money matters. And so does your peace of mind.
          </p>

          <div className="mt-8">
            <p className="text-[14px]">❤️</p>
            <p className="font-satoshi text-[14px] text-white mt-1 mb-2">Team</p>
            <img src={logo} alt="Grid.pe" className="w-[74px] h-[22px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyPromisePage;
