import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import buttonRemoveCard from "@/assets/button-remove-card.png";
import buttonCancel from "@/assets/button-cancel-wide.png";
import radioOn from "@/assets/radio-on.png";
import radioOff from "@/assets/radio-off.png";
import { useWebScroll } from "@/hooks/useWebScroll";

const DeleteAccountReasons = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const [selectedReason, setSelectedReason] = useState<number>(0); // Default to first option
  const [otherReason, setOtherReason] = useState("");

  const reasons = [
    "No longer using the service/platform",
    "Privacy concerns",
    "Difficulty navigating the platform",
    "Account security concerns",
    "Other (aka \u201cit\u2019s not you, it\u2019s me\u201d)"
  ];

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    navigate((location.state as any)?.originPath || "/home", { replace: true });
  };

  const handleDelete = () => {
    navigate("/delete-account-mobile", {
      state: {
        ...location.state,
        reason: reasons[selectedReason],
        details: selectedReason === 4 ? otherReason : undefined,
      },
    });
  };

  const isDeleteDisabled = selectedReason === 4 && !otherReason.trim();

  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col pb-safe pb-4 relative`}
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Red Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: "#FF1E1E",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      {/* Header */}
      <div className="px-5 pt-safe pt-4 flex items-center relative z-50 mb-8">
        <div className="absolute left-5">
          <BackButton onClick={handleGoBack} />
        </div>

        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans w-full text-center`}>Delete Account</h1>
      </div>

      <div className="px-5 flex-1 flex flex-col relative z-10">
        {/* Warning Section */}
        <div className="mb-8">
          <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans mb-2 leading-tight`}>
            You're about to vanish. This action is irreversible.
          </h2>
          <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans leading-relaxed`}>
            Make sure you have no active transactions and that your wallet balance is fully withdrawn.
            <br />
            (Deleting an account with a balance will result in total loss of funds. Poof.)
          </p>
        </div>

        {/* Reasons Section */}
        <div className="mb-2">
          <h3 className={`${isDarkMode ? 'text-[#707070]' : 'text-black/50'} text-[14px] font-bold font-sans tracking-widest uppercase mb-[6px]`}>
            REASON FOR DELETION
          </h3>
          <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans italic mb-4`}>
            (because "just vibes" isn't a valid reason apparently)
          </p>

          {/* Options Container */}
          {isDarkMode ? (
            <div className="relative rounded-[10px] p-[1px] bg-gradient-to-b from-white/12 to-black/20">
              <div
                className="w-full bg-[#191919]/30 backdrop-blur-[24px] rounded-[10px] flex flex-col overflow-hidden"
                style={{ height: '185px' }}
              >
                {reasons.map((reason, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedReason(index)}
                    className={`flex-1 flex items-center px-4 cursor-pointer relative ${index !== reasons.length - 1 ? 'border-b border-[#919191]/25' : ''
                      }`}
                  >
                    <div className="shrink-0 mr-3">
                      <img
                        src={selectedReason === index ? radioOn : radioOff}
                        alt={selectedReason === index ? "Selected" : "Not selected"}
                        className="w-[20px] h-[20px] object-contain"
                      />
                    </div>
                    <span className="text-white text-[13px] font-medium font-sans truncate">
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="w-full rounded-[10px] flex flex-col overflow-hidden border border-[#E9EAEB]"
              style={{ height: '185px', backgroundColor: '#FFFFFF' }}
            >
              {reasons.map((reason, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedReason(index)}
                  className={`flex-1 flex items-center px-4 cursor-pointer relative ${index !== reasons.length - 1 ? 'border-b border-[#E9EAEB]' : ''
                    }`}
                >
                  <div className="shrink-0 mr-3">
                    <img
                      src={selectedReason === index ? radioOn : radioOff}
                      alt={selectedReason === index ? "Selected" : "Not selected"}
                      className="w-[20px] h-[20px] object-contain"
                    />
                  </div>
                  <span className="text-black text-[13px] font-medium font-sans truncate">
                    {reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Input - Conditionally Rendered */}
        {selectedReason === 4 && (
          <div className="mt-[10px] relative">
            <textarea
              value={otherReason}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setOtherReason(e.target.value);
                }
              }}
              placeholder={'Go ahead, break our heart. Tell us how we failed you\u2026'}
              className={`w-full h-[146px] rounded-[10px] p-4 text-[12px] font-light font-sans resize-none focus:outline-none ${isDarkMode
                ? 'bg-[#191919]/30 border border-white/10 text-white focus:border-white/20 placeholder:text-[#878787]'
                : 'bg-white border border-[#E9EAEB] text-black focus:border-black/20 placeholder:text-[#AAAAAA]'
                } placeholder:font-light placeholder:text-[12px]`}
            />
            <div className={`absolute bottom-4 right-4 ${isDarkMode ? 'text-[#878787]' : 'text-black/40'} text-[12px] font-light font-sans`}>
              (max {200 - otherReason.length} chars of heartbreak)
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="px-5 pb-safe pb-4 mt-auto flex flex-col gap-3 relative z-10">
        {/* Delete Anyway */}
        <button
          className={`w-full h-[48px] relative flex items-center justify-center transition-transform ${isDeleteDisabled ? "opacity-50 grayscale pointer-events-none" : "active:scale-95"
            }`}
          onClick={handleDelete}
          disabled={isDeleteDisabled}
        >
          {isDarkMode ? (
            <img
              src={buttonRemoveCard}
              alt="Delete Anyway"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full bg-[#FF3B30] pointer-events-none" />
          )}
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">
            Delete Anyway
          </span>
        </button>

        {/* Cancel */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleCancel}
        >
          {isDarkMode ? (
            <img
              src={buttonCancel}
              alt="Cancel"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full pointer-events-none" style={{ backgroundColor: '#EBEBEB' }} />
          )}
          <span className={`relative z-10 ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-semibold font-sans`}>Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountReasons;
