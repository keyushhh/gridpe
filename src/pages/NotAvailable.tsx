import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from 'react-router-dom';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { ROUTES } from '@/routes';

interface NotAvailableProps {
  onOpenAddressSheet?: () => void;
}

const NotAvailable: React.FC<NotAvailableProps> = ({ onOpenAddressSheet }) => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();

  return (
    <div className="flex-1 flex flex-col items-center justify-center -mt-32 px-5 z-10 transition-colors duration-300 pointer-events-none">
      {/* Lottie Animation */}
      <div className="w-full flex justify-center mb-0 pointer-events-auto">
        <div className="w-full max-w-[360px] h-[360px]">
          <DotLottieReact
            src="https://lottie.host/76ba3fa9-573d-48bc-9d38-970272d420ad/a87cMSjFsq.lottie"
            autoplay
            speed={0.5}
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col items-center text-center -mt-8 pointer-events-auto">
        {/* Heading */}
        <h2
          className={`font-satoshi font-bold text-[16px] leading-[22px] max-w-[336px] ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Sorry! We’re not available at this location yet!
        </h2>

        {/* Body Text */}
        <p
          className={`font-satoshi font-medium text-[14px] leading-[19px] mt-[10px] max-w-[322px] ${isDarkMode ? 'text-white/60' : 'text-brand-text-muted'}`}
        >
          Grid.Pe is not available at this location yet, our team is working tirelessly to bring
          Grid.Pe to you at the earliest. Please revist after a while.
        </p>

        {/* Change Location CTA */}
        <button
          onClick={() => {
            if (onOpenAddressSheet) {
              onOpenAddressSheet();
            } else {
              navigate(ROUTES.HOME);
            }
          }}
          className="mt-[30px] w-[206px] h-[48px] rounded-full bg-brand-primary text-white font-satoshi font-medium text-[16px] flex items-center justify-center active:scale-95 transition-transform"
          style={{
            boxShadow: '0px 8px 24px rgba(82, 96, 254, 0.25)',
          }}
        >
          Change Location
        </button>
      </div>
    </div>
  );
};

export default NotAvailable;
