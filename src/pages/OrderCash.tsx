import React, { useState , useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { supabase, USER_ID } from "@/lib/supabase";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import pillContainerBg from "@/assets/pill-container-bg.png";
import infoContainerBg from "@/assets/order-cash-info-bg.png";
import backspaceIcon from "@/assets/backspace.png";
import BackButton from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";

const OrderCash = () => {
  const navigate = useNavigate();
  const { walletLimit, walletBalance } = useUser(); // walletBalance now from useUser
  const isWalletLimitReached = walletBalance >= walletLimit;
  const [amount, setAmount] = useState<string>("0.00");
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Removed the useEffect that fetched walletBalance, as it's now from UserContext

  const handleKeyPress = (key: string) => {
    setAmount((prev) => {
      // If currently "0.00", replace with the new key (unless it's a dot)
      if (prev === "0.00") {
        return key === "." ? "0." : key;
      }

      // Prevent multiple dots
      if (key === "." && prev.includes(".")) {
        return prev;
      }

      // Limit to 2 decimal places
      if (prev.includes(".")) {
        const [whole, decimal] = prev.split(".");
        if (decimal && decimal.length >= 2) {
          return prev;
        }
      }

      return prev + key;
    });
  };

  const handleBackspace = () => {
    setAmount((prev) => {
      if (prev.length <= 1) return "0.00";
      if (prev === "0.00") return "0.00";
      return prev.slice(0, -1);
    });
  };

  const handlePillClick = (val: string) => {
    setAmount(val);
  };

  const KeypadButton = ({ label, onClick, icon }: { label?: string; onClick?: () => void; icon?: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`w-[113px] h-[65px] rounded-xl flex items-center justify-center active:bg-[#5260FE] active:text-white transition-colors group bg-black text-white shadow-sm`}
    >
      {icon ? (
        <div className="group-active:brightness-200">
          {React.cloneElement(icon as React.ReactElement, {
            style: { filter: 'brightness(0) saturate(100%) invert(1)' },
            className: `${(icon as React.ReactElement).props.className} group-active:filter-none`
          })}
        </div>
      ) : (
        <span className="font-bold font-sans text-[32px] group-active:text-white text-white">{label}</span>
      )}
    </button>
  );

  const isZero = amount === "0.00";

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Purple Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}

      {/* Header - Standard Single Row */}
      <div className="px-5 pt-4 flex items-center justify-between z-10">
        {/* Back Button */}
        <BackButton onClick={() => navigate("/home")} />


        {/* Title - Centered */}
        <h1 className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Order Cash
        </h1>

        {/* Spacer for centering */}
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-[60px] z-10 w-full">
        {/* Amount Display */}
        <div className={`flex items-center justify-center transition-opacity duration-200 ${isZero ? 'opacity-50' : 'opacity-100'}`}>
          <span className={`text-[32px] font-bold font-sans mr-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>â‚¹</span>
          <span className={`text-[32px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>{amount}</span>
        </div>

        {/* Divider */}
        <div className={`w-[238px] h-[1px] mt-[4.5px] ${isDarkMode ? 'bg-[#373737]' : 'bg-[#E6E8EB]'}`} />

        {/* Balance Text */}
        <p className={`text-[12px] font-sans font-normal mt-[8px] mb-[17px] ${parseFloat(amount) > walletBalance ? 'text-[#FF3B30]' : isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          Total Available Balance â‚¹ {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {parseFloat(amount) > 0 && parseFloat(amount) < 500 && (
          <p className="text-[#FF3B30] text-[12px] font-normal font-sans mb-[17px] -mt-[12px]">
            Amount needs to be â‚¹500 or more
          </p>
        )}

        {/* Pills */}
        <div className="flex gap-4 mb-8">
          {["500", "1000", "1500"].map((val) => (
            <button
              key={val}
              onClick={() => handlePillClick(val)}
              className={`relative h-[30px] flex items-center justify-center px-3 py-[6px] transition-transform active:scale-95 ${!isDarkMode ? 'rounded-full bg-black' : ''}`}
            >
              {isDarkMode && (
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${pillContainerBg})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}
              <span className={`relative z-10 text-[12px] font-medium font-sans text-white`}>
                +â‚¹{val}
              </span>
            </button>
          ))}
        </div>

        {/* Spacer to push everything else down to bottom */}
        <div className="flex-1" />

        {/* Info Container */}
        <div className="w-full px-5 pb-[16px]">
          <div
            className={`w-full h-[61px] relative flex flex-col justify-center px-[18px] py-[10px] ${!isDarkMode ? 'bg-[#FFFFFF] rounded-[16px] border border-[#E9EAEB]' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${infoContainerBg})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            } : {}}
          >
            <p className={`text-[14px] font-medium font-sans mb-[9px] leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Amount will be held from wallet
            </p>
            <p className={`text-[12px] font-light font-sans leading-none ${isDarkMode ? 'text-white' : 'text-black/60'}`}>
              You wonâ€™t be charged unless the delivery is completed.
            </p>
          </div>
        </div>

        {/* Keypad Container */}
        <div className={`w-full relative rounded-t-[32px] overflow-hidden ${!isDarkMode ? 'border-t border-[#E6E8EB]' : ''}`}>
          {/* Gradient Border Wrapper (Dark Mode Only) */}
          {isDarkMode && (
            <div
              className="absolute inset-0 rounded-t-[32px] pointer-events-none"
              style={{
                padding: '0.63px', // Border width
                background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor'
              }}
            />
          )}

          {/* Inner Content Background */}
          <div
            className="w-full h-full p-[20px] pb-[40px] backdrop-blur-[25px]"
            style={{
              backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 0.31)' : '#FFFFFF',
            }}
          >
            <div className="flex flex-col gap-[10px] items-center relative z-10">
              {/* Row 1 */}
              <div className="flex gap-[10px]">
                <KeypadButton label="1" onClick={() => handleKeyPress("1")} />
                <KeypadButton label="2" onClick={() => handleKeyPress("2")} />
                <KeypadButton label="3" onClick={() => handleKeyPress("3")} />
              </div>
              {/* Row 2 */}
              <div className="flex gap-[10px]">
                <KeypadButton label="4" onClick={() => handleKeyPress("4")} />
                <KeypadButton label="5" onClick={() => handleKeyPress("5")} />
                <KeypadButton label="6" onClick={() => handleKeyPress("6")} />
              </div>
              {/* Row 3 */}
              <div className="flex gap-[10px]">
                <KeypadButton label="7" onClick={() => handleKeyPress("7")} />
                <KeypadButton label="8" onClick={() => handleKeyPress("8")} />
                <KeypadButton label="9" onClick={() => handleKeyPress("9")} />
              </div>
              {/* Row 4 */}
              <div className="flex gap-[10px]">
                <KeypadButton label="." onClick={() => handleKeyPress(".")} />
                <KeypadButton label="0" onClick={() => handleKeyPress("0")} />
                <KeypadButton
                  onClick={handleBackspace}
                  icon={<img src={backspaceIcon} alt="Backspace" className="w-[18px] h-[18px] object-contain" />}
                />
              </div>

              {/* CTA */}
              <div className="w-full mt-[32px]">
                <Button
                  onClick={() => navigate("/order-cash-summary", { state: { amount } })}
                  disabled={parseFloat(amount) < 500 || parseFloat(amount) > walletBalance}
                  className="w-full h-[48px] bg-[#5260FE] hover:bg-[#5260FE]/90 text-white rounded-full text-[16px] font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {parseFloat(amount) > walletBalance ? "Insufficient Balance" : "Place Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCash;

