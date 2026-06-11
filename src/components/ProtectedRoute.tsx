import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ROUTES } from '@/routes';
import { Capacitor } from '@capacitor/core';
import { useUser } from '@/contexts/UserContext';
import MpinSheet from '@/components/MpinSheet';

// Module-level flag — gate only triggers after tab has been hidden at least once
let hasBeenHidden = false;

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const hasSession = Object.keys(localStorage).some(key => key.includes('auth-token'));
    return hasSession ? null : false;
  });
  const [showMpinGate, setShowMpinGate] = useState(false);
  const location = useLocation();
  const isWeb = Capacitor.getPlatform() === 'web';
  const { profile, setProfile } = useUser();
  // Store fetched mpin_hash separately — never replace the full profile object
  const mpinHashRef = useRef<string | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkAuth = useCallback(async () => {
    let resolvedSession = false;
    try {
      const timeoutPromise = new Promise<{ data: { session: any } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 4000)
      );
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]);
      resolvedSession = !!session;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('ProtectedRoute auth check error:', err);
      }
    } finally {
      setIsAuthenticated(resolvedSession);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  // Web-only: inactivity timeout → MPIN gate or full logout
  useEffect(() => {
    if (!isWeb) return;

    const triggerMpinGate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          return;
        }

        // Fetch ONLY mpin_hash — do not touch profile context
        const { data: profileData } = await supabase
          .from('profiles')
          .select('mpin_hash')
          .eq('id', session.user.id)
          .single();

        if (profileData?.mpin_hash) {
          mpinHashRef.current = profileData.mpin_hash;

          // Patch ONLY mpin_hash onto existing profile so MpinSheet can read it
          // This preserves all other profile fields including terms_accepted_at
          if (profile) {
            setProfile({ ...profile, mpin_hash: profileData.mpin_hash } as any);
          } else {
            // Profile not loaded yet — set minimal object with just what MpinSheet needs
            setProfile({ mpin_hash: profileData.mpin_hash, id: session.user.id } as any);
          }
          setShowMpinGate(true);
        }
        // If no mpin_hash, let them through without gate
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[ProtectedRoute] inactivity check error:', err);
      }
    };

    const resetInactivityTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }

      if (document.visibilityState === 'hidden') {
        return; // do nothing (tab is not visible)
      }

      inactivityTimer.current = setTimeout(() => {
        triggerMpinGate();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
      } else {
        resetInactivityTimer();
      }
    };

    const activityEvents = ['mousemove', 'click', 'keydown', 'scroll'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [isWeb, setProfile, profile]);

  if (isAuthenticated === null) {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme !== 'light';
    return (
      <div
        className="fixed inset-0"
        style={{ backgroundColor: isDark ? '#0a0a12' : '#FFFFFF' }}
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.INDEX} state={{ from: location }} replace />;
  }

  if (showMpinGate && isWeb) {
    return (
      <>
        {children}
        <MpinSheet
          mode="verify"
          hideClose={true}
          onClose={() => {
            // No-op — cannot dismiss without verifying
          }}
          onSuccess={() => {
            setShowMpinGate(false);
            hasBeenHidden = false;
          }}
        />
      </>
    );
  }

  return <>{children}</>;
};
