import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/routes';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    // Synchronous hint: If localStorage is empty or missing the auth token,
    // we can immediately assume unauthenticated to prevent flicker.
    // Replace 'sb-' with your actual prefix if known, or just check for common indicators.
    const hasSession = Object.keys(localStorage).some(key => key.includes('auth-token'));
    return hasSession ? null : false;
  });
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
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
    };
    
    checkAuth();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]); // Re-check on navigation

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
    // If not authenticated, redirect to login
    // Using replace: true so the "unauthorized" page isn't in history
    return <Navigate to={ROUTES.INDEX} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
