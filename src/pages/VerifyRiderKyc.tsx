import { useNavigate } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import warningBg from "@/assets/warning-background.png";
import checkIcon from "@/assets/check-icon.svg";

const VerifyRiderKyc = () => {
    const navigate = useNavigate();
    const [selectedOption, setSelectedOption] = useState<"yes" | "no">("yes");

    const handleConfirm = () => {
        if (selectedOption === "yes") {
            navigate("/kyc-report-success");
        } else {
            navigate("/kyc-report-error");
        }
    };

    return (
        <div
            className="fixed inset-0 w-full h-full flex flex-col bg-[#0a0a12] safe-area-top safe-area-bottom overflow-hidden"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${warningBg})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <div
                className="safe-area-top px-5 flex items-center justify-between"
                style={{ paddingTop: "24px" }}
            >
                <BackButton onClick={() => navigate(-1)} />


                <h1 className="text-white text-[24px] font-medium font-satoshi flex-1 text-center pr-10">
                    Rider KYC
                </h1>
            </div>

            <div className="px-5 flex flex-col items-center mt-[21px]">
                {/* Status Icon */}
                <div className="flex items-center justify-center mb-8">
                    <img src={checkIcon} alt="Checked" style={{ width: '62px', height: '62px' }} />
                </div>

                <h2 className="text-white text-[18px] font-bold font-satoshi text-center mb-[40px] leading-tight">
                    Let us know if this seems genuine
                </h2>

                {/* Selection Container */}
                <div
                    className="w-full rounded-[12px] overflow-hidden pt-[12px]"
                    style={{
                        height: "120px",
                        backgroundColor: "rgba(25, 25, 25, 0.31)",
                        backdropFilter: "blur(25.02px)",
                        border: "0.63px solid rgba(255, 255, 255, 0.12)",
                    }}
                >
                    <div className="px-[12px] mb-[8px]">
                        <p className="text-white text-[14px] font-medium font-satoshi">Does this KYC look correct?</p>
                    </div>

                    <div className="w-full border-b border-white/10" />

                    {/* Options */}
                    <div className="flex flex-col">
                        <label
                            className="flex items-center px-[12px] mt-[8px] cursor-pointer active:bg-white/5 transition-colors"
                            onClick={() => setSelectedOption("yes")}
                        >
                            <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedOption === "yes" ? "border-[#5260FE]" : "border-white/30"}`}
                            >
                                {selectedOption === "yes" && <div className="w-2 h-2 rounded-full bg-[#5260FE]" />}
                            </div>
                            <span className="ml-[14px] text-white text-[14px] font-normal font-satoshi">Yes, the rider is real and authentic.</span>
                        </label>

                        <div className="w-full border-b border-white/10 mt-[8px]" />

                        <label
                            className="flex items-center px-[12px] mt-[8px] cursor-pointer active:bg-white/5 transition-colors"
                            onClick={() => setSelectedOption("no")}
                        >
                            <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedOption === "no" ? "border-[#5260FE]" : "border-white/30"}`}
                            >
                                {selectedOption === "no" && <div className="w-2 h-2 rounded-full bg-[#5260FE]" />}
                            </div>
                            <span className="ml-[14px] text-white text-[14px] font-normal font-satoshi">No, something seems fishy.</span>
                        </label>
                    </div>
                </div>

                {/* Confirm Button */}
                <div className="w-full mt-[35px]">
                    <button
                        onClick={handleConfirm}
                        className="w-full h-[48px] rounded-full text-white text-[16px] font-medium bg-[#5260FE] active:scale-95 transition-all flex items-center justify-center"
                        style={{
                            boxShadow: "0px 4px 10px rgba(82, 96, 254, 0.3)"
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyRiderKyc;
