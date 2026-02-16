import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import stepsBg from "@/assets/kyc-steps-bg.png";
import reviewCardBg from "@/assets/kyc-details-review-bg.png";
import checkBox from "@/assets/check-box.png";
import checkBoxOutlineBlank from "@/assets/check-box-outline-blank.png";

const KYCReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [agreed, setAgreed] = useState(false);

  // Get data from location state (passed from previous steps)
  const state = location.state || {};
  const {
    images = {},
    documentNumber = "",
    fullName = "",
    dob = null,
    documentType = "",
    selfie = null
  } = state;

  const documentLabels: Record<string, string> = {
    aadhar: "Aadhar Card",
    voter: "Voter ID",
    passport: "Passport",
    pan: "PAN Card"
  };

  const formattedDocType = documentLabels[documentType] || "Document";
  const formattedDob = dob ? format(new Date(dob), "dd MMM yyyy") : "";

  const handleSubmit = () => {
    // Submit logic here
    console.log("Submitting KYC data...");
    navigate(`/kyc-success?doc=${documentType}${state.flow === 'fx' ? '&flow=fx' : ''}`);
  };

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-foreground text-[18px] font-semibold">KYC</h1>
        <div className="w-10" />
      </div>

      <div id="scroll-container" className="flex-1 px-5 pt-4 flex flex-col overflow-y-auto overscroll-y-none">
        {/* Steps Indicator */}
        <div
          className="w-full h-[88px] rounded-[20px] p-5 mb-6 relative overflow-hidden shrink-0"
          style={{
            backgroundImage: `url(${stepsBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-[14px] font-medium">Step 4/4</span>
            <span className="text-white text-[14px] font-medium">Review</span>
          </div>
          <div className="w-full h-[6px] bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-full bg-[#5260FE] rounded-full" />
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-6">
          <h2 className="text-white text-[18px] font-semibold mb-2">Review & Submit</h2>
          <p className="text-white/60 text-[14px] leading-relaxed">
            Please review your uploaded details and documents before submitting.
            Ensure all information is correct and clearly visible.
          </p>
        </div>

        {/* Details Card */}
        <div
          className="w-full rounded-[24px] border border-white/10 p-5"
          style={{
            backgroundImage: `url(${reviewCardBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <h3 className="text-white text-[16px] font-semibold mb-1">Your KYC Details</h3>
          <p className="text-white/40 text-[12px] mb-6">Please check all the documents before submitting</p>

          <div className="space-y-6">
            {/* ID Document Row */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/40 text-[12px] mb-1">ID Document</p>
                <p className="text-white text-[14px] font-medium">{formattedDocType}</p>
              </div>
              <div className="flex gap-2">
                {/* Thumbnails for Front & Back */}
                {images.front && (
                  <div className="w-[42px] h-[32px] rounded-[4px] bg-white/10 overflow-hidden border border-white/20 flex items-center justify-center">
                    <img src={images.front} alt="Front" className="w-full h-full object-cover" />
                  </div>
                )}
                {images.back && (
                  <div className="w-[42px] h-[32px] rounded-[4px] bg-white/10 overflow-hidden border border-white/20 flex items-center justify-center">
                    <img src={images.back} alt="Back" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* ID Number */}
            <div>
              <p className="text-white/40 text-[12px] mb-1">ID Number</p>
              <p className="text-white text-[14px] font-medium">{documentNumber}</p>
            </div>

            {/* Full Name */}
            <div>
              <p className="text-white/40 text-[12px] mb-1">Full Name</p>
              <p className="text-white text-[14px] font-medium">{fullName}</p>
            </div>

            {/* Date of Birth */}
            <div>
              <p className="text-white/40 text-[12px] mb-1">Date of Birth</p>
              <p className="text-white text-[14px] font-medium">{formattedDob}</p>
            </div>

            {/* Selfie Verification */}
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <div>
                <p className="text-white/40 text-[12px] mb-1">Selfie Verification</p>
                <p className="text-white text-[14px] font-medium">Selfie Verified</p>
              </div>
              {/* Selfie Thumbnail */}
              {selfie && (
                <div className="w-[42px] h-[42px] rounded-[8px] bg-white/10 overflow-hidden border border-white/20">
                  <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-64 shrink-0" />
      </div>

      {/* Footer Area */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12] to-transparent z-20">
        <div className="flex items-start gap-3 mb-6" onClick={() => setAgreed(!agreed)}>
          <img
            src={agreed ? checkBox : checkBoxOutlineBlank}
            alt="Checkbox"
            className="w-5 h-5 mt-0.5 object-contain"
          />
          <label
            className="text-white/60 text-[13px] leading-tight cursor-pointer"
          >
            I agree, all information provided are correct and accurate to best of my knowledge.
          </label>
        </div>

        <Button
          variant="default"
          className="w-full h-[48px] rounded-full text-[16px] font-medium bg-[#5260FE] hover:bg-[#5260FE]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!agreed}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default KYCReview;
