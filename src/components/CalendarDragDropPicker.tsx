import React, { useState, useEffect, useRef } from 'react';
import { ScheduleSlot } from '../types';

interface CalendarDragDropPickerProps {
  value: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
  language?: 'en' | 'vi';
}

// Utility functions for hours
const formatHour12 = (hour: number): string => {
  if (hour === 0 || hour === 24) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
};

const formatHour24 = (hour: number): string => {
  const h = hour % 24;
  return `${h < 10 ? '0' : ''}${h}:00`;
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

export const CalendarDragDropPicker: React.FC<CalendarDragDropPickerProps> = ({
  value = [],
  onChange,
  language = 'en'
}) => {
  const isVi = language === 'vi';

  // Hours displayed on vertical grid (6 AM to 10 PM)
  const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // [6, 7, ..., 21]

  // Default initial date: Oct 10, 2026 for demonstration, or current date
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
    return new Date(2026, 9, 8); // October 8, 2026 (shows Oct 8 - Oct 14, 2026)
  });

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
  const [manualDate, setManualDate] = useState<string>('2026-10-10');
  const [manualStart, setManualStart] = useState<number>(8);
  const [manualEnd, setManualEnd] = useState<number>(10);

  const containerRef = useRef<HTMLDivElement>(null);

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
    const lower = timeStr.toLowerCase().trim();
    const match = lower.match(/(\d+):?(\d+)?\s*(am|pm)?/);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const isPm = match[3] === 'pm';
    const isAm = match[3] === 'am';
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h;
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

  // Global mouseup event listener for drag completion or single-click toggle
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragDateStr && dragStartHour !== null && dragCurrentHour !== null) {
        if (dragStartHour === dragCurrentHour && dragWasSaved) {
          // Single click on a saved cell -> REMOVE the saved slot(s) covering this cell
          const slotsToRemove = getSavedSlotsForCell(dragDateStr, dragStartHour);
          if (slotsToRemove.length > 0) {
            const removeIds = new Set(slotsToRemove.map(s => s.id));
            onChange((value || []).filter(s => !removeIds.has(s.id)));
          }
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
    const minH = Math.min(startH, currH);
    const maxH = Math.max(startH, currH);

    const startTime = formatHour12(minH);
    const endTime = formatHour12(maxH + 1);
    const formattedDate = formatDisplayDate(dateStr);

    const newSlot: ScheduleSlot = {
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      dateStr: formattedDate,
      startTime,
      endTime,
      displayLabel: `${startTime} - ${endTime} on ${formattedDate}`
    };

    // Avoid exact duplicate slots
    const exists = (value || []).some(
      s => datesMatch(s.dateStr, formattedDate) && s.startTime === startTime && s.endTime === endTime
    );

    if (!exists) {
      onChange([...(value || []), newSlot]);
    }
  };

  const handleCellMouseDown = (dateStr: string, hour: number) => {
    const saved = isCellInSavedSlot(dateStr, hour);
    setIsDragging(true);
    setDragWasSaved(saved);
    setDragDateStr(dateStr);
    setDragStartHour(hour);
    setDragCurrentHour(hour);
  };

  const handleCellMouseEnter = (dateStr: string, hour: number) => {
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

  // Quick preset loader matching example from user prompt:
  // 8AM to 10AM on 10/10/2026 and 4PM to 5PM on 12/10/2026
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

    // Jump view to Oct 8, 2026 so 10/10/2026 and 12/10/2026 are both visible in week grid
    setCurrentStartDate(new Date(2026, 9, 8));

    onChange([slot1, slot2]);
  };

  const handleManualAdd = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!manualDate || manualStart >= manualEnd) return;

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

    onChange([...value, newSlot]);
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
              ? 'Nhấp & kéo chuột trên khung giờ để chọn. Ví dụ: 8AM-10AM ngày 10/10/2026 & 4PM-5PM ngày 12/10/2026.' 
              : 'Click & drag across hour slots to select. Example: 8AM-10AM on 10/10/2026 & 4PM-5PM on 12/10/2026.'}
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

      {/* Date Navigation Toolbar */}
      <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 text-xs">
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
            onClick={() => setCurrentStartDate(new Date(2026, 9, 8))}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
          >
            {isVi ? 'Tháng 10/2026' : 'Oct 2026'}
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
              return (
                <div
                  key={day.isoStr}
                  className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center font-bold transition-all ${
                    hasSlots
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border border-slate-800/50'
                  }`}
                >
                  <span className="uppercase text-[9px] text-slate-400">{day.dayName}</span>
                  <span className="text-xs">{day.dateNum}/{day.monthNum}</span>
                  {hasSlots ? (
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
                  const activeDrag = isCellInActiveDrag(day.slashStr, hour);
                  const isSaved = isCellInSavedSlot(day.slashStr, hour);

                  return (
                    <div
                      key={`cell_${day.isoStr}_${hour}`}
                      onMouseDown={() => handleCellMouseDown(day.slashStr, hour)}
                      onMouseEnter={() => handleCellMouseEnter(day.slashStr, hour)}
                      className={`h-8 rounded-lg border text-[10px] font-bold flex items-center justify-center cursor-pointer transition-all ${
                        activeDrag
                          ? 'bg-teal-500/50 border-teal-300 text-white shadow-lg scale-95'
                          : isSaved
                          ? 'bg-emerald-600/50 border-emerald-400 text-emerald-100 hover:bg-rose-600/60 hover:border-rose-400 hover:text-rose-100 group'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-600 hover:bg-teal-950/40 hover:border-teal-700/60 hover:text-teal-400'
                      }`}
                      title={isSaved ? `Click to remove slot (${day.slashStr} at ${formatHour12(hour)})` : `Click or drag to select: ${day.slashStr} at ${formatHour12(hour)}`}
                    >
                      {activeDrag ? (
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">{isVi ? 'Ngày' : 'Date'}</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">{isVi ? 'Giờ Bắt Đầu' : 'Start Time'}</label>
            <select
              value={manualStart}
              onChange={(e) => setManualStart(Number(e.target.value))}
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
              onChange={(e) => setManualEnd(Number(e.target.value))}
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
            <span>{isVi ? `Danh Sách Khung Giờ Đã Chọn (${value.length})` : `Selected Schedule Slots (${value.length})`}</span>
          </span>
        </div>

        {value.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-center">
            {isVi 
              ? 'Chưa chọn khung giờ nào. Kéo thả trên lịch hoặc nhấn nút Mẫu ở trên.' 
              : 'No time slots selected yet. Drag across the calendar or click Example Preset above.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((slot) => (
              <div
                key={slot.id}
                onClick={() => removeSlot(slot.id)}
                className="px-3 py-1.5 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-200 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-200 text-xs font-bold flex items-center space-x-2 shadow-sm animate-fadeIn cursor-pointer transition-all group"
                title="Click anywhere to remove slot"
              >
                <span className="material-symbols-outlined text-sm text-teal-400 group-hover:text-rose-400">schedule</span>
                <span>{slot.displayLabel || `${slot.startTime} - ${slot.endTime} on ${slot.dateStr}`}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlot(slot.id);
                  }}
                  className="text-teal-400 group-hover:text-rose-400 transition-colors cursor-pointer ml-1 p-0.5 rounded-full hover:bg-rose-500/30"
                  title="Remove slot"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
