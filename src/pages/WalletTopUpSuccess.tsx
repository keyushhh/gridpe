import { ASSETS } from '@/constants/assets';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { hapticSuccess } from '@/utils/haptics';
import { formatINR } from '@/utils/format';
import { useUser } from '@/contexts/UserContext';
const WalletTopUpSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activateWallet } = useUser();
  const processedRef = useRef(false);
  // creditAmount is the actual amount added to wallet. totalAmount includes fees.
  const { totalAmount, creditAmount, paymentMethod } = location.state || {
    totalAmount: 0,
    creditAmount: 0,
    paymentMethod: null,
  };
  const [formattedAmount, setFormattedAmount] = useState<string>('0.00');
  useEffect(() => {
    // Display the amount that actually landed in the wallet
    const amountDisplay = creditAmount || totalAmount;
    if (amountDisplay) {
      setFormattedAmount(formatINR(amountDisplay, { showSymbol: false }));
      hapticSuccess();
    }
    // Process the transaction only once (for instance, activation)
    if (creditAmount && !processedRef.current) {
      processedRef.current = true;
      // Activate wallet (skip intro in future)
      activateWallet();
    }
  }, [creditAmount, totalAmount, activateWallet, paymentMethod]);
  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden font-sans safe-top bg-background dark:bg-background dark:bg-[url('@/assets/success-bg.png')] dark:bg-cover dark:bg-center dark:bg-no-repeat">
      {/* Green Glowing Orb at the top */}
      <div
        className="absolute top-[-150px] left-1/2 transform -translate-x-1/2 w-[500px] h-[400px] pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(12, 126, 75, 0.12) 0%, rgba(255, 255, 255, 0) 75%)',
          filter: 'blur(50px)',
        }}
      />
      {/* Top Content */}
      <div className="flex flex-col items-center w-full mt-10 z-10">
        {/* Heading */}
        <h1 className="text-foreground dark:text-white text-[26px] font-bold tracking-tight dark:font-satoshi dark:font-medium dark:text-[22px]">
          Payment Success!
        </h1>
        {/* Success Icon – 12px below heading */}
        <div className="mt-[12px]">
          <img
            src={ASSETS.SUCCESS}
            alt="Success"
            className="w-[62px] h-[62px] object-contain dark:hidden"
          />
          <img
            src={ASSETS.CHECK_ICON}
            alt="Success Dark"
            className="hidden dark:block w-[62px] h-[62px] object-contain"
          />
        </div>
        {/* Sub-text – 35px below icon */}
        <h2 className="mt-[35px] text-foreground dark:text-white text-[18px] font-bold text-center max-w-[90%] leading-none">
          Money? Added. Mood? Elevated.
        </h2>
        {/* Info Container – 20px below text */}
        <div
          className="mt-[20px] w-full rounded-[12px] pt-[11px] pb-[18px] px-[15px] relative border border-border"
          style={{
            backgroundColor: 'transparent',
          }}
        >
          <p className="text-foreground dark:text-white text-[16px] font-medium leading-normal">
            ₹{formattedAmount} just landed in your Grid.Pe wallet.
          </p>
          <p
            className="mt-[12px] text-muted-foreground dark:text-muted-foreground text-[16px] font-normal"
            style={{ lineHeight: '120%' }}
          >
            You didn’t add it to spend digitally. You added it... to make that cash come to YOU. No
            ATMs, no queues, no awkward eye contact.
            <br />
            Just pure financial laziness, powered by tech.
          </p>
          <div className="mt-[20px] flex items-center gap-[12px]">
            <img src={ASSETS.ELIPSE_GREEN} alt="" className="w-[12px] h-[12px] object-contain" />
            <span className="text-muted-foreground dark:text-muted-foreground text-[12px] font-normal">
              Wallet loaded.
            </span>
          </div>
        </div>
      </div>
      {/* CTA – 40px below container */}
      <div className="w-full mt-[40px] z-10">
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="w-full h-[48px] flex items-center justify-center text-white dark:text-white bg-black dark:bg-[url('@/assets/darkbg-cta.png')] dark:bg-cover dark:bg-center dark:bg-no-repeat dark:border-none text-[16px] font-medium font-sans active:scale-[0.98] transition-all rounded-full"
        >
          Order Cash Pickup
        </button>
      </div>
      {/* Footer Text */}
      <p className="text-muted-foreground dark:text-white/60 text-[12px] font-medium font-sans mt-[12px] text-center z-10">
        (Because walking to the ATM is so 2017)
      </p>
    </div>
  );
};
export default WalletTopUpSuccess;
