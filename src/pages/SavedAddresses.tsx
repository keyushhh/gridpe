import { ASSETS } from '@/constants/assets';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { Search, X } from 'lucide-react';
import { fetchAddresses, deleteAddress, Address } from '@/lib/addresses';
import { supabase } from '@/lib/supabase';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { SavedAddress } from '@/types';
import BaseListSkeleton from '@/components/skeletons/BaseListSkeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { hapticWarning } from '@/utils/haptics';

const mapToSavedAddress = (addr: Address): SavedAddress => {
  return {
    ...addr,
    tag: addr.label || 'Home',
    displayAddress: `${addr.apartment || ''}, ${addr.area || ''}`,
    house: addr.apartment || '',
    area: addr.area || '',
    landmark: addr.landmark || undefined,
    name: addr.contact_name || undefined,
    phone: addr.contact_phone || undefined,
    postcode: '560078',
    plusCode: addr.plus_code || undefined,
  };
};

// Assets
const SavedAddresses = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { profile } = useUser();
  const userId = profile?.id;
  const { showToaster } = useCustomToaster();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const lastId = localStorage.getItem('gridpe_last_selected_address_id');
    if (lastId) {
      setSelectedAddressId(lastId);
    } else {
      const addressStr = localStorage.getItem('gridpe_user_address');
      if (addressStr) {
        try {
          const parsed = JSON.parse(addressStr);
          if (parsed?.id) {
            setSelectedAddressId(parsed.id);
          }
        } catch (e) {
          console.error('Failed to parse active address', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const loadAddresses = async () => {
    if (!userId) return;
    try {
      const data = await fetchAddresses(userId);
      setAddresses(data);
    } catch (e: unknown) {
      console.error('Failed to load addresses', e);
      showToaster('Failed to load saved addresses. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (addr: Address) => {
    if (!Capacitor.isNativePlatform()) {
      showToaster('Sharing is only available on mobile devices.', 'error');
      return;
    }
    try {
      const addressText = `${addr.apartment}, ${addr.area}, ${addr.city}, ${addr.state} — 560078`;
      await Share.share({
        title: `Share Address: ${addr.label}`,
        text: `Address Details:\n${addr.label}\n${addressText}`,
        dialogTitle: `Share ${addr.label}`,
      });
    } catch (e: unknown) {
      console.error('Failed to share address', e);
      if (e instanceof Error && e.message !== 'Share canceled') {
        showToaster('Failed to share address. Feature might be unsupported.', 'error');
      }
    }
  };
  const filteredAddresses = addresses.filter(
    addr =>
      (addr.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (addr.apartment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (addr.area || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getTagIcon = (tag: string | null) => {
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
  return (
    <div
      className={`fixed inset-0 flex flex-col ${isDarkMode ? 'bg-brand-bg-dark text-white' : 'bg-white text-black'} font-satoshi overflow-hidden safe-bottom`}
    >
      {/* Background */}
      <div
        className={`absolute inset-0 z-0 pointer-events-none ${isDarkMode ? 'opacity-40' : 'opacity-100'}`}
        style={{
          backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
        }}
      />
      {/* Light Mode Purple Glow - Precisely aligned with Settings page */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#5260FE',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="relative z-10 px-5 safe-top pt-4 pb-4 flex items-center justify-between">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className={`text-[18px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Saved Addresses
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>
      {/* Search Bar */}
      <div className="relative z-10 px-5 mb-6">
        <div
          className={`relative h-12 flex items-center rounded-full px-4 backdrop-blur-md border ${!isDarkMode ? 'bg-white border-brand-border-light' : 'border-transparent'}`}
          style={
            isDarkMode
              ? {
                  backgroundImage: `url(${ASSETS.SEARCH_BG})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }
              : {}
          }
        >
          <Search className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-black/30'} mr-3`} />
          <input
            type="text"
            placeholder={
              addresses.length === 0
                ? 'What do you really want to search here?'
                : 'Search your saved addresses: "home"'
            }
            className={`flex-1 bg-transparent border-none outline-none text-[14px] ${isDarkMode ? 'placeholder:text-white/30 text-white' : 'placeholder:text-black/30 text-black'}`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 pb-32 scrollbar-hide">
        {loading ? (
          <div className="px-1">
            <BaseListSkeleton rows={3} />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-10 pt-20">
            <div
              className={`w-[120px] h-[120px] rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}
            >
              <img
                src={ASSETS.ADDRESS}
                alt="No addresses"
                className="w-12 h-12 opacity-40"
                style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
              />
            </div>
            <h2
              className={`text-[20px] font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              No saved addresses
            </h2>
            <p
              className={`text-[14px] leading-relaxed mb-10 ${isDarkMode ? 'text-white/60' : 'text-black/40'}`}
            >
              Add your home or work address to order cash faster.
            </p>
            <button
              onClick={() => navigate(ROUTES.ADD_ADDRESS)}
              className={`w-full max-w-[240px] h-[48px] rounded-full font-medium transition-all active:scale-95 shadow-lg ${isDarkMode ? 'bg-white text-black shadow-white/5' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAddresses.map((addr, idx) => (
              <div
                key={addr.id}
                onClick={() => {
                  setSelectedAddr(addr);
                  setShowActionSheet(true);
                  setShowDeleteConfirm(false);
                }}
                className={`cursor-pointer ${isDarkMode ? 'bg-[#0D0D0D]/60 active:bg-white/5' : 'bg-white active:bg-black/5'} backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 ${
                  selectedAddressId === addr.id
                    ? 'border-brand-primary shadow-md shadow-brand-primary/10'
                    : isDarkMode
                      ? 'border-white/10'
                      : 'border-brand-border-light'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getTagIcon(addr.label)}
                      alt=""
                      className="w-5 h-5"
                      style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
                    />
                    <span
                      className={`font-bold text-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      {addr.label}
                    </span>
                    {idx === 0 && (
                      <span
                        className={`px-3 py-0.5 ${isDarkMode ? 'bg-[#008A22]/20 border-[#008A22]/30 text-[#00E037]' : 'bg-brand-success border-brand-success text-white'} border text-[12px] font-medium rounded-full`}
                      >
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-black/5'} w-full mb-3`}
                ></div>
                <div
                  className={`text-[12px] leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-black/60'} space-y-1`}
                >
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
      <div
        className={`absolute bottom-0 left-0 right-0 p-5 pt-10 safe-bottom pb-4 z-20 ${isDarkMode ? 'bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/80 to-transparent' : 'bg-gradient-to-t from-white via-white/80 to-transparent'}`}
      >
        <button
          onClick={() => navigate(ROUTES.ADD_ADDRESS)}
          className={`w-full h-[48px] border backdrop-blur-xl rounded-full flex items-center justify-center text-[16px] font-medium active:scale-95 transition-transform ${isDarkMode ? 'bg-black/40 border-white/20 text-white' : 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20'}`}
          style={
            isDarkMode
              ? {
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                }
              : {}
          }
        >
          Add New Address
        </button>
      </div>

      {/* Address Action Bottom Sheet */}
      {showActionSheet && selectedAddr && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/50 backdrop-blur-[4px] pointer-events-auto"
            onClick={() => setShowActionSheet(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 rounded-t-[36px] flex flex-col px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 pointer-events-auto z-20"
            style={{
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'rgba(255, 255, 255, 0.95)',
              borderTop: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              borderLeft: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              borderRight: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              boxShadow: isDarkMode ? '0px -10px 40px rgba(0, 0, 0, 0.4)' : 'none',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform',
            }}
          >
            {/* Drag Handle */}
            <div
              className={`w-10 h-1.5 rounded-full mx-auto mb-6 ${
                isDarkMode ? 'bg-white/25' : 'bg-black/20'
              }`}
            />

            {!showDeleteConfirm ? (
              <>
                {/* Header */}
                <div className="flex flex-col text-center mb-6">
                  <h2 className={`text-[20px] font-black font-satoshi leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedAddr.label}
                  </h2>
                  <p className={`text-[13.5px] font-normal leading-relaxed font-satoshi mt-1.5 px-6 line-clamp-2 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                    {selectedAddr.apartment}, {selectedAddr.area}
                  </p>
                </div>

                {/* Subtle Divider */}
                <div className={`h-[1px] w-full mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

                {/* Buttons stacked vertically */}
                <div className="flex flex-col gap-3">
                  {/* 1. Set as Delivery Address */}
                  <button
                    onClick={() => {
                      const mapped = mapToSavedAddress(selectedAddr);
                      localStorage.setItem('gridpe_last_selected_address_id', selectedAddr.id);
                      localStorage.setItem('gridpe_user_address', JSON.stringify(mapped));
                      setSelectedAddressId(selectedAddr.id);
                      showToaster('Delivery address updated', 'success');
                      setShowActionSheet(false);
                    }}
                    className="w-full h-[52px] rounded-full bg-[#5260FE] active:scale-95 transition-all flex items-center justify-center font-bold text-white text-[16px] font-satoshi shadow-lg shadow-indigo-950/20"
                  >
                    Set as Delivery Address
                  </button>

                  {/* 2. Edit */}
                  <button
                    onClick={() => {
                      setShowActionSheet(false);
                      navigate(ROUTES.ADD_ADDRESS_DETAILS, {
                        state: {
                          ...selectedAddr,
                          addressTitle: selectedAddr.label,
                          addressLine: `${selectedAddr.apartment}, ${selectedAddr.area}`,
                        },
                      });
                    }}
                    className={`w-full h-[52px] rounded-full active:scale-95 transition-all flex items-center justify-center font-semibold text-[16px] font-satoshi border ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/12 text-white hover:bg-white/10' 
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Edit
                  </button>

                  {/* 3. Delete */}
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full h-[52px] rounded-full bg-[#EF4444] active:scale-95 transition-all flex items-center justify-center font-bold text-white text-[16px] font-satoshi"
                  >
                    Delete
                  </button>

                  {/* 4. Cancel */}
                  <button
                    onClick={() => setShowActionSheet(false)}
                    className={`w-full h-[52px] rounded-full active:scale-95 transition-all flex items-center justify-center font-semibold text-[16px] font-satoshi ${
                      isDarkMode 
                        ? 'text-white/50 hover:text-white' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Delete Confirmation Header */}
                <div className="flex flex-col text-center mb-6">
                  <h2 className={`text-[20px] font-black font-satoshi leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Delete this address?
                  </h2>
                  <p className={`text-[13.5px] font-normal leading-relaxed font-satoshi mt-1.5 px-6 line-clamp-2 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                    This address will be removed from your account. You can always add it back later.
                  </p>
                </div>

                {/* Subtle Divider */}
                <div className={`h-[1px] w-full mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

                {/* Confirmation Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      const idToDelete = selectedAddr.id;
                      const nameToDelete = selectedAddr.contact_name || 'Address';
                      showToaster('Processing deletion...', 'success');
                      try {
                        if (userId) {
                          await deleteAddress(idToDelete, userId);
                          showToaster(`${nameToDelete} has been successfully deleted.`, 'delete');
                          setAddresses(prev => prev.filter(a => a.id !== idToDelete));
                        }
                        // Clear from localStorage if this was the selected address
                        const currentSelected = localStorage.getItem('gridpe_user_address');
                        if (currentSelected) {
                          try {
                            const parsed = JSON.parse(currentSelected);
                            if (parsed.id === idToDelete) {
                              localStorage.removeItem('gridpe_user_address');
                              localStorage.removeItem('gridpe_last_selected_address_id');
                              setSelectedAddressId(null);
                            }
                          } catch (err) {
                            localStorage.removeItem('gridpe_user_address');
                            localStorage.removeItem('gridpe_last_selected_address_id');
                            setSelectedAddressId(null);
                          }
                        }
                      } catch (e: unknown) {
                        console.error('Failed to delete address', e);
                        const errorMessage = e instanceof Error ? e.message : 'Failed to delete address. Please try again.';
                        showToaster(errorMessage, 'error');
                      } finally {
                        setShowActionSheet(false);
                      }
                    }}
                    className="w-full h-[52px] rounded-full bg-[#EF4444] active:scale-95 transition-all flex items-center justify-center font-bold text-white text-[16px] font-satoshi"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`w-full h-[52px] rounded-full active:scale-95 transition-all flex items-center justify-center font-semibold text-[16px] font-satoshi border ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/12 text-white hover:bg-white/10' 
                        : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SavedAddresses;
