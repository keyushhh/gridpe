// MorePage Component
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import BottomNavigation from "@/components/BottomNavigation";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import gridpeLogo from "@/assets/gridpe-logo.svg";

// Assets
import iconBg from "@/assets/more-iconsbg.png";
import addressIcon from "@/assets/address.svg";
import helpIcon from "@/assets/help.svg";
import securityIcon from "@/assets/security.svg";
import subscriptionsIcon from "@/assets/subscriptions.svg";
import termsPrivacyIcon from "@/assets/terms-privacy.svg";
import logoutIcon from "@/assets/logout.svg";
import deleteAccIcon from "@/assets/delete-acc.svg";

interface MoreItemProps {
    icon: string;
    label: string;
    onClick: () => void;
}

const MoreItem = ({ icon, label, onClick }: MoreItemProps) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center group active:scale-95 transition-transform"
    >
        <div
            className="w-16 h-16 flex items-center justify-center relative mb-1"
            style={{
                backgroundImage: `url(${iconBg})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
            }}
        >
            <img src={icon} alt={label} className="w-6 h-6 object-contain" />
        </div>
        <span className="text-white font-medium text-[12px] leading-tight w-16 text-center font-satoshi">
            {label}
        </span>
    </button>
);

const MorePage = () => {
    const navigate = useNavigate();
    const { resetForDemo } = useUser();

    const handleLogout = async () => {
        resetForDemo();
        await supabase.auth.signOut();
        localStorage.clear();
        navigate("/");
    };

    const categories = [
        {
            title: "ACCOUNT",
            items: [
                { icon: addressIcon, label: "Saved Addresses", onClick: () => navigate("/saved-addresses") },
                { icon: helpIcon, label: "Help & Support", onClick: () => navigate("/help") },
                { icon: securityIcon, label: "Security Settings", onClick: () => navigate("/security-dashboard") },
                { icon: subscriptionsIcon, label: "Subscriptions", onClick: () => navigate("/subscription-details") },
            ],
        },
        {
            title: "LEGAL",
            items: [
                { icon: termsPrivacyIcon, label: "Terms & Conditions", onClick: () => navigate("/legal/terms", { state: { fromMore: true } }) },
                { icon: termsPrivacyIcon, label: "Privacy Policy", onClick: () => navigate("/legal/privacy", { state: { fromMore: true } }) },
            ],
        },
        {
            title: "APP PREFERENCES",
            items: [
                { icon: logoutIcon, label: "Logout", onClick: handleLogout },
                { icon: deleteAccIcon, label: "Delete Account", onClick: () => navigate("/delete-account", { state: { originPath: "/more" } }) },
            ],
        },
    ];

    return (
        <div
            className="absolute inset-0 flex flex-col overflow-y-auto overscroll-y-contain bg-[#0a0a12] scrollbar-hide"
            style={{
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="flex-1 px-5 pt-12 pb-[120px]">
                {/* Header */}
                <div className="mb-10">
                    <img src={gridpeLogo} alt="grid.pe" className="h-10 mb-2" />
                </div>

                {/* Categories */}
                <div className="flex flex-col gap-[66px]">
                    {categories.map((category) => (
                        <div key={category.title} className="flex flex-col">
                            <h2 className="text-white/40 font-medium text-[14px] tracking-wider mb-[18px] font-satoshi uppercase">
                                {category.title}
                            </h2>
                            <div className="flex flex-wrap gap-x-[26px] gap-y-6">
                                {category.items.map((item) => (
                                    <MoreItem
                                        key={item.label}
                                        icon={item.icon}
                                        label={item.label}
                                        onClick={item.onClick}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab="more" />
        </div>
    );
};

export default MorePage;
