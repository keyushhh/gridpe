import { ASSETS } from '@/constants/assets';
import { crashlytics } from '@/lib/crashlytics';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { X } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useUser } from '@/contexts/UserContext';
import { writeStorage } from '@/utils/storage';
import { supabase } from '@/lib/supabase';
import { createAddress, isAddressComplete } from '@/lib/addresses';
import { SlideToPay } from '@/components/SlideToPay';
import AddressSelectionSheet from '@/components/AddressSelectionSheet';
import { SavedAddress } from '@/types';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import 'maplibre-gl/dist/maplibre-gl.css';
import { calculateDistance, HUB_COORDS, normalizeCity } from '@/lib/utils';
import { setBadge } from '@/utils/badge';
import { useWebScroll } from '@/hooks/useWebScroll';
import { getAddress, migrateAddressKey, ADDRESS_KEYS } from '@/utils/addressStorage';
import { withTimeout, isTimeoutError } from '@/utils/withTimeout';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Module-level storage — survives React state resets within the session
let isFxPaymentInProgress = false;
let fxPendingVerificationStore: {
  cashfree_order_id: string;
  savedAddress: SavedAddress | null;
  totalAmount: number;
  receiveAmount: number;
} | null = null;

declare const Cashfree: (config: { mode: string }) => {
  checkout: (options: Record<string, unknown>) => Promise<{
    error?: unknown;
    paymentDetails?: { paymentMessage?: string };
  }>;
};
const FxExchangeSummary = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToaster } = useCustomToaster();
  const isDarkMode = useIsDarkMode();
  const { profile, rewardPoints: availableRewardPoints } = useUser();
  const currentUserId = profile?.id;
  // Accept full FX state
  const {
    amount = 100,
    fxRate = 87.36,
    fromCurrency = 'USD',
    toCurrency = 'INR',
    convertedAmount = 0,
    markupAmount = 0,
    flatFee = 150,
    finalAmount = 0,
    markupPercent = 0.006,
    currencySymbols = {},
  } = location.state || {};
  // Removed walletBalance check
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
  const [isPayOpen, setIsPayOpen] = useState(true); // Default open for breakdown
  const [showDeliveryTipPopup, setShowDeliveryTipPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Address State
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  useEffect(() => {
    const loadAddress = async () => {
      await migrateAddressKey(ADDRESS_KEYS.USER_ADDRESS);
      const address = await getAddress<SavedAddress>(ADDRESS_KEYS.USER_ADDRESS, null);
      if (address) {
        setSavedAddress(address);
      }
    };
    loadAddress();
  }, []);

  const runFxVerification = async (dataToVerify?: NonNullable<typeof fxPendingVerificationStore>) => {
    const data = dataToVerify || fxPendingVerificationStore;
    if (!data) {
      isFxPaymentInProgress = false;
      return;
    }
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-fx-exchange-order', {
        body: {
          cashfree_order_id: data.cashfree_order_id,
          cashfree_payment_id: data.cashfree_order_id,
        }
      });
      if (verifyError || !verifyData?.success) {
        fxPendingVerificationStore = null;
        showToaster('Payment verification failed. Please contact support with your order ID.', 'error');
        crashlytics.recordError(new Error(verifyData?.message || 'verify-fx-exchange-order failed'), 'FxExchangeSummary.runFxVerification');
        return;
      }
      fxPendingVerificationStore = null;
      setBadge(1);
      navigate(ROUTES.FX_SUCCESS.replace(':orderId', verifyData.order_id), {
        state: {
          totalAmount: data.totalAmount,
          receiveAmount: data.receiveAmount,
          savedAddress: data.savedAddress,
          order: { id: verifyData.order_id, status: 'pending' },
          isFx: true,
        }
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('runFxVerification error:', err);
      crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'FxExchangeSummary.runFxVerification.catch');
      fxPendingVerificationStore = null;
      showToaster('Verification failed.', 'error');
    } finally {
      isFxPaymentInProgress = false;
    }
  };

  useEffect(() => {
    if (fxPendingVerificationStore) {
      setTimeout(() => {
        runFxVerification(fxPendingVerificationStore!);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleAppUrlOpen = App.addListener('appUrlOpen', async (data) => {
      const isCashfreeReturn =
        data.url.includes('cashfree-return') ||
        data.url.includes('gridpe://cashfree-return');
      if (isCashfreeReturn && fxPendingVerificationStore) {
        try {
          await runFxVerification(fxPendingVerificationStore);
        } catch (err) {
          if (import.meta.env.DEV) console.error('[appUrlOpen] runFxVerification failed:', err);
          crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[appUrlOpen] runFxVerification failed');
          showToaster('Payment verification failed. Please check your order history.', 'error');
        }
      }
    });
    const handleResume = App.addListener('resume', async () => {
      if (fxPendingVerificationStore) {
        setTimeout(async () => {
          try {
            await runFxVerification(fxPendingVerificationStore);
          } catch (err) {
            if (import.meta.env.DEV) console.error('[resume] runFxVerification failed:', err);
            crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[resume] runFxVerification failed');
            showToaster('Payment verification failed. Please check your order history.', 'error');
          }
        }, 1500);
      }
    });
    return () => {
      handleAppUrlOpen.then(l => l.remove());
      handleResume.then(l => l.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleAddressSelect = (address: SavedAddress | null) => {
    setSavedAddress(address);
    if (address) {
      setIsAddressSheetOpen(false);
    }
  };
  const getAddressDisplay = () => {
    if (!savedAddress) return 'Add Address';
    const parts = [savedAddress.house, savedAddress.area, savedAddress.city];
    const base = parts.filter(Boolean).join(', ');
    if (savedAddress.postcode) {
      return `${base} - ${savedAddress.postcode} `;
    }
    return base;
  };
  // Rewards State
  const [rewardPoints, setRewardPoints] = useState('');
  const [rewardError, setRewardError] = useState('');
  const [rewardApplied, setRewardApplied] = useState(false);
  // Tip State
  const [isTipContainerVisible, setIsTipContainerVisible] = useState(false);
  const [isTipCollapsed, setIsTipCollapsed] = useState(false);
  const [selectedTipOption, setSelectedTipOption] = useState<string | null>(null);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [tipAmount, setTipAmount] = useState(0);
  const [customTipValue, setCustomTipValue] = useState('');
  // Dynamic Quote State
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<{
    delivery_fee: number;
    platform_fee: number;
    gst: number;
    gst_rate: number;
    total_payable: number;
  } | null>(null);
  // Total amount to be held from wallet is the INR converted value (e.g., ₹923)
  // and not the source currency amount (e.g., $10).
  const rewardPointsValue = rewardApplied && rewardPoints ? parseInt(rewardPoints, 10) : 0;
  const rewardDiscount = rewardPointsValue * 0.025;
  const serviceAmount = (markupAmount || 0) + (flatFee || 0);
  // Fetch Quote
  React.useEffect(() => {
    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        let distance = 1.2; // Fallback
        if (currentUserId && savedAddress?.latitude && savedAddress?.longitude) {
          distance = calculateDistance(
            HUB_COORDS.FX.lat,
            HUB_COORDS.FX.lng,
            savedAddress.latitude,
            savedAddress.longitude
          );
        }
        // For FX, p_amount is finalAmount (receive) and p_service_amount is (markup + flatFee)
        const { data, error } = await supabase.rpc('get_order_quote', {
          p_amount: finalAmount,
          p_order_type: 'fx',
          p_service_amount: serviceAmount,
          p_distance_km: parseFloat(distance.toFixed(2)),
        });
        if (error) throw error;
        setQuoteData(data as any);
      } catch (err) {
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'FxExchangeSummary: Failed to fetch FX order quote');
        if (import.meta.env.DEV) console.error('Failed to fetch FX order quote', err);
        crashlytics.recordError(err instanceof Error ? err : new Error('FxExchangeSummary failed to fetch FX order quote'), 'FxExchangeSummary.fetchQuote');
        showToaster('Failed to calculate order fees. Please try again.', 'error');
      } finally {
        setQuoteLoading(false);
      }
    };
    if (finalAmount > 0) {
      fetchQuote();
    } else {
      setQuoteLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalAmount, serviceAmount]);
  const deliveryFee = quoteData?.delivery_fee || 0;
  const platformFee = quoteData?.platform_fee || 0;
  const gst = quoteData?.gst || 0;
  // Total hold amount = receive amount + all fees + gst + tips - rewards
  // Note: baseTotal from quote is receive + delivery + platform + gst.
  // We add markup + flatFee (serviceAmount) and tips, and subtract rewards.
  const holdAmount =
    (finalAmount || 0) +
    serviceAmount +
    deliveryFee +
    platformFee +
    gst +
    tipAmount -
    rewardDiscount;
  const totalAmount = holdAmount;
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
    if (isFxPaymentInProgress) {
      return;
    }
    isFxPaymentInProgress = true;
    setIsLoading(true);
    // Set to true once we've handed off to an async flow (native browser checkout,
    // or the web checkout modal) that owns resetting isFxPaymentInProgress itself —
    // everything before that point must reset it on any early return/throw, or a
    // failed order-creation call would permanently block retrying this session.
    let handedOffToAsyncFlow = false;
    try {
      const userId = currentUserId;
      if (!savedAddress || !isAddressComplete(savedAddress)) {
        showToaster('Please add your complete delivery address (house/flat/door number).', 'error');
        setIsAddressSheetOpen(true);
        return;
      }
      let addressId = savedAddress?.id;
      if (!addressId && savedAddress) {
        try {
          const newAddress = await createAddress({
            user_id: userId,
            label: savedAddress.tag,
            apartment: savedAddress.house,
            area: savedAddress.area,
            landmark: savedAddress.landmark || '',
            city: savedAddress.city,
            state: savedAddress.state,
            plus_code: savedAddress.plusCode || null,
            latitude: Number(savedAddress.latitude) || 0,
            longitude: Number(savedAddress.longitude) || 0,
            contact_name: savedAddress.name,
            contact_phone: savedAddress.phone,
          });
          addressId = newAddress.id;
          const updatedAddr = { ...savedAddress, id: addressId };
          setSavedAddress(updatedAddr);
          try { writeStorage('user_address', updatedAddr, currentUserId); } catch (e) { 
            if (import.meta.env.DEV) { console.warn('Failed to write namespaced address', e); }
            crashlytics.recordError(e instanceof Error ? e : new Error(String(e)), 'FxExchangeSummary.writeStorage1');
          }
        } catch (err) {
          crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'FxExchangeSummary: Failed to save address before order');
          if (import.meta.env.DEV) console.error('Failed to save address before order', err);
          crashlytics.recordError(err instanceof Error ? err : new Error('FxExchangeSummary failed to save address before order'), 'FxExchangeSummary.saveAddress');
          showToaster('Failed to save address details. Please try again.', 'error');
          return;
        }
      }
      if (!addressId) {
        showToaster('Please select a valid address.', 'error');
        return;
      }
      // Check Service Availability & Get Zone ID
      const { data: zoneId, error: zoneError } = await withTimeout(
        supabase.rpc('check_service_availability', {
          p_lat: Number(savedAddress?.latitude) || 0,
          p_lng: Number(savedAddress?.longitude) || 0,
        }),
        10_000,
        'check-service-availability'
      ).catch((err) => {
        if (isTimeoutError(err)) {
          showToaster(err.message, 'error');
        }
        throw err;
      });
      if (zoneError) {
        crashlytics.recordError(zoneError instanceof Error ? zoneError : new Error(String(zoneError)), 'FxExchangeSummary: Zone check failed');
        if (import.meta.env.DEV) console.error('Zone check failed:', zoneError);
        crashlytics.recordError(zoneError instanceof Error ? zoneError : new Error('FxExchangeSummary zone check failed'), 'FxExchangeSummary.zoneCheck');
        showToaster('Failed to verify service availability. Please try again.', 'error');
        return;
      }
      if (!zoneId) {
        navigate(ROUTES.NOT_AVAILABLE);
        return;
      }
      // Wallet hold removed
      const receiveAmount = finalAmount - tipAmount;
      const cleanedReceiveAmount = Math.round(receiveAmount * 100) / 100;
      const cleanedHoldAmount = Math.round(holdAmount * 100) / 100;
      // Calculate Dynamic Rider Earnings
      let riderEarnings = 0;
      let pickupLocation: string | null = null; // Hub UUID
      let pickupAddress: string | null = null; // Human-readable hub address
      try {
        let distance = 1.2;
        if (savedAddress?.latitude && savedAddress?.longitude) {
          distance = calculateDistance(
            HUB_COORDS.FX.lat,
            HUB_COORDS.FX.lng,
            savedAddress.latitude,
            savedAddress.longitude
          );
          // NEW: Fetch active hubs for the user's city
          const { data: hubs, error: hubsError } = await supabase
            .from('hubs')
            .select('id, location_name, city')
            .eq('city', normalizeCity(savedAddress.city));
          if (hubs && hubs.length > 0) {
            // Use the first active hub for the city as coordinates are missing for individual hubs
            const nearest = hubs[0] as any;
            pickupLocation = nearest.id;
            pickupAddress = `${nearest.location_name}, ${nearest.city}`;
          } else {
            const hubErr = new Error(`No active hubs found for city: ${normalizeCity(savedAddress.city)}`);
            crashlytics.recordError(hubErr, 'FxExchangeSummary: Hub fetch failed');
            if (import.meta.env.DEV) console.error('HUB FETCH FAILED: No active hubs found for city:', normalizeCity(savedAddress.city));
            crashlytics.recordError(new Error(`FxExchangeSummary no active hubs for city: ${normalizeCity(savedAddress.city)}`), 'FxExchangeSummary.hubFetch');
            showToaster('No active hubs found for your area. Please try again later.', 'error');
            return;
          }
        }
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', userId)
          .single();
        if (userError || !(userProfile as any)?.phone) {
          throw new Error('Please add a phone number to your profile to proceed.');
        }
        const customerPhoneNumber = (userProfile as any).phone;
        const deliveryAddressText =
          savedAddress.address_line ||
          savedAddress.full_address ||
          savedAddress?.tag ||
          getAddressDisplay();
        const { data: earnings, error: earningsError } = await withTimeout(
          supabase.rpc('calculate_rider_earning', {
            dist_km: parseFloat(distance.toFixed(2)),
            cash_amount: finalAmount,
          }),
          10_000,
          'calculate-rider-earning'
        );
        if (!earningsError && earnings !== null) {
          riderEarnings = Number(earnings);
        } else {
          crashlytics.recordError(new Error(earningsError?.message || 'Rider earnings RPC failed'), 'FxExchangeSummary: Rider earnings RPC failed');
          if (import.meta.env.DEV) console.error('Rider earnings RPC failed, using 0 fallback:', earningsError);
          crashlytics.recordError(earningsError instanceof Error ? earningsError : new Error('FxExchangeSummary rider earnings RPC failed'), 'FxExchangeSummary.riderEarnings');
        }
      } catch (err) {
        if (isTimeoutError(err)) {
          showToaster(err.message, 'error');
          throw err;
        }
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'FxExchangeSummary: Failed to calculate dynamic data');
        if (import.meta.env.DEV) console.error('Failed to calculate dynamic data:', err);
        crashlytics.recordError(err instanceof Error ? err : new Error('FxExchangeSummary failed to calculate dynamic data'), 'FxExchangeSummary.calculateDynamicData');
      }
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();
      if (profileError || !(userProfile as any)?.phone) {
        showToaster('A valid phone number is required to place an order.', 'error');
        return;
      }
      const customerPhoneNumber = (userProfile as any).phone;
      const dAddressText =
        savedAddress.address_line ||
        savedAddress.full_address ||
        savedAddress?.tag ||
        getAddressDisplay();

      // Step: Call create-fx-exchange-order edge function — this actually charges
      // the customer via Cashfree; the order row itself is only created once
      // verify-fx-exchange-order confirms the payment succeeded.
      const isNative = Capacitor.isNativePlatform();
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-fx-exchange-order', {
        body: {
          address_id: addressId,
          zone_id: zoneId,
          receive_amount: cleanedReceiveAmount,
          total_payable: cleanedHoldAmount,
          delivery_fee: deliveryFee,
          platform_fee: platformFee,
          gst: gst,
          tip: tipAmount,
          reward_points: rewardPointsValue,
          rider_earnings: riderEarnings,
          hub_id: pickupLocation,
          pickup_location: pickupAddress,
          delivery_address_text: dAddressText,
          customer_phone: customerPhoneNumber,
          customer_name: (profile as any)?.full_name || 'Customer',
          customer_email: (profile as any)?.email || 'customer@gridpe.in',
          delivery_location_lng: savedAddress?.longitude || 0,
          delivery_location_lat: savedAddress?.latitude || 0,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          fx_rate: fxRate,
          markup_amount: markupAmount,
          flat_fee: flatFee,
          source_amount: amount,
          service_amount: serviceAmount,
        }
      });

      const resolvedOrderData = orderData?.payment_session_id
        ? orderData
        : orderData?.data?.payment_session_id
          ? orderData.data
          : orderData;

      if (orderError || !resolvedOrderData?.success) {
        let errorCode: string | undefined;
        try {
          const errBody = await (orderError as any)?.context?.json?.();
          errorCode = errBody?.error;
        } catch {
          // ignore — fall back to generic message below
        }
        if (errorCode === 'insufficient_reward_points') {
          showToaster('Your reward point balance has changed — please re-check and try again.', 'error');
        } else {
          showToaster('Failed to initiate payment. Please try again.', 'error');
        }
        crashlytics.recordError(new Error(resolvedOrderData?.message || errorCode || 'create-fx-exchange-order failed'), 'FxExchangeSummary.createOrder');
        return;
      }

      const cashfreeEnv = resolvedOrderData.cashfree_env === 'sandbox' ? 'sandbox' : 'production';
      const cashfree = Cashfree({ mode: cashfreeEnv });

      if (isNative) {
        const pObj = {
          cashfree_order_id: resolvedOrderData.cashfree_order_id,
          savedAddress,
          totalAmount: amount,
          receiveAmount,
        };
        fxPendingVerificationStore = pObj;
        handedOffToAsyncFlow = true;

        const checkoutBaseUrl = resolvedOrderData.cashfree_env === 'sandbox'
          ? 'https://payments-test.cashfree.com/order'
          : 'https://payments.cashfree.com/order';
        const checkoutUrl = `${checkoutBaseUrl}/#${resolvedOrderData.payment_session_id}`;

        await Browser.open({
          url: checkoutUrl,
          presentationStyle: 'popover',
          toolbarColor: '#5260FE',
        });

        setIsLoading(false);

        const browserFinishListener = await Browser.addListener(
          'browserFinished',
          async () => {
            await browserFinishListener.remove();
            if (fxPendingVerificationStore) {
              setTimeout(async () => {
                try {
                  await runFxVerification(fxPendingVerificationStore);
                } catch (err) {
                  if (import.meta.env.DEV) console.error('[browserFinished] runFxVerification failed:', err);
                  crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[browserFinished] runFxVerification failed');
                  showToaster('Payment verification failed. Please check your order history.', 'error');
                }
              }, 1000);
            }
          }
        );
      } else {
        const checkoutOptions = {
          paymentSessionId: resolvedOrderData.payment_session_id,
          redirectTarget: '_modal',
        };
        handedOffToAsyncFlow = true;
        cashfree.checkout(checkoutOptions).then(async (result) => {
          if (result.error) {
            showToaster('Payment failed. Please try again.', 'error');
            setIsLoading(false);
            isFxPaymentInProgress = false;
            return;
          }
          if (result.paymentDetails) {
            try {
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-fx-exchange-order', {
                body: {
                  cashfree_order_id: resolvedOrderData.cashfree_order_id,
                  cashfree_payment_id: result.paymentDetails.paymentMessage || resolvedOrderData.cashfree_order_id,
                }
              });
              if (verifyError || !verifyData?.success) {
                showToaster('Payment verification failed. Please contact support with your order ID.', 'error');
                crashlytics.recordError(new Error(verifyData?.message || 'verify-fx-exchange-order failed'), 'FxExchangeSummary.verify');
                return;
              }
              setBadge(1);
              navigate(ROUTES.FX_SUCCESS.replace(':orderId', verifyData.order_id), {
                state: {
                  totalAmount: amount,
                  receiveAmount,
                  savedAddress,
                  order: { id: verifyData.order_id, status: 'pending' },
                  isFx: true,
                },
              });
            } catch (err) {
              if (import.meta.env.DEV) console.error('[verify-fx-exchange-order] invocation failed:', err);
              crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), '[verify-fx-exchange-order] invocation failed');
              showToaster('Payment verification failed. Please check your order history.', 'error');
            } finally {
              setIsLoading(false);
              isFxPaymentInProgress = false;
            }
          }
        });
      }
    } catch (error: unknown) {
      crashlytics.recordError(error instanceof Error ? error : new Error(String(error)), 'FxExchangeSummary: Final catch in handlePay');
      if (import.meta.env.DEV) console.error('Final catch in handlePay (FX):', error);
      crashlytics.recordError(error instanceof Error ? error : new Error('FxExchangeSummary handlePay final catch'), 'FxExchangeSummary.handlePay');
      showToaster(`Failed to place order: ${error instanceof Error ? error.message : 'Please try again.'}`, 'error');
    } finally {
      setIsLoading(false);
      if (!handedOffToAsyncFlow) {
        isFxPaymentInProgress = false;
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
    } else if (points > availableRewardPoints) {
      setRewardError(`You only have ${availableRewardPoints.toLocaleString()} points.`);
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
    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
  };
  const viewState = {
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 12,
  };
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col safe-top safe-bottom relative`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow Orb */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header */}
      <div className="flex-none px-5 safe-top pt-4 flex items-center justify-between z-10 mb-6">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          FX Exchange
        </h1>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 space-y-[10px] no-scrollbar pb-[280px] relative z-10">
        {/* Address Section */}
        <div
          style={containerStyle}
          className="w-full relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
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
              <img
                src={ASSETS.LOCATION}
                alt="Location"
                loading="lazy"
                decoding="async"
                width="22"
                height="22"
                className={`w-[22px] h-[22px] ${!isDarkMode ? 'brightness-0' : ''}`}
              />
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[16px] font-medium font-sans capitalize ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {savedAddress ? savedAddress.tag : 'No Address'}
                </span>
                <img
                  src={ASSETS.CHEVRON_DOWN}
                  alt="Toggle"
                  loading="lazy"
                  decoding="async"
                  width="16"
                  height="16"
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
          className="w-full py-[11px] px-[12px] flex items-center justify-between mt-[10px]"
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
              <img
                src={ASSETS.DELIVERY}
                alt="Delivery"
                loading="lazy"
                decoding="async"
                width="24"
                height="24"
                className={`w-6 h-6 ${!isDarkMode ? 'brightness-0' : ''}`}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Standard Delivery
              </span>
              <span
                className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/60' : 'text-black'}`}
              >
                Deliver now
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100"
            onClick={() => navigate(ROUTES.SCHEDULE_DELIVERY)}
          >
            <img
              src={ASSETS.CALENDAR}
              alt="Calendar"
              loading="lazy"
              decoding="async"
              width="18"
              height="18"
              className={`w-[18px] h-[18px] ${!isDarkMode ? 'brightness-0' : ''}`}
            />
            <span
              className={`text-[14px] font-medium font-sans underline underline-offset-2 ${isDarkMode ? 'text-white' : 'text-brand-primary'}`}
            >
              Want it later?
            </span>
          </div>
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
            <img
              src={ASSETS.CHEVRON_DOWN}
              alt="Toggle"
              loading="lazy"
              decoding="async"
              width="16"
              height="16"
              className={`w-4 h-4 transition-transform ${isRewardsOpen ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
            />
          </button>
          {isRewardsOpen && (
            <div className="px-[12px] pb-[16px]">
              <p
                className={`text-[14px] font-medium font-sans -mt-[7px] mb-[21px] ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                You have {availableRewardPoints.toLocaleString()} points available (₹
                {(availableRewardPoints * 0.025).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
                )
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
                      <img src={ASSETS.CHECK} alt="Applied" loading="lazy" decoding="async" width="16" height="16" className="w-4 h-4" />
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
                  <img
                    src={isDarkMode ? ASSETS.DELIVERY_TIP_INFO : ASSETS.INFO_TIP}
                    alt="Info"
                    loading="lazy"
                    decoding="async"
                    width="16"
                    height="16"
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
                <img
                  src={ASSETS.CHEVRON_DOWN}
                  alt="Collapse"
                  loading="lazy"
                  decoding="async"
                  width="16"
                  height="16"
                  className={`w-4 h-4 transition-transform duration-200 ${!isTipCollapsed ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
                />
              </button>
            </div>
            {!isTipCollapsed && (
              <div className="px-[12px] pb-[16px]">
                <p
                  className={`text-[13px] font-normal font-sans mb-5 leading-snug ${isDarkMode ? 'text-white/80' : 'text-black'}`}
                >
                  A small tip, goes a big way! Totally optional – but your rider will appreciate it
                  â¤ï¸
                </p>
                <div className="flex items-center gap-3">
                  {['10', '20', '30'].map(val => (
                    <div
                      key={val}
                      className="relative shrink-0"
                      style={{ width: '74px', height: '38px' }}
                    >
                      <button
                        onClick={() => handleTipSelect(val)}
                        className={`relative block w-full h-full transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${val === '20' ? 'rounded-[19px]' : ''} ${!isDarkMode ? 'rounded-full' : ''}`}
                        style={
                          isDarkMode
                            ? {
                                backgroundImage: `url(${selectedTipOption === val ? ASSETS.SELECTED_PILL : ASSETS.PILL})`,
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat',
                                boxSizing: 'border-box',
                              }
                            : {
                                backgroundColor: selectedTipOption === val ? '#5260FE' : '#FFFFFF',
                                border: '1px solid #E6E8EB',
                              }
                        }
                      >
                        <div
                          className={`absolute left-0 right-0 flex justify-center items-center gap-[10px] z-20 ${val === '20' ? 'top-[2px]' : 'top-1/2 -translate-y-1/2'}`}
                        >
                          <span
                            className={`font-medium font-sans text-[15px] leading-none ${isDarkMode || selectedTipOption === val ? 'text-white' : 'text-black'}`}
                          >
                            ₹{val}
                          </span>
                          {selectedTipOption === val && (
                            <div
                              onClick={e => {
                                e.stopPropagation();
                                handleClearTip(e);
                                setIsTipContainerVisible(false);
                              }}
                              className="cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                            >
                              <img
                                src={ASSETS.CROSS_ICON}
                                alt="Remove"
                                loading="lazy"
                                decoding="async"
                                width="12"
                                height="12"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                        {val === '20' && (
                          <div className="absolute top-[23px] left-0 right-0 h-[14px] bg-brand-primary flex items-center justify-center z-10 pointer-events-none">
                            <span className="text-white text-[7px] font-bold font-sans uppercase tracking-wider leading-none">
                              MOST TIPPED
                            </span>
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                  <div className="relative shrink-0" style={{ width: '74px', height: '38px' }}>
                    <button
                      onClick={() => handleTipSelect('other')}
                      className={`relative flex items-center justify-center transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${selectedTipOption === 'other' ? 'flex-row gap-[10px]' : ''} ${!isDarkMode ? 'rounded-full' : ''}`}
                      style={
                        isDarkMode
                          ? {
                              width: '74px',
                              height: '38px',
                              backgroundImage: `url(${selectedTipOption === 'other' ? ASSETS.SELECTED_PILL : ASSETS.PILL})`,
                              backgroundSize: '100% 100%',
                              backgroundRepeat: 'no-repeat',
                              boxSizing: 'border-box',
                            }
                          : {
                              width: '74px',
                              height: '38px',
                              backgroundColor:
                                selectedTipOption === 'other' ? '#5260FE' : '#FFFFFF',
                              border: '1px solid #E6E8EB',
                            }
                      }
                    >
                      <span
                        className={`font-medium font-sans text-[15px] z-20 relative leading-none ${isDarkMode || selectedTipOption === 'other' ? 'text-white' : 'text-black'}`}
                      >
                        Other
                      </span>
                      {selectedTipOption === 'other' && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            handleClearCustomTip();
                          }}
                          className="z-30 cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                        >
                          <img
                            src={ASSETS.CROSS_ICON}
                            alt="Remove"
                            loading="lazy"
                            decoding="async"
                            width="12"
                            height="12"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                {selectedTipOption === 'other' && (
                  <div
                    className={`mt-[15px] h-[48px] w-full rounded-full border flex items-center pl-4 pr-4 ${isDarkMode ? 'bg-brand-card-dark border-white/10' : 'bg-white border-brand-border-light'}`}
                  >
                    <span
                      className={`font-medium font-sans mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      ₹
                    </span>
                    <input
                      type="text"
                      placeholder="Enter tip amount"
                      value={customTipValue}
                      onChange={handleCustomTipChange}
                      className={`bg-transparent font-sans text-[14px] focus:outline-none flex-1 ${isDarkMode ? 'text-white placeholder:text-white/30' : 'text-black placeholder:text-black/30'}`}
                    />
                    <button
                      onClick={tipAmount > 0 ? handleClearCustomTip : handleApplyCustomTip}
                      className="text-brand-primary text-[13px] font-medium font-sans ml-2"
                    >
                      {tipAmount > 0 ? 'Clear' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Price Breakdown */}
        <div
          className={`mt-[18px] mb-[150px] ${isDarkMode ? 'bg-brand-card-dark/[0.31] border-white/5' : 'bg-white border-brand-border-light shadow-sm'} border backdrop-blur-[25px] overflow-hidden transition-all duration-300 relative ${isBreakdownOpen ? 'h-[270px] rounded-[13px]' : 'h-[64px] rounded-[8px]'}`}
        >
          {/* Header Section */}
          <div
            className={`pt-[14px] px-[12px] flex justify-between items-start ${!isBreakdownOpen ? 'pb-[12px]' : ''}`}
          >
            <div className="text-left">
              <h4
                className={`text-[15px] font-medium font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Price Breakdown
              </h4>
              <p
                className={`text-[13px] font-satoshi mt-[6px] ${isDarkMode ? 'text-white' : 'text-black font-medium'}`}
              >
                Incl. all taxes & charges
              </p>
            </div>
            <button
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="w-6 h-6 flex items-center justify-center absolute top-[12px] right-[12px] active:scale-95 transition-transform"
            >
              <img
                src={ASSETS.CHEVRON_SMALL}
                alt="Toggle"
                loading="lazy"
                decoding="async"
                width="24"
                height="24"
                className={`w-6 h-6 transition-transform duration-300 ${isBreakdownOpen ? 'rotate-180' : 'rotate-0'} ${!isDarkMode ? 'invert' : ''}`}
              />
            </button>
          </div>
          <div
            className={`px-[12px] flex flex-col items-center transition-opacity duration-300 ${isBreakdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {/* First Divider */}
            <div
              className={`h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'} w-[338px] mt-[10px]`}
            />
            <div className="w-full mt-[10px] flex flex-col gap-0 text-[13px] font-satoshi">
              {/* Base Rate */}
              <div className="flex justify-between items-center h-[18px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>Base Rate</span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  1 {fromCurrency} = {currencySymbols[toCurrency] || ''}
                  {fxRate < 0.01 ? fxRate.toFixed(6) : fxRate < 1 ? fxRate.toFixed(4) : fxRate.toFixed(2)}
                </span>
              </div>
              {/* Amount Entered */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Amount Entered: {currencySymbols[fromCurrency] || ''}
                  {amount}
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {currencySymbols[toCurrency] || ''}
                  {convertedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {/* Markup/Spread */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Markup/Spread (0.60%)
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  - {currencySymbols[toCurrency] || ''}
                  {markupAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {/* Explanation Title */}
              <p
                className={`text-[13px] font-regular leading-tight mt-[12px] ${isDarkMode ? 'text-white/50' : 'text-black'}`}
              >
                Markup/Spread (0.60%) — This is Grid.Pe's margin on conversion, lower than airport
                kiosks.
              </p>
              {/* Flat Fee */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>Flat Fee</span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  - {currencySymbols[toCurrency] || ''}
                  {flatFee < 1 ? flatFee.toFixed(4) : flatFee.toFixed(2)}
                </span>
              </div>
              {/* Delivery & Platform Fee */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Delivery & Platform Fee
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {currencySymbols[toCurrency] || ''}
                  {(deliveryFee + platformFee).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {/* GST */}
              <div className="flex justify-between items-center h-[18px] mt-[8px]">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                  GST ({((quoteData?.gst_rate || 0.18) * 100).toFixed(0)}% on fees)
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {currencySymbols[toCurrency] || ''}
                  {gst.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {/* Reward Points */}
              {rewardApplied && (
                <div className="flex justify-between items-center h-[18px] mt-[8px]">
                  <span className={`${isDarkMode ? 'text-white/70' : 'text-black/60'} text-[13px]`}>
                    Reward Discount ({rewardPointsValue} pts)
                  </span>
                  <span className="text-brand-error font-bold text-[13px]">
                    -₹{rewardDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
            {/* Second Divider */}
            <div
              className={`h-[1px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'} w-[338px] mt-[8px]`}
            />
            {/* Final Amount */}
            <div className="w-full mt-[8px] flex justify-between items-center h-[20px]">
              <span
                className={`text-[15px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Final Amount You'll Receive
              </span>
              <span
                className={`text-[13px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {currencySymbols[toCurrency] || ''}
                {finalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="h-4 flex-none" />
      </div>
      <AddressSelectionSheet
        isOpen={isAddressSheetOpen}
        onClose={() => setIsAddressSheetOpen(false)}
        onAddressSelect={handleAddressSelect}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col pt-[26px] px-[20px] safe-bottom pb-4 shadow-none ${isDarkMode ? 'bg-brand-surface-dark/30 backdrop-blur-[24px]' : 'bg-white border-t border-x border-brand-border-light'}`}
        style={{
          minHeight: '255px',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
        }}
      >
        <p
          className={`text-[18px] font-bold font-sans mb-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {quoteLoading
            ? 'Calculating fees...'
            : `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total payable`}
        </p>
        <p
          className={`text-[16px] font-medium font-sans mb-[34px] ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {quoteLoading
            ? 'Syncing pricing...'
            : "You're charged now — refunded automatically if delivery isn't completed."}
        </p>
        <SlideToPay
          onComplete={handlePay}
          disabled={!savedAddress || quoteLoading || isLoading}
          label={
            quoteLoading
              ? 'Calculating...'
              : isLoading
                ? 'Processing...'
                : 'Slide to Pay'
          }
        />
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
            <img
              src={isDarkMode ? ASSETS.CARD_ICO : ASSETS.CARD_ICON}
              alt="Delivery Tip"
              loading="lazy"
              decoding="async"
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
                hustle, fuel, and hard work. Even a small amount makes a big difference. Every rupee
                = recognition. 💙
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
export default FxExchangeSummary;

