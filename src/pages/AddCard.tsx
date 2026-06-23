import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { hapticMedium } from '@/utils/haptics';
import { Eye, EyeOff } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Button } from '@/components/ui/button';
import { useSensitiveInput } from '@/hooks/useSensitiveInput';
import { luhnCheck, validateExpiry, validateCVV } from '@/utils/validationUtils';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useWebScroll } from '@/hooks/useWebScroll';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { crashlytics } from '@/lib/crashlytics';

declare const Cashfree: any;
let pendingCardVerificationOrderId: string | null = null;
const AddCard = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const location = useLocation();
  const { profile } = useUser();
  const userId = profile?.id;
  const isDarkMode = useIsDarkMode();
  // Form State
  const [expiry, setExpiry] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'rupay' | null>(null);
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  // Refs for focusing back after error click
  const nameInputRef = useRef<HTMLInputElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);
  const cvvInputRef = useRef<HTMLInputElement>(null);
  // Visibility (Eye Toggle)
  const [isEyeOpen, setIsEyeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Sensitive Inputs
  const cardNumberProps = useSensitiveInput({
    isPermanentlyVisible: isEyeOpen,
  });
  const cvvProps = useSensitiveInput({
    isPermanentlyVisible: isEyeOpen,
  });
  // Check if we returned from scan
  useEffect(() => {
    if (location.state?.scanned) {
      const { cardNumber, expiry, cardHolder, cardType: scannedType } = location.state;
      if (cardNumber) {
        cardNumberProps.handleChange(cardNumber);
        // Simple Detection for card type based on scanned number
        if (cardNumber.startsWith('4')) setCardType('visa');
        else if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber))
          setCardType('mastercard');
        else if (/^60|^65|^81|^82|^508/.test(cardNumber)) setCardType('rupay');
      }
      if (expiry) setExpiry(expiry);
      if (cardHolder) setCardHolder(cardHolder);
      if (scannedType) setCardType(scannedType);
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps
  // Clear specific error on change
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  // Card Number Logic (Formatting + Detection)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError('cardNumber');
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    // Simple Detection
    if (val.startsWith('4')) setCardType('visa');
    else if (/^5[1-5]/.test(val) || /^2[2-7]/.test(val)) setCardType('mastercard');
    else if (/^60|^65|^81|^82|^508/.test(val)) setCardType('rupay');
    else setCardType(null);
    cardNumberProps.handleChange(val);
  };
  const formatCardNumber = (num: string) => {
    if (!num) return '';
    const chunks = num.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };
  const getMaskedCardNumber = () => {
    const val = cardNumberProps.value;
    if (!val) return '';
    const chunks = val.match(/.{1,4}/g) || [];
    return chunks.join(' ').replace(/\d/g, '*');
  };
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError('expiry');
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 2) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setExpiry(val);
    }
  };
  const handleExpiryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && expiry.length === 3 && expiry.endsWith('/')) {
      e.preventDefault();
      setExpiry(expiry.slice(0, 2));
    }
  };
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError('cardHolder');
    setCardHolder(e.target.value.toUpperCase());
  };
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError('cvv');
    cvvProps.handleChange(e.target.value.replace(/\D/g, '').slice(0, 3));
  };
  const validateForm = () => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;
    // Name Validation
    if (!cardHolder.trim()) {
      newErrors.cardHolder = 'Enter the name as it appears on your card.';
      isValid = false;
    }
    // Number Validation
    if (!cardNumberProps.value) {
      newErrors.cardNumber = 'Card number is required.';
      isValid = false;
    } else if (cardNumberProps.value.length < 13 || !luhnCheck(cardNumberProps.value)) {
      newErrors.cardNumber = 'Invalid card number.';
      isValid = false;
    }
    // Expiry Validation
    const expiryError = validateExpiry(expiry);
    if (expiryError) {
      newErrors.expiry = expiryError;
      isValid = false;
    }
    // CVV Validation
    const cvvError = validateCVV(cvvProps.value, cardType);
    if (cvvError) {
      newErrors.cvv = cvvError;
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };
  const saveCardToDatabase = async (token: string) => {
    // No longer needed as webhook handles insertion
  };

  const handleSaveCard = async () => {
    hapticMedium();
    if (!validateForm()) return;
    if (!userId) {
      showToaster('Authentication error. Please log in again.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // Get user phone from profile
      const { data } = await supabase
        .from('profiles')
        .select('phone, name, email')
        .eq('id', userId)
        .single();
      const userProfile = data as any;
      
      if (!userProfile?.phone) {
        showToaster('Please add a phone number to your profile first.', 'error');
        return;
      }

      // Create a ₹1 Cashfree order for card verification
      const { data: orderData, error: orderError } = await supabase
        .functions.invoke('create-card-verification-order', {
          body: {
            user_id: userId,
            customer_phone: userProfile.phone,
            customer_name: cardHolder || userProfile.name,
            customer_email: userProfile.email || 'customer@gridpe.in',
            card_last_four: cardNumberProps.value.slice(-4),
            card_holder_name: cardHolder || userProfile.name,
            card_type: cardType || 'visa',
            expiry_month: expiry.split('/')[0],
            expiry_year: '20' + expiry.split('/')[1],
          }
        });

      if (orderError || !orderData?.success) {
        crashlytics.recordError(new Error(orderError?.message || 'create-card-verification-order failed'), 'AddCard create-card-verification-order failed');
        showToaster('Failed to initialize card verification.', 'error');
        return;
      }

      // Open Cashfree checkout
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        const checkoutBaseUrl = orderData.cashfree_env === 'sandbox'
          ? 'https://payments-test.cashfree.com/order'
          : 'https://payments.cashfree.com/order';
        const checkoutUrl = `${checkoutBaseUrl}/#${orderData.payment_session_id}`;
        // Store order_id at module level so deep link handler can access it
        pendingCardVerificationOrderId = orderData.cashfree_order_id;
        await Browser.open({
          url: checkoutUrl,
          presentationStyle: 'popover',
          toolbarColor: '#5260FE'
        });
      } else {
        const cashfree = Cashfree({ mode: orderData.cashfree_env });
        const capturedOrderId = orderData.cashfree_order_id;
        const capturedUserId = userId;
        cashfree.checkout({
          paymentSessionId: orderData.payment_session_id,
          redirectTarget: '_modal',
        }).then(async (result: any) => {
          if (result.paymentDetails) {
            showToaster('Saving your card...', 'success');
            try {
              const { data: verifyData, error } = await supabase
                .functions.invoke('verify-card-order', {
                  body: {
                    cashfree_order_id: capturedOrderId,
                    user_id: capturedUserId,
                  }
                });
              
              if (error || !verifyData?.success) {
                showToaster('Card verification failed. Please try again.', 'error');
                return;
              }
              navigate(ROUTES.CARDS, { state: { cardAdded: true } });
            } catch (err) {
              crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[AddCard] verify-card-order web error');
              showToaster('Card verification failed. Please try again.', 'error');
              if (import.meta.env.DEV) console.error('[AddCard] verify-card-order web error:', err);
        crashlytics.recordError(err instanceof Error ? err : new Error('AddCard verify-card-order web error'), 'AddCard.verifyCardOrderWeb');
            }
          } else if (result.error) {
            showToaster('Card verification failed. Please try again.', 'error');
          }
        });
      }
    } catch (err) {
      crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'AddCard handleSaveCard error');
      showToaster('Failed to save card. Please try again.', 'error');
      if (import.meta.env.DEV) console.error('AddCard error:', err);
      crashlytics.recordError(err instanceof Error ? err : new Error('AddCard unknown error'), 'AddCard.handleSubmit');
    } finally {
      setIsLoading(false);
    }
  };
  const hasInput =
    cardNumberProps.value.length > 0 ||
    expiry.length > 0 ||
    cvvProps.value.length > 0 ||
    cardHolder.length > 0;
  const hasErrors = Object.values(errors).some(val => val !== null);
  // Helper to focus input when error is clicked
  const handleErrorClick = (field: string, ref: React.RefObject<HTMLInputElement>) => {
    clearError(field);
    requestAnimationFrame(() => ref.current?.focus());
  };

  // Deep link listener for Cashfree card verification return (native only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = App.addListener('appUrlOpen', async (data) => {
      const url = data.url;
      const isCashfreeReturn =
        url.includes('cashfree-return') ||
        url.includes('com.gridpe.customer://cashfree-return');
      if (!isCashfreeReturn) return;

      // Extract order_id from URL params
      const urlParams = new URL(url.replace('com.gridpe.customer://', 'https://app/'));
      const orderIdFromUrl = urlParams.searchParams.get('order_id');
      const orderId = orderIdFromUrl || pendingCardVerificationOrderId;

      if (!orderId || !userId) {
        showToaster('Could not verify card. Please try again.', 'error');
        return;
      }

      showToaster('Saving your card...', 'success');

      try {
        const { data: verifyData, error } = await supabase
          .functions.invoke('verify-card-order', {
            body: {
              cashfree_order_id: orderId,
              user_id: userId,
            }
          });

        if (error || !verifyData?.success) {
          
          showToaster('Card verification failed. Please try again.', 'error');
          return;
        }

        pendingCardVerificationOrderId = null;
        
        navigate(ROUTES.CARDS, { state: { cardAdded: true } });
      } catch (err) {
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[AddCard] verify-card-order native deep link error');
        showToaster('Card verification failed. Please try again.', 'error');
        if (import.meta.env.DEV) console.error('[AddCard] verify-card-order error:', err);
      crashlytics.recordError(err instanceof Error ? err : new Error('AddCard verify-card-order native error'), 'AddCard.verifyCardOrderNative');
      }
    });
    return () => {
      listener.then(h => h.remove());
    };
  }, [userId, navigate]);

  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col safe-top relative`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#5260FE',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between relative z-50">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium absolute left-1/2 -translate-x-1/2`}
        >
          Add Card
        </h1>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 mt-8 flex flex-col">
        {/* Interactive Card Preview */}
        <div
          className={`relative w-full max-w-[400px] aspect-[1.875] mx-auto mb-[20px] rounded-[16px] overflow-hidden shrink-0 transition-colors duration-300 ${hasErrors ? 'border border-brand-error' : ''}`}
          style={{
            backgroundImage: `url(${ASSETS.CARD_PREVIEW_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="relative w-full h-full px-[26px]">
            {/* Top Row: Chip */}
            <div className="absolute top-[21px] right-[26px] w-[40px] h-[30px] flex justify-end">
              <img loading="lazy" decoding="async" src={ASSETS.CARD_CHIP} alt="Chip" className="h-[28px] object-contain" />
            </div>
            {/* Cardholder Name */}
            <div className="absolute top-[26px] left-[26px] right-[70px] h-[22px]">
              {errors.cardHolder ? (
                <p
                  onClick={() => handleErrorClick('cardHolder', nameInputRef)}
                  className="text-brand-error text-[13px] italic font-normal font-satoshi leading-snug cursor-text"
                >
                  {errors.cardHolder}
                </p>
              ) : (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={cardHolder}
                  onChange={handleNameChange}
                  placeholder="CARDHOLDER NAME"
                  className="w-full bg-transparent text-white text-[16px] font-medium placeholder:text-white focus:outline-none uppercase p-0 border-none font-satoshi"
                />
              )}
            </div>
            {/* Card Number Label */}
            <div className="absolute top-[70px] left-[26px]">
              <p className="text-brand-text-subtle text-[13px] font-normal font-satoshi">Card Number</p>
            </div>
            {/* Card Number Value */}
            <div className="absolute top-[93px] left-[26px] right-[26px] flex items-center justify-between h-[24px]">
              <div className="relative flex-1 mr-4 h-full">
                {errors.cardNumber ? (
                  <p
                    onClick={() => handleErrorClick('cardNumber', numberInputRef)}
                    className="text-brand-error text-[13px] italic font-normal font-satoshi leading-none cursor-text mt-1"
                  >
                    {errors.cardNumber}
                  </p>
                ) : (
                  <>
                    {/* The Actual Input (Hidden when masked, Visible when shown/typing) */}
                    <input
                      ref={numberInputRef}
                      type="text"
                      inputMode="numeric"
                      value={formatCardNumber(cardNumberProps.value)}
                      onChange={handleCardNumberChange}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className={`w-full bg-transparent text-white text-[20px] font-bold placeholder:text-white focus:outline-none p-0 border-none font-satoshi tracking-widest h-[24px] ${!cardNumberProps.isVisible ? 'opacity-0 absolute inset-0 z-10' : 'relative z-10'}`}
                    />
                    {/* The Masked Overlay (Visible when masked) */}
                    {!cardNumberProps.isVisible && (
                      <div className="pointer-events-none text-white text-[20px] font-bold font-satoshi tracking-widest h-[24px] whitespace-nowrap overflow-hidden">
                        {cardNumberProps.value.length > 0 ? (
                          getMaskedCardNumber()
                        ) : (
                          <span className="text-[18px] text-white">XXXX XXXX XXXX XXXX</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* Eye Icon */}
              <button
                type="button"
                onClick={() => setIsEyeOpen(!isEyeOpen)}
                className="text-white shrink-0 z-20"
              >
                {isEyeOpen ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {/* Expiry & CVV Row */}
            <div className="absolute top-[129px] left-[26px] flex gap-8">
              {/* Expiry Group */}
              <div className="flex flex-col gap-[5px] w-[90px]">
                <label className="text-brand-text-subtle text-[14px] font-normal font-satoshi leading-none">
                  Expiry Date
                </label>
                <div className="h-[28px] relative">
                  <input
                    ref={expiryInputRef}
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={handleExpiryChange}
                    onKeyDown={handleExpiryKeyDown}
                    placeholder="MM/YY"
                    className="w-[60px] bg-transparent text-white text-[13px] font-bold placeholder:text-white focus:outline-none p-0 border-none font-satoshi leading-none"
                  />
                </div>
              </div>
              {/* CVV Group */}
              <div className="flex flex-col gap-[5px] ml-6">
                <label className="text-brand-text-subtle text-[14px] font-normal font-satoshi leading-none">
                  CVV
                </label>
                {/* CVV Input with Visibility Logic */}
                <div className="relative w-[100px] h-[28px]">
                  {errors.cvv ? (
                    <p
                      onClick={() => handleErrorClick('cvv', cvvInputRef)}
                      className="text-brand-error text-[13px] italic font-normal font-satoshi leading-tight cursor-text absolute top-0 left-0"
                    >
                      {errors.cvv}
                    </p>
                  ) : (
                    <>
                      <input
                        ref={cvvInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={cvvProps.value}
                        onChange={handleCvvChange}
                        placeholder="XXX"
                        className={`w-[40px] h-[14px] bg-transparent text-white text-[14px] font-bold placeholder:text-white focus:outline-none p-0 border-none font-satoshi leading-none ${!cvvProps.isVisible ? 'opacity-0 absolute inset-0 z-10' : 'relative z-10'}`}
                      />
                      {!cvvProps.isVisible && (
                        <div className="pointer-events-none text-white text-[14px] font-bold font-satoshi leading-none absolute top-0 left-0">
                          {cvvProps.value.length > 0 ? (
                            cvvProps.value.replace(/./g, '*')
                          ) : (
                            <span className="text-white">***</span>
                          )}
                        </div>
                      )}
                      {!cvvProps.isVisible && cvvProps.value.length === 0 && (
                        <div className="pointer-events-none text-white text-[14px] font-bold font-satoshi leading-none absolute top-0 left-0">
                          ***
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Network Logo */}
            <div className="absolute bottom-[26px] right-[26px] h-[24px]">
              {cardType === 'visa' && (
                <img loading="lazy" decoding="async" src={ASSETS.VISA_LOGO} alt="Visa" className="h-full object-contain" />
              )}
              {cardType === 'mastercard' && (
                <img loading="lazy" decoding="async"                   src={ASSETS.MASTERCARD_LOGO}
                  alt="Mastercard"
                  className="h-full object-contain"
                />
              )}
              {cardType === 'rupay' && (
                <img loading="lazy" decoding="async" src={ASSETS.RUPAY_LOGO} alt="Rupay" className="h-full object-contain" />
              )}
            </div>
          </div>
        </div>
        {errors.expiry && (
          <div className="px-1 mb-[14px]">
            <p className="text-brand-error text-[14px] font-normal leading-relaxed">
              {errors.expiry}
            </p>
          </div>
        )}
        {/* Helper Texts */}
        <div className="flex flex-col gap-[12px] mb-[28px] px-1">
          <div className="flex flex-col">
            <p
              className={`${isDarkMode ? 'text-white/60' : 'text-black'} text-[14px] font-medium leading-relaxed`}
            >
              Enter your details by tapping on the fields above.
            </p>
            <p
              className={`${isDarkMode ? 'text-white/60' : 'text-black'} text-[14px] font-medium leading-relaxed`}
            >
              Or scan your card below. Both works!
            </p>
          </div>
          <p
            className={`${isDarkMode ? 'text-white/60' : 'text-black'} text-[14px] font-medium leading-relaxed`}
          >
            A ₹1 verification charge confirms your card. It will be refunded within 7 days.
          </p>
        </div>
        {/* Scan Card Section */}
        <div
          className={`w-full h-[184px] rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-black border-white/5' : 'bg-black border-brand-border-light'}`}
        >
          <button
            onClick={() => navigate(ROUTES.CAMERA_PAGE)}
            className={`px-4 h-[32px] flex items-center justify-center rounded-full text-[14px] gap-2 ${isDarkMode ? 'border border-white/10' : 'border-none'}`}
            style={
              isDarkMode
                ? {
                    backgroundImage:
                      'url("/lovable-uploads/881be237-04b4-4be4-b639-b56090b04ed5.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {
                    backgroundColor: '#5260FE',
                  }
            }
          >
            <img loading="lazy" decoding="async" src={ASSETS.PHOTO_CAMERA} alt="Camera" className="w-4 h-4 opacity-80" />
            <span className="text-white text-[12px] font-medium">Scan Card</span>
          </button>
        </div>
        {/* CTA Button */}
        <div className="mt-auto mt-6 safe-bottom pb-4">
          <Button
            onClick={handleSaveCard}
            disabled={!hasInput || hasErrors || isLoading}
            className="w-full h-[48px] rounded-full text-[16px] font-medium bg-brand-primary hover:bg-brand-primary/90 text-white disabled:opacity-50"
          >
            {hasInput ? 'Save Card' : 'Proceed'}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default AddCard;
