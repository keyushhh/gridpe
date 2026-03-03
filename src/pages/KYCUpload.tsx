import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CalendarIcon, X } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import stepsBg from "@/assets/kyc-steps-bg.png";
import iconFlash from "@/assets/flash.svg";
import iconGallery from "@/assets/gallery.svg";
import iconPlaceholder from "@/assets/icon-gallery-placeholder.png";
import inputFieldBg from "@/assets/input-field-bg.png";
import pendingStatusIcon from "@/assets/awaiting.svg";
import otpVerifiedIcon from "@/assets/otp-verified.png";
import thumbnailsBg from "@/assets/thumbnails-bg.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { GlassCalendar } from "@/components/GlassCalendar";

const KYCUpload = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [searchParams] = useSearchParams();
  const documentType = searchParams.get("doc") || "aadhar";
  const isFxFlow = searchParams.get("flow") === "fx";

  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [dobError, setDobError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  // Document validation rules
  const documentLabels: Record<string, string> = {
    aadhar: "Aadhar Card",
    voter: "Voter ID",
    passport: "Passport",
    pan: "PAN Card"
  };

  const validateDocumentNumber = (value: string): string => {
    switch (documentType) {
      case "aadhar":
        // 12 digits only
        if (!/^\d{12}$/.test(value)) {
          return `Enter a valid ${documentLabels[documentType]} number`;
        }
        break;
      case "voter":
        // 10 alphanumeric characters
        if (!/^[a-zA-Z0-9]{10}$/.test(value)) {
          return `Enter a valid ${documentLabels[documentType]} number`;
        }
        break;
      case "passport":
        // 8 characters: 1 letter + 7 digits
        if (!/^[a-zA-Z]\d{7}$/.test(value)) {
          return `Enter a valid ${documentLabels[documentType]} number`;
        }
        break;
      case "pan":
        // 10 characters for PAN
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value) && !/^[a-zA-Z0-9]{10}$/.test(value)) {
          return `Enter a valid ${documentLabels[documentType]} number`;
        }
        break;
    }
    return "";
  };

  const documentError = useMemo(() => {
    if (documentNumber.trim() === "") return "";
    return validateDocumentNumber(documentNumber);
  }, [documentNumber, documentType]);

  // Validate age (18+)
  const validateAge = (date: Date): boolean => {
    const age = differenceInYears(new Date(), date);
    return age >= 18;
  };

  // State for camera/images
  const [flashOn, setFlashOn] = useState(false);
  const [images, setImages] = useState<{ front: string | null; back: string | null }>({
    front: null,
    back: null,
  });

  // Error states for validation
  const [imageQualityError, setImageQualityError] = useState<string | null>(null);
  const [documentMismatchError, setDocumentMismatchError] = useState<string | null>(null);
  const [nameMismatchError, setNameMismatchError] = useState<string | null>(null);

  // State for address proof (PAN card only)
  const [addressProof, setAddressProof] = useState<string | null>(null);
  const addressProofInputRef = useRef<HTMLInputElement>(null);

  // Reference for hidden file input and live camera
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Shutterless Auto-Capture States
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const detectionRef = useRef<number | null>(null);
  const lastCornersRef = useRef<{ x: number; y: number }[]>([]);
  const stabilityCounterRef = useRef(0);





  // Check OTP verification when OTP changes
  useEffect(() => {
    if (otp === "123456" && !otpVerified) {
      setOtpVerified(true);
    }
  }, [otp, otpVerified]);

  // Handle Camera Stream
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
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
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }
  };

  const processVideoFrame = () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || isCapturing) {
      detectionRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    // ADVANCED DETECTION SIMULATION (OpenCV structure)
    // 1. Check for stability and corners

    // Simulate finding 4 corners
    const currentCorners = [
      { x: 10 + Math.random() * 2, y: 10 + Math.random() * 2 },
      { x: 90 + Math.random() * 2, y: 12 + Math.random() * 2 },
      { x: 88 + Math.random() * 2, y: 85 + Math.random() * 2 },
      { x: 12 + Math.random() * 2, y: 88 + Math.random() * 2 }
    ];

    // Stability Lock: shift < 5px
    let movement = 0;
    if (lastCornersRef.current.length === 4) {
      movement = currentCorners.reduce((acc, curr, i) => {
        const last = lastCornersRef.current[i];
        return acc + Math.sqrt(Math.pow(curr.x - last.x, 2) + Math.pow(curr.y - last.y, 2));
      }, 0) / 4;
    }

    const stable = movement < 0.5; // Scaled for simulation
    setIsStable(stable);
    lastCornersRef.current = currentCorners;

    // Aspect Ratio Check (1.5 to 1.6)
    // Standard Aadhar/PAN is ~1.58
    const width = 80; // Simulated
    const height = 50; // Simulated
    const aspectRatio = width / height; // 1.6
    const validAspectRatio = aspectRatio >= 1.5 && aspectRatio <= 1.6;

    // Safety Margin: > 60% area of VIEWPORT (simulated)
    const cardArea = (85 * 75) / (100 * 100); // 0.6375 (63.75%)
    const validArea = cardArea >= 0.6;

    if (validAspectRatio && validArea && stable) {
      stabilityCounterRef.current += 1;
      if (stabilityCounterRef.current >= 30) { // Approx 500ms at 60fps
        setIsLocked(true);
        handleAutoCapture();
      }
    } else {
      stabilityCounterRef.current = 0;
      setIsLocked(false);
    }

    setDetectionProgress(prev => (stabilityCounterRef.current / 30) * 100);
    detectionRef.current = requestAnimationFrame(processVideoFrame);
  };

  const handleAutoCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setIsSearching(false);

    // Success feedback pulse happens just before capture
    setTimeout(() => {
      capturePhoto();

      setTimeout(() => {
        setIsCapturing(false);
        setIsLocked(false);
        setIsSearching(true);
        stabilityCounterRef.current = 0;
      }, 1500);
    }, 300); // Pulse duration
  };


  // Auto-start/stop camera based on image presence
  useEffect(() => {
    const isBothCaptured = images.front !== null && images.back !== null;
    if (!isBothCaptured) {
      if (!stream) {
        startCamera();
      }
      // Start detection loop
      if (!detectionRef.current) {
        detectionRef.current = requestAnimationFrame(processVideoFrame);
      }
    } else if (isBothCaptured && stream) {
      stopCamera();
    }

    return () => stopCamera();
  }, [images.front, images.back, isCapturing]);



  // Check if all conditions are met to enable Continue button
  const isFormComplete =
    images.front !== null &&
    images.back !== null &&
    documentNumber.trim() !== "" &&
    documentError === "" &&
    fullName.trim() !== "" &&
    dob !== undefined &&
    dobError === "" &&
    otpVerified &&
    !imageQualityError &&
    !documentMismatchError &&
    !nameMismatchError &&
    (documentType !== "pan" || addressProof !== null);

  // Handle address proof file selection
  const handleAddressProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert("Only .JPG, .PNG, .PDF file formats are allowed");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddressProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  // Toggle Flash
  const toggleFlash = () => {
    setFlashOn(!flashOn);
    // In a real native implementation, this would involve setTorch on the video track
    const track = stream?.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      // Note: torch constraint often requires specific advanced permissions or secure contexts
      (track as any).applyConstraints({
        advanced: [{ torch: !flashOn }]
      }).catch((e: any) => console.log("Flash not supported", e));
    }
    console.log("Flash toggled:", !flashOn);
  };


  // Handle Gallery/Camera Selection
  const handleTriggerCapture = (side?: 'front' | 'back') => {
    if (side) setActiveSide(side);
    else setActiveSide(null); // Fallback to auto-detection

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Simulate image quality validation with 20% error chance for demo
        const hasQualityError = Math.random() < 0.2;

        if (hasQualityError) {
          setImageQualityError("The uploaded image is blurry and unreadable. Please fix the background and lighting and try again.");
          return;
        }

        // Clear any previous quality error on successful upload
        setImageQualityError(null);

        // Update based on active side or auto-detect
        const result = reader.result as string;
        if (activeSide === 'front') {
          setImages(prev => ({ ...prev, front: result }));
        } else if (activeSide === 'back') {
          setImages(prev => ({ ...prev, back: result }));
        } else {
          // Fallback logic: first upload fills 'front', second fills 'back'
          if (!images.front) {
            setImages(prev => ({ ...prev, front: result }));
          } else if (!images.back) {
            setImages(prev => ({ ...prev, back: result }));
          }
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input so same file can be selected again if needed
    if (event.target) {
      event.target.value = '';
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Target resolution for the cropped ID
      const targetWidth = 1200;
      const targetHeight = 1200 / 1.58; // Standard ID aspect ratio

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext('2d');

      if (context) {
        // AUTO-CROP LOGIC
        // We simulate a clean crop by drawing only the area that matches
        // our detected ID card, effectively removing the environment.

        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;

        // Simulating the 80% area crop as defined by the "Safe Zone"
        const cropX = sourceWidth * 0.1;
        const cropY = sourceHeight * 0.2;
        const cropWidth = sourceWidth * 0.8;
        const cropHeight = sourceHeight * 0.6;

        context.drawImage(
          video,
          cropX, cropY, cropWidth, cropHeight, // Source
          0, 0, targetWidth, targetHeight      // Destination
        );

        const dataURL = canvas.toDataURL('image/jpeg', 0.9);

        // Automated filling logic
        if (!images.front) {
          setImages(prev => ({ ...prev, front: dataURL }));
        } else if (!images.back) {
          setImages(prev => ({ ...prev, back: dataURL }));
        }
      }
    }
  };


  const handleClearImage = (side: 'front' | 'back') => {
    setImages(prev => ({ ...prev, [side]: null }));
    // Reactivating camera is handled by the useEffect
  };

  const handleClearAll = () => {
    setImages({ front: null, back: null });
    setImageQualityError(null);
    setDocumentMismatchError(null);
    setNameMismatchError(null);
  };


  // Simulate document verification when both images are uploaded
  useEffect(() => {
    if (images.front && images.back && documentNumber.trim() && !documentError) {
      // 15% chance of document number mismatch for demo
      const hasDocMismatch = Math.random() < 0.15;
      if (hasDocMismatch) {
        setDocumentMismatchError("Document number does not match the uploaded document. Please verify and re-enter.");
      } else {
        setDocumentMismatchError(null);
      }
    }
  }, [images.front, images.back, documentNumber]);

  // Simulate name verification
  useEffect(() => {
    if (images.front && images.back && fullName.trim()) {
      // 15% chance of name mismatch for demo
      const hasNameMismatch = Math.random() < 0.15;
      if (hasNameMismatch) {
        setNameMismatchError("Name does not match the document. Please enter your name exactly as it appears on the document.");
      } else {
        setNameMismatchError(null);
      }
    }
  }, [images.front, images.back, fullName]);

  return (
    <div
      className="h-[100dvh] w-full flex flex-col safe-area-top safe-area-bottom overflow-hidden relative"
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

      {/* Hidden File Input for Document Capture */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      {/* Hidden Canvas for Snapshots */}
      <canvas ref={canvasRef} className="hidden" />



      {/* Header */}
      <div className="flex-none flex items-center justify-between px-5 pt-12 pb-2 z-10">
        <button
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20' : 'border-[#E6E8EB] bg-white'} flex items-center justify-center transition-colors hover:bg-white/10`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}>KYC</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="min-h-full flex flex-col px-5 pt-4 pb-10">
          {/* Steps Indicator */}
          <div
            className={`w-full h-[88px] rounded-[20px] p-5 mb-6 relative overflow-hidden flex-none ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${stepsBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >
            <div className="flex justify-between items-center mb-3">
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Step 2/4</span>
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Upload & Verify</span>
            </div>
            <div className={`w-full h-[6px] ${isDarkMode ? 'bg-white/20' : 'bg-[#F2F4F7]'} rounded-full overflow-hidden`}>
              <div className="h-full w-[50%] bg-[#5260FE] rounded-full" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-4 flex-none">
            <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold mb-1 font-sans`}>Upload Document</h2>
            <p className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black'} text-[14px] font-sans font-normal`}>
              Position your ID clearly within the frame.
            </p>
          </div>

          {/* Camera Area Container */}
          <div className="flex flex-col items-center mb-6">
            {/* Camera Box */}
            <div
              className={`w-[362px] h-[184px] bg-black rounded-[24px] flex flex-col items-center justify-center relative overflow-hidden mb-4 transition-all duration-300 ${isLocked ? 'ring-4 ring-green-500 ring-offset-2' : ''}`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ filter: isLocked ? 'brightness(1.1) contrast(1.2)' : 'none' }}
              />

              {/* Laser Line & Scanning Overlays */}
              {isSearching && (!images.front || !images.back) && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Laser Line (Subtle monochrome pulsing) */}
                  <div className={`absolute left-0 right-0 h-[1.5px] bg-white/30 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-30 transition-all duration-300 ${isLocked ? 'bg-green-500 shadow-green-500' : 'animate-scan'}`} />

                  <style>{`
                    @keyframes scan {
                      0% { top: 0%; opacity: 0.2; }
                      50% { top: 100%; opacity: 0.5; }
                      100% { top: 0%; opacity: 0.2; }
                    }
                    .animate-scan {
                      animation: scan 3s ease-in-out infinite;
                    }
                  `}</style>

                  {/* Dynamic Corner Brackets */}
                  <div className={`absolute top-4 left-4 w-10 h-10 border-t-[3px] border-l-[3px] rounded-tl-lg ${isLocked ? 'border-green-500 scale-110' : 'border-white/20'} transition-all duration-300`} />
                  <div className={`absolute top-4 right-4 w-10 h-10 border-t-[3px] border-r-[3px] rounded-tr-lg ${isLocked ? 'border-green-500 scale-110' : 'border-white/20'} transition-all duration-300`} />
                  <div className={`absolute bottom-4 left-4 w-10 h-10 border-b-[3px] border-l-[3px] rounded-bl-lg ${isLocked ? 'border-green-500 scale-110' : 'border-white/20'} transition-all duration-300`} />
                  <div className={`absolute bottom-4 right-4 w-10 h-10 border-b-[3px] border-r-[3px] rounded-br-lg ${isLocked ? 'border-green-500 scale-110' : 'border-white/20'} transition-all duration-300`} />

                  {/* Search Feedback */}
                  <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2">
                    {isStable ? (
                      <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                        <span className={`text-[10px] uppercase font-bold tracking-widest ${isLocked ? 'text-green-400' : 'text-white/80'}`}>
                          {isLocked ? "LOCKING..." : "KEEP HOLDING..."}
                        </span>
                      </div>
                    ) : (
                      <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                        HOLD STEADY
                      </span>
                    )}
                  </div>
                </div>
              )}

              {images.front && images.back && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-white text-sm font-semibold tracking-wide">CAPTURE COMPLETE</p>
                  </div>
                </div>
              )}
            </div>





            {/* Label Pill */}
            <div
              className="h-[31px] px-6 rounded-full flex items-center justify-center mb-4 transition-colors"
              style={{
                backgroundColor: isDarkMode ? "#000000" : "#5260FE"
              }}
            >
              <p className="text-white text-[12px] font-medium font-sans">
                {images.front ? "Upload back side" : "Upload front side"}
              </p>
            </div>

            {/* Controls - Moved outside and below */}
            <div className="flex items-center gap-4 z-20">
              <button
                onClick={toggleFlash}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${!isDarkMode ? 'bg-white' : 'border border-white/10 bg-white/10'}`}
              >
                <img
                  src={iconFlash}
                  alt="Flash"
                  className="w-10 h-10"
                />
              </button>
              <button
                onClick={() => handleTriggerCapture()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${!isDarkMode ? 'bg-white' : 'border border-white/10 bg-white/10'}`}
              >
                <img
                  src={iconGallery}
                  alt="Gallery"
                  className="w-10 h-10"
                />
              </button>
            </div>

          </div>

          {/* Thumbnails Section */}
          <div
            className={`mb-6 rounded-[16px] p-4 ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${thumbnailsBg})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            } : {}}
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {/* Front Side */}
                <div
                  onClick={() => handleTriggerCapture('front')}
                  className={`w-[100px] h-[80px] cursor-pointer rounded-[12px] border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-[#E9EAEB] bg-[#F9FAFB]'} flex flex-col items-center justify-center gap-2 overflow-hidden relative`}
                >
                  {images.front ? (
                    <>
                      <img src={images.front} alt="Front" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearImage('front');
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-30"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <>
                      <img src={iconPlaceholder} alt="" className={`w-6 h-6 ${isDarkMode ? 'opacity-50' : 'filter brightness-0 opacity-20'}`} />
                      <span className={`${isDarkMode ? 'text-white/60' : 'text-black'} text-[10px] font-sans`}>Front side</span>
                    </>
                  )}
                </div>
                {/* Back Side */}
                <div
                  onClick={() => handleTriggerCapture('back')}
                  className={`w-[100px] h-[80px] cursor-pointer rounded-[12px] border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-[#E9EAEB] bg-[#F9FAFB]'} flex flex-col items-center justify-center gap-2 overflow-hidden relative`}
                >
                  {images.back ? (
                    <>
                      <img src={images.back} alt="Back" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearImage('back');
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-30"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <>
                      <img src={iconPlaceholder} alt="" className={`w-6 h-6 ${isDarkMode ? 'opacity-50' : 'filter brightness-0 opacity-20'}`} />
                      <span className={`${isDarkMode ? 'text-white/60' : 'text-black'} text-[10px] font-sans`}>Back side</span>
                    </>
                  )}
                </div>


              </div>
              <button
                onClick={handleClearAll}
                disabled={!images.front && !images.back}
                className={`text-[12px] underline underline-offset-2 transition-colors font-sans ${(!images.front && !images.back) ? 'text-gray-500 cursor-not-allowed' : 'text-red-500 hover:text-red-400'}`}
              >
                Clear All
              </button>
            </div>
            {/* Image Quality Error */}
            {imageQualityError && (
              <p className="text-[#FF6B6B] text-[12px] mt-3 font-sans">{imageQualityError}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-8">
            <div>
              <Input
                placeholder="Document Number"
                value={documentNumber}
                onChange={(e) => {
                  setDocumentNumber(e.target.value);
                  setDocumentMismatchError(null); // Clear mismatch error on edit
                }}
                className={`w-[363px] h-[48px] rounded-[100px] ${isDarkMode ? 'text-white border-none' : 'text-black bg-[#F7F8FA] border border-[#E6E8EB]'} placeholder:text-muted-foreground/60 px-6 mx-auto block ${documentMismatchError ? 'border-2 border-[#FF6B6B]' : ''}`}
                style={isDarkMode ? {
                  backgroundImage: `url(${inputFieldBg})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: 'transparent'
                } : {}}
              />
              {documentError && (
                <p className="text-red-500 text-[12px] mt-1 ml-6 font-sans">{documentError}</p>
              )}
              {documentMismatchError && !documentError && (
                <p className="text-[#FF6B6B] text-[12px] mt-1 ml-6 font-sans">{documentMismatchError}</p>
              )}
            </div>
            <div>
              <Input
                placeholder="Full Name as per Document"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setNameMismatchError(null); // Clear mismatch error on edit
                }}
                className={`w-[363px] h-[48px] rounded-[100px] ${isDarkMode ? 'text-white border-none' : 'text-black bg-[#F7F8FA] border border-[#E6E8EB]'} placeholder:text-muted-foreground/60 px-6 mx-auto block ${nameMismatchError ? 'border-2 border-[#FF6B6B]' : ''}`}
                style={isDarkMode ? {
                  backgroundImage: `url(${inputFieldBg})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: 'transparent'
                } : {}}
              />
              {nameMismatchError && (
                <p className="text-[#FF6B6B] text-[12px] mt-1 ml-6 font-sans">{nameMismatchError}</p>
              )}
            </div>
            {/* Date of Birth with Calendar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={`w-[363px] h-[48px] rounded-[100px] text-left px-6 mx-auto flex items-center justify-between ${isDarkMode ? 'border-none' : 'bg-[#F7F8FA] border border-[#E6E8EB]'}`}
                style={isDarkMode ? {
                  backgroundImage: `url(${inputFieldBg})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: 'transparent'
                } : {}}
              >
                <span className={`${dob ? (isDarkMode ? "text-white" : "text-black") : "text-muted-foreground/60"} font-sans`}>
                  {dob ? format(dob, "dd MMM yyyy") : "Date of Birth"}
                </span>
                <CalendarIcon className="w-5 h-5 text-muted-foreground/60" />
              </button>

              {showCalendar && (
                <div className="relative mt-2 z-50 flex justify-center">
                  <GlassCalendar
                    selected={dob}
                    onSelect={(date) => {
                      if (date) {
                        if (validateAge(date)) {
                          setDob(date);
                          setDobError("");
                        } else {
                          setDob(date);
                          setDobError("You must be 18 years or older");
                        }
                      }
                      setShowCalendar(false);
                    }}
                    onClose={() => setShowCalendar(false)}
                    disableFutureDates={true}
                  />
                </div>
              )}
              {dobError && (
                <p className="text-red-500 text-[12px] mt-1 ml-6 font-sans">{dobError}</p>
              )}
            </div>

            {/* Address Proof Section - Only for PAN Card */}
            {documentType === "pan" && (
              <div className="mt-4">
                <p className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black'} text-[14px] mb-4 font-sans`}>
                  We'll also need a document that shows your address. Please upload a valid address proof (e.g., Aadhaar, Voter ID, Driver's License, utility bill, or bank statement).
                </p>
                <input
                  type="file"
                  ref={addressProofInputRef}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleAddressProofChange}
                />
                <div
                  onClick={() => addressProofInputRef.current?.click()}
                  className={`w-full rounded-[16px] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDarkMode ? 'bg-black hover:bg-black/80' : 'bg-[#F9FAFB] border border-[#E9EAEB] hover:bg-[#F2F4F7]'}`}
                >
                  {addressProof ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-green-400 text-[14px] font-sans">Document uploaded</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddressProof(null);
                        }}
                        className="text-red-400 text-[12px] underline mt-1 font-sans"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 mb-3 flex items-center justify-center">
                        <svg className={`w-6 h-6 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[14px] mb-1 font-sans`}>Only .JPG, .PNG, .PDF file formats are allowed.</p>
                      <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[14px] mb-3 font-sans`}>Max file size 5MB.</p>
                      <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px] font-sans`}>Tap to upload your document here.</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* OTP Section */}
          <div className="space-y-4">
            <p className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black'} text-[14px] font-sans`}>
              An OTP has been sent to your registered mobile number.
            </p>
            <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={otpVerified}>
              <InputOTPGroup className="w-full justify-between gap-2">
                {[0, 1, 2, 3, 4, 5].map(index => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className={`w-[52px] h-[68px] rounded-[7px] border ${isDarkMode ? 'border-white/10 bg-white/5 text-white' : 'border-[#E9EAEB] bg-white text-black'} text-xl font-semibold`}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {otpVerified ? (
                  <>
                    <img src={otpVerifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
                    <span className="text-green-400 text-[12px] font-sans">OTP verified</span>
                  </>
                ) : (
                  <>
                    <img src={pendingStatusIcon} alt="Pending" className={`w-5 h-5 object-contain ${!isDarkMode ? '' : ''}`} />
                    <span className={`${isDarkMode ? 'text-white/80' : 'text-black'} text-[12px] font-sans`}>Awaiting OTP verification</span>
                  </>
                )}
              </div>
              <button
                className={`text-[12px] font-sans ${otpVerified ? 'text-gray-500 cursor-not-allowed' : (isDarkMode ? 'text-muted-foreground hover:text-white' : 'text-black hover:text-black/80')}`}
                disabled={otpVerified}
              >
                Didn't receive OTP?
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Constrained container */}
        <div className={`mt-auto pb-8 pt-4 max-w-[362px] mx-auto w-full ${isDarkMode ? 'bg-transparent' : 'bg-[#FFFFFF]/80 backdrop-blur-md'} z-20 px-5`}>
          <Button
            variant="gradient"
            className="w-full h-[48px] rounded-full text-white font-semibold text-[16px]"
            disabled={!isFormComplete}
            style={{
              opacity: isFormComplete ? 1 : 0.5,
            }}
            onClick={() => navigate("/kyc-selfie", {
              state: {
                images,
                documentNumber,
                fullName,
                dob: dob?.toISOString(),
                addressProof,
                documentType,
                flow: isFxFlow ? "fx" : null
              }
            })}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KYCUpload;
