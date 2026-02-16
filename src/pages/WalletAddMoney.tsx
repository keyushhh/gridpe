import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import pillContainerBg from "@/assets/pill-container-bg.png";
import backspaceIcon from "@/assets/backspace.png";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

const WalletAddMoney = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { walletLimit } = useUser();
  const balance = location.state?.balance || "0.00";
  const [amount, setAmount] = useState<string>("0.00");

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
      className="w-[113px] h-[65px] bg-[#000000] rounded-xl flex items-center justify-center active:bg-[#5260FE] active:text-white transition-colors group"
    >
      {icon ? (
        <div className="group-active:brightness-200">
          {icon}
        </div>
      ) : (
        <span className="text-white group-active:text-white font-bold font-sans text-[32px]">{label}</span>
      )}
    </button>
  );

  const isZero = amount === "0.00";

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header - Standard Single Row */}
      <div className="px-5 pt-4 flex items-center justify-between z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate("/home")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md relative z-20"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Title - Centered */}
        <h1 className="text-white text-[18px] font-medium font-sans">
          Wallet
        </h1>

        {/* Spacer for centering */}
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-[60px]">
        {/* Amount Display */}
        <div className={`flex items-center justify-center transition-opacity duration-200 ${isZero ? 'opacity-50' : 'opacity-100'}`}>
          <span className="text-white text-[32px] font-black font-sans mr-1">₹</span>
          <span className="text-white text-[32px] font-black font-sans">{amount}</span>
        </div>

        {/* Divider */}
        <div className="w-[238px] h-[1px] bg-[#373737] mt-[4.5px]" />

        {/* Balance Text */}
        <p className="text-white/60 text-[12px] font-sans font-normal mt-[8px] mb-[17px]">
          Total Available Balance ₹ {balance}
        </p>

        {/* Error Message */}
        {parseFloat(amount) > 0 && (
          <>
            {parseFloat(amount) < 500 && (
              <p className="text-[#FF3B30] text-[12px] font-normal font-sans mb-[17px] -mt-[12px]">
                Amount needs to be ₹500 or more
              </p>
            )}
            {parseFloat(amount) > walletLimit && (
              <p className="text-[#FF3B30] text-[12px] font-normal font-sans mb-[17px] -mt-[12px]">
                Amount cannot exceed ₹{walletLimit.toLocaleString('en-IN')}
              </p>
            )}
          </>
        )}

        {/* Pills */}
        <div className="flex gap-4 mb-8">
          {["500", "1000", "1500"].map((val) => (
            <button
              key={val}
              onClick={() => handlePillClick(val)}
              className="relative h-[30px] flex items-center justify-center px-3 py-[6px] transition-transform active:scale-95"
            >
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${pillContainerBg})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              />
              <span className="relative z-10 text-white text-[12px] font-medium font-sans">
                +₹{val}
              </span>
            </button>
          ))}
        </div>

        {/* Spacer to push everything else down to bottom */}
        <div className="flex-1" />

        {/* Info Container */}
        <div className="w-full px-5 pb-[16px]">
          <div
            className="w-full h-[81px] rounded-[13px] flex flex-col justify-center"
            style={{
              padding: "9px 19px",
              backgroundColor: "rgba(25, 25, 25, 0.31)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "inset 0 0 0 0.63px rgba(255, 255, 255, 0.12)",
            }}
          >
            <p className="text-white text-[14px] font-medium font-sans mb-[6px] leading-none">
              Note:
            </p>
            <p className="text-white text-[14px] font-normal font-sans leading-none">
              Some payment methods may include a small processing fee. UPI is always free.
            </p>
          </div>
        </div>


        {/* Keypad Container */}
        <div className="w-full relative rounded-t-[32px] overflow-hidden">
          {/* Gradient Border Wrapper */}
          {/* We use a pseudo-element or absolute div for the gradient border */}
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

          {/* Inner Content Background */}
          <div
            className="w-full h-full p-[20px] pb-[40px] backdrop-blur-[25px]"
            style={{
              backgroundColor: 'rgba(23, 23, 23, 0.31)', // #171717 at 31%
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
                  onClick={() => {
                    const val = parseFloat(amount);
                    if (val >= 500 && val <= walletLimit) {
                      navigate('/add-payment-method', { state: { amount } });
                    }
                  }}
                  className={`w-full h-[48px] text-white rounded-full text-[16px] font-medium font-sans ${parseFloat(amount) >= 500 && parseFloat(amount) <= walletLimit
                      ? "bg-[#5260FE] hover:bg-[#5260FE]/90"
                      : "bg-[#5260FE]/50 cursor-not-allowed"
                    }`}
                >
                  Add Money
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletAddMoney;