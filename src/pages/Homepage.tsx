import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { OpenLocationCode } from "open-location-code";
import { fetchRecentOrders, fetchActiveOrders, Order } from "@/lib/orders";
import { supabase } from "@/lib/supabase";
import { useAsset } from "@/hooks/useAsset";
import addIcon from "@/assets/add-icon.svg";
// import iconWallet from "@/assets/wallet.svg";
// import iconFxConvert from "@/assets/fx-convert.svg";
import currencyIcon from "@/assets/currency.svg";
// import iconGift from "@/assets/icon-gift.png";
import useEmblaCarousel from 'embla-carousel-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine
} from 'recharts';
// import orderCashBg from "@/assets/order-cash-button-bg.png";
// import iconOrderCash from "@/assets/order-cash.svg";
// import circleButtonBg from "@/assets/circle-button.png";
// import bannerBg from "@/assets/banner-bg-new.png";
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

// Tag Icons
import homeIcon from "@/assets/HomeTag.svg";
import workIcon from "@/assets/Work.svg";
import friendsIcon from "@/assets/Friends Family.svg";
import otherIcon from "@/assets/Other.svg";

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
  const { walletBalance, walletTier, isPassportVerified } = useUser();
  const [showBalance, setShowBalance] = useState(false);
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

  // Fetch Live FX Data
  useEffect(() => {
    const fetchFxData = async () => {
      try {
        setIsLoadingFx(true);
        // Calculate date range for last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Fetch latest rate and history in parallel
        const [latestRes, historyRes] = await Promise.all([
          fetch('https://api.frankfurter.app/latest?from=USD&to=INR'),
          fetch(`https://api.frankfurter.app/${startStr}..?from=USD&to=INR`)
        ]);

        const latestData = await latestRes.json();
        const historyData = await historyRes.json();

        if (latestData.rates && latestData.rates.INR) {
          setFxRate(latestData.rates.INR);

          // Format Last Updated (Simulated based on API date + current time for "Live" feel)
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

        if (historyData.rates) {
          const formattedHistory = Object.entries(historyData.rates).map(([date, rates]: [string, any]) => ({
            date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            rate: rates.INR
          }));
          setFxHistory(formattedHistory);
        }
      } catch (error) {
        console.error("Failed to fetch FX data:", error);
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
      // Load Saved Address from Local Storage (Active Session Context)
      const addressStr = localStorage.getItem("gridpe_user_address");
      if (addressStr) {
        try {
          setSavedAddress(JSON.parse(addressStr));
        } catch (e) {
          console.error("Failed to parse saved address", e);
        }
      }

      // Fetch Orders and Addresses
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          // Check for saved addresses
          const { count, error: addrError } = await supabase
            .from('addresses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);

          if (!addrError) {
            setHasSavedAddresses((count || 0) > 0);
          }

          const activeOrders = await fetchActiveOrders(session.user.id);
          // Homepage only shows one active order banner (the latest one)
          // Double check status to ensure no delivered/success orders sneak in
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

    // Real-time subscription
    let channel: any;

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        channel = supabase
          .channel('homepage-order-sync')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${session.user.id}`
            },
            (payload) => {
              console.log('Homepage real-time update:', payload);
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
      }, 5000); // 5 second delay to show "assigning soon"
      return () => clearTimeout(timer);
    }
  }, [activeOrder]);

  // Update map viewState when active order address changes
  useEffect(() => {
    if (activeOrder?.addresses?.plus_code) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleAddressSelect = (address: any | null) => {
    setSavedAddress(address);
    if (address) {
      setIsAddressSheetOpen(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      setIsSheetOpen(false);
      // Refresh data
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
    // Construct address string: House, Area (Landmark optional but we can stick to house + area)
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
    switch (activeOrder.status) {
      case 'processing':
        return isRiderAssigned ? {
          title: <>Rider Assigned</>,
          sub: "Your delivery partner is on the way to the store."
        } : {
          title: <>We’re assigning a delivery<br />partner soon!</>,
          sub: "Assigning a delivery partner in the next 2 minutes."
        };
      case 'out_for_delivery':
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

  const routeGeoJson = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [viewState.longitude, viewState.latitude],
        [viewState.longitude + 0.002, viewState.latitude + 0.002],
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
      className="absolute inset-0 flex flex-col overflow-y-auto overscroll-y-contain bg-[#0a0a12] scrollbar-hide"
      style={{
        backgroundImage: `url(${mainBg})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Fixed Top Section (Header, Balance, Actions, Banner) */}
      <div className="shrink-0 flex flex-col safe-area-top z-10">

        {/* Header */}
        <div className="px-5 pt-12 flex items-start justify-between">
          <div className="space-y-1 max-w-[70%]">
            {savedAddress ? (
              <div className="flex items-center gap-1">
                <img src={getTagIcon(savedAddress.tag)} alt={savedAddress.tag} className="w-3 h-3" />
                <p className="text-[14px] font-bold text-foreground font-satoshi tracking-wider uppercase">
                  {savedAddress.tag}
                </p>
              </div>
            ) : (
              <p className="text-[12px] text-black dark:text-muted-foreground font-medium tracking-wider">DELIVERING</p>
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
            <img src={avatarImg} alt="Profile" className="w-12 h-12 rounded-full" />
          </button>
        </div>

        {/* Address Selection Sheet */}
        <AddressSelectionSheet
          isOpen={isAddressSheetOpen}
          onClose={() => setIsAddressSheetOpen(false)}
          onAddressSelect={handleAddressSelect}
          onModalStateChange={setIsAddressModalOpen}
        />

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

        {/* Quick Actions */}
        <div className="flex justify-center gap-6 mt-8 px-5">
          {/* Add Money - Custom Circle Button */}
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

          {/* Other Actions */}
          {[{
            icon: iconWallet,
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
          <div className="mx-5 mt-6 mb-[16px] flex flex-col">
            {/* Header Row (Top Container) */}
            <div
              className="w-full px-[16px] py-[9px] flex justify-between items-start z-10 shrink-0 rounded-t-[14px]"
              style={{
                backgroundColor: "#000000",
              }}
            >
              <span className="text-white text-[12px] font-medium font-sans whitespace-nowrap mr-2">
                Delivering to - {activeOrder.addresses?.label || "Home"}
              </span>
              <span className="text-white text-[12px] font-medium font-sans text-right leading-tight">
                {getActiveOrderAddressDisplay()}
              </span>
            </div>

            {/* Status & Map Container (Bottom Container) */}
            <div
              className="w-full rounded-b-[14px] flex cursor-pointer"
              style={{
                backgroundColor: "rgba(25, 25, 25, 0.34)",
                padding: "12px",
                marginTop: 0
              }}
              onClick={() => navigate(`/order-details/${activeOrder.id}`, { state: { order: activeOrder } })}
            >
              {/* Left Text */}
              <div className="flex-1 flex flex-col justify-start pr-2">
                <p className="text-white text-[14px] font-medium font-sans leading-snug mb-[12px]">
                  {getActiveOrderBannerContent().title}
                </p>
                <p className="text-white text-[12px] font-light font-sans leading-snug mb-[4px]">
                  {getActiveOrderBannerContent().sub}
                </p>
              </div>

              {/* Mini Map */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/order-tracking', { state: { order: activeOrder } });
                }}
                className="shrink-0 relative rounded-[8px] overflow-hidden cursor-pointer active:scale-95 transition-transform"
                style={{
                  width: "110px",
                  height: "82px",
                  backgroundColor: "#1A1A1A"
                }}
              >
                <Map
                  {...viewState}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                  attributionControl={false}
                  interactive={false}
                >
                  {/* Dashed Route Line - Only when rider assigned */}
                  {isRiderAssigned && (
                    <Source id="route" type="geojson" data={routeGeoJson}>
                      <Layer {...routeLayer} />
                    </Source>
                  )}

                  {/* Delivery/User Location Marker */}
                  <Marker latitude={viewState.latitude} longitude={viewState.longitude}>
                    <div className="animate-pulse">
                      <img src={currentLocationIcon} alt="User" className="w-4 h-4" />
                    </div>
                  </Marker>

                  {/* Mock Rider Marker (slightly offset) - Only when rider assigned */}
                  {isRiderAssigned && (
                    <Marker
                      latitude={viewState.latitude + 0.002}
                      longitude={viewState.longitude + 0.002}
                    >
                      <img src={deliveryRiderIcon} alt="Rider" className="w-6 h-6" />
                    </Marker>
                  )}
                </Map>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-5 mt-6">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {/* Banner 1: Refer & Earn */}
                <div className="flex-[0_0_100%] min-w-0 pr-0">
                  <div className="rounded-[16px] overflow-hidden flex bg-black dark:bg-transparent relative" style={{
                    backgroundImage: bannerBg ? `url(${bannerBg})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '104px',
                    width: '362px',
                    borderRadius: '16px'
                  }}>
                    <div className="flex-1 flex flex-col justify-start relative z-10 pt-[14px] pl-[14px]">
                      <div className="mb-[4px]">
                        <img src={iconGift} alt="Gift" className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-white text-[16px] font-bold font-satoshi mb-[7px] leading-none">Refer & Earn!</h3>
                        <p className="text-white/80 dark:text-[#A1A1AA] text-[12px] font-normal font-satoshi leading-none">Earn ₹50 on each referral</p>
                      </div>
                    </div>
                    <img
                      src={bannerImage}
                      alt="Referral"
                      className="w-[188px] h-full object-cover rounded-r-2xl rounded-l-none shrink-0"
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
                    className="shrink-0 w-[362px] h-[104px] rounded-[16px] p-5 flex relative overflow-hidden bg-black dark:bg-transparent"
                    style={{
                      backgroundImage: bannerBg ? `url(${bannerBg})` : 'none',
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Left Section */}
                    <div className="flex-1 flex flex-col justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <img src={currencyIcon} alt="Currency" className="w-6 h-6" />
                        <span className="text-white font-regular text-[10px] font-satoshi opacity-80">
                          {lastUpdated}
                        </span>
                      </div>
                      <div className="mb-0">
                        <h3 className="text-white text-[16px] font-bold font-satoshi leading-tight">
                          1 USD = {fxRate.toFixed(2)} INR
                        </h3>
                      </div>
                      <p className="text-white/60 text-[10px] font-satoshi font-normal">
                        Tap to convert & withdraw
                      </p>
                    </div>

                    {/* Right Section: Mini Chart */}
                    <div className="w-[140px] h-full relative p-2 pt-4">
                      {fxHistory.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={fxHistory}>
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
                            <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                            <XAxis
                              dataKey="date"
                              hide
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}

                      {/* Last point marker & line */}
                      <div className="absolute top-[35%] right-[12px] w-[6px] h-[6px] rounded-full bg-[#16B751] shadow-[0_0_8px_#16B751]" />
                      <div className="absolute top-[35%] bottom-[12px] right-[14.5px] w-[1px] bg-[#16B751]/30" />

                      {/* X-Axis subtle labels overlay */}
                      <div className="absolute bottom-1 left-4 right-4 flex justify-between">
                        <span className="text-[7px] text-white/30 font-satoshi">
                          {fxHistory.length > 5 ? fxHistory[Math.floor(fxHistory.length * 0.2)].date : '26 Jan'}
                        </span>
                        <span className="text-[7px] text-white/30 font-satoshi">
                          {fxHistory.length > 0 ? fxHistory[fxHistory.length - 1].date : '6 Feb'}
                        </span>
                      </div>

                      {/* Y-Axis subtle markers (Simulated based on current rate) */}
                      <div className="absolute top-4 left-0 flex flex-col gap-[10px]">
                        <span className="text-[7px] text-white/20">{(fxRate + 0.5).toFixed(1)}</span>
                        <span className="text-[7px] text-white/20">{(fxRate).toFixed(1)}</span>
                        <span className="text-[7px] text-white/20">{(fxRate - 0.5).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-3">
              {/* Dot 1 */}
              <div
                className={`w-2 h-2 rounded-full transition-colors ${activeBannerIndex === 0
                  ? 'bg-[#5260FE]'
                  : 'bg-[#4B53AF]/18 dark:bg-muted'
                  }`}
              />
              {/* Dot 2 */}
              <div
                className={`w-2 h-2 rounded-full transition-colors ${activeBannerIndex === 1
                  ? 'bg-[#5260FE]'
                  : 'bg-[#4B53AF]/18 dark:bg-muted'
                  }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Flexible Transaction Section */}
      <div className="flex flex-col w-full">
        {/* Fixed Title Row */}
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

        {/* Transaction List */}
        <div className="mx-5 pb-[100px]">
          <div className="border-t border-black/6 dark:border-white/10 pt-[14px] min-h-[100px]">
            {transactionHistory.length > 0 ? (
              <div className="w-full">
                {/* Headers */}
                <div className="grid grid-cols-[1fr_100px_80px] gap-x-6 mb-[12px] px-0">
                  <div>
                    <span className="text-[#7E7E7E] text-[12px] font-normal font-sans">
                      Details
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#7E7E7E] text-[12px] font-normal font-sans">
                      Price
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#7E7E7E] text-[12px] font-normal font-sans">
                      Status
                    </span>
                  </div>
                </div>

                {/* Rows */}
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
                      {/* Details Column */}
                      <div className="flex items-start">
                        <img src={getStatusIcon(tx.status)} alt="Status" className="w-[26px] h-[26px]" />
                        <div className="ml-[7px] flex flex-col">
                          <span className="text-white text-[13px] font-normal font-sans leading-none mb-[2px]">
                            {tx.addresses?.label ? `Order to ${tx.addresses.label}` : "Cash Order"}
                          </span>
                          <span className="text-[#7E7E7E] text-[12px] font-normal font-sans leading-none">
                            {new Date(tx.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Price Column */}
                      <div className="text-right">
                        <span className="text-white text-[13px] font-normal font-sans">
                          ₹{(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Status Column */}
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
              <p className="text-muted-foreground text-[14px] text-center">
                Your recent transactions will show up here
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Fixed) */}
      <BottomNavigation activeTab="home" isHidden={isAddressModalOpen} />

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
