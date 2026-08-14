import { TourBooking, ScheduleSlot } from '../types';

/**
 * Normalizes any date string (ISO YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, with or without time prefixes) into YYYY-MM-DD.
 */
export const normalizeToISODate = (dateInput?: string): string | null => {
  if (!dateInput || typeof dateInput !== 'string') return null;
  const trimmed = dateInput.trim();

  // Match YYYY-MM-DD (e.g. 2026-08-16)
  const matchISO = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (matchISO) {
    return `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`;
  }

  // Match DD/MM/YYYY or D/M/YYYY (e.g. 16/08/2026, 16/8/2026)
  const matchSlash = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchSlash) {
    const day = matchSlash[1].padStart(2, '0');
    const month = matchSlash[2].padStart(2, '0');
    const year = matchSlash[3];
    return `${year}-${month}-${day}`;
  }

  // Match DD-MM-YYYY
  const matchDash = trimmed.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (matchDash) {
    const day = matchDash[1].padStart(2, '0');
    const month = matchDash[2].padStart(2, '0');
    const year = matchDash[3];
    return `${year}-${month}-${day}`;
  }

  // Relative keywords
  const lower = trimmed.toLowerCase();
  const now = new Date();

  if (lower.includes('today')) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (lower.includes('tomorrow')) {
    const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const y = tom.getFullYear();
    const m = String(tom.getMonth() + 1).padStart(2, '0');
    const d = String(tom.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback to Date object parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return null;
};

/**
 * Parses time string like "6:00 AM", "10:00 PM", "08:00", "14:00", "8:00 AM", "2:00 PM" into minutes from midnight (0 - 1440).
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const lower = timeStr.toLowerCase().trim();

  // Try 12-hour AM/PM e.g. "8:00 AM", "08:00 PM", "8 AM", "2:30pm", "2pm"
  const match12 = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] ? parseInt(match12[2], 10) : 0;
    const isPm = match12[3].toLowerCase() === 'pm';
    const isAm = match12[3].toLowerCase() === 'am';

    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h * 60 + m;
  }

  // Try 24-hour e.g. "08:00", "14:00", "08:30"
  const match24 = lower.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    return (h % 24) * 60 + m;
  }

  // Single hour number
  const matchSingleH = lower.match(/^\s*(\d{1,2})\s*$/);
  if (matchSingleH) {
    const h = parseInt(matchSingleH[1], 10);
    return (h % 24) * 60;
  }

  return 0;
};

/**
 * Checks if two minute intervals [startA, endA] and [startB, endB] overlap.
 */
export const areIntervalsOverlapping = (startA: number, endA: number, startB: number, endB: number): boolean => {
  const normEndA = endA <= startA ? endA + 1440 : endA;
  const normEndB = endB <= startB ? endB + 1440 : endB;
  return Math.max(startA, startB) < Math.min(normEndA, normEndB);
};

export interface BookingTimeWindow {
  booking: TourBooking;
  dateIso: string;
  startMinutes: number;
  endMinutes: number;
  timeDisplay: string;
}

/**
 * Extracts normalized date and minute range from a TourBooking object.
 */
export const extractBookingTimeWindow = (booking: TourBooking): BookingTimeWindow | null => {
  if (!booking || booking.status === 'cancelled') return null;

  const rawScheduled = booking.scheduledTime || '';
  const dateIso = normalizeToISODate(rawScheduled) || normalizeToISODate(booking.createdAt);
  if (!dateIso) return null;

  let startMinutes = 8 * 60; // default 08:00 AM (480)
  let endMinutes = 14 * 60;  // default 02:00 PM (840)
  let timeDisplay = rawScheduled || '08:00 AM - 02:00 PM';

  // Clean time string: remove dates like YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
  const timeOnly = rawScheduled
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '')
    .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, '')
    .replace(/[()]/g, ' ')
    .trim();

  // Pattern: "08:00 AM - 02:00 PM", "8:00 AM - 2:00 PM", "08:00 - 14:00", etc.
  const rangeMatch = timeOnly.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|—|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (rangeMatch) {
    const startM = parseTimeToMinutes(rangeMatch[1]);
    let endM = parseTimeToMinutes(rangeMatch[2]);
    if (endM > 0 && startM >= 0) {
      if (endM <= startM) endM += 1440;
      startMinutes = startM;
      endMinutes = endM;
      timeDisplay = `${rangeMatch[1].trim()} - ${rangeMatch[2].trim()}`;
    }
  } else {
    // Check for single time like "at 09:00 AM" or "09:00 AM"
    const singleMatch = timeOnly.match(/(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (singleMatch && singleMatch[1]) {
      const parsedStart = parseTimeToMinutes(singleMatch[1]);
      if (parsedStart > 0) {
        startMinutes = parsedStart;
        const durationHours = 4;
        endMinutes = startMinutes + durationHours * 60;
        timeDisplay = `${singleMatch[1].trim()} (+${durationHours}h)`;
      }
    }
  }

  return {
    booking,
    dateIso,
    startMinutes,
    endMinutes,
    timeDisplay
  };
};

/**
 * Checks if a specific cell hour on a date is blocked by any confirmed tour booking.
 */
export const isHourBlockedByBookings = (
  dateInput: string,
  hour: number,
  bookings?: TourBooking[]
): { isBlocked: boolean; booking?: TourBooking; timeDisplay?: string } => {
  if (!bookings || bookings.length === 0) return { isBlocked: false };

  const cellDateIso = normalizeToISODate(dateInput);
  if (!cellDateIso) return { isBlocked: false };

  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;

  for (const b of bookings) {
    // Only check active or confirmed bookings
    if (b.status === 'cancelled') continue;
    const window = extractBookingTimeWindow(b);
    if (!window) continue;

    if (window.dateIso === cellDateIso) {
      if (areIntervalsOverlapping(hourStart, hourEnd, window.startMinutes, window.endMinutes)) {
        return {
          isBlocked: true,
          booking: b,
          timeDisplay: window.timeDisplay
        };
      }
    }
  }

  return { isBlocked: false };
};

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingSlot?: ScheduleSlot;
  conflictingBooking?: TourBooking;
  conflictDetails?: string;
}

/**
 * Validates a list of schedule slots against confirmed tour bookings to detect any overlap conflicts.
 */
export const validateSlotsAgainstBookings = (
  slots: ScheduleSlot[],
  bookings?: TourBooking[],
  language: 'en' | 'vi' = 'en'
): ConflictCheckResult => {
  if (!slots || slots.length === 0 || !bookings || bookings.length === 0) {
    return { hasConflict: false };
  }

  for (const slot of slots) {
    const slotDateIso = normalizeToISODate(slot.dateStr);
    if (!slotDateIso) continue;

    let slotStartM = parseTimeToMinutes(slot.startTime);
    let slotEndM = parseTimeToMinutes(slot.endTime);
    if (slotEndM <= slotStartM) {
      slotEndM = slotEndM === 0 ? 1440 : slotEndM + 1440;
    }

    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      const bWindow = extractBookingTimeWindow(b);
      if (!bWindow) continue;

      if (bWindow.dateIso === slotDateIso) {
        if (areIntervalsOverlapping(slotStartM, slotEndM, bWindow.startMinutes, bWindow.endMinutes)) {
          const detail = language === 'vi'
            ? `Trùng lịch vào ngày ${slotDateIso}: Khung giờ yêu cầu "${slot.startTime} - ${slot.endTime}" xung đột với tour đã đặt "${b.tourTitle}" (${bWindow.timeDisplay}).`
            : `Schedule conflict on ${slotDateIso}: Your requested time "${slot.startTime} - ${slot.endTime}" overlaps with confirmed booking "${b.tourTitle}" (${bWindow.timeDisplay}).`;

          return {
            hasConflict: true,
            conflictingSlot: slot,
            conflictingBooking: b,
            conflictDetails: detail
          };
        }
      }
    }
  }

  return { hasConflict: false };
};
