import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { X } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { SlideToPay } from '@/components/SlideToPay';
import AddressSelectionSheet from '@/components/AddressSelectionSheet';
import { supabase } from '@/lib/supabase';
import { createAddress } from '@/lib/addresses';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useUser } from '@/contexts/UserContext';
import { writeStorage } from '@/utils/storage';
import { calculateDistance, HUB_COORDS, normalizeCity } from '@/lib/utils';
import { setBadge } from '@/utils/badge';

import { cn } from '@/lib/utils';
import { useWebScroll } from '@/hooks/useWebScroll';
import { crashlytics } from '@/lib/crashlytics';
import { useLocationStore } from '@/store/useLocationStore';
import { withTimeout, isTimeoutError } from '@/utils/withTimeout';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';


// Module-level storage — survives React state resets within the session
let isPaymentInProgress = false;
let pendingVerificationStore: {
  cashfree_order_id: string;
  addressId: string;
  zoneId: string;
  parsedAmount: number;
  totalAmount: number;
  deliveryFee: number;
  platformFee: number;
  gst: number;
  tipAmount: number;
  rewardPointsValue: number;
  riderEarnings: number;
  pickupLocation: string | null;
  pickupAddress: string | null;
  dAddressText: string;
  customerPhoneNumber: string;
  city: string;
  lng: number;
  lat: number;
  scheduledAt: string | null;
} | null = null;

declare const Cashfree: any;
const OrderCashSummary = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToaster } = useCustomToaster();
  const {
    amount,
    isScheduledFlow,
    selectedSlot: initialSlot,
  } = location.state || { amount: '0.00' };
  // Diagnostic Log for Audit Check #1
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initialSlot || null);
  const isDarkMode = useIsDarkMode();
  const { profile, rewardPoints: rewardPointsData } = useUser();
  const activeAddress = useLocationStore((state) => state.activeAddress);
  const setActiveAddress = useLocationStore((state) => state.setActiveAddress);
  const userId = profile?.id;
  const currentUserId = profile?.id;
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeliveryTipPopup, setShowDeliveryTipPopup] = useState(false);
  // Address State
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);

  // Rewards State
  const [rewardPoints, setRewardPoints] = useState('');
  const [rewardError, setRewardError] = useState('');
  const [rewardApplied, setRewardApplied] = useState(false);
  // Tip State
  const [isTipContainerVisible, setIsTipContainerVisible] = useState(false);
  const [isTipCollapsed, setIsTipCollapsed] = useState(false);
  const [selectedTipOption, setSelectedTipOption] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTipValue, setCustomTipValue] = useState('');
  
  const [pendingVerification, setPendingVerification] = useState<{
    cashfree_order_id: string;
    addressId: string;
    zoneId: string;
    parsedAmount: number;
    totalAmount: number;
    deliveryFee: number;
    platformFee: number;
    gst: number;
    tipAmount: number;
    rewardPointsValue: number;
    riderEarnings: number;
    pickupLocation: string | null;
    pickupAddress: string | null;
    dAddressText: string;
    customerPhoneNumber: string;
  } | null>(null);

  useEffect(() => {
    // If there's a pending verification from a previous 
    // interrupted session, attempt it on mount
    if (pendingVerificationStore) {
      setTimeout(() => {
        runVerification(pendingVerificationStore!);
      }, 500);
    }
  }, []);

  useEffect(() => {
    const handleAppUrlOpen = App.addListener('appUrlOpen', async (data) => {
      const isCashfreeReturn = 
        data.url.includes('cashfree-return') ||
        data.url.includes('gridpe://cashfree-return');
      
      if (isCashfreeReturn && pendingVerificationStore) {
        try {
          await runVerification(pendingVerificationStore);
        } catch (err) {
          if (import.meta.env.DEV) console.error('[appUrlOpen] runVerification failed:', err);
          crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[appUrlOpen] runVerification failed');
          showToaster('Payment verification failed. Please check your order history.', 'error');
        }
      }
    });

    const handleResume = App.addListener('resume', async () => {
      if (pendingVerificationStore) {
        // Small delay to let the WebView settle
        setTimeout(async () => {
          try {
            await runVerification(pendingVerificationStore);
          } catch (err) {
            if (import.meta.env.DEV) console.error('[resume] runVerification failed:', err);
            crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[resume] runVerification failed');
            showToaster('Payment verification failed. Please check your order history.', 'error');
          }
        }, 1500);
      }
    });

    return () => {
      handleAppUrlOpen.then(l => l.remove());
      handleResume.then(l => l.remove());
    };
  }, []);

  const runVerification = async (dataToVerify?: NonNullable<typeof pendingVerificationStore>) => {
    const data = dataToVerify || pendingVerificationStore;
    if (!data) {
      isPaymentInProgress = false;
      return;
    }

    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-cash-order', {
        body: {
          cashfree_order_id: data.cashfree_order_id,
          cashfree_payment_id: data.cashfree_order_id,
          user_id: userId,
          address_id: data.addressId,
          zone_id: data.zoneId,
          city: data.city,
          cash_amount: data.parsedAmount,
          total_amount: data.totalAmount,
          delivery_fee: data.deliveryFee,
          platform_fee: data.platformFee,
          gst: data.gst,
          tip: data.tipAmount,
          reward_points: data.rewardPointsValue,
          rider_earnings: data.riderEarnings,
          hub_id: data.pickupLocation,
          pickup_location: data.pickupAddress,
          delivery_address_text: data.dAddressText,
          customer_phone_number: data.customerPhoneNumber,
          delivery_location_lng: data.lng,
          delivery_location_lat: data.lat,
          scheduled_at: data.scheduledAt
        }
      });

      if (verifyError || !verifyData?.success) {
        pendingVerificationStore = null;
        setPendingVerification(null);
        showToaster('Payment verification failed. Please contact support with your order ID.', 'error');
        crashlytics.recordError(new Error(verifyData?.message || 'verify-cash-order failed'), 'OrderCashSummary.runVerification.first');
        return;
      }

      pendingVerificationStore = null;
      setPendingVerification(null);
      setBadge(1);
      navigate(ROUTES.ORDER_DETAILS.replace(':orderId', verifyData.order_id), {
        state: {
          totalAmount: data.totalAmount,
          savedAddress: activeAddress,
          order: { id: verifyData.order_id, status: 'payment_captured' }
        }
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('runVerification error:', err);
      crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'runVerification error');
      pendingVerificationStore = null;
      setPendingVerification(null);
      showToaster('Verification failed.', 'error');
    } finally {
      isPaymentInProgress = false;
    }
  };
  // Dynamic Quote State
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(false);
  const [quoteData, setQuoteData] = useState<{
    delivery_fee: number;
    platform_fee: number;
    gst: number;
    gst_rate: number;
    total_payable: number;
  } | null>(null);

  const getAddressDisplay = () => {
    if (!activeAddress) return 'Add Address';
    const parts = [activeAddress.house, activeAddress.area, activeAddress.city];
    const base = parts.filter(Boolean).join(', ');
    if (activeAddress.postcode) {
      return `${base} - ${activeAddress.postcode}`;
    }
    return base;
  };
  // Calculations
  const calculatedDistance = React.useMemo(() => {
    if (activeAddress?.latitude && activeAddress?.longitude) {
      return calculateDistance(
        HUB_COORDS.CASH.lat,
        HUB_COORDS.CASH.lng,
        Number(activeAddress.latitude),
        Number(activeAddress.longitude)
      );
    }
    return null;
  }, [activeAddress?.latitude, activeAddress?.longitude]);

  const parsedAmount = parseFloat((amount || '0').toString().replace(/,/g, '')) || 0;
  const rewardPointsValue = rewardApplied && rewardPoints ? parseInt(rewardPoints, 10) : 0;
  const rewardDiscount = rewardPointsValue * 0.025;
  // Fetch Quote
  const fetchQuote = React.useCallback(async () => {
    setQuoteError(false);
    setQuoteLoading(true);
    try {
      if (calculatedDistance === null) {
        showToaster('Could not determine your delivery location. Please re-select your address.', 'error');
        setQuoteError(true);
        setQuoteLoading(false);
        return;
      }
      const distance = calculatedDistance;
      const { data, error } = await (supabase.rpc as any)('get_order_quote', {
        p_amount: Number(parsedAmount),
        p_order_type: 'cash',
        p_distance_km: Number(distance.toFixed(2)),
        p_service_amount: 0,
        p_user_id: userId || null,
      });
      if (error) throw error;
      setQuoteData(data);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to fetch order quote', err);
      crashlytics.recordError(err instanceof Error ? err : new Error('Failed to fetch order quote'), 'OrderCashSummary.fetchQuote');
      crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Failed to fetch order quote');
      showToaster('Failed to calculate order fees. Please try again.', 'error');
      setQuoteError(true);
    } finally {
      setQuoteLoading(false);
    }
  }, [parsedAmount, calculatedDistance, userId]);

  React.useEffect(() => {
    if (parsedAmount > 0) {
      fetchQuote();
    }
  }, [parsedAmount, fetchQuote]);
  const deliveryFee = quoteData?.delivery_fee || 0;
  const platformFee = quoteData?.platform_fee || 0;
  const gst = quoteData?.gst || 0;
  const baseTotal = quoteData?.total_payable || parsedAmount + deliveryFee + platformFee + gst;
  const totalAmount = baseTotal - rewardDiscount + tipAmount;
  const handleTipSelect = (option: string) => {
    setSelectedTipOption(option);
    if (option === 'other') {
      setTipAmount(0);
    } else {
      setTipAmount(parseInt(option, 10));
    }
  };
  const handleClearTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTipOption(null);
    setTipAmount(0);
    setCustomTipValue('');
  };
  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setCustomTipValue(val);
    }
  };
  const handleApplyCustomTip = () => {
    const val = parseInt(customTipValue, 10);
    if (!isNaN(val) && val > 0) {
      setTipAmount(val);
    }
  };
  const handleClearCustomTip = () => {
    setCustomTipValue('');
    setTipAmount(0);
    setSelectedTipOption(null);
    setIsTipContainerVisible(false);
  };
  const handleCollapseTip = () => {
    if (tipAmount > 0) {
      setIsTipCollapsed(!isTipCollapsed);
    } else {
      setIsTipContainerVisible(false);
      setIsTipCollapsed(false);
    }
  };
  const handlePay = async () => {
    if (isPaymentInProgress) {
      return;
    }
    isPaymentInProgress = true;
    setIsLoading(true);
    try {
      if (!userId) {
        showToaster('You must be logged in to place an order.', 'error');
        return;
      }
      if (!activeAddress) {
        showToaster('Please select a valid address.', 'error');
        return;
      }

      let addressId = activeAddress.id;
      // 1. Ensure address exists in DB if ID is missing from state
      if (!addressId) {
        try {
          const newAddress = await createAddress({
            user_id: userId,
            label: activeAddress.tag,
            apartment: activeAddress.house,
            area: activeAddress.area,
            landmark: activeAddress.landmark || '',
            city: activeAddress.city,
            state: activeAddress.state,
            plus_code: activeAddress.plusCode || null,
            latitude: Number(activeAddress.latitude) || 0,
            longitude: Number(activeAddress.longitude) || 0,
            contact_name: activeAddress.name,
            contact_phone: activeAddress.phone,
          });
          addressId = newAddress.id;
          const updatedAddr = { ...activeAddress, id: addressId };
          setActiveAddress(updatedAddr);
          try { writeStorage('user_address', updatedAddr, currentUserId); } catch (e) { if (import.meta.env.DEV) console.warn('Failed to persist address', e); }
        } catch (addrErr: unknown) {
          if (import.meta.env.DEV) console.error('Failed to save address before order', addrErr);
          crashlytics.recordError(addrErr instanceof Error ? addrErr : new Error(String(addrErr)), 'Failed to save address before order');
          const errorMessage = addrErr instanceof Error ? addrErr.message : 'Please try again.';
          showToaster(`Failed to save address: ${errorMessage}`, 'error');
          return;
        }
      }

      // Step 2: Zone check
      const { data: zoneId, error: zoneError } = (await withTimeout(
        (supabase.rpc as any)('check_service_availability', {
          p_lat: Number(activeAddress.latitude) || 0,
          p_lng: Number(activeAddress.longitude) || 0,
        }),
        10_000,
        'check-service-availability'
      ).catch((err) => {
        if (isTimeoutError(err)) {
          showToaster(err.message, 'error');
        }
        throw err;
      })) as any;
      if (zoneError) {
        if (import.meta.env.DEV) console.error('Zone check failed:', zoneError);
        crashlytics.recordError(zoneError instanceof Error ? zoneError : new Error(String(zoneError)), 'Zone check failed');
        showToaster('Failed to verify service availability. Please try again.', 'error');
        return;
      }
      if (!zoneId) {
        showToaster('Cash delivery is not available in your area yet.', 'error');
        navigate(ROUTES.NOT_AVAILABLE);
        return;
      }

      // Step 3: Fetch customer profile for phone
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();
      if (userError || !(userProfile as any)?.phone) {
        showToaster('Please add a phone number to your profile before ordering.', 'error');
        setIsLoading(false);
        navigate(ROUTES.SETTINGS);
        return;
      }
      const customerPhoneNumber = (userProfile as any).phone;

      // Step 4: Calculate rider earnings and pickup location
      let riderEarnings = 0;
      let pickupLocation: string | null = null;
      let pickupAddress: string | null = null;
      try {
        if (calculatedDistance === null) {
          showToaster('Could not determine your delivery location. Please re-select your address.', 'error');
          setIsLoading(false);
          return;
        }
        const distance = calculatedDistance;
        if (true) {
          const { data: hubs, error: hubsError } = await (supabase.from('hubs') as any)
            .select('id, location_name, city')
            .eq('city', normalizeCity(activeAddress.city));
          if (hubs && hubs.length > 0) {
            const nearest = hubs[0];
            pickupLocation = nearest.id;
            pickupAddress = `${nearest.location_name}, ${nearest.city}`;
          }
        }
        const { data: earnings, error: earningsError } = (await withTimeout(
          (supabase.rpc as any)('calculate_rider_earning', {
            dist_km: parseFloat(distance.toFixed(2)),
            cash_amount: parsedAmount,
          }),
          10_000,
          'calculate-rider-earning'
        )) as any;
        if (!earningsError && earnings !== null) {
          riderEarnings = parseFloat(earnings);
        }
      } catch (err) {
        if (isTimeoutError(err)) {
          showToaster(err.message, 'error');
          throw err;
        }
        if (import.meta.env.DEV) console.error('Failed to calculate dynamic data:', err);
        crashlytics.recordError(err instanceof Error ? err : new Error('Failed to calculate dynamic data'), 'OrderCashSummary.calculateDynamicData');
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Failed to calculate dynamic data');
      }

      // Step 5: Resolve delivery address text
      const dAddressText = activeAddress.displayAddress || getAddressDisplay();

      // Step 6: Call create-cash-order edge function
      const isNative = Capacitor.isNativePlatform();
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-cash-order', {
        body: {
          user_id: userId,
          amount: parsedAmount,
          total_payable: totalAmount,
          delivery_fee: deliveryFee,
          platform_fee: platformFee,
          gst: gst,
          tip: tipAmount,
          reward_discount: rewardDiscount,
          address_id: addressId,
          zone_id: zoneId,
          city: activeAddress.city,
          customer_phone: customerPhoneNumber,
          customer_name: profile?.full_name || 'Customer',
          customer_email: profile?.email || 'customer@gridpe.in',
          scheduled_at: selectedSlot || null
        }
      });

      // Supabase functions.invoke can nest response differently on native
      const resolvedOrderData = orderData?.payment_session_id 
        ? orderData 
        : orderData?.data?.payment_session_id 
          ? orderData.data 
          : orderData;

      if (orderError || !resolvedOrderData?.success) {
        showToaster('Failed to initiate payment. Please try again.', 'error');
        setIsLoading(false);
        crashlytics.recordError(new Error(resolvedOrderData?.message || 'create-cash-order failed'), 'OrderCashSummary.createOrder');
        return;
      }

      // Step 7: Initialize Cashfree SDK and open checkout
      const cashfreeEnv = resolvedOrderData.cashfree_env === 'sandbox' ? 'sandbox' : 'production';
      const cashfree = Cashfree({ mode: cashfreeEnv });

      if (isNative) {
        const pObj = {
          cashfree_order_id: resolvedOrderData.cashfree_order_id,
          addressId,
          zoneId,
          parsedAmount,
          totalAmount,
          deliveryFee,
          platformFee,
          gst,
          tipAmount,
          rewardPointsValue,
          riderEarnings,
          pickupLocation,
          pickupAddress,
          dAddressText,
          customerPhoneNumber,
          city: activeAddress?.city || '',
          lng: activeAddress?.longitude || 0,
          lat: activeAddress?.latitude || 0,
          scheduledAt: selectedSlot || null
        };
        pendingVerificationStore = pObj;
        setPendingVerification(pObj as any);

        const checkoutBaseUrl = resolvedOrderData.cashfree_env === 'sandbox'
          ? 'https://payments-test.cashfree.com/order'
          : 'https://payments.cashfree.com/order';
        
        const checkoutUrl = `${checkoutBaseUrl}/#${resolvedOrderData.payment_session_id}`;
        
        // Open in Capacitor Browser (in-app browser, not external Chrome)
        const platform = Capacitor.getPlatform();

        await Browser.open({
          url: checkoutUrl,
          // iOS: 'popover' uses SFSafariViewController — stays in-app, 
          //      never kills WebView process
          // Android: 'popover' uses Chrome Custom Tabs
          presentationStyle: 'popover',
          toolbarColor: '#5260FE',
          // iOS only: show done button so user can return to app
          ...(platform === 'ios' ? {} : {})
        });
        
        setIsLoading(false);
        
        // Browser close listener — triggers verification when user 
        // closes browser or cashfree-return deep link fires
        const browserFinishListener = await Browser.addListener(
          'browserFinished', 
          async () => {
            await browserFinishListener.remove();
            if (pendingVerificationStore) {
              setTimeout(async () => {
                try {
                  await runVerification(pendingVerificationStore);
                } catch (err) {
                  if (import.meta.env.DEV) console.error('[browserFinished] runVerification failed:', err);
                  crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[browserFinished] runVerification failed');
                  showToaster('Payment verification failed. Please check your order history.', 'error');
                }
              }, 1000);
            }
          }
        );
      } else {
        const checkoutOptions = {
          paymentSessionId: resolvedOrderData.payment_session_id,
          redirectTarget: '_modal',   // opens as modal overlay, not redirect
        };

        // Open Cashfree checkout modal
        cashfree.checkout(checkoutOptions).then(async (result: any) => {
          if (result.error) {
            showToaster('Payment failed. Please try again.', 'error');
            setIsLoading(false);
            return;
          }
          if (result.paymentDetails) {
            // Payment succeeded — verify server-side
            try {
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-cash-order', {
                body: {
                  cashfree_order_id: resolvedOrderData.cashfree_order_id,
                  cashfree_payment_id: result.paymentDetails.paymentMessage || resolvedOrderData.cashfree_order_id,
                  user_id: userId,
                  address_id: addressId,
                  zone_id: zoneId,
                  city: activeAddress.city,
                  cash_amount: parsedAmount,
                  total_amount: totalAmount,
                  delivery_fee: deliveryFee,
                  platform_fee: platformFee,
                  gst: gst,
                  tip: tipAmount,
                  reward_points: rewardPointsValue,
                  rider_earnings: riderEarnings,
                  hub_id: pickupLocation,
                  pickup_location: pickupAddress,
                  delivery_address_text: dAddressText,
                  customer_phone_number: customerPhoneNumber,
                  delivery_location_lng: activeAddress.longitude || 0,
                  delivery_location_lat: activeAddress.latitude || 0,
                  scheduled_at: selectedSlot || null
                }
              });

              if (verifyError || !verifyData?.success) {
                showToaster('Payment verification failed. Please contact support with your order ID.', 'error');
                setIsLoading(false);
                crashlytics.recordError(new Error(verifyData?.message || 'verify-cash-order failed'), 'OrderCashSummary.runVerification.second');
                return;
              }

              setBadge(1);
              navigate(ROUTES.ORDER_DETAILS.replace(':orderId', verifyData.order_id), {
                state: {
                  totalAmount,
                  savedAddress: activeAddress,
                  order: { id: verifyData.order_id, status: 'payment_captured' }
                }
              });
            } catch (err) {
              if (import.meta.env.DEV) console.error('[verify-cash-order] invocation failed:', err);
              crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[verify-cash-order] invocation failed');
              showToaster('Payment verification failed. Please check your order history.', 'error');
            }
          }
        });
      }

    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('handlePay error:', error);
      crashlytics.recordError(error instanceof Error ? error : new Error(String(error)), 'handlePay error');
      showToaster('Order failed. Please try again or contact support.', 'error');
    } finally {
      setIsLoading(false);
      // Only reset if NOT going to native browser
      // (native flow needs the flag to stay true until verification)
      if (!Capacitor.isNativePlatform()) {
        isPaymentInProgress = false;
      }
    }
  };
  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setRewardPoints(val);
      setRewardError('');
      if (rewardApplied) {
        setRewardApplied(false);
      }
    }
  };
  const handleApplyReward = () => {
    if (!rewardPoints) return;
    const points = parseInt(rewardPoints, 10);
    if (isNaN(points) || points < 500) {
      setRewardError('Minimum 500 points to redeem.');
      setRewardApplied(false);
    } else if (points > rewardPointsData) {
      setRewardError(`You only have ${rewardPointsData.toLocaleString()} points.`);
      setRewardApplied(false);
    } else {
      setRewardError('');
      setRewardApplied(true);
    }
  };
  const containerStyle = {
    backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.30)' : '#FFFFFF',
    backdropFilter: isDarkMode ? 'blur(24px)' : 'none',
    WebkitBackdropFilter: isDarkMode ? 'blur(24px)' : 'none',
    border: isDarkMode ? '0.65px solid rgba(255, 255, 255, 0.20)' : '1px solid #E9EAEB',
    borderRadius: '13px',
    boxShadow: 'none',
  };
  const isConfirmDisabled =
    !activeAddress ||
    quoteLoading ||
    quoteError ||
    isLoading ||
    pendingVerification !== null ||
    (isScheduledFlow && !selectedSlot);
  // Normal flow (not isScheduledFlow) should always be interactive unless balance/address issues
  const isVisualDisabled = isConfirmDisabled;
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
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      <div className="flex-none px-5 pt-4 flex items-center justify-between z-10 mb-6">
        <BackButton onClick={() => navigate(ROUTES.ORDER_CASH)} />
        <h1
          className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Order Cash
        </h1>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 space-y-[10px] no-scrollbar pb-[280px] relative z-10">
        {/* Address Container */}
        <div
          style={containerStyle}
          className={`w-full relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${!activeAddress ? 'ring-2 ring-brand-primary/80 shadow-[0_0_15px_rgba(82,96,254,0.3)]' : ''}`}
          onClick={() => setIsAddressSheetOpen(true)}
        >
          <div className="flex items-start py-[11px] px-[12px]">
            <div
              className={`w-[52px] h-[52px] shrink-0 flex items-center justify-center mr-[12px] ${!isDarkMode ? 'bg-white border border-black rounded-full' : ''}`}
              style={
                isDarkMode
                  ? {
                      backgroundImage: `url(${ASSETS.CIRCLE_BUTTON})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
            >
              <img loading="lazy" decoding="async"                 src={ASSETS.LOCATION}
                alt="Location"
                className={`w-[22px] h-[22px] ${!isDarkMode ? 'brightness-0' : ''}`}
              />
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[16px] font-medium font-sans capitalize ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {activeAddress ? activeAddress.tag : 'No Address'}
                </span>
                <img loading="lazy" decoding="async"                   src={ASSETS.CHEVRON_DOWN}
                  alt="Toggle"
                  className={`w-4 h-4 ${!isDarkMode ? 'brightness-0' : ''}`}
                />
              </div>
              <p
                className={`text-[14px] font-normal font-sans mt-1 leading-tight line-clamp-2 ${isDarkMode ? 'text-white/80' : 'text-black'}`}
              >
                {getAddressDisplay()}
              </p>
            </div>
          </div>
        </div>
        <div
          style={containerStyle}
          className="w-full py-[11px] px-[12px] flex items-center justify-between"
        >
          <div className="flex items-center gap-[12px]">
            <div
              className={`w-[52px] h-[52px] shrink-0 flex items-center justify-center ${!isDarkMode ? 'bg-white border border-black rounded-full' : ''}`}
              style={
                isDarkMode
                  ? {
                      backgroundImage: `url(${ASSETS.CIRCLE_BUTTON})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
            >
              <img loading="lazy" decoding="async"                 src={ASSETS.DELIVERY}
                alt="Delivery"
                className={`w-[24px] h-[24px] ${!isDarkMode ? 'brightness-0' : ''}`}
              />
            </div>
            <div className="max-w-[140px]">
              <p
                className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Delivery
              </p>
              <p
                className={`text-[12px] font-normal font-sans leading-tight ${isDarkMode ? 'text-white/60' : 'text-black'}`}
              >
                {isScheduledFlow && !selectedSlot
                  ? 'Select the earliest available slot to place your order'
                  : selectedSlot
                    ? `${new Date(selectedSlot).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${new Date(selectedSlot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Deliver now'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {selectedSlot && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setSelectedSlot(null);
                }}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <img loading="lazy" decoding="async"                   src={ASSETS.CROSS_ICON}
                  alt="Clear"
                  className={`w-4 h-4 ${!isDarkMode ? 'brightness-0' : ''}`}
                />
              </button>
            )}
            <div
              className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100"
              onClick={() =>
                navigate(ROUTES.SCHEDULE_DELIVERY, { state: { amount, isScheduledFlow } })
              }
            >
              <img loading="lazy" decoding="async"                 src={ASSETS.CALENDAR}
                alt="Calendar"
                className={`w-[18px] h-[18px] ${!isDarkMode ? 'brightness-0' : ''}`}
              />
              <span
                className={`text-[14px] font-medium font-sans underline underline-offset-2 ${isDarkMode ? 'text-white' : 'text-brand-primary'}`}
              >
                {selectedSlot ? 'Change' : 'Want it later?'}
              </span>
            </div>
          </div>
        </div>
        <div className="py-2">
          <p
            className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white/50' : 'text-black'}`}
          >
            Want more flexibility?
          </p>
          <p
            className={`text-[14px] font-normal font-sans mt-1 leading-tight ${isDarkMode ? 'text-white/50' : 'text-black'}`}
          >
            Schedule your delivery for later and pick a time-slot that suits you the best.
          </p>
        </div>
        <div style={containerStyle} className="w-full pt-[10px] px-[11px] pb-[12px]">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              KYC Security Check 🔐
            </span>
          </div>
          <ul
            className={`list-disc pl-4 space-y-2 text-[13px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white/80 marker:text-white/60' : 'text-black marker:text-black'}`}
          >
            <li>
              Your KYC has been verified. Please keep your original ID ready when accepting your
              cash delivery.
            </li>
            <li>
              Your delivery partner’s name, photo, and KYC details will be visible before drop-off.
            </li>
            <li>Please verify their ID before accepting the cash.</li>
          </ul>
          <div className={`w-full h-[1px] my-3 ${isDarkMode ? 'bg-white/10' : 'bg-brand-border-light'}`} />
          <p
            className={`text-[12px] font-normal font-sans ${isDarkMode ? 'text-white/40' : 'text-black'}`}
          >
            Both parties must match KYC details before the transaction is completed.
          </p>
        </div>
        <div style={containerStyle} className="w-full overflow-hidden">
          <button
            className="w-full py-[13px] px-[12px] flex items-center justify-between"
            onClick={() => setIsRewardsOpen(!isRewardsOpen)}
          >
            <span
              className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Redeem Reward Points
            </span>
            <img loading="lazy" decoding="async"               src={ASSETS.CHEVRON_DOWN}
              alt="Toggle"
              className={`w-4 h-4 transition-transform ${isRewardsOpen ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
            />
          </button>
          {isRewardsOpen && (
            <div className="px-[12px] pb-[16px]">
              <p
                className={`text-[14px] font-medium font-sans -mt-[7px] mb-[21px] ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                You have {rewardPointsData.toLocaleString()} points available (₹
                {(rewardPointsData * 0.025).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
              </p>
              <div className="flex items-center gap-[12px]">
                <div className="relative flex-1 h-[45px]">
                  <input
                    type="text"
                    value={rewardPoints}
                    onChange={handleRewardChange}
                    placeholder="Enter reward points"
                    className={`w-full h-full rounded-full px-4 font-sans text-[12px] focus:outline-none border ${isDarkMode ? 'bg-white/5 text-white border-white/20' : 'bg-white text-black border-brand-border-light'} ${rewardError ? 'border-brand-error' : ''}`}
                  />
                  {rewardApplied && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <img loading="lazy" decoding="async" src={ASSETS.CHECK} alt="Applied" className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleApplyReward}
                  disabled={!rewardPoints}
                  className={`shrink-0 flex items-center justify-center transition-opacity active:scale-95 disabled:opacity-50 rounded-full ${!isDarkMode ? 'bg-black' : ''}`}
                  style={
                    isDarkMode
                      ? {
                          width: '102px',
                          height: '45px',
                          backgroundImage: `url(${ASSETS.APPLY_BUTTON_BG})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }
                      : {
                          width: '102px',
                          height: '45px',
                        }
                  }
                >
                  <span className="text-white text-[14px] font-bold font-sans">
                    {rewardApplied ? 'Applied' : 'Apply'}
                  </span>
                </button>
              </div>
              <p
                className={`text-[12px] font-normal font-sans mt-2 ${rewardError ? 'text-brand-error' : isDarkMode ? 'text-white/40' : 'text-black'}`}
              >
                {rewardError ||
                  (rewardApplied
                    ? `Applied: ₹${rewardDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} discount`
                    : '500 points = ₹12.50')}
              </p>
            </div>
          )}
        </div>
        <div style={containerStyle} className="w-full py-[16px] px-[12px] flex flex-col gap-2">
          {quoteLoading ? (
            <div className="w-full flex flex-col gap-3">
              <div className="h-4 w-full bg-gray-500/20 animate-pulse rounded"></div>
              <div className="h-4 w-3/4 bg-gray-500/20 animate-pulse rounded"></div>
              <div className="h-4 w-5/6 bg-gray-500/20 animate-pulse rounded"></div>
            </div>
          ) : quoteError ? (
            <div className="w-full flex flex-col items-center gap-3 py-2">
              <span className={`text-[13px] font-sans ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                Could not load pricing. Please try again.
              </span>
              <button
                onClick={() => {
                  if (parsedAmount > 0) {
                    setQuoteError(false);
                    setQuoteLoading(true);
                    fetchQuote();
                  }
                }}
                className="text-[13px] font-medium text-brand-purple underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/80' : 'text-black'}`}>Cash Amount</span>
                <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/80' : 'text-black'}`}>Delivery Fee</span>
                <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{deliveryFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/80' : 'text-black'}`}>Platform Fee</span>
                <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{platformFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/80' : 'text-black'}`}>GST</span>
                <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/80' : 'text-black'}`}>Tip</span>
                  <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{tipAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {rewardApplied && (
                <div className="flex justify-between items-center">
                  <span className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/80' : 'text-black'}`}>Reward Discount</span>
                  <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>-₹{rewardDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className={`w-full h-[1px] my-1 ${isDarkMode ? 'bg-white/10' : 'bg-brand-border-light'}`} />
              <div className="flex justify-between items-center">
                <span className={`text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>Total Payable</span>
                <span className={`text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
        </div>
        {isTipContainerVisible && (
          <div style={containerStyle} className="w-full overflow-hidden">
            <div
              className={`flex items-center justify-between px-[12px] ${isTipCollapsed ? 'py-[14px]' : 'pt-[14px] pb-[2px]'}`}
              onClick={() => {
                if (isTipCollapsed) setIsTipCollapsed(false);
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  Delivery Tip
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowDeliveryTipPopup(true);
                  }}
                  className="flex items-center justify-center w-[16px] h-[16px]"
                >
                  <img loading="lazy" decoding="async"                     src={isDarkMode ? ASSETS.DELIVERY_TIP_INFO : ASSETS.INFO_TIP}
                    alt="Info"
                    className={`w-full h-full ${!isDarkMode ? '' : 'brightness-0 opacity-100 invert-[38%] sepia-[68%] saturate-[3440%] hue-rotate-[197deg] brightness-[102%] contrast-[106%]'}`}
                    style={isDarkMode ? { filter: 'none' } : {}}
                  />
                </button>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleCollapseTip();
                }}
              >
                <img loading="lazy" decoding="async"                   src={ASSETS.CHEVRON_DOWN}
                  alt="Collapse"
                  className={`w-4 h-4 transition-transform duration-200 ${!isTipCollapsed ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
      <AddressSelectionSheet
        isOpen={isAddressSheetOpen}
        onClose={() => setIsAddressSheetOpen(false)}
        onAddressSelect={(address) => {
          setActiveAddress(address);
          if (address) setIsAddressSheetOpen(false);
        }}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col pt-[26px] px-[20px] safe-bottom pb-4 shadow-none ${isDarkMode ? 'bg-[#171717]/30 backdrop-blur-[24px]' : 'bg-white border-t border-x border-brand-border-light'}`}
        style={{
          height: '255px',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
        }}
      >
        <p
          className={`text-[18px] font-bold font-sans mb-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {quoteLoading
            ? 'Calculating fees...'
            : `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} — Pay via UPI, Card, or Net Banking`}
        </p>
        <p
          className={`text-[16px] font-medium font-sans mb-[34px] ${!totalAmount ? 'text-brand-error' : isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {quoteLoading
            ? 'Syncing pricing...'
            : !totalAmount
              ? 'Please enter a valid amount'
              : 'Funds held in escrow — released only when you verify delivery.'}
        </p>
        <div style={{ opacity: isVisualDisabled ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
          <SlideToPay
            onComplete={handlePay}
            disabled={isConfirmDisabled}
            label={
              quoteLoading
                ? 'Calculating...'
                : !totalAmount
                  ? 'Enter Amount'
                  : isScheduledFlow && !selectedSlot
                    ? 'Select a Slot'
                    : 'Slide to Proceed'
            }
          />
        </div>
        {isScheduledFlow && !selectedSlot && (
          <p className="text-brand-error text-[12px] font-medium font-sans mt-2 text-center animate-pulse">
            Please select a delivery slot above to continue
          </p>
        )}
      </div>
      {/* Delivery Tip Popup */}
      {showDeliveryTipPopup && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div
            className={`relative p-0 z-10 flex flex-col items-center ${isDarkMode ? 'rounded-2xl border border-white/10' : 'rounded-[13px] shadow-xl'}`}
            style={{
              width: isDarkMode ? '320px' : '362px',
              height: isDarkMode ? 'auto' : '306px',
              backgroundImage: isDarkMode
                ? `url(${ASSETS.POPUP_BG})`
                : `url(${ASSETS.DELIVERY_TIP_LIGHT})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: 'transparent',
            }}
          >
            <img loading="lazy" decoding="async"               src={isDarkMode ? ASSETS.CARD_ICO : ASSETS.CARD_ICON}
              alt="Delivery Tip"
              className={`object-contain ${isDarkMode ? 'w-8 h-8 mb-4' : 'w-[30px] h-[30px] mt-[19px]'}`}
            />
            <h2
              className={`font-sans ${isDarkMode ? 'text-[18px] font-medium mb-4 text-white' : 'text-[16px] font-bold mt-[15px] text-black'}`}
            >
              Delivery Tip
            </h2>
            <div
              className={`rounded-xl px-[12px] ${isDarkMode ? 'w-full py-[11px] bg-black' : 'w-[318px] h-[172px] mt-[24px] bg-white rounded-[16px] pt-[11px]'}`}
            >
              <p
                className={`font-sans leading-[140%] text-left mb-[6px] ${isDarkMode ? 'text-[13px] font-normal text-white' : 'text-[13px] font-normal text-black'}`}
              >
                Our delivery partners ride through traffic, harsh weather, and long distances to
                bring your cash safely to your door.
              </p>
              <p
                className={`font-sans leading-[140%] text-left ${isDarkMode ? 'text-[13px] font-normal text-white' : 'text-[13px] font-normal text-black'}`}
              >
                Tipping isn’t mandatory – but it goes directly to them and helps support their daily
                hustle, fuel, and hard work.
                <br />
                Even a small amount makes a big difference.
                <br />
                Every rupee = recognition. 💙
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeliveryTipPopup(false)}
            className={cn(
              'relative z-10 mt-6 px-8 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden',
              isDarkMode ? 'glass-container glass-physics-clear grow-0' : 'bg-black'
            )}
            style={
              {
                '--glass-specular-intensity': '0.2',
              } as React.CSSProperties
            }
          >
            {isDarkMode && (
              <>
                <div className="glass-lens" />
                <div
                  className="absolute inset-0 z-[1] pointer-events-none"
                  style={{ backgroundColor: 'var(--glass-tint)' }}
                />
                <span className="glass-rim-v2" />
              </>
            )}
            <X className="w-4 h-4 text-white relative z-10" />
            <span className="text-white text-[14px] font-sans relative z-10">Close</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default OrderCashSummary;
