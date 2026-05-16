import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CardSkeleton from '@/components/skeletons/CardSkeleton';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

const AuthCallback = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handleAuth = async () => {
      // Robust Token Extraction for HashRouter
      // HashRouter puts its own route after the first #/
      // Google Auth puts Supabase tokens after ANOTHER # or in the same fragment
      // Example: /#/auth/v1/callback#access_token=...&refresh_token=...

      const fullUrl = window.location.href;

      // 1. Manually extract tokens if they are in the fragment
      let tokensFound = false;
      const hashParts = fullUrl.split('#');
      // Look for the part that has access_token (usually the last part)
      const fragment = hashParts.find(p => p.includes('access_token='));

      if (fragment) {
        const params = new URLSearchParams(fragment.startsWith('/') ? fragment.slice(1) : fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            tokensFound = true;
          } else {
            console.error('AuthCallback: Error setting session:', error);
          }
        }
      }

      // 2. Check for 'code' (PKCE Flow)
      if (!tokensFound) {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) tokensFound = true;
          else console.error('AuthCallback: Exchange error:', error);
        }
      }

      // 3. Final Check & Redirect
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session || tokensFound) {
        navigate(ROUTES.INDEX, { replace: true });
      } else {
        setTimeout(() => {
          navigate(ROUTES.INDEX, { replace: true });
        }, 3000);
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-brand-bg-dark text-white px-5">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <CardSkeleton height={120} />
        <p className="text-[14px] font-medium font-satoshi animate-pulse">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
