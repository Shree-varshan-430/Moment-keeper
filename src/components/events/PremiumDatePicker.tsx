// ─── Premium Custom Date Picker Component ──────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { hapticService } from '@/services/hapticService';

interface PremiumDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const PremiumDatePicker: React.FC<PremiumDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current viewed month/year in the calendar calendar display
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  // Parse value to highlight selected day
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed month
        const d = parseInt(parts[2], 10);
        
        setSelectedYear(y);
        setSelectedMonth(m);
        setSelectedDay(d);

        // Sync view state to selected date if value changes
        setViewYear(y);
        setViewMonth(m);
      }
    } else {
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDay(null);
    }
  }, [value]);

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper date calculators
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigations
  const handlePrevMonth = () => {
    hapticService.lightImpact();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    hapticService.lightImpact();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number, month: number, year: number) => {
    hapticService.success();
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(dateString);
    setIsOpen(false);
  };

  // Generate Year Select values (100 years past, 15 years future)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 120 }, (_, i) => currentYear + 15 - i);

  // Format date display on input button
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = MONTH_NAMES[parseInt(parts[1], 10) - 1];
    const day = parseInt(parts[2], 10);
    return `${month} ${day}, ${year}`;
  };

  // Calendar cells calculation
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayOfMonth(viewYear, viewMonth);

  // Generate preceding empty/padded days from previous month
  const prevMonthIndex = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYearIndex = viewMonth === 0 ? viewYear - 1 : viewYear;
  const daysInPrevMonth = getDaysInMonth(prevYearIndex, prevMonthIndex);
  
  const calendarCells = [];
  
  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      month: prevMonthIndex,
      year: prevYearIndex
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      month: viewMonth,
      year: viewYear
    });
  }

  // Next month leading days padding to fill full grid rows (6 rows * 7 days = 42 cells)
  const totalCellsNeeded = 42;
  const nextMonthIndex = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYearIndex = viewMonth === 11 ? viewYear + 1 : viewYear;
  const remainingCells = totalCellsNeeded - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      month: nextMonthIndex,
      year: nextYearIndex
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/[0.02] border border-mk-glass-border hover:bg-white/5 hover:border-mk-silver/20 rounded-xl px-4 py-3 text-sm text-left text-mk-white font-medium flex items-center justify-between transition-all duration-200 outline-none focus:border-mk-silver/40"
      >
        <span className={value ? 'text-mk-white' : 'text-mk-silver'}>
          {value ? formatDateString(value) : 'Select Date...'}
        </span>
        <Calendar size={16} className="text-mk-silver shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-mk-dark border border-mk-glass-border shadow-silver rounded-2xl w-[320px] animate-fade-in left-0">
          {/* Header Month / Year drop selectors */}
          <div className="flex items-center justify-between gap-1 mb-4 border-b border-mk-glass-border/30 pb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-mk-glass-border text-mk-silver hover:text-mk-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => {
                  hapticService.lightImpact();
                  setViewMonth(parseInt(e.target.value, 10));
                }}
                className="bg-transparent text-xs font-bold text-mk-white outline-none cursor-pointer border border-mk-glass-border hover:border-mk-silver/30 px-2 py-1 rounded-lg bg-mk-dark"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index} className="bg-mk-dark text-mk-white text-xs">
                    {name.substring(0, 3)}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => {
                  hapticService.lightImpact();
                  setViewYear(parseInt(e.target.value, 10));
                }}
                className="bg-transparent text-xs font-bold text-mk-white outline-none cursor-pointer border border-mk-glass-border hover:border-mk-silver/30 px-2 py-1 rounded-lg bg-mk-dark w-20"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y} className="bg-mk-dark text-mk-white text-xs">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-mk-glass-border text-mk-silver hover:text-mk-white hover:bg-white/5 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Titles */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map(day => (
              <span key={day} className="text-[10px] font-bold text-mk-silver uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, index) => {
              const isSelected = selectedYear === cell.year && 
                                 selectedMonth === cell.month && 
                                 selectedDay === cell.day;
              
              const isToday = new Date().getFullYear() === cell.year &&
                              new Date().getMonth() === cell.month &&
                              new Date().getDate() === cell.day;

              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
                  type="button"
                  onClick={() => handleSelectDay(cell.day, cell.month, cell.year)}
                  className={`h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-silver border-none text-mk-black shadow-silver-sm scale-105'
                      : !cell.isCurrentMonth
                      ? 'text-mk-silver/30 hover:bg-white/[0.02] hover:text-mk-silver/50'
                      : isToday
                      ? 'border border-mk-silver/40 text-mk-white hover:bg-white/5'
                      : 'text-mk-white hover:bg-white/5 hover:text-mk-white'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
