import { ASSETS } from '@/constants/assets';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useUser } from '@/contexts/UserContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { tiers, tierChipColorMap, tierExpandCardMapLight } from '@/lib/walletTiers';
const WalletTierDetails = () => {
  const { tierId } = useParams<{ tierId: string }>();
  const navigate = useNavigate();
  const walletTier: any = (() => {}) as any;
  const scheduledDowngrade: any = (() => {}) as any;
  const isDarkMode = useIsDarkMode();
  const currentTier = tiers.find(t => t.name.toLowerCase() === tierId?.toLowerCase());
  if (!currentTier) return null;
  const expandImage = isDarkMode
    ? currentTier.headerImage
    : tierExpandCardMapLight[currentTier.name];
  const chipStyle = isDarkMode
    ? {
        backgroundImage: `url(${currentTier.chip})`,
        backgroundSize: '100% 100%' as const,
        backgroundRepeat: 'no-repeat' as const,
      }
    : {
        backgroundColor: tierChipColorMap[currentTier.name],
        borderRadius: '12px',
      };
  return (
    <div
      className="h-full w-full flex flex-col relative overflow-y-auto no-scrollbar font-satoshi safe-top safe-bottom bg-background"
      style={{
        fontFamily: "'Satoshi', sans-serif",
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      <div className="relative flex items-center justify-between px-5 pt-4 pb-2 shrink-0 z-50">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`text-[22px] font-medium text-center absolute left-1/2 -translate-x-1/2 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Wallet Settings
        </h1>
        <div className="w-10 h-10" />
      </div>
      <div
        className="relative w-[362px] mx-auto flex flex-col mt-[28px] px-[14px] pt-[14px] pb-6 rounded-[20px]"
        style={{
          backgroundImage: `url(${expandImage})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          border: !isDarkMode ? '1px solid hsl(var(--border))' : 'none',
        }}
      >
        <div
          className="absolute flex items-center justify-center rounded-full text-[10px] font-medium text-white z-20"
          style={{
            top: '12px',
            right: '12px',
            width: '88px',
            height: '24px',
            ...chipStyle,
          }}
        >
          {currentTier.badge}
        </div>
        <div className="flex flex-col items-start pl-[63px]">
          <span
            className={`text-[15px] font-medium tracking-normal ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {currentTier.name.toUpperCase()}
          </span>
          <div className="flex items-end gap-2 mt-1">
            <span
              className={`text-[34px] font-bold leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {currentTier.walletLimit}
            </span>
            <span
              className={`text-[16px] font-medium mb-[2px] ${isDarkMode ? 'text-white/70' : 'text-black/50'}`}
            >
              / wallet limit
            </span>
          </div>
        </div>
        <div
          className={`w-[334px] mt-[16px] rounded-[13px] p-[10px] overflow-y-auto no-scrollbar ${!isDarkMode ? 'border border-border' : ''}`}
          style={{
            height: currentTier.infoHeight,
            paddingBottom: currentTier.name === 'Pro' ? '20px' : '10px',
            ...(isDarkMode
              ? {
                  backgroundImage: `url(${ASSETS.INFOBG})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }
              : {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }),
          }}
        >
          <div className="flex flex-col gap-[10px]">
            {/* Verification */}
            <div>
              <p
                className={`text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi ${isDarkMode ? 'text-muted-foreground' : 'text-black/40'}`}
              >
                Verification
              </p>
              <p
                className={`text-[12px] font-medium tracking-[0px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {currentTier.detailedVerification}
              </p>
            </div>
            {/* Wallet Limit & Daily Top Up Row */}
            <div className="flex items-start">
              <div className="w-auto">
                <p
                  className={`text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi ${isDarkMode ? 'text-muted-foreground' : 'text-black/40'}`}
                >
                  Wallet limit
                </p>
                <p
                  className={`text-[12px] font-medium tracking-[0px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {currentTier.walletLimit}
                </p>
              </div>
              <div className="ml-[100px]">
                <p
                  className={`text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi ${isDarkMode ? 'text-muted-foreground' : 'text-black/40'}`}
                >
                  Daily top up limit
                </p>
                <p
                  className={`text-[12px] font-medium tracking-[0px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {currentTier.dailyTopUpLimit}
                </p>
              </div>
            </div>
            {/* Withdrawals */}
            <div>
              <p
                className={`text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi ${isDarkMode ? 'text-muted-foreground' : 'text-black/40'}`}
              >
                Withdrawals
              </p>
              <p
                className={`text-[12px] font-medium tracking-[0px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {currentTier.withdrawals}
              </p>
            </div>
            {/* Limitations */}
            <div>
              <p
                className={`text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi ${isDarkMode ? 'text-muted-foreground' : 'text-black/40'}`}
              >
                Limitations
              </p>
              <ul
                className={`list-disc pl-4 text-[12px] font-medium tracking-[0px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {currentTier.detailedLimitations
                  .split(/\d\.\s/)
                  .filter(Boolean)
                  .map((limitation, index) => (
                    <li key={index} className="leading-snug">
                      {limitation.trim()}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
        {/* Why you're on STARTER? */}
        <div className="mt-[10px]">
          <h3
            className={`text-[16px] font-medium tracking-[-0.3px] mb-[6px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {currentTier.whyTitle}
          </h3>
          <ul
            className={`list-disc pl-4 text-[14px] tracking-[-0.3px] font-satoshi leading-[152%] ${isDarkMode ? 'font-light text-muted-foreground' : 'font-normal text-black/80'}`}
          >
            {currentTier.whyContent.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
        {/* Craving more power? */}
        {currentTier.powerTitle && (
          <div className="mt-[10px]">
            <h3
              className={`text-[16px] font-medium tracking-[-0.3px] mb-[6px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {currentTier.powerTitle}
            </h3>
            <p
              className={`text-[14px] tracking-[-0.3px] font-satoshi leading-[152%] whitespace-pre-line ${isDarkMode ? 'font-light text-muted-foreground' : 'font-normal text-black/80'}`}
            >
              {currentTier.powerContent}
            </p>
          </div>
        )}
        {/* Downgrade Options */}
        {currentTier.downgradeTitle && (
          <div className="mt-[10px]">
            <h3
              className={`text-[16px] font-medium tracking-[-0.3px] mb-[6px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {currentTier.downgradeTitle}
            </h3>
            <p
              className={`text-[14px] tracking-[-0.3px] font-satoshi leading-[152%] whitespace-pre-line ${isDarkMode ? 'font-light text-muted-foreground' : 'font-normal text-black/80'}`}
            >
              {currentTier.downgradeContent}
            </p>
          </div>
        )}
        {/* Note Container */}
        <div
          className={`w-[334px] mt-[20px] mx-auto rounded-[10px] border pt-[10px] pr-[10px] pl-[10px] pb-[20px] ${isDarkMode ? 'border-border' : 'border-border'}`}
        >
          <h3
            className={`text-[12px] font-bold tracking-[-0.3px] mb-[7px] font-satoshi ${isDarkMode ? 'text-muted-foreground' : 'text-black'}`}
          >
            Note:
          </h3>
          <p
            className={`text-[12px] font-medium leading-[131%] font-satoshi ${isDarkMode ? 'text-foreground' : 'text-black'}`}
          >
            {currentTier.note}
          </p>
        </div>
        {/* CTA Button */}
        {(() => {
          const currentTierIndex = tiers.findIndex(t => t.name === walletTier);
          const viewedTierIndex = tiers.findIndex(t => t.name === currentTier.name);
          const isDowngrade = viewedTierIndex < currentTierIndex;
          const isUpgrade = viewedTierIndex > currentTierIndex;
          const isCurrent = viewedTierIndex === currentTierIndex;
          const handleTierAction = () => {
            if (scheduledDowngrade) return;
            if (isUpgrade) {
              navigate(currentTier.buttonAction, {
                state: { flow: 'upgrade', tier: currentTier.name },
              });
            } else if (isDowngrade) {
              navigate(ROUTES.DOWNGRADE_SUMMARY, {
                state: { flow: 'downgrade', tier: currentTier.name },
              });
            }
          };
          if (isCurrent) {
            if (currentTier.name === 'Starter') {
              return (
                <button
                  onClick={() => {
                    if (!scheduledDowngrade) navigate(currentTier.buttonAction);
                  }}
                  disabled={!!scheduledDowngrade}
                  className={`w-full h-[52px] rounded-full bg-primary text-white text-[16px] font-medium transition-transform flex items-center justify-center shadow-lg shadow-primary/20 mt-[20px] ${scheduledDowngrade ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  {currentTier.buttonText}
                </button>
              );
            }
            return (
              <button
                disabled
                className="w-full h-[52px] rounded-full bg-primary text-white text-[16px] font-medium flex items-center justify-center mt-[20px] opacity-50 cursor-not-allowed"
              >
                Current Plan
              </button>
            );
          }
          return (
            <button
              onClick={handleTierAction}
              disabled={!!scheduledDowngrade}
              className={`w-full h-[52px] rounded-full bg-primary text-white text-[16px] font-medium transition-transform flex items-center justify-center shadow-lg shadow-primary/20 mt-[20px] ${scheduledDowngrade ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isDowngrade ? 'Downgrade Now' : 'Upgrade Now'}
            </button>
          );
        })()}
      </div>
    </div>
  );
};
export default WalletTierDetails;

