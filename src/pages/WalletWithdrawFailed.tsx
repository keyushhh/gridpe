import { ASSETS } from '@/constants/assets';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useTheme } from 'next-themes';
const WalletWithdrawFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const rawAmount = location.state?.amount;
  const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount || '0');
  const formattedAmount = (amount || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <div
      className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top ${isDarkMode ? 'bg-background' : 'bg-background'}`}
      style={
        isDarkMode
          ? {
              backgroundColor: 'hsl(var(--background))',
              backgroundImage: `url(${ASSETS.ERROR_BG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
            }
          : {}
      }
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: 'hsl(var(--destructive))',
            filter: 'blur(60px)',
            opacity: 1.2,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-center relative z-10 shrink-0">
        <div className="absolute left-5">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi`}
        >
          Withdraw
        </h1>
      </div>
      <div className="flex-1 flex flex-col items-center px-5 pt-[16px] z-10">
        {/* Icon - 16px below heading */}
        <img
          src={isDarkMode ? ASSETS.CANCELLED_ICO : ASSETS.CROSS_ICON_LIGHT}
          alt="Cancelled"
          className="w-[62px] h-[62px]"
        />
        {/* Sub-text - 32px below icon */}
        <h2
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold mt-[32px] text-center font-satoshi`}
        >
          Your money got cold feet.
        </h2>
        {/* Container - 25px below sub-text */}
        <div
          className={`mt-[25px] w-[362px] min-h-[180px] rounded-[13px] relative overflow-hidden flex flex-col items-start justify-center text-left px-[22px] border ${isDarkMode ? 'border-white/10' : 'border-border'}`}
          style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none',
          }}
        >
          <p
            className={`${isDarkMode ? 'text-muted-foreground' : 'text-black'} text-[16px] font-normal leading-tight font-satoshi`}
          >
            We tried sending {formattedAmount} to your bank. It hesitated, paused, whispered “I’m
            not ready for this” and ran back into your wallet.
          </p>
          <div style={{ height: '18px' }} />
          <p
            className={`${isDarkMode ? 'text-muted-foreground' : 'text-black'} text-[16px] font-normal leading-tight font-satoshi`}
          >
            No worries - you won’t lose a rupee. It’s still safe with us, clinging to the comfort of
            digital walls. Check your payment method, try again, and remind your bank who’s the
            boss.
          </p>
        </div>
        {/* CTAs Section - 72px below container */}
        <div className="mt-auto mb-4 w-full flex flex-col items-center overflow-hidden">
          <button
            onClick={() => navigate(ROUTES.WALLET_WITHDRAW)}
            className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center active:scale-95 transition-transform font-satoshi ${isDarkMode ? '' : 'bg-primary'}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}
            }
          >
            Retry Withdrawal
          </button>
          <p
            className={`mt-[12px] ${isDarkMode ? 'text-white/70' : 'text-black'} text-[12px] font-normal font-satoshi`}
          >
            (Because second chances are a thing.)
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className={`mt-[32px] w-full h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center active:scale-95 transition-transform font-satoshi ${isDarkMode ? '' : 'bg-black'}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}
            }
          >
            Go Home
          </button>
          <p
            className={`mt-[12px] ${isDarkMode ? 'text-white/70' : 'text-black'} text-[12px] font-normal font-satoshi`}
          >
            (Let me pretend I didn’t just panic.)
          </p>
        </div>
      </div>
    </div>
  );
};
export default WalletWithdrawFailed;
