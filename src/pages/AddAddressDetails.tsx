import { ASSETS } from '@/constants/assets';
import { crashlytics } from '@/lib/crashlytics';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { hapticMedium } from '@/utils/haptics';
import BackButton from '@/components/ui/BackButton';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { Button } from '@/components/ui/button';
import SaveAddressSheet from '@/components/SaveAddressSheet';
import {
  createAddress,
  updateAddress,
  ensureGlobalPlusCode,
} from '@/lib/addresses';
import { useUser } from '@/contexts/UserContext';
import { writeStorage } from '@/utils/storage';
import { Contact, Home, Briefcase, Navigation, MapPin, Phone as PhoneIcon } from 'lucide-react';
const Map = React.lazy(() => import('@/components/MapWrapper'));
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocationStore } from '@/store/useLocationStore';
// Assets
interface AddressState {
  id?: string; // Unique ID for editing
  addressTitle: string; // "City, Country" or "Building Name"
  addressLine: string; // Full address
  plusCode: string;
  city: string;
  state: string;
  postcode: string;
  // Breakdown for editing
  houseNumber?: string;
  apartment?: string;
  road?: string;
  area?: string;
  house?: string;
  landmark?: string;
  name?: string;
  contact_name?: string;
  phone?: string;
  contact_phone?: string;
  tag?: string;
  label?: string;
  plus_code?: string;
  lat?: number;
  lng?: number;
}
const AddAddressDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();
  const { profile, name: accountName, phoneNumber: accountPhone, fetchProfileData } = useUser();
  const setActiveAddress = useLocationStore((state) => state.setActiveAddress);
  const currentUserId = profile?.id;
  const initialState = location.state as AddressState | null;
  const isEditMode = !!initialState?.id;
  // Form State
  const [house, setHouse] = useState(
    isEditMode ? (initialState?.houseNumber || initialState?.house || initialState?.apartment || '') : ''
  );
  const [area, setArea] = useState(isEditMode ? (initialState?.road || initialState?.area || '') : '');
  const [landmark, setLandmark] = useState(initialState?.landmark || '');
  const [plusCode] = useState(initialState?.plusCode || initialState?.plus_code || '');
  const [name, setName] = useState(initialState?.name || initialState?.contact_name || '');
  const [phone, setPhone] = useState(initialState?.phone || initialState?.contact_phone || '');
  
  const [useAccountDetails, setUseAccountDetails] = useState(false);
  const [saveAddressAs, setSaveAddressAs] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initProfile = async () => {
      try {
        if (!profile && currentUserId) {
          await fetchProfileData(currentUserId);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error('[AddAddressDetails] error:', e);
        crashlytics.recordError(e instanceof Error ? e : new Error('AddAddressDetails unknown error'), 'AddAddressDetails.unknown');
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };
    initProfile();
    return () => { isMounted = false; };
  }, [profile, currentUserId, fetchProfileData]);

  useEffect(() => {
    if (useAccountDetails) {
      setName(accountName || (profile as any)?.full_name || (profile as any)?.name || '');
      const rawPhone = accountPhone || profile?.phone || '';
      setPhone(rawPhone ? rawPhone.replace('+91', '').replace(/^91/, '').replace(/\D/g, '') : '');
    } else if (!useAccountDetails && !isEditMode) {
      setName('');
      setPhone('');
    }
  }, [useAccountDetails, profile, accountName, accountPhone, isEditMode]);
  const [selectedTag, setSelectedTag] = useState<string>(
    initialState?.tag || initialState?.label || 'Home'
  );
  const [customLabel, setCustomLabel] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // UI State — header fade is driven directly by an IntersectionObserver into
  // a ref so we never re-render on scroll.
  const headerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Derived Address Display
  const [displayAddress, setDisplayAddress] = useState(initialState?.addressLine || '');
  const isFormValid =
    house.trim() !== '' && area.trim() !== '' && name.trim() !== '' && phone.trim().length === 10;
    
  const locState = location.state as AddressState | null;
  const mapLat = Number(locState?.lat) || 12.9716;
  const mapLng = Number(locState?.lng) || 77.5946;
    
  useEffect(() => {
    if (!initialState) return;
    // Construct base parts
    const cityStatePin = `${initialState.city}, ${initialState.state} – ${initialState.postcode}`;
    const currentHouse = house || initialState.houseNumber || '';
    const currentArea = area || initialState.road || initialState.area || '';
    let constructed = '';
    if (currentHouse) constructed += `${currentHouse}, `;
    if (currentArea) constructed += `${currentArea}, `;
    if (landmark) constructed += `${landmark}, `;
    // Remove trailing comma/space
    if (constructed.endsWith(', ')) constructed = constructed.slice(0, -2);
    if (constructed && cityStatePin) {
      setDisplayAddress(`${constructed}, ${cityStatePin}`);
    } else if (cityStatePin) {
      setDisplayAddress(cityStatePin);
    } else {
      setDisplayAddress(initialState.addressLine);
    }
  }, [house, area, landmark, initialState]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const header = headerRef.current;
    if (!sentinel || !header) return;
    // intersectionRatio of a 100px sentinel mirrors the previous
    // 1 - scrollTop/100 fade, but the work happens on the compositor.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        header.style.opacity = String(ratio);
        header.style.pointerEvents = ratio === 0 ? 'none' : 'auto';
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  const handleInitialSave = () => {
    if (isFormValid) {
      setShowConfirmModal(true);
    } else {
      showToaster('Please fill all required fields correctly.', 'error');
    }
  };

  const handleFinalSave = async (overrideTag?: string) => {
    hapticMedium();
    // If saving via Sheet, we trust the caller (overrideTag)
    // But we still need to validate the main form
    if (!isFormValid) {
      showToaster('Please fill all required details first.', 'error');
      return;
    }
    // New Flow: Check if selectedTag is "Other" but sheet hasn't triggered yet (no overrideTag)
    if (selectedTag === 'Other' && !overrideTag) {
      setIsSheetOpen(true);
      return;
    }
    const tagToSave =
      overrideTag || (selectedTag === 'Other' && customLabel ? customLabel : selectedTag);
    try {
      const userId = currentUserId;
      if (!userId) {
        showToaster('Authentication error. Please try again.', 'error');
        return;
      }
      // Get lat/lng from location state if available (from map selection)
      // AddAddress page passes { lat, lng } in state.
      // But AddAddressDetails receives props from AddAddress or is navigated to?
      // Wait, AddAddressDetails reads `location.state`.
      // If coming from `AddressSelectionSheet` edit, it has no lat/lng in state unless persisted.
      // For now we assume if it's new, lat/lng came from map. If edit, we might keep existing?
      // Actually, the schema requires lat/lng.
      // If editing, we update fields. If creating, we need lat/lng.
      // Let's assume passed in state or we default to 0 if missing (should not happen in flow).
      // Since `initialState` is `AddressState`, let's check if it has coords.
      // The interface `AddressState` doesn't strictly have lat/lng?
      // Let's look at `AddressSelectionSheet`: `navigate('/add-address', { state: { lat, lng } })` -> This goes to `AddAddress` (map page).
      // `AddAddress` navigates to `AddAddressDetails` with `addressDetails` + `lat/lng`?
      // I need to ensure `location.state` has lat/lng.
      // I'll check `location.state` for any extra props.
      // Use type assertion or unsafe access for now since `AddressState` might be incomplete in this file definition
      const locState = location.state as AddressState | null;
      // Ensure strictly numeric (fallback to 0 if missing, though schema might reject 0 if logic dictates range, but type-wise it's fine)
      const lat = Number(locState?.lat) || 0;
      const lng = Number(locState?.lng) || 0;
      // Enforce Global Plus Code
      const _finalPlusCode = ensureGlobalPlusCode(plusCode, lat, lng);
      if (isEditMode && initialState?.id) {
        const updatePayload = {
          label: tagToSave,
          apartment: house,
          area: area,
          landmark: landmark,
          city: initialState.city,
          state: initialState.state,
          plus_code: plusCode,
          contact_name: name,
          contact_phone: phone,
          ...(lat !== 0 && lng !== 0 ? { latitude: lat, longitude: lng } : {}),
        };
        const updatedAddr = await updateAddress(initialState.id, updatePayload);
        
        const uiAddr = {
          ...updatedAddr,
          tag: updatedAddr.label || 'Home',
          house: updatedAddr.apartment || '',
          area: updatedAddr.area || '',
          landmark: updatedAddr.landmark || '',
          name: name,
          phone: phone,
          displayAddress: displayAddress,
          city: updatedAddr.city || '',
          state: updatedAddr.state || '',
          postcode: initialState?.postcode || '',
          plusCode: updatedAddr.plus_code || '',
        };
        setActiveAddress(uiAddr as any, true);
        try {
          writeStorage('user_address', uiAddr, userId);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn('[AddAddressDetails] Storage write failed:', e);
          }
        }

      } else {
        const insertPayload = {
          user_id: userId,
          label: tagToSave,
          apartment: house,
          area: area,
          landmark: landmark,
          city: initialState?.city || '',
          state: initialState?.state || '',
          plus_code: plusCode,
          latitude: lat,
          longitude: lng,
          contact_name: name,
          contact_phone: phone,
        };
        const newAddr = await createAddress(insertPayload);
        // For immediate UI update (Active Address), we construct a UI object
        // Save as current active address in local storage for session persistence
        const uiAddr = {
          ...newAddr,
          tag: newAddr.label || 'Home',
          house: newAddr.apartment || '',
          area: newAddr.area || '',
          landmark: newAddr.landmark || '',
          name: name, // Local only
          phone: phone, // Local only
          displayAddress: displayAddress,
          city: newAddr.city || '',
          state: newAddr.state || '',
          postcode: initialState?.postcode || '',
          plusCode: newAddr.plus_code || '',
        };
        setActiveAddress(uiAddr as any, true);
        try {
          writeStorage('user_address', uiAddr, userId);
        } catch (e) {
          if (import.meta.env.DEV) console.warn('Failed to persist address to namespaced storage', e);
        }
      }

      await fetchProfileData(userId);
      showToaster(isEditMode ? 'Address updated!' : 'Address saved successfully!', 'success');
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const error = err as Error;
      if (import.meta.env.DEV) console.error('Failed to save address', error);
      crashlytics.recordError(error instanceof Error ? error : new Error('AddAddressDetails failed to save address'), 'AddAddressDetails.saveAddress');
      showToaster(`Failed to save address: ${error.message || 'Unknown error'}`, 'error');
    }
  };
  const handleTagClick = (tagLabel: string) => {
    setSelectedTag(tagLabel);
    if (tagLabel !== 'Other') {
      setCustomLabel(''); // Clear custom label if switching back to standard
    }
    // Set "Save address as" dynamically
    if (tagLabel === 'Office') {
      setSaveAddressAs('Work');
    } else {
      setSaveAddressAs('');
    }
  };
  const handleSheetSave = (label: string) => {
    setCustomLabel(label);
    setIsSheetOpen(false);
    // Automatically attempt to save when sheet validates
    handleFinalSave(label);
  };
  const tags = [
    { label: 'Home', icon: Home },
    { label: 'Office', icon: Briefcase },
    { label: 'Other', icon: Navigation },
  ];
  // Dynamic placeholders per tag
  const getHousePlaceholder = () => {
    switch (selectedTag) {
      case 'Office': return 'Office Name / Floor';
      case 'Other': return 'Building / Floor';
      default: return 'House / Flat / Floor';
    }
  };
  const getAreaPlaceholder = () => {
    switch (selectedTag) {
      case 'Other': return 'Street (Recommended)';
      default: return 'Building / Street (Recommended)';
    }
  };
  // Helper to get input font class
  const getInputClass = (val: string) =>
    `w-full h-full bg-transparent border-none outline-none ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'} transition-all ${
      val ? 'font-bold' : 'font-light'
    } text-[14px] font-satoshi z-10 relative`;
  // Custom Input with Placeholder Overlay
  const renderInput = (
    id: string,
    value: string,
    setValue: (val: string) => void,
    placeholder: string,
    mandatory: boolean = false
  ) => {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="sr-only">
          {placeholder}
        </label>
        <div
          className={`h-[48px] rounded-full px-6 flex items-center relative transition-colors ${isDarkMode ? 'bg-brand-card-dark border border-brand-border-mid' : 'bg-brand-bg-light border border-brand-border-light'}`}
        >
          {!value && (
            <div className="absolute inset-0 px-6 flex items-center pointer-events-none">
              <span
                className={`font-light text-[14px] font-satoshi ${isDarkMode ? 'text-white opacity-50' : 'text-brand-text-dim2'}`}
              >
                {placeholder}
                {mandatory && <span className="text-brand-error ml-1">*</span>}
              </span>
            </div>
          )}
          <input
            id={id}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
            className={getInputClass(value)}
          />
        </div>
      </div>
    );
  };
  return (
    <div
      className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top relative ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'} text-brand-bg-deep`}
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-scroll safe-bottom relative z-10 font-sans">
        <div className="px-5 pb-8">
          {/* Header */}
          <div
            className={`flex items-center sticky top-0 z-50 pt-4 pb-2 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
            style={{ margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }}
          >
            <BackButton onClick={() => navigate(-1)} className="mr-2" />
            <h1
              className={`flex-1 text-center text-[22px] font-medium font-satoshi pr-10 ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
            >
              {isEditMode ? 'Edit Address' : 'Add New Address'}
            </h1>
          </div>

          <div className="flex flex-col gap-5 mt-6">
            {/* ── Receiver Details ── */}
            <div className="flex flex-col">
              <h2 className={`text-[14px] font-bold mb-3 px-1 ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}>
                Receiver Details
              </h2>
              {profileLoading ? (
                <div
                  className="w-full rounded-[16px] animate-pulse p-4 flex flex-col gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', height: '150px' }}
                >
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                  <div className="h-10 w-full rounded-[10px] bg-white/10" />
                  <div className="h-10 w-full rounded-[10px] bg-white/10" />
                </div>
              ) : (
                <div className={`rounded-[16px] p-3 border ${isDarkMode ? 'bg-brand-surface-dark border-white/5' : 'bg-white border-brand-border-light shadow-sm'}`}>
                <label 
                  className={`flex flex-col rounded-lg cursor-pointer ${useAccountDetails ? 'py-1 px-0.5' : 'px-2 py-1.5 mb-3'}`}
                  style={!useAccountDetails ? {
                    background: isDarkMode
                      ? 'linear-gradient(to right, hsl(var(--primary) / 0.75), transparent)'
                      : 'linear-gradient(to right, hsl(var(--primary) / 0.7), transparent)',
                  } : undefined}
                >
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={useAccountDetails}
                      onChange={(e) => setUseAccountDetails(e.target.checked)}
                      className="w-3.5 h-3.5 accent-brand-primary mr-2.5 rounded shrink-0"
                    />
                    <span className={`text-[13px] font-medium leading-none ${!useAccountDetails ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Use my account details
                    </span>
                  </div>
                  {useAccountDetails && (
                    <span className={`text-[12px] leading-none mt-1 ml-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {name || '—'} , {phone || '—'}
                    </span>
                  )}
                </label>

                {!useAccountDetails && (
                  <div className="space-y-[10px]">
                    {renderInput('addr-name', name, setName, 'Receiver name', true)}
                    <div
                      className={`h-[48px] rounded-full flex items-center relative overflow-hidden transition-colors ${isDarkMode ? 'bg-brand-card-dark border border-brand-border-mid' : 'bg-brand-bg-light border border-brand-border-light'}`}
                    >
                      <button 
                        aria-label="Select from contacts"
                        onClick={() => showToaster('Contact selection requires native plugin installation.', 'error')}
                        className={`pl-[24px] pr-[16px] h-full flex items-center justify-center ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-brand-bg-deep'}`}
                      >
                        <Contact className="w-[18px] h-[18px]" />
                      </button>
                      <div className={`h-[32px] w-[1px] ${isDarkMode ? 'bg-[#313131]' : 'bg-brand-border-light'}`}></div>
                      <div className="flex-1 ml-[22px] mr-[20px] relative h-full flex items-center">
                        {!phone && (
                          <div className="absolute inset-0 flex items-center pointer-events-none z-0">
                            <span className={`font-light text-[14px] font-satoshi ${isDarkMode ? 'text-white opacity-50' : 'text-brand-text-dim2'}`}>
                              Receiver number
                              <span className="text-brand-error ml-1">*</span>
                            </span>
                          </div>
                        )}
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                          className={getInputClass(phone)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* ── Location Details ── */}
            <div className="flex flex-col">
              <h2 className={`text-[14px] font-bold mb-3 px-1 ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}>
                Location Details
              </h2>
              <div className={`rounded-2xl p-3 border ${isDarkMode ? 'bg-brand-surface-dark border-white/5' : 'bg-white border-brand-border-light shadow-sm'}`}>
                {/* Tab Switch */}
                <div className={`flex rounded-full p-1 mb-4 ${isDarkMode ? 'bg-black/30' : 'bg-gray-100'}`}>
                  {tags.map(tag => {
                    const isSelected = selectedTag === tag.label;
                    const TagIcon = tag.icon;
                    return (
                      <button
                        key={tag.label}
                        onClick={() => handleTagClick(tag.label)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[12px] font-medium font-satoshi transition-all ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-brand-primary text-white shadow-md'
                              : 'bg-brand-bg-deep text-white shadow-md'
                            : isDarkMode
                              ? 'text-gray-400 hover:text-white'
                              : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <TagIcon className="w-3.5 h-3.5" />
                        {tag.label}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Inputs */}
                <div className="space-y-[10px] mb-4">
                  {renderInput('addr-house', house, setHouse, getHousePlaceholder(), true)}
                  {renderInput('addr-area', area, setArea, getAreaPlaceholder(), false)}
                  {renderInput('addr-landmark', landmark, setLandmark, 'Landmark (Optional)', false)}
                </div>

                {/* Area (read-only input) + Map Preview */}
                <div className="flex items-stretch gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div
                      className={`h-full min-h-[76px] rounded-xl px-4 py-3 flex flex-col justify-center transition-colors ${isDarkMode ? 'bg-brand-card-dark border border-brand-border-mid' : 'bg-brand-bg-light border border-brand-border-light'}`}
                    >
                      <span className={`text-[11px] font-medium font-satoshi ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Area
                      </span>
                      <span className={`text-[13px] font-satoshi line-clamp-3 mt-1 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                        {displayAddress || 'Location not set'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(-1)}
                    className={`w-[76px] min-h-[76px] rounded-xl relative overflow-hidden flex flex-col items-center justify-center shrink-0 border ${isDarkMode ? 'border-white/10 bg-[#222]' : 'border-gray-200 bg-blue-50'}`}
                  >
                    <div className="absolute inset-0 pointer-events-none z-0">
                      <React.Suspense fallback={<div className="w-full h-full bg-brand-bg-dark" />}>
                        <Map
                        initialViewState={{
                          longitude: mapLng,
                          latitude: mapLat,
                          zoom: 14,
                        }}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle={
                          isDarkMode
                            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                            : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
                        }
                        interactive={false}
                        attributionControl={false}
                      />
                      </React.Suspense>
                      <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>
                    </div>
                    
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-1">
                      <img loading="lazy" src={ASSETS.MAP_PIN_ICON} alt="Map Pin" className="w-5 h-6 drop-shadow-md" />
                    </div>
                    <span className="absolute bottom-1 left-0 right-0 text-brand-primary text-[10px] font-bold font-satoshi z-20 text-center drop-shadow-sm">
                      Change
                    </span>
                  </button>
                </div>

                {/* Save address as */}
                {renderInput('addr-save-as', saveAddressAs, setSaveAddressAs, 'Save address as', true)}
              </div>
            </div>

            {/* ── Delivery Instructions ── */}
            <div className="flex flex-col">
              <h2 className={`text-[14px] font-bold mb-3 px-1 ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}>
                Delivery Instructions <span className={`font-normal text-[12px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>(Optional)</span>
              </h2>
              <div
                className={`h-[48px] rounded-full px-6 flex items-center relative transition-colors ${isDarkMode ? 'bg-brand-card-dark border border-brand-border-mid' : 'bg-brand-bg-light border border-brand-border-light'}`}
              >
                <div className="flex-1 relative h-full flex items-center mr-2">
                  {!deliveryInstructions && (
                    <div className="absolute inset-0 flex items-center pointer-events-none z-0">
                      <span className={`font-light text-[14px] font-satoshi ${isDarkMode ? 'text-white opacity-50' : 'text-brand-text-dim2'}`}>
                        Instructions to reach location
                      </span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={e => setDeliveryInstructions(e.target.value)}
                    className={getInputClass(deliveryInstructions)}
                  />
                </div>
                <button
                  onClick={() => {
                    if (deliveryInstructions.trim()) {
                      showToaster('Delivery instruction added!', 'success');
                    }
                  }}
                  className="text-brand-primary text-[13px] font-bold font-satoshi shrink-0"
                >
                  ADD
                </button>
              </div>
            </div>

            {/* Save Address CTA */}
            <div className="flex flex-col gap-3 mt-1 mb-4">
              <Button
                onClick={() => handleInitialSave()}
                className="w-full rounded-full"
                variant="gradient"
                disabled={!isFormValid}
              >
                {isEditMode ? 'Save Changes' : 'Save Address'}
              </Button>
              {isEditMode && (
                <Button
                  onClick={() => navigate(-1)}
                  className={`w-full rounded-full border ${isDarkMode ? 'bg-brand-card-dark hover:bg-[#252525] text-white border-white/20' : 'bg-white hover:bg-gray-50 text-brand-bg-deep border-brand-border-light'}`}
                  variant="secondary"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* "Other" Tag Sheet */}
      <SaveAddressSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSheetSave}
        icon={ASSETS.OTHER}
      />

      {/* Confirm Details Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90%] max-w-sm bg-white dark:bg-brand-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-white/10 shadow-2xl relative overflow-hidden">
            
            {/* Map Pattern Background */}
            <div className="absolute top-0 left-0 right-0 h-32 z-0 opacity-70 dark:opacity-30 pointer-events-none">
              <React.Suspense fallback={<div className="w-full h-full bg-brand-bg-dark" />}>
                <Map
                initialViewState={{
                  longitude: mapLng,
                  latitude: mapLat,
                  zoom: 14,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={
                  isDarkMode
                    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
                }
                interactive={false}
                attributionControl={false}
              />
              </React.Suspense>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-[#1A1A1A]/70 dark:to-[#1A1A1A]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 pt-2">Confirm Details</h2>
              
              {/* Tag Row */}
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const ActiveIcon = tags.find(t => t.label === selectedTag)?.icon || MapPin;
                  return <ActiveIcon className="w-4 h-4 text-brand-primary" />;
                })()}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTag === 'Other' && customLabel ? customLabel : selectedTag}
                </span>
              </div>
              
              {/* Address String */}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {[house, area, landmark, locState?.addressLine].filter(Boolean).join(', ')}
              </p>
              
              {/* Receiver Row */}
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 font-medium">
                <PhoneIcon className="w-4 h-4 text-brand-primary" />
                <span>{name}, {phone}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-colors font-semibold text-center"
                >
                  Edit Details
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleFinalSave();
                  }}
                  className="flex-1 py-3 rounded-full bg-brand-primary text-white font-semibold text-center hover:bg-brand-primary/90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AddAddressDetails;
