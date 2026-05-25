import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Map, { ViewState, ViewStateChangeEvent, MapRef } from 'react-map-gl/maplibre';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { Search } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import 'maplibre-gl/dist/maplibre-gl.css';
import { olc } from '@/utils/olc';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  calculateDistance,
  getDistance,
  GeocodeResult,
  reverseGeocode,
  forwardGeocode,
  AddressComponents,
} from '@/utils/geoUtils';
import { getCurrentPosition, checkLocationPermission, requestLocationPermission } from '@/utils/geolocation';
// Assets
import { useWebScroll } from '@/hooks/useWebScroll';
const AddAddress = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 15,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const [addressTitle, setAddressTitle] = useState<string>('Loading...');
  const [addressLine, setAddressLine] = useState<string>('');
  const [currentAddressComponents, setCurrentAddressComponents] = useState<AddressComponents | null>(null); // Store full address details
  const [plusCode, setPlusCode] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceInMeters, setDistanceInMeters] = useState<number | null>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  // Hybrid Search (Plus Code & Text)
  const performSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    // 1. Hybrid Check: Extract Plus Code pattern from mixed input
    const plusCodeRegex = /([A-Z0-9]{2,8}\+[A-Z0-9]{2,3})/i;
    const match = query.match(plusCodeRegex);
    if (match) {
      const potentialCode = match[0].toUpperCase();
      try {
        // Attempt to recover nearest (handles short codes using context)
        const refLat = userLocation ? userLocation.lat : viewState.latitude;
        const refLng = userLocation ? userLocation.lng : viewState.longitude;
        const recoveredCode = olc.recoverNearest(potentialCode, refLat, refLng);
        if (olc.isValid(recoveredCode)) {
          const codeArea = olc.decode(recoveredCode);
          const lat = codeArea.latitudeCenter;
          const lng = codeArea.longitudeCenter;
          // IMMEDIATELY Call reverseGeocode(lat, lng) to get the building name
          const reverseResult = await reverseGeocode(lat, lng);
          if (reverseResult) {
            const result: GeocodeResult = {
              display_name: reverseResult.address?.building || reverseResult.display_name,
              address: reverseResult.address,
              lat: lat.toString(),
              lon: lng.toString(),
            };
            setSearchResults([result]);
            setShowDropdown(true);
            return;
          }
        }
      } catch (err) {
        console.error('Plus Code search error:', err);
        showToaster("Couldn't save address. Please try again.", 'error');
      }
    }
    // 2. Text Search (Nominatim)
    try {
      // Pass user location or map center to bias results
      const centerLat = userLocation ? userLocation.lat : viewState.latitude;
      const centerLng = userLocation ? userLocation.lng : viewState.longitude;
      const results = await forwardGeocode(query, centerLat, centerLng);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    }
  };
  const fetchAddress = async (
    lat: number,
    lng: number,
    overrideUserLocation?: { lat: number; lng: number }
  ) => {
    setIsLoading(true);
    try {
      const fullCode = olc.encode(lat, lng);
      setPlusCode(fullCode);
      // Use Nominatim Reverse Geocode
      const geocodeResult = await reverseGeocode(lat, lng);
      if (geocodeResult) {
        const addr = geocodeResult.address || {};
        setCurrentAddressComponents(addr); // Store for navigation
        // Construct a friendly title
        const title =
          addr.building ||
          addr.amenity ||
          addr.shop ||
          addr.tourism ||
          addr.leisure ||
          addr.road ||
          addr.suburb ||
          'Pinned Location';
        setAddressTitle(title);
        setAddressLine(geocodeResult.display_name);
      } else {
        setCurrentAddressComponents(null);
        setAddressTitle('Location not found');
        setAddressLine('Address details unavailable');
      }
      const loc = overrideUserLocation || userLocation;
      if (loc) {
        setDistanceInMeters(getDistance(loc.lat, loc.lng, lat, lng));
      } else {
        setDistanceInMeters(null);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddressTitle('Location not found');
      setAddressLine('Unable to fetch address details. Please try moving the pin.');
      setPlusCode('');
      setDistanceInMeters(null);
    } finally {
      setIsLoading(false);
    }
  };
  const performSearchRef = useRef(performSearch);
  useEffect(() => {
    performSearchRef.current = performSearch;
  });
  const debouncedSearch = useMemo(() => {
    const func = (q: string) => performSearchRef.current(q);
    return debounce(func, 500);
  }, []);
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    debouncedSearch(val);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchAddress = useCallback(debounce(fetchAddress, 1000), [userLocation]);
  const checkPermission = async () => {
    const status = await checkLocationPermission();
    if (status.location === 'prompt' || status.location === 'prompt-with-rationale') {
      const permission = await requestLocationPermission();
      return permission.location === 'granted';
    }
    return status.location === 'granted';
  };
  const fetchUserLocation = useCallback(async () => {
    try {
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        showToaster('Location permission is required to center the map on your current position.', 'error');
        return;
      }
      // Permission granted, fetch location
      console.log('Permission granted. Requesting fresh user location...');
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      const { latitude, longitude } = position.coords;
      setUserLocation({
        lat: latitude,
        lng: longitude,
      });
      // Update viewState directly to ensure map loads at this location
      setViewState(prev => ({
        ...prev,
        latitude,
        longitude,
        zoom: 18,
      }));
      // Also try smooth animation if map is ready
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: 18,
        duration: 1500,
      });
      // Fetch address for this new GPS location
      fetchAddress(latitude, longitude, { lat: latitude, lng: longitude });
    } catch (error) {
      console.error('Error getting location:', error);
      showToaster('Unable to retrieve your current location. Please try again or check your GPS settings.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToaster]);
  const handleSnapToGrid = () => {
    try {
      const code = olc.encode(viewState.latitude, viewState.longitude);
      const decoded = olc.decode(code);
      const centerLat = decoded.latitudeCenter;
      const centerLng = decoded.longitudeCenter;
      setViewState(prev => ({
        ...prev,
        latitude: centerLat,
        longitude: centerLng,
        zoom: 18,
      }));
      // Fetch address for the new snapped location
      fetchAddress(centerLat, centerLng);
    } catch (error) {
      console.error('Error snapping to grid:', error);
    }
  };
  const handleMove = (evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
    setIsDragging(true);
  };
  const handleMoveEnd = (evt: ViewStateChangeEvent) => {
    setIsDragging(false);
    // Fetch immediately on move end for snappier feeling
    fetchAddress(evt.viewState.latitude, evt.viewState.longitude);
  };
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    }
  };
  const handleSelectResult = (result: GeocodeResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    // Smooth FlyTo Transition
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 18,
      duration: 1500, // 1.5s smooth animation
    });
    // Clear search
    setSearchResults([]);
    setShowDropdown(false);
    setSearchQuery(result.display_name.split(',')[0]); // Set input to the selected name
  };
  const copyPlusCode = () => {
    if (plusCode) {
      navigator.clipboard.writeText(plusCode);
      showToaster('Plus Code copied to clipboard!', 'success');
    }
  };
  useEffect(() => {
    // Initial fetch for default location immediately (fallback/last known)
    fetchAddress(viewState.latitude, viewState.longitude);
    // Initial fresh fetch
    fetchUserLocation();
    // Re-fetch on window focus
    const handleFocus = () => {
      fetchUserLocation();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserLocation]);
  useEffect(() => {
    if (!bottomSheetRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setBottomSheetHeight(entry.target.getBoundingClientRect().height);
      }
    });
    observer.observe(bottomSheetRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      className={`h-full w-full relative bg-background ${isDarkMode ? 'text-white' : 'text-black'} ${containerOverflow}`}
    >
      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        minZoom={3}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        style={{ width: '100%', height: '100%' }}
        // Use carto positron for light mode
        mapStyle={
          isDarkMode
            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
            : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        }
        attributionControl={false}
      />
      {/* Top Container Layer */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div
          className="rounded-b-[32px] overflow-hidden pointer-events-auto transition-colors duration-300"
          style={{
            backgroundColor: isDarkMode ? 'rgba(7, 7, 7, 0.81)' : 'hsl(var(--background) / 0.8)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            paddingBottom: '24px',
            borderBottom: isDarkMode ? 'none' : '1px solid hsl(var(--border))',
          }}
        >
          <div className="safe-top px-5">
            {/* Header */}
            <div className="flex items-center">
              <BackButton onClick={() => navigate(-1)} className="mr-2" />
              <h1
                className={`flex-1 text-center text-lg font-medium pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Add New Address
              </h1>
            </div>
          </div>
        </div>
        {/* Search Bar - 18px below the container */}
        <div
          className="flex justify-center mt-[18px] pointer-events-auto relative"
          style={{ zIndex: 60 }}
        >
          <div
            className="flex items-center px-4 shadow-sm"
            style={{
              width: '363px',
              height: '44px',
              borderRadius: '9999px',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--background))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid hsl(var(--border))',
            }}
          >
            <Search
              className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-white' : 'text-muted-foreground'}`}
            />
            <input
              type="text"
              placeholder="“near the tree” doesn’t help anyone"
              value={searchQuery}
              onChange={handleSearchInput}
              onKeyDown={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // small delay so clicks on results register before hiding
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
              className={`bg-transparent border-none outline-none flex-1 text-[14px] ${isDarkMode ? 'text-white placeholder-white' : 'text-black placeholder-muted-foreground'} font-normal font-sans`}
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          {/* Dropdown Results */}
          {showDropdown && searchResults.length > 0 && (
            <div
              className={`absolute top-[52px] w-[363px] backdrop-blur-xl border rounded-xl overflow-hidden max-h-[300px] overflow-y-auto shadow-2xl ${isDarkMode ? 'bg-brand-card-dark border-[#313131]' : 'bg-background/95 border-border'}`}
              style={{ zIndex: 50 }}
            >
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  className={`px-4 py-3 border-b cursor-pointer flex items-center transition-colors ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-border hover:bg-muted'}`}
                >
                  <img                     src={ASSETS.LOCATION_PIN}
                    alt="Pin"
                    loading="lazy"
                    decoding="async"
                    width="12"
                    height="12"
                    className="w-3 h-3 mr-3 opacity-70"
                    style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
                  />
                  <span
                    className={`text-sm font-satoshi truncate ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {result.display_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Hide Map UI when actively searching */}
      <div 
        className="transition-opacity duration-300 ease-in-out"
        style={{ 
          opacity: isSearchFocused ? 0 : 1,
          pointerEvents: isSearchFocused ? 'none' : 'auto'
        }}
      >
        {/* Fixed Center Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <div className="relative z-0 -mt-10">
            <img src={ASSETS.MAP_PIN_ICON} alt="Pin" loading="eager" decoding="async" width="46" height="58" className="w-[46px] h-[58px]" />
          </div>
        </div>
        {/* Helper Pill & Navigation Button Container */}
        <div
          className="absolute left-0 right-0 z-30 flex items-center justify-center pointer-events-none transition-all duration-300 ease-in-out"
          style={{ bottom: `${bottomSheetHeight + 14}px` }}
        >
        <div className="flex items-center pointer-events-auto">
          {/* Helper Pill */}
          <div
            className={`flex items-center justify-center ${isDarkMode ? 'shadow-lg' : ''}`}
            style={{
              width: '302px',
              height: '40px',
              borderRadius: '9999px',
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'hsl(var(--primary) / 0.1)',
              backdropFilter: 'blur(10px)',
              border: isDarkMode
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid hsl(var(--primary) / 0.1)',
            }}
          >
            {/* Can swap icon color or use filter */}
            <img               src={ASSETS.LOCATION_PIN}
              alt="Snap"
              loading="eager"
              decoding="async"
              width="16"
              height="16"
              className="w-4 h-4 mr-2 cursor-pointer hover:scale-110 transition-transform"
              onClick={handleSnapToGrid}
              data-testid="helper-pin-icon"
              style={
                !isDarkMode
                  ? {
                      filter:
                        'invert(36%) sepia(80%) saturate(6000%) hue-rotate(230deg) brightness(95%) contrast(100%)',
                    }
                  : undefined
              }
            />
            {/* If icon is white svg, invert for dark text. Assuming icon is white. */}
            <span
              className={`font-medium text-[14px] ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Drag the pin to set your location
            </span>
          </div>
          <div style={{ width: '16px' }}></div>
          {/* Navigation Button */}
          <button
            onClick={fetchUserLocation}
            className={`w-[40px] h-[40px] rounded-full flex items-center justify-center overflow-hidden ${isDarkMode ? 'shadow-lg' : ''}`}
            style={{
              backgroundColor: isDarkMode ? 'hsl(var(--muted))' : 'hsl(var(--background))',
              border: isDarkMode
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid hsl(var(--border))',
            }}
          >
            <img               src={ASSETS.NAVIGATION_ICON}
              alt="Nav"
              loading="eager"
              decoding="async"
              width="18"
              height="18"
              className="w-[18px] h-[18px] object-cover"
              style={
                !isDarkMode
                  ? {
                      filter:
                        'invert(36%) sepia(80%) saturate(6000%) hue-rotate(230deg) brightness(95%) contrast(100%)',
                    }
                  : undefined
              }
            />
          </button>
        </div>
      </div>
      {/* Bottom Sheet */}
      <div
        ref={bottomSheetRef}
        className={`fixed bottom-0 left-0 right-0 rounded-t-[32px] pt-0 safe-bottom z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out ${isDarkMode ? 'bg-background border-t border-white/10' : 'bg-background'}`}
        style={{
          transform: isSearchFocused ? 'translateY(100%)' : 'translateY(0)'
        }}
      >
        <div className="flex flex-col items-center w-full">
          {/* Header Pill - 12px from top */}
          <div
            className="flex items-center mt-[12px]"
            style={{
              width: '362px',
              height: '27px',
              borderRadius: '9999px',
              background: isDarkMode
                ? 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--background)))'
                : 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--background)))',
              paddingTop: '5px',
              paddingBottom: '5px',
              paddingLeft: '10px',
            }}
          >
            <span
              className="text-white font-medium text-[12px]"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Order will be delivered here
            </span>
          </div>
          {/* Address Container - 11px below header */}
          <div className="w-full px-6 mt-[11px]">
            <div
              className="flex items-start mb-[12px]"
              style={{
                backgroundColor: 'hsl(var(--background))',
                border: isDarkMode
                  ? '1px solid hsl(var(--primary) / 0.21)'
                  : '1px solid hsl(var(--border))',
                borderRadius: '12px',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxShadow: !isDarkMode ? '0px 4px 12px rgba(0, 0, 0, 0.05)' : 'none',
              }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 ${isDarkMode ? 'bg-white/10' : 'bg-primary/10'}`}
              >
                <img                   src={ASSETS.LOCATION_PIN}
                  alt="Loc"
                  loading="eager"
                  decoding="async"
                  width="16"
                  height="16"
                  className="w-4 h-4"
                  style={
                    !isDarkMode
                      ? {
                          filter:
                            'invert(36%) sepia(80%) saturate(6000%) hue-rotate(230deg) brightness(95%) contrast(100%)',
                        }
                      : undefined
                  }
                />{' '}
                {/* Tinting to primary approx */}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-[6px]">
                  {isDragging || isLoading ? (
                    <Skeleton
                      className={`h-6 w-3/4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                    />
                  ) : (
                    <>
                      <h4
                        className={`font-bold text-[16px] ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                      >
                        {addressTitle}
                      </h4>
                      {plusCode && (
                        <div
                          onClick={copyPlusCode}
                          className="flex items-center gap-1.5 px-3 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            height: '22px',
                            backgroundColor: isDarkMode
                              ? 'rgba(7, 7, 7, 0.85)'
                              : 'hsl(var(--primary) / 0.1)',
                            borderRadius: '9999px',
                            border: isDarkMode
                              ? '1px solid rgba(255, 255, 255, 0.12)'
                              : '1px solid hsl(var(--primary) / 0.1)',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Click to copy Plus Code"
                        >
                          <span
                            data-testid="plus-code"
                            className="text-primary font-bold text-xs"
                            style={{ fontFamily: 'Satoshi, sans-serif' }}
                          >
                            {plusCode}
                          </span>
                          <img                             src={ASSETS.COPY}
                            alt="Copy"
                            loading="eager"
                            decoding="async"
                            width="12"
                            height="12"
                            className="w-3 h-3"
                            style={
                              !isDarkMode
                                ? {
                                    filter:
                                      'invert(36%) sepia(80%) saturate(6000%) hue-rotate(230deg) brightness(95%) contrast(100%)',
                                  }
                                : undefined
                            }
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                {isDragging || isLoading ? (
                  <Skeleton
                    className={`h-4 w-full mt-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                  />
                ) : (
                  <p
                    className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-muted-foreground'}`}
                  >
                    {addressLine || 'Fetching details...'}
                  </p>
                )}
              </div>
            </div>
            {/* Distance Callout */}
            {!isDragging && !isLoading && distanceInMeters !== null && distanceInMeters > 200 && (
              <div className="relative w-full flex justify-center -mt-2 mb-4 z-0">
                <div
                  className="w-full flex items-center justify-center relative"
                  style={{
                    height: '59px',
                    paddingTop: '10px',
                  }}
                >
                  <img                     src={ASSETS.DISTANCE_CALLOUT}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  />
                  <span
                    className="text-center font-medium text-[14px] relative z-10"
                    style={{
                      fontFamily: 'Satoshi, sans-serif',
                      color: '#FACC15',
                    }}
                  >
                    This is{' '}
                    {distanceInMeters < 1000
                      ? `${Math.round(distanceInMeters)}m`
                      : `${(distanceInMeters / 1000).toFixed(1)}km`}{' '}
                    away from your current location.
                  </span>
                </div>
              </div>
            )}
            {/* CTA or Warning */}
            {viewState.zoom < 16 ? (
              <div
                className={`w-full flex items-center justify-center font-medium text-[14px] ${isDarkMode ? 'text-white' : 'text-destructive'}`}
                style={{
                  marginTop: '0px',
                  marginBottom: '12px',
                  height: '45px',
                  backgroundColor: 'hsl(var(--destructive) / 0.15)',
                  border: '1px solid hsl(var(--destructive) / 0.22)',
                  borderRadius: '12px',
                  fontFamily: 'Satoshi, sans-serif',
                }}
              >
                Zoom in to place the pin at exact delivery location
              </div>
            ) : (
              <div
                style={{
                  marginTop: '24px',
                  marginBottom: '12px',
                  opacity: isDragging || isLoading ? 0 : 1,
                  transition: 'opacity 0.2s',
                  visibility: isDragging || isLoading ? 'hidden' : 'visible',
                }}
              >
                <Button
                  variant="gradient"
                  onClick={() => {
                    const addr = currentAddressComponents || {};
                    // Extract details safely - Prioritize City > Town > Village > County > State District
                    const city =
                      addr.city ||
                      addr.town ||
                      addr.village ||
                      addr.county ||
                      addr.state_district ||
                      'Bangalore';
                    const state = addr.state || 'Karnataka';
                    const postcode = addr.postcode || '560001';
                    const road = addr.road || '';
                    const houseNumber = addr.house_number || '';
                    navigate(ROUTES.ADD_ADDRESS_DETAILS, {
                      state: {
                        addressTitle: addressTitle,
                        addressLine: addressLine,
                        plusCode: plusCode,
                        lat: viewState.latitude,
                        lng: viewState.longitude,
                        city,
                        state,
                        postcode,
                        houseNumber,
                        road,
                        area: addr.suburb || addr.neighbourhood || '',
                      },
                    });
                  }}
                  className={`w-full rounded-full ${!isDarkMode ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
                  style={
                    !isDarkMode
                      ? { backgroundImage: 'none', backgroundColor: 'hsl(var(--primary))' }
                      : undefined
                  }
                >
                  Confirm Location
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
export default AddAddress;
