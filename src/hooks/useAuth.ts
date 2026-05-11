import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import DiditSDK from '@didit-protocol/sdk-web';
import { ROUTES } from '@/routes';

export const useAuth = () => {
  const { resetForDemo } = useUser();

  const logout = useCallback(async () => {
    try {
      // 1. Clear Supabase session
      await supabase.auth.signOut();

      // 2. Clear Context state
      resetForDemo();

      // 3. Purge Didit Cache & Destroy Instances securely
      if (DiditSDK?.shared?.destroy) {
        DiditSDK.shared.destroy();
      }

      // 4. Clear all storage to ensure zero persistence
      localStorage.clear();
      sessionStorage.clear();

      // 5. HARD RESET: Force a full WebView reload to the base origin.
      // This strips the HashRouter history (#/home) and resets the JS environment.
      // After reload, the app starts at / with NO session, ensuring total isolation.
      window.location.href = window.location.origin + window.location.pathname;
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback reload if everything fails
      window.location.href = ROUTES.HOME;
    }
  }, [resetForDemo]);

  return { logout };
};
