import { ASSETS } from '@/constants/assets';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useTheme } from 'next-themes';
const ReportRiderConfirm = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no'>('yes');
  const otpDigits = ['1', '3', '0', '5', '9', '6'];
  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col safe-top safe-bottom overflow-y-auto ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.WARNING_BACKGROUND})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Yellow Glowing Blob */}
      {!isDarkMode && (
        <div
          className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(234, 179, 8, 0.2) 0%, rgba(234, 179, 8, 0) 100%)',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />
      )}
      {/* Header */}
      <div
        className="px-5 flex items-center justify-between shrink-0"
        style={{ paddingTop: '24px' }}
      >
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`text-[22px] font-medium font-satoshi flex-1 text-center pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Report Rider KYC
        </h1>
      </div>
      <div className="px-5 flex flex-col items-center">
        {/* Check Icon - 21px below header */}
        <div className="mt-[21px] flex items-center justify-center relative z-10">
          <img
            src={isDarkMode ? ASSETS.CHECK_ICON : ASSETS.LIGHT_WARNING_CHECK}
            alt="Report Logged"
            style={{ width: '62px', height: '62px' }}
          />
        </div>
        {/* Thanks Message - 35px below icon */}
        <h2
          className={`mt-[35px] text-[18px] font-bold font-satoshi text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Thanks for reporting!
        </h2>
        {/* Summary Box - mt-8 */}
        <div
          className={`mt-8 p-4 rounded-[12px] border relative z-10 ${isDarkMode ? 'border-white/10' : 'border-[#E9EAEB]'}`}
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none',
          }}
        >
          <p
            className={`text-[14px] font-normal font-satoshi leading-[150%] ${isDarkMode ? 'text-white/70' : 'text-[#7E7E7E]'}`}
          >
            Your report has been logged and the rider is now under the scanner. This helps keep
            Grid.Pe safe. If the documents don’t add up, action will be taken.
          </p>
        </div>
        {/* Proceed Question - 9px below first container */}
        <div
          className={`w-full mt-[9px] rounded-[12px] border overflow-hidden relative z-10 ${isDarkMode ? 'border-white/10' : 'border-[#E9EAEB]'}`}
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none',
          }}
        >
          <div
            className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/5' : 'border-[#E9EAEB]'}`}
          >
            <p
              className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Do you want to proceed with the delivery?
            </p>
          </div>
          <div className="flex flex-col">
            <label
              className={`flex items-center px-4 py-3 cursor-pointer border-b transition-colors ${isDarkMode ? 'border-white/5 active:bg-white/5' : 'border-[#E9EAEB] active:bg-gray-50'}`}
              onClick={() => setSelectedOption('yes')}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedOption === 'yes' ? 'border-[#5260FE]' : isDarkMode ? 'border-white/30' : 'border-[#E6E8EB]'}`}
              >
                {selectedOption === 'yes' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5260FE]" />
                )}
              </div>
              <span
                className={`ml-3 text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Yes, let’s do this!
              </span>
            </label>
            <label
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
              onClick={() => setSelectedOption('no')}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedOption === 'no' ? 'border-[#5260FE]' : isDarkMode ? 'border-white/30' : 'border-[#E6E8EB]'}`}
              >
                {selectedOption === 'no' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5260FE]" />
                )}
              </div>
              <span
                className={`ml-3 text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                No, I’d rather not gamble at my doorstep.
              </span>
            </label>
          </div>
        </div>
        {/* Conditional Content Based on Selection */}
        {selectedOption === 'yes' ? (
          <>
            {/* OTP Section - 35px below second container */}
            <div className="w-full mt-[35px] pl-[16px] relative z-10">
              <p
                className={`text-[15px] font-bold font-satoshi mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Please provide this OTP to confirm the delivery
              </p>
              <div className="w-full flex justify-start mb-6">
                <div className="flex gap-2">
                  {otpDigits.map((digit, index) => (
                    <div
                      key={index}
                      className={`w-[48px] h-[64px] rounded-[7px] flex items-center justify-center text-[32px] font-bold font-satoshi relative overflow-hidden ${isDarkMode ? 'text-white' : 'text-black'}`}
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#F7F8FA',
                        backdropFilter: isDarkMode ? 'blur(23.51px)' : 'none',
                        WebkitBackdropFilter: isDarkMode ? 'blur(23.51px)' : 'none',
                        border: isDarkMode ? 'none' : '1px solid #E6E8EB',
                      }}
                    >
                      {/* Gradient Border Overlay - 0.59px */}
                      {isDarkMode && (
                        <div
                          className="absolute inset-0 pointer-events-none rounded-[7px]"
                          style={{
                            padding: '0.59px',
                            background:
                              'linear-gradient(135deg, rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.02))',
                            WebkitMask:
                              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                          }}
                        />
                      )}
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
              {/* Status Dot */}
              <div className="mt-4 flex items-center gap-2">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center">
                  <div className="w-[12px] h-[12px] rounded-full bg-[#EAB308] shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                </div>
                <span
                  className={`text-[12px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  Awaiting delivery confirmation
                </span>
              </div>
            </div>
            {/* Bottom Disclaimer & Button */}
            <div className="mt-10 px-2 w-full relative z-10">
              <p
                className={`text-[12px] font-normal font-satoshi leading-tight ${isDarkMode ? 'text-white/50' : 'text-[#7E7E7E]'}`}
              >
                You’re about to proceed with this delivery despite a flagged KYC. Please confirm.
              </p>
              <button
                onClick={() => navigate(ROUTES.ORDER_DELIVERED)}
                className="mt-3 w-full h-[48px] rounded-full bg-[#5260FE] text-white text-[16px] font-medium font-satoshi active:scale-95 transition-all"
              >
                Proceed with Delivery
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Cancellation Info - 35px below second container */}
            <div className="w-full mt-[35px] pl-[16px] pr-[16px] relative z-10">
              <h3
                className={`text-[15px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                We’re so sorry for the inconvenience.
              </h3>
              <p
                className={`mt-4 text-[14px] font-normal font-satoshi leading-[140%] ${isDarkMode ? 'text-white/70' : 'text-[#7E7E7E]'}`}
              >
                The amount held in your wallet for this order will be refunded within 30 minutes if
                you proceed with the cancellation of the order. No additional charges.
              </p>
              {/* Status Dot */}
              <div className="mt-[21px] flex items-center gap-2">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center">
                  <div className="w-[12px] h-[12px] rounded-full bg-[#EAB308] shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                </div>
                <span
                  className={`text-[12px] font-normal font-satoshi ${isDarkMode ? 'text-white/50' : 'text-[#7E7E7E]'}`}
                >
                  Awaiting delivery confirmation
                </span>
              </div>
            </div>
            {/* Cancel Button - mt-10 */}
            <div className="mt-[37px] px-2 w-full relative z-10">
              <button
                onClick={() => navigate(ROUTES.ORDER_CANCELLED)}
                className={`w-full h-12 rounded-full flex items-center justify-center text-[16px] font-medium font-satoshi active:scale-95 transition-all ${isDarkMode ? 'border border-white/20 bg-white/5 text-white' : 'border border-[#E9EAEB] bg-white text-black'}`}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
      <div className="h-10" />
    </div>
  );
};
export default ReportRiderConfirm;
