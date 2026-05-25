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
import { addCard } from '@/utils/cardUtils';
import { luhnCheck, validateExpiry, validateCVV } from '@/utils/validationUtils';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { useWebScroll } from '@/hooks/useWebScroll';
const AddCard = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
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
    try {
      const [month, year] = expiry.split('/');
      const lastFour = cardNumberProps.value.slice(-4);
      const { data, error } = await supabase
        .from('bank_cards')
        .insert([
          {
            user_id: userId,
            card_holder_name: cardHolder, // Use user-entered name
            last_four: lastFour,
            expiry_month: month,
            expiry_year: '20' + year,
            card_type: cardType?.charAt(0).toUpperCase() + cardType?.slice(1) || 'Visa',
            razorpay_token_id: token,
          },
        ])
        .select();
      if (error) throw error;
      toast.success('Card saved successfully!');
      navigate(ROUTES.CARDS, { state: { cardAdded: true } });
    } catch (err) {
      setErrors(prev => ({ ...prev, general: 'Failed to save card. Please try again.' }));
      toast.error('Failed to save card');
    }
  };

  const handleSaveCard = async () => {
    hapticMedium();
    if (!validateForm()) return;
    if (!userId) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    if (import.meta.env.DEV && !window.Razorpay) {
      console.warn('[DEV ONLY] Razorpay not loaded — using mock token for local testing');
      const mockToken = 'mock_tok_dev_' + Date.now();
      await saveCardToDatabase(mockToken);
      return;
    }

    if (!window.Razorpay) {
      toast.error('Payment service not available. Please check your connection and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const orderResponse = await fetch(
        `${supabaseUrl}/functions/v1/razorpay-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            amount: 100, // ₹1 in paise — minimum authorization
            currency: 'INR',
            receipt: `card_save_${Date.now()}`,
          }),
        }
      );

      if (!orderResponse.ok) {
        const err = await orderResponse.json();
        throw new Error(err.error || 'Failed to initialize card saving');
      }

      const order = await orderResponse.json();

      const paymentToken = await new Promise<string>((resolve, reject) => {
        const options: import('@/types/razorpay').RazorpayOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: 100,
          currency: 'INR',
          name: 'Grid.Pe',
          description: 'Card verification (₹1 refundable)',
          order_id: order.id,
          theme: { color: '#5260FE' },
          prefill: {
            name: cardHolder,
          },
          handler: (response: import('@/types/razorpay').RazorpayPaymentResponse) => {
            if (response.razorpay_payment_id) {
              resolve(response.razorpay_payment_id);
            } else {
              reject(new Error('Card verification failed'));
            }
          },
          modal: {
            escape: false,
            backdropclose: false,
            ondismiss: () => {
              reject(new Error('DISMISSED'));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: import('@/types/razorpay').RazorpayPaymentResponse) => {
          reject(new Error(response.error?.description || 'Card verification failed'));
        });
        rzp.open();
      });

      await saveCardToDatabase(paymentToken);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'DISMISSED') {
        setIsLoading(false);
        return;
      }
      const message = err instanceof Error 
        ? err.message 
        : 'Failed to save card. Please try again.';
      toast.error(message);
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
              <img src={ASSETS.CARD_CHIP} alt="Chip" className="h-[28px] object-contain" />
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
              <p className="text-[#C4C4C4] text-[13px] font-normal font-satoshi">Card Number</p>
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
                <label className="text-[#C4C4C4] text-[14px] font-normal font-satoshi leading-none">
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
                <label className="text-[#C4C4C4] text-[14px] font-normal font-satoshi leading-none">
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
                <img src={ASSETS.VISA_LOGO} alt="Visa" className="h-full object-contain" />
              )}
              {cardType === 'mastercard' && (
                <img
                  src={ASSETS.MASTERCARD_LOGO}
                  alt="Mastercard"
                  className="h-full object-contain"
                />
              )}
              {cardType === 'rupay' && (
                <img src={ASSETS.RUPAY_LOGO} alt="Rupay" className="h-full object-contain" />
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
            Your card info is encrypted and stored like it’s top-tier gossip – never shared.
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
            <img src={ASSETS.PHOTO_CAMERA} alt="Camera" className="w-4 h-4 opacity-80" />
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
