import { ASSETS } from '@/constants/assets';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { Check, X, Loader2 } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Button } from '@/components/ui/button';
import { GpButton } from '@gridpe-app/ui';
import { supabase } from '@/lib/supabase';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useUser } from '@/contexts/UserContext';
import DiditSDK from '@didit-protocol/sdk-web';
import { crashlytics } from '@/lib/crashlytics';
const KYCForm = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();
  const [searchParams] = useSearchParams();
  const flow = searchParams.get('flow');
  const isFxFlow = flow === 'fx' || flow === 'fx_upgrade';
  const isUpgradeFlow = flow === 'fx_upgrade';
  const [selectedDoc, setSelectedDoc] = useState<string | null>(isFxFlow ? 'passport' : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchProfileData, kycStatus, isPassportVerified, profile, isSecureStorageReady } = useUser();

  // DEBUG: Log status on mount to catch aggressive redirects
  useEffect(() => {
    if (!isSecureStorageReady) return;
  }, [kycStatus, flow, isSecureStorageReady]);

  // Cleanup SDK instance firmly on unmount so camera/socket drops
  useEffect(() => {
    if (!isSecureStorageReady) return;
    return () => {
      if (DiditSDK?.shared) {
        try {
          if (typeof DiditSDK.shared.close === 'function') DiditSDK.shared.close();
          if (typeof DiditSDK.shared.destroy === 'function') DiditSDK.shared.destroy();
        } catch (e) {
          if (import.meta.env.DEV) console.warn('Didit SDK cleanup warning:', e);
          crashlytics.recordError(e instanceof Error ? e : new Error('KYCForm Didit SDK cleanup warning'), 'KYCForm.didItCleanup');
        }
      }
    };
  }, [isSecureStorageReady]);

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
  const userId = profile?.id;
  const documents = [
    { id: 'aadhar', name: 'Aadhar Card', icon: ASSETS.ICON_AADHAR },
    { id: 'pan', name: 'PAN Card', icon: ASSETS.ICON_PAN },
    { id: 'dl', name: 'Driving License', icon: ASSETS.ICON_PAN }, // using pan icon as instructed
    { id: 'voter', name: 'Voter ID', icon: ASSETS.ICON_VOTER },
    { id: 'passport', name: 'Passport', icon: ASSETS.ICON_PASSPORT },
  ];
  const filteredDocuments = isFxFlow ? documents.filter(doc => doc.id === 'passport') : documents;
  const requirements = [
    { text: 'Original full-size, unedited document', valid: true },
    { text: 'Place documents against a single-coloured background', valid: true },
    { text: 'Readable, well-lit, coloured images', valid: true },
    { text: 'No black and white images', valid: false },
  ];
  const handleContinue = async () => {
    // Console logs to debug the redirection logic
    // 0. Persistence Gate - DISABLED per user request to break the redirect loop
    setIsSubmitting(true);
    try {
      // 1. Defensively destroy any lingering SDK traces
      if (DiditSDK?.shared?.destroy) {
        DiditSDK.shared.destroy();
      }
      // 2. Set preliminary pending status in database (ONLY if not already verified)
      // This prevents verified users from losing access to basic features while upgrading to Passport KYC.
      const rawUuid = userId;
      if (kycStatus !== 'verified') {
        const { error: profileError } = await supabase
          .from('profiles')
          // @ts-ignore
          .update({ kyc_status: 'pending' })
          .eq('id', rawUuid);
        if (profileError) throw profileError;
      }
      // 4. Bypass Sticky Sessions by making vendor_data strictly unique per attempt
      // For FX flows, we use _p_ to signal passport requirement to the webhook
      const customerUuid = isFxFlow ? `${rawUuid}_p_${Date.now()}` : `${rawUuid}_${Date.now()}`;
      // 3. Launch Didit using the appropriate UniLink URL
      const DIDIT_STANDARD_URL = 'https://verify.didit.me/u/rIUXDqkBQ0Ger_cQiQMbrA';
      const DIDIT_PASSPORT_URL = 'https://verify.didit.me/u/gFonSKPQREqtUrpyWSSnpA';
      const targetUrl = isFxFlow ? DIDIT_PASSPORT_URL : DIDIT_STANDARD_URL;
      const metaFlow = isUpgradeFlow ? 'fx_upgrade' : isFxFlow ? 'fx_passport' : 'standard';
      
      const metadata = encodeURIComponent(JSON.stringify({
        user_type: 'customer',
        user_id: customerUuid,
        timestamp: Date.now()
      }));
      
      const finalUrl = `${targetUrl}?vendor_data=${customerUuid}&reverify=true&webhook=true&metadata=${metadata}`;
      window.open(finalUrl, '_blank');
      // Navigate to Success Screen in the background (active when user returns)
      navigate(isFxFlow ? ROUTES.FX_KYC_SUCCESS : ROUTES.KYC_SUCCESS, {
        state: {
          flow: isFxFlow ? 'fx' : 'standard',
          isWaitingForRealtime: true,
        },
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('KYC Submission error:', error);
      crashlytics.recordError(error instanceof Error ? error : new Error('KYCForm submission failed'), 'KYCForm.handleSubmit');
      showToaster('Failed to start verification. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div
      className="h-[100dvh] w-full overflow-hidden flex flex-col relative"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#5260FE',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-5 safe-top pt-4 pb-2 relative z-10">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}
        >
          KYC
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="min-h-full flex flex-col px-5 pt-4 pb-20">
          {/* Steps Indicator */}
          <div
            className={`w-full h-[88px] rounded-[20px] p-5 mb-8 relative overflow-hidden ${!isDarkMode ? 'bg-white border border-brand-border-light' : ''}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.KYC_STEPS_BG})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {}
            }
          >
            <div className="flex justify-between items-center mb-3">
              <span
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}
              >
                Step 1/4
              </span>
              <span
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}
              >
                Document Type
              </span>
            </div>
            <div
              className={`w-full h-[6px] ${isDarkMode ? 'bg-white/20' : 'bg-brand-bg-light'} rounded-full overflow-hidden`}
            >
              <div className="h-full w-[25%] bg-brand-primary rounded-full" />
            </div>
          </div>
          {/* Title */}
          <div className="mb-6">
            <h2
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold mb-1 font-sans`}
            >
              {isFxFlow ? 'Passport Required' : 'Choose a document'}
            </h2>
            <p
              className={`${isDarkMode ? 'text-brand-text-muted' : 'text-brand-text-muted'} text-[14px] font-sans font-normal`}
            >
              {isFxFlow
                ? 'Only a valid passport is accepted for FX Exchange KYC'
                : 'Use a valid government-issued ID for verification.'}
            </p>
          </div>
          {/* Document Grid */}
          <div className={isFxFlow ? 'flex flex-col gap-4 mb-8' : 'grid grid-cols-2 gap-4 mb-8'}>
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                role="radio"
                aria-checked={selectedDoc === doc.id}
                tabIndex={0}
                onClick={() => !isFxFlow && setSelectedDoc(doc.id)}
                onKeyDown={e => {
                  if (!isFxFlow && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setSelectedDoc(doc.id);
                  }
                }}
                className="relative rounded-[16px] cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/50"
                style={{
                  backgroundImage: isDarkMode
                    ? `url(${isFxFlow ? ASSETS.PASSPORT_KYC : ASSETS.KYC_DOCUMENT_BG})`
                    : 'none',
                  backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
                  border: !isDarkMode
                    ? selectedDoc === doc.id
                      ? '1px solid #5260FE'
                      : '1px solid #E9EAEB'
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: isFxFlow ? '362px' : 'auto',
                  height: isFxFlow ? '120px' : '120px',
                  padding: '16px',
                }}
              >
                <div className="flex justify-between items-start">
                  <img loading="lazy"
                    src={doc.icon}
                    alt={doc.name}
                    className={`w-8 h-8 object-contain ${!isDarkMode && (doc.id === 'pan' || doc.id === 'passport') ? 'filter brightness-0' : ''}`}
                    style={doc.id === 'dl' ? { opacity: 1, filter: 'none' } : undefined}
                  />
                  <img loading="lazy"
                    src={selectedDoc === doc.id ? ASSETS.RADIO_ON : ASSETS.RADIO_OFF}
                    alt={selectedDoc === doc.id ? 'Selected' : 'Not selected'}
                    className={`w-6 h-6 ${!isDarkMode && selectedDoc !== doc.id ? 'filter brightness-0 opacity-20' : ''}`}
                  />
                </div>
                <span
                  className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans absolute bottom-4 left-4`}
                >
                  {doc.name}
                </span>
              </div>
            ))}
          </div>
          {/* Requirements */}
          <div className="space-y-3 mb-6">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {req.valid ? (
                    <Check className="w-4 h-4 text-brand-primary" />
                  ) : (
                    <X className="w-4 h-4 text-brand-primary" />
                  )}
                </div>
                <p
                  className={`${isDarkMode ? 'text-brand-text-muted' : 'text-brand-text-muted'} text-[13px] font-normal font-sans leading-snug`}
                >
                  {req.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Footer - Constrained container */}
      <div
        className={`mt-auto safe-bottom pb-4 pt-4 w-full flex flex-col items-center ${isDarkMode ? 'bg-gradient-to-t from-brand-bg-dark to-transparent' : 'bg-white/80 backdrop-blur-md'} z-20`}
      >
        <p
          className={`${isDarkMode ? 'text-brand-text-muted/60' : 'text-brand-text-muted'} text-[14px] font-normal font-sans text-left mb-4 leading-relaxed max-w-[362px] w-full px-5`}
        >
          This information is used for identity verification only, and will be kept secure by Didit
        </p>
        <GpButton
          fullWidth={false}
          className="w-[362px]"
          disabled={!selectedDoc || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? 'Starting...' : 'Continue'}
        </GpButton>
      </div>
    </div>
  );
};
export default KYCForm;
