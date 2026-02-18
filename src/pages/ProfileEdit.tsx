import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/UserContext";
import { useAsset } from "@/hooks/useAsset";
import avatarImg from "@/assets/avatar.png";
import verifiedIcon from "@/assets/verified.svg";
import inputFieldBg from "@/assets/input-field-bg.png";
import buttonCancel from "@/assets/button-cancel.png";
import gridPeLogo from "@/assets/grid.pe.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomToaster } from "@/contexts/CustomToasterContext";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const mainBg = useAsset("main-bg");
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
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${mainBg})` : 'none',
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-[#E6E8EB] dark:border-white/20 flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-foreground text-[18px] font-semibold">Profile</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="px-5 mt-8">
        {/* Profile Photo Section */}
        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-[#E9EAEB] dark:border-white/10 h-[101px]">
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
              className={`px-4 h-[32px] flex items-center justify-center rounded-full text-[14px] ${isDarkMode ? 'text-foreground' : 'text-white bg-black'} mb-2 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={isDarkMode ? {
                backgroundImage: 'url("/lovable-uploads/881be237-04b4-4be4-b639-b56090b04ed5.png")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : {}}
            >
              Upload Photo
            </button>
            <p className="text-black dark:text-muted-foreground text-[12px] leading-tight">
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
            className="w-full h-[48px] rounded-full text-black dark:text-white placeholder:text-muted-foreground/60 px-6 border-[#E6E8EB] dark:border-none text-[14px] disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              backgroundImage: isDarkMode ? `url(${inputFieldBg})` : 'none',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: isDarkMode ? 'transparent' : '#F7F8FA'
            }}
          />

          {/* Phone Number (Read Only) */}
          <div className="space-y-2 mt-[21px]">
            <div
              className="w-full h-[48px] rounded-full flex items-center px-6 justify-between border-[#E6E8EB] dark:border-none opacity-70 cursor-not-allowed"
              style={{
                backgroundImage: isDarkMode ? `url(${inputFieldBg})` : 'none',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: isDarkMode ? 'transparent' : '#F7F8FA'
              }}
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-black/50 dark:text-muted-foreground text-[14px]">+91</span>
                <div className="h-4 w-px bg-black/10 dark:bg-white/10"></div>
                <span className="text-black/50 dark:text-muted-foreground text-[14px] tracking-wide">
                  {phoneNumber?.replace('+91', '').replace(/\s/g, '') || '9898989898'}
                </span>
              </div>
              <div
                className="w-4 h-4 bg-[#1CB956]"
                style={{
                  maskImage: `url(${verifiedIcon})`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: `url(${verifiedIcon})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
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
                className="w-full h-[48px] rounded-full text-black dark:text-white placeholder:text-muted-foreground/60 px-6 border-[#E6E8EB] dark:border-none text-[14px] pr-[100px] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  backgroundImage: isDarkMode ? `url(${inputFieldBg})` : 'none',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: isDarkMode ? 'transparent' : '#F7F8FA'
                }}
              />

              {/* Verification UI */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {emailVerified ? (
                  <div
                    className="w-4 h-4 bg-[#1CB956] mr-2"
                    style={{
                      maskImage: `url(${verifiedIcon})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskImage: `url(${verifiedIcon})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                    }}
                  />
                ) : isEmailNonEmpty && isEditing ? (
                  <button
                    onClick={handleVerify}
                    className="px-4 h-[32px] flex items-center justify-center rounded-full text-[14px] text-foreground"
                    style={{
                      backgroundImage: isDarkMode ? 'url("/lovable-uploads/881be237-04b4-4be4-b639-b56090b04ed5.png")' : 'none',
                      backgroundColor: isDarkMode ? 'transparent' : '#000000',
                      color: isDarkMode ? 'inherit' : '#ffffff',
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
            className="w-full h-[48px] rounded-full text-[16px] font-medium flex items-center justify-center transition-transform active:scale-95 mt-[14px]"
            style={{
              backgroundImage: isDarkMode ? `url(${buttonCancel})` : 'none',
              backgroundColor: isDarkMode ? 'transparent' : '#EBEBEB',
              color: isDarkMode ? '#FFFFFF' : '#000000',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 mt-14 pb-10 opacity-40 flex flex-col items-start mt-auto">
        <p className="font-satoshi font-black text-[40px] text-foreground leading-none tracking-tight">grid.pe</p>
        <p className="text-sm mt-1">This is not where you find love.</p>
      </div>
    </div >
  );
};

export default ProfileEdit;
