import { ASSETS } from '@/constants/assets';
import React, { useState } from 'react';
import { X, Star, Check, AlertTriangle } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface RatingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    rider_id: string;
    rider_name: string;
    rider_photo: string | null;
  } | null;
}

const RatingSheet: React.FC<RatingSheetProps> = ({ isOpen, onClose, order }) => {
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();

  const [stars, setStars] = useState<number>(0);
  const [recommendSolo, setRecommendSolo] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showDeliveryTipPopup, setShowDeliveryTipPopup] = useState(false);
  const [selectedTipOption, setSelectedTipOption] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState(0); // In paise for API, but UI shows INR
  const [customTipValue, setCustomTipValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(isOpen);

  if (!isOpen || !order) return null;

  const handleTipSelect = (option: string) => {
    setSelectedTipOption(option);
    if (option === 'other') {
      setTipAmount(0);
    } else {
      setTipAmount(parseInt(option, 10) * 100); // Convert to paise
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
      setTipAmount(val * 100); // Convert to paise
    }
  };

  const handleClearCustomTip = () => {
    setCustomTipValue('');
    setTipAmount(0);
    setSelectedTipOption(null);
  };

  const handleSubmit = async () => {
    if (stars === 0) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-order-rating', {
        body: {
          order_id: order.id,
          rider_id: order.rider_id,
          stars,
          recommend_solo: recommendSolo,
          feedback: feedback || null,
          tip_amount: tipAmount,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      showToaster('Rating submitted successfully!', 'success');
      onClose();
    } catch (err: unknown) {
      console.error('Error submitting rating:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating';
      showToaster(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10 bg-black/60 backdrop-blur-md transition-opacity pointer-events-auto"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 z-20 w-full h-auto min-h-[50vh] max-h-[90vh] rounded-t-[32px] overflow-hidden transition-[transform,opacity] duration-300 shadow-2xl pointer-events-auto",
          !isDarkMode && "bg-white"
        )}
        style={{
          background: isDarkMode
            ? 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box'
            : undefined,
          border: isDarkMode ? '0.63px solid transparent' : 'none',
          backdropFilter: isDarkMode ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: isDarkMode ? 'blur(16px)' : 'none',
          transform: 'translateZ(0)',
        }}
      >
        <div className="w-full h-full max-h-[inherit] overflow-x-hidden overflow-y-auto overscroll-contain custom-scrollbar pt-4 pb-10 px-5" style={{ touchAction: 'pan-y' }}>
          {/* Drag Handle Container */}
          <div className="w-full flex justify-center pb-6">
            <div className={cn("w-[48px] h-[5px] rounded-full", isDarkMode ? "bg-[#313033]" : "bg-brand-border-light")} />
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className={cn("text-[20px] font-bold font-satoshi", isDarkMode ? "text-white" : "text-black")}>
              Rate your delivery
            </h2>
            <button
              onClick={onClose}
              className={cn("text-[14px] font-medium font-satoshi", isDarkMode ? "text-white/60" : "text-brand-primary")}
            >
              Skip
            </button>
          </div>

          {/* Rider Card (Adapted from OrderDetailsSheet) */}
          <div
            className={cn(
              "relative rounded-[13px] overflow-hidden mb-6 p-[14px] border",
              isDarkMode ? "bg-brand-card-dark/34 border-white/5" : "bg-white border-brand-border-light"
            )}
          >
            <div className="flex gap-4 items-start">
              <div className="w-[64px] h-[68px] relative shrink-0 rounded-[6px] overflow-hidden">
                <img
                  src={order.rider_photo ? (order.rider_photo.startsWith('http') ? order.rider_photo : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/riders/${order.rider_photo}`) : ASSETS.AVATAR}
                  alt={order.rider_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-brand-success-vibrant h-[18px] flex items-center justify-center gap-[6px] z-10">
                  <img src={ASSETS.VERIFIED_SVG} alt="V" className="w-[12px] h-[12px]" />
                  <span className="text-white text-[10px] font-medium font-satoshi">Verified</span>
                </div>
              </div>
              <div className="flex-1 -mt-1">
                <p className={cn("text-[14px] font-medium font-satoshi leading-tight mb-[6px]", isDarkMode ? "text-white" : "text-black")}>
                  How was your delivery with {order.rider_name}?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={28}
                      fill={stars >= s ? '#FACC15' : 'none'}
                      stroke="#FACC15"
                      className="cursor-pointer outline-none active:scale-125 transition-transform"
                      onClick={() => setStars(s)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Safety Toggle (Visible after stars > 0) */}
            {stars > 0 && (
              <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className={cn("text-[14px] font-medium font-satoshi mb-3", isDarkMode ? "text-white/80" : "text-black/80")}>
                  Would you feel safe if this rider delivered to you again?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRecommendSolo(true)}
                    className={cn(
                      "flex-1 h-[44px] rounded-full flex items-center justify-center gap-2 border transition-all",
                      recommendSolo === true
                        ? "bg-brand-success/10 border-brand-success text-brand-success"
                        : isDarkMode ? "border-white/10 text-white/40" : "border-brand-border-light text-black/40"
                    )}
                  >
                    <Check size={18} />
                    <span className="font-bold">Yes</span>
                  </button>
                  <button
                    onClick={() => setRecommendSolo(false)}
                    className={cn(
                      "flex-1 h-[44px] rounded-full flex items-center justify-center gap-2 border transition-all",
                      recommendSolo === false
                        ? "bg-brand-error/10 border-brand-error text-brand-error"
                        : isDarkMode ? "border-white/10 text-white/40" : "border-brand-border-light text-black/40"
                    )}
                  >
                    <AlertTriangle size={18} />
                    <span className="font-bold">No</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tip Selector (Lifted from OrderDetailsSheet) */}
          <div
            className={cn(
              "rounded-[13px] mb-[13px] p-[14px] border",
              isDarkMode ? "bg-[#191919]/30 border-white/10" : "bg-white border-brand-border-light"
            )}
          >
            <div className="flex items-center gap-2 mb-[15px]">
              <span className={cn("text-[15px] font-medium font-satoshi", isDarkMode ? "text-white" : "text-black")}>
                Add Tip
              </span>
              <button onClick={() => setShowDeliveryTipPopup(true)}>
                <img
                  src={isDarkMode ? ASSETS.DELIVERY_TIP_INFO : ASSETS.INFO_TIP}
                  alt="Info"
                  className={cn("w-4 h-4", isDarkMode ? "brightness-0 invert-[38%] sepia-[68%] saturate-[3440%] hue-rotate-[197deg] brightness-[102%] contrast-[106%]" : "")}
                />
              </button>
            </div>
            <p className={cn("text-[12px] font-normal font-satoshi mb-[15px] leading-tight", isDarkMode ? "text-white/60" : "text-black/60")}>
              Your tip goes directly to the rider and Grid.Pe doesn’t keep any share of it.
            </p>
            <div className="flex items-center justify-between mb-[22px]">
              {['10', '20', '30'].map(val => (
                <div key={val} className="relative w-[78px] h-[37px]">
                  <button
                    onClick={() => handleTipSelect(val)}
                    className={cn(
                      "relative w-full h-full flex items-center justify-center transition-all z-10 border",
                      val === '20' ? 'rounded-[19px]' : 'rounded-full',
                      isDarkMode 
                        ? (selectedTipOption === val ? "border-transparent" : "border-white/5")
                        : (selectedTipOption === val ? "bg-brand-primary border-brand-primary text-white" : "bg-white border-brand-border-light text-black")
                    )}
                    style={isDarkMode ? {
                      backgroundImage: `url(${selectedTipOption === val ? ASSETS.SELECTED_PILL : ASSETS.PILL})`,
                      backgroundSize: '100% 100%',
                    } : {}}
                  >
                    <span className={cn("font-medium font-satoshi text-[15px]", (isDarkMode || selectedTipOption === val) ? "text-white" : "text-black")}>
                      ₹{val}
                    </span>
                    {selectedTipOption === val && (
                      <div onClick={handleClearTip} className="ml-2 cursor-pointer">
                        <img src={ASSETS.CROSS_ICON} alt="X" className="w-3 h-3" />
                      </div>
                    )}
                    {val === '20' && (
                      <div className="absolute top-[23px] left-0 right-0 h-[14px] bg-brand-primary flex items-center justify-center z-10 rounded-b-[19px]">
                        <span className="text-white text-[7px] font-bold uppercase tracking-wider">MOST TIPPED</span>
                      </div>
                    )}
                  </button>
                </div>
              ))}
              <div className="relative w-[78px] h-[37px]">
                <button
                  onClick={() => handleTipSelect('other')}
                  className={cn(
                    "relative w-full h-full flex items-center justify-center rounded-full transition-all border",
                    isDarkMode 
                      ? (selectedTipOption === 'other' ? "border-transparent" : "border-white/5")
                      : (selectedTipOption === 'other' ? "bg-brand-primary border-brand-primary text-white" : "bg-white border-brand-border-light text-black")
                  )}
                  style={isDarkMode ? {
                    backgroundImage: `url(${selectedTipOption === 'other' ? ASSETS.SELECTED_PILL : ASSETS.PILL})`,
                    backgroundSize: '100% 100%',
                  } : {}}
                >
                  <span className={cn("font-medium font-satoshi text-[14px]", (isDarkMode || selectedTipOption === 'other') ? "text-white" : "text-black")}>
                    Other
                  </span>
                  {selectedTipOption === 'other' && (
                    <div onClick={handleClearCustomTip} className="ml-1 cursor-pointer">
                      <img src={ASSETS.CROSS_ICON} alt="X" className="w-2 h-2" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {selectedTipOption === 'other' && (
              <div className="w-full mb-[22px]">
                <div className={cn("h-[48px] w-full rounded-full border flex items-center px-4", isDarkMode ? "bg-brand-card-dark border-white/10" : "bg-white border-brand-border-light")}>
                  <span className={cn("font-medium font-satoshi mr-2 text-[14px]", isDarkMode ? "text-white" : "text-black")}>₹</span>
                  <input
                    type="text"
                    placeholder="Enter tip amount"
                    value={customTipValue}
                    onChange={handleCustomTipChange}
                    className={cn("bg-transparent font-satoshi text-[14px] focus:outline-none flex-1", isDarkMode ? "text-white" : "text-black")}
                  />
                  <button onClick={tipAmount > 0 ? handleClearCustomTip : handleApplyCustomTip} className="text-brand-primary text-[13px] font-medium">
                    {tipAmount > 0 ? 'Clear' : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className={cn("rounded-[12px] border overflow-hidden mb-6", isDarkMode ? "border-white/10" : "border-brand-border-light")}>
            <div className={cn("px-4 py-2 border-b", isDarkMode ? "border-white/10" : "border-brand-border-light")}>
              <span className={cn("text-[12px] font-medium font-satoshi", isDarkMode ? "text-white" : "text-black")}>
                Feedback (Optional)
              </span>
            </div>
            <textarea
              className={cn("w-full h-[80px] bg-transparent p-4 text-[14px] font-satoshi outline-none resize-none", isDarkMode ? "text-white" : "text-black")}
              placeholder="How was your experience?"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            disabled={stars === 0 || isSubmitting}
            onClick={handleSubmit}
            className={cn(
              "w-full h-[48px] rounded-full flex items-center justify-center text-[16px] font-bold transition-all border-none",
              isDarkMode ? "text-white" : "bg-black text-white",
              (stars === 0 || isSubmitting) && "opacity-50 grayscale cursor-not-allowed"
            )}
            style={isDarkMode ? {
              backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
              backgroundSize: '100% 100%',
            } : {}}
          >
            {isSubmitting ? <ButtonSpinner /> : 'Submit'}
          </button>
        </div>

        {/* Tip Info Popup */}
        {showDeliveryTipPopup && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div
              className={cn("relative p-6 flex flex-col items-center", isDarkMode ? "rounded-2xl border border-white/10" : "rounded-[13px] shadow-xl bg-white")}
              style={{
                width: isDarkMode ? '320px' : '362px',
                backgroundImage: isDarkMode ? `url(${ASSETS.POPUP_BG})` : undefined,
                backgroundSize: 'cover',
              }}
            >
              <img src={isDarkMode ? ASSETS.CARD_ICO : ASSETS.CARD_ICON} alt="Tip" className="w-8 h-8 mb-4" />
              <h2 className={cn("font-bold mb-4", isDarkMode ? "text-white" : "text-black")}>Delivery Tip</h2>
              <div className={cn("rounded-xl p-4", isDarkMode ? "bg-black" : "bg-gray-50")}>
                <p className={cn("text-[13px] leading-relaxed mb-2", isDarkMode ? "text-white" : "text-black")}>
                  Our delivery partners ride through traffic, harsh weather, and long distances to bring your order safely to your door.
                </p>
                <p className={cn("text-[13px] leading-relaxed", isDarkMode ? "text-white" : "text-black")}>
                  Tipping helps support their daily hustle, fuel, and hard work. Every rupee is a sign of recognition. 💙
                </p>
              </div>
              <button
                onClick={() => setShowDeliveryTipPopup(false)}
                className="mt-6 bg-black text-white px-8 h-[36px] rounded-full flex items-center gap-2"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingSheet;
