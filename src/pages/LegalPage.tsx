import { ASSETS } from '@/constants/assets';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from 'next-themes';
import BackButton from '@/components/ui/BackButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, Session } from '@supabase/supabase-js';
import { useWebScroll } from '@/hooks/useWebScroll';
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
  const { profile } = useUser();
  const userId = profile?.id;
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const isFromMore = location.state?.fromMore === true;
  const [isAccepted, setIsAccepted] = useState(false);

  const { logout } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['legal-content', type, userId],
    queryFn: async (): Promise<{
      content: LegalContent | null;
      isAccepted: boolean;
      hasSession: boolean;
      error: string | null;
    }> => {
      const table = type === 'privacy' ? 'privacy_policies' : 'terms_and_conditions';
      const title = type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
      if (!userId) {
        return { content: null, isAccepted: false, hasSession: false, error: null };
      }
      const { data: results, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (fetchError) {
        return {
          content: null,
          isAccepted: false,
          hasSession: true,
          error: `Failed to load ${title}. ${fetchError.message}`,
        };
      }
      if (!results || results.length === 0) {
        return {
          content: null,
          isAccepted: false,
          hasSession: true,
          error: `No ${title} content found in the database.`,
        };
      }
      const result = results[0];
      const docId = result.id || result.created_at;
      // Check if user has already accepted this version
      let accepted = false;
      const { data: consent, error: consentError } = await supabase
        .from('user_legal_consents')
        .select('id')
        .eq('user_id', userId)
        .eq('document_type', type)
        .eq('document_id', docId)
        .maybeSingle();
      if (consentError) console.error('LegalPage: Error checking consent:', consentError);
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
          content: result.content,
          title: title,
          updatedAt: formattedDate,
        },
        isAccepted: accepted,
        hasSession: true,
        error: null,
      };
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
      const { error: consentError } = await supabase.from('user_legal_consents').upsert(
        {
          user_id: userId,
          document_type: type,
          document_id: legalContent!.id,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,document_type,document_id' }
      );
      if (consentError) {
        console.error('LegalPage: Error saving consent:', consentError);
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
  // 1. If actually accepted in DB -> show Accepted UI (tagline + tnc-accepted bg)
  // 2. If NOT accepted and has session -> show Actions (Accept/Decline buttons)
  // 3. If NOT accepted and NO session -> show standard intent text (Onboarding)
  const showAcceptedUI = isAccepted || queryAccepted;
  const showActions = hasSession && !isAccepted && !queryAccepted;
  const isTnc = type === 'terms';
  const containerBg = isTnc
    ? showAcceptedUI
      ? ASSETS.TNC_ACCEPTED
      : ASSETS.TNC_BG
    : 'rgba(255, 255, 255, 0.03)';
  const containerHeight = isTnc ? (showAcceptedUI ? '678px' : '573px') : 'auto';
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col font-satoshi ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
      style={{
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow (Top Center) */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header */}
      <div className="px-4 safe-top pt-4 relative flex items-center justify-center min-h-[64px]">
        <div className="absolute left-4">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <h1 className={`${isDarkMode ? 'text-foreground' : 'text-black'} text-[18px] font-bold`}>
          {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
        </h1>
      </div>
      {/* Hero Text */}
      <div className="px-4 mt-8 mb-6 relative z-10">
        <p
          className={`text-[14px] leading-snug font-medium animate-fade-in ${isDarkMode ? 'text-muted-foreground' : 'text-black'}`}
          key={showAcceptedUI ? 'accepted' : 'initial'}
        >
          {showAcceptedUI
            ? 'You’re all set — let’s make money moves.'
            : 'Before we roll, take a minute to read and agree to the boring (but important) stuff.'}
        </p>
      </div>
      {/* Content Container */}
      <div className="px-4 flex-1 overflow-hidden flex flex-col mb-4">
        <div
          className={`flex-1 overflow-hidden flex flex-col transition-all duration-300 ${isDarkMode ? 'border border-white/10 rounded-[22px]' : 'border border-[#E9EAEB] rounded-[22px]'}`}
          style={{
            backgroundImage: isTnc && isDarkMode ? `url(${containerBg})` : 'none',
            backgroundColor: isDarkMode
              ? isTnc
                ? 'transparent'
                : 'rgba(255, 255, 255, 0.03)'
              : '#FFFFFF',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maxHeight: containerHeight !== 'auto' ? containerHeight : 'none',
            height: containerHeight !== 'auto' ? containerHeight : '100%',
          }}
        >
          <div className="px-4 pt-4 pb-4">
            <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold`}>
              Grid.Pe {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
            </h2>
            <p
              className="text-[#5260FE] text-[14px] mt-1 font-normal opacity-80"
              style={{ fontWeight: 400 }}
            >
              Last Updated: {legalContent?.updatedAt || 'Loading...'}
            </p>
          </div>
          <div className="px-4 pb-4 overflow-y-auto flex-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-4 animate-pulse pt-4">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-white/10 rounded w-full" />
              </div>
            ) : legalError ? (
              <div className="text-center py-10 pt-4">
                <p className="text-red-400 mb-4">{legalError}</p>
                <button onClick={() => window.location.reload()} className="text-link underline">
                  Retry
                </button>
              </div>
            ) : (
              <div
                className={`legal-prose ${isDarkMode ? 'text-white/80' : 'text-black'}`}
                dangerouslySetInnerHTML={{ __html: legalContent?.content || '' }}
              />
            )}
          </div>
        </div>
      </div>
      {/* Bottom Actions */}
      {showActions && (
        <div className="px-4 safe-bottom pb-4 pt-2 flex gap-4 animate-fade-in justify-center">
          <Button
            variant="outline"
            className={`w-[172px] h-[48px] rounded-full border text-[16px] font-medium flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-[#E9EAEB] text-black'}`}
            onClick={handleDecline}
          >
            Decline
          </Button>
          <Button
            variant={isDarkMode ? 'gradient' : 'default'}
            className={`w-[172px] h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center transition-all ${isDarkMode ? 'btn-gradient' : 'bg-[#5260FE] hover:bg-[#5260FE]/90 border-none'}`}
            onClick={handleAccept}
          >
            Accept
          </Button>
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .legal-prose h1, .legal-prose h2, .legal-prose h3 {
          color: ${isDarkMode ? 'white' : 'black'};
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          font-size: 14px; /* Satoshi Bold 14px */
        }
        .legal-prose h1:first-child, .legal-prose h2:first-child, .legal-prose h3:first-child {
          margin-top: 0;
        }
        .legal-prose p, .legal-prose li {
          font-weight: 400; /* Satoshi Regular */
          font-size: 12px;
          margin-bottom: 0.25rem;
          line-height: 1.6;
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'black'};
        }
        .legal-prose ul {
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
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
`,
        }}
      />
    </div>
  );
};
export default LegalPage;
