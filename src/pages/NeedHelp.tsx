import { ASSETS } from '@/constants/assets';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';

import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Order } from '@/types';
const ISSUE_CATEGORIES = [
  'I did not receive this order',
  'Order was delayed',
  'Wrong amount received',
  'Report a delivery partner fraud incident',
  'Report a safety incident',
  'Order cancelled but charged',
  'Other',
];
const NeedHelp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order as Order | null;
  const isDarkMode = useIsDarkMode();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  if (!order) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center text-white">
        <p>Order not found</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }
  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    const isProcessing = s === 'processing' || s === 'out_for_delivery' || s === 'arrived';
    const isSuccess = s === 'success' || s === 'delivered';
    if (isProcessing) {
      return {
        textClass: 'text-yellow-700 dark:text-yellow-600',
        bgColor: '#FACC15',
        bgOpacity: 0.21,
        icon: ASSETS.PROCESSING,
        statusIcon: ASSETS.REFRESH,
        statusFilter:
          'brightness(0) saturate(100%) invert(60%) sepia(59%) saturate(1914%) hue-rotate(18deg) brightness(95%) contrast(101%)',
        label: 'Processing',
      };
    } else if (isSuccess) {
      return {
        textClass: 'text-green-700 dark:text-green-500',
        bgColor: '#1CB956',
        bgOpacity: 0.21,
        icon: ASSETS.SUCCESS,
        statusIcon: ASSETS.CHECK,
        statusFilter: isDarkMode
          ? 'invert(53%) sepia(76%) saturate(446%) hue-rotate(92deg) brightness(94%) contrast(92%)'
          : 'none',
        label: 'Success',
      };
    } else {
      return {
        textClass: 'text-red-600 dark:text-red-400',
        bgColor: '#FF1E1E',
        bgOpacity: 0.21,
        icon: ASSETS.FAILED,
        statusIcon: ASSETS.CROSS,
        label: s === 'cancelled' ? 'Cancelled' : 'Failed',
      };
    }
  };
  const config = getStatusConfig(order.status);
  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      if (isToday) {
        return `Today | ${timeStr}`;
      } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-IN', { month: 'short' });
        return `${day} ${month} | ${timeStr}`;
      }
    } catch (e) {
      return 'Today | 12:00 PM';
    }
  };
  const hexAlpha = Math.round(config.bgOpacity * 255)
    .toString(16)
    .padStart(2, '0');
  return (
    <div
      className={`fixed inset-0 w-full flex flex-col ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
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
      <header className="px-5 safe-top pt-4 pb-4 flex items-center justify-between relative z-10 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`text-[20px] font-medium font-satoshi flex-1 text-center pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Need Help?
        </h1>
      </header>
      <main className="flex-1 px-5 pt-4 overflow-y-auto scrollbar-hide relative z-10 pb-32">
        {/* Order Summary Card (Mirrored from Bottom Sheet) */}
        <div
          className="relative mb-6 mx-auto overflow-hidden"
          style={{
            width: '362px',
            height: '137px',
            background: isDarkMode
              ? `${config.bgColor}${Math.round(config.bgOpacity * 255)
                  .toString(16)
                  .padStart(2, '0')}`
              : `${config.bgColor}36`,
            border: isDarkMode ? '0.63px solid transparent' : '1px solid #E9EAEB',
            borderRadius: '12px',
            backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
            WebkitBackdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
          }}
        >
          {/* Status Frame */}
          <div className="h-[25px] flex items-center pl-[13.5px]">
            <div className="flex items-center gap-[6px]">
              <img loading="lazy"
                src={config.statusIcon}
                alt=""
                className="w-[14px] h-[14px]"
                style={!isDarkMode ? { filter: config.statusFilter } : undefined}
              />
              <span
                className={`text-[12px] font-bold font-satoshi tracking-wide ${config.textClass}`}
              >
                {config.label}
              </span>
            </div>
          </div>
          <div
            className={`!absolute top-[25px] left-0 w-full glass-container glass-physics-clear z-10 rounded-[12px] ${!isDarkMode ? 'bg-white border border-brand-border-light' : ''}`}
            style={
              {
                height: '112px',
                '--glass-radius': '12px',
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
              <img loading="lazy"
                src={config.icon}
                alt=""
                className="absolute top-[17px] left-[17px] w-[35px] h-[35px]"
                style={!isDarkMode ? { filter: config.statusFilter } : undefined}
              />
              <div className="absolute top-[17px] left-[65px] flex flex-col">
                <span
                  className={`text-[16px] font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {order.meta_data?.type === 'CASH_ORDER' && order.meta_data.item_value
                    ? `Ordered ₹${order.meta_data.item_value} Cash`
                    : order.addresses?.label
                      ? `Order to ${order.addresses.label}`
                      : 'Cash Order'}
                </span>
                <span
                  className={`text-[12px] font-medium font-satoshi mt-1 ${isDarkMode ? 'text-white' : 'text-brand-text-muted'}`}
                >
                  {formatOrderDate(order.created_at)}
                </span>
              </div>
              <span
                className={`absolute top-[25px] right-[17px] text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                ₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <div
                className={`absolute left-[12px] h-[1px] ${isDarkMode ? 'bg-brand-border-mid' : 'bg-brand-border-light'}`}
                style={{ top: '65px', width: '338px' }}
              />
              <div
                className="absolute left-[17px] right-[17px] flex justify-between items-center px-0"
                style={{ top: '78px' }}
              >
                <span
                  className={`text-[12px] font-satoshi font-medium ${isDarkMode ? 'text-white' : 'text-brand-text-muted'}`}
                >
                  Order ID
                </span>
                <span
                  className={`text-[12px] font-bold font-satoshi tracking-wider uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  DTP{order.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Issue Category Section */}
        <section
          className={`w-full mb-4 pb-[14px] glass-container glass-physics-clear relative z-10 rounded-[12px] ${!isDarkMode ? 'bg-white border border-brand-border-light' : ''}`}
          style={
            {
              minHeight: '309px',
              '--glass-radius': '12px',
              '--glass-specular-intensity': '0.2',
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
          <div className="relative z-10">
            <div className="pt-[14px] px-[14px] pb-[14px]">
              <h3
                className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Issue Category
              </h3>
            </div>
            <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#747474]/23' : 'bg-brand-border-light'}`} />
            <div className="flex flex-col">
              {ISSUE_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-[12px] px-[14px] py-[8.5px] ${idx < ISSUE_CATEGORIES.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-brand-border-light') : ''}`}
                >
                  {selectedCategory === cat ? (
                    <div className="w-[18px] h-[18px] rounded-full bg-brand-primary flex items-center justify-center shrink-0">
                      <div className="w-[6px] h-[6px] rounded-full bg-white" />
                    </div>
                  ) : (
                    <div
                      className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 ${isDarkMode ? 'border-brand-primary' : 'border-brand-border-light'}`}
                    />
                  )}
                  <span
                    className={`text-[14px] font-satoshi font-normal text-left leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {cat}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
        {/* Description Section */}
        <section
          className={`w-full mb-4 glass-container glass-physics-clear relative z-10 rounded-[12px] ${!isDarkMode ? 'bg-white border border-brand-border-light' : ''}`}
          style={
            {
              minHeight: '166px',
              '--glass-radius': '12px',
              '--glass-specular-intensity': '0.2',
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
          <div className="relative z-10 p-[14px]">
            <h3
              className={`text-[14px] font-medium font-satoshi mb-[14px] ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Describe your issue (Optional)
            </h3>
            <div className="relative">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 200))}
                placeholder="Add any extra details about your issue..."
                className={`w-full h-[85px] bg-transparent text-[14px] font-satoshi resize-none focus:outline-none ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-brand-text-muted'}`}
              />
              <span
                className={`absolute -bottom-1 right-0 text-[10px] font-satoshi ${isDarkMode ? 'text-white/20' : 'text-brand-text-muted'}`}
              >
                {description.length}/200
              </span>
            </div>
          </div>
        </section>
      </main>
      {/* Bottom Submit Button */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-5 safe-bottom pb-4 z-20 ${isDarkMode ? 'bg-brand-bg-dark/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md border-t border-brand-border-light'}`}
      >
        <button
          disabled={!selectedCategory}
          className={`w-full h-12 rounded-full flex items-center justify-center text-white text-[16px] font-medium active:scale-95 transition-all
                        ${!selectedCategory ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
                    `}
          style={{
            backgroundColor: '#5260FE',
          }}
          onClick={() => {
            // Handle Submit logic
            navigate(ROUTES.HELP_SUCCESS);
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};
export default NeedHelp;
