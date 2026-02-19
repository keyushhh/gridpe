import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import stepsBg from "@/assets/kyc-steps-bg.png";
import flashIcon from "@/assets/flash.png";
import shutterIcon from "@/assets/shutter.png";
import thumbnailBg from "@/assets/thumbnail-bg.png";
import frameIcon from "@/assets/frame.png";
import { Button } from "@/components/ui/button";

const KYCSelfie = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);

  // Ref for the video element (even if we simulate, good to have structure)
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
    setSelfieError(null); // Clear error when opening camera to retry
  };

  const handleCapture = () => {
    // Simulate capture with 25% chance of error for demo
    const hasSelfieError = Math.random() < 0.25;

    if (hasSelfieError) {
      setSelfieError("Selfie was too dark and unclear. Please try again with proper lighting and background.");
      setIsCameraOpen(false);
      setCapturedImage(null);
      return;
    }

    // Clear any previous error on successful capture
    setSelfieError(null);

    // In a real app, we would draw video frame to canvas
    // For now, we'll just use a placeholder color/data URI
    const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNTI2MEZFIi8+PC9zdmc+";
    setCapturedImage(placeholderImage);
    setIsCameraOpen(false);
  };

  return (
    <>
      <div
        className="h-[100dvh] w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
        style={{
          backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
          backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Light Mode Status Blob (Top Glow) */}
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
        <div className="flex-none flex items-center justify-between px-5 pt-12 pb-2 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20' : 'border-[#E6E8EB] bg-white'} flex items-center justify-center transition-colors hover:bg-white/10`}
          >
            <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          </button>
          <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}>KYC</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 relative">
          <div className="min-h-full flex flex-col px-5 pt-4 pb-10">
            {/* Steps Indicator */}
            <div
              className={`w-full h-[88px] rounded-[20px] p-5 mb-8 relative overflow-hidden shrink-0 ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
              style={isDarkMode ? {
                backgroundImage: `url(${stepsBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : {}}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Step 3/4</span>
                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Verify Your Identity</span>
              </div>
              <div className={`w-full h-[6px] ${isDarkMode ? 'bg-white/20' : 'bg-[#F2F4F7]'} rounded-full overflow-hidden`}>
                <div className="h-full w-[75%] bg-[#5260FE] rounded-full" />
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold mb-4 font-sans`}>Verify your identity</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white/60' : 'bg-[#616161]'}`} />
                  <p className={`${isDarkMode ? 'text-white/60' : 'text-[#616161]'} text-[14px] font-normal font-sans`}>Take a clear selfie</p>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white/60' : 'bg-[#616161]'}`} />
                  <p className={`${isDarkMode ? 'text-white/60' : 'text-[#616161]'} text-[14px] font-normal font-sans`}>Match against uploaded document</p>
                </li>
              </ul>
            </div>

            {/* Action Area */}
            <div className="mt-4">
              {!capturedImage ? (
                <>
                  <Button
                    variant="default"
                    className="w-full h-[48px] rounded-full text-[16px] font-semibold bg-[#5260FE] hover:bg-[#5260FE]/90 text-white"
                    onClick={handleOpenCamera}
                  >
                    {selfieError ? "Retake Selfie" : "Open Camera"}
                  </Button>
                  {/* Selfie Error Message */}
                  {selfieError && (
                    <p className="text-[#FF6B6B] text-[13px] mt-3 text-center font-sans">{selfieError}</p>
                  )}
                </>
              ) : (
                <div
                  className={`w-full h-[96px] rounded-[16px] p-4 flex items-center gap-4 ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : 'border border-white/5'}`}
                  style={isDarkMode ? {
                    backgroundImage: `url(${thumbnailBg})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  } : {}}
                >
                  <div className="w-[82px] h-[69px] rounded-[12px] overflow-hidden bg-black flex-shrink-0">
                    <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                  <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-normal leading-tight font-sans`}>
                    You didn't have to snap this hard, but we appreciate it.
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Constrained container */}
            {capturedImage && (
              <div className={`mt-auto pb-8 pt-4 max-w-[362px] mx-auto w-full ${isDarkMode ? 'bg-gradient-to-t from-[#0a0a12] to-transparent' : 'bg-[#FFFFFF]/80 backdrop-blur-md'} z-20 px-5`}>
                <Button
                  variant="default"
                  className="w-full h-[48px] rounded-full text-[16px] font-semibold bg-[#5260FE] hover:bg-[#5260FE]/90 text-white"
                  onClick={() => {
                    // Navigate to next step or complete
                    navigate("/kyc-review", {
                      state: {
                        ...location.state,
                        selfie: capturedImage
                      }
                    });
                  }}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Camera Header */}
          <div className="flex items-center px-5 pt-4 pb-2 absolute top-0 left-0 right-0 z-10 safe-area-top">
            <button
              onClick={() => setIsCameraOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Blue dot/camera indicator simulation */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
          </div>

          {/* Camera Viewport Simulation */}
          <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
            {/* Frame Asset */}
            <div className="relative w-[85%] aspect-square max-w-[360px] flex items-center justify-center">
              <img src={frameIcon} alt="Frame" className="w-full h-full object-contain" />
            </div>

            {/* Text Instructions */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="text-white text-[20px] font-normal font-sans text-center">Align your face within the frame</p>

              <div className="w-[256px] h-[34px] bg-[#090909] rounded-full flex items-center justify-center border border-white/5">
                <span className="text-white/80 text-[12px] font-normal font-sans">Avoid sunglasses, hats, or masks.</span>
              </div>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="h-[120px] pb-8 flex items-center justify-center relative bg-black px-8">
            {/* Shutter Button */}
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95 z-20"
            >
              <img src={shutterIcon} alt="Capture" className="w-full h-full object-contain" />
            </button>

            {/* Flash Button */}
            <div className="absolute inset-0 flex items-center justify-end px-12 pointer-events-none">
              <button className="w-8 h-8 flex items-center justify-center pointer-events-auto">
                <img src={flashIcon} alt="Flash" className="w-full h-full object-contain" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KYCSelfie;