import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

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
