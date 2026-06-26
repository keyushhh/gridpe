import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ROUTES } from '@/routes';
import { Capacitor } from '@capacitor/core';
import { useUser } from '@/contexts/UserContext';
import MpinSheet from '@/components/MpinSheet';

// Module-level flag — gate only triggers after tab has been hidden at least once
let hasBeenHidden = false;
let hiddenAt: number | null = null;

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
      const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) =>
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
        const { data } = await supabase
          .from('profiles')
          .select('mpin_hash')
          .eq('id', session.user.id)
          .single();

        const profileData = data as any;

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

    const handlePageHide = () => {
      hiddenAt = Date.now();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      // Always lock immediately on bfcache restore — no grace period
      triggerMpinGate();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Record when we went hidden and pause the timer
        hiddenAt = Date.now();
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
      } else {
        // Tab is visible again — check how long we were away
        if (hiddenAt !== null) {
          const elapsed = Date.now() - hiddenAt;
          hiddenAt = null;
          if (elapsed >= INACTIVITY_TIMEOUT_MS) {
            // Been away long enough — lock immediately
            triggerMpinGate();
            return;
          }
          // Resume the remaining time instead of restarting from full 2 minutes
          const remaining = INACTIVITY_TIMEOUT_MS - elapsed;
          if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
          }
          inactivityTimer.current = setTimeout(() => {
            triggerMpinGate();
          }, remaining);
        } else {
          resetInactivityTimer();
        }
      }
    };

    const activityEvents = ['mousemove', 'click', 'keydown', 'scroll'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
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
        className={`fixed inset-0 ${isDark ? 'bg-brand-bg-dark' : 'bg-white'}`}
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
            hiddenAt = null;
          }}
        />
      </>
    );
  }

  return <>{children}</>;
};
