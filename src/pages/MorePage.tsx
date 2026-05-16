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
    {
      title: 'APP PREFERENCES',
      items: [
        { icon: ASSETS.LOGOUT, label: 'Logout', onClick: logout },
        {
          icon: ASSETS.DELETE_ACC,
          label: 'Delete Account',
          onClick: () => navigate(ROUTES.DELETE_ACCOUNT, { state: { originPath: ROUTES.MORE } }),
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
      <div className="flex-1 px-5 safe-top pb-[calc(120px+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="mt-8 mb-10">
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
    </div>
  );
};
export default MorePage;
