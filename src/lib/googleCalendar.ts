// Google Calendar & iCal Utilities for Guide and Traveler Tour Events

export interface CalendarEventPayload {
  title: string;
  description?: string;
  location?: string;
  dateStr?: string; // YYYY-MM-DD
  timeRangeStr?: string; // e.g. "08:30 AM - 02:30 PM" or "Morning Slot"
  startTimeStr?: string; // e.g. "08:30" or "08:30 AM"
  endTimeStr?: string; // e.g. "14:30" or "02:30 PM"
  durationHours?: number;
  partnerName?: string;
  partnerRole?: 'guide' | 'traveler';
  priceUSD?: number;
  pinCode?: string;
  bookingId?: string;
}

// Convert time string (e.g. "08:30 AM", "2:30 PM", "08:30") to 24h { hours: number, minutes: number }
export function parseTimeString(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim().toLowerCase();

  const match12 = trimmed.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3];

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  // Common keywords fallback
  if (trimmed.includes('morning')) return { hours: 8, minutes: 30 };
  if (trimmed.includes('afternoon')) return { hours: 14, minutes: 0 };
  if (trimmed.includes('evening') || trimmed.includes('sunset')) return { hours: 17, minutes: 30 };
  if (trimmed.includes('night')) return { hours: 19, minutes: 0 };

  return null;
}

// Parse start and end times from slot/range strings like "08:30 AM - 02:30 PM" or "8:00 - 12:00"
export function parseStartEndTime(
  dateIso: string,
  timeRangeStr?: string,
  startTimeStr?: string,
  endTimeStr?: string,
  defaultDurationHours: number = 4
): { startDate: Date; endDate: Date } {
  // Base date
  const parts = dateIso.split('-');
  const year = parts.length === 3 ? parseInt(parts[0], 10) : 2026;
  const month = parts.length === 3 ? parseInt(parts[1], 10) - 1 : 7;
  const day = parts.length === 3 ? parseInt(parts[2], 10) : 18;

  let startH = 9;
  let startM = 0;
  let endH = startH + defaultDurationHours;
  let endM = 0;

  if (startTimeStr && endTimeStr) {
    const s = parseTimeString(startTimeStr);
    const e = parseTimeString(endTimeStr);
    if (s) { startH = s.hours; startM = s.minutes; }
    if (e) { endH = e.hours; endM = e.minutes; }
  } else if (timeRangeStr) {
    const rangeParts = timeRangeStr.split(/[-–—to]/i);
    if (rangeParts.length >= 2) {
      const s = parseTimeString(rangeParts[0]);
      const e = parseTimeString(rangeParts[1]);
      if (s) { startH = s.hours; startM = s.minutes; }
      if (e) { endH = e.hours; endM = e.minutes; }
    } else {
      const s = parseTimeString(timeRangeStr);
      if (s) {
        startH = s.hours;
        startM = s.minutes;
        endH = startH + defaultDurationHours;
      }
    }
  }

  const startDate = new Date(year, month, day, startH, startM, 0);
  const endDate = new Date(year, month, day, endH, endM, 0);

  // If end date is earlier or same as start date, push end date
  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setTime(startDate.getTime() + defaultDurationHours * 3600 * 1000);
  }

  return { startDate, endDate };
}

// Format a Date object to Google Calendar UTC ISO string: YYYYMMDDTHHmmssZ
export function formatToGoogleCalendarIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const date = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${date}T${h}${min}${s}Z`;
}

// Format a Date object to YYYYMMDD for all-day events
export function formatToAllDayIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const date = pad(d.getDate());
  return `${y}${m}${date}`;
}

// Generate Google Calendar direct intent URL
export function buildGoogleCalendarUrl(payload: CalendarEventPayload): string {
  const dateIso = payload.dateStr || '2026-08-18';
  const { startDate, endDate } = parseStartEndTime(
    dateIso,
    payload.timeRangeStr,
    payload.startTimeStr,
    payload.endTimeStr,
    payload.durationHours || 4
  );

  const datesParam = `${formatToGoogleCalendarIso(startDate)}/${formatToGoogleCalendarIso(endDate)}`;

  // Construct structured description
  const descLines = [
    `🇻🇳 ${payload.title}`,
    payload.partnerName ? `👤 ${payload.partnerRole === 'guide' ? 'Licensed Tour Guide' : 'Traveler'}: ${payload.partnerName}` : '',
    payload.priceUSD ? `💵 Total Price: $${payload.priceUSD} USD (Secured in Escrow)` : '',
    payload.pinCode ? `🛡️ Safety Match PIN: ${payload.pinCode}` : '',
    payload.location ? `📍 Pickup Location: ${payload.location}` : '',
    payload.bookingId ? `🔖 Booking Reference: #${payload.bookingId.toUpperCase()}` : '',
    '',
    payload.description ? `📝 Tour Details:\n${payload.description}` : '',
    '',
    '🛡️ Vietnam Local Tour Guide & Traveler Network — Escrow Protection Active'
  ].filter(Boolean);

  const fullDescription = descLines.join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.title || 'Vietnam Guided Tour Experience',
    dates: datesParam,
    details: fullDescription,
    location: payload.location || 'Vietnam'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate standard .ICS (iCalendar) content
export function generateIcsContent(payload: CalendarEventPayload): string {
  const dateIso = payload.dateStr || '2026-08-18';
  const { startDate, endDate } = parseStartEndTime(
    dateIso,
    payload.timeRangeStr,
    payload.startTimeStr,
    payload.endTimeStr,
    payload.durationHours || 4
  );

  const dtStamp = formatToGoogleCalendarIso(new Date());
  const dtStart = formatToGoogleCalendarIso(startDate);
  const dtEnd = formatToGoogleCalendarIso(endDate);
  const uid = `tour-${payload.bookingId || Date.now()}@vietnamguides.app`;

  const escapeIcs = (str: string) => str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const summary = escapeIcs(payload.title || 'Vietnam Guided Tour');
  const location = escapeIcs(payload.location || 'Vietnam');
  const description = escapeIcs(
    `Tour: ${payload.title}\n` +
    (payload.partnerName ? `Partner: ${payload.partnerName}\n` : '') +
    (payload.priceUSD ? `Price: $${payload.priceUSD} USD\n` : '') +
    (payload.pinCode ? `Safety PIN: ${payload.pinCode}\n` : '') +
    (payload.description ? `Notes: ${payload.description}\n` : '')
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vietnam Local Tour Guides//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// Download .ics file in browser
export function downloadIcsFile(payload: CalendarEventPayload, filename?: string): void {
  const icsData = generateIcsContent(payload);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `${(payload.title || 'tour-event').toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
