import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { hapticSuccess } from '@/utils/haptics';
const Map = React.lazy(() => import('@/components/MapWrapper'));
const Marker = React.lazy(() => import('@/components/MapWrapper').then(m => ({ default: m.Marker })));
const Source = React.lazy(() => import('@/components/MapWrapper').then(m => ({ default: m.Source })));
const Layer = React.lazy(() => import('@/components/MapWrapper').then(m => ({ default: m.Layer })));
import 'maplibre-gl/dist/maplibre-gl.css';
import { olc } from '@/utils/olc';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
// Fallback if ASSETS.FAILED_LIGHT doesn't exist
import { getOrderById, cancelOrder } from '@/lib/orders';
import { Order, OrderMetadata } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { crashlytics } from '@/lib/crashlytics';
const currencySymbols: Record<string, string> = {
  AUD: '$',
  BRL: 'R$',
  CAD: '$',
  CHF: 'Fr',
  CNY: '¥',
  CZK: 'Kč',
  DKK: 'kr',
  EUR: '€',
  GBP: '£',
  HKD: '$',
  HUF: 'Ft',
  IDR: 'Rp',
  ILS: '₪',
  INR: '₹',
  ISK: 'kr',
  JPY: '¥',
  KRW: '₩',
  MXN: '$',
  MYR: 'RM',
  NOK: 'kr',
  NZD: '$',
  PHP: '₱',
  PLN: 'zł',
  RON: 'lei',
  SEK: 'kr',
  SGD: '$',
  THB: '฿',
  TRY: '₺',
  USD: '$',
  ZAR: 'R',
};
const FxSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const isDarkMode = useIsDarkMode();
  const hasDebited = useRef(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const isFx = location.state?.isFx || false;
  const toCurrency = location.state?.order?.metadata?.toCurrency || 'INR';
  const currencySymbol = isFx ? currencySymbols[toCurrency] || '₹' : '₹';
  // Map State
  const [viewState, setViewState] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 13,
  });
  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelReason, setCancelReason] = useState<number | null>(0);
  const [otherReason, setOtherReason] = useState('');
  const [timer, setTimer] = useState(30);
  const cancelReasons = [
    'I changed my mind',
    'Wrong address selected',
    'Payment issue',
    'Expected quicker delivery',
    'Found a better alternative',
    'Other',
  ];
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const fetchOrder = async () => {
      if (location.state?.order && location.state.order.status) {
        setOrder(location.state.order);
        setLoading(false);
        return;
      }
      if (orderId) {
        try {
          const data = await getOrderById(orderId);
          if (data) {
            setOrder(data);
          }
        } catch (e) {
          if (import.meta.env.DEV) console.error('Failed to fetch order', e);
          crashlytics.recordError(e instanceof Error ? e : new Error('FxSuccess failed to fetch order'), 'FxSuccess.fetchOrder');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrder();
    hapticSuccess();
    let channel: RealtimeChannel;
    const setupSubscription = async () => {
      if (orderId) {
        channel = supabase
          .channel(`fx-success-${orderId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'fx_orders',
              filter: `id=eq.${orderId}`,
            },
            payload => {
              setOrder(prev =>
                prev ? { ...prev, ...payload.new, amount: payload.new.amount_total } : null
              );
            }
          )
          .subscribe();
      }
    };
    setupSubscription();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [orderId, location.state]);
  useEffect(() => {
    if (order?.status === 'processing' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, order?.status]);
  // Wallet debit when FX order is delivered/success is now handled by Postgres Trigger
  useEffect(() => {
    const addr = order?.addresses || location.state?.savedAddress;
    if (addr?.plus_code) {
      try {
        const decoded = olc.decode(addr.plus_code);
        setViewState({
          latitude: decoded.latitudeCenter,
          longitude: decoded.longitudeCenter,
          zoom: 14,
        });
      } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to decode Plus Code', e);
        crashlytics.recordError(e instanceof Error ? e : new Error('FxSuccess failed to decode Plus Code'), 'FxSuccess.decodePlusCode');
      }
    } else if (addr?.latitude && addr?.longitude) {
      setViewState({
        latitude: addr.latitude,
        longitude: addr.longitude,
        zoom: 14,
      });
    }
  }, [order, location.state?.savedAddress]);
  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      const reasonText = cancelReason === 5 ? otherReason : cancelReasons[cancelReason || 0];
      await cancelOrder(order.id, cancelReasons[cancelReason || 0], reasonText);
      // Re-fetch or optimistically update
      const updatedOrder = await getOrderById(order.id);
      if (updatedOrder) setOrder(updatedOrder);
      setShowCancelPopup(false);
    } catch (e) {
      if (import.meta.env.DEV) console.error('Failed to cancel order', e);
      crashlytics.recordError(e instanceof Error ? e : new Error('FxSuccess failed to cancel order'), 'FxSuccess.cancelOrder');
    }
  };
  const getAddressDisplay = () => {
    const addr = order?.addresses || location.state?.savedAddress;
    if (!addr) return 'Unknown Location';
    // Handle both Address (apartment) and SavedAddress (house) interfaces
    const house = addr.apartment || addr.house;
    const area = addr.area;
    const parts = [house, area];
    const fullString = parts.filter(Boolean).join(', ');
    return fullString.length > 20 ? fullString.substring(0, 20) + '...' : fullString;
  };
  const routeGeoJson = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [viewState.longitude, viewState.latitude],
        [viewState.longitude + 0.002, viewState.latitude + 0.002],
      ],
    },
  };
  const routeLayer = {
    id: 'route-line',
    type: 'line' as const,
    paint: {
      'line-color': '#5260FE',
      'line-width': 2,
      'line-dasharray': [2, 1],
    },
  };
  if (loading || !order || !order.status) {
    return (
      <div
        className={`h-screen w-full flex items-start justify-center font-sans safe-top pt-4 bg-background ${isDarkMode ? 'text-white' : 'text-black'}`}
      >
        <div className="flex flex-col items-center gap-4 mt-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Securing your order...</p>
        </div>
      </div>
    );
  }
  const getStatusConfig = (currentOrder: Order) => {
    let config = {
      bgImage: ASSETS.SUCCESS_BG,
      mainIcon: isDarkMode ? ASSETS.CHECK_ICON : ASSETS.CHECK_ICON_LIGHT,
      headerTitle: 'Order Successful',
      statusTitle: 'We’ll notify you once your FX cash is ready for delivery.',
      statusAmount: isFx
        ? location.state?.receiveAmount ||
          (currentOrder.meta_data as OrderMetadata & { receive_amount?: number; receiveAmount?: number })
            ?.receive_amount ||
          (currentOrder.meta_data as OrderMetadata & { receive_amount?: number; receiveAmount?: number })
            ?.receiveAmount ||
          currentOrder.amount
        : currentOrder.amount,
      showMap: true,
      deliveryText: 'We’re assigning a delivery\npartner soon!',
      deliverySubText: 'Assigning a delivery partner in the next 2 minutes.',
      transactionNote:
        'No charges yet — your wallet will only be debited after you confirm the delivery.',
      canCancel: true,
      themeBg: isDarkMode ? 'transparent' : 'hsl(var(--muted))',
    };
    if (currentOrder.status === 'success' || currentOrder.status === 'delivered') {
      config = {
        ...config,
        mainIcon: isDarkMode ? ASSETS.CHECK_ICON : ASSETS.CHECK_ICON_LIGHT,
        headerTitle: 'Order Delivered',
        statusTitle: 'Order delivered successfully!',
        deliveryText: 'Order Delivered',
        deliverySubText: 'Your package has arrived.',
        transactionNote: 'Amount deducted.',
        canCancel: false,
      };
    } else if (currentOrder.status === 'failed') {
      config = {
        ...config,
        bgImage: ASSETS.ERROR_BG,
        mainIcon: isDarkMode ? ASSETS.CROSS_ICON : ASSETS.FAILED_LIGHT,
        headerTitle: 'Order Failed',
        statusTitle: 'Order could not be processed',
        showMap: false,
        deliveryText: 'Payment Failed',
        // @ts-expect-error metadata property exists on some order types
        deliverySubText: currentOrder.metadata?.failure_reason || 'Something went wrong.',
        transactionNote: 'If any amount was deducted, it will be refunded instantly.',
        canCancel: false,
      };
    } else if (currentOrder.status === 'cancelled') {
      config = {
        ...config,
        bgImage: ASSETS.ERROR_BG,
        mainIcon: isDarkMode ? ASSETS.CANCEL_ICO : ASSETS.FAILED_LIGHT,
        headerTitle: 'Order Cancelled',
        statusTitle: 'Order Cancelled',
        showMap: false,
        deliveryText: 'Order Cancelled',
        deliverySubText:
          (currentOrder.meta_data as OrderMetadata)?.cancel_reason_type ||
          'Order cancelled by user.',
        transactionNote: 'Refund has been initiated.',
        canCancel: false,
      };
    }
    return config;
  };
  const statusConfig = getStatusConfig(order);
  return (
    <div
      className={`min-h-screen w-full overflow-y-auto no-scrollbar scroll-smooth safe-bottom animate-in fade-in duration-500 relative bg-background ${isDarkMode ? 'text-white' : 'text-black'}`}
      style={{
        backgroundImage: isDarkMode ? `url(${statusConfig.bgImage})` : `none`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow Orb */}
      {!isDarkMode && (
        <div
          className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 pointer-events-none z-0"
          style={{
            backgroundColor: [
              'success',
              'delivered',
              'processing',
              'pending',
              'out_for_delivery',
              'arrived',
              'held',
              'accepted',
              'picked_up',
            ].includes(order?.status || '')
              ? 'hsl(var(--green-600, #0D992F))'
              : 'hsl(var(--destructive))',
          }}
        />
      )}
      {/* Header */}
      <div className="px-5 safe-top pt-4 flex items-center justify-between z-10 mb-[21px] relative">
        <div className="w-6" />
        <h1
          className={
            isDarkMode
              ? 'text-[22px] font-medium font-satoshi text-white'
              : 'text-[18px] font-medium font-sans text-black'
          }
        >
          {statusConfig.headerTitle}
        </h1>
        <button
          ref={hamburgerRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-6 h-6 flex items-center justify-center"
        >
          <img loading="lazy" decoding="async"             src={ASSETS.HAMBURGER_MENU}
            alt="Menu"
            className={`w-full h-full ${!isDarkMode ? 'brightness-0' : ''}`}
          />
        </button>
        {isMenuOpen && (
          <div
            ref={menuRef}
            className={`absolute top-[50px] right-[20px] rounded-[12px] flex flex-col items-start overflow-hidden z-50 border ${isDarkMode ? 'border-white/20 bg-black/60 shadow-none' : 'border-black/5 bg-white shadow-lg'}`}
            style={{
              width: '145px',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <button
              className={`w-full text-left px-[12px] py-[8px] text-[12px] font-medium font-sans transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'}`}
            >
              Need Help?
            </button>
            {statusConfig.canCancel && (
              <div
                className={`w-full px-[12px] py-[8px] flex items-start justify-between cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                onClick={() => {
                  if (timer > 0) {
                    setShowCancelPopup(true);
                    setIsMenuOpen(false);
                  }
                }}
              >
                <span
                  className={`text-[12px] font-medium font-sans ${timer === 0 ? (isDarkMode ? 'text-white/40' : 'text-black/40') : isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {timer > 0 ? `Cancel Order (${timer}s)` : 'Cancel Order (unavailable)'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="px-5 pb-[10px] flex flex-col items-center">
        {/* Main Icon */}
        <div className="w-[62px] h-[62px]">
          <img loading="lazy" decoding="async" src={statusConfig.mainIcon} alt="Status" className="w-full h-full object-contain" />
        </div>
        {/* Sub-text: 22px below icon, Satoshi Bold 18px */}
        <h2
          className={`text-[18px] font-bold font-sans mt-[22px] text-center leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {statusConfig.statusTitle}
        </h2>
        {/* Amount: 13px below sub-text, Satoshi Medium 25px */}
        <p
          className={`text-[25px] font-medium font-sans mt-[13px] mb-[39px] ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {currencySymbol}
          {(statusConfig.statusAmount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        {/* Delivery Container */}
        <div className="w-full mb-[16px] flex flex-col">
          <div
            className={`w-full px-[16px] py-[9px] flex justify-between items-start z-10 shrink-0 rounded-t-[14px] bg-neutral-950 border border-border border-b-0`}
          >
            <span className={`text-[12px] font-medium font-sans whitespace-nowrap mr-2 text-white`}>
              Delivering to -{' '}
              {order.addresses?.label || location.state?.savedAddress?.tag || 'Home'}
            </span>
            <span
              className={`text-[12px] font-medium font-sans text-right leading-tight text-white`}
            >
              {getAddressDisplay()}
            </span>
          </div>
          <div
            className={`w-full rounded-b-[14px] flex ${isDarkMode ? 'bg-muted/30' : 'bg-background border border-border shadow-sm'}`}
            style={{
              padding: '12px',
            }}
          >
            <div className="flex-1 flex flex-col justify-start pr-2">
              <p
                className={`text-[14px] font-medium font-sans leading-snug mb-[12px] whitespace-pre-line ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {statusConfig.deliveryText}
              </p>
              <p
                className={`text-[12px] font-light font-sans leading-snug mb-[4px] ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {statusConfig.deliverySubText}
              </p>
            </div>
            {statusConfig.showMap && (
              <div className="shrink-0 relative rounded-[8px] overflow-hidden w-[110px] h-[82px] bg-neutral-900">
                <React.Suspense fallback={<div className="w-full h-full bg-[#0A0A12]" />}>
                  <Map
                  {...viewState}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle={
                    isDarkMode
                      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
                  }
                  attributionControl={false}
                  interactive={false}
                >
                  <Source id="route" type="geojson" data={routeGeoJson}>
                    <Layer {...routeLayer} />
                  </Source>
                  <Marker latitude={viewState.latitude} longitude={viewState.longitude}>
                    <img loading="lazy" decoding="async" src={ASSETS.CURRENT_LOCATION} alt="User" className="w-4 h-4" />
                  </Marker>
                  {order.status === 'processing' && (
                    <Marker
                      latitude={viewState.latitude + 0.002}
                      longitude={viewState.longitude + 0.002}
                    >
                      <img loading="lazy" decoding="async" src={ASSETS.DELIVERY_RIDER} alt="Rider" className="w-6 h-6" />
                    </Marker>
                  )}
                </Map>
                </React.Suspense>
              </div>
            )}
          </div>
        </div>
        <div
          className={`w-full rounded-[13px] p-[12px] mb-[29px] ${isDarkMode ? 'bg-muted/30' : 'bg-background border border-border shadow-sm'}`}
          style={{ height: 'auto' }}
        >
          <h3
            className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Transaction Details
          </h3>
          <div className={`w-full h-[1px] mt-[10px] mb-[10px] bg-border`} />
          <div className="flex justify-between items-center mb-[8px]">
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}
            >
              Transaction Number
            </span>
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}
            >
              {order?.id?.substring(0, 8).toUpperCase() || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center mb-[8px]">
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}
            >
              Date & Time
            </span>
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}
            >
              {order?.created_at
                ? new Date(order.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '...'}
            </span>
          </div>
          <div className="flex justify-between items-center mb-[12px]">
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}
            >
              Payment Mode
            </span>
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}
            >
              grid.pe Wallet
            </span>
          </div>
          <div className="flex justify-between items-center mb-[8px]">
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}
            >
              Amount Held
            </span>
            <span
              className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}
            >
              ₹
              {(order?.amount || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {isFx && (
            <div className="flex justify-between items-center mb-[8px]">
              <span
                className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}
              >
                Final Amount (Cash)
              </span>
              <span
                className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}
              >
                {currencySymbol}
                {(
                  (order.meta_data as OrderMetadata & { receive_amount?: number; receiveAmount?: number })
                    ?.receive_amount ||
                  (order.meta_data as OrderMetadata & { receive_amount?: number; receiveAmount?: number })
                    ?.receiveAmount ||
                  0
                ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <p
            className={`text-[13px] font-normal font-sans mb-[14px] leading-snug ${isDarkMode ? 'text-white/50' : 'text-black'}`}
          >
            {statusConfig.transactionNote}
          </p>
          {statusConfig.canCancel && (
            <p
              className={`text-[13px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              If you need to cancel, you can do so within 30 seconds or before a delivery partner is
              assigned, whichever is earlier.
            </p>
          )}
        </div>
        <div className="w-full pb-6">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="w-full h-[48px] rounded-full text-[16px] font-medium font-sans flex items-center justify-center transition-transform active:scale-95"
            style={{
              backgroundImage: isDarkMode ? `url(${ASSETS.BUTTON_CANCEL})` : 'none',
              backgroundColor: isDarkMode ? 'transparent' : '#EBEBEB',
              color: isDarkMode ? '#FFFFFF' : '#000000',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              border: 'none',
            }}
          >
            Go Home
          </button>
        </div>
      </div>
      {showCancelPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-5">
          <div
            className={`relative rounded-[13px] p-[22px] w-full max-w-[353px] flex flex-col items-center border ${isDarkMode ? 'border-white/10' : 'bg-background border-border shadow-2xl'}`}
            style={{
              backgroundImage: `url(${cancelReason === 5 ? ASSETS.POP_BG_EXPANDED : ASSETS.POP_BG_DEFAULT})`,
              backgroundSize: '100% 100%',
            }}
          >
            <div className="w-[32px] h-[32px] mb-[16px]">
              <img loading="lazy" decoding="async" src={ASSETS.CANCEL_ICO} alt="Cancel" className="w-full h-full" />
            </div>
            <h2
              className={`text-[18px] font-bold font-sans mb-[8px] text-center ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Cancel Order?
            </h2>
            <p
              className={`text-[13px] font-medium font-sans text-center leading-[1.4] mb-[24px] px-[13px] ${isDarkMode ? 'text-white' : 'text-black/60'}`}
            >
              We’re not mad. Just disappointed. Help us understand why you’re cancelling.
            </p>
            <div className="w-full flex gap-[12px] justify-center">
              <button
                onClick={() => setShowCancelPopup(false)}
                className="rounded-full text-white text-[14px] font-medium font-sans flex items-center justify-center shrink-0"
                style={{
                  width: '158px',
                  height: '37px',
                  backgroundImage: `url(${ASSETS.BUTTON_PRIMARY_WIDE})`,
                  backgroundSize: '100% 100%',
                }}
              >
                Fine, I'll stay
              </button>
              <button
                onClick={handleCancelOrder}
                className="rounded-full bg-destructive text-white text-[14px] font-medium font-sans shrink-0 flex items-center justify-center"
                style={{ width: '158px', height: '37px' }}
              >
                Pull the plug
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FxSuccess;
