import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
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
import cardLight from "@/assets/card-light.svg";
import fabLight from "@/assets/fab-light.svg";
import rewardLight from "@/assets/reward-light.svg";
import moreLight from "@/assets/more-light.svg";

interface BottomNavigationProps {
  activeTab: "home" | "cards" | "rewards" | "more";
  isHidden?: boolean;
}

const BottomNavigation = ({ activeTab, isHidden }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  if (isHidden) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-[104px] z-50 flex items-center justify-between px-6 backdrop-blur-lg overflow-hidden ${isDarkMode ? 'bg-black/80 border-t border-white/40' : 'bg-white/80 border-t border-[#E9EAEB]'}`}>
      {/* Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[-1]"
        style={{
          backgroundImage: `url(${isDarkMode ? navbarOverlay : navbarLight})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isDarkMode ? 0.06 : 0.85
        }}
      />
      {/* Home */}
      <button
        onClick={() => navigate("/home")}
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <img
          src={!isDarkMode ? homeLight : (activeTab === "home" ? navHome : navHomeInactive)}
          alt="Home"
          className={`w-6 h-6 object-contain ${!isDarkMode && activeTab !== "home" ? "opacity-40" : ""}`}
        />
        <span
          className={`text-[11px] font-medium ${activeTab === "home" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          Home
        </span>
      </button>

      {/* Cards */}
      <button
        onClick={() => navigate("/cards")}
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <img
          src={!isDarkMode ? cardLight : (activeTab === "cards" ? navCardsActive : navCards)}
          alt="Cards"
          className={`w-6 h-6 object-contain ${!isDarkMode && activeTab !== "cards" ? "opacity-40" : ""}`}
        />
        <span
          className={`text-[11px] font-medium ${activeTab === "cards" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          Cards
        </span>
      </button>

      {/* Center FAB Space */}
      <div className="flex justify-center w-[72px] relative h-full">
        <button
          onClick={() => navigate("/wallet-add-money")}
          className="absolute top-[9px] w-[72px] h-[72px] rounded-full flex items-center justify-center transition-transform active:scale-95 z-20"
          style={{
            backgroundImage: `url(${!isDarkMode ? fabLight : addNavIcon})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            boxShadow: isDarkMode ? '0 1px 2px 0 rgba(0, 0, 0, 0.79), 0 3px 3px 0 rgba(0, 0, 0, 0.68), 0 7px 4px 0 rgba(0, 0, 0, 0.40), 0 12px 5px 0 rgba(0, 0, 0, 0.12), 0 19px 5px 0 rgba(0, 0, 0, 0.01)' : '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
        </button>
      </div>

      {/* Rewards */}
      <button
        onClick={() => navigate("/rewards")}
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <img
          src={!isDarkMode ? rewardLight : (activeTab === "rewards" ? navRewardsActive : navRewards)}
          alt="Rewards"
          className={`w-6 h-6 object-contain ${!isDarkMode && activeTab !== "rewards" ? "opacity-40" : ""}`}
        />
        <span
          className={`text-[11px] font-medium ${activeTab === "rewards" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          Rewards
        </span>
      </button>

      {/* More */}
      <button
        onClick={() => navigate("/more")}
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <img
          src={!isDarkMode ? moreLight : (activeTab === "more" ? navMoreFilled : navMore)}
          alt="More"
          className={`w-6 h-6 object-contain ${!isDarkMode && activeTab !== "more" ? "opacity-40" : ""}`}
        />
        <span
          className={`text-[11px] font-medium ${activeTab === "more" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`}
        >
          More
        </span>
      </button>
    </div>
  );
};

export default BottomNavigation;
