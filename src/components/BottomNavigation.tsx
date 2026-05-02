import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { hapticLight } from "@/utils/haptics";

import addNavIcon from "@/assets/add-nav.svg";
import navHome from "@/assets/nav-home.svg";
import navHomeInactive from "@/assets/nav-home-inactive.png";
import navCards from "@/assets/nav-cards.svg";
import navCardsActive from "@/assets/nav-cards-active.png";
import navRewards from "@/assets/nav-rewards.svg";
import navRewardsActive from "@/assets/rewards-filled.svg";
import navMore from "@/assets/more.svg";
import navMoreFilled from "@/assets/more-filled.svg";
import navbarOverlay from "@/assets/navbar-overlay.png";
import navbarLight from "@/assets/navbar-light.png";
import homeLight from "@/assets/home-light.svg";
import homeNotselectedLight from "@/assets/home-notselected-light.svg";
import cardLight from "@/assets/card-light.svg";
import cardSelectedLight from "@/assets/card-selected-light.svg";
import fabLight from "@/assets/fab-light.svg";
import rewardLight from "@/assets/reward-light.svg";
import rewardsSelectedLight from "@/assets/rewards-selected-light.svg";
import moreLight from "@/assets/more-light.svg";
import moreSelectedLight from "@/assets/more-selected-light.svg";

interface BottomNavigationProps {
  activeTab?: "home" | "cards" | "rewards" | "more" | "";
  isHidden?: boolean;
}

const BottomNavigation = ({ activeTab, isHidden }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';


  if (isHidden) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between px-6 pt-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl ${isDarkMode ? 'border-t border-white/5' : 'border-t border-[#E9EAEB]'}`}
      style={{
        minHeight: `calc(64px + env(safe-area-inset-bottom))`,
        backgroundColor: isDarkMode ? '#0a0a12' : '#ffffff',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.15)'
      }}
    >
      {/* Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[-1]"
        style={{
          backgroundImage: `url(${isDarkMode ? navbarOverlay : navbarLight})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          opacity: isDarkMode ? 0.08 : 0.9
        }}
      />
      
      {/* Home */}
      <button
        onClick={() => {
          hapticLight();
          navigate("/home");
        }}
        className="flex flex-col items-center justify-center gap-1 w-12 h-12"
      >
        <img
          src={!isDarkMode ? (activeTab === "home" ? homeLight : homeNotselectedLight) : (activeTab === "home" ? navHome : navHomeInactive)}
          alt="Home"
          className="w-6 h-6 object-contain"
        />
        <span
          className={`text-[10px] font-medium ${activeTab === "home" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          Home
        </span>
      </button>

      {/* Cards */}
      <button
        onClick={() => {
          hapticLight();
          navigate("/cards");
        }}
        className="flex flex-col items-center justify-center gap-1 w-12 h-12"
      >
        <img
          src={!isDarkMode ? (activeTab === "cards" ? cardSelectedLight : cardLight) : (activeTab === "cards" ? navCardsActive : navCards)}
          alt="Cards"
          className="w-6 h-6 object-contain"
        />
        <span
          className={`text-[10px] font-medium ${activeTab === "cards" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          Cards
        </span>
      </button>

      {/* Center FAB Space */}
      <div className="flex items-center justify-center -mt-6">
        <button
          onClick={() => {
            hapticLight();
            navigate("/wallet-add-money");
          }}
          className="w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform active:scale-90 z-20"
          style={{
            boxShadow: isDarkMode ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <img
            src={!isDarkMode ? fabLight : addNavIcon}
            alt="Add Money"
            className="w-full h-full object-contain pointer-events-none"
          />
        </button>
      </div>

      {/* Rewards */}
      <button
        onClick={() => {
          hapticLight();
          navigate("/rewards");
        }}
        className="flex flex-col items-center justify-center gap-1 w-12 h-12"
      >
        <img
          src={!isDarkMode ? (activeTab === "rewards" ? rewardsSelectedLight : rewardLight) : (activeTab === "rewards" ? navRewardsActive : navRewards)}
          alt="Rewards"
          className="w-6 h-6 object-contain"
        />
        <span
          className={`text-[10px] font-medium ${activeTab === "rewards" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          Rewards
        </span>
      </button>

      {/* More */}
      <button
        onClick={() => {
          hapticLight();
          navigate("/more");
        }}
        className="flex flex-col items-center justify-center gap-1 w-12 h-12"
      >
        <img
          src={!isDarkMode ? (activeTab === "more" ? moreSelectedLight : moreLight) : (activeTab === "more" ? navMoreFilled : navMore)}
          alt="More"
          className="w-6 h-6 object-contain"
        />
        <span
          className={`text-[10px] font-medium ${activeTab === "more" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          More
        </span>
      </button>
    </div>
  );
};

export default BottomNavigation;
