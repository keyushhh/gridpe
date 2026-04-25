import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

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
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, [location.pathname]); // Re-check on navigation

  if (isAuthenticated === null) {
    // Show nothing or a loader while checking auth
    return null; 
  }

  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    // Using replace: true so the "unauthorized" page isn't in history
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
