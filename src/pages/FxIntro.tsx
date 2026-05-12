import { ASSETS } from '@/constants/assets';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useUser } from '@/contexts/UserContext';
import { useAsset } from '@/hooks/useAsset';
import { useTheme } from 'next-themes';
const FxIntro = () => {
  const navigate = useNavigate();
  const { walletTier } = useUser();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  // Redirect if already upgraded
  React.useEffect(() => {
    if (walletTier !== 'Starter') {
      navigate(ROUTES.FX_EXCHANGE);
    }
  }, [walletTier, navigate]);
  return (
    <div
      className="min-h-screen w-full flex flex-col relative animate-in fade-in duration-500"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${mainBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* Header */}
      <div className="shrink-0 relative flex items-center justify-between w-full px-5 safe-top pt-4 pb-0 z-50">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi absolute left-1/2 -translate-x-1/2`}
        >
          FX Exchange
        </h1>
        <div className="w-10 h-10" />
      </div>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="w-full px-5 flex flex-col" style={{ paddingTop: '46px' }}>
          {/* Main Heading */}
          <h2
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-satoshi leading-tight`}
          >
            Requires Pro Wallet or above & KYC Verification
          </h2>
          {/* Prerequisites Section */}
          <div className="mt-6">
            <h3
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-satoshi`}
            >
              To access international FX, you'll need:
            </h3>
            <ul className="mt-3 space-y-3 pl-1">
              <li
                className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-regular font-satoshi leading-[150%]`}
              >
                • Passport/KYC — For secure, compliant transactions.
              </li>
              <li
                className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-regular font-satoshi leading-[150%]`}
              >
                • Pro Wallet Upgrade — Unlock premium FX rates & fraud protection.
              </li>
            </ul>
          </div>
          {/* Why Upgrade Section */}
          <div className="mt-10">
            <h3
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold font-satoshi mb-5`}
            >
              Why Upgrade for FX Exchange?
            </h3>
            <div className="space-y-6 pl-1">
              <div
                className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-regular font-satoshi leading-[160%]`}
              >
                • 🔒 Verified & Secure — Every FX transaction is fully KYC-verified, ensuring
                compliance and passport-level safety.
              </div>
              <div
                className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-regular font-satoshi leading-[160%]`}
              >
                • 🛡️ Fraud Protection — Prevents misuse and keeps your money safe at all times.
              </div>
              <div
                className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-regular font-satoshi leading-[160%]`}
              >
                • 💱 Best FX Rates — Access premium live conversion rates, lower than airport kiosks
                and money changers.
              </div>
            </div>
          </div>
          {/* Bottom spacer for sticky CTA */}
          <div className="h-28 shrink-0" />
        </div>
      </div>
      {/* Sticky CTA */}
      <div
        className={`sticky bottom-0 left-0 right-0 w-full px-5 pt-4 z-50 ${isDarkMode ? 'bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/90 to-transparent' : 'bg-gradient-to-t from-white via-white/90 to-transparent'}`}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
      >
        <button
          onClick={() => navigate(ROUTES.WALLET_SETTINGS)}
          className="w-full h-[52px] bg-brand-primary rounded-full text-white text-[16px] font-medium font-satoshi active:scale-95 transition-transform shadow-xl shadow-brand-primary/20 flex items-center justify-center"
        >
          Upgrade Wallet & Verify KYC
        </button>
      </div>
    </div>
  );
};
export default FxIntro;
