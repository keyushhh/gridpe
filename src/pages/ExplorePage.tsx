import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { ROUTES } from '@/routes';

import { ASSETS } from '@/constants/assets';
import { useAsset } from '@/hooks/useAsset';
import {
  ChevronRight, Info, Users, FileText, Bike, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import mapDark from '@/assets/map-dark.png';
import scallopedImage from '@/assets/scalloped.png';
import safetyGradient from '@/assets/safety-gradient.png';
import safetyIllustration from '@/assets/safety-illustration.svg';
import mapLight from '@/assets/map-light.png';
import mapPinFill from '@/assets/map-pin-fill.svg';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';

const ExplorePage = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { logout } = useAuth();
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [cashExpanded, setCashExpanded] = useState(false);
  const [fxExpanded, setFxExpanded] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `url(${mainBg})`,
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto',
      }}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-32 safe-top">
        {/* HEADER */}
        <div className="pt-8 flex flex-col gap-[2px]">
          <h1 className="font-satoshi font-black text-[40px] leading-none text-foreground">
            Explore
          </h1>
          <h2 className="font-satoshi font-medium text-[24px] leading-none text-[#5260FE]">
            what's possible.
          </h2>
        </div>

        {/* SECTION: COVERAGE */}
        <h2 className="mt-10 mb-3 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          COVERAGE
        </h2>

        {/* Coverage Banner */}
        <div className="w-full h-[116px] rounded-[16px] bg-black relative overflow-hidden">
          {/* Text Content */}
          <div className="absolute top-[16px] left-[16px] w-[120px]">
            <p className="font-satoshi font-medium text-[24px] leading-[1.1] text-white">
              📍Live in <span className="font-bold italic">Bengaluru!</span>
            </p>
          </div>

          <div className="absolute bottom-[12px] left-[16px]">
            <p className="font-satoshi font-medium italic text-[12px] text-white/60">
              *More cities coming soon!
            </p>
          </div>

          {/* Map Image & Pin Container */}
          <div className="absolute right-0 top-[6px] bottom-[6px] w-[172px] h-[104px]">
            <img
              src={isDarkMode ? mapDark : mapLight}
              className="w-full h-full object-contain"
              alt="Coverage Map"
            />
            {/* Glowing Map Pin */}
            <div className="absolute inset-0 flex items-center justify-center -mt-2 ml-[16px]">
              <div
                className="relative flex items-center justify-center"
              >
                {/* Live pulsing blob effect (Ping) */}
                <div className="absolute w-5 h-5 rounded-full bg-[#5260FE] animate-ping opacity-75" />
                {/* Base Glow behind pin */}
                <div className="absolute w-8 h-8 rounded-full bg-[#5260FE]/40 blur-md" />

                <img
                  src={mapPinFill}
                  alt="Location Pin"
                  className="relative z-10 w-6 h-6 object-contain"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(82, 96, 254, 0.8))' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: SERVICES */}
        <h2 className="mt-[33px] mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground relative z-0">
          SERVICES
        </h2>

        {/* Global Click-Outside Overlay */}
        {(cashExpanded || fxExpanded) && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setCashExpanded(false);
              setFxExpanded(false);
            }}
          />
        )}

        <div className="relative mt-2">
          {/* Background Scalloped Image */}
          <div
            className="absolute z-0 pointer-events-none"
            style={{
              top: "-22px",     // NUDGE: Adjust this value to move image UP or DOWN
              left: "-25px",   // NUDGE: Counteracts px-5 page padding to hit left screen edge
              right: "-5px",  // NUDGE: Counteracts px-5 page padding to hit right screen edge
              width: "calc(100% + 80px)", // Forces it to span the full viewport
              opacity: 1        // NUDGE: Adjust transparency if needed
            }}
          >
            <img
              src={scallopedImage}
              alt="Background decoration"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-20">
            {/* Get Cash Card */}
            <motion.div
              initial="hidden"
              animate={cashExpanded ? "visible" : "hidden"}
              onClick={() => {
                setCashExpanded(true);
                setFxExpanded(false);
              }}
              className={`relative w-full h-[146px] rounded-[16px] overflow-hidden border border-white/5 cursor-pointer bg-[#1C1C1E] ${cashExpanded ? 'z-30' : 'z-20'}`}
            >
              {/* Top Purple Box */}
              <motion.div
                variants={{
                  hidden: { width: "100%", height: "100%", borderRadius: "0px" },
                  visible: { width: "109px", height: "42px", borderRadius: "0px 0px 16px 16px" }
                }}
                transition={{ duration: 0.4, ease: "linear" }}
                className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0C091D] overflow-hidden z-10"
              >
                <motion.div
                  variants={{
                    hidden: { top: "26px" },
                    visible: { top: "21px" }
                  }}
                  transition={{ duration: 0.4, ease: "linear" }}
                  className="absolute left-0 w-full text-center"
                  style={{ y: "-50%" }}
                >
                  <motion.h3
                    variants={{
                      hidden: { fontSize: "16px" },
                      visible: { fontSize: "12px" }
                    }}
                    className="text-white font-satoshi font-bold whitespace-nowrap"
                  >
                    Get Cash
                  </motion.h3>
                </motion.div>
              </motion.div>

              {/* Center Arrow */}
              <motion.div
                variants={{
                  hidden: { top: "50%", x: "-50%", y: "-50%", opacity: 0, scale: 0.5 },
                  visible: { top: "69px", x: "-50%", y: "-50%", opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.3, delay: 0.1, ease: "linear" }}
                className="absolute left-1/2 w-[32px] h-[32px] rounded-full border-[1.5px] border-white flex items-center justify-center z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  if (cashExpanded) navigate(ROUTES.ORDER_CASH);
                }}
              >
                <ArrowRight size={18} color="white" />
              </motion.div>

              {/* Curved Black Bottom */}
              <motion.div
                variants={{
                  hidden: { top: "50px" },
                  visible: { top: "96px" }
                }}
                transition={{ duration: 0.4, ease: "linear" }}
                className="absolute left-[-25%] right-[-25%] h-[200%] bg-black rounded-t-[50%] z-20 pointer-events-none"
              />

              {/* Bottom Text */}
              <motion.div
                variants={{
                  hidden: { top: "88px", opacity: 1 },
                  visible: { top: "108px", opacity: 1 }
                }}
                transition={{ duration: 0.4, ease: "linear" }}
                className="absolute left-0 w-full text-center px-2 z-30 pointer-events-none"
              >
                <motion.p
                  variants={{
                    hidden: { fontSize: "14px" },
                    visible: { fontSize: "12px" }
                  }}
                  className="text-white font-satoshi font-medium leading-[1.3]"
                >
                  Get cash delivered to<br />your doorstep.
                </motion.p>
              </motion.div>
            </motion.div>

            {/* FX Exchange Card */}
            <motion.div
              initial="hidden"
              animate={fxExpanded ? "visible" : "hidden"}
              onClick={() => {
                setFxExpanded(true);
                setCashExpanded(false);
              }}
              className={`relative w-full h-[146px] rounded-[16px] overflow-hidden border border-white/5 cursor-pointer bg-[#1C1C1E] ${fxExpanded ? 'z-30' : 'z-20'}`}
            >
              {/* Top Purple Box */}
              <motion.div
                variants={{
                  hidden: { width: "100%", height: "100%", borderRadius: "0px" },
                  visible: { width: "109px", height: "42px", borderRadius: "0px 0px 16px 16px" }
                }}
                transition={{ duration: 0.4, ease: "linear" }}
                className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0C091D] overflow-hidden z-10"
              >
                <motion.div
                  variants={{
                    hidden: { top: "26px" },
                    visible: { top: "21px" }
                  }}
                  transition={{ duration: 0.4, ease: "linear" }}
                  className="absolute left-0 w-full text-center"
                  style={{ y: "-50%" }}
                >
                  <motion.h3
                    variants={{
                      hidden: { fontSize: "16px" },
                      visible: { fontSize: "12px" }
                    }}
                    className="text-white font-satoshi font-bold whitespace-nowrap"
                  >
                    FX Exchange
                  </motion.h3>
                </motion.div>
              </motion.div>

              {/* Center Arrow */}
              <motion.div
                variants={{
                  hidden: { top: "50%", x: "-50%", y: "-50%", opacity: 0, scale: 0.5 },
                  visible: { top: "69px", x: "-50%", y: "-50%", opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.3, delay: 0.1, ease: "linear" }}
                className="absolute left-1/2 w-[32px] h-[32px] rounded-full border-[1.5px] border-white flex items-center justify-center z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fxExpanded) navigate(ROUTES.FX_INTRO);
                }}
              >
                <ArrowRight size={18} color="white" />
              </motion.div>

              {/* Curved Black Bottom */}
              <motion.div
                variants={{
                  hidden: { top: "50px" },
                  visible: { top: "96px" }
                }}
                transition={{ duration: 0.4, ease: "linear" }}
                className="absolute left-[-25%] right-[-25%] h-[200%] bg-black rounded-t-[50%] z-20 pointer-events-none"
              />

              {/* Bottom Text */}
              <motion.div
                variants={{
                  hidden: { top: "88px", opacity: 1 },
                  visible: { top: "108px", opacity: 1 }
                }}
                transition={{ duration: 0.4, ease: "linear" }}
                className="absolute left-0 w-full text-center px-2 z-30 pointer-events-none"
              >
                <motion.p
                  variants={{
                    hidden: { fontSize: "14px" },
                    visible: { fontSize: "12px" }
                  }}
                  className="text-white font-satoshi font-medium leading-[1.3]"
                >
                  Convert foreign<br />currency to INR cash
                </motion.p>
              </motion.div>
            </motion.div>
          </div>

          {/* SECTION: SAFETY BANNER */}
          <div 
            className="relative w-full h-[72px] rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
            style={{ marginTop: "72px" }}
            onClick={() => navigate(ROUTES.SAFETY_PROMISE)}
          >
            {/* Background Gradient */}
            <div 
              className="absolute inset-0 bg-no-repeat bg-center"
              style={{ 
                backgroundImage: `url(${safetyGradient})`,
                backgroundSize: '120% 100%' 
              }}
            />
            
            {/* Left Illustration */}
            <img 
              src={safetyIllustration}
              alt="Safety"
              className="absolute left-0 top-0 w-[75px] h-[72px] object-contain"
            />
            
            {/* Text Content */}
            <h3 className="absolute left-[79px] top-[12px] font-satoshi font-bold text-[16px] text-white leading-none">
              Safety Promise
            </h3>
            
            <p className="absolute left-[79px] bottom-[12px] w-[177px] font-satoshi font-medium text-[12px] leading-tight text-white">
              Your cash, protected every step of the way.
            </p>
            
            {/* Right Arrow Icon */}
            <div className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-full border-[1.5px] border-white flex items-center justify-center">
              <ArrowRight size={18} color="white" />
            </div>
          </div>

          {/* SECTION: GROW WITH US */}
          <h2 className="mt-10 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            GROW WITH US
          </h2>
          <div className="flex flex-col gap-1.5">
            <div
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-2xl border bg-black ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
              onClick={() => navigate(ROUTES.REWARDS)}
            >
              <Users size={18} className="text-white shrink-0 ml-1" />
              <span className="flex-1 text-sm text-foreground font-medium">Refer & Earn</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>

            <div
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-2xl border bg-black ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
              onClick={() => navigate(ROUTES.RIDE_AND_EARN)}
            >
              <Bike size={18} className="text-white shrink-0 ml-1" />
              <span className="flex-1 text-sm text-foreground font-medium">Become a Delivery Partner</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>

          {/* SECTION: COMPANY */}
          <h2 className="mt-10 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            COMPANY
          </h2>
          <div className="flex flex-col gap-1.5">
            <div
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-2xl border bg-black ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
            >
              <Info size={18} className="text-white shrink-0 ml-1" />
              <span className="flex-1 text-sm text-foreground font-medium">About Us</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>

            <div
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-2xl border bg-black ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
              onClick={() => navigate(ROUTES.LEGAL_TERMS)}
            >
              <FileText size={18} className="text-white shrink-0 ml-1" />
              <span className="flex-1 text-sm text-foreground font-medium">Terms & Conditions</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>

            <div
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-2xl border bg-black ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
              onClick={() => navigate(ROUTES.LEGAL_PRIVACY)}
            >
              <FileText size={18} className="text-white shrink-0 ml-1" />
              <span className="flex-1 text-sm text-foreground font-medium">Privacy Policy</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>

          {/* FOOTER */}
          <div 
            className="flex flex-col items-start opacity-40"
            style={{ marginTop: '38px' }}
          >
            <p className="font-satoshi font-black text-[40px] text-foreground leading-none tracking-tight">
              grid.pe
            </p>
            <p className="text-sm mt-1 font-medium">This is not where you find love.</p>
          </div>

        </div>
      </div>

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
              className={`w-10 h-1.5 rounded-full mx-auto mb-6 ${isDarkMode ? 'bg-white/20' : 'bg-black/20'
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
                className={`w-full h-[52px] rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] active:scale-95 transition-all flex items-center justify-center font-bold text-white text-[16px] font-satoshi ${isDarkMode ? 'shadow-lg shadow-red-950/20' : 'shadow-none'
                  }`}
              >
                Log Out
              </button>

              <button
                onClick={() => setShowLogoutConfirmation(false)}
                className={`w-full h-[52px] rounded-full active:scale-95 transition-all flex items-center justify-center font-semibold text-[16px] font-satoshi border ${isDarkMode
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
export default ExplorePage;
