import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import bgLightMode from "@/assets/bg-light.png";
import pillContainerBg from "@/assets/pill-container-bg.png";
import backspaceIcon from "@/assets/backspace.png";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { supabase, USER_ID } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const WalletAddMoney = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const location = useLocation() as { state: { balance?: string; from?: string } };
  const isDarkMode = theme === 'dark' || theme === 'system';
  const { walletLimit, refreshBalance, fetchProfileData } = useUser();
  const balance = location.state?.balance || "0.00";
  const fromWallet = location.state?.from === 'wallet';
  const [amount, setAmount] = useState<string>("0.00");
  const [isLoading, setIsLoading] = useState(false);

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
          {React.isValidElement(icon) ? (
            React.cloneElement(icon as React.ReactElement, {
              style: { filter: 'brightness(0) saturate(100%) invert(1)' },
              className: `${(icon as React.ReactElement).props.className || ''} group-active:filter-none`
            })
          ) : (
            icon
          )}
        </div>
      ) : (
        <span className="font-bold font-sans text-[32px] group-active:text-white text-white">{label}</span>
      )}
    </button>
  );

  const isZero = amount === "0.00";

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Purple Glow (Top Center) */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header - Standard Single Row */}
      <div className="px-5 pt-12 pb-2 flex items-center justify-between z-10">
        {/* Back Button */}
        <button
          onClick={() => fromWallet ? navigate(-1) : navigate("/home")}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/10 backdrop-blur-md' : 'bg-white border border-[#E9EAEB]'}`}
        >
          <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>

        {/* Title - Centered */}
        <h1 className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Wallet
        </h1>

        {/* Spacer for centering */}
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-[60px]">
        {/* Amount Display */}
        <div className={`flex items-center justify-center transition-opacity duration-200 ${isZero ? 'opacity-50' : 'opacity-100'}`}>
          <span className={`text-[32px] font-bold font-sans mr-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>₹</span>
          <span className={`text-[32px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>{amount}</span>
        </div>

        {/* Divider */}
        <div className="w-[238px] h-[1px] bg-[#373737] mt-[4.5px]" />

        {/* Balance Text */}
        <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[12px] font-sans font-normal mt-[8px] mb-[17px]`}>
          Available Balance: ₹ {balance} • Wallet Capacity: ₹ {walletLimit.toLocaleString('en-IN')}
        </p>

        {parseFloat(amount) > 0 && Math.floor(parseFloat(amount)) < 500 && (
          <p className="text-[#FF3B30] text-[12px] font-normal font-sans mb-[17px] -mt-[12px]">
            Amount needs to be ₹500 or more
          </p>
        )}

        {/* Pills */}
        <div className="flex gap-4 mb-8">
          {["500", "1000", "1500"].map((val) => (
            <button
              key={val}
              onClick={() => handlePillClick(val)}
              className="relative h-[30px] flex items-center justify-center px-3 py-[6px] transition-transform active:scale-95"
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
              {!isDarkMode && (
                <div className="absolute inset-0 w-full h-full bg-black rounded-full" />
              )}
              <span className={`relative z-10 text-[12px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-white'}`}>
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
              backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "#FFFFFF",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: isDarkMode ? "inset 0 0 0 0.63px rgba(255, 255, 255, 0.12)" : "none",
              border: isDarkMode ? "none" : "1px solid #E9EAEB",
            }}
          >
            <p className={`text-[14px] font-medium font-sans mb-[6px] leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Note:
            </p>
            <p className={`text-[14px] font-normal font-sans leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Minimum top-up is ₹500. UPI payments are always free.
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
                  onClick={async () => {
                    const val = parseFloat(amount);
                    if (Math.floor(val) >= 500) {
                      try {
                        setIsLoading(true);

                        const { data: { user } } = await supabase.auth.getUser();
                        const currentUserId = user?.id || USER_ID;

                        const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
                          body: {
                            amount: val,
                            userId: currentUserId
                          },
                          headers: {
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                          }
                        });

                        if (error) {
                          console.error("Functions error:", error);
                          let errorMessage = error.message || "Failed to create payment order";

                          // Try to extract the specific error message from the response body
                          try {
                            // Supabase FunctionsHttpError usually has the message in the body
                            const errorResponse = (error as any).context;
                            if (errorResponse) {
                              const body = await errorResponse.json();
                              if (body && body.error) {
                                errorMessage = body.error;
                              }
                            }
                          } catch (e) {
                            console.warn("Could not parse error response body:", e);
                          }

                          throw new Error(errorMessage);
                        }

                        // 🛠️ THE FIX: Parse the data if Supabase returned it as a raw string
                        let order = data;
                        if (typeof data === 'string') {
                          try {
                            order = JSON.parse(data);
                          } catch (e) {
                            console.error("Could not parse data string:", data);
                          }
                        }

                        // Now order.id will safely exist
                        if (!order || !order.id) {
                          console.error("Raw order data:", order);
                          throw new Error("Invalid Razorpay order response");
                        }

                        const options = {
                          key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use environment variable
                          amount: order.amount,
                          currency: order.currency,
                          name: "Grid.pe",
                          description: "Wallet Top-up",
                          order_id: order.id,
                          handler: async function (response: any) {
                            try {
                              const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-payment", {
                                body: {
                                  razorpay_order_id: response.razorpay_order_id,
                                  razorpay_payment_id: response.razorpay_payment_id,
                                  razorpay_signature: response.razorpay_signature
                                }
                              });

                              if (verifyError) {
                                throw verifyError;
                              }

                              // Safely parse verifyData just like we did above
                              let verification = verifyData;
                              if (typeof verifyData === 'string') {
                                verification = JSON.parse(verifyData);
                              }

                              if (verification && verification.success) {
                                console.log("Payment verified successfully!");

                                // Sync wallet balance and profile logic with hardening delay
                                console.log(`Verification success for ${user.id}, waiting 2s for DB consistency...`);
                                await new Promise(resolve => setTimeout(resolve, 2000));

                                await refreshBalance(user.id);
                                await fetchProfileData(user.id);

                                navigate("/wallet-topup-success", {
                                  state: {
                                    totalAmount: val,
                                    creditAmount: val,
                                    paymentMethod: "razorpay"
                                  }
                                });
                              } else {
                                navigate("/wallet-topup-failed", {
                                  state: { error: verification?.message || "Payment verification failed." }
                                });
                              }

                            } catch (err) {
                              console.error("Verification error", err);
                              alert("Something went wrong during verification.");
                            }
                          },
                          theme: {
                            color: "#5260FE" // Matches your Grid.pe brand styling perfectly
                          },
                          modal: {
                            ondismiss: function () {
                              setIsLoading(false);
                              navigate("/wallet-topup-failed", {
                                state: { error: "Payment was cancelled." }
                              });
                            }
                          }
                        };

                        const rzp = new window.Razorpay(options);

                        // Catch modal close/failures gracefully
                        rzp.on('payment.failed', function (response: any) {
                          console.error("Payment Failed:", response.error);
                          setIsLoading(false);
                          navigate("/wallet-topup-failed", {
                            state: { error: response.error.description || "Payment failed at the gateway." }
                          });
                        });

                        rzp.open();
                      } catch (err) {
                        console.error('Error creating Razorpay order:', err);
                        alert('Failed to initiate payment. Please check console for details.');
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full h-[48px] text-white rounded-full text-[16px] font-medium font-sans ${Math.floor(parseFloat(amount)) >= 500 && !isLoading
                    ? "bg-[#5260FE] hover:bg-[#5260FE]/90"
                    : "bg-[#5260FE]/50 cursor-not-allowed"
                    }`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Money"}
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