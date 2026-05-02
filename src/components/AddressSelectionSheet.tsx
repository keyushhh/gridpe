import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "next-themes";
import { X, Search, Plus, MapPin, MessageSquareMore } from "lucide-react";
import { reverseGeocode, forwardGeocode } from "@/utils/geoUtils";
import { Geolocation } from '@capacitor/geolocation';
import { OpenLocationCode } from "open-location-code";
import { fetchAddresses, deleteAddress } from "@/lib/addresses";
import { Address, SavedAddress } from "@/types";
import { supabase } from "@/lib/supabase";

// Assets
import chevronRight from "@/assets/chevron right.svg";
import homeIcon from "@/assets/HomeTag.svg";
import workIcon from "@/assets/Work.svg";
import friendsIcon from "@/assets/Friends Family.svg";
import otherIcon from "@/assets/Other.svg";
import editIcon from "@/assets/edit.svg";
import shareIcon from "@/assets/share.svg";
import deleteIcon from "@/assets/delete.svg";
import selectedAddressBg from "@/assets/selected-address.png";
import buttonCancelWide from "@/assets/button-cancel-wide.png";
import searchBg from "@/assets/search-bg.png";
import ConfirmationModal from "@/components/ConfirmationModal";
import buttonRemoveCard from "@/assets/button-remove-card.png";
import { useCustomToaster } from "@/contexts/CustomToasterContext";

interface AddressSelectionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onAddressSelect: (address: SavedAddress | null) => void;
    onModalStateChange?: (isOpen: boolean) => void;
}

const AddressSelectionSheet: React.FC<AddressSelectionSheetProps> = ({ isOpen, onClose, onAddressSelect, onModalStateChange }) => {
    const { profile } = useUser();
    const userId = profile?.id;
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';
    const navigate = useNavigate();
    const { showToaster } = useCustomToaster();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
    const [currentLocationName, setCurrentLocationName] = useState<string>("Fetching...");
    const [addressToDelete, setAddressToDelete] = useState<SavedAddress | null>(null);

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
                    const area = result.address?.suburb || result.address?.neighbourhood || result.address?.city || "Current Location";
                    setCurrentLocationName(area);
                }
            } catch (e) {
                console.error("Failed to fetch current location name", e);
                setCurrentLocationName("Location unavailable");
            }
        };

        if (isOpen) {
            fetchCurrentLocationName();
        }
    }, [isOpen]);

    // Load addresses
    useEffect(() => {
        const loadAddresses = async () => {
            if (isOpen && userId) {
                try {
                    const data = await fetchAddresses(userId);

                        // Map DB Address to SavedAddress UI Model
                        const mapped: SavedAddress[] = data.map(d => ({
                            id: d.id,
                            user_id: d.user_id,
                            created_at: d.created_at,
                            label: d.label,
                            apartment: d.apartment,
                            contact_name: d.contact_name,
                            contact_phone: d.contact_phone,
                            plus_code: d.plus_code,
                            tag: d.label || "Home",
                            house: d.apartment || "",
                            area: d.area || "",
                            landmark: d.landmark || "",
                            name: d.contact_name || "",
                            phone: d.contact_phone || "",
                            displayAddress: `${d.apartment ? d.apartment + ', ' : ''}${d.area || ''}${d.city ? ', ' + d.city : ''}`,
                            city: d.city || "",
                            state: d.state || "",
                            postcode: "", // Not stored
                            plusCode: d.plus_code || "",
                            latitude: d.latitude,
                            longitude: d.longitude
                        }));
                        setSavedAddresses(mapped);
                    } catch (e: any) {
                        console.error("Failed to load addresses", e);
                        showToaster("Failed to load your saved addresses.", "error");
                    }


                // Load Selected Address from local state only (active session)
                // We still keep the *currently selected* address in local storage for persistence across reloads during a session
                const current = localStorage.getItem("gridpe_user_address");
                if (current) {
                    try {
                        setSelectedAddress(JSON.parse(current));
                    } catch (e) {
                        localStorage.removeItem("gridpe_user_address");
                        console.warn("Corrupted local address data cleared.");
                    }
                }
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
                console.error("Search failed", e);
                showToaster("Search failed. Please try again.", "error");
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSearchResultClick = (result: any) => {
        // Navigate to Map with coordinates
        navigate('/add-address', {
            state: {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
            }
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

            // Generate full Plus Code
            const olc = new OpenLocationCode() as any;
            const fullCode = olc.encode(latitude, longitude);

            // Reverse Geocode to get area name
            const result = await reverseGeocode(latitude, longitude);
            if (result) {
                const area = result.address?.suburb || result.address?.neighbourhood || result.address?.city || "Current Location";
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
                    tag: "Current Location",
                    house: "",
                    area: area,
                    name: "You",
                    phone: "",
                    displayAddress: result.display_name,
                    city: result.address?.city || "",
                    state: result.address?.state || "",
                    postcode: result.address?.postcode || "",
                    latitude: latitude,
                    longitude: longitude,
                    plusCode: fullCode
                };
                localStorage.setItem("gridpe_user_address", JSON.stringify(addressToSave));
                onAddressSelect(addressToSave);
                onClose();
            }
        } catch (e) {
            console.error("Location error", e);
        }
    };

    const handleSelectAddress = (addr: SavedAddress) => {
        setSelectedAddress(addr);
        localStorage.setItem("gridpe_user_address", JSON.stringify(addr));
        // Notify parent immediately (optional, or wait for close)
        // "user taps ... automatically become selected"
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
        const nameToDelete = addressToDelete.name || "Address";

        // Close modal first so user sees the toaster clearly
        setAddressToDelete(null);
        showToaster("Processing deletion...", 'success');

        if (!idToDelete || !userId) {
            showToaster("Error: Missing session or ID", 'error');
            return;
        }

        try {
            await deleteAddress(idToDelete, userId);
            showToaster(`${nameToDelete} has been successfully deleted.`, 'delete');

            const newList = savedAddresses.filter(a => a.id !== idToDelete);
            setSavedAddresses(newList);

            if (newList.length === 0) {
                localStorage.removeItem("gridpe_user_address");
                setSelectedAddress(null);
                onAddressSelect(null);
                navigate('/home');
                onClose();
            } else if (selectedAddress && selectedAddress.id === idToDelete) {
                localStorage.removeItem("gridpe_user_address");
                setSelectedAddress(null);
                onAddressSelect(null);
            }
        } catch (err: any) {
            console.error("Failed to delete address", err);
            showToaster(err.message || "Failed to delete address. Please try again.", 'error');
        }
    };

    const handleEdit = (e: React.MouseEvent, addr: SavedAddress) => {
        e.stopPropagation();
        navigate('/add-address-details', {
            state: {
                id: addr.id,
                addressTitle: addr.tag,
                addressLine: addr.displayAddress,
                plusCode: addr.plusCode || "",
                city: addr.city,
                state: addr.state,
                postcode: addr.postcode,
                houseNumber: addr.house,
                road: addr.area,
                landmark: addr.landmark,
                name: addr.name,
                phone: addr.phone,
                tag: addr.tag
            }
        });
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

if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`relative w-full rounded-t-[36px] pt-4 pb-4 px-5 overflow-y-auto ${isDarkMode ? 'bg-black' : 'bg-white'}`}
                style={{
                    height: "794px",
                    boxShadow: "0px -4px 20px rgba(0, 0, 0, 0.5)",
                    bottom: 0,
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-[18px] pt-2">
                    <h2 className={`text-[18px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Select Delivery Location
                    </h2>
                    <button
                        onClick={onClose}
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                    >
                        <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-[18px]">
                    <div
                        className={`h-[48px] rounded-full flex items-center px-4 transition-colors ${!isDarkMode ? 'bg-[#F2F4F7] border border-[#E6E8EB]' : ''}`}
                        style={{
                            backgroundImage: isDarkMode ? `url(${searchBg})` : 'none',
                            backgroundSize: "100% 100%",
                            backgroundRepeat: "no-repeat",
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
                        <div className={`absolute top-[52px] w-full rounded-xl z-20 overflow-hidden max-h-[200px] overflow-y-auto ${isDarkMode ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-[#E6E8EB] shadow-lg'} border`}>
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

                {/* Static Actions Container */}
                <div
                    className={`w-full rounded-[13px] mb-[32px] flex flex-col border ${isDarkMode ? 'bg-[#0D0D0D] border-white/5' : 'bg-white border-[#E6E8EB] shadow-sm'}`}
                >
                    {/* 1. Add New Address */}
                    <div
                        className={`flex items-center justify-between cursor-pointer px-3 pt-3 pb-2.5 ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
                        onClick={() => navigate('/add-address')}
                    >
                        <div className="flex items-center gap-3">
                            <Plus size={20} color="#5260FE" strokeWidth={2.5} />
                            <p className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-[#5260FE]'}`}>Add address</p>
                        </div>
                        <img src={chevronRight} alt="" className="w-4 h-4 opacity-50" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                    </div>
                    <div className={`h-[1px] w-full px-2 ${isDarkMode ? 'bg-white/5' : 'bg-[#E6E8EB]'}`}>
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
                                <p className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-[#5260FE]'}`}>Use my current location</p>
                                <p className={`text-[12px] font-regular font-satoshi mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-black'}`}>
                                    {currentLocationName || "Fetching location..."}
                                </p>
                            </div>
                        </div>
                        <img src={chevronRight} alt="" className="w-4 h-4 opacity-50" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                    </div>
                    <div className={`h-[1px] w-full px-2 ${isDarkMode ? 'bg-white/5' : 'bg-[#E6E8EB]'}`}>
                        <div className="h-full w-full" />
                    </div>

                    {/* 3. Request Address */}
                    <div
                        className={`w-full flex items-center justify-between cursor-pointer px-3 py-2.5 ${isDarkMode ? 'active:bg-white/5' : 'active:bg-gray-50'}`}
                        onClick={() => { }} // No-op as requested
                    >
                        <div className="flex items-center gap-3">
                            <MessageSquareMore size={20} color="#5260FE" strokeWidth={2.5} />
                            <p className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-[#5260FE]'}`}>Request address from someone else</p>
                        </div>
                        <img src={chevronRight} alt="" className="w-4 h-4 opacity-50" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                    </div>
                </div>

                {/* Saved Addresses Section */}
                <h3 className={`text-[18px] font-bold font-satoshi mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Your saved addresses
                </h3>

                <div className="space-y-3 pb-20">
                    {savedAddresses.map((addr, idx) => {
                        const isSingleAddress = savedAddresses.length === 1;
                        const isActive = selectedAddress && (
                            (selectedAddress.id && addr.id && selectedAddress.id === addr.id) ||
                            (!selectedAddress.id && addr.displayAddress === selectedAddress.displayAddress && addr.tag === selectedAddress.tag)
                        );

                        // Show border only if multiple addresses and this one is active
                        const showBorder = !isSingleAddress && isActive;
                        // Show "Default" chip ONLY for the first added address (last in the sorted list)
                        const showChip = idx === savedAddresses.length - 1;

                        // Card Styling
                        const cardBg = isDarkMode
                            ? 'bg-[#0D0D0D]'
                            : (isSingleAddress ? 'bg-white' : 'bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.05)]');

                        const cardBorder = showBorder
                            ? (isDarkMode ? 'border-white/20' : 'border-[#5260FE]')
                            : (isDarkMode ? 'border-transparent' : 'border-[#E6E8EB]');

                        return (
                            <div
                                key={addr.id || idx}
                                onClick={() => handleSelectAddress(addr)}
                                className={`rounded-[12px] p-[11px] relative border ${cardBg} ${cardBorder}`}
                                style={{ maxHeight: "131px", willChange: 'transform', transform: 'translateZ(0)' }}
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
                                        <span className={`text-[16px] font-bold font-satoshi capitalize ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {addr.tag}
                                        </span>
                                        {showChip && (
                                            <div className="relative h-[26px] w-[79px] ml-2 flex items-center justify-center">
                                                <img src={selectedAddressBg} alt="Selected" className="absolute inset-0 w-full h-full object-contain" style={!isDarkMode ? { filter: 'hue-rotate(20deg) saturate(1.5)' } : undefined} />
                                                {/* Adjust selected bg filter if needed or use CSS for light mode pill */}
                                                <span className="relative z-10 text-white text-[12px] font-medium font-satoshi">Default</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-[13px]">
                                        <button onClick={(e) => handleEdit(e, addr)}>
                                            <img src={editIcon} alt="Edit" className="w-[22px] h-[22px] opacity-70 hover:opacity-100" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                                        </button>
                                        <button onClick={(e) => e.stopPropagation()}>
                                            <img src={shareIcon} alt="Share" className="w-[22px] h-[22px] opacity-70 hover:opacity-100" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                                        </button>
                                        <button onClick={(e) => handleDelete(e, idx)}>
                                            <img src={deleteIcon} alt="Delete" className="w-[22px] h-[22px] opacity-70 hover:opacity-100" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`h-[1px] w-full opacity-20 mb-[6px] ${isDarkMode ? 'bg-[#747474]' : 'bg-[#E6E8EB]'}`} />

                                {/* Address Details */}
                                <div className="px-[1px]">
                                    <p className={`text-[12px] font-regular font-satoshi leading-relaxed line-clamp-2 mb-[6px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {addr.displayAddress}
                                    </p>
                                    <p className={`text-[12px] font-regular font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        Phone number: {addr.phone}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={addressToDelete !== null}
                onClose={() => setAddressToDelete(null)}
                title="Are you sure you want to delete this address?"
                description={addressToDelete ? `${addressToDelete.name} | ${addressToDelete.displayAddress}` : ""}
                primaryButtonSrc={buttonRemoveCard}
                primaryText="Yes, Delete"
                onPrimaryClick={confirmDelete}
                secondaryButtonSrc={buttonCancelWide}
                secondaryText="No"
            />
        </div>
    );
};

export default AddressSelectionSheet;

