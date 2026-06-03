import { useState } from 'react';
import { ASSETS } from '@/constants/assets';
// MorePage Component
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import BottomNavigation from '@/components/BottomNavigation';
import { useAsset } from '@/hooks/useAsset';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { ROUTES } from '@/routes';
// Assets
interface MoreItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  isDarkMode: boolean;
}
const MoreItem = ({ icon, label, onClick, isDarkMode }: MoreItemProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center group active:scale-95 transition-transform"
  >
    <div
      className={`w-16 h-16 flex items-center justify-center relative mb-1 ${!isDarkMode ? 'bg-white/50 border border-white/33 rounded-[33px]' : ''}`}
      style={
        isDarkMode
          ? {
              backgroundImage: `url(${ASSETS.MORE_ICONSBG})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }
          : {}
      }
    >
      <img
        src={icon}
        alt={label}
        className="w-6 h-6 object-contain"
        style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
      />
    </div>
    <span className="text-foreground font-medium text-[12px] leading-tight w-16 text-center font-satoshi">
      {label}
    </span>
  </button>
);
const MorePage = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  const { logout } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const categories = [
    {
      title: 'ACCOUNT',
      items: [
        {
          icon: ASSETS.ADDRESS,
          label: 'Saved Addresses',
          onClick: () => navigate(ROUTES.SAVED_ADDRESSES),
        },
        { icon: ASSETS.HELP, label: 'Help & Support', onClick: () => navigate(ROUTES.HELP) },
        {
          icon: ASSETS.SECURITY,
          label: 'Security Settings',
          onClick: () =>
            navigate(ROUTES.SECURITY_DASHBOARD, { state: { originPath: ROUTES.MORE } }),
        },
        {
          icon: ASSETS.SUBSCRIPTIONS,
          label: 'Subscriptions',
          onClick: () => navigate(ROUTES.SUBSCRIPTIONS),
        },
      ],
    },
    {
      title: 'LEGAL',
      items: [
        {
          icon: ASSETS.TERMS_PRIVACY,
          label: 'Terms & Conditions',
          onClick: () => navigate(ROUTES.LEGAL_TERMS, { state: { fromMore: true } }),
        },
        {
          icon: ASSETS.TERMS_PRIVACY,
          label: 'Privacy Policy',
          onClick: () => navigate(ROUTES.LEGAL_PRIVACY, { state: { fromMore: true } }),
        },
      ],
    },
  ];
  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-y-auto overscroll-y-contain ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'} scrollbar-hide`}
      style={{
        backgroundImage: `url(${mainBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 px-5 safe-top pt-4 pb-[calc(120px+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="mb-6 relative z-10">
          <img
            src={ASSETS.GRIDPE_LOGO}
            alt="grid.pe"
            className="h-10 mb-2"
            style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
          />
        </div>
        {/* Categories */}
        <div className="flex flex-col gap-[66px]">
          {categories.map(category => (
            <div key={category.title} className="flex flex-col">
              <h2 className="text-muted-foreground font-medium text-[14px] tracking-wider mb-[18px] font-satoshi uppercase">
                {category.title}
              </h2>
              <div className="flex flex-wrap gap-x-[26px] gap-y-6">
                {category.items.map(item => (
                  <MoreItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    onClick={item.onClick}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="more" />

      {/* Logout Confirmation Bottom Sheet */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/50 backdrop-blur-[4px] pointer-events-auto"
            onClick={() => setShowLogoutConfirmation(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 rounded-t-[36px] flex flex-col px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 pointer-events-auto z-20 transition-all duration-300 animate-slide-up"
            style={{
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'rgba(255, 255, 255, 0.95)',
              borderTop: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              borderLeft: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              borderRight: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              boxShadow: isDarkMode ? '0px -10px 40px rgba(0, 0, 0, 0.4)' : 'none',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          >
            {/* Drag Handle */}
            <div
              className={`w-10 h-1.5 rounded-full mx-auto mb-6 ${
                isDarkMode ? 'bg-white/20' : 'bg-black/20'
              }`}
            />

            {/* Premium Animated Icon */}
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-4 text-[#EF4444] animate-pulse"
            >
              <path
                d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 12H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 9L20 12L17 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Content */}
            <div className="flex flex-col text-center">
              <h2 className={`text-[22px] font-black font-satoshi leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Log out?
              </h2>
              <p className={`text-[13.5px] font-normal leading-relaxed font-satoshi mt-1.5 px-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No worries, we’ll be here when you need cash again.
              </p>
            </div>

            {/* Subtle Divider */}
            <div className={`h-[1px] w-full my-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Buttons stacked vertically */}
            <div className="flex flex-col gap-3.5">
              <button
                onClick={() => {
                  setShowLogoutConfirmation(false);
                  logout();
                }}
                className={`w-full h-[52px] rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] active:scale-95 transition-all flex items-center justify-center font-bold text-white text-[16px] font-satoshi ${
                  isDarkMode ? 'shadow-lg shadow-red-950/20' : 'shadow-none'
                }`}
              >
                Log Out
              </button>

              <button
                onClick={() => setShowLogoutConfirmation(false)}
                className={`w-full h-[52px] rounded-full active:scale-95 transition-all flex items-center justify-center font-semibold text-[16px] font-satoshi border ${
                  isDarkMode 
                    ? 'bg-transparent text-white border-white/12 hover:bg-white/5' 
                    : 'bg-transparent text-slate-800 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MorePage;
