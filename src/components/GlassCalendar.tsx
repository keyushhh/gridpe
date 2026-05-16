import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import {
  getDaysInMonth,
  startOfMonth,
  getDay,
  addMonths,
  subMonths,
  setYear,
  startOfDay,
  isBefore,
} from 'date-fns';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
interface GlassCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  onClose?: () => void;
  disableFutureDates?: boolean;
  disablePastDates?: boolean;
  className?: string;
}
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
// Generate years from 1920 to current year
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
function GlassCalendar({
  selected,
  onSelect,
  onClose,
  disableFutureDates = false,
  disablePastDates = false,
  className,
}: GlassCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selected || new Date());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const isDarkMode = useIsDarkMode();
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  // getDay returns 0 for Sunday, we need Monday as first day (0)
  const startDay = (getDay(firstDayOfMonth) + 6) % 7;
  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  const handleYearSelect = (selectedYear: number) => {
    setCurrentDate(setYear(currentDate, selectedYear));
    setShowYearDropdown(false);
  };
  const handleDayClick = (day: number) => {
    const newDate = new Date(year, month, day);
    // Check if future date is disabled
    if (disableFutureDates && newDate > today) {
      return;
    }
    // Check if past date is disabled
    if (disablePastDates && isBefore(newDate, startOfDay(today))) {
      return;
    }
    onSelect?.(newDate);
  };
  const isDisabledDate = (day: number) => {
    const date = new Date(year, month, day);
    if (disableFutureDates && date > today) return true;
    if (disablePastDates && isBefore(date, startOfDay(today))) return true;
    return false;
  };
  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year
    );
  };
  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  return (
    <div
      ref={calendarRef}
      className={cn(
        'w-[340px] rounded-[20px] p-3 relative overflow-hidden transition-all duration-300',
        isDarkMode ? 'backdrop-blur-[25.2px]' : '',
        className
      )}
      style={{
        backgroundImage: `url(${isDarkMode ? ASSETS.CALENDAR_BG : ASSETS.CALENDAR_OUTER_SHELL})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Inner content */}
      <div
        className="rounded-[16px] p-4 relative"
        style={{
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.20)' : 'transparent',
          backgroundImage: !isDarkMode ? `url(${ASSETS.CALENDAR_INNER_SHELL})` : 'none',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          border: !isDarkMode ? '1px solid rgba(255, 255, 255, 0.80)' : 'none',
        }}
      >
        {/* Header with Month/Year and Navigation */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          {/* Previous Month Button */}
          <button
            onClick={handlePrevMonth}
            className={cn(
              'w-10 h-10 rounded-[10px] backdrop-blur-sm border flex items-center justify-center transition-all active:scale-95',
              isDarkMode
                ? 'bg-white/10 border-white/20 hover:bg-white/20'
                : 'bg-brand-bg-light border-brand-border-light hover:bg-gray-100'
            )}
          >
            <ChevronLeft className={cn('w-5 h-5', isDarkMode ? 'text-white' : 'text-black')} />
          </button>
          {/* Month/Year Selector */}
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className={cn(
              'flex items-center gap-2 text-lg font-semibold hover:opacity-80 transition-opacity font-sans',
              isDarkMode ? 'text-white' : 'text-black'
            )}
          >
            <span>
              {MONTHS[month]} {year}
            </span>
            {showYearDropdown ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {/* Next Month Button */}
          <button
            onClick={handleNextMonth}
            className={cn(
              'w-10 h-10 rounded-[10px] backdrop-blur-sm border flex items-center justify-center transition-all active:scale-95',
              isDarkMode
                ? 'bg-white/10 border-white/20 hover:bg-white/20'
                : 'bg-brand-bg-light border-brand-border-light hover:bg-gray-100'
            )}
          >
            <ChevronRight className={cn('w-5 h-5', isDarkMode ? 'text-white' : 'text-black')} />
          </button>
        </div>
        {/* Year Dropdown */}
        {showYearDropdown && (
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 top-16 z-50 w-[160px] rounded-[16px] overflow-hidden',
              isDarkMode
                ? 'backdrop-blur-[25.2px]'
                : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-brand-border-light'
            )}
            style={
              isDarkMode
                ? {
                    backgroundColor: 'rgba(0, 0, 0, 0.70)',
                    backgroundImage: `url(${ASSETS.YEAR_DROPDOWN_BG})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}
            }
          >
            {/* Year header */}
            <div
              className={cn(
                'px-4 py-3 flex items-center justify-between border-b cursor-pointer',
                isDarkMode ? 'border-black/10' : 'border-brand-border-light'
              )}
              onClick={() => setShowYearDropdown(false)}
            >
              <span
                className={cn('text-lg font-semibold', isDarkMode ? 'text-white' : 'text-black')}
              >
                {year}
              </span>
              <ChevronUp className={cn('w-5 h-5', isDarkMode ? 'text-white' : 'text-black')} />
            </div>
            {/* Scrollable year list */}
            <ScrollArea className="h-[220px]">
              <div className="py-1">
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-lg font-medium transition-colors',
                      isDarkMode ? 'text-white' : 'text-black',
                      y === year
                        ? isDarkMode
                          ? 'bg-[rgba(0,0,0,0.49)]'
                          : 'bg-brand-primary text-white'
                        : isDarkMode
                          ? 'hover:bg-black/20'
                          : 'hover:bg-brand-bg-light'
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2 relative z-10">
          {DAYS.map(day => (
            <div
              key={day}
              className={cn(
                'h-8 flex items-center justify-center text-xs font-semibold font-sans',
                isDarkMode ? 'text-white/60' : 'text-black/40'
              )}
            >
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 relative z-10">
          {calendarDays.map((day, index) => (
            <div key={index} className="aspect-square flex items-center justify-center">
              {day !== null ? (
                <button
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabledDate(day)}
                  className={cn(
                    'w-10 h-10 rounded-[10px] flex items-center justify-center text-base font-semibold transition-all font-sans',
                    isDisabledDate(day)
                      ? isDarkMode
                        ? 'text-white/30'
                        : 'text-black/20'
                      : isDarkMode
                        ? 'text-white'
                        : 'text-black',
                    !isSelected(day) &&
                      !isDisabledDate(day) &&
                      (isDarkMode ? 'hover:bg-white/10' : 'hover:bg-brand-bg-light'),
                    !isDarkMode &&
                      isSelected(day) &&
                      'bg-brand-primary text-white shadow-[0_4px_12px_rgba(82,96,254,0.3)]'
                  )}
                  style={
                    isDarkMode && isSelected(day)
                      ? {
                          backgroundImage: `url(${ASSETS.CALENDAR_SELECTION})`,
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                        }
                      : undefined
                  }
                >
                  {day}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default GlassCalendar;
