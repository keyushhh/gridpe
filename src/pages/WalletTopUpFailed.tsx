import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import failedLightIcon from '../assets/failed-light.svg';
import elipseRedIcon from '../assets/elipse-red.svg';

const WalletTopUpFailed: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (location.state?.amount) {
      setAmount(Number(location.state.amount));
    }
  }, [location.state]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);

  const handleTryAgain = () => {
    navigate('/order-summary', {
      state: {
        amount,
        retry: true,
        paymentMethod: location.state?.paymentMethod || null,
        upiId: location.state?.upiId || undefined,
      }
    });
  };

  const handleGoBack = () => {
    navigate('/wallet-add-money');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden font-sans bg-white dark:bg-[#0F1115]">
      {/* Red Glowing Orb at the top */}
      <div
        className="absolute top-[-150px] left-1/2 transform -translate-x-1/2 w-[500px] h-[400px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(255, 59, 48, 0.12) 0%, rgba(255, 255, 255, 0) 75%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Top Content */}
      <div className="flex flex-col items-center w-full mt-10 z-10">
        {/* Heading */}
        <h1 className="text-[#1A1A1A] dark:text-white text-[26px] font-bold tracking-tight">
          Payment Failed!
        </h1>

        {/* Failed Icon – 12px below heading */}
        <div className="mt-[12px]">
          <img
            src={failedLightIcon}
            alt="Failed"
            className="w-[62px] h-[62px] object-contain"
          />
        </div>

        {/* Error Text – 35px below icon */}
        <h2 className="mt-[35px] text-black dark:text-white text-[18px] font-bold text-center max-w-[90%] leading-none">
          Something went horribly wrong... financially.
        </h2>

        {/* Info Card – 20px below text */}
        <div
          className="mt-[20px] w-full rounded-[12px] pt-[11px] pb-[18px] px-[15px] relative border border-[#E9EAEB] dark:border-[#2A2D35]"
          style={{
            backgroundColor: "transparent",
          }}
        >
          <p className="text-[#1A1A1A] dark:text-white text-[16px] font-medium leading-normal">
            We tried. Your bank tried. Even your card looked motivated.
          </p>

          <p className="mt-[12px] text-[#4A4A4A] dark:text-[#AFAFAF] text-[16px] font-normal" style={{ lineHeight: '120%' }}>
            But something tripped in the matrix, and{" "}
            <span className="text-[#1A1A1A] dark:text-white font-medium">
              {formatCurrency(amount)}
            </span>{" "}
            didn’t make it to your wallet. Don’t worry – if any money was deducted,
            it’ll crawl back to you within 2–3 biz days. In the meantime? Deep breaths
            and check your balance. Emotionally and otherwise.
          </p>

          <div className="mt-[20px] flex items-center gap-[12px]">
            <img src={elipseRedIcon} alt="" className="w-[12px] h-[12px] object-contain" />
            <span className="text-[#666666] dark:text-[#888888] text-[12px] font-normal">
              Transaction Ghosted
            </span>
          </div>
        </div>
      </div>

      {/* CTAs – 40px below container */}
      <div className="w-full mt-[40px] flex flex-col gap-[12px] z-10">
        <button
          onClick={handleTryAgain}
          className="w-full h-[48px] flex items-center justify-center text-white dark:text-black bg-black dark:bg-white text-[16px] font-medium font-sans active:scale-[0.98] transition-all rounded-full"
        >
          Try Again (If you dare)
        </button>

        <button
          onClick={handleGoBack}
          className="w-full h-[48px] flex items-center justify-center text-black dark:text-white bg-[#EBEBEB] dark:bg-[#1E2128] text-[16px] font-medium font-sans active:scale-[0.98] transition-all rounded-full"
        >
          Go Back!
        </button>
      </div>
    </div>
  );
};

export default WalletTopUpFailed;
