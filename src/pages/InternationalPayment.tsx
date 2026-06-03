import { ASSETS } from '@/constants/assets';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useWalletStore } from '@/store/useWalletStore';

const upiAppMethods = [
  { id: 'cred', name: 'CRED UPI', icon: ASSETS.CRED, type: 'upi', linked: true },
  { id: 'gpay', name: 'Google Pay UPI', icon: ASSETS.GPAY, type: 'upi', linked: true },
  { id: 'phonepe', name: 'PhonePe UPI', icon: ASSETS.PHONEPE, type: 'upi', linked: true },
  {
    id: 'upi-id',
    name: 'UPI ID',
    icon: '',
    type: 'upi',
    linked: false,
    hasInput: true,
    inputPlaceholder: 'Required',
  },
];

const FLAGS: Record<string, string> = {
  'India': 'https://flagcdn.com/w40/in.png',
  'United States': 'https://flagcdn.com/w40/us.png',
  'United Kingdom': 'https://flagcdn.com/w40/gb.png',
  'United Arab Emirates': 'https://flagcdn.com/w40/ae.png',
  'Singapore': 'https://flagcdn.com/w40/sg.png',
  'Canada': 'https://flagcdn.com/w40/ca.png',
  'Australia': 'https://flagcdn.com/w40/au.png',
  'Germany': 'https://flagcdn.com/w40/de.png',
  'France': 'https://flagcdn.com/w40/fr.png',
  'Japan': 'https://flagcdn.com/w40/jp.png',
  'Hong Kong': 'https://flagcdn.com/w40/hk.png',
  'New Zealand': 'https://flagcdn.com/w40/nz.png',
  'Switzerland': 'https://flagcdn.com/w40/ch.png',
  'Netherlands': 'https://flagcdn.com/w40/nl.png',
  'Sweden': 'https://flagcdn.com/w40/se.png',
};

const countries = [
  { name: 'India' },
  { name: 'United States' },
  { name: 'United Kingdom' },
  { name: 'United Arab Emirates' },
  { name: 'Singapore' },
  { name: 'Canada' },
  { name: 'Australia' },
  { name: 'Germany' },
  { name: 'France' },
  { name: 'Japan' },
  { name: 'Hong Kong' },
  { name: 'New Zealand' },
  { name: 'Switzerland' },
  { name: 'Netherlands' },
  { name: 'Sweden' },
];

const countryToISO: Record<string, string> = {
  'India': 'IN', 'United States': 'US', 'United Kingdom': 'GB',
  'United Arab Emirates': 'AE', 'Singapore': 'SG', 'Canada': 'CA',
  'Australia': 'AU', 'Germany': 'DE', 'France': 'FR', 'Japan': 'JP',
  'Hong Kong': 'HK', 'New Zealand': 'NZ', 'Switzerland': 'CH',
  'Netherlands': 'NL', 'Sweden': 'SE'
};

const loadStripe = async () => {
  if (!(window as any).Stripe) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
  // TODO: add VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... to .env
  return (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
};

const InternationalPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const { profile, fetchProfileData } = useUser();
  const refreshBalance = useWalletStore((state) => state.refreshBalance);
  const refreshTransactions = useWalletStore((state) => state.refreshTransactions);
  const { showToaster } = useCustomToaster();
  
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [countryOpen, setCountryOpen] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  const { amount, currency, flow, tier } = location.state || { amount: 0, currency: 'USD', flow: 'wallet_topup' };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    // Add spaces every 4 digits
    const chunks = val.match(/.{1,4}/g) || [];
    setCardNumber(chunks.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!countryOpen) return;
      if (!countryDropdownRef.current) return;
      const target = event.target as Node | null;
      if (target && !countryDropdownRef.current.contains(target)) {
        setCountryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [countryOpen]);

  const getCardIcon = () => {
    const rawNumber = cardNumber.replace(/\D/g, '');
    if (rawNumber.startsWith('4')) return ASSETS.VISA_LOGO;
    if (/^5[1-5]/.test(rawNumber) || /^2[2-7]/.test(rawNumber)) return ASSETS.MASTERCARD_LOGO;
    return null;
  };

  const handlePayPalFlow = async () => {
    if (!profile?.id || !amount) {
      showToaster('Invalid amount or user session', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const currentUserId = profile.id;
      
      const functionName = flow === 'tier_upgrade' ? 'create-paypal-order' : 'create-paypal-order';
      const body = flow === 'tier_upgrade' 
        ? { amount, userId: currentUserId, type: 'tier_upgrade', tier_name: tier, currency: 'USD' }
        : { amount, userId: currentUserId, type: 'wallet_topup', currency: 'USD' };

      const { data, error } = await supabase.functions.invoke(functionName, { body });
      
      if (error) throw error;
      
      const { approvalUrl, orderID } = data;
      
      const listener = await CapacitorApp.addListener('appUrlOpen', async (urlData) => {
        await listener.remove();
        await Browser.close();
        
        if (urlData.url.includes('paypal-return')) {
          setIsLoading(true);
          const urlParams = new URLSearchParams(new URL(urlData.url).search);
          const token = urlParams.get('token');
          
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-paypal-payment', {
            body: { 
              orderID: token, 
              userId: currentUserId, 
              type: flow, 
              amount,
              tier_name: tier 
            }
          });

          if (verifyError || !verifyData?.success) {
            showToaster('Payment verification failed', 'error');
            setIsLoading(false);
            return;
          }

          await new Promise(resolve => { const t = setTimeout(resolve, 2000); if (false) clearTimeout(t); });
          await fetchProfileData(currentUserId);
          
          if (flow === 'wallet_topup') {
            await refreshBalance();
            await refreshTransactions();
            navigate(ROUTES.WALLET_TOPUP_SUCCESS, {
              state: {
                totalAmount: amount,
                creditAmount: amount,
                paymentMethod: 'paypal',
                transactionId: verifyData.captureID,
              },
            });
          } else if (flow === 'tier_upgrade') {
            navigate(ROUTES.WALLET_UPGRADE_SUCCESS, {
              state: {
                tier,
                flow: 'upgrade',
                message: `Subscription Renewed for ${tier}`,
              },
            });
          }
        } else if (urlData.url.includes('paypal-cancel')) {
          showToaster('Payment cancelled', 'error');
        }
        setIsLoading(false);
      });
      
      await Browser.open({ url: approvalUrl });
    } catch (err) {
      console.error('PayPal initiation error', err);
      showToaster('PayPal unavailable', 'error');
      setIsLoading(false);
    }
  };

  const isFormValid = (() => {
    const cleanCard = cardNumber.replace(/\D/g, '');
    if (cleanCard.length !== 16) return false;

    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiry)) return false;

    const [expMonth, expYearStr] = expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (expYearStr < currentYear) return false;
    if (expYearStr === currentYear && expMonth < currentMonth) return false;

    if (cvv.length < 3 || cvv.length > 4) return false;

    if (postalCode.trim().length < 4) return false;

    return true;
  })();

  const handleCardPayment = async () => {
    if (!profile?.id || !amount) {
      showToaster('Invalid amount or user session', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const currentUserId = profile.id;

      if (import.meta.env.DEV) console.log('[PayCard] Processing payment');

      const [expMonthStr, expYearStr] = expiry.split('/');
      const expiryMonth = expMonthStr;
      const expiryYear = expYearStr.length === 2 ? `20${expYearStr}` : expYearStr;

      const stripe = await loadStripe();
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(expiryMonth, 10),
          exp_year: parseInt(expiryYear, 10),  
          cvc: cvv
        },
        billing_details: {
          address: {
            postal_code: postalCode,
            country: countryToISO[selectedCountry]
          }
        }
      });

      if (stripeError) {
        showToaster(stripeError.message || 'Failed to tokenize card', 'error');
        setIsLoading(false);
        return;
      }

      const body = {
        paymentMethodId: paymentMethod.id,
        amount,
        currency: 'USD',
        userId: currentUserId,
      };

      const { data, error } = await supabase.functions.invoke('process-card-payment', { body });

      if (error) throw error;

      if (data.requires_action) {
        showToaster('3D Secure verification required', 'error');
        setIsLoading(false);
        return;
      }

      if (data.success) {
        await refreshBalance();
        await fetchProfileData(currentUserId);
        await refreshTransactions();

        if (flow === 'wallet_topup') {
          navigate(ROUTES.WALLET_TOPUP_SUCCESS, {
            state: {
              totalAmount: amount,
              creditAmount: amount,
              paymentMethod: 'card',
              transactionId: data.paymentIntentId,
            },
          });
        } else if (flow === 'tier_upgrade') {
          navigate(ROUTES.WALLET_UPGRADE_SUCCESS, {
            state: {
              tier,
              flow: 'upgrade',
              message: `Subscription Renewed for ${tier}`,
            },
          });
        }
      } else {
        throw new Error('Payment process unsuccessful');
      }
    } catch (err: any) {
      console.error('Card payment error', err);
      showToaster(err.message || 'Card payment failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const StrokeOverlay = () => (
    <div
      className="absolute inset-0 pointer-events-none rounded-[22px]"
      style={{
        padding: '0.63px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    />
  );

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top safe-bottom pb-8"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}

      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between relative z-10 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className={`text-[19px] font-medium leading-[120%] font-sans absolute left-1/2 -translate-x-1/2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Add Payment
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center pt-[34px] px-5 pb-8 relative z-10">
        
        {/* UPI SECTION */}
        <div className="w-full flex items-center mb-[12px]">
          <img loading="eager" decoding="async" src={ASSETS.UPI} alt="UPI" className="w-[32px] h-[32px] object-contain" />
          <span className={`ml-[14px] text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Pay using any UPI App
          </span>
        </div>

        <div
          className="w-full rounded-[22px] flex flex-col px-[10px] overflow-hidden mb-[36px]"
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            border: isDarkMode ? 'none' : '1px solid #E9EAEB',
            boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
            position: 'relative',
            paddingTop: '12px',
            paddingBottom: '12px',
          }}
        >
          {isDarkMode && <StrokeOverlay />}
          
          {upiAppMethods.map((method, i) => (
            <React.Fragment key={method.id}>
              <div className={`flex items-center h-[32px] cursor-pointer ${i < upiAppMethods.length - 1 ? 'mb-[9px]' : ''}`}>
                {method.icon && (
                  <img loading="lazy" decoding="async" src={method.id === 'cred' && !isDarkMode ? ASSETS.CRED_LIGHT : method.icon} alt={method.name} className="w-[32px] h-[32px] object-contain" />
                )}
                <div className={`flex flex-row items-center flex-1 ${method.icon ? 'ml-[8px]' : ''} min-w-0`}>
                  <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans leading-none shrink-0`}>
                    {method.name}
                  </span>
                  {method.hasInput ? (
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder={method.inputPlaceholder}
                      className={`ml-[36px] bg-transparent border-none outline-none text-[14px] font-medium font-sans flex-1 ${isDarkMode ? 'text-white placeholder:text-[#FAFAFA]/30' : 'text-black placeholder:text-black/30'}`}
                    />
                  ) : null}
                </div>
                {!method.hasInput && (
                  <div className="ml-auto pl-2 flex items-center">
                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium opacity-80 mr-1`}>Link Account</span>
                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} opacity-80`}>›</span>
                  </div>
                )}
              </div>
              {i < upiAppMethods.length - 1 && (
                <>
                  <div className={`w-[338px] h-[1px] mx-auto ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`} />
                  <div className="h-[10px]" />
                </>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* INTERNATIONAL SECTION */}
        <div className="w-full flex items-center mb-[12px]">
          <span className={`text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Got an International Payment Method?
          </span>
        </div>

        {/* PayPal Container — 50px height, 13px radius */}
        <div
          className="w-full rounded-[13px] flex items-center overflow-hidden relative"
          style={{
            height: '50px',
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            border: isDarkMode ? 'none' : '1px solid #E9EAEB',
            boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          {isDarkMode && (
            <div
              className="absolute inset-0 pointer-events-none rounded-[13px]"
              style={{
                padding: '0.63px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          )}
          <div
            onClick={handlePayPalFlow}
            className={`flex items-center w-full h-full px-[16px] cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="w-[32px] h-[32px] bg-white rounded-md flex items-center justify-center p-1 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M20.067 8.478c.492-3.175-1.406-5.127-4.569-5.127H9.865a1.189 1.189 0 0 0-1.171 1.008l-2.736 17.26a.541.541 0 0 0 .534.624h3.69c.607 0 1.116-.43 1.206-1.025l1.096-6.91a.88.88 0 0 1 .868-.744h1.768c3.626 0 6.136-1.5 6.946-5.086z" fill="#003087"/>
                <path d="M19.165 9.079c-.21.724-.626 1.34-1.173 1.834-1.258 1.127-3.218 1.488-5.461 1.488h-1.77a.88.88 0 0 0-.868.744l-1.096 6.91a1.218 1.218 0 0 1-1.206 1.025h-3.69a.541.541 0 0 1-.534-.624l.654-4.135a.87.87 0 0 1 .868-.73h1.365c4.103 0 6.938-1.688 7.848-5.748.245-1.093.187-2.091-.137-2.764z" fill="#0079C1"/>
              </svg>
            </div>
            <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans ml-[12px] flex-1`}>
              {isLoading ? 'Processing...' : 'PayPal'}
            </span>
            <div className="flex items-center">
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium opacity-80 mr-1`}>Link Account</span>
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} opacity-80`}>›</span>
            </div>
          </div>
        </div>

        {/* Card Form Container — 208px height, 22px radius, 14px gap from PayPal */}
        <div
          className="w-full rounded-[22px] flex flex-col overflow-visible relative mt-[14px] pb-[4px]"
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: isDarkMode ? 'blur(20px)' : 'none',
            border: isDarkMode ? 'none' : '1px solid #E9EAEB',
            boxShadow: isDarkMode ? 'none' : '0px 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          {isDarkMode && <StrokeOverlay />}

          <div className="relative flex flex-col flex-1 pt-[8px] px-[15px] pb-[8px]">
            {/* Card Number */}
            <div className="flex flex-col">
              <label className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-satoshi font-medium mb-[1px]`}>
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4242 4242 4242 4242"
                  className={`w-full pr-[40px] bg-transparent border-none outline-none text-[15px] font-satoshi font-medium ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/20'}`}
                />
                {getCardIcon() && (
                  <img loading="lazy" decoding="async" src={getCardIcon()!} alt="Card Type" className="w-[32px] h-[20px] object-contain absolute right-0 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <div className="relative mt-[6px]">
              <div className={`absolute left-1/2 top-0 h-full w-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`} />
              <div className={`h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`} style={{ position: 'relative', left: '-15px', width: 'calc(100% + 30px)' }} />

              <div className="mt-[4px] flex gap-[15px]">
                <div className="flex-1 flex flex-col">
                  <label className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-satoshi font-medium mb-[1px]`}>
                    MM/YY
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={handleExpiryChange}
                    onKeyDown={handleExpiryKeyDown}
                    placeholder="05/25"
                    className={`w-full bg-transparent border-none outline-none text-[15px] font-satoshi font-medium ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/20'}`}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-satoshi font-medium mb-[1px]`}>
                    CVV
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="242"
                    className={`w-full bg-transparent border-none outline-none text-[15px] font-satoshi font-medium ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/20'}`}
                  />
                </div>
              </div>

              <div className={`h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'} mt-[8px]`} style={{ position: 'relative', left: '-15px', width: 'calc(100% + 30px)' }} />
            </div>

            <div className="mt-[15px] mb-[15px] relative z-[999]" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setCountryOpen((open) => !open)}
                className={`w-full flex items-center justify-between gap-[8px] bg-transparent border-none outline-none px-0 py-0 text-left ${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[15px] font-satoshi font-medium`}
              >
                <span className="flex items-center gap-[8px]">
                  <img loading="lazy" decoding="async"                     src={FLAGS[selectedCountry]}
                    alt={selectedCountry}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <span>{selectedCountry}</span>
                </span>
                <span
                  className={`transition-transform duration-150 ${countryOpen ? 'rotate-180' : 'rotate-0'}`}
                  style={{ display: 'inline-flex' }}
                >
                  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              <div
                className="absolute overflow-hidden"
                style={{
                  bottom: 'calc(100% + 4px)',
                  left: '-15px',
                  right: '-15px',
                  zIndex: 999,
                  background: isDarkMode ? '#1e1e2e' : '#ffffff',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid rgba(0, 0, 0, 0.10)',
                  boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.12)',
                  borderRadius: '16px',
                  padding: '8px 0',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  opacity: countryOpen ? 1 : 0,
                  transform: countryOpen ? 'translateY(0)' : 'translateY(8px)',
                  transition: countryOpen ? 'opacity 150ms ease-out, transform 150ms ease-out' : 'opacity 100ms ease-in, transform 100ms ease-in',
                  pointerEvents: countryOpen ? 'auto' : 'none',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.15) transparent',
                }}
              >
                {countries.map((c, index) => {
                  const selected = c.name === selectedCountry;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c.name);
                        setCountryOpen(false);
                      }}
                      className={`w-full flex items-center gap-[10px] px-[16px] py-[11px] text-[14px] font-satoshi text-left transition-colors ${selected ? 'font-semibold' : 'font-normal'}`}
                      style={{
                        color: selected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                        background: selected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        borderBottom: index < countries.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(event) => {
                        if (!selected) event.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(event) => {
                        if (!selected) event.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <img loading="lazy" decoding="async"                         src={FLAGS[c.name]}
                        alt={c.name}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <span>{c.name}</span>
                      {selected && (
                        <span className="ml-auto text-brand-primary" style={{ fontSize: '14px' }}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`} style={{ position: 'relative', left: '-15px', width: 'calc(100% + 30px)' }} />

            <div className="flex flex-col mt-[4px]">
              <label className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-satoshi font-medium mb-[1px]`}>
                Postal Code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="424242"
                className={`w-full bg-transparent border-none outline-none text-[15px] font-satoshi font-medium ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/20'}`}
              />
            </div>

            {/* TODO: integrate with payment processor for card tokenization */}
          </div>
        </div>

        {/* Pay Now Button */}
        <div className="w-full mt-[24px]">
          <button
            onClick={handleCardPayment}
            disabled={!isFormValid || isLoading}
            className={`w-full h-[48px] text-white rounded-full text-[16px] font-bold font-sans transition-all duration-150 ${
              isFormValid && !isLoading
                ? 'bg-primary hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-[#B0B0B0] dark:bg-[#3A3A4A] text-white/50 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Processing...' : `Pay $${Number(amount || 0).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternationalPayment;
