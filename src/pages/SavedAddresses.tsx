import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, X } from "lucide-react";
import { fetchAddresses, deleteAddress, Address } from "@/lib/addresses";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import buttonRemoveCard from "@/assets/button-remove-card.png";
import { Share } from '@capacitor/share';
import { hapticWarning } from "@/utils/haptics";

// Assets
import bgDarkMode from "@/assets/bg-dark-mode.png";
import bgLight from "@/assets/bg-light.png";
import homeIcon from "@/assets/HomeTag.svg";
import workIcon from "@/assets/Work.svg";
import friendsIcon from "@/assets/Friends Family.svg";
import otherIcon from "@/assets/Other.svg";
import editIcon from "@/assets/edit.svg";
import shareIcon from "@/assets/share.svg";
import deleteIcon from "@/assets/delete.svg";
import popBgDefault from "@/assets/pop-bg-default.png";
import buttonCancelWide from "@/assets/button-cancel-wide.png";
import searchBg from "@/assets/search-bg.png";

const SavedAddresses = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { showToaster } = useCustomToaster();
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || (supabase as any).USER_ID || "414c977e-6f70-4f57-bfa1-af0a8a2053a4";

            if (userId) {
                const data = await fetchAddresses(userId);
                setAddresses(data);
            }
        } catch (e: any) {
            console.error("Failed to load addresses", e);
            showToaster("Failed to load saved addresses. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!addressToDelete) return;
        const idToDelete = addressToDelete.id;
        const nameToDelete = addressToDelete.contact_name || 'Address';

        // Close modal first
        setAddressToDelete(null);
        showToaster("Processing deletion...", 'success');

        try {
            await deleteAddress(idToDelete);
            showToaster(`${nameToDelete} has been successfully deleted.`, 'delete');
            setAddresses(prev => prev.filter(a => a.id !== idToDelete));

            // Clear from localStorage if this was the selected address
            const currentSelected = localStorage.getItem("gridpe_user_address");
            if (currentSelected) {
                try {
                    const parsed = JSON.parse(currentSelected);
                    if (parsed.id === idToDelete) {
                        localStorage.removeItem("gridpe_user_address");
                    }
                } catch (err) {
                    console.warn("Corrupted selection data found during delete.");
                    localStorage.removeItem("gridpe_user_address");
                }
            }
        } catch (e: any) {
            console.error("Failed to delete address", e);
            showToaster(e.message || "Failed to delete address. Please try again.", 'error');
        }
    };

    const handleShare = async (addr: Address) => {
        try {
            const addressText = `${addr.apartment}, ${addr.area}, ${addr.city}, ${addr.state} — 560078`;
            await Share.share({
                title: `Share Address: ${addr.label}`,
                text: `Address Details:\n${addr.label}\n${addressText}`,
                dialogTitle: `Share ${addr.label}`,
            });
        } catch (e: any) {
            console.error("Failed to share address", e);
            if (e.message !== 'Share canceled') {
                showToaster("Failed to share address. Feature might be unsupported.", "error");
            }
        }
    };

    const filteredAddresses = addresses.filter(addr =>
        (addr.label || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (addr.apartment || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (addr.area || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTagIcon = (tag: string | null) => {
        switch (tag) {
            case "Home": return homeIcon;
            case "Work": return workIcon;
            case "Friends & Family": return friendsIcon;
            case "Other": return otherIcon;
            default: return homeIcon;
        }
    };

    return (
        <div className={`fixed inset-0 flex flex-col ${isDarkMode ? 'bg-[#0a0a12] text-white' : 'bg-[#FFFFFF] text-black'} font-satoshi overflow-hidden safe-area-bottom`}>
            {/* Background */}
            <div
                className={`absolute inset-0 z-0 pointer-events-none ${isDarkMode ? 'opacity-40' : 'opacity-100'}`}
                style={{
                    backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                    backgroundSize: "cover",
                    backgroundPosition: "top center",
                }}
            />

            {/* Light Mode Purple Glow - Precisely aligned with Settings page */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
                    style={{
                        backgroundColor: "#5260FE",
                        filter: "blur(60px)",
                        opacity: 0.8,
                        mixBlendMode: "normal"
                    }}
                />
            )}

            {/* Header */}
            <div className="relative z-10 px-5 safe-area-top pt-4 pb-4 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20 bg-black/20' : 'border-black/10 bg-white/50'} flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`text-[18px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Saved Addresses</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Search Bar */}
            <div className="relative z-10 px-5 mb-6">
                <div
                    className={`relative h-12 flex items-center rounded-full px-4 backdrop-blur-md border ${!isDarkMode ? 'bg-white border-[#E6E8EB]' : 'border-transparent'}`}
                    style={isDarkMode ? {
                        backgroundImage: `url(${searchBg})`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                    } : {}}
                >
                    <Search className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-black/30'} mr-3`} />
                    <input
                        type="text"
                        placeholder={addresses.length === 0 ? "What do you really want to search here?" : 'Search your saved addresses: "home"'}
                        className={`flex-1 bg-transparent border-none outline-none text-[14px] ${isDarkMode ? 'placeholder:text-white/30 text-white' : 'placeholder:text-black/30 text-black'}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 pb-32 scrollbar-hide">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-10">
                        <p className={`${isDarkMode ? 'text-white/60' : 'text-black/40'} text-[18px] leading-relaxed`}>
                            You have no saved addresses. Do you live in the woods?
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAddresses.map((addr, idx) => (
                            <div
                                key={addr.id}
                                className={`${isDarkMode ? 'bg-[#0D0D0D]/60 border-white/10 active:bg-white/5' : 'bg-white border-[#E6E8EB] active:bg-black/5'} backdrop-blur-sm border rounded-xl p-4 transition-colors`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src={getTagIcon(addr.label)} alt="" className="w-5 h-5" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                                        <span className={`font-bold text-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}>{addr.label}</span>
                                        {idx === 0 && (
                                            <span className={`px-3 py-0.5 ${isDarkMode ? 'bg-[#008A22]/20 border-[#008A22]/30 text-[#00E037]' : 'bg-[#1CB956] border-[#1CB956] text-white'} border text-[12px] font-medium rounded-full`}>
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => navigate('/add-address-details', { state: { ...addr, addressTitle: addr.label, addressLine: `${addr.apartment}, ${addr.area}` } })}
                                            className="opacity-70 active:opacity-100"
                                        >
                                            <img src={editIcon} alt="Edit" className="w-5 h-5" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                                        </button>
                                        <button
                                            onClick={() => handleShare(addr)}
                                            className="opacity-70 active:opacity-100"
                                        >
                                            <img src={shareIcon} alt="Share" className="w-5 h-5" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                hapticWarning();
                                                setAddressToDelete(addr);
                                            }}
                                            className="opacity-70 active:opacity-100"
                                        >
                                            <img src={deleteIcon} alt="Delete" className="w-5 h-5" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-black/5'} w-full mb-3`}></div>

                                <div className={`text-[12px] leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-black/60'} space-y-1`}>
                                    <p className="line-clamp-2">
                                        {addr.apartment}, {addr.area}, {addr.city}, {addr.state} — 560078
                                    </p>
                                    <p>Phone number: {addr.contact_phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            {!addressToDelete && (
                <div className={`absolute bottom-0 left-0 right-0 p-5 pt-10 pb-safe pb-4 z-20 ${isDarkMode ? 'bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/80 to-transparent' : 'bg-gradient-to-t from-white via-white/80 to-transparent'}`}>
                    <button
                        onClick={() => navigate("/add-address")}
                        className={`w-full h-[48px] border backdrop-blur-xl rounded-full flex items-center justify-center text-[16px] font-medium active:scale-95 transition-transform ${isDarkMode ? 'bg-black/40 border-white/20 text-white' : 'bg-[#5260FE] border-[#5260FE] text-white shadow-lg shadow-[#5260FE]/20'}`}
                        style={isDarkMode ? {
                            boxShadow: "0 0 20px rgba(0,0,0,0.5)"
                        } : {}}
                    >
                        Add New Address
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={addressToDelete !== null}
                onClose={() => setAddressToDelete(null)}
                title="Are you sure you want to delete this address?"
                description={addressToDelete ? `${addressToDelete.contact_name} | ${addressToDelete.apartment}, ${addressToDelete.area}` : ""}
                primaryButtonSrc={buttonRemoveCard}
                primaryText="Yes, Delete"
                onPrimaryClick={handleDelete}
                secondaryButtonSrc={buttonCancelWide}
                secondaryText="No"
            />
        </div>
    );
};

export default SavedAddresses;
