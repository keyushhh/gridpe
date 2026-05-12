import { ASSETS } from '@/constants/assets';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { hapticLight } from '@/utils/haptics';
import { ROUTES } from '@/routes';
interface BottomNavigationProps {
  activeTab?: 'home' | 'cards' | 'rewards' | 'more' | '';
  isHidden?: boolean;
}
const BottomNavigation = ({ activeTab, isHidden }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  if (isHidden) return null;
  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 w-full z-50 ${isDarkMode ? 'bg-brand-bg-dark border-t border-white/5' : 'bg-white border-t border-brand-border-light'}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
      }}
    >
      {/* Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[-1]"
        style={{
          backgroundImage: `url(${isDarkMode ? ASSETS.NAVBAR_OVERLAY : ASSETS.NAVBAR_LIGHT})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          opacity: isDarkMode ? 0.08 : 0.9,
        }}
      />
      <div className="h-[64px] flex items-center justify-between px-6 pt-2">
        {/* Home */}
        <button
          onClick={() => {
            hapticLight();
            navigate(ROUTES.HOME);
          }}
          className="flex flex-col items-center justify-center gap-1 w-12 h-12"
        >
          <img
            src={
              !isDarkMode
                ? activeTab === 'home'
                  ? ASSETS.HOME_LIGHT
                  : ASSETS.HOME_NOTSELECTED_LIGHT
                : activeTab === 'home'
                  ? ASSETS.NAV_HOME
                  : ASSETS.NAV_HOME_INACTIVE
            }
            alt="Home"
            className="w-6 h-6 object-contain"
          />
          <span
            className={`text-[10px] font-medium ${activeTab === 'home' ? (isDarkMode ? 'text-white' : 'text-black') : isDarkMode ? 'text-white/40' : 'text-black/40'}`}
          >
            Home
          </span>
        </button>
        {/* Cards */}
        <button
          onClick={() => {
            hapticLight();
            navigate(ROUTES.CARDS);
          }}
          className="flex flex-col items-center justify-center gap-1 w-12 h-12"
        >
          <img
            src={
              !isDarkMode
                ? activeTab === 'cards'
                  ? ASSETS.CARD_SELECTED_LIGHT
                  : ASSETS.CARD_LIGHT
                : activeTab === 'cards'
                  ? ASSETS.NAV_CARDS_ACTIVE
                  : ASSETS.NAV_CARDS
            }
            alt="Cards"
            className="w-6 h-6 object-contain"
          />
          <span
            className={`text-[10px] font-medium ${activeTab === 'cards' ? (isDarkMode ? 'text-white' : 'text-black') : isDarkMode ? 'text-white/40' : 'text-black/40'}`}
          >
            Cards
          </span>
        </button>
        {/* Center FAB Space */}
        <div className="flex items-center justify-center -mt-8">
          <button
            onClick={() => {
              hapticLight();
              navigate(ROUTES.WALLET_ADD_MONEY);
            }}
            className="w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform active:scale-90 z-20"
            style={{
              boxShadow: isDarkMode
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <img
              src={!isDarkMode ? ASSETS.FAB_LIGHT : ASSETS.ADD_NAV}
              alt="Add Money"
              className="w-full h-full object-contain pointer-events-none"
            />
          </button>
        </div>
        {/* Rewards */}
        <button
          onClick={() => {
            hapticLight();
            navigate(ROUTES.REWARDS);
          }}
          className="flex flex-col items-center justify-center gap-1 w-12 h-12"
        >
          <img
            src={
              !isDarkMode
                ? activeTab === 'rewards'
                  ? ASSETS.REWARDS_SELECTED_LIGHT
                  : ASSETS.REWARD_LIGHT
                : activeTab === 'rewards'
                  ? ASSETS.REWARDS_FILLED
                  : ASSETS.NAV_REWARDS
            }
            alt="Rewards"
            className="w-6 h-6 object-contain"
          />
          <span
            className={`text-[10px] font-medium ${activeTab === 'rewards' ? (isDarkMode ? 'text-white' : 'text-black') : isDarkMode ? 'text-white/40' : 'text-black/40'}`}
          >
            Rewards
          </span>
        </button>
        {/* More */}
        <button
          onClick={() => {
            hapticLight();
            navigate(ROUTES.MORE);
          }}
          className="flex flex-col items-center justify-center gap-1 w-12 h-12"
        >
          <img
            src={
              !isDarkMode
                ? activeTab === 'more'
                  ? ASSETS.MORE_SELECTED_LIGHT
                  : ASSETS.MORE_LIGHT
                : activeTab === 'more'
                  ? ASSETS.MORE_FILLED
                  : ASSETS.MORE
            }
            alt="More"
            className="w-6 h-6 object-contain"
          />
          <span
            className={`text-[10px] font-medium ${activeTab === 'more' ? (isDarkMode ? 'text-white' : 'text-black') : isDarkMode ? 'text-white/40' : 'text-black/40'}`}
          >
            More
          </span>
        </button>
      </div>
    </footer>
  );
};
export default BottomNavigation;
