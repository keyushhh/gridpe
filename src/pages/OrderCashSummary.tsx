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
import { createAddress, getAuthUserId } from '@/lib/addresses';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useUser } from '@/contexts/UserContext';
import { writeStorage } from '@/utils/storage';
import { calculateDistance, HUB_COORDS, normalizeCity } from '@/lib/utils';
import { setBadge } from '@/utils/badge';
import { SavedAddress } from '@/types';
import { cn } from '@/lib/utils';
import { getAddress, migrateAddressKey, ADDRESS_KEYS } from '@/utils/addressStorage';
import { useWebScroll } from '@/hooks/useWebScroll';
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
  console.log('[AUDIT] OrderCashSummary arrived. Params:', { isScheduledFlow, initialSlot });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initialSlot || null);
  const isDarkMode = useIsDarkMode();
  const { profile, walletBalance, rewardPoints: rewardPointsData, refreshBalance } = useUser();
  const userId = profile?.id;
  const currentUserId = profile?.id;
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeliveryTipPopup, setShowDeliveryTipPopup] = useState(false);
  // Address State
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
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
  // Dynamic Quote State
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<{
    delivery_fee: number;
    platform_fee: number;
    gst: number;
    gst_rate: number;
    total_payable: number;
  } | null>(null);

  const getAddressDisplay = () => {
    if (!savedAddress) return 'Add Address';
    const parts = [savedAddress.house, savedAddress.area, savedAddress.city];
    const base = parts.filter(Boolean).join(', ');
    if (savedAddress.postcode) {
      return `${base} - ${savedAddress.postcode}`;
    }
    return base;
  };
  React.useEffect(() => {
    const loadAddress = async () => {
      await migrateAddressKey(ADDRESS_KEYS.USER_ADDRESS);
      const address = await getAddress<SavedAddress>(ADDRESS_KEYS.USER_ADDRESS, null);
      if (address) {
        setSavedAddress(address);
      }
    };
    loadAddress();
  }, []);
  const handleAddressSelect = (address: SavedAddress | null) => {
    setSavedAddress(address);
    if (address) {
      setIsAddressSheetOpen(false);
    }
  };
  // Calculations
  const parsedAmount = parseFloat((amount || '0').toString().replace(/,/g, '')) || 0;
  const rewardPointsValue = rewardApplied && rewardPoints ? parseInt(rewardPoints, 10) : 0;
  const rewardDiscount = rewardPointsValue * 0.025;
  // Fetch Quote
  React.useEffect(() => {
    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        let distance = 1.2; // Fallback
        if (savedAddress?.latitude && savedAddress?.longitude) {
          distance = calculateDistance(
            HUB_COORDS.CASH.lat,
            HUB_COORDS.CASH.lng,
            savedAddress.latitude,
            savedAddress.longitude
          );
        }
        const { data, error } = await supabase.rpc('get_order_quote', {
          p_amount: parsedAmount,
          p_order_type: 'cash',
          p_distance_km: parseFloat(distance.toFixed(2)),
        });
        if (error) throw error;
        setQuoteData(data);
      } catch (err) {
        console.error('Failed to fetch order quote', err);
        showToaster('Failed to calculate order fees. Please try again.', 'error');
      } finally {
        setQuoteLoading(false);
      }
    };
    if (parsedAmount > 0) {
      fetchQuote();
    }
  }, [parsedAmount]);
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
    setIsLoading(true);
    try {
      if (!userId) {
        showToaster('You must be logged in to place an order.', 'error');
        return;
      }
      if (totalAmount > walletBalance) {
        showToaster('Insufficient funds in wallet.', 'error');
        return;
      }
      if (!savedAddress) {
        showToaster('Please select a valid address.', 'error');
        return;
      }
      let addressId = savedAddress.id;
      // 1. Ensure address exists in DB if ID is missing from state
      if (!addressId) {
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
          try { writeStorage('user_address', updatedAddr, currentUserId); } catch (e) { console.warn('Failed to persist address', e); }
        } catch (addrErr: unknown) {
          console.error('Failed to save address before order', addrErr);
          const errorMessage = addrErr instanceof Error ? addrErr.message : 'Please try again.';
          showToaster(`Failed to save address: ${errorMessage}`, 'error');
          return;
        }
      }
      const { data: zoneId, error: zoneError } = await supabase.rpc('check_service_availability', {
        p_lat: Number(savedAddress.latitude) || 0,
        p_lng: Number(savedAddress.longitude) || 0,
      });
      if (zoneError) {
        console.error('Zone check failed:', zoneError);
        showToaster('Failed to verify service availability. Please try again.', 'error');
        return;
      }
      if (!zoneId) {
        navigate(ROUTES.NOT_AVAILABLE);
        return;
      }
      const { error: holdError } = await supabase.rpc('wallet_hold', {
        p_user_id: userId,
        p_amount: totalAmount,
        p_order_id: null,
        p_description: 'Order Placement Hold',
      });
      if (holdError) {
        console.error('Wallet hold failed:', holdError);
        showToaster(
          holdError.message || 'Failed to secure funds. Please check your balance.',
          'error'
        );
        return;
      }
      const cleanedAmount = Math.round(totalAmount * 100) / 100;
      let riderEarnings = 0;
      let pickupLocation: string | null = null;
      let pickupAddress: string | null = null;
      try {
        let distance = 1.2;
        if (savedAddress?.latitude && savedAddress?.longitude) {
          distance = calculateDistance(
            HUB_COORDS.CASH.lat,
            HUB_COORDS.CASH.lng,
            savedAddress.latitude,
            savedAddress.longitude
          );
          const { data: hubs, error: hubsError } = await supabase
            .from('hubs')
            .select('id, location_name, city')
            .eq('city', normalizeCity(savedAddress.city));
          if (hubs && hubs.length > 0) {
            const nearest = hubs[0];
            pickupLocation = nearest.id;
            pickupAddress = `${nearest.location_name}, ${nearest.city}`;
          }
        }
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', userId)
          .single();
        if (userError || !userProfile?.phone) {
          throw new Error('Please add a phone number to your profile to proceed.');
        }
        const customerPhoneNumber = userProfile.phone;
        const deliveryAddressText = savedAddress.displayAddress || getAddressDisplay();
        const { data: earnings, error: earningsError } = await supabase.rpc(
          'calculate_rider_earning',
          {
            dist_km: parseFloat(distance.toFixed(2)),
            cash_amount: parsedAmount,
          }
        );
        if (!earningsError && earnings !== null) {
          riderEarnings = parseFloat(earnings);
        }
      } catch (err) {
        console.error('Failed to calculate dynamic data:', err);
      }
      const getOrderPayload = (
        aid: string,
        phone: string | null,
        pAddress: string | null,
        dAddressText: string
      ) => ({
        user_id: userId,
        address_id: aid,
        zone_id: zoneId,
        amount: parsedAmount,
        total_amount: cleanedAmount,
        payment_mode: 'WALLET',
        order_type: 'CASH_ORDER',
        currency: 'INR',
        status: 'pending',
        type: 'cash',
        rider_earnings: riderEarnings,
        hub_id: pickupLocation,
        pickup_location: pAddress,
        delivery_address_text: dAddressText,
        customer_phone_number: phone,
        delivery_location: `POINT(${savedAddress.longitude || 0} ${savedAddress.latitude || 0})`,
        otp_code: Math.floor(100000 + Math.random() * 900000).toString(),
        delivery_fee: deliveryFee,
        service_fee: platformFee,
        gst: gst,
        delivery_tip: tipAmount,
        reward_points: rewardPointsValue,
        scheduled_at: selectedSlot || null,
        meta_data: {
          item_value: parsedAmount,
          delivery_fee: deliveryFee,
          delivery_tip: tipAmount,
          gst: gst,
          service_fee: platformFee,
          reward_points: rewardPointsValue,
          delivery_address: dAddressText,
          quote_id: quoteData ? 'RPC_FETCHED' : 'FALLBACK',
          client_source: 'frontend_v1',
        },
      });
      const createOrderDirectly = async (
        aid: string,
        phone: string | null,
        pAddress: string | null,
        dAddressText: string
      ) => {
        const payload = getOrderPayload(aid, phone, pAddress, dAddressText);
        const { data, error } = await supabase.from('orders').insert([payload]).select().single();
        if (error) throw new Error(`Database error: ${error.message}`);
        return data;
      };
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', userId)
          .maybeSingle();
        if (profileError || !userProfile?.phone) {
          throw new Error('A valid phone number is required to place an order.');
        }
        const customerPhoneNumber = userProfile.phone;
        const dAddressText = savedAddress.displayAddress || getAddressDisplay();
        const payload = getOrderPayload(
          addressId!,
          customerPhoneNumber,
          pickupAddress,
          dAddressText
        );
        // Diagnostic Log for Audit Check #4
        if (import.meta.env.DEV) console.log('[AUDIT] Final Order Payload:', { ...payload, user_id: '[REDACTED]', customer_phone_number: '[REDACTED]' });
        const orderData = await createOrderDirectly(
          addressId!,
          customerPhoneNumber,
          pickupAddress,
          dAddressText
        );
        const orderId = orderData.id;
        const { data: holdTx } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'hold')
          .eq('status', 'pending')
          .is('order_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (holdTx) {
          await supabase
            .from('wallet_transactions')
            .update({ order_id: orderId })
            .eq('id', holdTx.id);
        }
        setBadge(1);
        await refreshBalance();
        navigate(ROUTES.ORDER_DETAILS.replace(':orderId', orderId), {
          state: {
            totalAmount: totalAmount,
            savedAddress: savedAddress,
            order: orderData,
          },
        });
      } catch (orderError: unknown) {
        console.error('Order attempt failed:', orderError);
        throw orderError;
      }
    } catch (error: unknown) {
      console.error('Final catch in handlePay:', error);
      showToaster('Order failed. Please try again or contact support.', 'error');
    } finally {
      setIsLoading(false);
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
    !savedAddress ||
    totalAmount > walletBalance ||
    quoteLoading ||
    isLoading ||
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
              <img loading="eager" decoding="async"                 src={ASSETS.LOCATION}
                alt="Location"
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
        onAddressSelect={handleAddressSelect}
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
            : `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} will be held from wallet`}
        </p>
        <p
          className={`text-[16px] font-medium font-sans mb-[34px] ${totalAmount > walletBalance ? 'text-brand-error' : isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {quoteLoading
            ? 'Syncing pricing...'
            : totalAmount > walletBalance
              ? 'Insufficient funds in wallet'
              : 'You won’t be charged unless the delivery is completed.'}
        </p>
        <div style={{ opacity: isVisualDisabled ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
          <SlideToPay
            onComplete={handlePay}
            disabled={isConfirmDisabled}
            label={
              quoteLoading
                ? 'Calculating...'
                : totalAmount > walletBalance
                  ? 'Low Balance'
                  : isScheduledFlow && !selectedSlot
                    ? 'Select a Slot'
                    : 'Slide to Pay'
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
