import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/routes';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OpenLocationCode } from 'open-location-code';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getOrderById, cancelOrder as lib_cancelOrder } from '@/lib/orders';
import { Order, OrderMetadata } from '@/types';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useWebScroll } from '@/hooks/useWebScroll';
import DevModeOverlay from '@/components/DevModeOverlay';
import OrderDetailsSkeleton from '@/components/skeletons/OrderDetailsSkeleton';
const OrderDetails = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 13,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelReason, setCancelReason] = useState<number | null>(0);
  const [otherReason, setOtherReason] = useState('');
  const [timer, setTimer] = useState(30);
  const [redirectTimer, setRedirectTimer] = useState(30);
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
    if (loading || !orderId) return;
    const fetchOrder = async () => {
      if (location.state?.order && location.state.order.addresses) {
        setOrder(location.state.order);
        setLoading(false);
        return;
      }
      if (orderId && orderId !== 'undefined') {
        try {
          const data = await getOrderById(orderId);
          if (data) {
            setOrder(data);
          } else {
            console.error('Order not found');
          }
        } catch (e) {
          console.error('Failed to fetch order', e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrder();
    // Real-time subscription
    let channel: RealtimeChannel | null = null;
    const setupSubscription = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && orderId) {
        channel = supabase
          .channel(`order-details-${orderId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `id=eq.${orderId}`,
            },
            payload => {
              const updatedOrder = payload.new as unknown as Order;
              setOrder(prev => (prev ? { ...prev, ...updatedOrder } : null));
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
  }, [orderId, location.state, loading]);

  // Assigning partner countdown
  useEffect(() => {
    if (loading || !order || order.status !== 'processing' || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, order?.status, loading, order]);

  // Redirect Timer for Cancelled/Failed Orders
  useEffect(() => {
    if (loading || !order) return;
    if ((order?.status === 'cancelled' || order?.status === 'failed') && redirectTimer > 0) {
      const interval = setInterval(() => {
        setRedirectTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (
      (order?.status === 'cancelled' || order?.status === 'failed') &&
      redirectTimer === 0
    ) {
      navigate(ROUTES.HOME);
    }
  }, [order?.status, redirectTimer, navigate, loading, order]);

  useEffect(() => {
    if (loading || !isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, loading]);

  useEffect(() => {
    if (loading || !order) return;
    const addr = order?.addresses || location.state?.savedAddress;
    if (addr?.plus_code) {
      try {
        const decoded = OpenLocationCode.decode(addr.plus_code);
        setViewState({
          latitude: decoded.latitudeCenter,
          longitude: decoded.longitudeCenter,
          zoom: 14,
        });
      } catch (e) {
        console.error('Failed to decode Plus Code', e);
      }
    } else if (addr?.latitude && addr?.longitude) {
      setViewState({
        latitude: addr.latitude,
        longitude: addr.longitude,
        zoom: 14,
      });
    }
  }, [order, location.state?.savedAddress, loading]);
  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      const reasonType = cancelReasons[cancelReason || 0];
      const reasonText = cancelReason === 5 ? otherReason : reasonType;
      await lib_cancelOrder(order.id, reasonType, reasonText);
      setOrder({
        ...order,
        status: 'cancelled',
        meta_data: {
          ...(order.meta_data || {}),
          cancelled_by: 'user',
          cancel_reason_type: reasonType,
          cancel_reason_text: reasonText,
          cancelled_at: new Date().toISOString(),
        } as OrderMetadata,
      });
      setShowCancelPopup(false);
    } catch (e: unknown) {
      console.error('Failed to cancel order', e);
      const errorMessage = e instanceof Error ? e.message : 'Please contact support.';
      showToaster(`Failed to cancel order: ${errorMessage}`, 'error');
    }
  };
  const getAddressDisplay = () => {
    const addr = order?.addresses || location.state?.savedAddress;
    if (!addr) return 'Unknown Location';
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
      'line-color': 'hsl(var(--primary))',
      'line-width': 2,
      'line-dasharray': [2, 1],
    },
  };
  if (loading || !order) {
    return <OrderDetailsSkeleton />;
  }
  const getStatusConfig = (currentOrder: Order) => {
    // Default / Processing
    let config = {
      bgImage: ASSETS.SUCCESS_BG,
      mainIcon: isDarkMode ? ASSETS.CHECK_ICON : ASSETS.CHECK_ICON_LIGHT,
      headerTitle: 'Order Successful',
      statusTitle: 'Your order is being processed!',
      statusAmount: currentOrder.total_amount || currentOrder.amount,
      showMap: true,
      deliveryText: 'We’re assigning a delivery\npartner soon!',
      deliverySubText: 'Assigning a delivery partner in the next 2 minutes.',
      transactionNote:
        'No charges yet — your wallet will only be debited after you confirm the delivery.',
      canCancel: true,
    };
    if (currentOrder.status === 'success' || currentOrder.status === 'delivered') {
      config = {
        bgImage: ASSETS.SUCCESS_BG,
        mainIcon: isDarkMode ? ASSETS.CHECK_ICON : ASSETS.CHECK_ICON_LIGHT,
        headerTitle: 'Order Delivered',
        statusTitle: 'Order delivered successfully!',
        statusAmount: currentOrder.total_amount || currentOrder.amount,
        showMap: true,
        deliveryText: 'Order Delivered',
        deliverySubText: 'Your package has arrived.',
        transactionNote: 'Amount deducted from your wallet.',
        canCancel: false,
      };
    } else if (currentOrder.status === 'failed') {
      config = {
        bgImage: ASSETS.ERROR_BG,
        mainIcon: isDarkMode ? ASSETS.CROSS_ICON : ASSETS.FAILED_LIGHT,
        headerTitle: 'Order Failed',
        statusTitle: 'Order could not be processed',
        statusAmount: currentOrder.total_amount || currentOrder.amount,
        showMap: false,
        deliveryText: 'Payment Failed',
        deliverySubText:
          (currentOrder.meta_data?.type === 'CASH_ORDER' || currentOrder.meta_data?.type === 'FX_EXCHANGE'
            ? currentOrder.meta_data.cancel_reason_text
            : '') || 'Something went wrong.',
        transactionNote: 'If any amount was deducted, it will be refunded instantly.',
        canCancel: false,
      };
    } else if (currentOrder.status === 'cancelled') {
      config = {
        bgImage: ASSETS.ERROR_BG,
        mainIcon: isDarkMode ? ASSETS.CANCEL_ICO : ASSETS.FAILED_LIGHT,
        headerTitle: 'Order Cancelled',
        statusTitle: 'Order Cancelled',
        statusAmount: currentOrder.total_amount || currentOrder.amount,
        showMap: false,
        deliveryText: 'Order Cancelled',
        deliverySubText:
          (currentOrder.meta_data?.type === 'CASH_ORDER' || currentOrder.meta_data?.type === 'FX_EXCHANGE'
            ? currentOrder.meta_data.cancel_reason_type
            : '') || 'Order cancelled by user.',
        transactionNote: 'Refund has been initiated to your wallet.',
        canCancel: false,
      };
    }
    return config;
  };
  const statusConfig = getStatusConfig(order);
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col safe-top animate-in fade-in duration-500 relative bg-background`}
      style={{
        backgroundImage: isDarkMode ? `url(${statusConfig.bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {/* Dynamic theme glow */}
      {!isDarkMode && (
        <div
          className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 pointer-events-none z-0 ${['success', 'delivered', 'processing', 'pending', 'out_for_delivery', 'arrived', 'accepted', 'picked_up'].includes(order?.status || '') ? 'bg-green-600' : 'bg-destructive'}`}
        />
      )}
      <div className="flex-none px-5 safe-top pt-4 flex items-center justify-between z-10 mb-[21px] relative">
        <div className="w-6" />
        <h1
          className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {statusConfig.headerTitle}
        </h1>
        <button
          ref={hamburgerRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-6 h-6 flex items-center justify-center"
        >
          <img
            src={ASSETS.HAMBURGER_MENU}
            alt="Menu"
            className={`w-full h-full ${!isDarkMode ? 'brightness-0' : ''}`}
          />
        </button>
        {/* Hamburger Menu Dropdown */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-[50px] right-[20px] rounded-[12px] flex flex-col items-start overflow-hidden z-50 border border-white/20"
            style={{
              width: '145px',
              height: 'auto',
              minHeight: '69px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {/* Need Help? */}
            <button className="w-full text-left px-[12px] py-[8px] text-white text-[12px] font-medium font-sans hover:bg-white/10 transition-colors">
              Need Help?
            </button>
            {statusConfig.canCancel && <div className="w-full h-[0.5px]" />}
            {/* Cancel Order (Only if canCancel) */}
            {statusConfig.canCancel && (
              <div
                className="w-full px-[12px] py-[8px] flex items-start justify-between cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (timer > 0) {
                    setShowCancelPopup(true);
                    setIsMenuOpen(false);
                  }
                }}
              >
                <span
                  className={`text-[12px] font-medium font-sans ${timer === 0 ? 'text-muted-foreground' : 'text-white'}`}
                >
                  {timer > 0 ? `Cancel Order (${timer}s)` : 'Cancel Order (unavailable)'}
                </span>
                {timer === 0 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowInfoPopup(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-[14px] h-[14px] ml-1 flex-shrink-0 mt-[2px]"
                  >
                    <img src={ASSETS.DELIVERY_TIP_INFO} alt="Info" className="w-full h-full" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className="flex-1 overflow-y-auto no-scrollbar px-5 flex flex-col items-center"
        style={{ willChange: 'transform', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Main Icon */}
        <div className="w-[62px] h-[62px] mb-[35px]">
          <img
            src={statusConfig.mainIcon}
            alt="Status"
            className="w-full h-full object-contain"
            width={62}
            height={62}
          />
        </div>
        {/* Status Text */}
        <h2
          className={`text-[18px] font-bold font-sans mb-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {statusConfig.statusTitle}
        </h2>
        <p
          className={`text-[25px] font-medium font-sans mb-[39px] ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          ₹
          {(statusConfig.statusAmount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        {/* Delivery Container */}
        <div className="w-full mb-[16px] flex flex-col">
          {/* Header Row (Top Container) */}
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
          {/* Status & Map Container (Bottom Container) */}
          <div
            className={`w-full rounded-b-[14px] flex ${isDarkMode ? 'bg-muted/30' : 'bg-background'} border border-border border-t-0 p-[12px]`}
          >
            {/* Left Text */}
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
            {/* Mini Map (Only if showMap is true) */}
            {statusConfig.showMap && (
              <div className="shrink-0 relative rounded-[8px] overflow-hidden w-[110px] h-[82px] bg-neutral-900">
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
                  {/* Dashed Route Line */}
                  <Source id="route" type="geojson" data={routeGeoJson}>
                    <Layer {...routeLayer} />
                  </Source>
                  {/* Delivery/User Location Marker */}
                  <Marker latitude={viewState.latitude} longitude={viewState.longitude}>
                    <img src={ASSETS.CURRENT_LOCATION} alt="User" className="w-4 h-4" />
                  </Marker>
                  {/* Mock Rider Marker (only for processing?) */}
                  {order.status === 'processing' && (
                    <Marker
                      latitude={viewState.latitude + 0.002}
                      longitude={viewState.longitude + 0.002}
                    >
                      <img src={ASSETS.DELIVERY_RIDER} alt="Rider" className="w-6 h-6" />
                    </Marker>
                  )}
                </Map>
              </div>
            )}
          </div>
        </div>
        {/* Transaction Details Container */}
        <div
          className={`w-full rounded-[13px] p-[12px] mb-[29px] border border-border ${isDarkMode ? 'bg-muted/30' : 'bg-background'}`}
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
              {order.id.slice(0, 8).toUpperCase()}...
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
              {new Date(order.created_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              })}
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
          <p
            className={`text-[13px] font-normal font-sans mb-[14px] leading-snug ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}
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
        {/* Footer CTA */}
        <div className="w-full mt-auto mt-[20px] safe-bottom pb-4">
          {order?.status === 'cancelled' || order?.status === 'failed' ? (
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans ${!isDarkMode ? 'bg-black rounded-full' : ''}`}
                style={{
                  backgroundImage: isDarkMode ? `url(${ASSETS.BUTTON_PRIMARY_WIDE})` : 'none',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                Redirecting to Home in {redirectTimer}s
              </button>
              <p
                className={`mt-[12px] text-center text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}
              >
                (so you don’t sit here questioning your life choices — again)
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
      {/* Info Popup (Toaster) */}
      {showInfoPopup && (
        <div
          className="absolute inset-0 z-50 flex items-start justify-center pt-4 bg-black/50 backdrop-blur-sm safe-top"
          onClick={() => {
            setShowInfoPopup(false);
            setIsMenuOpen(true);
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative rounded-[12px] border border-white/20 p-[12px] flex items-start"
            style={{
              width: '362px',
              height: 'auto',
              minHeight: '79px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <p className="text-white text-[12px] font-medium font-sans leading-[1.4] pr-6">
              The cancellation window has expired. <br />
              If something went wrong or you need help, we’ve got your back — reach out anytime.
            </p>
            <button
              onClick={() => {
                setShowInfoPopup(false);
                setIsMenuOpen(true);
              }}
              className="absolute top-[12px] right-[12px] w-[16px] h-[16px]"
            >
              <img src={ASSETS.CROSS_ICON_SVG} alt="Close" className="w-full h-full" />
            </button>
          </div>
        </div>
      )}
      {/* Cancel Order Popup */}
      {showCancelPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-5">
          <div
            className={`relative rounded-[13px] p-[22px] w-full max-w-[353px] flex flex-col items-center border ${isDarkMode ? 'border-white/10' : 'bg-background border-border'}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${cancelReason === 5 ? ASSETS.POP_BG_EXPANDED : ASSETS.POP_BG_DEFAULT})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}
            }
          >
            <div className="w-[32px] h-[32px] mb-[16px]">
              <img
                src={ASSETS.CANCEL_ICO}
                alt="Cancel"
                className="w-full h-full"
                style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
              />
            </div>
            <h2
              className={`text-[18px] font-bold font-sans mb-[8px] text-center ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Cancel Order?
            </h2>
            <p
              className={`w-full text-[12px] font-medium font-satoshi text-center leading-[140%] mb-[24px] ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              We’re not mad. Just disappointed. Help us understand why you’re cancelling. It helps
              us improve your experience (and emotionally prepare for this moment).
            </p>
            <div
              className={`flex flex-col mb-[24px] overflow-hidden w-full rounded-[12px] border ${isDarkMode ? 'bg-black/60 border-none' : 'bg-muted/50 border-border'}`}
            >
              <div className="pt-[14px] px-[12px]">
                <p
                  className={`text-[12px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  Reason for Cancellation? (Required)
                </p>
              </div>
              <div className={`mt-[14px] w-full h-[1px] bg-border/50`} />
              <div>
                {cancelReasons.map((reason, index) => (
                  <div
                    key={reason}
                    onClick={() => setCancelReason(index)}
                    className={`w-full h-[44px] flex items-center px-[12px] cursor-pointer ${
                      index !== cancelReasons.length - 1 ? 'border-b border-border/30' : ''
                    } ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}
                  >
                    <img
                      src={cancelReason === index ? ASSETS.RADIO_FILL : ASSETS.RADIO_EMPTY_SVG}
                      alt="radio"
                      className="w-[16px] h-[16px] mr-[12px]"
                      style={{
                        filter:
                          cancelReason === index
                            ? 'invert(35%) sepia(87%) saturate(3025%) hue-rotate(224deg) brightness(97%) contrast(92%)'
                            : 'invert(35%) sepia(87%) saturate(3025%) hue-rotate(224deg) brightness(97%) contrast(92%) opacity(0.6)',
                      }}
                    />
                    <span
                      className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
              {cancelReason === 5 && (
                <div className="w-full p-[12px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <textarea
                    value={otherReason}
                    onChange={e => setOtherReason(e.target.value)}
                    placeholder="Tell us more..."
                    className={`w-full h-[80px] rounded-[12px] border p-[12px] text-[13px] font-sans focus:outline-none resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-white/20 placeholder:text-muted-foreground' : 'bg-transparent border-border text-black focus:border-muted placeholder:text-muted-foreground'}`}
                  />
                </div>
              )}
            </div>
            <div className="w-full flex gap-[12px] justify-center">
              <button
                onClick={() => setShowCancelPopup(false)}
                className={`rounded-full text-white text-[14px] font-medium font-sans flex items-center justify-center shrink-0 ${!isDarkMode ? 'bg-black' : ''}`}
                style={{
                  width: '158px',
                  height: '37px',
                  backgroundImage: isDarkMode ? `url(${ASSETS.BUTTON_PRIMARY_WIDE})` : 'none',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                Fine, I'll stay
              </button>
              <button
                onClick={handleCancelOrder}
                className="rounded-full bg-destructive text-white text-[14px] font-medium font-sans hover:bg-destructive/90 transition-colors shrink-0 flex items-center justify-center"
                style={{
                  width: '158px',
                  height: '37px',
                }}
              >
                Pull the plug
              </button>
            </div>
          </div>
        </div>
      )}
      <DevModeOverlay orderId={orderId} />
    </div>
  );
};
export default OrderDetails;
