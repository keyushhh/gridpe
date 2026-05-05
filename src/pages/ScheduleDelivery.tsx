import React, {  useState, useEffect, useRef  } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import GlassCalendar from "@/components/GlassCalendar";
import timeIcon from "@/assets/time-icon.png";
import clockBase from "@/assets/clock-base.png";
import clockLight from "@/assets/Clock-Light.png";
import { SlideToPay } from "@/components/SlideToPay";

import { useTheme } from "next-themes";
import { useWebScroll } from "@/hooks/useWebScroll";

const ScheduleDelivery = () => {
  const { containerOverflow } = useWebScroll();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';
    const navigate = useNavigate();
    const location = useLocation();
    const { amount, isScheduledFlow } = location.state || {};
    
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Time state
    const [selectedTime, setSelectedTime] = useState("7:00 am");
    const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");
    const [isDragging, setIsDragging] = useState(false);

    // Time slots generation
    const generateTimeSlots = (currentMeridiem: string, extraTime?: string) => {
        const slots = [];

        // Operating Hours: 06:00 to 22:00
        for (let h = 0; h < 24; h++) {
            if (h < 6 || h > 22) continue; // 6am to 10pm

            const isPm = h >= 12;
            const m = isPm ? "PM" : "AM";

            if (m !== currentMeridiem) continue;

            let dispH = h > 12 ? h - 12 : h;
            if (dispH === 0) dispH = 12;

            for (let min = 0; min < 60; min += 30) {
                if (h === 22 && min > 0) continue;
                const dispMin = min === 0 ? "00" : min;
                slots.push(`${dispH}:${dispMin} ${m.toLowerCase()}`);
            }
        }

        // Inject extraTime if valid for this meridiem AND within operating hours
        if (extraTime && extraTime.toLowerCase().includes(currentMeridiem.toLowerCase()) && !slots.includes(extraTime)) {
            // Parse extraTime to check range
            const getMin = (t: string) => {
                const [timeStr, m] = t.split(' ');
                const parts = timeStr.split(':').map(Number);
                let h = parts[0];
                const min = parts[1];
                if (m.toLowerCase() === 'pm' && h !== 12) h += 12;
                if (m.toLowerCase() === 'am' && h === 12) h = 0;
                return h * 60 + min;
            };

            const extraMinutes = getMin(extraTime);
            const startLimit = 6 * 60; // 6:00 AM
            const endLimit = 22 * 60; // 10:00 PM

            if (extraMinutes >= startLimit && extraMinutes <= endLimit) {
                slots.push(extraTime);
                slots.sort((a, b) => getMin(a) - getMin(b));
            }
        }

        return slots;
    };

    const timeSlots = generateTimeSlots(meridiem, selectedTime);

    // Parse current selected time
    const getClockRotation = () => {
        const [timePart] = selectedTime.split(" ");
        const [hourStr, minStr] = timePart.split(":");
        const hour = parseInt(hourStr);
        const minute = parseInt(minStr);

        const hourRotation = ((hour % 12) + minute / 60) * 30;
        const minuteRotation = minute * 6;

        return { hourRotation, minuteRotation };
    };

    const { hourRotation, minuteRotation } = getClockRotation();

    // Scroll Sync
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            const index = timeSlots.indexOf(selectedTime);
            if (index !== -1) {
                const itemHeight = 28;
                const containerHeight = 111;
                const scrollTop = (index * itemHeight) - (containerHeight / 2) + (itemHeight / 2);

                scrollRef.current.scrollTo({
                    top: Math.max(0, scrollTop),
                    behavior: "smooth"
                });
            }
        }
    }, [selectedTime, meridiem, timeSlots]);

    // Clock Interaction
    const clockRef = useRef<HTMLDivElement>(null);

    const handleClockInteraction = (clientX: number, clientY: number) => {
        if (!clockRef.current) return;
        const rect = clockRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const radius = rect.width / 2;

        // Angle -> 0 at top
        let angleRad = Math.atan2(deltaY, deltaX) + Math.PI / 2;
        if (angleRad < 0) angleRad += 2 * Math.PI;
        const degrees = (angleRad * 180) / Math.PI;

        // Interaction Modes
        // < 60% radius = Hour interaction
        // > 60% radius = Minute interaction
        const isHourInteraction = distance < (radius * 0.6);

        const [timePart, mPart] = selectedTime.split(" ");
        const [currentHour, currentMin] = timePart.split(":").map(Number);
        let newHour = currentHour;
        let newMin = currentMin;

        if (isHourInteraction) {
            // Calculate Hour from degrees (360 / 12 = 30 deg per hour)
            let sector = Math.round(degrees / 30);
            if (sector === 0) sector = 12;
            newHour = sector;
        } else {
            // Minute interaction - Continuous (Smooth)
            // 360 deg = 60 min
            const rawMinutes = (degrees / 360) * 60;
            newMin = Math.round(rawMinutes) % 60;
        }

        const displayMin = newMin < 10 ? `0${newMin}` : newMin.toString();
        const newTime = `${newHour}:${displayMin} ${mPart}`;
        setSelectedTime(newTime);
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        handleClockInteraction(clientX, clientY);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        // Prevent default to avoid scrolling while dragging clock on touch devices
        // e.preventDefault(); // Can't easily preventDefault in React synthetic event here for passive listener issue

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        handleClockInteraction(clientX, clientY);
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    // Toggle AM/PM
    const handleMeridiemClick = (newM: "AM" | "PM") => {
        setMeridiem(newM);
        // Update selected time text to match new meridiem
        const [t] = selectedTime.split(' ');
        setSelectedTime(`${t} ${newM.toLowerCase()}`);
    };

    // Validation Logic
    const parseTimeMinutes = (t: string) => {
        const [timeStr, m] = t.split(' ');
        const parts = timeStr.split(':').map(Number);
        let h = parts[0];
        const min = parts[1];
        if (m.toLowerCase() === 'pm' && h !== 12) h += 12;
        if (m.toLowerCase() === 'am' && h === 12) h = 0;
        return h * 60 + min;
    };

    const currentTimeMinutes = parseTimeMinutes(selectedTime);
    const startLimit = 6 * 60; // 6:00 AM
    const endLimit = 22 * 60; // 10:00 PM

    const isInvalidTime = currentTimeMinutes < startLimit || currentTimeMinutes > endLimit;

    const handleConfirmSlot = () => {
        if (isInvalidTime) return;
        
        // Return to OrderCashSummary with the selected slot
        // Parse selectedTime and selectedDate into a single ISO string
        const [timeStr, mPart] = selectedTime.split(' ');
        const [hours, minutes] = timeStr.split(':').map(Number);
        let finalHours = hours;
        if (mPart.toLowerCase() === 'pm' && hours !== 12) finalHours += 12;
        if (mPart.toLowerCase() === 'am' && hours === 12) finalHours = 0;

        const scheduledDate = new Date(selectedDate);
        scheduledDate.setHours(finalHours, minutes, 0, 0);

        navigate('/order-cash-summary', {
            state: {
                amount,
                isScheduledFlow,
                selectedSlot: scheduledDate.toISOString()
            },
            replace: true
        });
    };

    return (
        <div
            className={`h-full w-full ${containerOverflow} flex flex-col font-sans safe-top safe-bottom relative`}
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
            onMouseUp={handleEnd}
            onTouchEnd={handleEnd}
            onMouseMove={handleMove}
            onTouchMove={handleMove}
        >
            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}

            {/* Header */}
            <div className="flex-none px-5 pt-4 flex items-center justify-between z-10 mb-6 font-sans">
                <BackButton onClick={() => navigate(-1)} />

                <h1 className={`text-[18px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Schedule Delivery
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 no-scrollbar pb-[280px] relative z-10">
                {/* Sub-header */}
                <div className="mb-6">
                    <p className={`text-[16px] font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Want more flexibility?
                    </p>
                    <p className={`text-[14px] font-normal leading-tight ${isDarkMode ? 'text-white/60' : 'text-black'}`}>
                        Schedule your delivery for later and pick a time-slot that suits you the best.
                    </p>
                </div>

                {/* Calendar */}
                <div className="mb-5 flex justify-center relative">
                    <GlassCalendar
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disablePastDates={true}
                        className={`w-full relative z-10 ${!isDarkMode ? '!bg-white/40 !backdrop-blur-md !border-white/40 !shadow-none' : ''}`}
                    />
                </div>

                {/* Time Selection Container */}
                <div
                    className={`w-full rounded-[24px] overflow-hidden backdrop-blur-[24px] border ${isDarkMode ? 'border-white/10' : 'border-[#E9EAEB]'}`}
                    style={{
                        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.30)" : "#FFFFFF",
                        paddingBottom: "24px"
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-2">
                            <img src={timeIcon} alt="Time" className={`w-[22px] h-[22px] ${!isDarkMode ? 'brightness-0' : ''}`} />
                            <span className={`text-[15px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Time</span>
                        </div>
                        <span className={`text-[15px] font-bold transition-colors duration-300 ${isInvalidTime ? (isDarkMode ? 'text-white/30' : 'text-black/30') : (isDarkMode ? 'text-white' : 'text-black')}`}>
                            {selectedTime}
                        </span>
                    </div>

                    {/* Inner Container: Clock + Picker */}
                    <div
                        className={`mx-5 rounded-[24px] overflow-hidden backdrop-blur-[24px] border relative transition-colors duration-300 ${isDarkMode ? 'border-white/10' : 'border-[#E6E8EB]'}`}
                        style={{
                            backgroundColor: isDarkMode ? "#0E0E0F" : "#FFFFFF", // Use white for light mode
                            height: "150px"
                        }}
                    >
                        {/* AM/PM Switch - Absolute Positioned Top Right */}
                        <div className="absolute top-[9px] right-[10px] flex flex-col items-center z-20">
                            <button
                                onClick={() => handleMeridiemClick("AM")}
                                className={`text-[12px] font-bold transition-opacity ${isDarkMode ? 'text-white' : 'text-black'} ${meridiem === "AM" ? "opacity-100" : "opacity-50"}`}
                            >
                                AM
                            </button>
                            <div className={`h-[1px] w-[30px] my-[4px] ${isDarkMode ? 'bg-[#2D2D30]' : 'bg-[#E6E8EB]'}`} />
                            <button
                                onClick={() => handleMeridiemClick("PM")}
                                className={`text-[12px] font-bold transition-opacity ${isDarkMode ? 'text-white' : 'text-black'} ${meridiem === "PM" ? "opacity-100" : "opacity-50"}`}
                            >
                                PM
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex items-center justify-between pl-8 pr-16 h-full">
                            {/* Clock Visual */}
                            <div
                                ref={clockRef}
                                className={`relative w-[120px] h-[120px] rounded-full shrink-0 cursor-pointer touch-none`}
                                style={{
                                    backgroundImage: `url(${isDarkMode ? clockBase : clockLight})`,
                                    backgroundSize: 'cover'
                                }}
                                onMouseDown={handleStart}
                                onTouchStart={handleStart}
                            >
                                {/* Pivot */}
                                <div className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 shadow-sm ${isDarkMode ? 'bg-white' : 'bg-black opacity-100'}`} />

                                {/* Hour Hand */}
                                <div
                                    className={`absolute left-1/2 bottom-1/2 w-[2.5px] rounded-full origin-bottom z-10 transition-transform duration-100 ease-out ${isDarkMode ? 'bg-white' : 'bg-black opacity-100'}`}
                                    style={{
                                        height: '18.5px',
                                        transform: `translateX(-50%) rotate(${hourRotation}deg)`
                                    }}
                                />

                                {/* Minute Hand */}
                                <div
                                    className={`absolute left-1/2 bottom-1/2 w-[1.5px] rounded-full origin-bottom z-10 transition-transform duration-100 ease-out ${isDarkMode ? 'bg-white' : 'bg-black opacity-100'}`}
                                    style={{
                                        height: '34px',
                                        transform: `translateX(-50%) rotate(${minuteRotation}deg)`
                                    }}
                                />
                            </div>

                            {/* Time List Container */}
                            <div className="relative h-[111px] w-[90px] shrink-0">
                                {/* Top Fade */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-[30px] z-10 pointer-events-none"
                                    style={{
                                        background: isDarkMode
                                            ? 'linear-gradient(180deg, #0E0E0F 0%, rgba(14, 14, 15, 0) 100%)'
                                            : 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)'
                                    }}
                                />

                                {/* List */}
                                <div
                                    className="h-full overflow-y-auto no-scrollbar flex flex-col gap-[4px] py-[10px]"
                                    ref={scrollRef}
                                >
                                    {timeSlots.map((time) => {
                                        const isSelected = time === selectedTime;
                                        return (
                                            <div
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`flex-none text-center cursor-pointer whitespace-nowrap transition-all duration-200 text-[16px] font-bold font-sans ${isSelected ? (isDarkMode ? 'text-white' : 'text-black') : (isDarkMode ? 'text-white/40' : 'text-black/40')}`}
                                            >
                                                {time}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Fade */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[30px] z-10 pointer-events-none"
                                    style={{
                                        background: isDarkMode
                                            ? 'linear-gradient(0deg, #0E0E0F 0%, rgba(14, 14, 15, 0) 100%)'
                                            : 'linear-gradient(0deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invalid Time Message */}
                    {isInvalidTime && (
                        <div className="px-5 pt-2 text-center animate-fade-in">
                            <p className="text-[#FF3B30] text-[13px] font-medium">
                                Hey man, even we need rest and sleep!
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="mt-6 text-left px-1">
                    <p className={`text-[14px] font-medium font-sans leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Note: We'll do our best to deliver at your selected time. Actual timing may vary slightly based on rider availability.
                    </p>
                </div>
            </div>

            {/* Slide to Pay Bottom Sheet */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
                style={{
                    height: "255px",
                    backgroundColor: isDarkMode ? "rgba(23, 23, 23, 0.31)" : "#FFFFFF",
                    borderTopLeftRadius: "32px",
                    borderTopRightRadius: "32px",
                    paddingTop: "26px",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                    paddingBottom: "54px",
                    backdropFilter: isDarkMode ? "blur(24px)" : "blur(25px)",
                    WebkitBackdropFilter: isDarkMode ? "blur(24px)" : "blur(25px)",
                    borderTop: isDarkMode ? "none" : "1px solid #E9EAEB",
                    borderLeft: isDarkMode ? "none" : "1px solid #E9EAEB",
                    borderRight: isDarkMode ? "none" : "1px solid #E9EAEB",
                }}
            >
                <p className={`text-[18px] font-bold font-sans mb-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Amount will be held from wallet
                </p>
                <p className={`text-[16px] font-medium font-sans mb-[34px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    You won’t be charged unless the delivery is completed.
                </p>
                <SlideToPay 
                    onComplete={handleConfirmSlot} 
                    disabled={isInvalidTime}
                    label={isScheduledFlow ? "Confirm Slot" : "Slide to Pay"}
                />
            </div>
        </div>
    );
};

export default ScheduleDelivery;
