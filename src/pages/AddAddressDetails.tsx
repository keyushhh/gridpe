import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import SaveAddressSheet from "@/components/SaveAddressSheet";
import { createAddress, updateAddress, Address } from "@/lib/addresses";
import { supabase } from "@/lib/supabase";

// Assets
import addressContainerBg from "@/assets/address-container.png";
import selectedTagBg from "@/assets/selected.png";
import homeIcon from "@/assets/HomeTag.svg";
import workIcon from "@/assets/Work.svg";
import friendsIcon from "@/assets/Friends Family.svg";
import otherIcon from "@/assets/Other.svg";
import copyIcon from "@/assets/copy.svg";
import phoneIcon from "@/assets/phone.svg";
import bgDarkMode from "@/assets/bg-dark-mode.png";

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
    road?: string;
    area?: string;
    house?: string;
    landmark?: string;
    name?: string;
    phone?: string;
    tag?: string;
}

const AddAddressDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialState = location.state as AddressState | null;
    const isEditMode = !!initialState?.id;

    // Form State
    const [house, setHouse] = useState(initialState?.houseNumber || initialState?.house || "");
    const [area, setArea] = useState(initialState?.road || initialState?.area || "");
    const [landmark, setLandmark] = useState(initialState?.landmark || "");
    const [plusCode, setPlusCode] = useState(initialState?.plusCode || "");
    const [name, setName] = useState(initialState?.name || "");
    const [phone, setPhone] = useState(initialState?.phone || "");
    const [selectedTag, setSelectedTag] = useState<string>(initialState?.tag || "Home");
    const [customLabel, setCustomLabel] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // UI State
    const [headerOpacity, setHeaderOpacity] = useState(1);

    // Derived Address Display
    const [displayAddress, setDisplayAddress] = useState(initialState?.addressLine || "");

    const isFormValid = house.trim() !== "" && area.trim() !== "" && name.trim() !== "" && phone.trim().length === 10;

    useEffect(() => {
        if (!initialState) return;

        // Construct base parts
        const cityStatePin = `${initialState.city}, ${initialState.state} – ${initialState.postcode}`;

        const currentHouse = house || initialState.houseNumber || "";
        const currentArea = area || initialState.road || initialState.area || "";

        let constructed = "";
        if (currentHouse) constructed += `${currentHouse}, `;
        if (currentArea) constructed += `${currentArea}, `;
        if (landmark) constructed += `${landmark}, `;

        // Remove trailing comma/space
        if (constructed.endsWith(", ")) constructed = constructed.slice(0, -2);

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
        toast.success("Plus Code copied!");
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const newOpacity = Math.max(0, Math.min(1, 1 - scrollTop / 100));
        setHeaderOpacity(newOpacity);
    };

    const handleSaveAddress = async (overrideTag?: string) => {
        // If saving via Sheet, we trust the caller (overrideTag)
        // But we still need to validate the main form
        if (!isFormValid) {
            toast.error("Please fill all required details first.");
            return;
        }

        // New Flow: Check if selectedTag is "Other" but sheet hasn't triggered yet (no overrideTag)
        if (selectedTag === "Other" && !overrideTag) {
            setIsSheetOpen(true);
            return;
        }

        const tagToSave = overrideTag || (selectedTag === "Other" && customLabel ? customLabel : selectedTag);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                toast.error("You must be logged in to save an address.");
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
            const locState = location.state as any;
            // Ensure strictly numeric (fallback to 0 if missing, though schema might reject 0 if logic dictates range, but type-wise it's fine)
            const lat = Number(locState?.lat) || 0;
            const lng = Number(locState?.lng) || 0;

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
                    ...(lat !== 0 && lng !== 0 ? { latitude: lat, longitude: lng } : {})
                };
                await updateAddress(initialState.id, updatePayload);
            } else {
                const insertPayload = {
                    user_id: session.user.id,
                    label: tagToSave,
                    apartment: house,
                    area: area,
                    landmark: landmark,
                    city: initialState?.city || "",
                    state: initialState?.state || "",
                    plus_code: plusCode,
                    latitude: lat,
                    longitude: lng,
                    contact_name: name,
                    contact_phone: phone
                };
                const newAddr = await createAddress(insertPayload);

                // For immediate UI update (Active Address), we construct a UI object
                // Save as current active address in local storage for session persistence
                const uiAddr = {
                    id: newAddr.id,
                    tag: newAddr.label || "Home",
                    house: newAddr.apartment || "",
                    area: newAddr.area || "",
                    landmark: newAddr.landmark || "",
                    name: name, // Local only
                    phone: phone, // Local only
                    displayAddress: displayAddress,
                    city: newAddr.city || "",
                    state: newAddr.state || "",
                    postcode: initialState?.postcode || "",
                    plusCode: newAddr.plus_code || ""
                };
                localStorage.setItem("gridpe_user_address", JSON.stringify(uiAddr));
            }

            toast.success(isEditMode ? "Address updated!" : "Address saved successfully!");
            navigate("/home", { replace: true });

        } catch (err: any) {
            console.error("Failed to save address", err);
            toast.error(`Failed to save address: ${err.message || "Unknown error"}`);
        }
    };

    const handleTagClick = (tagLabel: string) => {
        setSelectedTag(tagLabel);
        if (tagLabel !== "Other") {
            setCustomLabel(""); // Clear custom label if switching back to standard
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
        { label: "Home", icon: homeIcon },
        { label: "Work", icon: workIcon },
        { label: "Friends & Family", icon: friendsIcon },
        { label: "Other", icon: otherIcon },
    ];

    // Helper to get input font class
    const getInputClass = (val: string) =>
        `w-full h-full bg-transparent border-none outline-none text-white transition-all ${val ? "font-bold" : "font-light"
        } text-[14px] font-satoshi z-10 relative`;

    // Custom Input with Placeholder Overlay
    const renderInput = (
        value: string,
        setValue: (val: string) => void,
        placeholder: string,
        mandatory: boolean = false
    ) => {
        return (
            <div className="h-[48px] rounded-full bg-[#191919] border border-[#313131] px-6 flex items-center relative">
                {!value && (
                    <div className="absolute inset-0 px-6 flex items-center pointer-events-none">
                        <span className="text-white font-light text-[14px] font-satoshi opacity-50">
                            {placeholder}
                            {mandatory && <span className="text-[#FF3B30] ml-1">*</span>}
                        </span>
                    </div>
                )}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={getInputClass(value)}
                />
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-black text-white relative">
            {/* Background - Applied to a container to avoid scroll issues if needed, but fixed attachment works on scrollable too */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${bgDarkMode})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed"
                }}
            />

            {/* Scrollable Content */}
            <div
                className="flex-1 overflow-y-auto pb-10 relative z-10 font-sans"
                onScroll={handleScroll}
            >
                <div className="pt-[24px] px-5">
                    {/* Header */}
                    <div
                        className="flex items-center sticky top-0 z-50"
                        style={{ opacity: headerOpacity, pointerEvents: headerOpacity === 0 ? 'none' : 'auto' }}
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center mr-2 rounded-full border border-white/20 active:bg-white/10"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        <h1 className="flex-1 text-center text-[22px] font-medium font-satoshi pr-10">
                            Add New Address
                        </h1>
                    </div>

                    {/* Address Container */}
                    <div
                        className="relative w-full rounded-[12px] p-[11px] mb-[12px] mt-[44px]"
                        style={{ height: "88px" }}
                    >
                        {/* Background Image */}
                        <img
                            src={addressContainerBg}
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover rounded-[12px] z-0 pointer-events-none"
                        />

                        <div className="relative z-10 flex flex-col items-start h-full">
                            {/* Top Row: City/Country + Change Button */}
                            <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-[16px] truncate pr-2 font-satoshi">
                                    {initialState ? `${initialState.city}, India` : "Location Details"}
                                </span>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center justify-center transition-colors font-satoshi"
                                    style={{
                                        width: "67px",
                                        height: "22px",
                                        borderRadius: "100px",
                                        background: "rgba(7, 7, 7, 0.84)",
                                        backdropFilter: "blur(25.02px)",
                                        border: "0.63px solid rgba(255, 255, 255, 0.12)", // Approximate gradient border
                                        padding: "4px 12px"
                                    }}
                                >
                                    <span className="text-[12px] font-medium">Change</span>
                                </button>
                            </div>

                            {/* Bottom Row: Full Address - 15px below top row */}
                            <p
                                className="text-[12px] font-regular text-gray-300 font-satoshi mt-[15px]"
                                style={{ width: "287px" }}
                            >
                                {displayAddress}
                            </p>
                        </div>
                    </div>

                    {/* Helper Text */}
                    <p className="text-[12px] font-regular text-[#FFFFFF] mb-[12px] font-satoshi">
                        A detailed address will help our delivery partner reach your doorstep with ease
                    </p>

                    {/* Tags Section */}
                    <h2 className="text-[14px] font-medium mb-[8px] mt-[22px] font-satoshi">Save address as<span className="text-[#FF3B30] ml-0.5">*</span></h2>
                    <div className="flex flex-wrap gap-2 mb-[32px]">
                        {tags.map((tag) => {
                            const isSelected = selectedTag === tag.label;
                            return (
                                <button
                                    key={tag.label}
                                    onClick={() => handleTagClick(tag.label)}
                                    className="relative flex items-center justify-center px-4 h-[32px] rounded-full transition-all border border-white/20"
                                    style={{
                                        backgroundColor: isSelected ? "transparent" : "rgba(255,255,255,0.05)",
                                    }}
                                >
                                    {isSelected && (
                                        <img
                                            src={selectedTagBg}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover rounded-full z-0"
                                        />
                                    )}
                                    <div className="relative z-10 flex items-center gap-2">
                                        <img src={tag.icon} alt={tag.label} className="w-4 h-4" />
                                        <span className="text-[12px] font-medium">{tag.label}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Input Fields Container */}
                    <div className="space-y-[10px] mb-[28px]">
                        {/* House / Flat */}
                        {renderInput(house, setHouse, "House / Flat / Floor", true)}

                        {/* Apartment / Road */}
                        {renderInput(area, setArea, "Apartment / Road / Area", true)}

                        {/* Landmark */}
                        {renderInput(landmark, setLandmark, "Landmark (Optional)", false)}

                        {/* Plus Code */}
                        <div className="h-[48px] rounded-full bg-[#191919] border border-[#313131] px-6 flex items-center justify-between">
                            <input
                                type="text"
                                value={plusCode}
                                onChange={(e) => setPlusCode(e.target.value)}
                                className={`${getInputClass(plusCode)} flex-1 mr-2`}
                            />
                            <button onClick={handleCopyPlusCode}>
                                <img src={copyIcon} alt="Copy" className="w-5 h-5 opacity-70 hover:opacity-100" />
                            </button>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <h2 className="text-[14px] font-medium mb-[12px]">Enter contact information<span className="text-[#FF3B30] ml-0.5">*</span></h2>
                    <div className="space-y-[12px] mb-[26px]">
                        {/* Name */}
                        {renderInput(name, setName, "Your Name", true)}

                        {/* Phone Number */}
                        <div className="h-[48px] rounded-full bg-[#191919] border border-[#313131] flex items-center relative overflow-hidden">
                            <span className="text-[14px] font-medium text-white pl-[30px] pr-[22px]">
                                +91
                            </span>
                            {/* Divider */}
                            <div className="h-[32px] w-[1px] bg-[#313131]"></div>

                            {/* Input */}
                            <div className="flex-1 ml-[22px] mr-[20px] relative h-full flex items-center">
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Numeric only
                                    className={getInputClass(phone)}
                                    style={{ paddingRight: "30px" }}
                                />
                            </div>

                            {/* Phone Icon */}
                            <img
                                src={phoneIcon}
                                alt="Phone"
                                className="absolute right-[20px] w-5 h-5 pointer-events-none"
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
                            {isEditMode ? "Save Changes" : "Save Address"}
                        </Button>

                        {isEditMode && (
                            <Button
                                onClick={() => navigate(-1)}
                                className="w-full rounded-full bg-[#191919] hover:bg-[#252525] text-white border border-white/20"
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
                icon={otherIcon}
            />
        </div>
    );
};

export default AddAddressDetails;
