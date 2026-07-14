import React, { useState } from 'react';
import { ASSETS } from '@/constants/assets';
import { useNavigate } from 'react-router-dom';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { hapticLight } from '@/utils/haptics';
import { ROUTES } from '@/routes';
import { useUser } from '@/contexts/UserContext';
import gridpeGlyph from '../assets/gridpe-glyph.svg';

interface BottomNavigationProps {
  activeTab?: 'home' | 'cards' | 'rewards' | 'more' | '';
  isHidden?: boolean;
}
const BottomNavigation = ({ activeTab, isHidden }: BottomNavigationProps) => {
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { profile, isPassportVerified } = useUser();
  if (isHidden) return null;
  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 w-full z-50 overflow-visible ${isDarkMode ? 'bg-black/90 border-t-0' : 'bg-white border-t border-brand-border-light'}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="absolute -top-12 left-0 right-0 h-12 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.95) 100%)'
        }}
      />
      {isDarkMode && (
        <div 
          className="h-px w-full" 
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(180,180,200,0.35) 30%, rgba(220,220,240,0.55) 50%, rgba(180,180,200,0.35) 70%, transparent 100%)' }} 
        />
      )}
      <div className="h-[92px] flex items-center justify-between px-6 pt-2">
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
        <div className="flex items-center justify-center relative">
          {isFabMenuOpen && (
            <div 
              className="absolute bottom-[80px] z-50 p-[1px] rounded-[20px]"
              style={{
                width: '168px',
                height: '100px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.2) 100%)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}
            >
              <div className="w-full h-full bg-[#0A0A0A] rounded-[19px] flex flex-col justify-center gap-[14px] px-[22px] overflow-hidden relative z-10">
                <button 
                  className="flex items-center gap-3 w-full"
                  onClick={() => {
                    hapticLight();
                    setIsFabMenuOpen(false);
                    navigate(ROUTES.ORDER_CASH);
                  }}
                >
                  <img src={ASSETS.CASH_ORDER_ICON} alt="Order Cash" className="w-[22px] h-[22px] object-contain shrink-0" />
                  <span className="text-white font-['Satoshi'] font-normal text-[15px] leading-none whitespace-nowrap">Order Cash</span>
                </button>
                <button 
                  className="flex items-center gap-3 w-full"
                  onClick={() => {
                    hapticLight();
                    setIsFabMenuOpen(false);
                    const walletTier = profile?.plan_tier || 'Starter';
                    if (walletTier === 'Starter') {
                      navigate(ROUTES.FX_INTRO);
                    } else if (!isPassportVerified) {
                      navigate(ROUTES.FX_PASSPORT_GATE);
                    } else {
                      navigate(ROUTES.FX_EXCHANGE);
                    }
                  }}
                >
                  <img src={ASSETS.FX_CONVERT} alt="FX Convert" className="w-[22px] h-[22px] object-contain shrink-0" />
                  <span className="text-white font-['Satoshi'] font-normal text-[15px] leading-none whitespace-nowrap">FX Convert</span>
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              hapticLight();
              setIsFabMenuOpen(!isFabMenuOpen);
            }}
            className="w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform active:scale-90 z-20"
            style={{
              background: 'linear-gradient(180deg, #302655 0%, rgba(40,29,80,0.20) 100%)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            <img
              src={gridpeGlyph}
              alt="Grid.Pe"
              className="w-8 h-8 object-contain pointer-events-none"
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
        {/* Explore */}
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
            alt="Explore"
            className="w-6 h-6 object-contain"
          />
          <span
            className={`text-[10px] font-medium ${activeTab === 'more' ? (isDarkMode ? 'text-white' : 'text-black') : isDarkMode ? 'text-white/40' : 'text-black/40'}`}
          >
            Explore
          </span>
        </button>
      </div>
    </footer>
  );
};
export default BottomNavigation;
