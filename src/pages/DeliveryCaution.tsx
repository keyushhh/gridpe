import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cancelOrder } from '@/lib/orders';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BackButton from '@/components/ui/BackButton';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
const DeliveryCaution = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { order } = location.state || {};
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();
  const [step, setStep] = useState<
    | 'caution'
    | 'mismatch'
    | 'identify'
    | 'verification_progress'
    | 'verification_success'
    | 'otp_display'
  >('caution');
  const [displayOtp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [selectedOption, setSelectedOption] = useState<string | null>('yes');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isPhotoTaken, setIsPhotoTaken] = useState(false);
  useEffect(() => {
    if (step === 'verification_progress') {
      const timer = setTimeout(() => {
        setStep('verification_success');
      }, 15000); // 15 seconds
      return () => clearTimeout(timer);
    } else if (step === 'otp_display') {
      const timer = setTimeout(() => {
        navigate(ROUTES.ORDER_DELIVERED);
      }, 15000); // 15 seconds
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);
  const handleProceed = () => {
    if (step === 'caution') {
      setStep('mismatch');
    } else if (step === 'mismatch') {
      setStep('identify');
    } else if (step === 'identify') {
      setStep('verification_progress');
    } else if (step === 'verification_success') {
      // "Get OTP" action -> Update status to delivered and show OTP Display
      setStep('otp_display');
    } else if (step === 'otp_display') {
      navigate(ROUTES.HOME);
    }
  };
  const handleBack = () => {
    if (step === 'identify') {
      setStep('mismatch');
      setIsPhotoTaken(false);
    } else if (step === 'mismatch') {
      setStep('caution');
    } else if (step === 'verification_success') {
      setStep('identify');
      setIsPhotoTaken(true);
    } else if (step === 'otp_display') {
      setStep('verification_success');
    } else {
      navigate(-1);
    }
  };
  const handleCancel = () => {
    if (order?.id) {
      cancelOrder(
        order.id,
        'Identity Mismatch',
        'User chose not to proceed due to identity mismatch'
      ).catch(err => {
        console.error('Failed to cancel order:', err);
        showToaster(`Cancellation failed: ${err.message || 'Please try again.'}`, 'error');
      });
    }
    navigate(ROUTES.HOME);
  };
  const handleTakePhoto = () => {
    setIsPhotoTaken(true);
  };
  const handleRetake = () => {
    setIsPhotoTaken(false);
  };
  return (
    <div
      className={`fixed inset-0 w-full flex flex-col items-center safe-top overflow-y-auto bg-background ${isDarkMode ? 'text-white' : 'text-black'}`}
      style={{
        backgroundImage: isDarkMode
          ? `url(${step === 'identify' ? ASSETS.BG_DARK_MODE : ASSETS.WARNING_BACKGROUND})`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Back Button */}
      <BackButton onClick={handleBack} className="absolute top-12 left-5 z-50" />
      {/* Light Mode Yellow Orb */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-yellow-400 rounded-full blur-[100px] opacity-20 pointer-events-none z-0" />
      )}
      {step === 'caution' ? (
        <>
          {/* Header */}
          <h1
            className={`mt-[60px] text-[22px] font-medium font-satoshi text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Delivery Caution
          </h1>
          {/* Icon */}
          <img loading="eager" decoding="async"             src={isDarkMode ? ASSETS.CAUTION : ASSETS.CAUTION_LIGHT}
            alt="Caution"
            className="mt-[21px] w-[62px] h-[62px] relative z-10"
          />
          {/* Sub-text */}
          <h2
            className={`mt-[35px] text-[18px] font-bold font-satoshi text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Identity Mismatch Detected
          </h2>
          {/* Note Container */}
          <div
            className={`mt-[32px] w-[362px] min-h-[79px] rounded-[13px] backdrop-blur-md border p-[11px] flex items-center relative z-10 ${isDarkMode ? 'bg-white/[0.06] border-white/10' : 'bg-muted border-border'}`}
          >
            <p
              className={`text-[16px] font-normal font-satoshi leading-[120%] text-left opacity-90 ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              We couldn’t verify the delivery partner’s identity. For your safety, please confirm
              whether you want to continue with this delivery.
            </p>
          </div>
          {/* Options Container */}
          <div
            className={`mt-[10px] w-[362px] rounded-[13px] backdrop-blur-md border flex flex-col overflow-hidden relative z-10 ${isDarkMode ? 'bg-white/[0.06] border-white/10' : 'bg-background border-border'}`}
          >
            <p
              className={`px-[14px] pt-[8px] text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Do you want to proceed with the delivery?
            </p>
            {/* Divider */}
            <div className={`mt-[14px] w-full h-[1px] bg-border`} />
            {/* Option 1 */}
            <button
              onClick={() => setSelectedOption('yes')}
              className="mt-[8px] px-[14px] flex items-center gap-[16px] w-full text-left"
            >
              <img loading="lazy" decoding="async"                 src={selectedOption === 'yes' ? ASSETS.RADIO_FILL : ASSETS.RADIO_EMPTY_SVG}
                alt="Radio"
                className={`w-[20px] h-[20px] ${!isDarkMode && selectedOption === 'yes' ? 'filter-purple' : !isDarkMode ? 'brightness-50' : ''}`}
                style={
                  !isDarkMode && selectedOption === 'yes'
                    ? {
                        filter:
                          'grayscale(100%) brightness(0) invert(39%) sepia(93%) saturate(3025%) hue-rotate(222deg) brightness(101%) contrast(101%)',
                      }
                    : {}
                }
              />
              <span
                className={`text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Yes, let’s do this!
              </span>
            </button>
            {/* Divider */}
            <div className={`mt-[9px] w-full h-[1px] bg-border`} />
            {/* Option 2 */}
            <button
              onClick={() => setSelectedOption('no')}
              className="mt-[8px] px-[14px] pb-[8px] flex items-center gap-[16px] w-full text-left h-full"
            >
              <img loading="lazy" decoding="async"                 src={selectedOption === 'no' ? ASSETS.RADIO_FILL : ASSETS.RADIO_EMPTY_SVG}
                alt="Radio"
                className={`w-[20px] h-[20px] ${!isDarkMode && selectedOption === 'no' ? 'filter-purple' : !isDarkMode ? 'brightness-50' : ''}`}
                style={
                  !isDarkMode && selectedOption === 'no'
                    ? {
                        filter:
                          'grayscale(100%) brightness(0) invert(39%) sepia(93%) saturate(3025%) hue-rotate(222deg) brightness(101%) contrast(101%)',
                      }
                    : {}
                }
              />
              <span
                className={`text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                No, I’d rather not gamble at my doorstep.
              </span>
            </button>
          </div>
          {/* Conditional Content */}
          {selectedOption === 'no' && (
            <div className="w-[362px] mt-[31px] px-[0px] relative z-10">
              <p
                className={`text-[15px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                We’re so sorry for the inconvenience.
              </p>
              <p
                className={`mt-[13px] text-[14px] font-normal font-satoshi opacity-80 leading-relaxed ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                The amount held for this order will be refunded within 30 minutes if
                you proceed with the cancellation of the order. No additional charges.
              </p>
              <div className="mt-[26px] flex items-center gap-[14px]">
                <img loading="lazy" decoding="async" src={ASSETS.AWAITING} alt="Awaiting" className="w-[14px] h-[14px]" />
                <span
                  className={`text-[12px] font-normal font-satoshi ${isDarkMode ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                >
                  Awaiting delivery confirmation
                </span>
              </div>
              <button
                onClick={handleCancel}
                className={`mt-[50px] w-full h-[48px] rounded-full border text-[16px] font-medium font-satoshi active:scale-[0.98] transition-all bg-muted border-border ${isDarkMode ? 'text-white' : 'text-black'} ${!isDarkMode ? 'bg-neutral-950 text-white border-transparent' : ''}`}
              >
                Cancel
              </button>
            </div>
          )}
          {selectedOption === 'yes' && (
            <div className="w-[362px] mt-[31px] px-[0px] relative z-10">
              <p
                className={`text-[15px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Please follow the on-screen instructions to go ahead with the delivery.
              </p>
              <button
                onClick={handleProceed}
                className="mt-[135px] w-full h-[48px] rounded-full bg-primary text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
              >
                Proceed
              </button>
            </div>
          )}
        </>
      ) : step === 'mismatch' ? (
        /* Identity Mismatch Screen */
        <>
          {/* Header */}
          <h1
            className={`mt-[60px] text-[22px] font-medium font-satoshi text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Identity Mismatch
          </h1>
          {/* Icon */}
          <img loading="lazy" decoding="async"             src={isDarkMode ? ASSETS.CAUTION : ASSETS.CAUTION_LIGHT}
            alt="Caution"
            className="mt-[21px] w-[62px] h-[62px] relative z-10"
          />
          {/* Sub-text */}
          <h2
            className={`mt-[24px] text-[18px] font-bold font-satoshi text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Proceed with Caution
          </h2>
          {/* Warning Note */}
          <div
            className={`mt-[24px] w-[362px] rounded-[13px] backdrop-blur-md border p-[16px] relative z-10 ${isDarkMode ? 'bg-white/[0.06] border-white/10' : 'bg-muted border-border'}`}
          >
            <p
              className={`text-[14px] font-normal font-satoshi leading-[140%] text-left ${isDarkMode ? 'text-white/90' : 'text-black'}`}
            >
              You can continue with the delivery, but please confirm that you understand the risk.
              Grid.Pe will review this delivery part for safety, and the payout will be held
              temporarily.
            </p>
          </div>
          {/* Checklist Container */}
          <div
            className={`mt-[12px] w-[362px] rounded-[13px] backdrop-blur-md border p-[16px] relative z-10 ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-background border-border'}`}
          >
            <p
              className={`text-[14px] font-bold font-satoshi mb-[8px] ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Checklist:
            </p>
            <ol
              className={`list-decimal list-outside pl-[16px] text-[13px] font-normal font-satoshi space-y-[4px] leading-[140%] ${isDarkMode ? 'text-white/80' : 'text-black opacity-100'}`}
            >
              <li>I confirm the rider does not fully match the verified KYC</li>
              <li>I still want to proceed with this delivery</li>
              <li>I agree to provide a photo of the person delivering the order</li>
            </ol>
          </div>
          {/* Agreement Checkbox */}
          <button
            onClick={() => setIsAgreed(!isAgreed)}
            className="mt-[24px] w-[362px] flex items-start gap-[12px] text-left relative z-10"
          >
            <img loading="lazy" decoding="async"               src={isAgreed ? ASSETS.CHECK_BOX_SELECTED : ASSETS.CHECK_BOX_OUTLINE_BLANK}
              alt="Check"
              className={`w-[20px] h-[20px] mt-[2px] ${!isDarkMode && isAgreed ? 'filter-purple' : !isDarkMode ? 'brightness-50' : ''}`}
              style={
                !isDarkMode && isAgreed
                  ? {
                      filter:
                        'grayscale(100%) brightness(0) invert(39%) sepia(93%) saturate(3025%) hue-rotate(222deg) brightness(101%) contrast(101%)',
                    }
                  : {}
              }
            />
            <span
              className={`text-[13px] font-normal font-satoshi leading-[130%] ${isDarkMode ? 'text-white/90' : 'text-black'}`}
            >
              I agree to all the points and will be responsible for this delivery if anything goes
              wrong.
            </span>
          </button>
          {/* Actions */}
          <div className="mt-auto mb-[40px] w-[362px] flex flex-col gap-[12px] relative z-10">
            <button
              onClick={handleProceed}
              disabled={!isAgreed}
              className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium font-satoshi transition-all ${
                isAgreed ? 'bg-primary active:scale-[0.98]' : 'bg-primary/50 cursor-not-allowed'
              }`}
            >
              Proceed with Delivery
            </button>
            <button
              onClick={handleCancel}
              className={`w-full h-[48px] rounded-full border text-[16px] font-medium font-satoshi active:scale-[0.98] transition-all ${isDarkMode ? 'bg-muted border-white/10 text-white' : 'bg-muted border-transparent text-black'}`}
            >
              Cancel Delivery
            </button>
          </div>
        </>
      ) : step === 'identify' ? (
        /* Identify Delivery Partner Screen */
        <>
          {/* Header */}
          <h1
            className={`mt-[120px] w-[362px] text-[26px] font-medium font-satoshi text-left leading-tight relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Identify Delivery Partner
          </h1>
          {/* Body Text 1 */}
          <p
            className={`mt-[16px] w-[362px] text-[14px] font-medium font-satoshi relative z-10 ${isDarkMode ? 'text-white/90' : 'text-black'}`}
          >
            Take a photo of the delivery partner
          </p>
          {/* Body Text 2 */}
          <p
            className={`mt-[11px] w-[362px] text-[12px] font-normal font-satoshi leading-[140%] relative z-10 ${isDarkMode ? 'text-white' : 'text-muted-foreground'}`}
          >
            This helps us ensure your safety.
            <br />
            Make sure their face is clearly visible and not blurry.
          </p>
          {/* Camera Viewport */}
          <div
            className={`mt-[24px] w-[360px] h-[387px] rounded-[13px] bg-black overflow-hidden relative border z-10 ${isDarkMode ? 'border-white/10' : 'border-border'}`}
          >
            {!isPhotoTaken ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* Camera Placeholder */}
                <div
                  className={`w-[60px] h-[60px] rounded-full border-2 flex items-center justify-center ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
                >
                  <div
                    className={`w-[50px] h-[50px] rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}
                  />
                </div>
              </div>
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-neutral-900' : 'bg-muted'}`}
              >
                {/* Captured Photo Placeholder */}
                <p className={`text-[14px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                  Photo Captured
                </p>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="mt-auto mb-[40px] w-[362px] flex flex-col gap-[12px] relative z-10">
            {!isPhotoTaken ? (
              <button
                onClick={handleTakePhoto}
                className="w-full h-[48px] rounded-full bg-primary text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
              >
                Take Photo
              </button>
            ) : (
              <>
                <button
                  onClick={handleProceed} /* Assuming submit just proceeds for now */
                  className="w-full h-[48px] text-[16px] font-medium font-satoshi rounded-full bg-primary text-white active:scale-[0.98] transition-transform"
                >
                  Submit
                </button>
                <button
                  onClick={handleRetake}
                  className={`w-full h-[48px] text-[16px] font-medium font-satoshi rounded-full transition-all active:scale-[0.98] ${isDarkMode ? 'bg-muted border border-white/10 text-white' : 'bg-muted text-black border-transparent'}`}
                >
                  Retake
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        /* Verification Screens (Progress & Success) */
        <>
          {/* Header */}
          <h1
            className={`mt-[60px] text-[22px] font-medium font-satoshi text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Identity Mismatch
          </h1>
          {/* Icon */}
          <img loading="lazy" decoding="async"             src={isDarkMode ? ASSETS.CAUTION : ASSETS.CAUTION_LIGHT}
            alt="Caution"
            className="mt-[21px] w-[62px] h-[62px] relative z-10"
          />
          {/* Status Text */}
          <h2
            className={`mt-[24px] text-[18px] font-bold font-satoshi text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {step === 'verification_progress'
              ? 'Verification in Progress'
              : 'Verification Succesful'}
          </h2>
          {/* Info Container */}
          <div
            className={`mt-[24px] w-[362px] rounded-[13px] backdrop-blur-md border p-[16px] relative z-10 ${isDarkMode ? 'bg-white/[0.06] border-white/10' : 'bg-muted border-border'}`}
          >
            <p
              className={`text-[14px] font-normal font-satoshi leading-[140%] text-left ${isDarkMode ? 'text-white/90' : 'text-black'}`}
            >
              {step === 'verification_progress'
                ? 'We’re verifying this delivery for your safety. This usually takes under a minute.'
                : 'We’ve recorded your confirmation and the rider’s identity evidence.'}
            </p>
            {step === 'verification_success' && (
              <p
                className={`mt-[16px] text-[14px] font-normal font-satoshi leading-[140%] text-left ${isDarkMode ? 'text-white/90' : 'text-black'}`}
              >
                Please submit the OTP to finish the delivery.
              </p>
            )}
            {step === 'otp_display' && (
              <p
                className={`mt-[16px] text-[14px] font-normal font-satoshi leading-[140%] text-left ${isDarkMode ? 'text-white/90' : 'text-black'}`}
              >
                Please submit the OTP to finish the delivery.
              </p>
            )}
          </div>
          {/* Status Indicator / Action / OTP Display */}
          <div className="mt-[24px] w-[362px] relative z-10">
            {step === 'verification_progress' ? (
              <div className="flex items-center gap-[12px]">
                <div className="relative flex items-center justify-center w-[14px] h-[14px]">
                  <div className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping"></div>
                  <img loading="lazy" decoding="async"                     src={ASSETS.AWAITING}
                    alt="Awaiting"
                    className="relative w-[14px] h-[14px] z-10"
                  />
                </div>
                <span
                  className={`text-[13px] font-normal font-satoshi ${isDarkMode ? 'text-white/80' : 'text-muted-foreground'}`}
                >
                  Awaiting rider verification
                </span>
              </div>
            ) : step === 'otp_display' ? (
              <>
                <div className="w-full flex justify-center mb-[24px]">
                  <div className="flex gap-2">
                    {displayOtp.split('').map((digit, index) => (
                      <div
                        key={index}
                        className={`w-[48px] h-[64px] rounded-[7px] flex items-center justify-center text-[32px] font-bold font-satoshi relative overflow-hidden ${isDarkMode ? 'text-white' : 'text-black'}`}
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(25, 25, 25, 0.31)'
                            : 'hsl(var(--muted))',
                          backdropFilter: isDarkMode ? 'blur(23.51px)' : 'none',
                          WebkitBackdropFilter: isDarkMode ? 'blur(23.51px)' : 'none',
                          border: isDarkMode ? 'none' : '1px solid hsl(var(--border))',
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
                {/* Status for OTP step */}
                <div className="flex items-center gap-[12px]">
                  <div className="relative flex items-center justify-center w-[14px] h-[14px]">
                    <div className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping"></div>
                    <img loading="lazy" decoding="async"                       src={ASSETS.AWAITING}
                      alt="Awaiting"
                      className="relative w-[14px] h-[14px] z-10"
                    />
                  </div>
                  <span
                    className={`text-[13px] font-normal font-satoshi ${isDarkMode ? 'text-white/80' : 'text-muted-foreground'}`}
                  >
                    Awaiting delivery confirmation
                  </span>
                </div>
              </>
            ) : (
              <button
                onClick={handleProceed}
                className={`w-full h-[48px] text-[16px] font-medium font-satoshi rounded-full transition-all active:scale-[0.98] ${isDarkMode ? 'bg-transparent border border-white/20 text-white' : 'bg-primary border-transparent text-white'}`}
              >
                Get OTP
              </button>
            )}
          </div>
        </>
      )}
      {/* Spacer for bottom safe area */}
      <div className="h-[20px]" />
    </div>
  );
};
export default DeliveryCaution;
