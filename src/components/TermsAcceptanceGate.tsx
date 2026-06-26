import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Button } from '@/components/ui/button';
import { LEGAL_CONFIG } from '@/constants/legal';
import { Loader2 } from 'lucide-react';
import { useCustomToaster } from '@/contexts/CustomToasterContext';

const TERMS_FALLBACK = `<p>Welcome to Grid.Pe! These Terms and Conditions govern your use of our fintech application. By accessing or using Grid.Pe, you agree to be bound by these terms.</p>
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

const PRIVACY_FALLBACK = `<p>At Grid.Pe, your privacy is our top priority. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>
<h3>1. Information We Collect</h3>
<p>We collect personal information such as your name, phone number, email address, and financial details to provide and improve our services.</p>
<h3>2. How We Use Your Information</h3>
<p>We use your information to verify your identity, process transactions, communicate with you, and ensure security and compliance.</p>
<h3>3. Information Sharing</h3>
<p>We do not sell your personal information. We may share your data with trusted partners and service providers as necessary to deliver our services or as required by law.</p>
<h3>4. Security of Your Data</h3>
<p>We implement advanced security measures, including encryption and biometric authentication, to protect your personal data from unauthorized access.</p>
<h3>5. Your Privacy Rights</h3>
<p>You have the right to access, update, or request deletion of your personal information. Please contact our privacy officer for any requests.</p>`;

export const TermsAcceptanceGate: React.FC = () => {
  const { profile, setProfile, isInitializing } = useUser();
  const isDarkMode = useIsDarkMode();
  const { showToaster } = useCustomToaster();
  
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [termsContent, setTermsContent] = useState<string>('');
  const [privacyContent, setPrivacyContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMandatory, setIsMandatory] = useState<boolean>(false);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);

  const userId = profile?.id;

  // Determine if terms acceptance is required
  useEffect(() => {
    if (isInitializing || !profile) {
      setIsMandatory(false);
      return;
    }

    const acceptedAt = profile.terms_accepted_at;
    const acceptedVersion = profile.terms_version;
    const currentVersion = LEGAL_CONFIG.CURRENT_TERMS_VERSION;

    if (!acceptedAt) {
      setIsMandatory(true);
      setIsUpdate(false);
    } else if (acceptedVersion !== currentVersion) {
      setIsMandatory(true);
      setIsUpdate(true);
    } else {
      setIsMandatory(false);
    }
  }, [profile, isInitializing]);

  // Load content from Supabase with 5-second timeout
  useEffect(() => {
    if (!isMandatory) return;

    const loadContent = async () => {
      setIsLoading(true);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      try {
        const fetchPromise = Promise.all([
          supabase
            .from('terms_and_conditions' as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('privacy_policies' as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
        ]);

        const [termsResult, privacyResult] = await Promise.race([fetchPromise, timeoutPromise]) as any;

        const termsData = termsResult.data;
        const termsError = termsResult.error;
        const privacyData = privacyResult.data;
        const privacyError = privacyResult.error;

        setTermsContent(
          (!termsError && termsData && termsData.length > 0 && termsData[0].content) || TERMS_FALLBACK
        );
        setPrivacyContent(
          (!privacyError && privacyData && privacyData.length > 0 && privacyData[0].content) || PRIVACY_FALLBACK
        );
      } catch (err) {
        console.warn('Failed to load legal content from database or request timed out, using fallback.', err);
        setTermsContent(TERMS_FALLBACK);
        setPrivacyContent(PRIVACY_FALLBACK);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [isMandatory]);

  const handleAccept = async () => {
    if (!userId) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const currentVersion = LEGAL_CONFIG.CURRENT_TERMS_VERSION;

      // Update profiles in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: now,
          terms_version: currentVersion,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Save user legal consent log
      const { error: consentError } = await supabase.from('user_legal_consents').upsert(
        {
          user_id: userId,
          document_type: 'terms_and_privacy',
          document_id: `v${currentVersion}`,
          accepted_at: now,
        },
        { onConflict: 'user_id,document_type,document_id' }
      );
      if (consentError) {
        console.warn('Error recording detailed consent log:', consentError);
      }

      // Update local state in UserContext
      setProfile({
        ...profile,
        terms_accepted_at: now,
        terms_version: currentVersion,
      });

      showToaster('Thank you. The terms have been successfully accepted.', 'success');
      setIsMandatory(false);
    } catch (err: unknown) {
      console.error('Failed to accept terms', err);
      showToaster(err.message || 'Failed to accept terms. Please check connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMandatory) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col font-satoshi animate-in fade-in duration-300 pointer-events-auto"
      style={{
        backgroundColor: isDarkMode ? '#05050B' : '#F8FAFC',
      }}
    >
      {/* Light Mode Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-20 pointer-events-none z-0" />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col px-6 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))] h-full relative z-10">
        
        {/* Header Title */}
        <div className="text-center mt-4 mb-4 shrink-0">
          <h1 className={`text-[22px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Legal Agreement
          </h1>
          <p className={`text-[13px] mt-1.5 px-4 font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isUpdate 
              ? "We've updated our Terms. Please review and accept to continue."
              : "Please review and agree to our terms before using Grid.Pe."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`flex p-1 rounded-full mb-5 shrink-0 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-200/60 border border-slate-300/30'}`}>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2.5 text-center text-[14px] font-semibold rounded-full transition-all ${
              activeTab === 'terms'
                ? isDarkMode
                  ? 'bg-white text-black shadow-lg shadow-white/5'
                  : 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2.5 text-center text-[14px] font-semibold rounded-full transition-all ${
              activeTab === 'privacy'
                ? isDarkMode
                  ? 'bg-white text-black shadow-lg shadow-white/5'
                  : 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Legal Text Panel */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col mb-6">
          <div
            className={`flex-1 overflow-hidden flex flex-col rounded-[24px] border ${
              isDarkMode 
                ? 'bg-slate-900/40 border-white/10' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="px-5 pt-5 pb-3 border-b border-dashed border-slate-800/10 dark:border-white/10 shrink-0">
              <h2 className={`text-[15px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
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
                  <div className="h-4 bg-slate-400/20 dark:bg-white/10 rounded w-5/6" />
                </div>
              ) : (
                <div
                  className={`legal-prose-overlay ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}
                  dangerouslySetInnerHTML={{ __html: activeTab === 'terms' ? termsContent : privacyContent }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex flex-col gap-2.5">
          <Button
            variant={isDarkMode ? 'gradient' : 'default'}
            disabled={isLoading || isSubmitting}
            className={`w-full h-[52px] rounded-full text-white text-[16px] font-bold flex items-center justify-center transition-all ${
              isDarkMode 
                ? 'btn-gradient shadow-lg shadow-brand-primary/10' 
                : 'bg-brand-primary hover:bg-brand-primary/95 border-none shadow-lg shadow-brand-primary/10'
            }`}
            onClick={handleAccept}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'I Accept & Agree'
            )}
          </Button>
          <p className={`text-[11px] text-center px-4 leading-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            By clicking accept, you acknowledge and agree to both documents.
          </p>
        </div>

      </div>

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
