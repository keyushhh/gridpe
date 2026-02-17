import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, X } from "lucide-react";
import { fetchAddresses, deleteAddress, Address } from "@/lib/addresses";
import { supabase } from "@/lib/supabase";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import buttonRemoveCard from "@/assets/button-remove-card.png";

// Assets
import bgDarkMode from "@/assets/bg-dark-mode.png";
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
            if (session?.user) {
                const data = await fetchAddresses(session.user.id);
                setAddresses(data);
            }
        } catch (e) {
            console.error("Failed to load addresses", e);
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
        } catch (e: any) {
            console.error("Failed to delete address", e);
            showToaster(e.message || "Failed to delete address. Please try again.", 'error');
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
        <div className="fixed inset-0 flex flex-col bg-[#0a0a12] text-white font-satoshi overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-40"
                style={{
                    backgroundImage: `url(${bgDarkMode})`,
                    backgroundSize: "cover",
                    backgroundPosition: "top center",
                }}
            />

            {/* Header */}
            <div className="relative z-10 px-5 pt-12 pb-4 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-md active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-[18px] font-medium">Saved Addresses</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Search Bar */}
            <div className="relative z-10 px-5 mb-6">
                <div
                    className="relative h-12 flex items-center rounded-full px-4 backdrop-blur-md"
                    style={{
                        backgroundImage: `url(${searchBg})`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    <Search className="w-5 h-5 text-white/50 mr-3" />
                    <input
                        type="text"
                        placeholder={addresses.length === 0 ? "What do you really want to search here?" : 'Search your saved addresses: "home"'}
                        className="flex-1 bg-transparent border-none outline-none text-[14px] placeholder:text-white/30"
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
                        <p className="text-white/60 text-[18px] leading-relaxed">
                            You have no saved addresses. Do you live in the woods?
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAddresses.map((addr, idx) => (
                            <div
                                key={addr.id}
                                className="bg-[#0D0D0D]/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 active:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src={getTagIcon(addr.label)} alt="" className="w-5 h-5" />
                                        <span className="font-bold text-[16px]">{addr.label}</span>
                                        {idx === 0 && (
                                            <span className="px-3 py-0.5 bg-[#008A22]/20 border border-[#008A22]/30 text-[#00E037] text-[12px] font-medium rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => navigate('/add-address-details', { state: { ...addr, addressTitle: addr.label, addressLine: `${addr.apartment}, ${addr.area}` } })}
                                            className="opacity-70 active:opacity-100"
                                        >
                                            <img src={editIcon} alt="Edit" className="w-5 h-5" />
                                        </button>
                                        <button className="opacity-70 active:opacity-100">
                                            <img src={shareIcon} alt="Share" className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setAddressToDelete(addr)}
                                            className="opacity-70 active:opacity-100"
                                        >
                                            <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-white/10 w-full mb-3" />

                                <div className="text-[12px] leading-relaxed text-white/70 space-y-1">
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
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/80 to-transparent pt-10 pb-10 z-20">
                    <button
                        onClick={() => navigate("/add-address")}
                        className="w-full h-[56px] bg-black/40 border border-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-[16px] font-medium active:scale-95 transition-transform"
                        style={{
                            boxShadow: "0 0 20px rgba(0,0,0,0.5)"
                        }}
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
