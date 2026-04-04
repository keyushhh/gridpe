import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { OpenLocationCode } from "open-location-code";
import { fetchRecentOrders, fetchActiveOrders, Order } from "@/lib/orders";
import { supabase, USER_ID } from "@/lib/supabase";
import { useAsset } from "@/hooks/useAsset";
import addIcon from "@/assets/add-icon.svg";
import currencyIcon from "@/assets/currency.svg";
import useEmblaCarousel from 'embla-carousel-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import bannerImage from "@/assets/banner-image.png";
import avatarImg from "@/assets/avatar.png";
import currentLocationIcon from "@/assets/current-location.svg";
import deliveryRiderIcon from "@/assets/delivery-rider.svg";
import successIcon from "@/assets/success.svg";
import failedIcon from "@/assets/failed.svg";
import processingIcon from "@/assets/processing.svg";
import BottomNavigation from "@/components/BottomNavigation";
import AddressSelectionSheet from "@/components/AddressSelectionSheet";
import OrderDetailsSheet from "@/components/OrderDetailsSheet";
import { useUser } from "@/contexts/UserContext";
import { cancelOrder } from "@/lib/orders";
import { useTheme } from "next-themes";
import NotAvailable from "./NotAvailable";

// Tag Icons
import homeIcon from "@/assets/HomeTag.svg";
import workIcon from "@/assets/Work.svg";
import friendsIcon from "@/assets/Friends Family.svg";
import otherIcon from "@/assets/Other.svg";
import walletDarkIcon from "@/assets/wallet-dark.svg";

const currencySymbols: Record<string, string> = {
  AUD: '$', BRL: 'R$', CAD: '$', CHF: 'Fr', CNY: '¥', CZK: 'Kč', DKK: 'kr', EUR: '€',
  GBP: '£', HKD: '$', HUF: 'Ft', IDR: 'Rp', ILS: '₪', INR: '₹', ISK: 'kr', JPY: '¥',
  KRW: '₩', MXN: '$', MYR: 'RM', NOK: 'kr', NZD: '$', PHP: '₱', PLN: 'zł', RON: 'lei',
  SEK: 'kr', SGD: '$', THB: '฿', TRY: '₺', USD: '$', ZAR: 'R'
};

interface SavedAddress {
  tag: string;
  house: string;
  area: string;
  landmark?: string;
  name: string;
  phone: string;
  displayAddress: string;
  city: string;
  state: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

const Homepage = () => {
  const navigate = useNavigate();
  const mainBg = useAsset("main-bg");
  const iconWallet = useAsset("icon-wallet");
  const iconFxConvert = useAsset("icon-fx");
  const iconOrderCash = useAsset("icon-order-cash");
  const iconAddMoney = useAsset("icon-add-money");
  const iconGift = useAsset("icon-gift");
  const orderCashBg = useAsset("order-cash-bg");
  const circleButtonBg = useAsset("circle-button-bg");
  const bannerBg = useAsset("banner-bg");
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const [showBalance, setShowBalance] = useState(false);
  const { walletBalance, walletTier, isPassportVerified, profileImage, name, scheduledDowngrade } = useUser();
  const [balanceAlert, setBalanceAlert] = useState<{ days: number; excess: number; targetTier: string } | null>(null);

  useEffect(() => {
    if (scheduledDowngrade && walletBalance > 0) {
      const tierLimits: Record<string, number> = {
        'Starter': 5000,
        'Pro': 15000,
        'Elite': 50000,
        'Supreme': 150000
      };

      const limit = tierLimits[scheduledDowngrade.tier] || 0;

      if (walletBalance > limit) {
        const excess = walletBalance - limit;
        const targetDate = new Date(scheduledDowngrade.effectiveDate);
        const diffTime = targetDate.getTime() - new Date().getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        setBalanceAlert({
          days: diffDays,
          excess: excess,
          targetTier: scheduledDowngrade.tier
        });
      } else {
        setBalanceAlert(null);
      }
    } else {
      setBalanceAlert(null);
    }
  }, [scheduledDowngrade, walletBalance]);

  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<Order[]>([]);
  const [isRiderAssigned, setIsRiderAssigned] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedOrderForSheet, setSelectedOrderForSheet] = useState<Order | null>(null);
  const [hasSavedAddresses, setHasSavedAddresses] = useState<boolean>(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // FX Live Data states
  const [fxRate, setFxRate] = useState<number>(90.61);
  const [fxHistory, setFxHistory] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("16 Feb, 6:15 AM UTC");
  const [isLoadingFx, setIsLoadingFx] = useState<boolean>(true);

  // Service Availability State
  const [isUnserviceable, setIsUnserviceable] = useState<boolean>(false);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Fetch Live FX Data
  useEffect(() => {
    const fetchFxData = async (from = "USD", to = "INR", date?: string) => {
      try {
        setIsLoadingFx(true);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const params = new URLSearchParams({ from, to });
        if (date) params.set("date", date);

        const res = await fetch(
          `${supabaseUrl}/functions/v1/fx-rates?${params.toString()}`,
          {
            headers: {
              apikey: supabaseAnonKey,
            },
          }
        );

        if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
        const data = await res.json();

        if (data.rates && data.rates.INR) {
          setFxRate(data.rates.INR);
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
          };
          setLastUpdated(now.toLocaleString('en-GB', options).replace(',', ''));
        }
      } catch (error) {
        console.error("Failed to fetch FX data from Edge Function, using fallback:", error);
        // Fallback to hardcoded rate of 83.45 as requested so the UI never breaks
        setFxRate(83.45);
        setLastUpdated("Fallback Live Rate");
      } finally {
        setIsLoadingFx(false);
      }
    };

    fetchFxData();
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    skipSnaps: false
  });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setActiveBannerIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Map State
  const [viewState, setViewState] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 13
  });

  useEffect(() => {
    const loadData = async () => {
      const addressStr = localStorage.getItem("gridpe_user_address");
      if (addressStr) {
        try {
          setSavedAddress(JSON.parse(addressStr));
        } catch (e) {
          console.error("Failed to parse saved address", e);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { count, error: addrError } = await supabase
            .from('addresses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);

          if (!addrError) {
            setHasSavedAddresses((count || 0) > 0);
          }

          const activeOrders = await fetchActiveOrders(session.user.id);
          const filteredActive = activeOrders.filter(o => !['delivered', 'success'].includes(o.status.toLowerCase()));
          setActiveOrder(filteredActive.length > 0 ? filteredActive[0] : null);

          const recent = await fetchRecentOrders(session.user.id);
          setTransactionHistory(recent);
        } catch (e) {
          console.error("Failed to fetch data", e);
        }
      }
    };

    loadData();

    let channel: any;

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        channel = supabase
          .channel('homepage-order-sync')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${session.user.id}`
            },
            (payload) => {
              console.log('Homepage order real-time update:', payload);
              loadData();
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
  }, []);

  // Simulate Rider Assignment
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'processing') {
      const timer = setTimeout(() => {
        setIsRiderAssigned(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeOrder]);

  // Update map viewState when active order address changes
  useEffect(() => {
    if (activeOrder?.addresses?.plus_code) {
      try {
        const olc = new OpenLocationCode() as any;
        const decoded = olc.decode(activeOrder.addresses.plus_code);
        setViewState({
          latitude: decoded.latitudeCenter,
          longitude: decoded.longitudeCenter,
          zoom: 14
        });
      } catch (e) {
        console.error("Failed to decode Plus Code", e);
      }
    } else if (activeOrder?.addresses?.latitude && activeOrder?.addresses?.longitude) {
      setViewState({
        latitude: activeOrder.addresses.latitude,
        longitude: activeOrder.addresses.longitude,
        zoom: 14
      });
    }
  }, [activeOrder]);

  // Proactive Service Availability Check
  useEffect(() => {
    const checkAvailability = async () => {
      if (!savedAddress?.latitude || !savedAddress?.longitude) {
        setIsUnserviceable(false);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        const { data, error } = await supabase.rpc('check_service_availability', {
          p_lat: Number(savedAddress.latitude) || 0,
          p_lng: Number(savedAddress.longitude) || 0
        });

        if (error) {
          console.error("RPC Error checking availability:", error);
          setIsUnserviceable(true);
        } else {
          setIsUnserviceable(!data);
          setCurrentZoneId(data);
        }
      } catch (err) {
        console.error("Failed to check service availability:", err);
        setIsUnserviceable(false);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [savedAddress]);

  const handleAddressSelect = (address: any | null) => {
    setSavedAddress(address);
    if (address) {
      setIsAddressSheetOpen(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId, 'User Request', 'Cancelled from homepage');
      setIsSheetOpen(false);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const activeOrders = await fetchActiveOrders(session.user.id);
        setActiveOrder(activeOrders.length > 0 ? activeOrders[0] : null);
        const recent = await fetchRecentOrders(session.user.id);
        setTransactionHistory(recent);
      }
    } catch (e) {
      console.error("Failed to cancel order", e);
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case "Home": return homeIcon;
      case "Work": return workIcon;
      case "Friends & Family": return friendsIcon;
      case "Other": return otherIcon;
      default: return homeIcon;
    }
  };

  const getAddressDisplay = () => {
    if (!savedAddress) return "Add Address";
    const parts = [savedAddress.house, savedAddress.area];
    return parts.filter(Boolean).join(", ");
  };

  const getActiveOrderAddressDisplay = () => {
    if (!activeOrder?.addresses) return "Unknown Location";
    const parts = [activeOrder.addresses.apartment, activeOrder.addresses.area];
    const fullString = parts.filter(Boolean).join(", ");
    return fullString.length > 20 ? fullString.substring(0, 20) + "..." : fullString;
  };

  const getActiveOrderBannerContent = () => {
    if (!activeOrder) return { title: "", sub: "" };
    switch (activeOrder.status.toLowerCase()) {
      case 'pending':
        return {
          title: <>We’re assigning a delivery<br />partner soon!</>,
          sub: "Assigning a delivery partner in the next 2 minutes."
        };
      case 'accepted':
        const riderName = (activeOrder as any).rider?.full_name || "Rider";
        return {
          title: <>Rider is on the way to pickup!</>,
          sub: `${riderName} is heading to the store.`
        };
      case 'processing':
        return isRiderAssigned ? {
          title: <>Rider Assigned</>,
          sub: "Your delivery partner is on the way to the store."
        } : {
          title: <>We’re assigning a delivery<br />partner soon!</>,
          sub: "Assigning a delivery partner in the next 2 minutes."
        };
      case 'out_for_delivery':
      case 'picked_up':
        return {
          title: <>Partner is on the way!</>,
          sub: "Your delivery partner has picked up your order."
        };
      case 'arrived':
        return {
          title: <>Partner has arrived!</>,
          sub: "Please meet your delivery partner at the door."
        };
      default:
        return {
          title: <>We’re assigning a delivery<br />partner soon!</>,
          sub: "Assigning a delivery partner in the next 2 minutes."
        };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'processing':
      case 'out_for_delivery':
      case 'arrived':
        return { text: 'Ongoing', color: '#FACC15' };
      case 'delivered':
      case 'success':
        return { text: 'Completed', color: '#16B751' };
      case 'cancelled':
      case 'failed':
      case 'rejected':
        return { text: 'Rejected', color: '#FF3B30' };
      default:
        return { text: status, color: '#FACC15' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
      case 'out_for_delivery':
      case 'arrived':
        return processingIcon;
      case 'delivered':
      case 'success':
        return successIcon;
      case 'cancelled':
      case 'failed':
      case 'rejected':
        return failedIcon;
      default:
        return processingIcon;
    }
  };

  const hasValidCoords = Boolean(activeOrder?.addresses?.latitude && activeOrder?.addresses?.longitude);
  const mapCenterLat = Number(activeOrder?.addresses?.latitude || 12.9716);
  const mapCenterLng = Number(activeOrder?.addresses?.longitude || 77.5946);

  const routeGeoJson = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [mapCenterLng, mapCenterLat],
        [mapCenterLng + 0.002, mapCenterLat + 0.002],
      ],
    },
  };

  const routeLayer: any = {
    id: "route-line",
    type: "line",
    paint: {
      "line-color": "#5260FE",
      "line-width": 2,
      "line-dasharray": [2, 1],
    },
  };

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden bg-[#0a0a12]"
      style={{
        backgroundImage: `url(${mainBg})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex-1 w-full overflow-y-auto touch-pan-y scrollbar-hide flex flex-col">
        {/* Header Fixed Area (Top Section always visible) */}
        <div className="shrink-0 flex flex-col safe-area-top z-50 relative pointer-events-none">
          {/* Header Content Container (Individual interactive elements have pointer-events-auto) */}
          <div className="px-5 pt-12 flex items-start justify-between relative pointer-events-auto z-50">
            <div className="space-y-1 max-w-[70%]">
              {savedAddress ? (
                <div className="flex items-center gap-1">
                  <img
                    src={getTagIcon(savedAddress.tag)}
                    alt={savedAddress.tag}
                    className="w-3 h-3"
                    style={{ filter: 'invert(36%) sepia(80%) saturate(6000%) hue-rotate(230deg) brightness(95%) contrast(100%)' }}
                  />
                  <p className="text-[14px] font-bold text-foreground font-satoshi tracking-wider uppercase">
                    {savedAddress.tag}
                  </p>
                </div>
              ) : (
                <p className="text-[12px] text-black dark:text-muted-foreground font-medium tracking-wider uppercase">
                  {name ? `HI, ${name.split(' ')[0]}` : 'DELIVERING'}
                </p>
              )}

              <button
                onClick={() => {
                  if (hasSavedAddresses) {
                    setIsAddressSheetOpen(true);
                  } else {
                    navigate('/add-address');
                  }
                }}
                className="flex items-center gap-1 text-foreground text-[14px] font-normal w-full"
              >
                <span className="truncate block text-black dark:text-foreground">
                  {getAddressDisplay()}
                </span>
                <ChevronDown className="w-4 h-4 shrink-0 text-black dark:text-foreground" />
              </button>
            </div>
            <button onClick={() => navigate('/settings')}>
              <img src={profileImage || avatarImg} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
            </button>
          </div>

          {/* Address Selection Sheet */}
          <div className="pointer-events-auto">
            <AddressSelectionSheet
              isOpen={isAddressSheetOpen}
              onClose={() => setIsAddressSheetOpen(false)}
              onAddressSelect={handleAddressSelect}
              onModalStateChange={setIsAddressModalOpen}
            />
          </div>
        </div>

        {/* Blocking UI (Absolute Overlay when unserviceable) */}
        {isUnserviceable && (
          <div className="absolute inset-x-0 bottom-0 top-0 z-20 flex flex-col pointer-events-none">
            <NotAvailable onOpenAddressSheet={() => {
              if (hasSavedAddresses) {
                setIsAddressSheetOpen(true);
              } else {
                navigate('/add-address');
              }
            }} />
          </div>
        )}

        {/* Conditional Content: Main Homepage Content */}
        {!isUnserviceable && (
          <>

            <div className="flex flex-col items-center mt-8 space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-black dark:text-muted-foreground text-[14px]">Available Balance</p>
                <button onClick={() => setShowBalance(!showBalance)} className="p-1">
                  {showBalance ? <Eye className="w-5 h-5 text-black dark:text-muted-foreground" /> : <EyeOff className="w-5 h-5 text-black dark:text-muted-foreground" />}
                </button>
              </div>
              <p className="text-foreground text-[32px] font-normal">
                ₹{showBalance ? walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "******"}
              </p>
              <button
                onClick={() => navigate('/order-cash')}
                className="flex items-center justify-center gap-2 px-6 py-3 text-foreground text-[14px] font-medium h-12 w-[180px] bg-black dark:bg-transparent rounded-full dark:rounded-none"
                style={{
                  backgroundImage: orderCashBg ? `url(${orderCashBg})` : 'none',
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <img src={iconOrderCash} alt="Order Cash" className="w-6 h-6" />
                <span className="text-white dark:text-foreground">Order Cash</span>
              </button>
            </div>

            {/* Balance Alert Banner */}
            {balanceAlert && (
              <div className="mx-5 mt-6 p-4 rounded-[13px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 rounded-full bg-[#FF3B30]/20 flex items-center justify-center shrink-0">
                  <img src={failedIcon} alt="Alert" className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[#FF4248] text-[14px] font-bold font-satoshi leading-tight">
                    Balance Alert
                  </p>
                  <p className="text-[#FF4248]/80 text-[12px] font-medium font-satoshi mt-1 leading-tight">
                    You have {balanceAlert.days} days to use ₹{Math.floor(balanceAlert.excess).toLocaleString('en-IN')} before it expires due to {balanceAlert.targetTier} limit.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex justify-center gap-6 mt-8 px-5">
              <button
                onClick={() => navigate('/wallet-add-money')}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`flex items-center justify-center w-[52px] h-[52px] ${circleButtonBg ? 'bg-cover' : 'rounded-full'}`}
                  style={{
                    backgroundImage: circleButtonBg ? `url(${circleButtonBg})` : 'none',
                    backgroundColor: circleButtonBg ? 'transparent' : 'rgba(82, 96, 254, 0.13)',
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <img src={iconAddMoney} alt="Add" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-foreground text-[12px] font-medium font-satoshi">Add Money</span>
              </button>

              {[{
                icon: isDarkMode ? walletDarkIcon : iconWallet,
                label: "Wallet",
                action: () => navigate('/wallet')
              }, {
                icon: iconFxConvert,
                label: "FX Convert",
                action: () => {
                  if (walletTier === 'Starter') {
                    navigate('/fx-intro');
                  } else if (!isPassportVerified) {
                    navigate('/fx-passport-gate');
                  } else {
                    navigate('/fx-exchange');
                  }
                }
              }].map(action => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`flex items-center justify-center w-[52px] h-[52px] ${circleButtonBg ? 'bg-cover' : 'rounded-full'}`}
                    style={{
                      backgroundImage: circleButtonBg ? `url(${circleButtonBg})` : 'none',
                      backgroundColor: circleButtonBg ? 'transparent' : 'rgba(82, 96, 254, 0.13)',
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    <img src={action.icon} alt={action.label} className="w-[22px] h-[22px]" />
                  </div>
                  <span className="text-foreground text-[12px] font-medium font-satoshi">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Active Order OR Referral Banner */}
             {activeOrder ? (
               <div className="mx-5 mt-6 mb-[16px] flex flex-col gap-0 animate-in fade-in slide-in-from-top-4 duration-500">
                 {/* Header: Delivering To */}
                 <div className="bg-black py-[10px] px-[16px] rounded-t-[13px] flex justify-between items-center z-10">
                   <p className="text-white text-[12px] font-medium font-satoshi tracking-wider">
                     Delivering to - {activeOrder.addresses?.label || "Home"}
                   </p>
                   <p className="text-white/70 text-[11px] font-medium font-satoshi truncate ml-4">
                     {getActiveOrderAddressDisplay()}
                   </p>
                 </div>

                 {/* Body: Order Details & Map */}
                 <div
                   className={`p-[16px] flex items-center justify-between rounded-b-[13px] border-x border-b ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-[#E9EAEB]'} cursor-pointer active:scale-[0.99] transition-all`}
                   onClick={() => navigate(`/order-tracking`, { state: { order: activeOrder } })}
                 >
                   <div className="flex-1 pr-4">
                     <h4 className={`text-[15px] font-bold font-satoshi leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                       {getActiveOrderBannerContent().title}
                     </h4>
                     <p className={`text-[12px] font-medium font-satoshi leading-snug ${isDarkMode ? 'text-white/50' : 'text-[#7E7E7E]'}`}>
                       {getActiveOrderBannerContent().sub}
                     </p>
                   </div>

                   {/* Map Preview */}
                   <div 
                     className="shrink-0 w-[96px] h-[64px] rounded-[8px] overflow-hidden relative border border-black/5"
                     style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0' }}
                   >
                     <Map
                       initialViewState={{
                         latitude: mapCenterLat,
                         longitude: mapCenterLng,
                         zoom: 14,
                       }}
                       style={{ width: '100%', height: '100%' }}
                       mapStyle={isDarkMode ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"}
                       attributionControl={false}
                       interactive={false}
                     >
                       <Marker latitude={mapCenterLat} longitude={mapCenterLng}>
                         <div className="animate-pulse">
                           <img src={currentLocationIcon} alt="User" className="w-4 h-4" />
                         </div>
                       </Marker>

                       {activeOrder?.status?.toLowerCase() === 'processing' && isRiderAssigned && (
                         <Marker
                           latitude={mapCenterLat + 0.002}
                           longitude={mapCenterLng + 0.002}
                         >
                           <img src={deliveryRiderIcon} alt="Rider" className="w-5 h-5" />
                         </Marker>
                       )}
                     </Map>
                   </div>
                 </div>
               </div>
             ) : (
              <div className="mx-5 mt-6">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-3">
                    <div className="flex-[0_0_100%] min-w-0 pr-0">
                      <div className="rounded-[16px] overflow-hidden flex bg-white dark:bg-black border-[#E9EAEB] dark:border-transparent border relative" style={{
                        backgroundImage: (isDarkMode && bannerBg) ? `url(${bannerBg})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        height: '104px',
                        width: '100%'
                      }}>
                        <div className="flex-1 flex flex-col justify-start relative z-10 pt-[14px] pl-[14px]">
                          <div className="mb-[4px]">
                            <img src={iconGift} alt="Gift" className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-black dark:text-white text-[16px] font-bold font-satoshi mb-[7px] leading-none">Refer & Earn!</h3>
                            <p className="text-black/80 dark:text-[#A1A1AA] text-[12px] font-normal font-satoshi leading-none">Earn ₹50 on each referral</p>
                          </div>
                        </div>
                        <img
                          src={bannerImage}
                          alt="Referral"
                          className="w-[188px] h-full object-cover rounded-r-[16px] rounded-l-none shrink-0"
                        />
                      </div>
                    </div>

                    <div
                      className="flex-[0_0_100%] min-w-0 pr-0 cursor-pointer active:scale-[0.98] transition-all"
                      onClick={() => {
                        if (walletTier === 'Starter') {
                          navigate('/fx-intro');
                        } else if (!isPassportVerified) {
                          navigate('/fx-passport-gate');
                        } else {
                          navigate('/fx-exchange');
                        }
                      }}
                    >
                      <div
                        className="shrink-0 w-full h-[104px] rounded-[16px] flex relative overflow-hidden bg-white dark:bg-black border-[#E9EAEB] dark:border-transparent border"
                        style={{
                          backgroundImage: (isDarkMode && bannerBg) ? `url(${bannerBg})` : 'none',
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="flex-1 flex flex-col justify-between relative z-10 p-5">
                          <div className="flex items-center gap-2">
                            <img src={currencyIcon} alt="Currency" className="w-6 h-6" />
                            <span className="text-black dark:text-white font-regular text-[10px] font-satoshi whitespace-nowrap dark:opacity-80">
                              {lastUpdated}
                            </span>
                          </div>
                          <div className="mb-0">
                            <h3 className="text-black dark:text-white text-[16px] font-bold font-satoshi leading-tight">
                              1 USD = {fxRate.toFixed(2)} INR
                            </h3>
                          </div>
                          <p className="text-black/60 dark:text-white/60 text-[10px] font-satoshi font-normal">
                            Tap to convert & withdraw
                          </p>
                        </div>

                        <div className="w-[160px] h-full relative p-0 overflow-hidden">
                          {fxHistory.length > 0 && (
                            <div className="absolute left-[30px] right-4 top-[18px] h-[64px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={fxHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#16B751" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#16B751" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <Area
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#16B751"
                                    strokeWidth={1.5}
                                    fillOpacity={1}
                                    fill="url(#colorRate)"
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                  />
                                  <XAxis dataKey="date" hide />
                                  <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          <div className="absolute top-[16px] left-2 right-4 h-[64px] pointer-events-none">
                            {[0.4, 0.2, 0, -0.2, -0.4].map((offset, i) => (
                              <div key={i} className="absolute w-full flex items-center" style={{ top: `${i * 16 - 8}px`, height: '16px' }}>
                                <span className="text-[5px] text-black/50 dark:text-white/40 font-satoshi font-medium tabular-nums w-[22px] leading-none">
                                  {(fxRate + offset).toFixed(1)}
                                </span>
                                <div className="flex-1 h-[0.1px] bg-black/10 dark:bg-white/10 ml-1" />
                              </div>
                            ))}
                          </div>

                          <div className="absolute top-[16px] left-[35px] right-4 h-[64px] pointer-events-none">
                            <div className="absolute left-[25%] top-[64px] w-[0.2px] h-[3px] bg-black/20 dark:bg-white/20" />
                            <div className="absolute left-[75%] top-[64px] w-[0.2px] h-[3px] bg-black/20 dark:bg-white/20" />
                            <div className="absolute top-[66px] left-0 right-0 h-[10px] pointer-events-none">
                              <span className="absolute left-[25%] -translate-x-1/2 text-[5px] text-black/50 dark:text-white/30 font-satoshi font-medium uppercase min-w-[40px] text-center">
                                {fxHistory.length > 5 ? fxHistory[Math.floor(fxHistory.length * 0.2)].date : '28 Jul'}
                              </span>
                              <span className="absolute left-[75%] -translate-x-1/2 text-[5px] text-black/50 dark:text-white/30 font-satoshi font-medium uppercase min-w-[40px] text-center">
                                {fxHistory.length > 0 ? fxHistory[fxHistory.length - 1].date : '8 Aug'}
                              </span>
                            </div>
                          </div>

                          <div className="absolute top-[35%] right-[18px] w-[8px] h-[8px] rounded-full bg-[#16B751]" style={{ boxShadow: '0 0 12px #16B751' }} />
                          <div className="absolute top-[16px] bottom-[26px] right-[21.5px] w-[1px] bg-[#16B751]/40" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full transition-colors ${activeBannerIndex === 0 ? 'bg-[#5260FE]' : 'bg-[#4B53AF]/18 dark:bg-muted'}`} />
                  <div className={`w-2 h-2 rounded-full transition-colors ${activeBannerIndex === 1 ? 'bg-[#5260FE]' : 'bg-[#4B53AF]/18 dark:bg-muted'}`} />
                </div>
              </div>
            )}

            <div className="flex flex-col w-full">
              <div className="mx-5 mt-6 shrink-0 flex items-center justify-between mb-4">
                <h3 className="text-foreground text-[16px] font-medium">Recent Transactions</h3>
                <button
                  onClick={() => navigate('/order-history')}
                  disabled={transactionHistory.length === 0 && !activeOrder}
                  className={`text-[#5260FE] text-[14px] transition-colors ${transactionHistory.length === 0 && !activeOrder
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:text-primary/80 cursor-pointer'
                    }`}
                >
                  View All
                </button>
              </div>

              <div className="mx-5 pb-[160px]">
                <div className="border-t border-black/6 dark:border-white/10 pt-[14px] min-h-[100px]">
                  {transactionHistory.length > 0 ? (
                    <div className="w-full">
                      <div className="grid grid-cols-[1fr_100px_80px] gap-x-6 mb-[12px] px-0">
                        <div><span className="text-[#7E7E7E] text-[12px] font-normal font-sans">Details</span></div>
                        <div className="text-right"><span className="text-[#7E7E7E] text-[12px] font-normal font-sans">Price</span></div>
                        <div className="text-right"><span className="text-[#7E7E7E] text-[12px] font-normal font-sans">Status</span></div>
                      </div>

                      <div className="flex flex-col gap-[16px]">
                        {transactionHistory.map((tx) => (
                          <div
                            key={tx.id}
                            className="grid grid-cols-[1fr_100px_80px] gap-x-6 items-start cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              const s = tx.status.toLowerCase();
                              const isCompleted = s === 'success' || s === 'delivered';
                              const isFailedOrCancelled = s === 'failed' || s === 'cancelled';

                              if (isCompleted || isFailedOrCancelled) {
                                setSelectedOrderForSheet(tx);
                                setIsSheetOpen(true);
                              } else {
                                navigate(`/order-details/${tx.id}`, { state: { order: tx } });
                              }
                            }}
                          >
                            <div className="flex items-start">
                              <img src={getStatusIcon(tx.status)} alt="Status" className="w-[26px] h-[26px]" />
                              <div className="ml-[7px] flex flex-col">
                                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[13px] font-normal font-sans leading-none mb-[2px]`}>
                                  {tx.metadata?.isFx ? "FX Exchange" : (tx.metadata?.item_value ? `Ordered ₹${tx.metadata.item_value} Cash` : (tx.addresses?.label ? `Order to ${tx.addresses.label}` : "Cash Order"))}
                                </span>
                                <span className="text-[#7E7E7E] text-[12px] font-normal font-sans leading-none">
                                  {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[13px] font-normal font-sans`}>
                                {tx.metadata?.isFx
                                  ? `${currencySymbols[tx.metadata.toCurrency as string] || ''}${Number(tx.metadata.receiveAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : `₹${(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                }
                              </span>
                            </div>

                            <div className="text-right">
                              <span
                                className="text-[13px] font-normal font-sans capitalize"
                                style={{ color: getStatusInfo(tx.status).color }}
                              >
                                {getStatusInfo(tx.status).text}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-[14px] text-center">Your recent transactions will show up here</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNavigation activeTab="home" isHidden={isAddressModalOpen || isAddressSheetOpen} />

      <OrderDetailsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        order={selectedOrderForSheet}
        onCancel={handleCancelOrder}
      />
    </div>
  );
};

export default Homepage;
