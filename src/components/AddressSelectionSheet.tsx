import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { X, Search, Plus, MapPin, MessageSquareMore, Trash2 } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Geolocation } from '@capacitor/geolocation';
import { OpenLocationCode } from 'open-location-code';
import { fetchAddresses, deleteAddress } from '@/lib/addresses';
import { Address, SavedAddress } from '@/types';
import { GeocodeResult, reverseGeocode, forwardGeocode } from '@/utils/geoUtils';
import { supabase } from '@/lib/supabase';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useBackButtonHandler } from '@/hooks/useBackButtonHandler';
import { Capacitor } from '@capacitor/core';
import { readStorage, writeStorage, removeStorage, storageKey } from '@/utils/storage';
// Assets
import ConfirmationModal from '@/components/ConfirmationModal';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { ROUTES } from '@/routes';
interface AddressSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: SavedAddress | null) => void;
  onModalStateChange?: (isOpen: boolean) => void;
}
const AddressSelectionSheet: React.FC<AddressSelectionSheetProps> = ({
  isOpen,
  onClose,
  onAddressSelect,
  onModalStateChange,
}) => {
  const { profile, activeAddress, setActiveAddress } = useUser();
  const userId = profile?.id;
  const isDarkMode = useIsDarkMode();
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>('Fetching...');
  const [addressToDelete, setAddressToDelete] = useState<SavedAddress | null>(null);
  const [lastSelectedAddressId, setLastSelectedAddressId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseSafe = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isSubmitting) return;
    onClose();
  };
  // Fetch Current Location Name on Mount/Open
  useEffect(() => {
    const fetchCurrentLocationName = async () => {
      try {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          // Attempt request? Or just silent fail?
          // For now, silent fail or leave as placeholder
          return;
        }
        const position = await Geolocation.getCurrentPosition();
        const { latitude, longitude } = position.coords;
        const result = await reverseGeocode(latitude, longitude);
        if (result) {
          const area =
            result.address?.suburb ||
            result.address?.neighbourhood ||
            result.address?.city ||
            'Current Location';
          setCurrentLocationName(area);
        }
      } catch (e) {
        console.error('Failed to fetch current location name', e);
        setCurrentLocationName('Location unavailable');
      }
    };
    if (isOpen) {
      fetchCurrentLocationName();
    }
  }, [isOpen]);
  // Prevent background scroll bleed
  useBodyScrollLock(isOpen);
  useBackButtonHandler(isOpen, onClose);

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (isOpen && userId) {
        try {
          const data = await fetchAddresses(userId);
          // Map DB Address to SavedAddress UI Model
          const safeData = Array.isArray(data) ? data : [];
          const mapped: SavedAddress[] = safeData.map(d => ({
            id: d.id,
            user_id: d.user_id,
            created_at: d.created_at,
            label: d.label,
            apartment: d.apartment,
            contact_name: d.contact_name,
            contact_phone: d.contact_phone,
            plus_code: d.plus_code,
            tag: d.label || 'Home',
            house: d.apartment || '',
            area: d.area || '',
            landmark: d.landmark || '',
            name: d.contact_name || '',
            phone: d.contact_phone || '',
            displayAddress: `${d.apartment ? d.apartment + ', ' : ''}${d.area || ''}${d.city ? ', ' + d.city : ''}`,
            city: d.city || '',
            state: d.state || '',
            postcode: '', // Not stored
            plusCode: d.plus_code || '',
            latitude: d.latitude,
            longitude: d.longitude,
          }));
          setSavedAddresses(mapped);
        } catch (e: unknown) {
          console.error('Failed to load addresses', e);
          showToaster('Failed to load your saved addresses.', 'error');
        }
        // Load Selected Address from namespaced storage first, then migrate legacy keys
        // Prefer global active address from context (keeps UI in sync across screens)
        if (activeAddress) {
          setSelectedAddress(activeAddress);
          if (activeAddress.id) setLastSelectedAddressId(activeAddress.id);
        } else {
          const current = readStorage<SavedAddress>('user_address', userId);
          if (current) {
            setSelectedAddress(current);
            if (current.id) setLastSelectedAddressId(current.id);
          } else {
          // Check legacy key and migrate if it matches current user
          const legacy = localStorage.getItem('gridpe_user_address');
          if (legacy) {
            try {
              const parsed = JSON.parse(legacy);
              if (parsed?.user_id && parsed.user_id === userId) {
                writeStorage('user_address', parsed, userId);
                removeStorage('gridpe_user_address', userId);
                setSelectedAddress(parsed);
                if (parsed.id) setLastSelectedAddressId(parsed.id);
              } else {
                localStorage.removeItem('gridpe_user_address');
              }
            } catch (e) {
              localStorage.removeItem('gridpe_user_address');
              console.warn('Corrupted local address data cleared.');
            }
          }
        }

        const lastId = readStorage<string>('last_selected_address_id', userId);
        if (lastId) setLastSelectedAddressId(lastId as string);
      }
    };
    loadAddresses();
  }, [isOpen, userId]);
  // Search Logic
  const handleSearchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      // Simple search (no debounce for this quick implementation, or reuse util)
      try {
        const results = await forwardGeocode(query, 12.9716, 77.5946); // Default bias
        setSearchResults(results);
      } catch (e) {
        console.error('Search failed', e);
        showToaster('Search failed. Please try again.', 'error');
      }
    } else {
      setSearchResults([]);
    }
  };
  const handleSearchResultClick = (result: GeocodeResult) => {
    // Navigate to Map with coordinates
    navigate(ROUTES.ADD_ADDRESS, {
      state: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
    });
    // AddAddress needs to handle this state to center map
  };
  const handleUseCurrentLocation = async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        await Geolocation.requestPermissions();
      }
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const fullCode = OpenLocationCode.encode(latitude, longitude);
      // Reverse Geocode to get area name
      const result = await reverseGeocode(latitude, longitude);
      if (result) {
        const area =
          result.address?.suburb ||
          result.address?.neighbourhood ||
          result.address?.city ||
          'Current Location';
        setCurrentLocationName(area);
        const addressToSave: SavedAddress = {
          id: '',
          user_id: '',
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
          displayAddress: result.display_name,
          city: result.address?.city || '',
          state: result.address?.state || '',
          postcode: result.address?.postcode || '',
          latitude: latitude,
          longitude: longitude,
          plusCode: fullCode,
        };
        writeStorage('user_address', addressToSave, userId);
        try { setActiveAddress?.(addressToSave); } catch {}
        removeStorage('last_selected_address_id', userId);
        setLastSelectedAddressId(null);
        onAddressSelect(addressToSave);
        onClose();
      }
    } catch (e) {
      console.error('Location error', e);
    }
  };
  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddress(addr);
    if (addr.id) {
      setLastSelectedAddressId(addr.id);
      try { writeStorage('last_selected_address_id', addr.id, userId); } catch {}
    }
    try { writeStorage('user_address', addr, userId); } catch {}
    try { setActiveAddress?.(addr); } catch {}
    // Notify parent immediately
    onAddressSelect(addr);
  };
  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setAddressToDelete(savedAddresses[index]);
  };
  useEffect(() => {
    onModalStateChange?.(addressToDelete !== null);
  }, [addressToDelete, onModalStateChange]);
  const confirmDelete = async () => {
    if (!addressToDelete) return;
    const idToDelete = addressToDelete.id;
    const nameToDelete = addressToDelete.name || 'Address';
    // Close modal first so user sees the toaster clearly
    setAddressToDelete(null);
    showToaster('Processing deletion...', 'success');
    setIsSubmitting(true);
    if (!idToDelete || !userId) {
      showToaster('Error: Missing session or ID', 'error');
      setIsSubmitting(false);
      return;
    }
    try {
      await deleteAddress(idToDelete, userId);
      showToaster(`${nameToDelete} has been successfully deleted.`, 'delete');
      const newList = savedAddresses.filter(a => a.id !== idToDelete);
      setSavedAddresses(newList);
      if (newList.length === 0) {
        removeStorage('user_address', userId);
        removeStorage('last_selected_address_id', userId);
        setSelectedAddress(null);
        setLastSelectedAddressId(null);
        onAddressSelect(null);
        navigate(ROUTES.HOME);
        onClose();
      } else if (selectedAddress && selectedAddress.id === idToDelete) {
        removeStorage('user_address', userId);
        removeStorage('last_selected_address_id', userId);
        setSelectedAddress(null);
        setLastSelectedAddressId(null);
        onAddressSelect(null);
      }
      setIsSubmitting(false);
    } catch (err: unknown) {
      console.error('Failed to delete address', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete address. Please try again.';
      showToaster(errorMessage, 'error');
      setIsSubmitting(false);
    }
  };
  const handleEdit = (e: React.MouseEvent, addr: SavedAddress) => {
    e.stopPropagation();
    navigate(ROUTES.ADD_ADDRESS_DETAILS, {
      state: {
        id: addr.id,
        addressTitle: addr.tag,
        addressLine: addr.displayAddress,
        plusCode: addr.plusCode || '',
        city: addr.city,
        state: addr.state,
        postcode: addr.postcode,
        houseNumber: addr.house,
        road: addr.area,
        landmark: addr.landmark,
        name: addr.name,
        phone: addr.phone,
        tag: addr.tag,
      },
    });
  };
  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Home':
        return ASSETS.HOME_TAG;
      case 'Work':
        return ASSETS.WORK;
      case 'Friends & Family':
        return ASSETS.FRIENDS_FAMILY;
      case 'Other':
        return ASSETS.OTHER;
      default:
        return ASSETS.HOME_TAG;
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-10 ${isAndroid ? 'bg-black/60 pointer-events-auto' : 'bg-black/40 backdrop-blur-[2px] pointer-events-auto'}`} 
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCloseSafe(e); }} 
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-[90vh] rounded-t-[36px] flex flex-col ${isDarkMode ? 'bg-black' : 'bg-white'} pointer-events-auto z-20`}
        style={{
          boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.5)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          willChange: 'transform',
          transform: 'translateZ(0)',
          ...(isAndroid ? {
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.85)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          } : {})
        }}
      >
        {/* Drag Handle */}
        <div
          className={`w-10 h-1.5 rounded-full mx-auto mt-3 ${isDarkMode ? 'bg-white/20' : 'bg-black/20'}`}
        />
        {/* Sticky Header + Search */}
        <div className="shrink-0 px-5 pt-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-[18px] pt-2">
            <h2
              className={`text-[18px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Select Delivery Location
            </h2>
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCloseSafe(e); }}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
          </div>
          {/* Search Bar */}
          <div className="relative mb-[18px]">
            <div
              className={`h-[48px] rounded-full flex items-center px-4 transition-colors ${!isDarkMode ? 'bg-[#F2F4F7] border border-brand-border-light' : ''}`}
              style={{
                backgroundImage: isDarkMode ? `url(${ASSETS.SEARCH_BG})` : 'none',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <Search className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-black'}`} />
              <input
                type="text"
                placeholder="Search for area, street name..."
                className={`bg-transparent border-none outline-none text-[14px] font-satoshi flex-1 ${isDarkMode ? 'text-white placeholder:text-[#585858]' : 'text-black placeholder:text-[#666666]'}`}
                value={searchQuery}
                onChange={handleSearchInput}
              />
            </div>
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div
                className={`absolute top-[52px] w-full rounded-xl z-20 overflow-hidden max-h-[200px] overflow-y-auto ${isDarkMode ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-brand-border-light shadow-lg'} border`}
              >
                {searchResults.map((res, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 border-b cursor-pointer text-[14px] ${isDarkMode ? 'border-white/5 hover:bg-white/5 text-white' : 'border-gray-100 hover:bg-gray-50 text-black'}`}
                    onClick={() => handleSearchResultClick(res)}
                  >
                    {res.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-4"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {/* Static Actions Container */}
          <div
            className={`w-full rounded-[13px] mb-[32px] flex flex-col border ${isDarkMode ? 'bg-[#0D0D0D] border-white/5' : 'bg-white border-brand-border-light shadow-sm'}`}
          >
            {/* 1. Add New Address */}
            <div
              className={`flex items-center justify-between cursor-pointer px-3 pt-3 pb-2.5 ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
              onClick={() => navigate(ROUTES.ADD_ADDRESS)}
            >
              <div className="flex items-center gap-3">
                <Plus size={20} color="#5260FE" strokeWidth={2.5} />
                <p
                  className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-brand-primary'}`}
                >
                  Add address
                </p>
              </div>
              <img
                src={ASSETS.CHEVRONRIGHT}
                alt=""
                className="w-4 h-4 opacity-50"
                style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
              />
            </div>
            <div className={`h-[1px] w-full px-2 ${isDarkMode ? 'bg-white/5' : 'bg-brand-border-light'}`}>
              <div className="h-full w-full" />
            </div>
            {/* 2. Use Current Location */}
            <div
              className={`flex items-center justify-between cursor-pointer px-3 py-2.5 ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
              onClick={handleUseCurrentLocation}
            >
              <div className="flex items-center gap-3">
                <MapPin size={20} color="#5260FE" strokeWidth={2.5} />
                <div>
                  <p
                    className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-brand-primary'}`}
                  >
                    Use my current location
                  </p>
                  <p
                    className={`text-[12px] font-regular font-satoshi mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-black'}`}
                  >
                    {currentLocationName || 'Fetching location...'}
                  </p>
                </div>
              </div>
              <img
                src={ASSETS.CHEVRONRIGHT}
                alt=""
                className="w-4 h-4 opacity-50"
                style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
              />
            </div>
            <div className={`h-[1px] w-full px-2 ${isDarkMode ? 'bg-white/5' : 'bg-brand-border-light'}`}>
              <div className="h-full w-full" />
            </div>
            {/* 3. Request Address */}
            <div
              className={`w-full flex items-center justify-between cursor-pointer px-3 py-2.5 ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
              onClick={() => {}} // No-op as requested
            >
              <div className="flex items-center gap-3">
                <MessageSquareMore size={20} color="#5260FE" strokeWidth={2.5} />
                <p
                  className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-brand-primary'}`}
                >
                  Request address from someone else
                </p>
              </div>
              <img
                src={ASSETS.CHEVRONRIGHT}
                alt=""
                className="w-4 h-4 opacity-50"
                style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
              />
            </div>
          </div>
          {/* Saved Addresses Section */}
          <h3
            className={`text-[18px] font-bold font-satoshi mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Your saved addresses
          </h3>
          <div className="space-y-3 pb-20">
            {savedAddresses.map((addr, idx) => {
              const isActive =
                (lastSelectedAddressId && addr.id && lastSelectedAddressId === addr.id) ||
                (selectedAddress &&
                  ((selectedAddress.id && addr.id && selectedAddress.id === addr.id) ||
                    (!selectedAddress.id &&
                      addr.displayAddress === selectedAddress.displayAddress &&
                      addr.tag === selectedAddress.tag)));
              // Show border if this one is active
              const showBorder = !!isActive;
              // Show "Default" chip ONLY for the first added address (last in the sorted list)
              const showChip = idx === savedAddresses.length - 1;
              // Card Styling
              const cardBg = isDarkMode
                ? 'bg-[#0D0D0D]'
                : savedAddresses.length === 1
                  ? 'bg-white'
                  : 'bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.05)]';
              const cardBorder = showBorder
                ? 'border-brand-primary'
                : isDarkMode
                  ? 'border-transparent'
                  : 'border-brand-border-light';
              return (
                <div
                  key={addr.id || idx}
                  onClick={() => handleSelectAddress(addr)}
                  className={`rounded-[12px] p-[11px] relative border ${cardBg} ${cardBorder}`}
                  style={{
                    maxHeight: '131px',
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                  }}
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={getTagIcon(addr.tag)}
                        alt={addr.tag}
                        className="w-4 h-4"
                        style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
                      />
                      <span
                        className={`text-[16px] font-bold font-satoshi capitalize ${isDarkMode ? 'text-white' : 'text-black'}`}
                      >
                        {addr.tag}
                      </span>
                      {showChip && (
                        <div className="relative h-[26px] w-[79px] ml-2 flex items-center justify-center">
                          <img
                            src={ASSETS.SELECTED_ADDRESS}
                            alt="Selected"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={
                              !isDarkMode
                                ? { filter: 'hue-rotate(20deg) saturate(1.5)' }
                                : undefined
                            }
                          />
                          {/* Adjust selected bg filter if needed or use CSS for light mode pill */}
                          <span className="relative z-10 text-white text-[12px] font-medium font-satoshi">
                            Default
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-[13px]">
                      <button onClick={e => handleEdit(e, addr)}>
                        <img
                          src={ASSETS.EDIT}
                          alt="Edit"
                          className="w-[22px] h-[22px] opacity-70 hover:opacity-100"
                          style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
                        />
                      </button>
                      <button onClick={e => e.stopPropagation()}>
                        <img
                          src={ASSETS.SHARE}
                          alt="Share"
                          className="w-[22px] h-[22px] opacity-70 hover:opacity-100"
                          style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
                        />
                      </button>
                      <button onClick={e => handleDelete(e, idx)}>
                        <img
                          src={ASSETS.DELETE}
                          alt="Delete"
                          className="w-[22px] h-[22px] opacity-70 hover:opacity-100"
                          style={!isDarkMode ? { filter: 'invert(1)' } : undefined}
                        />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`h-[1px] w-full opacity-20 mb-[6px] ${isDarkMode ? 'bg-[#747474]' : 'bg-brand-border-light'}`}
                  />
                  {/* Address Details */}
                  <div className="px-[1px]">
                    <p
                      className={`text-[12px] font-regular font-satoshi leading-relaxed line-clamp-2 mb-[6px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      {addr.displayAddress}
                    </p>
                    <p
                      className={`text-[12px] font-regular font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      Phone number: {addr.phone}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={addressToDelete !== null}
        onClose={() => setAddressToDelete(null)}
        title="Are you sure you want to delete this address?"
        description={
          addressToDelete ? `${addressToDelete.name} | ${addressToDelete.displayAddress}` : ''
        }
        primaryButtonSrc={ASSETS.BUTTON_REMOVE_CARD}
        primaryText="Yes, Delete"
        onPrimaryClick={confirmDelete}
        secondaryButtonSrc={ASSETS.BUTTON_CANCEL_WIDE}
        secondaryText="No"
      />
    </div>
  );
};
export default AddressSelectionSheet;
