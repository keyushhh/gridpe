import { ASSETS } from '@/constants/assets';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';

import { useUser } from '@/contexts/UserContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BackButton from '@/components/ui/BackButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { GpButton } from '@gridpe-app/ui';
import { User } from '@supabase/supabase-js';
import { useWebScroll } from '@/hooks/useWebScroll';
import { crashlytics } from '@/lib/crashlytics';
interface LegalContent {
  id: string;
  content: string;
  title: string;
  updatedAt: string;
}
const LegalPage = ({ type }: { type: 'privacy' | 'terms' }) => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, setProfile } = useUser();
  const userId = profile?.id;
  const isDarkMode = useIsDarkMode();
  const isFromMore = location.state?.fromMore === true;
  const [isAccepted, setIsAccepted] = useState(false);

  const { logout } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['legal-content', type, userId],
    queryFn: async (): Promise<{
      content: LegalContent | null;
      isAccepted: boolean;
      hasSession: boolean;
      error: string | null;
    }> => {
      const table = type === 'privacy' ? 'privacy_policies' : 'terms_and_conditions';
      const title = type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
      
      const fallbackHtml = type === 'privacy' 
        ? `<p>At Grid.Pe, your privacy is our top priority. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>
<h3>1. Information We Collect</h3>
<p>We collect personal information such as your name, phone number, email address, and financial details to provide and improve our services.</p>
<h3>2. How We Use Your Information</h3>
<p>We use your information to verify your identity, process transactions, communicate with you, and ensure security and compliance.</p>
<h3>3. Information Sharing</h3>
<p>We do not sell your personal information. We may share your data with trusted partners and service providers as necessary to deliver our services or as required by law.</p>
<h3>4. Security of Your Data</h3>
<p>We implement advanced security measures, including encryption and biometric authentication, to protect your personal data from unauthorized access.</p>
<h3>5. Your Privacy Rights</h3>
<p>You have the right to access, update, or request deletion of your personal information. Please contact our privacy officer for any requests.</p>`
        : `<p>Welcome to Grid.Pe! These Terms and Conditions govern your use of our fintech application. By accessing or using Grid.Pe, you agree to be bound by these terms.</p>
<h3>1. Account Registration</h3>
<p>You must register for an account to use our services. You agree to provide accurate and complete information and to keep this information updated.</p>
<h3>2. Services Provided</h3>
<p>Grid.Pe provides digital payments, currency exchange, and other financial services. We reserve the right to modify or discontinue any services at any time.</p>
<h3>3. User Conduct</h3>
<p>You agree not to use the application for any illegal activities, including money laundering, fraud, or unauthorized access to other accounts.</p>
<h3>4. Limitation of Liability</h3>
<p>Grid.Pe shall not be liable for any indirect, incidental, or consequential damages arising out of or in connection with your use of the application.</p>
<h3>5. Contact Us</h3>
<p>If you have any questions about these Terms, please contact support at support@grid.pe.</p>`;

      const defaultData = {
        content: {
          id: 'fallback-v1.0',
          content: fallbackHtml,
          title: title,
          updatedAt: '02 August, 2025',
        },
        isAccepted: false,
        hasSession: !!userId,
        error: null,
      };

      if (!userId) {
        return { ...defaultData, hasSession: false };
      }

      try {
        let timer: any;
        const timeoutPromise = new Promise((_, reject) =>
          timer = setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const fetchPromise = supabase
          .from(table as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        const { data: results, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;
        clearTimeout(timer);

        if (fetchError || !results || results.length === 0) {
          return defaultData;
        }

        const result = results[0];
        const docId = result.id || result.created_at;

        // Check if user has already accepted this version
        let accepted = false;
        const { data: consent } = await (supabase as any)
          .from('user_legal_consents')
          .select('id')
          .eq('user_id', userId)
          .eq('document_type', type)
          .eq('document_id', docId)
          .maybeSingle();
        accepted = !!consent;

        // Format date: 02 August, 2025
        const date = new Date(result.created_at);
        const formattedDate = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        return {
          content: {
            id: docId,
            content: result.content || fallbackHtml,
            title: title,
            updatedAt: formattedDate,
          },
          isAccepted: accepted,
          hasSession: true,
          error: null,
        };
      } catch (err) {
        if (import.meta.env.DEV) console.warn('LegalPage: Failed to load content from database, using fallback.', err);
        crashlytics.recordError(err instanceof Error ? err : new Error('LegalPage failed to load content from database'), 'LegalPage.fetchContent');
        return defaultData;
      }
    },
  });
  const legalContent = data?.content ?? null;
  const legalError = data?.error ?? null;
  const hasSession = data?.hasSession ?? false;
  // Initialize isAccepted from query, but allow local override on accept
  const queryAccepted = data?.isAccepted ?? false;
  const handleAccept = async () => {
    if (!legalContent) return;
    if (userId) {
      // Save consent to DB
      const { error: consentError } = await (supabase as any).from('user_legal_consents').upsert(
        {
          user_id: userId,
          document_type: type,
          document_id: legalContent!.id,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,document_type,document_id' }
      );
      if (consentError) {
        if (import.meta.env.DEV) console.error('LegalPage: Error saving consent:', consentError);
        crashlytics.recordError(consentError instanceof Error ? consentError : new Error('LegalPage failed to save consent'), 'LegalPage.saveConsent');
      }

      // Update user profile terms columns in Supabase
      try {
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .update({
            terms_accepted_at: new Date().toISOString(),
            terms_version: '1.0',
          })
          .eq('id', userId);
        
        if (!profileError && profile) {
          setProfile({
            ...profile,
            terms_accepted_at: new Date().toISOString(),
            terms_version: '1.0',
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('LegalPage: Error updating profile terms columns:', err);
        crashlytics.recordError(err instanceof Error ? err : new Error('LegalPage failed to update profile terms'), 'LegalPage.updateProfileTerms');
      }
    }
    if (type === 'terms' && !isAccepted) {
      setIsAccepted(true);
    } else {
      navigate(-1);
    }
  };
  const handleDecline = async () => {
    if (userId) {
      await logout();
    } else {
      navigate(-1);
    }
  };
  // Priority:
  // 1. If actually accepted in DB or profile -> show Accepted UI (tagline + tnc-accepted bg)
  // 2. If NOT accepted and has session -> show Actions (Accept/Decline buttons)
  // 3. If NOT accepted and NO session -> show standard intent text (Onboarding)
  const hasAcceptedInProfile = profile?.terms_accepted_at !== null && profile?.terms_accepted_at !== undefined;
  const showAcceptedUI = isAccepted || queryAccepted || hasAcceptedInProfile;
  const showActions = hasSession && !isAccepted && !queryAccepted && !hasAcceptedInProfile;
  const isTnc = type === 'terms';
  const containerBg = isTnc
    ? showAcceptedUI
      ? ASSETS.TNC_ACCEPTED
      : ASSETS.TNC_BG
    : 'rgba(255, 255, 255, 0.03)';
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col font-satoshi relative`}
      style={{
        backgroundColor: isDarkMode ? '#05050B' : '#F8FAFC',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow (Top Center) */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-20 pointer-events-none z-0" />
      )}
      {/* Header */}
      <div className="px-4 safe-top pt-4 relative flex items-center justify-center min-h-[64px] z-10">
        <div className="absolute left-4">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <h1 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} text-[18px] font-bold`}>
          {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
        </h1>
      </div>
      {/* Hero Text */}
      <div className="px-6 mt-6 mb-5 relative z-10">
        <p
          className={`text-[13px] leading-relaxed font-normal animate-fade-in ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
          key={showAcceptedUI ? 'accepted' : 'initial'}
        >
          {showAcceptedUI
            ? 'You’re all set — let’s make money moves.'
            : 'Before we roll, take a minute to read and agree to the boring (but important) stuff.'}
        </p>
      </div>
      {/* Content Container */}
      <div className="px-6 flex-1 overflow-hidden flex flex-col mb-6 relative z-10">
        <div
          className={`flex-1 overflow-hidden flex flex-col rounded-[24px] border ${
            isDarkMode 
              ? 'bg-slate-900/40 border-white/10' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="px-5 pt-5 pb-3 border-b border-dashed border-slate-800/10 dark:border-white/10 shrink-0">
            <h2 className={`text-[15px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              GRID.PE MOBILE APP AGREEMENT
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-4 animate-pulse pt-2">
                <div className="h-4 bg-slate-400/20 dark:bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-slate-400/20 dark:bg-white/10 rounded w-full" />
                <div className="h-4 bg-slate-400/20 dark:bg-white/10 rounded w-full" />
                <div className="h-4 bg-slate-400/20 dark:bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-slate-400/20 dark:bg-white/10 rounded w-full" />
              </div>
            ) : legalError ? (
              <div className="text-center py-10 pt-4">
                <p className="text-red-400 mb-4">{legalError}</p>
                <button onClick={() => refetch()} className="text-link underline">
                  Retry
                </button>
              </div>
            ) : (
              <div
                className={`legal-prose-overlay ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}
                dangerouslySetInnerHTML={{ __html: legalContent?.content || '' }}
              />
            )}
          </div>
        </div>
      </div>
      {/* Bottom Actions */}
      {showActions && (
        <div className="px-6 safe-bottom pb-6 pt-2 flex gap-4 animate-fade-in justify-center relative z-10">
          <GpButton
            variant="secondary"
            fullWidth={false}
            className="w-[172px]"
            onClick={handleDecline}
          >
            Decline
          </GpButton>
          <GpButton
            fullWidth={false}
            className="w-[172px]"
            onClick={handleAccept}
          >
            Accept
          </GpButton>
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        .legal-prose-overlay h1, .legal-prose-overlay h2, .legal-prose-overlay h3 {
          color: ${isDarkMode ? 'white' : '#0f172a'};
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          font-size: 14px;
        }
        .legal-prose-overlay h1:first-child, .legal-prose-overlay h2:first-child, .legal-prose-overlay h3:first-child {
          margin-top: 0;
        }
        .legal-prose-overlay p, .legal-prose-overlay li {
          font-weight: 400;
          font-size: 12px;
          margin-bottom: 0.5rem;
          line-height: 1.6;
          color: ${isDarkMode ? '#cbd5e1' : '#334155'};
        }
        .legal-prose-overlay ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};
export default LegalPage;
