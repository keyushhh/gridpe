import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CalendarIcon } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import stepsBg from "@/assets/kyc-steps-bg.png";
import iconFlash from "@/assets/icon-flash.png";
import iconGallery from "@/assets/icon-gallery.png";
import iconPlaceholder from "@/assets/icon-gallery-placeholder.png";
import inputFieldBg from "@/assets/input-field-bg.png";
import pendingStatusIcon from "@/assets/pending-status.png";
import otpVerifiedIcon from "@/assets/otp-verified.png";
import thumbnailsBg from "@/assets/thumbnails-bg.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { GlassCalendar } from "@/components/GlassCalendar";

const KYCUpload = () => {
  const navigate = useNavigate();
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

  // Reference for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check OTP verification when OTP changes
  useEffect(() => {
    if (otp === "123456" && !otpVerified) {
      setOtpVerified(true);
    }
  }, [otp, otpVerified]);

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
    // In a real native implementation, this would call a capacitor plugin
    console.log("Flash toggled:", !flashOn);
  };

  // Handle Gallery Selection
  const handleGalleryClick = () => {
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

        // Simple logic: first upload fills 'front', second fills 'back'
        if (!images.front) {
          setImages(prev => ({ ...prev, front: reader.result as string }));
        } else if (!images.back) {
          setImages(prev => ({ ...prev, back: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (event.target) {
      event.target.value = '';
    }
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
      className="h-full w-full flex flex-col safe-area-top safe-area-bottom overflow-hidden"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex-none flex items-center justify-between px-5 pt-4 pb-2 z-10">
        <button
          onClick={() => navigate("/kyc-form")}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-foreground text-[18px] font-semibold">KYC</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-y-none px-5 pt-4 pb-32 no-scrollbar">
        {/* Steps Indicator */}
        <div
          className="w-full h-[88px] rounded-[20px] p-5 mb-6 relative overflow-hidden flex-none"
          style={{
            backgroundImage: `url(${stepsBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-[14px] font-medium">Step 2/4</span>
            <span className="text-white text-[14px] font-medium">Upload & Verify</span>
          </div>
          <div className="w-full h-[6px] bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-[50%] bg-[#5260FE] rounded-full" />
          </div>
        </div>

        {/* Title */}
        <div className="mb-4 flex-none">
          <h2 className="text-white text-[18px] font-semibold mb-1">Upload Document</h2>
          <p className="text-muted-foreground text-[14px]">
            Position your ID clearly within the frame.
          </p>
        </div>

        {/* Camera Area Container */}
        <div className="flex flex-col items-center mb-6">
          {/* Camera Box */}
          <div className="w-[362px] h-[184px] bg-black rounded-[24px] flex flex-col items-center justify-center relative overflow-hidden mb-4">
            {/* Simulated Camera View */}
          </div>

          {/* Label Pill */}
          <div className="w-[111px] h-[31px] bg-black rounded-full flex items-center justify-center mb-4">
            <p className="text-white text-[12px] font-medium">Upload front side</p>
          </div>

          {/* Controls - Moved outside and below */}
          <div className="flex items-center gap-4 z-20">
            <button
              onClick={toggleFlash}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${flashOn ? 'bg-white/20' : ''}`}
            >
              <img src={iconFlash} alt="Flash" className="w-10 h-10" />
            </button>
            <button
              onClick={handleGalleryClick}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
            >
              <img src={iconGallery} alt="Gallery" className="w-10 h-10" />
            </button>
          </div>
        </div>

        {/* Thumbnails Section */}
        <div
          className="mb-6 rounded-[16px] p-4"
          style={{
            backgroundImage: `url(${thumbnailsBg})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              {/* Front Side */}
              <div className="w-[100px] h-[80px] rounded-[12px] border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                {images.front ? (
                  <img src={images.front} alt="Front" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <img src={iconPlaceholder} alt="" className="w-6 h-6 opacity-50" />
                    <span className="text-white/60 text-[10px]">Front side</span>
                  </>
                )}
              </div>
              {/* Back Side */}
              <div className="w-[100px] h-[80px] rounded-[12px] border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                {images.back ? (
                  <img src={images.back} alt="Back" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <img src={iconPlaceholder} alt="" className="w-6 h-6 opacity-50" />
                    <span className="text-white/60 text-[10px]">Back side</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleClearAll}
              disabled={!images.front && !images.back}
              className={`text-[12px] underline underline-offset-2 transition-colors ${(!images.front && !images.back) ? 'text-gray-500 cursor-not-allowed' : 'text-red-500 hover:text-red-400'}`}
            >
              Clear All
            </button>
          </div>
          {/* Image Quality Error */}
          {imageQualityError && (
            <p className="text-[#FF6B6B] text-[12px] mt-3">{imageQualityError}</p>
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
              className={`w-[363px] h-[48px] rounded-[100px] text-white placeholder:text-muted-foreground/60 px-6 mx-auto block ${documentMismatchError ? 'border-2 border-[#FF6B6B]' : 'border-none'}`}
              style={{
                backgroundImage: `url(${inputFieldBg})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent'
              }}
            />
            {documentError && (
              <p className="text-red-500 text-[12px] mt-1 ml-6">{documentError}</p>
            )}
            {documentMismatchError && !documentError && (
              <p className="text-[#FF6B6B] text-[12px] mt-1 ml-6">{documentMismatchError}</p>
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
              className={`w-[363px] h-[48px] rounded-[100px] text-white placeholder:text-muted-foreground/60 px-6 mx-auto block ${nameMismatchError ? 'border-2 border-[#FF6B6B]' : 'border-none'}`}
              style={{
                backgroundImage: `url(${inputFieldBg})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent'
              }}
            />
            {nameMismatchError && (
              <p className="text-[#FF6B6B] text-[12px] mt-1 ml-6">{nameMismatchError}</p>
            )}
          </div>
          {/* Date of Birth with Calendar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-[363px] h-[48px] rounded-[100px] border-none text-left px-6 mx-auto flex items-center justify-between"
              style={{
                backgroundImage: `url(${inputFieldBg})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent'
              }}
            >
              <span className={dob ? "text-white" : "text-muted-foreground/60"}>
                {dob ? format(dob, "dd MMM yyyy") : "Date of Birth"}
              </span>
              <CalendarIcon className="w-5 h-5 text-muted-foreground/60" />
            </button>

            {showCalendar && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
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
              <p className="text-red-500 text-[12px] mt-1 ml-6">{dobError}</p>
            )}
          </div>

          {/* Address Proof Section - Only for PAN Card */}
          {documentType === "pan" && (
            <div className="mt-4">
              <p className="text-muted-foreground text-[14px] mb-4">
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
                className="w-full rounded-[16px] bg-black p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-black/80 transition-colors"
              >
                {addressProof ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-green-400 text-[14px]">Document uploaded</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddressProof(null);
                      }}
                      className="text-red-400 text-[12px] underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 mb-3 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-white/40 text-[14px] mb-1">Only .JPG, .PNG, .PDF file formats are allowed.</p>
                    <p className="text-white/40 text-[14px] mb-3">Max file size 5MB.</p>
                    <p className="text-white/60 text-[14px]">Tap to upload your document here.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OTP Section */}
        <div className="space-y-4">
          <p className="text-muted-foreground text-[14px]">
            An OTP has been sent to your registered mobile number.
          </p>
          <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={otpVerified}>
            <InputOTPGroup className="w-full justify-between gap-2">
              {[0, 1, 2, 3, 4, 5].map(index => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="w-[52px] h-[68px] rounded-[7px] border border-white/10 bg-white/5 text-xl font-semibold text-white"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {otpVerified ? (
                <>
                  <img src={otpVerifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
                  <span className="text-green-400 text-[12px]">OTP verified</span>
                </>
              ) : (
                <>
                  <img src={pendingStatusIcon} alt="Pending" className="w-5 h-5 object-contain" />
                  <span className="text-white/80 text-[12px]">Awaiting OTP verification</span>
                </>
              )}
            </div>
            <button
              className={`text-[12px] ${otpVerified ? 'text-gray-500 cursor-not-allowed' : 'text-muted-foreground hover:text-white'}`}
              disabled={otpVerified}
            >
              Didn't receive OTP?
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0a0a12] to-transparent z-20">
        <Button
          variant="gradient"
          className="w-full h-[48px] rounded-full text-[16px] font-medium"
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
  );
};

export default KYCUpload;
