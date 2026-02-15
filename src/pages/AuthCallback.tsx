import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@clerk/clerk-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    console.log("AuthCallback: Component mounted/updated", { isLoaded, isSignedIn });
    console.log("AuthCallback: URL Check", window.location.href);

    if (!isLoaded) {
      console.log("AuthCallback: Clerk is still loading...");
      return;
    }

    // Handle Clerk session
    if (isSignedIn) {
      console.log("AuthCallback: Clerk session DETECTED. Redirecting to onboarding for sync...");
      navigate("/");
      return;
    }

    console.log("AuthCallback: No Clerk session. Checking Supabase/Listening...");

    // Handle Supabase session
    const checkSupabase = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("AuthCallback: Supabase session check error", error);
      if (session) {
        console.log("AuthCallback: Supabase session DETECTED. Redirecting home...");
        navigate("/home");
        return true;
      }
      return false;
    };

    // 1. Listen for auth state changes (SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`AuthCallback: Supabase Auth Event: ${event}`, session ? "Session Exists" : "No Session");
      if (event === 'SIGNED_IN' && session) {
        navigate("/home");
      }
    });

    // 2. Initial check
    checkSupabase();

    // 3. Fallback timeout: If nothing happens after 6 seconds, assume failure
    const timeout = setTimeout(async () => {
      console.log("AuthCallback: 6s Timeout Reached. Final Check.");
      const hasSupabase = await checkSupabase();
      if (!hasSupabase && !isSignedIn) {
        console.log("AuthCallback: NO SESSIONS FOUND. Redirecting to onboarding...");
        navigate("/");
      }
    }, 6000);

    return () => {
      console.log("AuthCallback: Component unmounting/cleaning up");
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
