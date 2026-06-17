import { ASSETS } from '@/constants/assets';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';
import React, { useState, useRef, useEffect } from 'react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useUser } from '@/contexts/UserContext';
import { useAsset } from '@/hooks/useAsset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
const ProfileEdit = () => {
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const isDarkMode = useIsDarkMode();
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  const {
    phoneNumber,
    name: contextName,
    email: contextEmail,
    emailVerified: contextEmailVerified,
    profileImage: contextImage,
    setName: setContextName,
    setEmail: setContextEmail,
    setEmailVerified: setContextEmailVerified,
    setProfileImage: setContextProfileImage,
    profile,
    isSecureStorageReady,
  } = useUser();

  const userId = profile?.id;
  const [name, setName] = useState(contextName || '');
  const [email, setEmail] = useState(contextEmail || '');
  const [emailVerified, setEmailVerified] = useState(contextEmailVerified || false);
  const [profileImage, setProfileImage] = useState<string | null>(contextImage);
  const [isEditing, setIsEditing] = useState(false); // Default to read-only
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSecureStorageReady) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center"
        style={{ backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF' }}
      >
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }
  const helperText = contextImage
    ? 'Add or update your profile photo.'
    : 'Tap to add your beautiful mugshot. Or cat. We’re not picky.';
  const ctaLabel = isEditing ? 'Save My Identity' : 'Edit My Identity';
  // Determine Email UI State
  const isEmailNonEmpty = email.trim().length > 0;
  const isEmailModified = email !== contextEmail;
  const wasVerified = contextEmailVerified;
  let emailHelperText = 'Verify your email. C’mon, do it for the plot!';
  if (emailVerified) {
    emailHelperText = 'Nice, now we trust you. As a promise, no spams! ;)';
  } else if (wasVerified && isEmailModified) {
    emailHelperText = 'Second thoughts? Do it for the plot (again).';
  }
  const handleSaveProfile = () => {
    if (!isEditing) {
      setIsEditing(true);
    } else {
      handleSave();
    }
  };
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          avatar_url: profileImage,
          email,
        })
        .eq('id', userId);
      if (error) throw error;
      setContextName(name);
      setContextEmail(email);
      setContextEmailVerified(emailVerified);
      setContextProfileImage(profileImage);
      showToaster('Profile updated successfully', 'success');
      navigate(-1);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToaster('Failed to update profile', 'error');
    }
  };
  const handleVerify = () => {
    setEmailVerified(true);
    showToaster('Email verified!', 'success');
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
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${mainBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <div className="px-5 safe-top pt-4 flex items-center justify-between shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-foreground text-[18px] font-semibold">Profile</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>
      <div className="px-5 mt-8">
        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-brand-border-light dark:border-white/10 h-[101px]">
          <img loading="lazy" decoding="async"             src={profileImage || ASSETS.AVATAR}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover"
            style={{
              border: '4px solid rgba(255, 255, 255, 0.17)',
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
              className={`px-4 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden relative ${
                isDarkMode ? 'glass-container glass-physics-clear grow-0' : 'bg-black'
              } mb-2 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={
                {
                  ...(!isDarkMode ? { backgroundColor: '#000000' } : {}),
                  '--glass-specular-intensity': '0.2',
                } as React.CSSProperties
              }
            >
              {isDarkMode && (
                <>
                  <div className="glass-lens" />
                  <div
                    className="absolute inset-0 z-[1] pointer-events-none"
                    style={{ backgroundColor: 'var(--glass-tint)' }}
                  />
                  <span className="glass-rim-v2" />
                </>
              )}
              <span className="relative z-10 text-white text-[14px] font-medium">
                Upload Photo
              </span>
            </button>
            <p className="text-black dark:text-muted-foreground text-[12px] leading-tight">
              {helperText}
            </p>
          </div>
        </div>
        <div className="mt-8">
          <p className="mb-[10px] text-muted-foreground text-[14px] font-bold tracking-wider">
            PERSONAL INFORMATION
          </p>
          <label htmlFor="profile-name" className="sr-only">
            Full Name
          </label>
          <Input
            id="profile-name"
            placeholder="What should we call you?"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={!isEditing}
            className="w-full h-[48px] rounded-full text-black dark:text-white placeholder:text-muted-foreground/60 px-6 border-brand-border-light dark:border-none text-[14px] disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              backgroundImage: isDarkMode ? `url(${ASSETS.INPUT_FIELD_BG})` : 'none',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: isDarkMode ? 'transparent' : '#F7F8FA',
            }}
          />
          <div className="space-y-2 mt-[21px]">
            <div
              className="w-full h-[48px] rounded-full flex items-center px-6 justify-between border-brand-border-light dark:border-none opacity-70 cursor-not-allowed"
              style={{
                backgroundImage: isDarkMode ? `url(${ASSETS.INPUT_FIELD_BG})` : 'none',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: isDarkMode ? 'transparent' : '#F3F3F3',
              }}
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-black/50 dark:text-muted-foreground text-[14px]">+91</span>
                <div className="h-4 w-px bg-black/10 dark:bg-white/10"></div>
                <span className="text-black/50 dark:text-muted-foreground text-[14px]">
                  {phoneNumber?.replace('+91', '').replace(/\s/g, '') || contextEmail}
                </span>
              </div>
              <img loading="lazy" decoding="async" src={ASSETS.VERIFIED} className="w-4 h-4 object-contain" alt="Verified" />
            </div>
            <p className="text-black dark:text-[#5B5B5B] text-[14px] font-normal px-4">
              This is how we know it's you. Or your evil twin.
            </p>
          </div>
          <div className="mt-[32px]">
            <div className="relative">
              <label htmlFor="profile-email" className="sr-only">
                Email Address
              </label>
              <Input
                id="profile-email"
                placeholder="Drop your email, the real one."
                value={email}
                onChange={e => setEmail(e.target.value.toLowerCase())}
                disabled={!isEditing}
                className="w-full h-[48px] rounded-full text-black dark:text-white placeholder:text-muted-foreground/60 px-6 border-brand-border-light dark:border-none text-[14px] pr-[100px] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  backgroundImage: isDarkMode ? `url(${ASSETS.INPUT_FIELD_BG})` : 'none',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: isDarkMode ? 'transparent' : '#F7F8FA',
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {emailVerified ? (
                  <img loading="lazy" decoding="async"                     src={ASSETS.VERIFIED}
                    className="w-4 h-4 object-contain mr-2"
                    alt="Verified"
                  />
                ) : isEmailNonEmpty && isEditing ? (
                  <button
                    onClick={handleVerify}
                    className="px-4 h-[32px] flex items-center justify-center rounded-full text-[14px] text-foreground"
                    style={{
                      backgroundImage: isDarkMode
                        ? 'url("/lovable-uploads/881be237-04b4-4be4-b639-b56090b04ed5.png")'
                        : 'none',
                      backgroundColor: isDarkMode ? 'transparent' : '#000000',
                      color: isDarkMode ? 'inherit' : '#ffffff',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {wasVerified ? 'Change?' : 'Verify'}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="text-black dark:text-[#5B5B5B] text-[14px] font-normal px-4 mt-2 font-satoshi">
              {emailHelperText}
            </p>
          </div>
          <Button
            onClick={handleSaveProfile}
            className="w-full h-[48px] rounded-full text-[16px] font-medium bg-brand-primary hover:bg-brand-primary/90 text-white border-none mt-[65px]"
          >
            {ctaLabel}
          </Button>
          <button
            onClick={() => navigate(-1)}
            className="w-full h-[48px] rounded-full text-[16px] font-medium flex items-center justify-center transition-transform active:scale-95 mt-[14px]"
            style={{
              backgroundImage: isDarkMode ? `url(${ASSETS.BUTTON_CANCEL})` : 'none',
              backgroundColor: isDarkMode ? 'transparent' : '#EBEBEB',
              color: isDarkMode ? '#FFFFFF' : '#000000',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="px-5 safe-bottom pb-4 opacity-40 flex flex-col items-start mt-auto">
        <p className="font-satoshi font-black text-[40px] text-foreground leading-none tracking-tight">
          grid.pe
        </p>
        <p className="text-sm mt-1">This is not where you find love.</p>
      </div>
    </div>
  );
};
export default ProfileEdit;
