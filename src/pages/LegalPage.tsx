import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import tncBg from "@/assets/tnc-bg.png";
import tncAcceptedBg from "@/assets/tnc-accepted.png";

interface LegalContent {
    content: string;
    title: string;
    updatedAt: string;
}

const LegalPage = ({ type }: { type: "privacy" | "terms" }) => {
    const navigate = useNavigate();
    const [data, setData] = useState<LegalContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAccepted, setIsAccepted] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);
            const table = type === "privacy" ? "privacy_policies" : "terms_and_conditions";
            const title = type === "privacy" ? "Privacy Policy" : "Terms & Conditions";

            try {
                const { data: result, error: fetchError } = await supabase
                    .from(table)
                    .select("content, created_at")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (fetchError) {
                    console.error(`Error fetching ${type}:`, fetchError);
                    setError(`Failed to load ${title}. Please try again later.`);
                } else {
                    // Format date: 02 August, 2025
                    const date = new Date(result.created_at);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    });

                    setData({
                        content: result.content,
                        title: title,
                        updatedAt: formattedDate
                    });
                }
            } catch (err) {
                console.error("Unexpected error:", err);
                setError("An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [type]);

    const handleAccept = () => {
        if (type === "terms" && !isAccepted) {
            setIsAccepted(true);
        } else {
            navigate(-1);
        }
    };

    const handleDecline = () => {
        navigate(-1);
    };

    const isTnc = type === "terms";
    const containerBg = isTnc
        ? (isAccepted ? tncAcceptedBg : tncBg)
        : "rgba(255, 255, 255, 0.03)";

    const containerHeight = isTnc
        ? (isAccepted ? "678px" : "573px")
        : "auto";

    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom font-satoshi"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <div className="px-4 pt-12 relative flex items-center justify-center min-h-[64px]">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute left-4 w-[42px] h-[42px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-transform active:scale-95"
                >
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>
                <h1 className="text-foreground text-[18px] font-bold">
                    {type === "terms" ? "Terms & Conditions" : "Privacy Policy"}
                </h1>
            </div>

            {/* Hero Text */}
            <div className="px-4 mt-8 mb-6">
                <p className="text-muted-foreground text-[14px] leading-snug font-normal animate-fade-in" key={isAccepted ? "accepted" : "initial"}>
                    {isAccepted
                        ? "You’re all set — let’s make money moves."
                        : "Before we roll, take a minute to read and agree to the boring (but important) stuff."
                    }
                </p>
            </div>

            {/* Content Container */}
            <div className="px-4 flex-1 overflow-hidden flex flex-col mb-4">
                <div
                    className="flex-1 border border-white/10 rounded-[22px] overflow-hidden flex flex-col transition-all duration-300"
                    style={{
                        backgroundImage: isTnc ? `url(${containerBg})` : 'none',
                        backgroundColor: !isTnc ? "rgba(255, 255, 255, 0.03)" : "transparent",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        maxHeight: containerHeight !== "auto" ? containerHeight : "none",
                        height: containerHeight !== "auto" ? containerHeight : "100%"
                    }}
                >
                    <div className="px-4 pt-4 pb-4">
                        <h2 className="text-white text-[18px] font-bold">
                            Grid.Pe {type === "terms" ? "Terms & Conditions" : "Privacy Policy"}
                        </h2>
                        <p className="text-[#5260FE] text-[14px] mt-1 font-normal opacity-80" style={{ fontWeight: 400 }}>
                            Last Updated: {data?.updatedAt || "Loading..."}
                        </p>
                    </div>

                    <div className="px-4 pb-4 overflow-y-auto flex-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col gap-4 animate-pulse pt-4">
                                <div className="h-4 bg-white/10 rounded w-3/4" />
                                <div className="h-4 bg-white/10 rounded w-full" />
                                <div className="h-4 bg-white/10 rounded w-full" />
                                <div className="h-4 bg-white/10 rounded w-2/3" />
                                <div className="h-4 bg-white/10 rounded w-full" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 pt-4">
                                <p className="text-red-400 mb-4">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-link underline"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div
                                className="legal-prose text-white/80"
                                dangerouslySetInnerHTML={{ __html: data?.content || "" }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            {!isAccepted && (
                <div className="px-4 pb-8 pt-2 flex gap-4 animate-fade-in justify-center">
                    <Button
                        variant="outline"
                        className="w-[172px] h-[48px] rounded-full bg-white/5 border-white/10 text-white text-[16px] font-medium flex items-center justify-center transition-all"
                        onClick={handleDecline}
                    >
                        Decline
                    </Button>
                    <Button
                        variant="gradient"
                        className="w-[172px] h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center btn-gradient transition-all"
                        onClick={handleAccept}
                    >
                        Accept
                    </Button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        .legal-prose h1, .legal-prose h2, .legal-prose h3 {
          color: white;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          font-size: 14px; /* Satoshi Bold 14px */
        }
        .legal-prose h1:first-child, .legal-prose h2:first-child, .legal-prose h3:first-child {
          margin-top: 0;
        }
        .legal-prose p, .legal-prose li {
          font-weight: 300; /* Satoshi Light */
          font-size: 12px;
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }
        .legal-prose ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}} />
        </div>
    );
};

export default LegalPage;
