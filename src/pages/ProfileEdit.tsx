import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import avatarImg from "@/assets/avatar.png";
import verifiedIcon from "@/assets/verified-icon.png";
import inputFieldBg from "@/assets/input-field-bg.png";
import buttonCancel from "@/assets/button-cancel.png";
import gridPeLogo from "@/assets/grid.pe.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomToaster } from "@/contexts/CustomToasterContext";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const {
    phoneNumber,
    name: contextName,
    email: contextEmail,
    emailVerified: contextEmailVerified,
    profileImage: contextImage,
    setName: setContextName,
    setEmail: setContextEmail,
    setEmailVerified: setContextEmailVerified,
    setProfileImage: setContextProfileImage
  } = useUser();

  const [name, setName] = useState(contextName || "");
  const [email, setEmail] = useState(contextEmail || "");
  const [emailVerified, setEmailVerified] = useState(contextEmailVerified || false);
  const [profileImage, setProfileImage] = useState<string | null>(contextImage);
  const [isEditing, setIsEditing] = useState(false); // Default to read-only
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to handle email changes
  useEffect(() => {
    if (email !== contextEmail && contextEmailVerified) {
      // If email changes after being verified, unverify it locally
      setEmailVerified(false);
    } else if (email === contextEmail && contextEmailVerified) {
      // If reverted to original verified email, restore verified status
      setEmailVerified(true);
    }
  }, [email, contextEmail, contextEmailVerified]);

  const helperText = contextImage
    ? "Add or update your profile photo."
    : "Tap to add your beautiful mugshot. Or cat. We’re not picky.";

  const ctaLabel = isEditing ? "Save My Identity" : "Edit My Identity";

  // Determine Email UI State
  const isEmailNonEmpty = email.trim().length > 0;
  const isEmailModified = email !== contextEmail;
  const wasVerified = contextEmailVerified;

  let emailHelperText = "Verify your email. C’mon, do it for the plot!";
  if (emailVerified) {
    emailHelperText = "Nice, now we trust you. As a promise, no spams! ;)";
  } else if (wasVerified && isEmailModified) {
    emailHelperText = "Second thoughts? Do it for the plot (again).";
  }

  const handleCtaClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    } else {
      handleSave();
    }
  };

  const handleSave = () => {
    setContextName(name);
    setContextEmail(email);
    setContextEmailVerified(emailVerified);
    setContextProfileImage(profileImage);
    showToaster("Profile updated successfully", 'success');
    navigate(-1);
  };

  const handleVerify = () => {
    setEmailVerified(true);
    showToaster("Email verified!", 'success');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none h-full flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-foreground text-[18px] font-semibold">Profile</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="px-5 mt-8">
        {/* Profile Photo Section */}
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/10 h-[101px]">
          <img
            src={profileImage || avatarImg}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover"
            style={{
              border: '4px solid rgba(255, 255, 255, 0.17)'
            }}
          />
          <div className="flex-1">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={!isEditing}
            />
            <button
              onClick={triggerFileInput}
              disabled={!isEditing}
              className={`px-4 h-[32px] flex items-center justify-center rounded-full text-[14px] text-foreground mb-2 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                backgroundImage: 'url("/lovable-uploads/881be237-04b4-4be4-b639-b56090b04ed5.png")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              Upload Photo
            </button>
            <p className="text-muted-foreground text-[12px] leading-tight">
              {helperText}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mt-8">
          <p className="mb-[10px] text-muted-foreground text-[14px] font-bold tracking-wider">
            PERSONAL INFORMATION
          </p>

          {/* Name Input */}
          <Input
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditing}
            className="w-full h-[48px] rounded-full text-white placeholder:text-muted-foreground/60 px-6 border-none text-[14px] disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url(${inputFieldBg})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'transparent'
            }}
          />

          {/* Phone Number (Read Only) */}
          <div className="space-y-2 mt-[21px]">
            <div
              className="w-full h-[48px] rounded-full flex items-center px-6 justify-between border-none opacity-70 cursor-not-allowed"
              style={{
                backgroundImage: `url(${inputFieldBg})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent'
              }}
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-muted-foreground text-[14px]">+91</span>
                <div className="h-4 w-px bg-white/10"></div>
                <span className="text-muted-foreground text-[14px] tracking-wide">
                  {phoneNumber?.replace('+91', '').replace(/\s/g, '') || '9898989898'}
                </span>
              </div>
              <img src={verifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
            </div>
            <p className="text-[#5B5B5B] text-[14px] font-normal px-4">
              This is how we know it's you. Or your evil twin.
            </p>
          </div>

          {/* Email Input */}
          <div className="mt-[32px]">
            <div className="relative">
              <Input
                placeholder="Drop your email, the real one."
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                disabled={!isEditing}
                className="w-full h-[48px] rounded-full text-white placeholder:text-muted-foreground/60 px-6 border-none text-[14px] pr-[100px] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  backgroundImage: `url(${inputFieldBg})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: 'transparent'
                }}
              />

              {/* Verification UI */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {emailVerified ? (
                  <div className="mr-2">
                    <img src={verifiedIcon} alt="Verified" className="w-5 h-5 object-contain" />
                  </div>
                ) : isEmailNonEmpty && isEditing ? (
                  <button
                    onClick={handleVerify}
                    className="px-4 h-[32px] flex items-center justify-center rounded-full text-[14px] text-foreground"
                    style={{
                      backgroundImage: 'url("/lovable-uploads/881be237-04b4-4be4-b639-b56090b04ed5.png")',
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {wasVerified ? "Change?" : "Verify"}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="text-[#5B5B5B] text-[14px] font-normal px-4 mt-2 font-satoshi">
              {emailHelperText}
            </p>
          </div>

          {/* CTA Buttons - Pushed up by 50px (115 - 50 = 65px) */}
          <Button
            onClick={handleCtaClick}
            className="w-full h-[48px] rounded-full text-[16px] font-medium bg-[#5260FE] hover:bg-[#5260FE]/90 text-white border-none mt-[65px]"
          >
            {ctaLabel}
          </Button>
          <button
            onClick={() => navigate(-1)}
            className="w-full h-[48px] rounded-full text-[16px] font-medium text-white flex items-center justify-center transition-transform active:scale-95 mt-[14px]"
            style={{
              backgroundImage: `url(${buttonCancel})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Footer Info - Matched to Settings Page structure */}
      <div className="px-5 mt-14 pb-10 opacity-40 flex flex-col items-start">
        <img src={gridPeLogo} className="h-8 mb-1" />
        <p className="font-grotesk font-medium text-[14px] text-left">
          App Version v1.0.0 — 100% drama compatible.
        </p>
      </div>
    </div>
  );
};

export default ProfileEdit;
