import { useState, useRef, useEffect } from "react";
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
  // State for camera results
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Refs for camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);


  const handleTriggerCapture = () => {
    setSelfieError(null);
    setIsCameraOpen(true);
  };


  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setSelfieError("Unable to access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Target a high-quality square-ish crop for the selfie
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext('2d');
      if (context) {
        // Draw centered square crop
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        // Mirror the image for selfie naturality if needed, 
        // but typically standard capture is non-mirrored. 
        // Let's keep it simple for now.
        context.drawImage(video, startX, startY, size, size, 0, 0, size, size);

        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataURL);
        setIsCameraOpen(false);
        setSelfieError(null);
      }
    }
  };

  // Manage camera lifecycle
  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOpen]);



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
                    onClick={handleTriggerCapture}
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
              <div className={`mt-auto pb-8 pt-4 max-w-[362px] mx-auto w-full ${isDarkMode ? 'bg-transparent' : 'bg-[#FFFFFF]/80 backdrop-blur-md'} z-20 px-5`}>
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
          <div className="flex items-center px-5 pt-4 pb-2 absolute top-0 left-0 right-0 z-20 safe-area-top">
            <button
              onClick={() => setIsCameraOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Blue dot/camera indicator simulation */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
            </div>
          </div>

          {/* Camera Viewport */}
          <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror selfie view
            />

            {/* Frame Asset */}
            <div className="relative w-[85%] aspect-square max-w-[360px] flex items-center justify-center z-10">
              <img src={frameIcon} alt="Frame" className="w-full h-full object-contain" />

              {/* Face Guide Silhouette/Circle if needed, but we use the provided frameIcon */}
            </div>

            {/* Text Instructions */}
            <div className="mt-12 flex flex-col items-center gap-4 z-10">
              <p className="text-white text-[20px] font-normal font-sans text-center">Align your face within the frame</p>

              <div className="w-[256px] h-[34px] bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/5">
                <span className="text-white/80 text-[12px] font-normal font-sans">Avoid sunglasses, hats, or masks.</span>
              </div>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="h-[140px] pb-10 flex items-center justify-center relative bg-black px-8">
            {/* Shutter Button */}
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-90 z-20"
            >
              <img src={shutterIcon} alt="Capture" className="w-full h-full object-contain" />
            </button>

            {/* Flash Button (Stub) */}
            <div className="absolute inset-0 flex items-center justify-end px-12 pointer-events-none">
              <button className="w-8 h-8 flex items-center justify-center pointer-events-auto opacity-50">
                <img src={flashIcon} alt="Flash" className="w-full h-full object-contain" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas for Snapshots */}
      <canvas ref={canvasRef} className="hidden" />

    </>

  );
};

export default KYCSelfie;