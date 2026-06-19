import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { formatINR } from '@/utils/format';
import { hapticSuccess } from '@/utils/haptics';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useWebScroll } from '@/hooks/useWebScroll';
import { ChevronLeft, Star, Info } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import OrderDeliveredAnim from '@/assets/order-delivered-animation.lottie';
import DeliveryPinIcon from '@/assets/delivery-pin.svg';
import DeliveryCallIcon from '@/assets/delivery-call.svg';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { crashlytics } from '@/lib/crashlytics';

const OrderDelivered = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const { profile } = useUser();
  const { showToaster } = useCustomToaster();

  // New States
  const [cashQuality, setCashQuality] = useState<'yes' | 'no' | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [wouldOrderAgain, setWouldOrderAgain] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [riderStats, setRiderStats] = useState<{ average_stars?: number, total_ratings?: number } | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [selectedTipOption, setSelectedTipOption] = useState<string | null>(null);
  const [customTipValue, setCustomTipValue] = useState('');

  const orderAmount = location.state?.order?.amount ?? null;
  const orderData = location.state?.order;

  const addressSource = orderData?.addresses || location.state?.savedAddress;
  const addressLabel = addressSource?.label || addressSource?.tag || 'Work';

  const getAddressDisplay = () => {
    if (!addressSource) return 'Unknown Location';
    const house = addressSource.apartment || addressSource.house || addressSource.house_number;
    const area = addressSource.area || addressSource.street_address;
    const parts = [house, area];
    const fullString = parts.filter(Boolean).join(', ');
    return fullString || 'Unknown Location';
  };
  const addressDisplay = getAddressDisplay();

  const customerName = addressSource?.contact_name || addressSource?.name || profile?.full_name || orderData?.user?.full_name || 'Customer';
  const customerPhone = addressSource?.contact_phone || addressSource?.phone || profile?.phone || orderData?.user?.phone || null;

  useEffect(() => {
    hapticSuccess();
    
    const fetchData = async () => {
      if (!orderData?.id || !orderData?.rider_id) return;
      
      try {
        // Fetch rider stats
        const { data: rider } = await supabase
          .from('riders')
          .select('average_stars, total_ratings')
          .eq('id', orderData.rider_id)
          .single();
          
        if (rider) {
          setRiderStats(rider);
        }
        
        // Fetch existing rating
        const { data: existingRating } = await supabase
          .from('order_ratings')
          .select('*')
          .eq('order_id', orderData.id)
          .maybeSingle();
          
        if (existingRating) {
          const ratingData = existingRating as any;
          setHasRated(true);
          setRating(ratingData.stars);
          setWouldOrderAgain(ratingData.would_order_again ?? null);
        }
      } catch (err) {
        console.error("Error fetching rating data:", err);
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'OrderDelivered fetchData failed');
      } finally {
        setIsFetchingData(false);
      }
    };
    
    fetchData();
  }, [orderData?.id, orderData?.rider_id]);

  const handleTipSelect = (option: string) => {
    setSelectedTipOption(option);
    if (option === 'other') {
      setTipAmount(0);
    } else {
      setTipAmount(parseInt(option, 10));
    }
  };

  const handleClearTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTipOption(null);
    setTipAmount(0);
    setCustomTipValue('');
  };

  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setCustomTipValue(val);
    }
  };

  const handleApplyCustomTip = () => {
    const val = parseInt(customTipValue, 10);
    if (!isNaN(val) && val > 0) {
      setTipAmount(val);
    }
  };

  const handleClearCustomTip = () => {
    setCustomTipValue('');
    setTipAmount(0);
    setSelectedTipOption(null);
  };

  const handleSubmitRating = async () => {
    if (rating === 0 || wouldOrderAgain === null || !orderData?.id || !orderData?.rider_id) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-order-rating', {
        body: {
          order_id: orderData.id,
          rider_id: orderData.rider_id,
          stars: rating,
          would_order_again: wouldOrderAgain,
          tip_amount: tipAmount,
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      showToaster('Rating submitted! Thank you.', 'success');
      setHasRated(true);
      
      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      showToaster(err.message || 'Failed to submit rating', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col items-center overflow-y-auto no-scrollbar pb-10 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        backgroundImage: isDarkMode ? `url(${ASSETS.SUCCESS_BG})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Green Glowing Blob */}
      {!isDarkMode && (
        <div
          className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(28, 185, 86, 0.2) 0%, rgba(28, 185, 86, 0) 100%)',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />
      )}

      {/* Header */}
      <div className="flex-none px-5 safe-top pt-4 flex items-center justify-between z-10 w-full">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all">
          <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>
        <h1
          className={`text-[18px] font-medium font-satoshi absolute left-1/2 -translate-x-1/2 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Order Delivered
        </h1>
        <div className="w-10" />
      </div>

      <div className="w-full flex flex-col items-center mt-[71px] px-4 relative z-10">

        {/* Lottie Animation (Positioned Behind) */}
        <div className="absolute -top-[90px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] z-[-1] pointer-events-none flex items-center justify-center">
          <DotLottieReact
            src={OrderDeliveredAnim}
            loop
            autoplay
          />
        </div>

        {/* Rating Container */}
        <div
          className={`rounded-[13px] border overflow-hidden relative flex flex-col`}
          style={{
            width: '362px',
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none', WebkitBackdropFilter: isDarkMode ? 'blur(25px)' : 'none',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E9EAEB',
            padding: '15px'
          }}
        >
          {/* Top section: Avatar and text */}
          <div className="flex items-start gap-[10px]">
            <img loading="lazy"
              src={orderData?.rider?.kyc_photo || orderData?.rider?.profile_url || ASSETS.AVATAR}
              className="w-[46px] h-[46px] rounded-full object-cover shrink-0 bg-black/10 dark:bg-white/10"
              alt="Rider"
            />
            <div className="flex flex-col justify-center h-[46px]">
              <span className={`font-satoshi font-medium text-[14px] leading-tight flex items-center ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
                Delivered by {orderData?.rider?.full_name || 'Your Rider'}
                {isFetchingData ? (
                  <div className="h-4 w-24 bg-gray-500/20 animate-pulse rounded ml-[8px]" />
                ) : (
                  riderStats && (
                    <span className={`flex items-center ml-[8px] text-[12px] font-medium px-[6px] py-[2px] rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                      {(riderStats.total_ratings ?? 0) >= 5 ? (
                        <>
                          <Star className="w-[10px] h-[10px] text-[#FFD700] fill-[#FFD700] mr-[4px]" />
                          {riderStats.average_stars?.toFixed(1)} ({riderStats.total_ratings})
                        </>
                      ) : (
                        'New Rider'
                      )}
                    </span>
                  )
                )}
              </span>
              <span className={`font-satoshi font-bold text-[16px] mt-[1px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {hasRated ? "You've already rated this delivery" : "Rate your delivery experience"}
              </span>
            </div>
          </div>

          {/* Stars */}
          <div className={`mt-[18px] flex gap-[6px] ${hasRated ? 'pointer-events-none opacity-80' : ''}`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                disabled={hasRated}
                className="w-[34px] h-[34px] p-0 flex items-center justify-center transition-transform active:scale-90"
              >
                <Star
                  className={`w-full h-full transition-colors`}
                  style={{
                    fill: rating >= star ? '#FFD700' : 'transparent',
                    color: rating >= star ? '#FFD700' : (isDarkMode ? '#FFFFFF' : '#000000'),
                    strokeWidth: rating >= star ? 0 : 1.5
                  }}
                />
              </button>
            ))}
          </div>

          {/* Comfort Question UI */}
          {rating > 0 && !hasRated && (
            <div className="mt-[20px] animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className={`font-satoshi font-medium text-[14px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Would you be comfortable with this rider delivering your order again?
              </p>
              <div className="mt-[12px] flex items-center gap-[12px]">
                <button
                  onClick={() => setWouldOrderAgain(false)}
                  className={`flex-1 h-[40px] rounded-[6px] border flex items-center justify-center font-satoshi font-medium text-[14px] transition-all ${wouldOrderAgain === false
                      ? 'bg-[#ef4444] border-[#ef4444] text-white'
                      : 'border-[#ef4444] text-[#ef4444] bg-transparent'
                    }`}
                >
                  ✗ Not Really
                </button>
                <button
                  onClick={() => setWouldOrderAgain(true)}
                  className={`flex-1 h-[40px] rounded-[6px] border flex items-center justify-center font-satoshi font-medium text-[14px] transition-all ${wouldOrderAgain === true
                      ? 'bg-[#22c55e] border-[#22c55e] text-white'
                      : 'border-[#22c55e] text-[#22c55e] bg-transparent'
                    }`}
                >
                  ✓ Yes, Absolutely
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className={`mt-[17px] w-[calc(100%+30px)] -mx-[15px] h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

          {/* Delivery Tip Section */}
          <div className="mt-[15px]">
            <div className="flex items-center gap-2 mb-[6px]">
              <span className={`text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Delivery Tip
              </span>
              <Info className={`w-4 h-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`} />
            </div>
            <p className={`text-[12px] font-normal font-satoshi mb-[15px] leading-snug ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
              A small tip, goes a big way! Totally optional — but your rider will appreciate it ❤️
            </p>

            <div className="flex items-center gap-3">
              {['10', '20', '30'].map(val => (
                <div
                  key={val}
                  className="relative shrink-0"
                  style={{ width: '74px', height: '38px' }}
                >
                  <button
                    disabled={hasRated}
                    onClick={() => handleTipSelect(val)}
                    className={`relative block w-full h-full transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${val === '20' ? 'rounded-[19px]' : ''} ${!isDarkMode ? 'rounded-full' : ''} ${hasRated ? 'opacity-40 pointer-events-none' : ''}`}
                    style={
                      isDarkMode
                        ? {
                          backgroundImage: `url(${selectedTipOption === val ? ASSETS.SELECTED_PILL : ASSETS.PILL})`,
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                          boxSizing: 'border-box',
                        }
                        : {
                          backgroundColor: selectedTipOption === val ? '#5260FE' : '#FFFFFF',
                          border: '1px solid #E6E8EB',
                        }
                    }
                  >
                    <div
                      className={`absolute left-0 right-0 flex justify-center items-center gap-[10px] z-20 ${val === '20' ? 'top-[2px]' : 'top-1/2 -translate-y-1/2'}`}
                    >
                      <span
                        className={`font-medium font-sans text-[15px] leading-none ${isDarkMode || selectedTipOption === val ? 'text-white' : 'text-black'}`}
                      >
                        ₹{val}
                      </span>
                      {selectedTipOption === val && (
                        <div
                          onClick={e => handleClearTip(e)}
                          className="cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                        >
                          <img
                            src={ASSETS.CROSS_ICON}
                            alt="Remove"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {val === '20' && (
                      <div className="absolute top-[23px] left-0 right-0 h-[14px] bg-brand-primary flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-white text-[7px] font-bold font-sans uppercase tracking-wider leading-none">
                          MOST TIPPED
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              ))}
              <div className="relative shrink-0" style={{ width: '74px', height: '38px' }}>
                <button
                  disabled={hasRated}
                  onClick={() => handleTipSelect('other')}
                  className={`relative flex items-center justify-center transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${selectedTipOption === 'other' ? 'flex-row gap-[10px]' : ''} ${!isDarkMode ? 'rounded-full' : ''} ${hasRated ? 'opacity-40 pointer-events-none' : ''}`}
                  style={
                    isDarkMode
                      ? {
                        width: '74px',
                        height: '38px',
                        backgroundImage: `url(${selectedTipOption === 'other' ? ASSETS.SELECTED_PILL : ASSETS.PILL})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        boxSizing: 'border-box',
                      }
                      : {
                        width: '74px',
                        height: '38px',
                        backgroundColor:
                          selectedTipOption === 'other' ? '#5260FE' : '#FFFFFF',
                        border: '1px solid #E6E8EB',
                      }
                  }
                >
                  <span
                    className={`font-medium font-sans text-[15px] z-20 relative leading-none ${isDarkMode || selectedTipOption === 'other' ? 'text-white' : 'text-black'}`}
                  >
                    Other
                  </span>
                  {selectedTipOption === 'other' && (
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        handleClearCustomTip();
                      }}
                      className="z-30 cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                    >
                      <img
                        src={ASSETS.CROSS_ICON}
                        alt="Remove"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </button>
              </div>
            </div>
            {selectedTipOption === 'other' && (
              <div
                className={`mt-[15px] h-[48px] w-full rounded-full border flex items-center pl-4 pr-4 ${isDarkMode ? 'bg-brand-card-dark border-white/10' : 'bg-white border-brand-border-light'}`}
              >
                <span
                  className={`font-medium font-sans mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  ₹
                </span>
                <input
                  type="text"
                  placeholder="Enter tip amount"
                  value={customTipValue}
                  onChange={handleCustomTipChange}
                  className={`bg-transparent font-sans text-[14px] focus:outline-none flex-1 ${isDarkMode ? 'text-white placeholder:text-white/30' : 'text-black placeholder:text-black/30'}`}
                />
                <button
                  onClick={tipAmount > 0 ? handleClearCustomTip : handleApplyCustomTip}
                  className="text-brand-primary text-[13px] font-medium font-sans ml-2"
                >
                  {tipAmount > 0 ? 'Clear' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Second Divider */}
          <div className={`mt-[15px] w-[calc(100%+30px)] -mx-[15px] h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

          {/* Package Question Section */}
          <div className="mt-[15px] flex items-center">
            <p
              className={`w-[216px] font-satoshi font-medium text-[14px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Did your items arrive in a safe and sealed package?
            </p>
            <div className="ml-[16px] flex items-center gap-[8px]">
              <button
                onClick={() => setCashQuality(cashQuality === 'no' ? null : 'no')}
                className={`w-[46px] h-[40px] rounded-[6px] border flex items-center justify-center font-satoshi font-medium text-[14px] transition-all ${cashQuality === 'no'
                    ? 'bg-[#ef4444] border-[#ef4444] text-white'
                    : 'border-[#ef4444] text-[#ef4444] bg-transparent'
                  }`}
              >
                No
              </button>
              <button
                onClick={() => setCashQuality(cashQuality === 'yes' ? null : 'yes')}
                className={`w-[46px] h-[40px] rounded-[6px] border flex items-center justify-center font-satoshi font-medium text-[14px] transition-all ${cashQuality === 'yes'
                    ? 'bg-[#22c55e] border-[#22c55e] text-white'
                    : 'border-[#22c55e] text-[#22c55e] bg-transparent'
                  }`}
              >
                Yes
              </button>
            </div>
          </div>
        </div>

        {/* New Order Delivered Info Container */}
        <div
          className="w-[362px] mt-[12px] rounded-[13px] border relative flex flex-col"
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none', WebkitBackdropFilter: isDarkMode ? 'blur(25px)' : 'none',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E9EAEB',
            padding: '15px'
          }}
        >
          <h2 className={`font-satoshi font-medium text-[16px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Your order for amount ₹{orderAmount != null ? orderAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '--'} has been delivered successfully.
          </h2>
          <p className={`mt-[8px] font-satoshi font-normal text-[16px] leading-[140%] ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
            The ₹{orderAmount != null ? orderAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '--'} held for this delivery will be debited shortly. You will be notified for the same. Thank you for using Grid.Pe!
          </p>
          <div className="mt-[20px] flex items-center gap-[12px]">
            <div className="relative flex items-center justify-center w-[14px] h-[14px]">
              <div className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 animate-ping"></div>
              <div className="relative w-[10px] h-[10px] rounded-full bg-[#22c55e] z-10" />
            </div>
            <span className={`text-[13px] font-normal font-satoshi ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
              Delivery confirmed
            </span>
          </div>
        </div>

        {/* Delivery Details Container */}
        <div
          className="w-[362px] mt-[12px] rounded-[13px] border relative flex flex-col"
          style={{
            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : '#FFFFFF',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'none', WebkitBackdropFilter: isDarkMode ? 'blur(25px)' : 'none',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E9EAEB',
            padding: '15px'
          }}
        >
          <h2 className={`font-satoshi font-medium text-[16px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Your delivery details
          </h2>
          <p className={`mt-[2px] font-satoshi font-normal text-[12px] leading-tight ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
            Details of your current order
          </p>
          <div className={`mt-[12px] w-[calc(100%+30px)] -mx-[15px] h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

          <div className="mt-[12px] flex items-start">
            <img loading="lazy" src={DeliveryPinIcon} alt="Pin" className="w-[31px] h-[31px] shrink-0" />
            <div className="ml-[16px] flex flex-col pt-[3px]">
              <span className={`font-satoshi font-medium text-[14px] leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Delivery at {addressLabel}
              </span>
              <span className={`w-[285px] mt-[5px] font-satoshi font-normal text-[13px] leading-[140%] ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
                {addressDisplay}
              </span>
            </div>
          </div>

          <div className="mt-[15px] flex items-start">
            <img loading="lazy" src={DeliveryCallIcon} alt="Call" className="w-[31px] h-[31px] shrink-0" />
            <div className="ml-[16px] flex flex-col pt-[7px]">
              <span className={`font-satoshi font-medium text-[14px] leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {customerName}, {customerPhone ?? '--'}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-[14px] flex flex-col gap-[12px] w-[362px] pb-[40px]">
          <button
            onClick={() => navigate(ROUTES.HELP)}
            className={`w-full h-[48px] rounded-full border transition-all active:scale-[0.98] flex items-center justify-center font-satoshi font-medium text-[16px] ${isDarkMode ? 'border-white/20 text-white hover:bg-white/5' : 'border-black/20 text-black hover:bg-black/5'}`}
          >
            Need Help?
          </button>
          {rating > 0 && wouldOrderAgain !== null && !hasRated ? (
            <Button
              onClick={handleSubmitRating}
              disabled={isSubmitting}
              variant={isDarkMode ? 'glass' : 'default'}
              className={cn(
                'w-full h-[48px] shadow-xl transition-all',
                !isDarkMode && 'bg-black hover:bg-black/90 text-white rounded-full'
              )}
              style={isDarkMode ? ({ '--glass-specular-intensity': '0.2' } as React.CSSProperties) : {}}
            >
              <span className={cn('text-[16px] font-medium font-satoshi flex items-center justify-center', isDarkMode ? 'text-white' : '')}>
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Submit Rating'
                )}
              </span>
            </Button>
          ) : (
            <Button
              onClick={() => navigate(ROUTES.HOME)}
              variant={isDarkMode ? 'glass' : 'default'}
              className={cn(
                'w-full h-[48px] shadow-xl transition-all',
                !isDarkMode && 'bg-black hover:bg-black/90 text-white rounded-full'
              )}
              style={isDarkMode ? ({ '--glass-specular-intensity': '0.2' } as React.CSSProperties) : {}}
            >
              <span
                className={cn(
                  'text-[16px] font-medium font-satoshi',
                  isDarkMode ? 'text-white' : ''
                )}
              >
                Go to Home
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default OrderDelivered;
