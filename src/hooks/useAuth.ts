import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { purgeOtherUsersStorage } from '@/utils/storage';
import DiditSDK from '@didit-protocol/sdk-web';
import { ROUTES } from '@/routes';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';

export const useAuth = () => {
  const { resetForDemo } = useUser();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      // 1. Determine current user (so we can clean user-scoped keys)
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // 2. Clear Supabase session
      await supabase.auth.signOut();

      // 3. Purge any namespaced gridpe keys (this removes user-scoped cache)
      try {
        // Save theme preference
        const savedTheme = localStorage.getItem('theme');
        purgeOtherUsersStorage(undefined); // remove all gridpe keys
        if (savedTheme) localStorage.setItem('theme', savedTheme);
        sessionStorage.clear();
      } catch (e) {
        if (import.meta.env.DEV) { console.warn('Failed to purge local storage during logout:', e); }
      }

      // 4. Purge SecureStorage keys explicitly on native
      try {
        if (Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
          // Best-effort removals (some keys may not exist)
          await SecureStorage.remove('gridpe_secure_user_state').catch((err) => {
            if (import.meta.env.DEV) console.warn('[non-critical]', err);
          });
          await SecureStorage.remove('supabase.auth.token').catch((err) => {
            if (import.meta.env.DEV) console.warn('[non-critical]', err);
          });
        }
      } catch (e) {
        // ignore failures
      }

      // 5. Destroy any third-party SDK instances safely
      if (DiditSDK?.shared?.destroy) {
        DiditSDK.shared.destroy();
      }

      // 6. Clear Context state (non-destructive reset flow)
      resetForDemo();

      // 7. Navigate to home (avoid full clear unless necessary)
      navigate(ROUTES.HOME);
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Logout failed:', error); }
      // Fallback reload if everything fails
      navigate(ROUTES.HOME);
    }
  }, [resetForDemo, navigate]);

  return { logout };
};
