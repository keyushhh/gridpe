import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { ChevronRight } from 'lucide-react';
import { fetchRecentOrders } from '@/lib/orders';
import { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BackButton from '@/components/ui/BackButton';
import { useWebScroll } from '@/hooks/useWebScroll';
const HelpSupport = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadRecentOrder = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const orders = await fetchRecentOrders(session.user.id);
          if (orders.length > 0) {
            setRecentOrder(orders[0]);
          }
        } catch (e) {
          console.error('Failed to fetch recent order', e);
        } finally {
          setLoading(false);
        }
      }
    };
    loadRecentOrder();
  }, []);
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col font-satoshi ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header */}
      <div className="px-5 safe-top pt-4 flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => navigate(-1)} />
          <h1
            className={`text-[18px] font-semibold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Help & Support
          </h1>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto min-h-0 px-5 pt-7 relative z-10 pb-10">
        {/* Hero Section */}
        <div className="mb-[18px]">
          <h2
            className={`text-[16px] font-bold font-satoshi mb-[5px] ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            How can we help?
          </h2>
          <p
            className={`text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white/40' : 'text-brand-text-muted'}`}
          >
            We are happy to help you anytime
          </p>
        </div>
        {/* Search Bar */}
        <div className="w-full h-[44px] flex items-center mb-[32px] overflow-hidden rounded-full glass-container glass-physics-search relative">
          <div className="glass-lens" />
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{ backgroundColor: 'var(--glass-tint)' }}
          />
          <span className="glass-rim-v2" />
          <div className="flex items-center w-full h-full pl-[12px] relative z-10">
            <img loading="eager" decoding="async"               src={ASSETS.SEARCH_ICON}
              alt=""
              className="w-6 h-6 shrink-0"
              style={{
                filter: isDarkMode ? 'brightness(0) invert(1) opacity(0.8)' : 'opacity(0.8)',
              }}
            />
            <input
              type="text"
              placeholder='Example: "Account delete"'
              className={`flex-1 bg-transparent font-satoshi text-[14px] outline-none ml-[16px] ${isDarkMode ? 'text-white/80 placeholder:text-white/80' : 'text-black/80 placeholder:text-black/80'}`}
            />
          </div>
        </div>
        {/* Recent Order Section */}
        {recentOrder && (
          <div className="mb-[24px]">
            <h3
              className={`${isDarkMode ? 'text-brand-text-muted' : 'text-black/60'} text-[14px] font-medium font-satoshi mb-[12px] uppercase`}
            >
              RECENT ORDER
            </h3>
            <div
              onClick={() => navigate(ROUTES.HELP_REPORT, { state: { order: recentOrder } })}
              className="relative w-full mb-[12px] overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
              style={{
                height: '100px',
                background: isDarkMode ? 'rgba(28, 185, 86, 0.21)' : '#1CB95636', // ~21% opacity
                borderRadius: '12px',
                backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
                border: isDarkMode ? '0.63px solid transparent' : '1px solid #E9EAEB',
                backgroundImage: isDarkMode
                  ? 'linear-gradient(rgba(28, 185, 86, 0.21), rgba(28, 185, 86, 0.21)), linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.20))'
                  : 'none',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              {/* Status Header */}
              <div className="absolute top-[4px] left-[20px] z-20 flex items-center gap-[6px]">
                <div className="w-[12px] h-[12px] flex items-center justify-center">
                  <img loading="lazy" decoding="async"                     src={ASSETS.CHECK}
                    alt=""
                    className="w-full h-full"
                    style={
                      !isDarkMode
                        ? {
                            filter:
                              'invert(51%) sepia(96%) saturate(366%) hue-rotate(94deg) brightness(97%) contrast(87%)',
                          }
                        : {
                            filter:
                              'brightness(0) saturate(100%) invert(62%) sepia(80%) saturate(415%) hue-rotate(91deg) brightness(92%) contrast(88%)',
                          }
                    }
                  />
                </div>
                <span
                  className={`text-[12px] font-bold font-satoshi ${isDarkMode ? 'text-brand-success' : 'text-brand-success-vibrant'}`}
                >
                  Success
                </span>
              </div>
              <div
                className={`!absolute top-[25px] left-0 w-full glass-container glass-physics-clear z-10 rounded-b-[12px] ${!isDarkMode ? 'bg-white border border-brand-border-light' : ''}`}
                style={
                  {
                    height: '75px',
                    '--glass-radius': '0 0 12px 12px',
                    '--glass-rim-mask': 'linear-gradient(to bottom, transparent 1px, #fff 1px)',
                  } as React.CSSProperties
                }
              >
                {isDarkMode && (
                  <>
                    <div className="glass-lens" />
                    <div
                      className="absolute inset-0 z-[1] pointer-events-none"
                      style={{ backgroundColor: 'var(--glass-tint)' }}
                    />
                    <span className="glass-rim-v2" />
                  </>
                )}
                <div className="relative z-10 w-full h-full">
                  <div className="absolute top-[17px] left-[17px] w-[35px] h-[35px] flex items-center justify-center">
                    <img loading="lazy" decoding="async" src={ASSETS.SUCCESS} alt="" className="w-full h-full" />
                  </div>
                  <div className="absolute top-[17px] left-[65px] flex flex-col">
                    <span
                      className={`text-[14px] font-satoshi font-normal leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      {recentOrder.meta_data?.type === 'CASH_ORDER' && recentOrder.meta_data.item_value
                        ? `Ordered ₹${recentOrder.meta_data.item_value} Cash`
                        : recentOrder.addresses?.label
                          ? `Order to ${recentOrder.addresses.label}`
                          : 'Cash Order'}
                    </span>
                    <span
                      className={`text-[12px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-brand-text-muted'}`}
                    >
                      Today | 12:00 PM
                    </span>
                  </div>
                  <span
                    className={`absolute top-[25px] right-[17px] text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    ₹{recentOrder.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(ROUTES.ORDER_HISTORY, { state: { showOnlyPast: true } })}
              className={`w-full h-[42px] rounded-[12px] flex items-center justify-between px-4 transition-all overflow-hidden relative ${isDarkMode ? 'glass-container glass-physics-clear' : 'bg-white border border-brand-border-light'}`}
              style={
                isDarkMode
                  ? ({
                      '--glass-specular-intensity': '0.2',
                      '--glass-radius': '12px',
                    } as React.CSSProperties)
                  : {}
              }
            >
              {isDarkMode && (
                <>
                  <div className="glass-lens" />
                  <div
                    className="absolute inset-0 z-[1] pointer-events-none"
                    style={{ backgroundColor: 'var(--glass-tint)' }}
                  />
                  <span className="glass-rim-v2" />
                </>
              )}
              <span
                className={`relative z-10 text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Need help with previous orders?
              </span>
              <ChevronRight
                className={`relative z-10 ${isDarkMode ? 'text-white/40' : 'text-brand-text-muted'} w-5 h-5`}
              />
            </button>
          </div>
        )}
        {/* Browse Categories */}
        <div className="mb-[20px]">
          <h3
            className={`${isDarkMode ? 'text-brand-text-muted' : 'text-black/60'} text-[14px] font-medium font-satoshi mb-[12px] uppercase`}
          >
            BROWSE CATEGORIES
          </h3>
          <div
            className={`w-full rounded-[12px] overflow-hidden relative flex flex-col gap-0 transition-colors ${isDarkMode ? 'glass-container glass-physics-clear' : 'bg-white border border-brand-border-light'}`}
            style={
              isDarkMode
                ? ({
                    '--glass-specular-intensity': '0.2',
                    '--glass-radius': '12px',
                  } as React.CSSProperties)
                : {}
            }
          >
            {isDarkMode && (
              <>
                <div className="glass-lens" />
                <div
                  className="absolute inset-0 z-[1] pointer-events-none"
                  style={{ backgroundColor: 'var(--glass-tint)' }}
                />
                <span className="glass-rim-v2" />
              </>
            )}
            <div className="relative z-10">
              {[
                {
                  icon: isDarkMode ? ASSETS.GENERAL_ISSUES : ASSETS.GENERAL_BLACK,
                  label: 'General Issues',
                  route: ROUTES.HELP_CATEGORY.replace(':categoryId', 'general-issues'),
                },
                {
                  icon: isDarkMode ? ASSETS.FAQS : ASSETS.FAQ_BLACK,
                  label: 'FAQs',
                  route: ROUTES.HELP_CATEGORY.replace(':categoryId', 'faqs'),
                },
                {
                  icon: isDarkMode ? ASSETS.WALLET_WHITECLR : ASSETS.WALLET_BLACK,
                  label: 'Grid.Pe Wallet FAQs',
                  route: ROUTES.HELP_CATEGORY.replace(':categoryId', 'wallet-faqs'),
                },
                {
                  icon: isDarkMode ? ASSETS.ONBOARDING : ASSETS.PARTNER_BLACK,
                  label: 'Partner Onboarding',
                  route: ROUTES.HELP_CATEGORY.replace(':categoryId', 'onboarding'),
                },
              ].map((cat, idx, arr) => (
                <React.Fragment key={cat.label}>
                  <button
                    onClick={() => navigate(cat.route)}
                    className={`w-full flex items-center justify-between pl-3 pr-[14px] py-[10px] transition-colors ${isDarkMode ? 'active:bg-white/5' : 'active:bg-brand-bg-light'}`}
                  >
                    <div className="flex items-center gap-3">
                      <img loading="lazy" decoding="async" src={cat.icon} alt="" className="w-[18px] h-[18px]" />
                      <span
                        className={`text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <ChevronRight
                      className={`${isDarkMode ? 'text-white/40' : 'text-brand-text-muted'} w-5 h-5`}
                    />
                  </button>
                  {idx < arr.length - 1 && (
                    <div
                      className={`w-full h-[1px] ${isDarkMode ? 'bg-white/5' : 'bg-brand-border-light'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        {/* Contact Us */}
        <div className="mb-10">
          <h3
            className={`${isDarkMode ? 'text-brand-text-muted' : 'text-black/60'} text-[14px] font-medium font-satoshi mb-[12px] uppercase`}
          >
            CONTACT US
          </h3>
          <button
            onClick={() => navigate(ROUTES.HELP_CHAT)}
            className={`w-full h-[72px] rounded-[12px] flex items-center px-[14px] relative transition-colors overflow-hidden ${isDarkMode ? 'glass-container glass-physics-clear active:bg-white/5' : 'bg-white border border-brand-border-light active:bg-brand-bg-light'}`}
            style={
              isDarkMode
                ? ({
                    '--glass-specular-intensity': '0.2',
                    '--glass-radius': '12px',
                  } as React.CSSProperties)
                : {}
            }
          >
            {isDarkMode && (
              <>
                <div className="glass-lens" />
                <div
                  className="absolute inset-0 z-[1] pointer-events-none"
                  style={{ backgroundColor: 'var(--glass-tint)' }}
                />
                <span className="glass-rim-v2" />
              </>
            )}
            <div className="absolute top-[12px] left-[12px] w-[25px] h-[25px] flex items-center justify-center z-10">
              <img loading="lazy" decoding="async"                 src={isDarkMode ? ASSETS.CHAT : ASSETS.CHAT_BLACK}
                alt=""
                className="w-[18px] h-[18px]"
              />
            </div>
            <div className="flex flex-col items-start w-full pl-[36px] z-10">
              <h4
                className={`text-[14px] font-regular font-satoshi mb-[2px] ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Chat with us
              </h4>
              <p
                className={`text-[12px] font-medium font-satoshi leading-tight text-left ${isDarkMode ? 'text-white/50' : 'text-brand-text-muted'}`}
              >
                Zing is here to help! Chat with Zing to clear your doubts.
              </p>
            </div>
            <ChevronRight
              className={`absolute top-[12px] right-[14px] w-5 h-5 z-10 ${isDarkMode ? 'text-white/40' : 'text-brand-text-muted'}`}
            />
          </button>
        </div>
      </main>
    </div>
  );
};
export default HelpSupport;
