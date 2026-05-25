import { ASSETS } from '@/constants/assets';
import { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Bike } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { olc } from '@/utils/olc';
import { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { setBadge } from '@/utils/badge';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LayerProps } from 'react-map-gl/maplibre';
import type { 
  RealtimePostgresChangesPayload, 
  RealtimePostgresUpdatePayload 
} from '@supabase/supabase-js';

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const [order, setOrder] = useState<Order | null>(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!location.state?.order);
  // Map State
  const [viewState, setViewState] = useState({
    latitude: 12.9716, // Default Bangalore
    longitude: 77.5946,
    zoom: 14.5,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [progress, setProgress] = useState(0);
  const [riderName, setRiderName] = useState<string | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  // Initial check for terminal order status
  useEffect(() => {
    if (order?.status === 'delivered') {
      navigate(ROUTES.ORDER_DELIVERED, {
        state: { order },
      });
    } else if (order?.status === 'cancelled') {
      navigate(ROUTES.ORDER_CANCELLED, {
        state: { order },
      });
    }
  }, [order?.status, navigate]);
  useEffect(() => {
    const activeOrder = order;
    if (activeOrder?.addresses?.plus_code) {
      try {
        const decoded = olc.decode(activeOrder.addresses.plus_code);
        const newLat = decoded.latitudeCenter;
        const newLng = decoded.longitudeCenter;
        setViewState(prev => ({
          ...prev,
          latitude: newLat,
          longitude: newLng,
        }));
        setUserLocation({ latitude: newLat, longitude: newLng });
      } catch (e) {
        console.error('Failed to decode location', e);
      }
    } else if (activeOrder?.addresses?.latitude && activeOrder?.addresses?.longitude) {
      const newLat = activeOrder.addresses.latitude;
      const newLng = activeOrder.addresses.longitude;
      setViewState(prev => ({
        ...prev,
        latitude: newLat,
        longitude: newLng,
      }));
      setUserLocation({ latitude: newLat, longitude: newLng });
    }
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 1));
    }, 600);
    return () => clearInterval(interval);
  }, [order]);
  useEffect(() => {
    if (!order?.id) return;

    const controller = new AbortController();
    let active = true;

    // Fetch rider details if assigned
    if (order.rider_id) {
      // Check if we already have the rider info from the joined order
      if (order.rider?.full_name) {
        setRiderName(order.rider.full_name);
      }
      const fetchRider = async () => {
        try {
          const { data, error } = await supabase
            .from('riders')
            .select(
              'id, full_name, phone_number, kyc_photo, kyc_id_url, kyc_type, kyc_dob, kyc_gender, kyc_number, kyc_status, profile_photo'
            )
            .eq('id', order.rider_id)
            .single();
          if (controller.signal.aborted || !active) return;
          if (data && !error) {
            setRiderName(data.full_name);
            setOrder(prev => (prev ? { ...prev, rider: data } : null));
          }
        } catch (err) {
          if (!active) return;
          console.error('Failed to fetch rider', err);
        }
      };
      fetchRider();
      // Mission C: Subscribe to Real-time Map Tracking
      const channel = supabase
        .channel(`rider-location-${order.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assigned_rider_location',
            filter: `order_id=eq.${order.id}`,
          },
          (payload: RealtimePostgresChangesPayload<{ current_lat: number; current_lng: number }>) => {
            if (!active) return;
            if (payload.eventType !== 'DELETE' && payload.new.current_lat && payload.new.current_lng) {
              setRiderLocation({
                lat: payload.new.current_lat,
                lng: payload.new.current_lng,
              });
            }
          }
        )
        .subscribe();
      // Listen for order status changes
      const orderChannel = supabase
        .channel(`order-status-${order.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${order.id}`,
          },
          (payload: RealtimePostgresUpdatePayload<Order>) => {
            if (!active) return;
            if (payload.new) {
              const newStatus = payload.new.status;
              setOrder(prev => (prev ? { ...prev, ...payload.new } : payload.new));
              // Navigate to delivered screen when order is complete
              if (newStatus === 'delivered') {
                navigate(ROUTES.ORDER_DELIVERED, {
                  state: { order: payload.new },
                });
              }
              // Navigate to cancelled screen if cancelled
              if (newStatus === 'cancelled') {
                navigate(ROUTES.ORDER_CANCELLED, {
                  state: { order: payload.new },
                });
              }
              // Manage app badge
              if (['delivered', 'success', 'cancelled', 'failed'].includes(newStatus)) {
                setBadge(0);
              } else {
                setBadge(1);
              }
            }
          }
        )
        .subscribe();
      // Set initial badge if order is active
      if (!['delivered', 'success', 'cancelled', 'failed'].includes(order.status)) {
        setBadge(1);
      }
      return () => {
        active = false;
        controller.abort();
        supabase.removeChannel(channel);
        supabase.removeChannel(orderChannel);
      };
    } else {
      // If no order ID, we might be loading from a deep link or direct URL
      // Simulate/Wait for data
      const timer = setTimeout(() => {
        if (active) setIsLoading(false);
      }, 1500);
      return () => {
        active = false;
        controller.abort();
        clearTimeout(timer);
      };
    }
  }, [order?.id, order?.rider_id, navigate]);
  useEffect(() => {
    // Simulate rider entering the OTP after 60 seconds
    const timer = setTimeout(async () => {
      // ... (rest of the existing OTP verification logic)
    }, 60000);
    return () => clearTimeout(timer);
  }, [navigate, order]);
  // Calculate dynamic coordinates
  const currentLat = userLocation?.latitude || viewState.latitude;
  const currentLng = userLocation?.longitude || viewState.longitude;
  // Mission C: Real-time Map Tracking
  const riderLat = riderLocation?.lat || currentLat + 0.003;
  const riderLng = riderLocation?.lng || currentLng + 0.004;
  const routeGeoJson = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [currentLng, currentLat], // User
        [currentLng + 0.001, currentLat + 0.001],
        [currentLng + 0.001, currentLat + 0.003],
        [riderLng, riderLat], // Rider
      ],
    },
  };
  const routeLayer: LayerProps = {
    id: 'route-line',
    type: 'line',
    paint: {
      'line-color': '#5260FE',
      'line-width': 4,
    },
  };
  const getStatusText = () => {
    if (!order) return 'Processing...';
    switch (order.status) {
      case 'pending':
        return 'Looking for a rider...';
      case 'accepted':
        return 'Rider is on the way to pick up your order';
      case 'picked_up':
        return 'Out for Delivery';
      case 'success':
      case 'delivered':
        return 'Delivered!';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return 'Processing...';
    }
  };
  const isDelivered = order?.status === 'success' || order?.status === 'delivered';
  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden no-scrollbar ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {/* Light Mode Purple Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header Overlay */}
      <div 
        className="absolute top-0 left-0 right-0 z-20 w-full bg-black/30"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="safe-top pt-4 pb-4 px-5 flex items-center justify-between">
          <BackButton onClick={() => navigate(ROUTES.HOME)} className="text-white [&_svg]:text-white" />
          <h1
            className="text-[18px] font-bold font-satoshi flex-1 text-center pr-10 text-white"
          >
            Order Tracking
          </h1>
        </div>
      </div>
      {/* Map Container */}
      <div
        className="w-full relative overflow-hidden shrink-0 rounded-b-[32px] z-0"
        style={{ height: '38vh' }}
      >
        {isLoading ? (
          <div style={{ width: '100%', height: '100%' }}>
            <Skeleton height="100%" borderRadius={0} style={{ height: '100%' }} />
          </div>
        ) : (
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle={
              isDarkMode
                ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
            }
            attributionControl={false}
            scrollZoom={false}
            dragPan={true}
          >
            <Source id="route" type="geojson" data={routeGeoJson}>
              <Layer {...routeLayer} />
            </Source>
            <Marker latitude={currentLat} longitude={currentLng}>
              <div className="animate-pulse">
                <img loading="eager" decoding="async"                   src={ASSETS.CURRENT_LOCATION}
                  alt="User"
                  className="w-6 h-6"
                  width={24}
                  height={24}
                />
              </div>
            </Marker>
            <Marker latitude={riderLat} longitude={riderLng}>
              <img loading="lazy" decoding="async"                 src={ASSETS.RIDER}
                alt="Rider"
                className="w-8 h-8 drop-shadow-md"
                width={32}
                height={32}
              />
            </Marker>
          </Map>
        )}
      </div>
      <div className="px-5 mt-4 shrink-0 relative z-0">
        <div
          className={`w-full rounded-[12px] relative px-[15px] pt-[10px] pb-[16px] overflow-hidden ${isDarkMode ? '' : 'bg-white'}`}
          style={{
            height: '135px',
            backgroundImage: isDarkMode ? `url(${ASSETS.ARRIVING_CONTAINER})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: isDelivered
              ? '1px solid #16B751'
              : isDarkMode
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid #E9EAEB',
          }}
        >
          <div className="flex justify-between items-start mb-[8px]">
            <div className="flex flex-col">
              <p className="text-brand-text-muted text-[12px] font-bold font-satoshi tracking-widest uppercase leading-none">
                {isDelivered ? 'ORDER STATUS' : 'ARRIVING IN'}
              </p>
              <p
                className={`text-[20px] font-bold font-satoshi mt-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                style={{ lineHeight: '140%', color: isDelivered ? '#1CB956' : undefined }}
              >
                {isDelivered ? 'Delivered' : order?.status === 'arrived' ? 'Arrived' : '1 Min'}
              </p>
            </div>
            <div
              className="absolute"
              style={{
                top: '11px',
                right: '15px',
                width: '31px',
                height: '31px',
              }}
            >
              <img loading="lazy" decoding="async"                 src={isDelivered ? ASSETS.VERIFIED_CIRCLE : ASSETS.ARRIVING}
                alt="StatusIcon"
                className="w-full h-full"
                style={!isDarkMode && !isDelivered ? { filter: 'invert(1)' } : undefined}
                width={31}
                height={31}
              />
            </div>
          </div>
          {/* Loader */}
          <div
            className={`h-[9px] rounded-full overflow-hidden mb-[14px] ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}
          >
            <div
              className="h-full rounded-full transition-all duration-300 ease-linear"
              style={{
                width: isDelivered ? '100%' : `${progress}%`,
                backgroundColor: isDelivered ? '#16B751' : '#5260FE',
                boxShadow: isDelivered
                  ? '0 0 10px rgba(22, 183, 81, 0.5)'
                  : '0 0 10px rgba(82,96,254,0.5)',
              }}
            />
          </div>
          <div>
            <p
              className={`text-[12px] font-medium font-satoshi mb-[4px] ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {isLoading ? <Skeleton width="40%" /> : getStatusText()}
            </p>
            <p
              className={`text-[12px] font-normal font-satoshi leading-tight ${isDarkMode ? 'text-white/50' : 'text-brand-text-muted'}`}
            >
              {isLoading ? (
                <Skeleton count={2} />
              ) : isDelivered ? (
                'Your package has been handed over successfully.'
              ) : order?.status === 'accepted' ? (
                'Your rider is heading to the pickup hub'
              ) : order?.status === 'picked_up' ? (
                'Your rider is on the way to you!'
              ) : order?.status === 'processing' ? (
                "We're assigning a partner to your request."
              ) : (
                'Your delivery partner and order are tracked in real-time.'
              )}
            </p>
          </div>
        </div>
      </div>
      {/* Rider Details Container */}
      <div className="px-[15px] mt-2.5 shrink-0 relative z-0">
        <div
          className="w-full mx-auto rounded-[13px] relative pt-[9px] px-[9px] pb-[14px] overflow-hidden"
          style={{
            height: order?.rider_id ? '290px' : 'auto',
            maxWidth: '362px',
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
            border: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '1px solid #E9EAEB',
          }}
        >
          {order?.rider_id ? (
            <div className="flex items-start gap-[12px] mb-4">
              {/* Photo Frame */}
              <div className="w-[81px] h-[89px] relative shrink-0 rounded-[6px] overflow-hidden">
                <img loading="lazy" decoding="async"                   src={(() => {
                    const rider = order?.rider;
                    const photo = rider?.kyc_photo || rider?.profile_photo;
                    if (!photo) return ASSETS.AVATAR;
                    if (photo.startsWith('http')) return photo;
                    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/riders/${photo}`;
                  })()}
                  alt={`${riderName || order?.rider?.full_name || 'Rider'}'s photo`}
                  className="w-full h-full object-cover"
                />
                {/* Verified Tag Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-brand-success-vibrant h-[18px] flex items-center justify-center gap-[6px] z-10">
                  <img loading="lazy" decoding="async" src={ASSETS.VERIFIED} alt="V" className="w-[12px] h-[12px]" />
                  <span className="text-white text-[10px] font-medium font-satoshi">Verified</span>
                </div>
              </div>
              {/* Rider Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      className={`text-[15px] font-bold font-satoshi leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      Hi, I’m {riderName || order?.rider?.full_name || 'Partner'},<br />
                      your delivery partner
                    </p>
                  </div>
                  <button className="absolute top-[9px] right-[9px] w-[31px] h-[31px] flex items-center justify-center active:scale-95 transition-transform z-20">
                    <img loading="lazy" decoding="async"                       src={ASSETS.CALL}
                      alt="Call"
                      className="w-full h-full"
                      style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
                    />
                  </button>
                </div>
                <button
                  onClick={() =>
                    navigate(ROUTES.VIEW_RIDER_KYC.replace(':orderId', order.id), {
                      state: { order },
                    })
                  }
                  className="mt-2 rounded-full text-white text-[14px] font-medium font-satoshi tracking-wider flex items-center justify-center active:scale-95 transition-transform"
                  style={{
                    width: '248px',
                    height: '36px',
                    backgroundColor: '#1CB956',
                  }}
                >
                  View KYC
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p
                className={`text-[16px] font-bold font-satoshi leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Hi, please wait while we connect your order to a nearby rider.
              </p>
            </div>
          )}
          <p
            className={`text-[14px] font-normal font-satoshi leading-snug mb-1 ${isDarkMode ? 'text-white/50' : 'text-brand-text-muted'}`}
          >
            {order?.rider_id
              ? 'Your delivery partner is KYC Verified. Please check the KYC details while accepting the order.'
              : 'Average assignment time: < 2 mins'}
          </p>
          <div
            className={`h-[1px] w-full mb-2.5 ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`}
          />
          {/* OTP Section */}
          <div>
            <p
              className={`text-[15px] font-bold font-satoshi mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Please provide this OTP to confirm the delivery
            </p>
            {order?.status === 'picked_up' && (
              <p className="text-brand-primary text-[12px] font-medium mb-2">
                Share this OTP with your rider only at the time of delivery
              </p>
            )}
            <div className="w-full flex justify-center mb-3">
              <div className="flex gap-2">
                {(order?.otp_code || '000000').split('').map((digit, index) => (
                  <div
                    key={`otp-${index}`}
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
          </div>
          {/* OTP Status Row */}
          <div className="flex items-center w-full mt-[12px]">
            <div className="flex items-center gap-3">
              <img loading="lazy" decoding="async"                 src={isOtpVerified ? ASSETS.VERIFIED_CIRCLE : ASSETS.AWAITING}
                alt="Status"
                className="w-[20px] h-[20px]"
              />
              <span
                className={`text-[12px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {isOtpVerified ? 'OTP Verified' : 'Awaiting OTP verification'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Need Help CTA - Positioned exactly 15px below the 3rd card in a natural flex column flow */}
      <div className="px-5 mt-[15px] pb-4 safe-bottom shrink-0 relative z-0">
        <Button
          onClick={() => navigate(ROUTES.HELP_REPORT, { state: { order } })}
          variant={isDarkMode ? 'glass' : 'default'}
          className={cn(
            'w-full h-[48px] shadow-xl transition-all',
            !isDarkMode && 'bg-black hover:bg-black/90 text-white rounded-full'
          )}
          style={isDarkMode ? ({ '--glass-specular-intensity': '0.2' } as React.CSSProperties) : {}}
        >
          <span
            className={cn(
              'font-medium text-[16px]',
              isDarkMode ? 'text-white dark:text-foreground' : 'text-white'
            )}
          >
            Need Help?
          </span>
        </Button>
      </div>
    </div>
  );
};
export default OrderTracking;
