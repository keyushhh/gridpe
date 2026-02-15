import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@clerk/clerk-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Handle Clerk session
    if (isSignedIn) {
      console.log("Clerk session detected, redirecting to onboarding for sync...");
      navigate("/");
      return;
    }

    // Handle Supabase session
    const checkSupabase = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Supabase session detected, redirecting home...");
        navigate("/home");
        return true;
      }
      return false;
    };

    // 1. Listen for auth state changes (SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/home");
      }
    });

    // 2. Initial check
    checkSupabase();

    // 3. Fallback timeout: If nothing happens after 6 seconds, assume failure
    const timeout = setTimeout(async () => {
      const hasSupabase = await checkSupabase();
      if (!hasSupabase && !isSignedIn) {
        console.log("No auth session found after timeout, redirecting to onboarding...");
        navigate("/");
      }
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, isLoaded, isSignedIn]);



  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <p>Completing sign in...</p>
    </div>
  );
};

export default AuthCallback;
