import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Check, X } from "lucide-react";
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

const KYCForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flow = searchParams.get("flow");
  const isFxFlow = flow === "fx";

  const [selectedDoc, setSelectedDoc] = useState<string | null>(isFxFlow ? "passport" : null);

  const documents = [
    { id: "aadhar", name: "Aadhar Card", icon: iconAadhar },
    { id: "pan", name: "PAN Card", icon: iconPan },
    { id: "passport", name: "Passport", icon: iconPassport },
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
          onClick={() => navigate(isFxFlow ? "/fx-passport-gate" : "/kyc-intro")}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-foreground text-[18px] font-semibold">KYC</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-y-none px-5 pt-4 pb-24 no-scrollbar">
        {/* Steps Indicator */}
        <div
          className="w-full h-[88px] rounded-[20px] p-5 mb-8 relative overflow-hidden"
          style={{
            backgroundImage: `url(${stepsBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-[14px] font-medium">Step 1/4</span>
            <span className="text-white text-[14px] font-medium">Document Type</span>
          </div>
          <div className="w-full h-[6px] bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-[25%] bg-[#5260FE] rounded-full" />
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-white text-[18px] font-semibold mb-1">
            {isFxFlow ? "Passport Required" : "Choose a document"}
          </h2>
          <p className="text-muted-foreground text-[14px]">
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
                backgroundImage: `url(${isFxFlow ? passportKycBg : documentBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                width: isFxFlow ? '362px' : 'auto',
                height: isFxFlow ? '104px' : '120px',
                padding: '16px'
              }}
            >
              <div className="flex justify-between items-start">
                <img src={doc.icon} alt={doc.name} className="w-8 h-8 object-contain" />
                <img
                  src={selectedDoc === doc.id ? radioOn : radioOff}
                  alt={selectedDoc === doc.id ? "Selected" : "Not selected"}
                  className="w-6 h-6"
                />
              </div>
              {/* For standard grid, keep text at bottom. For FX flow, it's already in the bg or positioned differently? 
                  The prompt says "content inside: (we already have a passport option right, same CONTENT to come here, on the same position. the radio button will also follow the same position, top right corner) and the radio button will be pre-selected."
                  The original Passport item has the name at the bottom left. 
              */}
              {!isFxFlow && <span className="text-white text-[14px] font-medium absolute bottom-4 left-4">{doc.name}</span>}
              {isFxFlow && <span className="text-white text-[14px] font-medium absolute bottom-4 left-4">{doc.name}</span>}
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="space-y-3 mb-6">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5">
                {req.valid ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <X className="w-4 h-4 text-white" />
                )}
              </div>
              <p className="text-muted-foreground text-[13px] leading-snug">
                {req.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0a0a12] to-transparent">
        <p className="text-muted-foreground/60 text-[14px] font-normal text-left mb-4 leading-relaxed">
          This information is used for identity verification only, and will be kept secure by Didit
        </p>
        <Button
          variant="gradient"
          className="w-full h-[48px] rounded-full text-[16px] font-medium"
          disabled={!selectedDoc}
          onClick={() => navigate(`/kyc-upload?doc=${selectedDoc}${isFxFlow ? '&flow=fx' : ''}`)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default KYCForm;