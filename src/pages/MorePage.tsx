import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { ROUTES } from '@/routes';
import { Share } from '@capacitor/share';
import { ASSETS } from '@/constants/assets';
import { 
  ChevronRight, ChevronDown, Banknote, ArrowLeftRight, 
  TrendingUp, Clock, Sparkles, ShieldCheck, UserCheck, 
  Lock, Phone, Info, Users, Share2, FileText, Bike
} from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';

const MorePage = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { logout } = useAuth();
  
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pb-28 safe-top">
        {/* HEADER */}
        <div className="pt-8">
          <img
            src={ASSETS.GRIDPE_LOGO}
            alt="grid.pe"
            className="h-7"
            style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
          />
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-foreground block">Explore</h1>
            <h1 
              className="text-3xl font-bold block"
              style={{
                background: 'linear-gradient(90deg, #5260FE, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              what's possible.
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            All of Grid.Pe's services, in one place.
          </p>
        </div>

        {/* SECTION: SERVICES */}
        <h2 className="mt-10 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          SERVICES
        </h2>
        <div className="flex flex-col gap-3">
          <div
            onClick={() => navigate(ROUTES.ORDER_CASH)}
            className={`rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform duration-150 ${isDarkMode ? 'bg-white/5 border border-white/[0.08]' : 'bg-black/[0.03] border border-black/[0.08]'}`}
          >
            <div 
              className="rounded-xl p-2.5 shrink-0"
              style={{ background: 'linear-gradient(135deg, #5260FE22, #5260FE44)' }}
            >
              <Banknote size={20} color="#5260FE" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Cash Delivery</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Get cash delivered to your doorstep</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </div>

          <div
            onClick={() => navigate(ROUTES.FX_INTRO)}
            className={`rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform duration-150 ${isDarkMode ? 'bg-white/5 border border-white/[0.08]' : 'bg-black/[0.03] border border-black/[0.08]'}`}
          >
            <div 
              className="rounded-xl p-2.5 shrink-0"
              style={{ background: 'linear-gradient(135deg, #a78bfa22, #a78bfa44)' }}
            >
              <ArrowLeftRight size={20} color="#a78bfa" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">FX Exchange</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Convert foreign currency to INR cash</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* SECTION: DISCOVER */}
        <h2 className="mt-10 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          DISCOVER
        </h2>
        <div className="flex flex-col">
          {/* Row 1 — expandable, key: 'how-it-works' */}
          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={() => setExpandedItem(expandedItem === 'how-it-works' ? null : 'how-it-works')}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <Info size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">How Grid.Pe Works</span>
              <ChevronDown 
                size={16} 
                className="text-muted-foreground shrink-0 transition-transform duration-200" 
                style={{ transform: expandedItem === 'how-it-works' ? 'rotate(180deg)' : 'rotate(0deg)' }} 
              />
            </div>
            {expandedItem === 'how-it-works' && (
              <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
                <div className="flex gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 text-primary text-xs font-bold w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    <span className="font-bold text-foreground text-sm">Place Your Order</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Request cash delivery or FX exchange in under a minute.</p>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 text-primary text-xs font-bold w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <span className="font-bold text-foreground text-sm">Rider Gets Assigned</span>
                    <p className="text-xs text-muted-foreground mt-0.5">A verified Grid.Pe rider is matched to your order instantly.</p>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="rounded-full bg-primary/10 text-primary text-xs font-bold w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <span className="font-bold text-foreground text-sm">Delivered to You</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Your order arrives at your doorstep, securely and on time.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2 — expandable, key: 'safety' */}
          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={() => setExpandedItem(expandedItem === 'safety' ? null : 'safety')}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <ShieldCheck size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">Safety Promise</span>
              <ChevronDown 
                size={16} 
                className="text-muted-foreground shrink-0 transition-transform duration-200" 
                style={{ transform: expandedItem === 'safety' ? 'rotate(180deg)' : 'rotate(0deg)' }} 
              />
            </div>
            {expandedItem === 'safety' && (
              <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
                <div className="flex gap-3 mb-4">
                  <div className="rounded-lg p-1.5 bg-primary/10 shrink-0 mt-0.5">
                    <ShieldCheck size={14} color="#5260FE" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-sm">Verified Riders Only</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Every rider is KYC verified and background checked.</p>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="rounded-lg p-1.5 bg-primary/10 shrink-0 mt-0.5">
                    <UserCheck size={14} color="#5260FE" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-sm">Women-Safe Deliveries</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Female customers can request women-only riders.</p>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="rounded-lg p-1.5 bg-primary/10 shrink-0 mt-0.5">
                    <Lock size={14} color="#5260FE" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-sm">Secure Transactions</span>
                    <p className="text-xs text-muted-foreground mt-0.5">All payments go through RBI-compliant gateways.</p>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="rounded-lg p-1.5 bg-primary/10 shrink-0 mt-0.5">
                    <Phone size={14} color="#5260FE" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-sm">Masked Calling</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Your number is never shared with riders.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: GROW WITH US */}
        <h2 className="mt-10 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          GROW WITH US
        </h2>
        <div className="flex flex-col">
          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={() => navigate(ROUTES.REWARDS)}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <Users size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">Refer & Earn</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>

          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={() => navigate(ROUTES.RIDE_AND_EARN)}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <Bike size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">Ride & Earn with Us</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>

          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={async () => {
                try {
                  await Share.share({
                    title: 'Grid.Pe',
                    text: 'Get cash delivered to your doorstep with Grid.Pe!',
                    url: 'https://grid.pe',
                    dialogTitle: 'Share Grid.Pe'
                  });
                } catch (e) {
                  // user cancelled share, do nothing
                }
              }}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <Share2 size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">Share App</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>
        </div>

        {/* SECTION: COMPANY */}
        <h2 className="mt-10 mb-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          COMPANY
        </h2>
        <div className="flex flex-col">
          {/* Row 1 — expandable, key: 'about' */}
          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={() => setExpandedItem(expandedItem === 'about' ? null : 'about')}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <Info size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">About Us</span>
              <ChevronDown 
                size={16} 
                className="text-muted-foreground shrink-0 transition-transform duration-200" 
                style={{ transform: expandedItem === 'about' ? 'rotate(180deg)' : 'rotate(0deg)' }} 
              />
            </div>
            {expandedItem === 'about' && (
              <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
                <p className="mb-3">
                  Grid.Pe is India's first doorstep cash and FX delivery platform, built for Tier 2 and Tier 3 cities where access to financial services is limited.
                </p>
                <p className="mb-3">
                  We believe everyone deserves fast, secure, and dignified access to their money — wherever they are.
                </p>
                <div className="mt-4 flex justify-between">
                  <div className="text-center">
                    <div className="text-sm font-bold text-foreground">Tier 2 & 3</div>
                    <div className="text-xs text-muted-foreground">Cities First</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-foreground">KYC Verified</div>
                    <div className="text-xs text-muted-foreground">Every Rider</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-foreground">6AM–11PM</div>
                    <div className="text-xs text-muted-foreground">Always On</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={() => navigate(ROUTES.LEGAL_TERMS)}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <FileText size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">Terms & Conditions</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>

          <div className={`border-b ${isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
            <div 
              className="flex items-center gap-3 py-3.5 cursor-pointer"
              onClick={() => navigate(ROUTES.LEGAL_PRIVACY)}
            >
              <div className={`rounded-lg p-2 shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <FileText size={16} className="text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">Privacy Policy</span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>
        </div>

        {/* BOTTOM STRIP */}
        <div className={`mt-8 mb-2 rounded-2xl px-4 py-3.5 flex items-center gap-3 ${isDarkMode ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-black/[0.02] border border-black/[0.06]'}`}>
          <Sparkles size={16} style={{ color: '#5260FE' }} className="shrink-0" />
          <span className="text-xs text-muted-foreground">More features coming soon.</span>
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
