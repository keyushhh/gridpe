import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search } from "lucide-react";
import { forwardGeocode } from "@/utils/geoUtils";
import { Geolocation } from '@capacitor/geolocation';
import { reverseGeocode } from "@/utils/geoUtils";
import { fetchAddresses, deleteAddress, Address } from "@/lib/addresses";
import { supabase } from "@/lib/supabase";

// Assets
import locationIcon from "@/assets/location-pin.svg"; // Fallback, will try to use specific assets
import addPlusIcon from "@/assets/add plus.svg";
import currentLocationIcon from "@/assets/current-location.svg";
import navIcon from "@/assets/navigation icon.svg";
import chatIcon from "@/assets/chat.svg";
import chevronRight from "@/assets/chevron right.svg";
import homeIcon from "@/assets/HomeTag.svg";
import workIcon from "@/assets/Work.svg";
import friendsIcon from "@/assets/Friends Family.svg";
import otherIcon from "@/assets/Other.svg";
import editIcon from "@/assets/edit.svg";
import shareIcon from "@/assets/share.svg";
import deleteIcon from "@/assets/delete.svg";
import selectedAddressBg from "@/assets/selected-address.png";
import popBgDefault from "@/assets/pop-bg-default.png";
import buttonCancelWide from "@/assets/button-cancel-wide.png";
import searchBg from "@/assets/search-bg.png";
import { useCustomToaster } from "@/contexts/CustomToasterContext";

// Adapted to match UI needs while using DB Address type
interface SavedAddress extends Partial<Address> {
    id?: string;
    tag: string; // Mapped from label
    house: string; // Mapped from apartment
    area: string; // Mapped from area
    landmark?: string;
    name: string; // Local only
    phone: string; // Local only
    displayAddress: string; // Constructed
    city: string;
    state: string;
    postcode: string;
    plusCode?: string;
}

interface AddressSelectionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onAddressSelect: (address: SavedAddress | null) => void;
}

const AddressSelectionSheet: React.FC<AddressSelectionSheetProps> = ({ isOpen, onClose, onAddressSelect }) => {
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
            if (isOpen) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        const data = await fetchAddresses(session.user.id);

                        // Map DB Address to SavedAddress UI Model
                        const mapped: SavedAddress[] = data.map(d => ({
                            id: d.id,
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
                    }
                } catch (e) {
                    console.error("Failed to load addresses", e);
                }

                // Load Selected Address from local state only (active session)
                // We still keep the *currently selected* address in local storage for persistence across reloads during a session
                const current = localStorage.getItem("gridpe_user_address");
                if (current) {
                    try {
                        setSelectedAddress(JSON.parse(current));
                    } catch (e) { }
                }
            }
        };
        loadAddresses();
    }, [isOpen]);

    // Search Logic
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            // Simple search (no debounce for this quick implementation, or reuse util)
            try {
                const results = await forwardGeocode(query, 12.9716, 77.5946); // Default bias
                setSearchResults(results);
            } catch (e) {
                console.error(e);
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

            // Reverse Geocode to get area name
            const result = await reverseGeocode(latitude, longitude);
            if (result) {
                const area = result.address?.suburb || result.address?.neighbourhood || result.address?.city || "Current Location";
                setCurrentLocationName(area);

                // We set a "Temporary" address as selected?
                // The prompt says: "use current location... (to showcase only the area name)"
                // And logic: "should grab GPS... reverse geocode... set as active address immediately"

                const tempAddr: SavedAddress = {
                    tag: "Current Location",
                    house: "",
                    area: area,
                    name: "You",
                    phone: "",
                    displayAddress: result.display_name,
                    city: result.address?.city || "",
                    state: result.address?.state || "",
                    postcode: result.address?.postcode || ""
                };

                localStorage.setItem("gridpe_user_address", JSON.stringify(tempAddr));
                onAddressSelect(tempAddr);
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

    const confirmDelete = async () => {
        if (!addressToDelete || !addressToDelete.id) return;

        try {
            await deleteAddress(addressToDelete.id);

            // Show Toaster
            // "Nisha Paliwal | C102..." -> we need the name from contact info
            // Requirement: "Nisha Paliwal has been successfully deleted."
            const name = addressToDelete.name || "Address";
            showToaster(`${name} has been successfully deleted.`);

            const newList = savedAddresses.filter(a => a.id !== addressToDelete.id);
            setSavedAddresses(newList);
            setAddressToDelete(null);

            // If list becomes empty, clear active address and maybe redirect
            if (newList.length === 0) {
                localStorage.removeItem("gridpe_user_address");
                setSelectedAddress(null);
                onAddressSelect(null);
                // Requirement: "redirect the user to the address selection screen, or back home (if there's 0 addresses saved after the deletion)"
                // Since we are IN the address selection screen (sheet), if it's empty, we might want to close it and go home?
                // "back home (if there's 0 addresses...)" implies leaving the sheet context if it was opened from somewhere else, or just going to /home
                navigate('/home');
                onClose();
            } else if (selectedAddress) {
                // Check if deleted was selected
                if (selectedAddress.id === addressToDelete.id) {
                    localStorage.removeItem("gridpe_user_address");
                    setSelectedAddress(null);
                    onAddressSelect(null);
                }
            }
        } catch (err) {
            console.error("Failed to delete address", err);
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
                className="relative w-full bg-black rounded-t-[36px] pt-4 pb-4 px-5 overflow-y-auto"
                style={{
                    height: "794px", // Fixed height as requested
                    boxShadow: "0px -4px 20px rgba(0, 0, 0, 0.5)",
                    bottom: 0 // Start directly from bottom
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-[18px] pt-2">
                    <h2 className="text-white text-[18px] font-bold font-satoshi">
                        Select Delivery Location
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-[18px]">
                    <div
                        className="h-[48px] rounded-full flex items-center px-4"
                        style={{
                            backgroundImage: `url(${searchBg})`,
                            backgroundSize: "100% 100%",
                            backgroundRepeat: "no-repeat",
                        }}
                    >
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Search for area, street name..."
                            className="bg-transparent border-none outline-none text-white text-[14px] font-satoshi flex-1 placeholder:text-[#585858]"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-[52px] w-full bg-[#1A1A1A] rounded-xl z-20 overflow-hidden max-h-[200px] overflow-y-auto border border-white/10">
                            {searchResults.map((res, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer text-white text-[14px]"
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
                    className="bg-[#0D0D0D] rounded-[13px] mb-[32px] flex flex-col border border-white/5"
                    style={{ maxHeight: "153px" }}
                >
                    {/* 1. Add New Address */}
                    <div
                        className="flex items-center justify-between cursor-pointer active:bg-white/5"
                        style={{ paddingTop: '12px', paddingLeft: '10.5px', paddingRight: '10.5px', paddingBottom: '10px' }}
                        onClick={() => navigate('/add-address')}
                    >
                        <div className="flex items-center gap-3">
                            <img src={addPlusIcon} alt="" className="w-5 h-5 opacity-80" />
                            <p className="text-white text-[14px] font-medium font-satoshi">Add address</p>
                        </div>
                        <img src={chevronRight} alt="" className="w-4 h-4 opacity-50" />
                    </div>
                    <div className="h-[1px] bg-white/5 w-full px-2">
                        <div className="h-full bg-white/5 w-full" />
                    </div>

                    {/* 2. Use Current Location */}
                    <div
                        className="flex items-center justify-between cursor-pointer active:bg-white/5"
                        style={{ paddingTop: '10px', paddingLeft: '10.5px', paddingRight: '10.5px', paddingBottom: '10px' }}
                        onClick={handleUseCurrentLocation}
                    >
                        <div className="flex items-center gap-3">
                            <img src={currentLocationIcon} alt="" style={{ width: '15px', height: '18px' }} className="opacity-80" />
                            <div>
                                <p className="text-white text-[14px] font-medium font-satoshi">Use my current location</p>
                                <p className="text-white/30 text-[12px] font-regular font-satoshi mt-0.5">
                                    {currentLocationName || "Fetching location..."}
                                </p>
                            </div>
                        </div>
                        <img src={chevronRight} alt="" className="w-4 h-4 opacity-50" />
                    </div>
                    <div className="h-[1px] bg-white/5 w-full px-2">
                        <div className="h-full bg-white/5 w-full" />
                    </div>

                    {/* 3. Request Address */}
                    <div
                        className="flex items-center justify-between cursor-pointer active:bg-white/5"
                        style={{ paddingTop: '10px', paddingLeft: '10.5px', paddingRight: '10.5px', paddingBottom: '12px' }}
                        onClick={() => { }} // No-op as requested
                    >
                        <div className="flex items-center gap-3">
                            <img src={chatIcon} alt="" className="w-5 h-5 opacity-80" />
                            <p className="text-white text-[14px] font-medium font-satoshi">Request address from someone else</p>
                        </div>
                        <img src={chevronRight} alt="" className="w-4 h-4 opacity-50" />
                    </div>
                </div>

                {/* Saved Addresses Section */}
                <h3 className="text-white text-[18px] font-bold font-satoshi mb-[12px]">
                    Your saved addresses
                </h3>

                <div className="space-y-3 pb-20">
                    {savedAddresses.map((addr, idx) => {
                        const isSelected = selectedAddress && (
                            (selectedAddress.id && addr.id && selectedAddress.id === addr.id) ||
                            (!selectedAddress.id && addr.displayAddress === selectedAddress.displayAddress && addr.tag === selectedAddress.tag)
                        );

                        return (
                            <div
                                key={idx}
                                onClick={() => handleSelectAddress(addr)}
                                className={`bg-[#0D0D0D] rounded-[12px] p-[11px] relative border ${isSelected ? 'border-white/20' : 'border-transparent'}`}
                                style={{ maxHeight: "131px" }}
                            >
                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <img src={getTagIcon(addr.tag)} alt={addr.tag} className="w-4 h-4" />
                                        <span className="text-white text-[16px] font-bold font-satoshi capitalize">
                                            {addr.tag}
                                        </span>
                                        {isSelected && (
                                            <div className="relative h-[26px] w-[79px] ml-2 flex items-center justify-center">
                                                <img src={selectedAddressBg} alt="Selected" className="absolute inset-0 w-full h-full object-contain" />
                                                <span className="relative z-10 text-white text-[12px] font-medium font-satoshi">Selected</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-[13px]">
                                        <button onClick={(e) => handleEdit(e, addr)}>
                                            <img src={editIcon} alt="Edit" className="w-[22px] h-[22px] opacity-70 hover:opacity-100" />
                                        </button>
                                        <button onClick={(e) => e.stopPropagation()}>
                                            <img src={shareIcon} alt="Share" className="w-[22px] h-[22px] opacity-70 hover:opacity-100" />
                                        </button>
                                        <button onClick={(e) => handleDelete(e, idx)}>
                                            <img src={deleteIcon} alt="Delete" className="w-[22px] h-[22px] opacity-70 hover:opacity-100" />
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-[#747474] w-full opacity-20 mb-[6px]" />

                                {/* Address Details */}
                                <div className="px-[1px]">
                                    <p className="text-white text-[12px] font-regular font-satoshi leading-relaxed line-clamp-2 mb-[6px]">
                                        {addr.displayAddress}
                                    </p>
                                    <p className="text-white text-[12px] font-regular font-satoshi">
                                        Phone number: {addr.phone}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Delete Confirmation Popup */}
            {addressToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setAddressToDelete(null)}
                    />

                    {/* Modal */}
                    <div
                        className="relative flex flex-col items-center"
                        style={{
                            width: '362px',
                            height: '270px',
                            backgroundImage: `url(${popBgDefault})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            paddingTop: '20px',
                            paddingBottom: '20px',
                            paddingLeft: '17px',
                            paddingRight: '17px',
                            borderRadius: '32px'
                        }}
                    >
                        {/* Header */}
                        <h2 className="text-white text-[18px] font-bold font-satoshi text-center leading-tight">
                            Are you sure you want to<br />delete this address?
                        </h2>

                        <div className="h-[16px]" />

                        {/* Body */}
                        <p className="text-white text-[14px] font-regular font-satoshi text-center px-2 line-clamp-2">
                            {addressToDelete.name} | {addressToDelete.displayAddress}
                        </p>

                        <div className="h-[24px]" />

                        {/* CTA 1: Yes, Delete */}
                        <button
                            onClick={confirmDelete}
                            className="w-full h-[48px] rounded-full flex items-center justify-center text-white text-[16px] font-bold font-satoshi"
                            style={{
                                backgroundColor: '#FF1E1E',
                                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            Yes, Delete
                        </button>

                        <div className="h-[10px]" />

                        {/* CTA 2: No */}
                        <button
                            onClick={() => setAddressToDelete(null)}
                            className="w-full h-[48px] relative flex items-center justify-center"
                        >
                            <img
                                src={buttonCancelWide}
                                alt="No"
                                className="absolute inset-0 w-full h-full object-fill"
                            />
                            <span className="relative z-10 text-white text-[16px] font-bold font-satoshi">
                                No
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressSelectionSheet;
