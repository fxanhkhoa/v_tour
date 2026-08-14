import React, { useState, useEffect, useRef } from 'react';
import { ScheduleSlot, TourBooking } from '../types';
import {
  isHourBlockedByBookings,
  validateSlotsAgainstBookings,
  normalizeToISODate,
  areIntervalsOverlapping,
  parseTimeToMinutes
} from '../lib/conflictCheck';

interface CalendarDragDropPickerProps {
  value: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
  existingBookings?: TourBooking[];
  language?: 'en' | 'vi';
}

// Utility functions for hours and minutes
export const formatHour12 = (hour: number): string => {
  if (hour === 0 || hour === 24) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
};

export const formatHour24 = (hour: number): string => {
  const h = hour % 24;
  return `${h < 10 ? '0' : ''}${h}:00`;
};

export const parseMinutesFromStr = (timeStr: string): number => {
  if (!timeStr) return 0;
  const lower = timeStr.toLowerCase().trim();
  const match = lower.match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];

  if (meridiem === 'pm' && h < 12) h += 12;
  if (meridiem === 'am' && h === 12) h = 0;

  return h * 60 + m;
};

export const formatMinutes12 = (totalMinutes: number): string => {
  const m = totalMinutes % 60;
  let h = Math.floor(totalMinutes / 60);
  if (h >= 24) h = h % 24;
  const isPm = h >= 12;
  const meridiem = isPm ? 'PM' : 'AM';

  let displayH = h % 12;
  if (displayH === 0) displayH = 12;

  const minStr = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${minStr} ${meridiem}`;
};

// Merges contiguous, overlapping, and duplicate schedule slots on each date
export const mergeScheduleSlots = (slots: ScheduleSlot[]): ScheduleSlot[] => {
  if (!slots || slots.length <= 1) return slots || [];

  // Group slots by normalized date string
  const groups: { [dateKey: string]: { dateStr: string; slots: ScheduleSlot[] } } = {};

  slots.forEach(slot => {
    if (!slot || !slot.dateStr) return;
    const normalizedDate = formatDisplayDate(slot.dateStr);
    if (!groups[normalizedDate]) {
      groups[normalizedDate] = {
        dateStr: slot.dateStr,
        slots: []
      };
    }
    groups[normalizedDate].slots.push(slot);
  });

  const mergedAll: ScheduleSlot[] = [];

  Object.keys(groups).forEach(dateKey => {
    const group = groups[dateKey];
    const rawSlots = group.slots;

    // Convert slots to intervals in minutes [start, end]
    const intervals: { start: number; end: number; sourceIds: string[] }[] = [];

    rawSlots.forEach(s => {
      let startM = parseMinutesFromStr(s.startTime);
      let endM = parseMinutesFromStr(s.endTime);

      if (endM <= startM) {
        if (endM === 0) endM = 1440;
        else endM += 1440;
      }

      intervals.push({
        start: startM,
        end: endM,
        sourceIds: s.id ? [s.id] : []
      });
    });

    // Sort intervals by start ascending, then end ascending
    intervals.sort((a, b) => a.start - b.start || a.end - b.end);

    const mergedIntervals: { start: number; end: number; sourceIds: string[] }[] = [];
    let current: { start: number; end: number; sourceIds: string[] } | null = null;

    intervals.forEach(inv => {
      if (!current) {
        current = { start: inv.start, end: inv.end, sourceIds: [...inv.sourceIds] };
      } else {
        // If overlapping or contiguous (e.g. 540 <= 540)
        if (inv.start <= current.end) {
          current.end = Math.max(current.end, inv.end);
          current.sourceIds.push(...inv.sourceIds);
        } else {
          mergedIntervals.push(current);
          current = { start: inv.start, end: inv.end, sourceIds: [...inv.sourceIds] };
        }
      }
    });

    if (current) {
      mergedIntervals.push(current);
    }

    // Convert merged intervals to ScheduleSlot
    mergedIntervals.forEach((inv, index) => {
      const startTime = formatMinutes12(inv.start);
      const endTime = formatMinutes12(inv.end);
      const displayDate = group.dateStr;
      const displayLabel = `${startTime} - ${endTime} on ${displayDate}`;
      const uniqueIds = Array.from(new Set(inv.sourceIds.filter(Boolean)));
      const id = uniqueIds.length === 1
        ? uniqueIds[0]
        : `slot_merged_${displayDate.replace(/[\/\-:]/g, '_')}_${inv.start}_${inv.end}_${index}`;

      mergedAll.push({
        id,
        dateStr: displayDate,
        startTime,
        endTime,
        displayLabel
      });
    });
  });

  return mergedAll;
};

// Convert ISO date string (YYYY-MM-DD) or DD/MM/YYYY into display DD/MM/YYYY format
const formatDisplayDate = (dateStr: string): string => {
  if (dateStr.includes('/')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
};

// Convert Date object to YYYY-MM-DD
const dateToISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert Date object to DD/MM/YYYY
const dateToSlash = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

// Get today's date normalized to 00:00:00
const getTodayDate = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getTodayISO = (): string => dateToISO(getTodayDate());

// Check if a date string (YYYY-MM-DD or DD/MM/YYYY) is strictly before today
const isPastDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  let y: number, m: number, d: number;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/').map(Number);
    d = parts[0];
    m = parts[1] - 1;
    y = parts[2];
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-').map(Number);
    y = parts[0];
    m = parts[1] - 1;
    d = parts[2];
  } else {
    return false;
  }
  const cellDate = new Date(y, m, d);
  return cellDate < getTodayDate();
};

// Check if a date string corresponds to Today
const isTodayDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  let y: number, m: number, d: number;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/').map(Number);
    d = parts[0];
    m = parts[1] - 1;
    y = parts[2];
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-').map(Number);
    y = parts[0];
    m = parts[1] - 1;
    d = parts[2];
  } else {
    return false;
  }
  const cellDate = new Date(y, m, d);
  return cellDate.getTime() === getTodayDate().getTime();
};

export const CalendarDragDropPicker: React.FC<CalendarDragDropPickerProps> = ({
  value = [],
  onChange,
  existingBookings = [],
  language = 'en'
}) => {
  const isVi = language === 'vi';

  // Hours displayed on vertical grid (6 AM to 10 PM)
  const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // [6, 7, ..., 21]

  // Default initial date: Today's date
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => getTodayDate());

  // Conflict warning banner state
  const [activeConflictBanner, setActiveConflictBanner] = useState<string | null>(null);
  const [manualConflictWarning, setManualConflictWarning] = useState<string | null>(null);

  // Compute 7-day columns based on currentStartDate
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentStartDate);
    d.setDate(currentStartDate.getDate() + i);
    return {
      dateObj: d,
      isoStr: dateToISO(d),
      slashStr: dateToSlash(d),
      dayName: d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      monthNum: d.getMonth() + 1,
      yearNum: d.getFullYear()
    };
  });

  // Drag selection state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragDateStr, setDragDateStr] = useState<string | null>(null);
  const [dragStartHour, setDragStartHour] = useState<number | null>(null);
  const [dragCurrentHour, setDragCurrentHour] = useState<number | null>(null);
  const [dragWasSaved, setDragWasSaved] = useState<boolean>(false);

  // Manual input state
  const [manualDate, setManualDate] = useState<string>(getTodayISO());
  const [manualStart, setManualStart] = useState<number>(8);
  const [manualEnd, setManualEnd] = useState<number>(10);

  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to check if a specific hour on a date is blocked by a confirmed booking
  const checkHourBlocked = (dateStr: string, hour: number) => {
    return isHourBlockedByBookings(dateStr, hour, existingBookings);
  };

  // Helper to compare dates in various formats (10/10/2026, 2026-10-10, etc.)
  const datesMatch = (d1: string, d2: string): boolean => {
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    const f1 = formatDisplayDate(d1);
    const f2 = formatDisplayDate(d2);
    if (f1 === f2) return true;

    const toIso = (s: string) => {
      if (s.includes('/')) {
        const [d, m, y] = s.split('/').map(Number);
        if (d && m && y) {
          return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }
      return s;
    };
    return toIso(d1) === toIso(d2);
  };

  const parseHourFromStr = (timeStr: string): number => {
    if (!timeStr) return 0;
    return Math.floor(parseMinutesFromStr(timeStr) / 60);
  };

  // Find saved slots covering a specific date and hour
  const getSavedSlotsForCell = (dateStr: string, hour: number) => {
    return (value || []).filter(slot => {
      if (!datesMatch(slot.dateStr, dateStr)) return false;
      const startH = parseHourFromStr(slot.startTime);
      const endH = parseHourFromStr(slot.endTime);
      return hour >= startH && hour < endH;
    });
  };

  const isCellInSavedSlot = (dateStr: string, hour: number) => {
    return getSavedSlotsForCell(dateStr, hour).length > 0;
  };

  // Remove a specific hour from slots on a date and re-merge
  const removeCellHour = (dateStr: string, hourToRemove: number) => {
    const otherDateSlots = (value || []).filter(s => !datesMatch(s.dateStr, dateStr));
    const sameDateSlots = (value || []).filter(s => datesMatch(s.dateStr, dateStr));

    const hourSegments: { start: number; end: number }[] = [];
    sameDateSlots.forEach(slot => {
      const startM = parseMinutesFromStr(slot.startTime);
      let endM = parseMinutesFromStr(slot.endTime);
      if (endM <= startM) endM = endM === 0 ? 1440 : endM + 1440;

      const startH = Math.floor(startM / 60);
      const endH = Math.ceil(endM / 60);

      for (let h = startH; h < endH; h++) {
        if (h !== hourToRemove) {
          hourSegments.push({ start: h * 60, end: (h + 1) * 60 });
        }
      }
    });

    const formattedDate = formatDisplayDate(dateStr);
    const newSlotsForDate: ScheduleSlot[] = hourSegments.map((seg, i) => ({
      id: `temp_${Date.now()}_${i}`,
      dateStr: formattedDate,
      startTime: formatMinutes12(seg.start),
      endTime: formatMinutes12(seg.end),
      displayLabel: `${formatMinutes12(seg.start)} - ${formatMinutes12(seg.end)} on ${formattedDate}`
    }));

    const mergedSameDate = mergeScheduleSlots(newSlotsForDate);
    onChange([...otherDateSlots, ...mergedSameDate]);
  };

  // Global mouseup event listener for drag completion or single-click toggle
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragDateStr && dragStartHour !== null && dragCurrentHour !== null) {
        if (dragStartHour === dragCurrentHour && dragWasSaved) {
          // Single click on a saved cell -> toggle off this hour & re-merge
          removeCellHour(dragDateStr, dragStartHour);
        } else {
          commitDragSelection(dragDateStr, dragStartHour, dragCurrentHour);
        }
      }
      setIsDragging(false);
      setDragDateStr(null);
      setDragStartHour(null);
      setDragCurrentHour(null);
      setDragWasSaved(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragDateStr, dragStartHour, dragCurrentHour, dragWasSaved, value]);

  const commitDragSelection = (dateStr: string, startH: number, currH: number) => {
    if (isPastDate(dateStr)) return;
    const minH = Math.min(startH, currH);
    const maxH = Math.max(startH, currH);

    // Filter out any hours that are blocked by confirmed bookings
    const validHourSegments: number[] = [];
    let hadBlockedHour = false;
    let blockedBookingTitle = '';

    for (let h = minH; h <= maxH; h++) {
      const block = checkHourBlocked(dateStr, h);
      if (block.isBlocked) {
        hadBlockedHour = true;
        blockedBookingTitle = block.booking?.tourTitle || 'Confirmed Tour';
      } else {
        validHourSegments.push(h);
      }
    }

    if (hadBlockedHour) {
      setActiveConflictBanner(
        isVi
          ? `⚠️ Khung giờ đã đặt trước (${blockedBookingTitle}) đã bị loại trừ khỏi vùng chọn.`
          : `⚠️ Existing booking (${blockedBookingTitle}) prevented selecting conflicting hours.`
      );
      setTimeout(() => setActiveConflictBanner(null), 5000);
    }

    if (validHourSegments.length === 0) {
      return; // All selected hours were blocked
    }

    // Group contiguous valid hours into schedule slots
    const formattedDate = formatDisplayDate(dateStr);
    const contiguousSlots: ScheduleSlot[] = [];
    let curStart = validHourSegments[0];
    let curEnd = validHourSegments[0];

    for (let i = 1; i < validHourSegments.length; i++) {
      const h = validHourSegments[i];
      if (h === curEnd + 1) {
        curEnd = h;
      } else {
        const startTime = formatHour12(curStart);
        const endTime = formatHour12(curEnd + 1);
        contiguousSlots.push({
          id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          dateStr: formattedDate,
          startTime,
          endTime,
          displayLabel: `${startTime} - ${endTime} on ${formattedDate}`
        });
        curStart = h;
        curEnd = h;
      }
    }

    const finalStart = formatHour12(curStart);
    const finalEnd = formatHour12(curEnd + 1);
    contiguousSlots.push({
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      dateStr: formattedDate,
      startTime: finalStart,
      endTime: finalEnd,
      displayLabel: `${finalStart} - ${finalEnd} on ${formattedDate}`
    });

    // Merge overlapping and contiguous slots automatically
    const merged = mergeScheduleSlots([...(value || []), ...contiguousSlots]);
    onChange(merged);
  };

  const handleCellMouseDown = (dateStr: string, hour: number) => {
    if (isPastDate(dateStr)) return;
    
    // Prevent selecting blocked hours
    const block = checkHourBlocked(dateStr, hour);
    if (block.isBlocked) {
      setActiveConflictBanner(
        isVi
          ? `⛔ Không thể chọn: Đã có tour "${block.booking?.tourTitle}" (${block.timeDisplay}) vào khung giờ này!`
          : `⛔ Cannot select: You already have booking "${block.booking?.tourTitle}" (${block.timeDisplay}) during this time!`
      );
      setTimeout(() => setActiveConflictBanner(null), 4500);
      return;
    }

    const saved = isCellInSavedSlot(dateStr, hour);
    setIsDragging(true);
    setDragWasSaved(saved);
    setDragDateStr(dateStr);
    setDragStartHour(hour);
    setDragCurrentHour(hour);
  };

  const handleCellMouseEnter = (dateStr: string, hour: number) => {
    if (isPastDate(dateStr)) return;
    if (isDragging && datesMatch(dragDateStr || '', dateStr)) {
      setDragCurrentHour(hour);
    }
  };

  const isCellInActiveDrag = (dateStr: string, hour: number) => {
    if (!isDragging || !dragDateStr || !datesMatch(dragDateStr, dateStr) || dragStartHour === null || dragCurrentHour === null) {
      return false;
    }
    const minH = Math.min(dragStartHour, dragCurrentHour);
    const maxH = Math.max(dragStartHour, dragCurrentHour);
    return hour >= minH && hour <= maxH;
  };

  const removeSlot = (slotId: string) => {
    onChange(value.filter(s => s.id !== slotId));
  };

  const clearAllSlots = () => {
    onChange([]);
  };

  // Quick preset loader
  const loadExamplePreset = () => {
    const slot1: ScheduleSlot = {
      id: `slot_preset_1`,
      dateStr: '10/10/2026',
      startTime: '8:00 AM',
      endTime: '10:00 AM',
      displayLabel: '8:00 AM - 10:00 AM on 10/10/2026'
    };
    const slot2: ScheduleSlot = {
      id: `slot_preset_2`,
      dateStr: '12/10/2026',
      startTime: '4:00 PM',
      endTime: '5:00 PM',
      displayLabel: '4:00 PM - 5:00 PM on 12/10/2026'
    };

    setCurrentStartDate(new Date(2026, 9, 8));
    onChange(mergeScheduleSlots([slot1, slot2]));
  };

  const handleManualAdd = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setManualConflictWarning(null);

    if (!manualDate || manualStart >= manualEnd) return;

    if (isPastDate(manualDate)) {
      setManualConflictWarning(isVi ? 'Không thể chọn ngày trong quá khứ!' : 'Cannot select a date in the past!');
      return;
    }

    const formattedDate = formatDisplayDate(manualDate);
    const startTime = formatHour12(manualStart);
    const endTime = formatHour12(manualEnd);

    const newSlot: ScheduleSlot = {
      id: `slot_manual_${Date.now()}`,
      dateStr: formattedDate,
      startTime,
      endTime,
      displayLabel: `${startTime} - ${endTime} on ${formattedDate}`
    };

    // Check conflict against existing confirmed bookings
    const conflictRes = validateSlotsAgainstBookings([newSlot], existingBookings, isVi ? 'vi' : 'en');
    if (conflictRes.hasConflict) {
      setManualConflictWarning(
        conflictRes.conflictDetails ||
        (isVi ? 'Khung giờ này trùng với lịch tour đã đặt trước!' : 'This time slot clashes with a confirmed tour booking!')
      );
      return;
    }

    const merged = mergeScheduleSlots([...(value || []), newSlot]);
    onChange(merged);
  };

  const navigateWeeks = (direction: number) => {
    const nextDate = new Date(currentStartDate);
    nextDate.setDate(nextDate.getDate() + direction * 7);
    setCurrentStartDate(nextDate);
  };

  const jumpToDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    if (y && m && d) {
      setCurrentStartDate(new Date(y, m - 1, d));
    }
  };

  return (
    <div className="space-y-4 bg-slate-900/90 text-slate-100 p-4 rounded-3xl border border-slate-800 shadow-xl" ref={containerRef}>
      {/* Conflict Warning Toast/Banner */}
      {activeConflictBanner && (
        <div className="p-3 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-rose-200 text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-rose-400 text-base">warning</span>
            <span>{activeConflictBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveConflictBanner(null)}
            className="text-rose-400 hover:text-white text-xs px-2 py-0.5 rounded-lg bg-rose-900/50 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-teal-400 text-lg">calendar_view_week</span>
            <h4 className="font-extrabold text-sm text-white">
              {isVi ? 'Lịch Rảnh & Khung Giờ Hoạt Động (Kéo Thả)' : 'Availability Calendar & Time Slots (Drag & Drop)'}
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isVi 
              ? 'Nhấp & kéo chuột trên khung giờ để chọn. Hệ thống tự động ngăn chặn trùng với lịch đặt tour đã xác nhận.' 
              : 'Click & drag across hour slots to select. Automatically blocks overlapping confirmed tour bookings.'}
          </p>
        </div>

        {/* Action Buttons & Presets */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={loadExamplePreset}
            className="px-2.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
            title="Load Example (Oct 10 & Oct 12, 2026)"
          >
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
            <span>{isVi ? '⚡ Nạp Mẫu 10/10 & 12/10' : '⚡ Example Preset (10/10 & 12/10)'}</span>
          </button>

          {value.length > 0 && (
            <button
              type="button"
              onClick={clearAllSlots}
              className="px-2 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer"
            >
              {isVi ? 'Xóa Tất Cả' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* Visual Legend */}
      <div className="flex items-center gap-3 text-[10px] text-slate-300 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800 flex-wrap">
        <span className="font-bold text-slate-400">{isVi ? 'Chú giải:' : 'Legend:'}</span>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
          <span>{isVi ? 'Khung giờ đã chọn' : 'Selected Slot'}</span>
        </div>
        {existingBookings.length > 0 && (
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block"></span>
            <span className="text-rose-300 font-bold">{isVi ? '⛔ Đã Đặt Tour (Bị khóa trùng lịch)' : '⛔ Confirmed Booking (Locked / Conflict)'}</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700 inline-block"></span>
          <span>{isVi ? 'Trống (Có thể chọn)' : 'Available'}</span>
        </div>
      </div>

      {/* Date Navigation Toolbar */}
      <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 text-xs gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigateWeeks(-1)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center"
            title="Previous Week"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentStartDate(getTodayDate())}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-extrabold text-[11px] cursor-pointer flex items-center space-x-1 shadow-sm transition-all"
            title={isVi ? 'Về Tuần Hiện Tại (Hôm Nay)' : 'Jump to Current Week (Today)'}
          >
            <span>⭐</span>
            <span>{isVi ? 'Hôm Nay' : 'Today'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigateWeeks(1)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center"
            title="Next Week"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <div className="text-slate-300 font-bold text-[11px] flex items-center space-x-2">
          <span>
            {days[0].dayName} {days[0].slashStr} - {days[6].dayName} {days[6].slashStr}
          </span>
          <input
            type="date"
            min={getTodayISO()}
            onChange={jumpToDateInput}
            value={dateToISO(currentStartDate)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Interactive Drag & Drop Grid */}
      <div className="overflow-x-auto select-none rounded-2xl border border-slate-800 bg-slate-950/80 p-2">
        <div className="min-w-[620px]">
          {/* Day Headers Row */}
          <div className="grid grid-cols-8 gap-1 mb-1 pb-2 border-b border-slate-800/80 text-center text-[11px]">
            <div className="text-slate-500 font-bold self-center">
              <span className="material-symbols-outlined text-xs">schedule</span>
            </div>
            {days.map((day) => {
              const daySlots = (value || []).filter(slot => datesMatch(slot.dateStr, day.slashStr));
              const hasSlots = daySlots.length > 0;
              const isPast = isPastDate(day.slashStr);
              const isToday = isTodayDate(day.slashStr);

              return (
                <div
                  key={day.isoStr}
                  className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center font-bold transition-all relative ${
                    isToday
                      ? 'bg-amber-500/20 text-amber-200 border-2 border-amber-400 shadow-lg ring-2 ring-amber-400/30'
                      : isPast
                      ? 'bg-slate-950/40 text-slate-600 border border-slate-900/60 opacity-50'
                      : hasSlots
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border border-slate-800/50'
                  }`}
                >
                  {isToday && (
                    <span className="mb-0.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full uppercase tracking-wider shadow flex items-center space-x-0.5 animate-pulse">
                      <span>⭐</span>
                      <span>{isVi ? 'HÔM NAY' : 'TODAY'}</span>
                    </span>
                  )}
                  <span className={`uppercase text-[9px] ${isToday ? 'text-amber-300 font-black' : 'text-slate-400'}`}>
                    {day.dayName}
                  </span>
                  <span className={`text-xs ${isToday ? 'text-amber-100 font-extrabold text-sm' : ''}`}>
                    {day.dateNum}/{day.monthNum}
                  </span>
                  {isPast ? (
                    <span className="text-[8px] bg-slate-900 text-slate-500 px-1 rounded-full font-mono mt-0.5 border border-slate-800">
                      {isVi ? 'Đã qua' : 'Past'}
                    </span>
                  ) : hasSlots ? (
                    <span key={`slot_badge_${day.isoStr}`} className="text-[8px] bg-teal-500/40 text-teal-200 px-1 rounded-full font-mono mt-0.5">
                      {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Hourly Grid Rows */}
          <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {HOURS.map((hour) => (
              <div key={`hour_row_${hour}`} className="grid grid-cols-8 gap-1 items-center">
                {/* Time label column */}
                <div className="text-[10px] font-mono text-slate-400 text-right pr-2 font-semibold">
                  {formatHour12(hour)}
                </div>

                {/* Day cells */}
                {days.map((day) => {
                  const blockInfo = checkHourBlocked(day.slashStr, hour);
                  const isBlocked = blockInfo.isBlocked;
                  const activeDrag = isCellInActiveDrag(day.slashStr, hour);
                  const isSaved = isCellInSavedSlot(day.slashStr, hour);
                  const isPast = isPastDate(day.slashStr);
                  const isToday = isTodayDate(day.slashStr);

                  return (
                    <div
                      key={`cell_${day.isoStr}_${hour}`}
                      onMouseDown={() => !isPast && handleCellMouseDown(day.slashStr, hour)}
                      onMouseEnter={() => !isPast && handleCellMouseEnter(day.slashStr, hour)}
                      className={`h-8 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all ${
                        isPast
                          ? 'bg-slate-950/30 border-slate-900/60 text-slate-700 cursor-not-allowed opacity-30 select-none'
                          : isBlocked
                          ? 'bg-rose-950/50 border-rose-600/70 text-rose-300 cursor-not-allowed shadow-inner select-none'
                          : activeDrag
                          ? 'bg-teal-500/50 border-teal-300 text-white shadow-lg scale-95 cursor-pointer'
                          : isSaved
                          ? 'bg-emerald-600/50 border-emerald-400 text-emerald-100 hover:bg-rose-600/60 hover:border-rose-400 hover:text-rose-100 group cursor-pointer'
                          : isToday
                          ? 'bg-slate-900/90 border-amber-500/40 text-amber-300/60 hover:bg-teal-950/40 hover:border-teal-700/60 hover:text-teal-400 cursor-pointer'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-600 hover:bg-teal-950/40 hover:border-teal-700/60 hover:text-teal-400 cursor-pointer'
                      }`}
                      title={
                        isPast
                          ? (isVi ? 'Không thể chọn ngày trong quá khứ' : 'Past date cannot be selected')
                          : isBlocked
                          ? `⛔ ${isVi ? 'Lịch đã có tour đặt' : 'Confirmed Booking'}: ${blockInfo.booking?.tourTitle} (${blockInfo.timeDisplay})`
                          : isSaved
                          ? `Click to remove slot (${day.slashStr} at ${formatHour12(hour)})`
                          : `Click or drag to select: ${day.slashStr} at ${formatHour12(hour)}`
                      }
                    >
                      {isPast ? (
                        <span key="icon_past" className="text-[10px] text-slate-800">🚫</span>
                      ) : isBlocked ? (
                        <span key="icon_blocked" className="flex items-center space-x-0.5 text-[8.5px] uppercase tracking-wider font-extrabold text-rose-300 px-0.5">
                          <span>⛔</span>
                          <span className="truncate max-w-[45px] sm:max-w-none">{isVi ? 'Đã Đặt' : 'Booked'}</span>
                        </span>
                      ) : activeDrag ? (
                        <span key="icon_drag" className="animate-pulse text-xs">✓</span>
                      ) : isSaved ? (
                        <span key="icon_saved" className="flex items-center space-x-0.5 text-[9px] uppercase tracking-wider font-extrabold">
                          <span className="group-hover:hidden">Bookable</span>
                          <span className="hidden group-hover:inline text-rose-200">Remove ✕</span>
                        </span>
                      ) : (
                        <span key="icon_empty" className="opacity-0 hover:opacity-100 text-[10px]">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Slot Addition Section */}
      <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold">
          <span className="material-symbols-outlined text-sm text-teal-400">edit_calendar</span>
          <span>{isVi ? 'Hoặc Thêm Khung Giờ Thủ Công' : 'Or Add Time Slot Manually'}</span>
        </div>

        {manualConflictWarning && (
          <div className="p-2.5 bg-rose-950/70 border border-rose-500/80 rounded-xl text-rose-200 text-xs font-semibold flex items-center space-x-2">
            <span className="material-symbols-outlined text-rose-400 text-sm flex-shrink-0">error</span>
            <span>{manualConflictWarning}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">{isVi ? 'Ngày' : 'Date'}</label>
            <input
              type="date"
              value={manualDate}
              min={getTodayISO()}
              onChange={(e) => {
                setManualDate(e.target.value);
                setManualConflictWarning(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">{isVi ? 'Giờ Bắt Đầu' : 'Start Time'}</label>
            <select
              value={manualStart}
              onChange={(e) => {
                setManualStart(Number(e.target.value));
                setManualConflictWarning(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {HOURS.map(h => (
                <option key={h} value={h}>{formatHour12(h)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">{isVi ? 'Giờ Kết Thúc' : 'End Time'}</label>
            <select
              value={manualEnd}
              onChange={(e) => {
                setManualEnd(Number(e.target.value));
                setManualConflictWarning(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {HOURS.concat([22, 23]).map(h => (
                <option key={h} value={h}>{formatHour12(h)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleManualAdd}
              className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center space-x-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>{isVi ? 'Thêm Khung Giờ' : 'Add Time Slot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Time Slots Display Badges */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1">
            <span className="material-symbols-outlined text-sm text-teal-400">event_available</span>
            <span>{isVi ? `Danh Sách Khung Giờ Đã Chọn (${(value || []).length})` : `Selected Schedule Slots (${(value || []).length})`}</span>
          </span>
        </div>

        {(value || []).length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-center">
            {isVi 
              ? 'Chưa chọn khung giờ nào. Kéo thả trên lịch hoặc nhấn nút Mẫu ở trên.' 
              : 'No time slots selected yet. Drag across the calendar or click Example Preset above.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(value || []).map((slot) => {
              const singleConflict = validateSlotsAgainstBookings([slot], existingBookings, isVi ? 'vi' : 'en');
              const hasConflict = singleConflict.hasConflict;

              return (
                <div
                  key={slot.id}
                  onClick={() => removeSlot(slot.id)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-sm animate-fadeIn cursor-pointer transition-all group ${
                    hasConflict
                      ? 'bg-rose-950/60 border-2 border-rose-500 text-rose-200 hover:bg-rose-900/80'
                      : 'bg-teal-500/20 border border-teal-500/40 text-teal-200 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-200'
                  }`}
                  title={
                    hasConflict
                      ? `⚠️ ${singleConflict.conflictDetails}`
                      : 'Click anywhere to remove slot'
                  }
                >
                  <span className={`material-symbols-outlined text-sm ${hasConflict ? 'text-rose-400' : 'text-teal-400 group-hover:text-rose-400'}`}>
                    {hasConflict ? 'warning' : 'schedule'}
                  </span>
                  <span>{slot.displayLabel || `${slot.startTime} - ${slot.endTime} on ${slot.dateStr}`}</span>
                  {hasConflict && (
                    <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] uppercase font-extrabold rounded-full">
                      {isVi ? 'Trùng lịch' : 'Conflict'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlot(slot.id);
                    }}
                    className={`${hasConflict ? 'text-rose-300' : 'text-teal-400 group-hover:text-rose-400'} transition-colors cursor-pointer ml-1 p-0.5 rounded-full hover:bg-rose-500/30`}
                    title="Remove slot"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
