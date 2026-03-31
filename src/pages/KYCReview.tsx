import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import stepsBg from "@/assets/kyc-steps-bg.png";
import inputFieldBg from "@/assets/input-field-bg.png";
import kycDetailsReview from "@/assets/kyc-details-review.png";
import thumbnailsBg from "@/assets/thumbnails-bg.png";
import checkBox from "@/assets/check-box.png";
import checkBoxOutlineBlank from "@/assets/check-box-outline-blank.png";
import { Button } from "@/components/ui/button";
import { supabase, USER_ID } from "@/lib/supabase";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { useUser } from "@/contexts/UserContext";


const KYCReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { showToaster } = useCustomToaster();
  const { setProfileImage } = useUser();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const {
    images,
    documentNumber,
    fullName,
    dob,
    addressProof,
    documentType,
    selfie,
    flow
  } = location.state || {};

  const documentLabels: Record<string, string> = {
    aadhar: "Aadhar Card",
    voter: "Voter ID",
    passport: "Passport",
    pan: "PAN Card"
  };

  const maskIdNumber = (num: string) => {
    if (!num) return "N/A";
    const cleanNum = num.replace(/\s/g, "");
    if (cleanNum.length >= 10) {
      return `${cleanNum.slice(0, 4)} XXXX ${cleanNum.slice(-4)}`;
    } else if (cleanNum.length >= 4) {
      return `${cleanNum.slice(0, 2)} XXXX ${cleanNum.slice(-2)}`;
    }
    return cleanNum;
  };

  const getLastFour = (num: string) => {
    if (!num) return "";
    const cleanNum = num.replace(/\s/g, "");
    return cleanNum.slice(-4);
  };

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const uploadImage = async (dataURI: string | null, path: string) => {
    if (!dataURI) return null;
    const blob = dataURItoBlob(dataURI);
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, blob, { upsert: true });

    if (error) {
      console.error(`Error uploading image to ${path}:`, error);
      throw error;
    }
    return data.path;
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const timestamp = Date.now();
      const folder = `${USER_ID}/${timestamp}`;

      // 1. Upload Images to kyc-documents bucket
      const [frontUrl, backUrl, selfieUrl, addressProofUrl] = await Promise.all([
        uploadImage(images?.front, `${folder}/front.jpg`),
        uploadImage(images?.back, `${folder}/back.jpg`),
        uploadImage(selfie, `${folder}/selfie.jpg`),
        addressProof ? uploadImage(addressProof, `${folder}/address_proof.jpg`) : Promise.resolve(null)
      ]);

      // 2. Determine verification tier
      const verificationTier = documentType === "passport" ? "fx_pro" : "standard";

      // 3. Insert into kyc_submissions
      const { error: kycError } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: USER_ID,
          kyc_type: documentType,
          kyc_number: documentNumber,
          full_name: fullName,
          kyc_dob: dob,
          kyc_id_url: frontUrl,
          back_image_url: backUrl,
          kyc_photo: selfieUrl,
          address_proof_url: addressProofUrl,
          verification_tier: verificationTier,
          status: 'pending'
        });

      if (kycError) throw kycError;

      // 4. Update profiles kyc_status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', USER_ID);

      if (profileError) throw profileError;

      showToaster("KYC Submitted Successfully", "success");

      navigate("/kyc-success", {
        state: {
          flow,
          doc: documentType === 'passport'
        },
        replace: true
      });

    } catch (error) {
      console.error("KYC Submission error:", error);
      showToaster("Failed to submit KYC. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Header */}
      <div className="flex-none flex items-center justify-between px-5 pt-12 pb-2 relative z-10">
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
            className={`w-full h-[88px] rounded-[20px] p-5 mb-3.5 relative overflow-hidden shrink-0 ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${stepsBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >
            <div className="flex justify-between items-center mb-3">
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Step 4/4</span>
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}>Review</span>
            </div>
            <div className={`w-full h-[6px] ${isDarkMode ? 'bg-white/20' : 'bg-[#F2F4F7]'} rounded-full overflow-hidden`}>
              <div className="h-full w-[100%] bg-[#5260FE] rounded-full" />
            </div>
          </div>

          {/* New Header Section */}
          <div className="mb-2">
            <h2 className={`font-sans font-bold text-[16px] ${isDarkMode ? 'text-white' : 'text-black'} mb-2`}>Review & Submit</h2>
            <p className={`font-sans font-medium text-[14px] ${isDarkMode ? 'text-white/60' : 'text-black/60'} leading-snug`}>
              Please review your uploaded details and documents before submitting. Ensure all information is correct and clearly visible.
            </p>
          </div>

          {/* KYC Details Container */}
          <div
            className="w-[362px] h-[363px] mx-auto mt-4 rounded-[13px] relative shrink-0"
            style={isDarkMode ? {
              backgroundImage: `url(${kycDetailsReview})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            } : {
              backgroundColor: '#FFFFFF',
              border: '1px solid #E9EAEB'
            }}
          >
            {/* Inner Header */}
            <div className="pt-[17px] px-4">
              <h3 className={`font-sans font-bold text-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Your KYC Details</h3>
              <p className={`font-sans font-normal text-[14px] ${isDarkMode ? 'text-white/40' : 'text-black/40'} mt-1`}>
                Please check all the documents before submitting
              </p>
            </div>

            {/* Divider */}
            <div
              className="mx-auto mt-2.5 h-[1px] w-[338px]"
              style={{
                backgroundColor: isDarkMode ? '#202020' : '#E6E8EB'
              }}
            />

            {/* Info Rows */}
            <div className="px-4 mt-6 space-y-3.5">
              {/* ID Document Row */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className={`font-sans font-normal text-[12px] ${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#616161]'}`}>ID Document</span>
                  <span className={`font-sans font-medium text-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {documentLabels[documentType] || "N/A"} ending {getLastFour(documentNumber)}
                  </span>
                </div>
                {/* Document Thumbnails */}
                <div className="flex gap-1 mr-[12px]">
                  {images?.front && (
                    <div className={`w-[38px] h-[38px] rounded-[6px] border ${isDarkMode ? 'border-white/10' : 'border-[#E9EAEB]'} overflow-hidden`}>
                      <img src={images.front} alt="Front" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {images?.back && (
                    <div className={`w-[38px] h-[38px] rounded-[6px] border ${isDarkMode ? 'border-white/10' : 'border-[#E9EAEB]'} overflow-hidden`}>
                      <img src={images.back} alt="Back" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* ID Number Row */}
              <div className="flex flex-col gap-0.5">
                <span className={`font-sans font-normal text-[12px] ${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#616161]'}`}>ID Number</span>
                <span className={`font-sans font-medium text-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {maskIdNumber(documentNumber)}
                </span>
              </div>

              {/* Full Name Row */}
              <div className="flex flex-col gap-0.5">
                <span className={`font-sans font-normal text-[12px] ${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#616161]'}`}>Full Name</span>
                <span className={`font-sans font-medium text-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {fullName || "N/A"}
                </span>
              </div>

              {/* Date of Birth Row */}
              <div className="flex flex-col gap-0.5">
                <span className={`font-sans font-normal text-[12px] ${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#616161]'}`}>Date of Birth</span>
                <span className={`font-sans font-medium text-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {dob ? format(new Date(dob), "dd MMM yyyy") : "N/A"}
                </span>
              </div>

              {/* Selfie Verification Row */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className={`font-sans font-normal text-[12px] ${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#616161]'}`}>Selfie Verification</span>
                  <span className={`font-sans font-medium text-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Selfie Verified
                  </span>
                </div>
                {/* Selfie Thumbnail */}
                <div className="mr-[12px]">
                  {selfie && (
                    <div className={`w-[38px] h-[38px] rounded-[6px] border ${isDarkMode ? 'border-white/10' : 'border-[#E9EAEB]'} overflow-hidden`}>
                      <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 mt-[30px]" onClick={() => setAgreed(!agreed)}>
            <img
              src={agreed ? checkBox : checkBoxOutlineBlank}
              alt="Checkbox"
              className={`w-5 h-5 mt-0.5 object-contain cursor-pointer ${!isDarkMode && !agreed ? 'filter brightness-0 opacity-20' : ''}`}
            />
            <label className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-tight cursor-pointer font-sans`}>
              I agree, all information provided are correct and accurate to best of my knowledge.
            </label>
          </div>

          {/* Footer - Constrained container */}
          <div className={`mt-auto pt-[25px] pb-8 max-w-[362px] mx-auto w-full ${isDarkMode ? 'bg-transparent' : 'bg-[#FFFFFF]/80 backdrop-blur-md'} z-20 px-5`}>
            <Button
              variant="default"
              className="w-full h-[48px] rounded-full text-[16px] font-semibold bg-[#5260FE] hover:bg-[#5260FE]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!agreed || isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? "Submitting..." : "Submit KYC"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCReview;
