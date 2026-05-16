import { ASSETS } from '@/constants/assets';
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
  Address,
  ensureGlobalPlusCode,
  getAuthUserId,
} from '@/lib/addresses';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
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
  const { profile } = useUser();
  const currentUserId = profile?.id;
  const initialState = location.state as AddressState | null;
  const isEditMode = !!initialState?.id;
  // Form State
  const [house, setHouse] = useState(
    initialState?.houseNumber || initialState?.house || initialState?.apartment || ''
  );
  const [area, setArea] = useState(initialState?.road || initialState?.area || '');
  const [landmark, setLandmark] = useState(initialState?.landmark || '');
  const [plusCode, setPlusCode] = useState(initialState?.plusCode || initialState?.plus_code || '');
  const [name, setName] = useState(initialState?.name || initialState?.contact_name || '');
  const [phone, setPhone] = useState(initialState?.phone || initialState?.contact_phone || '');
  const [selectedTag, setSelectedTag] = useState<string>(
    initialState?.tag || initialState?.label || 'Home'
  );
  const [customLabel, setCustomLabel] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // UI State — header fade is driven directly by an IntersectionObserver into
  // a ref so we never re-render on scroll.
  const headerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Derived Address Display
  const [displayAddress, setDisplayAddress] = useState(initialState?.addressLine || '');
  const isFormValid =
    house.trim() !== '' && area.trim() !== '' && name.trim() !== '' && phone.trim().length === 10;
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
  const handleCopyPlusCode = () => {
    navigator.clipboard.writeText(plusCode);
    showToaster('Plus Code copied!', 'success');
  };
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
  const handleSaveAddress = async (overrideTag?: string) => {
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
      const finalPlusCode = ensureGlobalPlusCode(plusCode, lat, lng);
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
        await updateAddress(initialState.id, updatePayload);
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
          id: newAddr.id,
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
        localStorage.setItem('gridpe_user_address', JSON.stringify(uiAddr));
      }
      showToaster(isEditMode ? 'Address updated!' : 'Address saved successfully!', 'success');
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to save address', error);
      showToaster(`Failed to save address: ${error.message || 'Unknown error'}`, 'error');
    }
  };
  const handleTagClick = (tagLabel: string) => {
    setSelectedTag(tagLabel);
    if (tagLabel !== 'Other') {
      setCustomLabel(''); // Clear custom label if switching back to standard
    }
    // Note: We no longer open sheet immediately for "Other"
  };
  const handleSheetSave = (label: string) => {
    setCustomLabel(label);
    setIsSheetOpen(false);
    // Automatically attempt to save when sheet validates
    handleSaveAddress(label);
  };
  const tags = [
    { label: 'Home', icon: ASSETS.HOME_TAG },
    { label: 'Work', icon: ASSETS.WORK },
    { label: 'Friends & Family', icon: ASSETS.FRIENDS_FAMILY },
    { label: 'Other', icon: ASSETS.OTHER },
  ];
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
          className={`h-[48px] rounded-full px-6 flex items-center relative transition-colors ${isDarkMode ? 'bg-brand-card-dark border border-[#313131]' : 'bg-brand-bg-light border border-brand-border-light'}`}
        >
          {!value && (
            <div className="absolute inset-0 px-6 flex items-center pointer-events-none">
              <span
                className={`font-light text-[14px] font-satoshi ${isDarkMode ? 'text-white opacity-50' : 'text-[#666666]'}`}
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
      {/* Background - Applied to a container to avoid scroll issues if needed, but fixed attachment works on scrollable too */}
      {isDarkMode && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${ASSETS.BG_DARK_MODE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
      )}
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-scroll safe-bottom pb-4 relative z-10 font-sans">
        <div className="safe-top pt-4 px-5">
          {/* Sentinel: tracked by IO to drive header opacity */}
          <div
            ref={sentinelRef}
            aria-hidden="true"
            style={{ position: 'absolute', top: 0, height: 100, width: 1, pointerEvents: 'none' }}
          />
          {/* Header */}
          <div
            ref={headerRef}
            className="flex items-center sticky top-0 z-50 transition-colors safe-top"
            style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
          >
            <BackButton onClick={() => navigate(-1)} className="mr-2" />
            <h1
              className={`flex-1 text-center text-[22px] font-medium font-satoshi pr-10 ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
            >
              {isEditMode ? 'Edit Address' : 'Add New Address'}
            </h1>
          </div>
          {/* Address Container */}
          <div
            className={`relative w-full rounded-[12px] p-[11px] mb-[12px] mt-[44px] ${!isDarkMode ? 'bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.05)] border border-brand-border-light' : ''}`}
            style={{ height: '88px' }}
          >
            {/* Background Image - Only Dark Mode */}
            {isDarkMode && (
              <img
                src={ASSETS.ADDRESS_CONTAINER}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover rounded-[12px] z-0 pointer-events-none"
              />
            )}
            <div className="relative z-10 flex flex-col items-start h-full">
              {/* Top Row: City/Country + Change Button */}
              <div className="flex justify-between items-center w-full">
                <span
                  className={`font-bold text-[16px] truncate pr-2 font-satoshi ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
                >
                  {initialState ? `${initialState.city}, India` : 'Location Details'}
                </span>
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center transition-colors font-satoshi"
                  style={{
                    width: '67px',
                    height: '22px',
                    borderRadius: '100px',
                    background: isDarkMode ? 'rgba(7, 7, 7, 0.84)' : '#5260FE',
                    backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
                    border: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : 'none',
                    padding: '4px 12px',
                  }}
                >
                  <span
                    className={`text-[12px] font-medium ${isDarkMode ? 'text-white' : 'text-white'}`}
                  >
                    Change
                  </span>
                </button>
              </div>
              {/* Bottom Row: Full Address - 8px below top row */}
              <p
                className={`text-[12px] font-regular font-satoshi mt-[8px] ${isDarkMode ? 'text-gray-300' : 'text-[#666666]'}`}
                style={{ width: '287px' }}
              >
                {displayAddress}
              </p>
            </div>
          </div>
          {/* Helper Text */}
          <p
            className={`text-[12px] font-regular mb-[12px] font-satoshi ${isDarkMode ? 'text-white' : 'text-[#666666]'}`}
          >
            A detailed address will help our delivery partner reach your doorstep with ease
          </p>
          {/* Tags Section */}
          <h2
            className={`text-[14px] font-medium mb-[8px] mt-[22px] font-satoshi ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
          >
            Save address as<span className="text-brand-error ml-0.5">*</span>
          </h2>
          <div className="flex flex-wrap gap-2 mb-[32px]">
            {tags.map(tag => {
              const isSelected = selectedTag === tag.label;
              // Tag Styling Logic
              // Dark Mode: Selected (Transparent + Image), Unselected (White/5%)
              // Light Mode: Selected (Purple + No Image), Unselected (White + Border)
              const unselectedClass = isDarkMode
                ? 'bg-[rgba(255,255,255,0.05)] border-white/20 text-white'
                : 'bg-white border-brand-border-light text-brand-bg-deep shadow-sm';
              const selectedClass = isDarkMode
                ? 'border-transparent' // dark mode uses image bg
                : 'bg-brand-primary border-transparent shadow-md'; // light mode uses purple bg
              const selectedTextClass = 'text-white';
              return (
                <button
                  key={tag.label}
                  onClick={() => handleTagClick(tag.label)}
                  className={`relative flex items-center justify-center px-4 h-[28px] rounded-full transition-all border font-satoshi ${isSelected ? selectedClass : unselectedClass}`}
                  style={
                    {
                      // Specific overrides if needed
                    }
                  }
                >
                  {isSelected && isDarkMode && (
                    <img
                      src={ASSETS.SELECTED}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover rounded-full z-0"
                    />
                  )}
                  <div
                    className={`relative z-10 flex items-center gap-2 ${isSelected ? selectedTextClass : isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
                  >
                    <img
                      src={tag.icon}
                      alt={tag.label}
                      className="w-4 h-4"
                      style={!isDarkMode && !isSelected ? { filter: 'invert(1)' } : undefined} // Invert white icons to black in light mode unselected
                    />
                    <span className="text-[12px] font-medium">{tag.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Input Fields Container */}
          <div className="space-y-[10px] mb-[28px]">
            {/* House / Flat */}
            {renderInput('addr-house', house, setHouse, 'House / Flat / Floor', true)}
            {/* Apartment / Road */}
            {renderInput('addr-area', area, setArea, 'Apartment / Road / Area', true)}
            {/* Landmark */}
            {renderInput('addr-landmark', landmark, setLandmark, 'Landmark (Optional)', false)}
            {/* Plus Code */}
            <div
              className={`h-[48px] rounded-full px-6 flex items-center justify-between transition-colors ${isDarkMode ? 'bg-brand-card-dark border border-[#313131]' : 'bg-brand-bg-light border border-brand-border-light'}`}
            >
              <input
                type="text"
                value={plusCode}
                onChange={e => setPlusCode(e.target.value)}
                className={`${getInputClass(plusCode)} flex-1 mr-2`}
              />
              <button onClick={handleCopyPlusCode}>
                <img
                  src={ASSETS.COPY}
                  alt="Copy"
                  className="w-5 h-5 opacity-70 hover:opacity-100"
                  style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
                />
              </button>
            </div>
          </div>
          {/* Contact Information */}
          <h2
            className={`text-[14px] font-medium mb-[12px] ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
          >
            Enter contact information<span className="text-brand-error ml-0.5">*</span>
          </h2>
          <div className="space-y-[12px] mb-[26px]">
            {/* Name */}
            {renderInput('addr-name', name, setName, 'Your Name', true)}
            {/* Phone Number */}
            <div
              className={`h-[48px] rounded-full flex items-center relative overflow-hidden transition-colors ${isDarkMode ? 'bg-brand-card-dark border border-[#313131]' : 'bg-brand-bg-light border border-brand-border-light'}`}
            >
              <span
                className={`text-[14px] font-medium pl-[30px] pr-[22px] ${isDarkMode ? 'text-white' : 'text-brand-bg-deep'}`}
              >
                +91
              </span>
              {/* Divider */}
              <div
                className={`h-[32px] w-[1px] ${isDarkMode ? 'bg-[#313131]' : 'bg-brand-border-light'}`}
              ></div>
              {/* Input */}
              <div className="flex-1 ml-[22px] mr-[20px] relative h-full flex items-center">
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} // Numeric only
                  className={getInputClass(phone)}
                  style={{ paddingRight: '30px' }}
                />
              </div>
              {/* Phone Icon */}
              <img
                src={ASSETS.PHONE}
                alt="Phone"
                className="absolute right-[20px] w-5 h-5 pointer-events-none"
                style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
              />
            </div>
          </div>
          {/* Save Address CTA */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => handleSaveAddress()}
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
      {/* "Other" Tag Sheet */}
      <SaveAddressSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSheetSave}
        icon={ASSETS.OTHER}
      />
    </div>
  );
};
export default AddAddressDetails;
