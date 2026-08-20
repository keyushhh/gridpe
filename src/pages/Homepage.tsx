import { ASSETS } from '@/constants/assets';
import { crashlytics } from '@/lib/crashlytics';
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { useNavigate, useLocation } from 'react-router-dom';
const Map = React.lazy(() => import('@/components/MapWrapper'));
const Marker = React.lazy(() => import('@/components/MapWrapper').then(m => ({ default: m.Marker })));

import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Mic, Loader2 /*, Eye, EyeOff */ } from 'lucide-react';
import { olc } from '@/utils/olc';
import { fetchRecentOrders, fetchActiveOrders } from '@/lib/orders';
import { Order, SavedAddress } from '@/types';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useAsset } from '@/hooks/useAsset';
import useEmblaCarousel from 'embla-carousel-react';
import BottomNavigation from '@/components/BottomNavigation';
import AddressSelectionSheet from '@/components/AddressSelectionSheet';
import OrderDetailsSheet from '@/components/OrderDetailsSheet';
import RatingSheet from '@/components/RatingSheet';
import VoiceConfirmationSheet from '@/components/VoiceConfirmationSheet';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useUser } from '@/contexts/UserContext';
import { cancelOrder } from '@/lib/orders';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import NotAvailable from './NotAvailable';
import { GpButton } from '@gridpe-app/ui';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
// Tag Icons
import { useWebScroll } from '@/hooks/useWebScroll';
import { isNightTime } from '@/utils/time';
import NightDeliveryState from '@/components/NightDeliveryState';
import { motion, AnimatePresence } from 'framer-motion';
import HomePageSkeleton from '@/components/skeletons/HomePageSkeleton';
import { checkLocationPermission, requestLocationPermission, getCurrentPosition } from '@/utils/geolocation';
import { reverseGeocode, getDistance } from '@/utils/geoUtils';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { 
  getAddress, 
  setAddress, 
  migrateAddressKey, 
  ADDRESS_KEYS 
} from '@/utils/addressStorage';
import LocationDisplay from '@/components/LocationDisplay';
import { useLocationStore } from '@/store/useLocationStore';
import inputContainerImg from '@/assets/input-container.webp';
import infoIcon from '@/assets/info.svg';
import deliveryLimitBg from '@/assets/delivery-limit.webp';
import proBannerImg from '@/assets/pro-banner.webp';
import proIcon from '@/assets/pro-icon.svg';
import arrowUpIcon from '@/assets/arrow-up.svg';


const Homepage = () => {
  useWebScroll();
  const navigate = useNavigate();
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);

  const iconOrderCash = useAsset(ASSETS.ORDER_CASH, ASSETS.CASH_ORDER_ICON);
  const isDarkMode = useIsDarkMode();

  const [showDeliveryLimitsModal, setShowDeliveryLimitsModal] = useState(false);
  const [amount, setAmount] = useState<string>('0.00');
  const [showInlineKeypad, setShowInlineKeypad] = useState<boolean>(false);
  const { showToaster } = useCustomToaster();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceConfirmation, setVoiceConfirmation] = useState<{
    isOpen: boolean;
    amount: number;
    transcript: string;
  } | null>(null);

  const { isRecording, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  const handleMicClick = async () => {
    if (isTranscribing) return;

    if (isRecording) {
      setIsTranscribing(true);
      try {
        const blob = await stopRecording();
        if (!blob) {
          setIsTranscribing(false);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const { data, error } = await supabase.functions.invoke('voice-cash-order', {
              body: {
                audio: base64Audio,
                preferred_language: profile?.preferred_language || 'en',
                mime_type: blob.type || 'audio/webm',
              },
            });

            if (error) {
              throw error;
            }

            if (data?.extractedAmount && typeof data.extractedAmount === 'number') {
              setVoiceConfirmation({
                isOpen: true,
                amount: data.extractedAmount,
                transcript: data.transcript || '',
              });
            } else if (data?.transcript) {
              showToaster(`Heard "${data.transcript}", but couldn't detect amount. Please adjust manually.`, 'error');
            } else {
              showToaster('Could not detect amount from voice. Please try again.', 'error');
            }
          } catch (err) {
            crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Homepage.voiceOrder');
            showToaster('Voice recognition failed. Please try again.', 'error');
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setIsTranscribing(false);
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Homepage.stopRecording');
        showToaster('Recording stopped unexpectedly.', 'error');
      }
    } else {
      const started = await startRecording();
      if (!started) {
        showToaster(recorderError || 'Microphone access denied or unavailable.', 'error');
      }
    }
  };

  const {
    name,
    profile,
    profileImage,
  } = useUser();

  const activeAddress = useLocationStore((state) => state.activeAddress);
  const setActiveAddress = useLocationStore((state) => state.setActiveAddress);
  const userId = profile?.id;
  const walletTier = profile?.plan_tier || 'Starter';
  const tierName = profile?.plan_tier || 'basic';
  const dailyLimit = tierName.toLowerCase() === 'pro' ? 25000 : 5000;
  const monthlyLimit = tierName.toLowerCase() === 'pro' ? 100000 : 25000;

  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);

  // Re-open address sheet when returning from AddAddress via back navigation
  const routeLocation = useLocation();
  useEffect(() => {
    const locationState = routeLocation.state as Record<string, unknown> | null;
    const historyState = window.history.state as Record<string, unknown> | null;
    if (locationState?.fromAddressSheet || historyState?.fromAddressSheet) {
      setIsAddressSheetOpen(true);
      const nextState = { ...(historyState || {}) };
      delete (nextState as Record<string, unknown>).fromAddressSheet;
      window.history.replaceState(nextState, '');
    }
  }, [routeLocation.state]);
  
  const queryClient = useQueryClient();

  // Auto-detect location on mount
  useEffect(() => {
    const autoDetectLocation = async () => {
      try {
        const permission = await checkLocationPermission();
        if (permission.location !== 'granted') return;
        
        const position = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 8000,
        });
        
        const { latitude, longitude } = position.coords;
        
        let currentLat = null;
        let currentLng = null;
        try {
          const parsed = await getAddress<SavedAddress>(ADDRESS_KEYS.SELECTED_ADDRESS, null);
          if (parsed) {
            currentLat = parsed.latitude;
            currentLng = parsed.longitude;
          }
        } catch (err) {
          if (import.meta.env.DEV) console.warn('[Homepage] non-critical error:', err);
        }
        
        if (currentLat && currentLng) {
          const distanceMeters = getDistance(
            currentLat,
            currentLng,
            latitude,
            longitude
          );
          if (distanceMeters <= 500) return;
        }
        
        const result = await reverseGeocode(latitude, longitude);
        if (result) {
          const area =
            result.address?.suburb ||
            result.address?.neighbourhood ||
            result.address?.city ||
            'Current Location';
            
          const fullCode = olc.encode(latitude, longitude);
          const addressToSave: SavedAddress = {
            id: '',
            user_id: userId || '',
            created_at: new Date().toISOString(),
            label: null,
            apartment: null,
            contact_name: null,
            contact_phone: null,
            plus_code: fullCode,
            tag: 'Current Location',
            house: '',
            area: area,
            name: 'You',
            phone: '',
            displayAddress: result.display_name || `${area}, Current Location`,
            city: result.address?.city || '',
            state: result.address?.state || '',
            postcode: result.address?.postcode || '',
            latitude: latitude,
            longitude: longitude,
            plusCode: fullCode,
          };
          
          setSavedAddress(addressToSave);
          try { setActiveAddress?.(addressToSave); } catch { /* intentional */ }
          await setAddress(ADDRESS_KEYS.SELECTED_ADDRESS, addressToSave);
        }
      } catch {
        // Silent fail
      }
    };
    
    autoDetectLocation();
  }, []);

  // Core Data Queries
  const activeOrderQuery = useQuery({
    queryKey: ['active-order', userId],
    queryFn: async () => {
      try {
        const orders = await fetchActiveOrders(userId);
        const filtered = orders.filter(o => {
          const status = o.status.toLowerCase();
          // Exclude terminal statuses
          if (['delivered', 'success', 'cancelled', 'failed', 'rejected'].includes(status)) {
            return false;
          }
          // For 'pending' orders, only show if created within last 2 hours
          // Old pending wallet orders should not block the banner
          if (status === 'pending') {
            const createdAt = new Date(o.created_at);
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            return createdAt > twoHoursAgo;
          }
          return true;
        });
        return filtered.length > 0 ? filtered[0] : null;
      } catch (e) {
        if (import.meta.env.DEV) console.error('activeOrderQuery unexpected error:', e);
        crashlytics.recordError(e instanceof Error ? e : new Error('Homepage activeOrderQuery failed'), 'Homepage.activeOrderQuery');
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 30000,
    placeholderData: keepPreviousData,
    retry: false,
    throwOnError: false,
  });

  const recentOrdersQuery = useQuery({
    queryKey: ['recent-orders', userId],
    queryFn: async () => {
      try {
        return await fetchRecentOrders(userId);
      } catch (e) {
        if (import.meta.env.DEV) console.error('recentOrdersQuery unexpected error:', e);
        crashlytics.recordError(e instanceof Error ? e : new Error('Homepage recentOrdersQuery failed'), 'Homepage.recentOrdersQuery');
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 30000,
    placeholderData: keepPreviousData,
    retry: false,
    throwOnError: false,
  });

  const addressesCountQuery = useQuery({
    queryKey: ['addresses-count', userId],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('addresses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (error) {
          if (import.meta.env.DEV) console.error('addressesCountQuery Supabase error:', error);
          crashlytics.recordError(error instanceof Error ? error : new Error('Homepage addressesCountQuery Supabase error'), 'Homepage.addressesCountQuery');
          return 0;
        }
        return count || 0;
      } catch (e) {
        if (import.meta.env.DEV) console.error('addressesCountQuery unexpected error:', e);
        return 0;
      }
    },
    enabled: !!userId,
    staleTime: 30000,
    placeholderData: keepPreviousData,
    retry: false,
    throwOnError: false,
  });



  const activeOrder = activeOrderQuery.data ?? null;
  const transactionHistory = recentOrdersQuery.data ?? [];

  const { todayCashSum, monthCashSum } = useMemo(() => {
    let todaySum = 0;
    let monthSum = 0;
    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const excludedStatuses = ['cancelled', 'failed', 'rejected'];

    transactionHistory.forEach((tx: Order) => {
      if (excludedStatuses.includes(tx.status)) return;
      
      const txDate = new Date(tx.created_at);
      const amount = Number(tx.amount) || 0;

      if (txDate.toDateString() === todayStr) {
        todaySum += amount;
      }
      
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        monthSum += amount;
      }
    });

    return { todayCashSum: todaySum, monthCashSum: monthSum };
  }, [transactionHistory]);
  const hasSavedAddresses = (addressesCountQuery.data ?? 0) > 0;


  const numericAmount = parseFloat(amount) || 0;
  const isDailyLimitExceeded = todayCashSum + numericAmount > dailyLimit;
  const isMonthlyLimitExceeded = monthCashSum + numericAmount > monthlyLimit;

  const handleKeyPress = (key: string) => {
    setAmount(prev => {
      if (prev === '0.00') {
        return key === '.' ? '0.' : key;
      }
      if (key === '.' && prev.includes('.')) {
        return prev;
      }
      if (prev.includes('.')) {
        const [, decimal] = prev.split('.');
        if (decimal && decimal.length >= 2) {
          return prev;
        }
      }
      return prev + key;
    });
  };

  const handleBackspace = () => {
    setAmount(prev => {
      if (prev.length <= 1) return '0.00';
      if (prev === '0.00') return '0.00';
      return prev.slice(0, -1);
    });
  };

  const handlePillClick = (val: string) => {
    setAmount(val);
  };

  const KeypadButton = ({
    label,
    onClick,
    icon,
  }: {
    label?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`w-[113px] h-[65px] rounded-xl flex items-center justify-center active:bg-brand-primary active:text-white transition-colors group shadow-sm ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      {icon ? (
        <div className="group-active:brightness-200">
          {React.cloneElement(icon as React.ReactElement, {
            style: { filter: isDarkMode ? 'brightness(0) saturate(100%) invert(1)' : 'brightness(0)' },
            className: `${(icon as React.ReactElement).props.className} group-active:filter-none`,
          })}
        </div>
      ) : (
        <span className={`font-bold font-sans text-[32px] group-active:text-white ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {label}
        </span>
      )}
    </button>
  );
  
  // Only show skeleton on INITIAL load (no data at all)
  const isInitialLoading = 
    (activeOrderQuery.isLoading && !activeOrderQuery.data) || 
    (recentOrdersQuery.isLoading && !recentOrdersQuery.data) || 
    (addressesCountQuery.isLoading && !addressesCountQuery.data);
  const [isRiderAssigned, setIsRiderAssigned] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedOrderForSheet] = useState<Order | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [, setActiveBannerIndex] = useState(0);
  const [forceNight, setForceNight] = useState(() => localStorage.getItem('dev_force_night_hours') === 'true');
  const [isNight, setIsNight] = useState(isNightTime());
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    rider_id: string;
    rider_name: string;
    rider_photo: string | null;
  } | null>(null);

  useEffect(() => {
    const handleTestRating = () => {
      setCompletedOrder({
        id: 'dev-test-order-id',
        rider_id: 'dev-test-rider-id',
        rider_name: 'Rohit Khandelwal',
        rider_photo: null,
      });
    };
    const handleNightToggle = () => {
      const forced = localStorage.getItem('dev_force_night_hours') === 'true';
      setForceNight(forced);
      setIsNight(isNightTime());
    };
    window.addEventListener('dev-mode-test-rating', handleTestRating);
    window.addEventListener('dev-force-night-toggle', handleNightToggle);
    return () => {
      window.removeEventListener('dev-mode-test-rating', handleTestRating);
      window.removeEventListener('dev-force-night-toggle', handleNightToggle);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsNight(isNightTime());
    }, 60000);
    return () => clearInterval(timer);
  }, [activeAddress]);
  // FX Live Data states

  // Service Availability State
  const [isUnserviceable, setIsUnserviceable] = useState<boolean>(false);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);


  const displayNightMode = !isUnserviceable && (forceNight || isNight);

  const [, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    skipSnaps: false,
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

  const [showLocationChangedBanner, setShowLocationChangedBanner] = useState(false);

  const handleFirstInstallLocationFlow = async () => {
    try {
      let permission = await checkLocationPermission();
      if (permission.location !== 'granted') {
        permission = await requestLocationPermission();
      }
      
      if (permission.location === 'granted') {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        const fullCode = olc.encode(latitude, longitude);
        
        // Reverse Geocode
        const result = await reverseGeocode(latitude, longitude);
        if (result) {
          const area =
            result.address?.suburb ||
            result.address?.neighbourhood ||
            result.address?.city ||
            'Current Location';
            
          // Check serviceability
          const { data: isServiceableZone, error } = await (supabase as any).rpc('check_service_availability', {
            p_lat: Number(latitude) || 0,
            p_lng: Number(longitude) || 0,
          });
          
          if (error) {
            crashlytics.recordError(new Error(error.message || 'check_service_availability RPC failed'), 'Homepage: First install availability check RPC failed');
            if (import.meta.env.DEV) console.error('Availability check RPC failed:', error);
            crashlytics.recordError(error instanceof Error ? error : new Error('Homepage availability check RPC failed'), 'Homepage.availabilityCheck');
          }
          
          const isServiceable = !!isServiceableZone;
          
          if (isServiceable) {
            const addressToSave: SavedAddress = {
              id: '',
              user_id: userId || '',
              created_at: new Date().toISOString(),
              label: null,
              apartment: null,
              contact_name: null,
              contact_phone: null,
              plus_code: fullCode,
              tag: 'Current Location',
              house: '',
              area: area,
              name: 'You',
              phone: '',
              displayAddress: result.display_name || `${area}, Current Location`,
              city: result.address?.city || '',
              state: result.address?.state || '',
              postcode: result.address?.postcode || '',
              latitude: latitude,
              longitude: longitude,
              plusCode: fullCode,
            };
            
            // Set as current location on Home screen
            setSavedAddress(addressToSave);
            try { setActiveAddress?.(addressToSave); } catch { /* intentional */ }
            await setAddress(ADDRESS_KEYS.SELECTED_ADDRESS, addressToSave);
            
            // Prompt user to confirm or add a saved address
            setIsAddressSheetOpen(true);
          } else {
            // If not serviceable → show the not-serviceable screen immediately
            setIsUnserviceable(true);
          }
        } else {
          // Fallback to manual entry if reverse geocoding fails
          setIsAddressSheetOpen(true);
        }
      } else {
        // If permission denied → show the address picker so user can manually enter location
        setIsAddressSheetOpen(true);
      }
    } catch (e) {
      crashlytics.recordError(e instanceof Error ? e : new Error(String(e)), 'Homepage: Error in first install location flow');
      if (import.meta.env.DEV) console.error('Error in first install location flow:', e);
      crashlytics.recordError(e instanceof Error ? e : new Error('Homepage first install location flow failed'), 'Homepage.firstInstallLocation');
      // Fallback
      setIsAddressSheetOpen(true);
    }
  };

  // Sync savedAddress with activeAddress from context when it updates
  useEffect(() => {
    if (activeAddress) {
      setSavedAddress(activeAddress);
    }
  }, [activeAddress]);

  // Initial Load (LocalStorage / Context Sync)
  useEffect(() => {
    const loadAddress = async () => {
      // Run Migrations first
      await migrateAddressKey(ADDRESS_KEYS.SELECTED_ADDRESS);
      await migrateAddressKey(ADDRESS_KEYS.USER_ADDRESS);

      const parsed = await getAddress<SavedAddress | null>(ADDRESS_KEYS.SELECTED_ADDRESS, null);
      if (parsed) {
        setSavedAddress(parsed);
        try { setActiveAddress?.(parsed); } catch { /* intentional */ }
        return;
      }

      if (activeAddress) {
        setSavedAddress(activeAddress);
        return;
      }

      const parsedLegacy = await getAddress<SavedAddress | null>(ADDRESS_KEYS.USER_ADDRESS, null);
      if (parsedLegacy) {
        setSavedAddress(parsedLegacy);
        try { setActiveAddress?.(parsedLegacy); } catch { /* intentional */ }
        return;
      }
      
      // FIRST INSTALL FLOW (when no address has ever been selected)
      await handleFirstInstallLocationFlow();
    };
    
    loadAddress();
  }, []);

  // Foreground location change detection listener
  // Debounced: waits 10s after foreground before checking, to avoid flash on
  // quick navigation returns (Add Money → Home, FX → Home, etc.).
  // Only shows the banner if the user is in a different service zone or is
  // now unserviceable. Simple distance changes silently update the header address.
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const runLocationCheck = async () => {
      if (cancelled) return;
      if (!savedAddress?.latitude || !savedAddress?.longitude) return;

      try {
        const permission = await checkLocationPermission();
        if (permission.location !== 'granted') return;

        const position = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 5000,
        });

        if (cancelled) return;

        const { latitude, longitude } = position.coords;

        // Check the service zone at the new position
        const { data: newZoneId } = await (supabase as any).rpc('check_service_availability', {
          p_lat: Number(latitude) || 0,
          p_lng: Number(longitude) || 0,
        });

        if (cancelled) return;

        // Only show the banner if the zone has actually changed (different
        // serviceable zone, or moved from serviceable → unserviceable).
        const zoneChanged = newZoneId !== currentZoneId;
        const nowUnserviceable = !newZoneId && !!currentZoneId;

        if (zoneChanged || nowUnserviceable) {
          setShowLocationChangedBanner(true);
        } else {
          setShowLocationChangedBanner(false);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to detect location change on foreground', e);
      }
    };

    const scheduleCheck = () => {
      // Clear any pending check so we don't stack timers
      if (debounceTimer) clearTimeout(debounceTimer);
      // Wait 10 seconds before comparing — avoids flash on quick nav returns
      debounceTimer = setTimeout(() => {
        runLocationCheck();
      }, 10_000);
    };

    // Web visibility change
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleCheck();
      } else {
        // User left — cancel any pending check
        if (debounceTimer) clearTimeout(debounceTimer);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    // Native App state change (if on native device)
    let nativeAppListener: PluginListenerHandle | null = null;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', (state) => {
          if (state.isActive) {
            scheduleCheck();
          } else {
            if (debounceTimer) clearTimeout(debounceTimer);
          }
        }).then(listener => {
          nativeAppListener = listener;
        });
      });
    }

    // Schedule initial check on mount (with the same 10s debounce)
    scheduleCheck();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (nativeAppListener) {
        nativeAppListener.remove();
      }
    };
  }, [savedAddress, currentZoneId]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`homepage-order-sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        async (payload: RealtimePostgresChangesPayload<Order>) => {
          queryClient.invalidateQueries({ queryKey: ['active-order', userId] });
          queryClient.invalidateQueries({ queryKey: ['recent-orders', userId] });

          // Detect order completion to show RatingSheet
          const newOrder = (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') ? payload.new : null;
          if (
            newOrder &&
            (newOrder.status === 'success' || newOrder.status === 'delivered') &&
            newOrder.rider_id
          ) {
            // Check if status changed to completed
            const oldStatus = payload.eventType === 'UPDATE' ? (payload.old as Order)?.status : null;
            if (oldStatus !== 'success' && oldStatus !== 'delivered') {
              try {
                const { data: rider } = await (supabase as any)
                  .from('riders')
                  .select('full_name, kyc_photo')
                  .eq('id', newOrder.rider_id)
                  .single();

                const riderName = rider ? rider.full_name : 'Rider';
                const riderPhoto = rider ? rider.kyc_photo : null;

                setCompletedOrder({
                  id: newOrder.id,
                  rider_id: newOrder.rider_id,
                  rider_name: riderName,
                  rider_photo: riderPhoto,
                });
              } catch (err) {
                crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Homepage: Error fetching rider for rating sheet');
                if (import.meta.env.DEV) console.error('Error fetching rider for rating:', err);
                crashlytics.recordError(err instanceof Error ? err : new Error('Homepage failed to fetch rider for rating'), 'Homepage.fetchRiderForRating');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
  // Simulate Rider Assignment
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'processing') {
      const timer = setTimeout(() => {
        setIsRiderAssigned(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeOrder]);

  // Proactive Service Availability Check
  useEffect(() => {
    const checkAvailability = async () => {
      if (!savedAddress?.latitude || !savedAddress?.longitude) {
        setIsUnserviceable(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any).rpc('check_service_availability', {
          p_lat: Number(savedAddress.latitude) || 0,
          p_lng: Number(savedAddress.longitude) || 0,
        });
        if (error) {
          crashlytics.recordError(new Error(error.message || 'check_service_availability RPC failed'), 'Homepage: Foreground zone check RPC error');
          if (import.meta.env.DEV) console.error('RPC Error checking availability:', error);
          crashlytics.recordError(error instanceof Error ? error : new Error('Homepage RPC error checking availability'), 'Homepage.rpcAvailabilityCheck');
          setIsUnserviceable(true);
        } else {
          setIsUnserviceable(!data);
          setCurrentZoneId(data);
        }
      } catch (err) {
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'Homepage: Failed to check service availability on foreground');
        if (import.meta.env.DEV) console.error('Failed to check service availability:', err);
        crashlytics.recordError(err instanceof Error ? err : new Error('Homepage failed to check service availability'), 'Homepage.serviceAvailability');
        setIsUnserviceable(false);
      } finally {

      }
    };
    checkAvailability();
  }, [savedAddress]);
  const handleAddressSelect = (address: SavedAddress | null) => {
    setSavedAddress(address);
    try { setActiveAddress?.(address); } catch { /* intentional */ }
    if (address) {
      setIsAddressSheetOpen(false);
    }
  };

  const handleAddressSheetClose = () => {
    if (isAddressModalOpen) return;
    setIsAddressSheetOpen(false);
  };
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId, 'User Request', 'Cancelled from homepage');
      setIsSheetOpen(false);
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['active-order', userId] });
        queryClient.invalidateQueries({ queryKey: ['recent-orders', userId] });
        queryClient.invalidateQueries({ queryKey: ['wallet-balance', userId] });
      }
    } catch (e) {
      crashlytics.recordError(e instanceof Error ? e : new Error(String(e)), 'Homepage: Failed to cancel order');
      if (import.meta.env.DEV) console.error('Failed to cancel order', e);
      crashlytics.recordError(e instanceof Error ? e : new Error('Homepage failed to cancel order'), 'Homepage.cancelOrder');
      throw e;
    }
  };


  const getActiveOrderAddressDisplay = () => {
    if (!activeOrder?.addresses) return 'Unknown Location';
    const parts = [activeOrder.addresses.apartment, activeOrder.addresses.area];
    const fullString = parts.filter(Boolean).join(', ');
    return fullString.length > 20 ? fullString.substring(0, 20) + '...' : fullString;
  };
  const getActiveOrderBannerContent = () => {
    if (!activeOrder) return { title: '', sub: '' };

    if (activeOrder.scheduled_at && !activeOrder.rider_id) {
      const date = new Date(activeOrder.scheduled_at);
      const formattedDate = date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
      return {
        title: <>Your order is scheduled</>,
        sub: `Scheduled for ${formattedDate}`,
      };
    }

    switch (activeOrder.status.toLowerCase()) {
      case 'pending':
        return {
          title: (
            <>
              We’re assigning a delivery
              <br />
              partner soon!
            </>
          ),
          sub: 'Assigning a delivery partner in the next 2 minutes.',
        };
      case 'accepted': {
        const riderName = activeOrder.rider?.full_name || 'Rider';
        return {
          title: <>Rider is on the way to pickup!</>,
          sub: `${riderName} is heading to the store.`,
        };
      }
      case 'processing':
        return isRiderAssigned
          ? {
              title: <>Rider Assigned</>,
              sub: 'Your delivery partner is on the way to the store.',
            }
          : {
              title: (
                <>
                  We’re assigning a delivery
                  <br />
                  partner soon!
                </>
              ),
              sub: 'Assigning a delivery partner in the next 2 minutes.',
            };
      case 'out_for_delivery':
      case 'picked_up':
        return {
          title: <>Partner is on the way!</>,
          sub: 'Your delivery partner has picked up your order.',
        };
      case 'arrived':
        return {
          title: <>Partner has arrived!</>,
          sub: 'Please meet your delivery partner at the door.',
        };
      default:
        return {
          title: (
            <>
              We’re assigning a delivery
              <br />
              partner soon!
            </>
          ),
          sub: 'Assigning a delivery partner in the next 2 minutes.',
        };
    }
  };



  const mapCenterLat = Number(activeOrder?.addresses?.latitude || 12.9716);
  const mapCenterLng = Number(activeOrder?.addresses?.longitude || 77.5946);

  if (isInitialLoading && !activeOrder && transactionHistory.length === 0) {
    return <HomePageSkeleton />;
  }
  return (
    <div
      className="h-full w-full flex flex-col relative"
      style={{
        backgroundImage: `url(${mainBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="flex-1 w-full overflow-y-auto touch-pan-y scrollbar-hide min-h-0 pb-[calc(120px+env(safe-area-inset-bottom))]"
        style={{
          willChange: 'transform',
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
        }}
      >
        <div className="flex flex-col min-h-full">
          <AnimatePresence mode="popLayout">
            {displayNightMode ? (
              <motion.div
                key="night-mode"
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                transition={{
                  height: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.3 },
                  y: { duration: 0.4 },
                }}
                className="overflow-hidden z-50 relative"
              >
                <div className="w-full">
                  <NightDeliveryState
                    isDarkMode={isDarkMode}
                    savedAddress={savedAddress}
                    profileImage={profileImage}
                    name={name}
                    planTier={tierName.toLowerCase()}
                    onAddressClick={() => {
                      if (hasSavedAddresses) {
                        setIsAddressSheetOpen(true);
                      } else {
                        navigate(ROUTES.ADD_ADDRESS);
                      }
                    }}
                    onProfileClick={() => navigate(ROUTES.SETTINGS)}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="day-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
                className="shrink-0 flex flex-col safe-top z-50 relative pointer-events-none"
              >
                {/* Header Content Container (Individual interactive elements have pointer-events-auto) */}
                <div className="px-5 pt-4 flex items-start justify-between relative pointer-events-auto z-50">
                  <LocationDisplay
                    variant="header"
                    onClick={() => {
                      if (hasSavedAddresses) {
                        setIsAddressSheetOpen(true);
                      } else {
                        navigate(ROUTES.ADD_ADDRESS);
                      }
                    }}
                  />
                  <button onClick={() => navigate(ROUTES.SETTINGS)}>
                    <img loading="lazy" decoding="async"                       src={profileImage || ASSETS.AVATAR}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Address Selection Sheet */}
          <div className="pointer-events-auto">
            <AddressSelectionSheet
              isOpen={isAddressSheetOpen}
              onClose={handleAddressSheetClose}
              onAddressSelect={handleAddressSelect}
              onModalStateChange={setIsAddressModalOpen}
            />
          </div>
          {/* Blocking UI (Absolute Overlay when unserviceable) */}
          {isUnserviceable && (
            <div className="absolute inset-x-0 bottom-0 top-0 z-20 flex flex-col pointer-events-none">
              <NotAvailable
                onOpenAddressSheet={() => {
                  if (hasSavedAddresses) {
                    setIsAddressSheetOpen(true);
                  } else {
                    navigate(ROUTES.ADD_ADDRESS);
                  }
                }}
              />
            </div>
          )}
          {/* Conditional Content: Main Homepage Content */}
          {!isUnserviceable && (
            <>
              {/* Order Cash Input Container */}
              <div className="mx-5 mt-[14px] bg-black rounded-[33px] h-auto p-[6px] pb-[23px] flex flex-col items-center">
                <div 
                  className="w-full h-[187px] bg-cover bg-center rounded-[27px] cursor-pointer flex flex-col items-center pt-[16px] shrink-0"
                  style={{ backgroundImage: `url(${inputContainerImg})` }}
                  onClick={() => navigate(ROUTES.ORDER_CASH)}
                >
                    <span className="font-satoshi font-normal text-[14px] text-white">
                      How much cash do you need?
                    </span>
                    
                    <div 
                      className="mt-[18px] flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInlineKeypad(true);
                      }}
                    >
                      <span className="text-[32px] font-bold font-sans mr-1 text-white">₹</span>
                      <span className={`text-[32px] font-light font-sans ${amount === '0.00' ? 'text-white/50' : 'text-white'} mr-1 mt-[-4px]`}>|</span>
                      <span className={`text-[32px] font-bold font-sans ${amount === '0.00' ? 'text-white/50' : 'text-white'}`}>{amount}</span>
                    </div>

                    {/* Speak Amount Mic Button (Directly below amount, ABOVE quick pills) */}
                    <div 
                      className="my-[8px] flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={handleMicClick}
                        disabled={isTranscribing}
                        className={`h-[36px] px-4 rounded-full flex items-center gap-2 relative overflow-hidden transition-all duration-300 active:scale-95 group ${
                          isRecording
                            ? 'bg-gradient-to-b from-red-500 via-rose-600 to-red-700 text-white border border-red-300/60 shadow-[0_0_16px_rgba(239,68,68,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] animate-pulse'
                            : isTranscribing
                              ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-slate-800 border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.6)] cursor-wait'
                              : 'bg-gradient-to-b from-white via-slate-100 to-slate-300 hover:from-white hover:to-slate-200 text-slate-900 border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.2)]'
                        }`}
                      >
                        {/* Brushed metal reflection sheen overlay */}
                        {!isRecording && (
                          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/70 to-transparent pointer-events-none rounded-t-full" />
                        )}
                        {isTranscribing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-800 relative z-10" />
                            <span className="text-[12px] font-medium font-sans text-slate-800 relative z-10">Processing voice...</span>
                          </>
                        ) : isRecording ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            <Mic className="w-3.5 h-3.5 text-white relative z-10" />
                            <span className="text-[12px] font-medium font-sans text-white relative z-10">Listening... Tap when done</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10" />
                            <span className="text-[12px] font-semibold font-sans text-slate-900 tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10">
                              Speak Amount
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <div 
                      className="flex gap-4 mt-auto mb-[14px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['500', '1000', '1500'].map(val => (
                        <div
                          key={val}
                          className="relative h-[30px] flex items-center justify-center px-3 py-[6px] cursor-pointer active:scale-95 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePillClick(val);
                            setShowInlineKeypad(true);
                          }}
                        >
                          <div
                            className="absolute inset-0 w-full h-full"
                            style={{
                              backgroundImage: `url(${ASSETS.PILL_CONTAINER_BG})`,
                              backgroundSize: '100% 100%',
                              backgroundRepeat: 'no-repeat',
                            }}
                          />
                          <span className="relative z-10 text-[12px] font-medium font-sans text-white">
                            +₹{val}
                          </span>
                        </div>
                      ))}
                    </div>
                </div>
                
                <div className="mt-[12px] flex flex-col justify-center items-center w-full px-[9px]">
                  {(numericAmount > 0 && isDailyLimitExceeded) && (
                    <p className="text-[#FF4248] text-[12px] font-medium text-center mb-2">
                      Daily limit exceeded. You can only order ₹{Math.max(0, dailyLimit - todayCashSum).toLocaleString('en-IN')} more today.
                    </p>
                  )}
                  {(numericAmount > 0 && isMonthlyLimitExceeded) && (
                    <p className="text-[#FF4248] text-[12px] font-medium text-center mb-2">
                      Monthly limit exceeded. You can only order ₹{Math.max(0, monthlyLimit - monthCashSum).toLocaleString('en-IN')} more this month.
                    </p>
                  )}
                  <GpButton
                    onClick={() => {
                      if (displayNightMode) {
                        if (tierName.toLowerCase() === 'pro') {
                          navigate(ROUTES.ORDER_CASH, { state: { amount: numericAmount >= 500 ? amount : undefined, isScheduledFlow: true } });
                        } else {
                          navigate(ROUTES.PRO_UPGRADE);
                        }
                      } else {
                        if (numericAmount >= 500 && !isDailyLimitExceeded && !isMonthlyLimitExceeded) {
                          navigate(ROUTES.ORDER_CASH_SUMMARY, { state: { amount, isScheduledFlow: false } });
                        } else {
                          setShowInlineKeypad(true);
                        }
                      }
                    }}
                    disabled={
                      numericAmount === 0 || (
                        displayNightMode 
                          ? (tierName.toLowerCase() === 'pro' && (numericAmount < 500 || isDailyLimitExceeded || isMonthlyLimitExceeded))
                          : (numericAmount < 500 || isDailyLimitExceeded || isMonthlyLimitExceeded)
                      )
                    }
                    variant="primary"
                    className={cn(
                      'w-full h-[44px] shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                      (numericAmount >= 500 && !isDailyLimitExceeded && !isMonthlyLimitExceeded)
                        ? 'bg-[#5260FE] hover:bg-[#5260FE]/90 active:scale-[0.98] border-none text-white rounded-full'
                        : (!isDarkMode && 'bg-black hover:bg-black/90 text-white rounded-full border border-white/20')
                    )}
                  >
                    <img loading="lazy" decoding="async" src={iconOrderCash} alt="Order Cash" className="w-6 h-6" />
                    <span
                      className={cn(
                        'font-medium',
                        isDarkMode ? 'text-white dark:text-foreground' : 'text-white'
                      )}
                    >
                      {displayNightMode 
                        ? (tierName.toLowerCase() === 'pro' 
                            ? (numericAmount === 0 ? 'Pre-Order for 6:00 AM' : (isDailyLimitExceeded || isMonthlyLimitExceeded) ? 'Limit Exceeded' : numericAmount < 500 ? 'Min. ₹500' : 'Pre-Order for 6:00 AM') 
                            : 'Upgrade to Pro to Pre-Order')
                        : (numericAmount === 0 
                            ? 'Order Cash' 
                            : (isDailyLimitExceeded || isMonthlyLimitExceeded) 
                              ? 'Limit Exceeded' 
                              : numericAmount < 500 
                                ? 'Min. ₹500' 
                                : 'Proceed to Pay')}
                    </span>
                  </GpButton>
                </div>

                <div className="mt-[15px] flex flex-col items-center justify-center text-center">
                  <span className="font-satoshi font-normal text-[12px] text-white/60 leading-none">
                    Your money stays protected.
                  </span>
                  <span className="font-satoshi font-normal text-[12px] text-white/60 leading-none mt-[1px]">
                    Delivered safely by a verified Grid.Pe rider.
                  </span>
                </div>

                <div className="mt-[33px] w-full px-[14px]">
                  {/* Delivery Limit Section */}
                  <div className="flex flex-col mb-[13px]">
                    <div className="flex justify-between items-center mb-[8px]">
                      <span className="font-satoshi font-normal text-[16px] text-white">Delivery Limit</span>
                      <img loading="lazy" 
                        src={infoIcon} 
                        alt="info" 
                        className="w-[14px] h-[14px] cursor-pointer" 
                        onClick={() => setShowDeliveryLimitsModal(true)}
                      />
                    </div>
                    <div className="w-full h-[6px] bg-[#2A2A2A] rounded-full overflow-hidden mb-[8px]">
                      <div className="h-full bg-gradient-to-r from-[#2DD4BF] to-[#4ADE80] rounded-full" style={{ width: `${Math.min((todayCashSum / dailyLimit) * 100, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-satoshi font-medium text-[15px] text-white">₹{todayCashSum.toLocaleString('en-IN')}</span>
                      <span className="font-satoshi font-medium text-[15px] text-white">₹{dailyLimit.toLocaleString('en-IN')}/day</span>
                    </div>
                  </div>

                  {/* Current Tier Section */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-[8px]">
                      <span className="font-satoshi font-normal text-[16px] text-white">Current Tier</span>
                      <span className="font-satoshi font-medium text-[16px] text-[#5260FE]">{tierName.charAt(0).toUpperCase() + tierName.slice(1)}</span>
                    </div>
                    <div className="w-full h-[6px] bg-[#2A2A2A] rounded-full overflow-hidden mb-[8px]">
                      <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] rounded-full" style={{ width: `${Math.min((monthCashSum / monthlyLimit) * 100, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-satoshi font-medium text-[15px] text-white">₹{monthCashSum.toLocaleString('en-IN')}</span>
                      <span className="font-satoshi font-medium text-[15px] text-white">₹{monthlyLimit.toLocaleString('en-IN')}/month</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Banner */}
              {tierName.toLowerCase() !== 'pro' && (
                <div 
                  className="mx-5 mt-[16px] h-[66px] rounded-[14px] bg-cover bg-center flex items-center justify-between pl-[12px] pr-[19px] cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ backgroundImage: `url(${proBannerImg})` }}
                  onClick={() => navigate(ROUTES.PRO_UPGRADE)}
                >
                  <div className="flex items-center">
                    <img loading="lazy" src={proIcon} alt="Pro Icon" className="w-[42px] h-[42px]" />
                    <div className="flex flex-col ml-[9px]">
                      <span className="font-satoshi font-medium text-[15px] text-white leading-none">
                        Grid.Pe Pro
                      </span>
                      <span className="font-satoshi italic text-[12px] text-white leading-none mt-[1px]">
                        Upgrade now to unlock more benefits!
                      </span>
                    </div>
                  </div>
                  <img loading="lazy" src={arrowUpIcon} alt="Arrow Up" className="w-[28px] h-[28px]" />
                </div>
              )}
              {/* Balance Alert Banner */}
              {/* Location Changed Banner */}
              {showLocationChangedBanner && (
                <div className="mx-5 mt-6 p-4 rounded-[13px] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-brand-primary text-[14px] font-bold font-satoshi leading-tight">
                        Location Changed
                      </p>
                      <p className={`text-[12px] font-medium font-satoshi mt-1 leading-tight ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                        Your location has changed. Update delivery address?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddressSheetOpen(true);
                      setShowLocationChangedBanner(false);
                    }}
                    className="px-4 py-2 bg-brand-primary text-white text-[12px] font-bold rounded-full active:scale-95 transition-transform shrink-0"
                  >
                    Update
                  </button>
                </div>
              )}
              {/* Active Order OR Referral Banner */}
              {activeOrder ? (
                <div className="mx-5 mt-6 mb-[16px] flex flex-col gap-0 animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* Header: Delivering To */}
                  <div className="bg-black py-[10px] px-[16px] rounded-t-[13px] flex justify-between items-center z-10">
                    <p className="text-white text-[12px] font-medium font-satoshi tracking-wider">
                      Delivering to - {activeOrder.addresses?.label || 'Home'}
                    </p>
                    <p className="text-white/70 text-[11px] font-medium font-satoshi truncate ml-4">
                      {getActiveOrderAddressDisplay()}
                    </p>
                  </div>
                  {/* Body: Order Details & Map */}
                  <div
                    className={`p-[16px] flex items-center justify-between rounded-b-[13px] border-x border-b ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-brand-border-light'} cursor-pointer active:scale-[0.99] transition-all`}
                    onClick={() =>
                      navigate(ROUTES.ORDER_TRACKING, { state: { order: activeOrder } })
                    }
                  >
                    <div className="flex-1 pr-4">
                      <h4
                        className={`text-[15px] font-bold font-satoshi leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}
                      >
                        {getActiveOrderBannerContent().title}
                      </h4>
                      <p
                        className={`text-[12px] font-medium font-satoshi leading-snug ${isDarkMode ? 'text-white/50' : 'text-brand-text-muted'}`}
                      >
                        {getActiveOrderBannerContent().sub}
                      </p>
                    </div>
                    {/* Map Preview */}
                    <div
                      className="shrink-0 w-[96px] h-[64px] rounded-[8px] overflow-hidden relative border border-black/5"
                      style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0' }}
                    >
                      <React.Suspense fallback={<div className="w-full h-full bg-[#0A0A12]" />}>
                        <Map
                        initialViewState={{
                          latitude: mapCenterLat,
                          longitude: mapCenterLng,
                          zoom: 14,
                        }}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle={
                          isDarkMode
                            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                            : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
                        }
                        attributionControl={false}
                        interactive={false}
                      >
                        <Marker latitude={mapCenterLat} longitude={mapCenterLng}>
                          <div className="animate-pulse">
                            <img loading="lazy" decoding="async"                               src={ASSETS.CURRENT_LOCATION}
                              alt="User"
                              className="w-4 h-4"
                              style={
                                !isDarkMode
                                  ? {
                                      filter:
                                        'brightness(0) invert(38%) sepia(87%) saturate(3505%) hue-rotate(224deg) brightness(97%) contrast(99%)',
                                    }
                                  : undefined
                              }
                            />
                          </div>
                        </Marker>
                        {activeOrder?.status?.toLowerCase() === 'processing' && isRiderAssigned && (
                          <Marker latitude={mapCenterLat + 0.002} longitude={mapCenterLng + 0.002}>
                            <img loading="lazy" decoding="async"                               src={ASSETS.DELIVERY_RIDER}
                              alt="Rider"
                              className="w-5 h-5"
                              style={
                                !isDarkMode
                                  ? {
                                      filter:
                                        'brightness(0) invert(38%) sepia(87%) saturate(3505%) hue-rotate(224deg) brightness(97%) contrast(99%)',
                                    }
                                  : undefined
                              }
                            />
                          </Marker>
                        )}
                        </Map>
                      </React.Suspense>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <BottomNavigation activeTab="home" isHidden={isAddressModalOpen || isAddressSheetOpen || showInlineKeypad} />
      
      <AnimatePresence>
        {showInlineKeypad && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col justify-end"
          >
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 dark:bg-black/40 -z-10"
              onClick={() => setShowInlineKeypad(false)}
            />
            <div
              className={`w-full relative rounded-t-[32px] overflow-hidden shrink-0 ${!isDarkMode ? 'border-t border-brand-border-light' : ''}`}
            >
              {isDarkMode && (
                <div
                  className="absolute inset-0 rounded-t-[32px] pointer-events-none"
                  style={{
                    padding: '0.63px',
                    background:
                      'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                  }}
                />
              )}
              <div
                className="w-full h-full p-[20px] pb-[40px] backdrop-blur-[25px]"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 0.95)' : '#F1F5F9',
                }}
              >
                {/* Close handle */}
                <div className="flex justify-center w-full mb-4">
                  <div className="w-[40px] h-[4px] rounded-full bg-black/20 dark:bg-white/20" />
                </div>
                <div className="flex flex-col gap-[10px] items-center relative z-10">
                  <div className="flex gap-[10px]">
                    <KeypadButton label="1" onClick={() => handleKeyPress('1')} />
                    <KeypadButton label="2" onClick={() => handleKeyPress('2')} />
                    <KeypadButton label="3" onClick={() => handleKeyPress('3')} />
                  </div>
                  <div className="flex gap-[10px]">
                    <KeypadButton label="4" onClick={() => handleKeyPress('4')} />
                    <KeypadButton label="5" onClick={() => handleKeyPress('5')} />
                    <KeypadButton label="6" onClick={() => handleKeyPress('6')} />
                  </div>
                  <div className="flex gap-[10px]">
                    <KeypadButton label="7" onClick={() => handleKeyPress('7')} />
                    <KeypadButton label="8" onClick={() => handleKeyPress('8')} />
                    <KeypadButton label="9" onClick={() => handleKeyPress('9')} />
                  </div>
                  <div className="flex gap-[10px]">
                    <KeypadButton label="." onClick={() => handleKeyPress('.')} />
                    <KeypadButton label="0" onClick={() => handleKeyPress('0')} />
                    <KeypadButton
                      onClick={handleBackspace}
                      icon={
                        <img loading="lazy"
                          src={ASSETS.BACKSPACE}
                          alt="Backspace"
                          className="w-[18px] h-[18px] object-contain"
                        />
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderDetailsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        order={selectedOrderForSheet}
        onCancel={handleCancelOrder}
      />
      <RatingSheet
        isOpen={completedOrder !== null}
        onClose={() => setCompletedOrder(null)}
        order={completedOrder}
      />

      {/* Delivery Limits Modal */}
      <AnimatePresence>
        {showDeliveryLimitsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/50 backdrop-blur-md"
            onClick={() => setShowDeliveryLimitsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-[362px] h-auto max-w-[90vw] overflow-hidden rounded-[32px] p-[17px] flex flex-col"
              style={{
                backgroundImage: `url(${deliveryLimitBg})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-start text-left">
                <h3 className="text-white font-satoshi font-bold text-[18px] tracking-tight mb-[4px]">Delivery Limits</h3>
                <p className="text-white/90 font-satoshi font-[400] text-[16px] leading-snug mb-[3px]">
                  Your current {tierName.charAt(0).toUpperCase() + tierName.slice(1)} plan allows up to ₹{dailyLimit.toLocaleString('en-IN')}/day and ₹{monthlyLimit.toLocaleString('en-IN')}/month in cash orders.
                </p>
                <p className="text-white/90 font-satoshi font-[400] text-[16px] leading-snug">
                  Upgrade to Grid.Pe Pro to unlock higher limits and exclusive benefits.
                </p>
              </div>
              
              <div className="mt-[22px] w-full flex flex-col items-center">
                <GpButton
                  className="w-full max-w-[328px] mb-[14px]"
                  onClick={() => {
                    setShowDeliveryLimitsModal(false);
                    navigate(ROUTES.PRO_UPGRADE);
                  }}
                >
                  Explore Grid.Pe Pro
                </GpButton>
                
                <button
                  className="active:opacity-70 transition-opacity"
                  onClick={() => setShowDeliveryLimitsModal(false)}
                >
                  <span className="text-white text-[16px] font-medium font-satoshi">
                    Skip
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Confirmation Sheet */}
      <VoiceConfirmationSheet
        isOpen={Boolean(voiceConfirmation?.isOpen)}
        amount={voiceConfirmation?.amount || 0}
        transcript={voiceConfirmation?.transcript || ''}
        preferredLanguage={profile?.preferred_language || 'en'}
        isDarkMode={isDarkMode}
        onConfirm={(confirmedAmount) => {
          setAmount(confirmedAmount.toFixed(2));
          setVoiceConfirmation(null);
        }}
        onEditManually={() => {
          setVoiceConfirmation(null);
          setShowInlineKeypad(true);
        }}
        onClose={() => {
          setVoiceConfirmation(null);
        }}
      />
    </div>
  );
};
export default Homepage;

