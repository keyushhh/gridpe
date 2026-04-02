import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Check, X } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import stepsBg from "@/assets/kyc-steps-bg.png";
import documentBg from "@/assets/kyc-document-bg.png";
import passportKycBg from "@/assets/passport-kyc.png";
import iconAadhar from "@/assets/icon-aadhar.png";
import iconPan from "@/assets/icon-pan.png";
import iconPassport from "@/assets/icon-passport.png";
import iconVoter from "@/assets/icon-voter.png";
import radioOn from "@/assets/radio-on.png";
import radioOff from "@/assets/radio-off.png";
import { Button } from "@/components/ui/button";
import { supabase, USER_ID } from "@/lib/supabase";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { useUser } from "@/contexts/UserContext";

const KYCForm = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const { showToaster } = useCustomToaster();
  const [searchParams] = useSearchParams();
  const flow = searchParams.get("flow");
  const isFxFlow = flow === "fx";

  const [selectedDoc, setSelectedDoc] = useState<string | null>(isFxFlow ? "passport" : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchProfileData, kycStatus } = useUser();

  // Cleanup SDK instance firmly on unmount so camera/socket drops
  useEffect(() => {
    return () => {
      const { DiditSDK } = window as any;
      if (DiditSDK?.DiditSdk?.shared) {
        try {
          if (typeof DiditSDK.DiditSdk.shared.close === 'function') DiditSDK.DiditSdk.shared.close();
          if (typeof DiditSDK.DiditSdk.shared.destroy === 'function') DiditSDK.DiditSdk.shared.destroy();
        } catch (e) {
          console.warn('Didit SDK cleanup warning:', e);
        }
      }
    };
  }, []);

  const documents = [
    { id: "aadhar", name: "Aadhar Card", icon: iconAadhar },
    { id: "pan", name: "PAN Card", icon: iconPan },
    { id: "dl", name: "Driving License", icon: iconPan }, // using pan icon as instructed
    { id: "voter", name: "Voter ID", icon: iconVoter },
  ];

  const filteredDocuments = isFxFlow
    ? documents.filter(doc => doc.id === "passport")
    : documents;

  const requirements = [
    { text: "Original full-size, unedited document", valid: true },
    { text: "Place documents against a single-coloured background", valid: true },
    { text: "Readable, well-lit, coloured images", valid: true },
    { text: "No black and white images", valid: false },
  ];

  const handleContinue = async () => {
    // 0. Persistence Gate - Block repeat launches
    if (kycStatus === 'verified') {
      showToaster("Account already secured!", "success");
      navigate("/home", { replace: true });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Defensively destroy any lingering SDK traces
      const { DiditSDK } = window as any;
      if (DiditSDK?.DiditSdk?.shared?.destroy) {
        DiditSDK.DiditSdk.shared.destroy();
      }

      // 2. Set preliminary pending status in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', USER_ID);

      if (profileError) throw profileError;

      // 3. Resolve real customer UUID from auth session
      const { data: { user } } = await supabase.auth.getUser();
      const rawUuid = user?.id || USER_ID;

      // 4. Bypass Sticky Sessions by making vendor_data strictly unique per attempt
      const customerUuid = `${rawUuid}_${Date.now()}`;

      // 3. Launch Didit using the explicit UniLink URL
      const DIDIT_UNI_LINK = 'https://verify.didit.me/u/rIUXDqkBQ0Ger_cQiQMbrA';
      const metaFlow = isFxFlow ? 'fx_passport' : 'standard';
      const finalUrl = `${DIDIT_UNI_LINK}?vendor_data=${customerUuid}&metadata=${encodeURIComponent(JSON.stringify({ user_type: 'customer', flow: metaFlow }))}`;

      console.log("Launching Didit URL via new tab:", finalUrl);
      window.open(finalUrl, '_blank');
      
      // Navigate to Success Screen in the background (active when user returns)
      navigate(isFxFlow ? "/fx-kyc-success" : "/kyc-success", {
        state: {
          flow: isFxFlow ? 'fx' : 'standard',
          isWaitingForRealtime: true
        },
        replace: true
      });

    } catch (error) {
      console.error("KYC Submission error:", error);
      showToaster("Failed to start verification. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      <div className="flex items-center justify-between px-5 pt-12 pb-2 relative z-10">
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
            className={`w-full h-[88px] rounded-[20px] p-5 mb-8 relative overflow-hidden ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${stepsBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >
            <div className="flex justify-between items-center mb-3">
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Step 1/4</span>
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Document Type</span>
            </div>
            <div className={`w-full h-[6px] ${isDarkMode ? 'bg-white/20' : 'bg-[#F2F4F7]'} rounded-full overflow-hidden`}>
              <div className="h-full w-[25%] bg-[#5260FE] rounded-full" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold mb-1 font-sans`}>
              {isFxFlow ? "Passport Required" : "Choose a document"}
            </h2>
            <p className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#616161]'} text-[14px] font-sans font-normal`}>
              {isFxFlow
                ? "Only a valid passport is accepted for FX Exchange KYC"
                : "Use a valid government-issued ID for verification."
              }
            </p>
          </div>

          {/* Document Grid */}
          <div className={isFxFlow ? "flex flex-col gap-4 mb-8" : "grid grid-cols-2 gap-4 mb-8"}>
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => !isFxFlow && setSelectedDoc(doc.id)}
                className="relative rounded-[16px] cursor-pointer transition-all duration-200"
                style={{
                  backgroundImage: isDarkMode ? `url(${isFxFlow ? passportKycBg : documentBg})` : 'none',
                  backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
                  border: !isDarkMode ? (selectedDoc === doc.id ? '1px solid #5260FE' : '1px solid #E9EAEB') : 'none',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  width: isFxFlow ? '362px' : 'auto',
                  height: isFxFlow ? '120px' : '120px',
                  padding: '16px'
                }}
              >
                <div className="flex justify-between items-start">
                  <img
                    src={doc.icon}
                    alt={doc.name}
                    className={`w-8 h-8 object-contain ${!isDarkMode && (doc.id === 'pan' || doc.id === 'passport') ? 'filter brightness-0' : ''}`}
                    style={doc.id === 'dl' ? { opacity: 1, filter: 'none' } : undefined}
                  />
                  <img
                    src={selectedDoc === doc.id ? radioOn : radioOff}
                    alt={selectedDoc === doc.id ? "Selected" : "Not selected"}
                    className={`w-6 h-6 ${!isDarkMode && selectedDoc !== doc.id ? 'filter brightness-0 opacity-20' : ''}`}
                  />
                </div>
                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans absolute bottom-4 left-4`}>{doc.name}</span>
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="space-y-3 mb-6">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {req.valid ? (
                    <Check className="w-4 h-4 text-[#5260FE]" />
                  ) : (
                    <X className="w-4 h-4 text-[#5260FE]" />
                  )}
                </div>
                <p className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#616161]'} text-[13px] font-normal font-sans leading-snug`}>
                  {req.text}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer - Constrained container */}
      <div className={`mt-auto pb-8 pt-4 w-full flex flex-col items-center ${isDarkMode ? 'bg-gradient-to-t from-[#0a0a12] to-transparent' : 'bg-[#FFFFFF]/80 backdrop-blur-md'} z-20`}>
        <p className={`${isDarkMode ? 'text-[#7E7E7E]/60' : 'text-[#616161]'} text-[14px] font-normal font-sans text-left mb-4 leading-relaxed max-w-[362px] w-full px-5`}>
          This information is used for identity verification only, and will be kept secure by Didit
        </p>
        <Button
          variant="gradient"
          className="w-[362px] h-[48px] rounded-full text-white font-medium text-[16px] font-sans flex items-center justify-center p-0 m-0"
          disabled={!selectedDoc || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? "Starting..." : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default KYCForm;