import React, { useState, useMemo } from 'react';
import { TourBooking, NegotiationOffer, TravelerPostRequest, User } from '../types';
import { Language } from '../lib/translations';
import { TourBookingHubModal } from './TourBookingHubModal';
import { AddToGoogleCalendarButton } from './AddToGoogleCalendarButton';
import { CalendarEventPayload, buildGoogleCalendarUrl, downloadIcsFile } from '../lib/googleCalendar';
import { formatLanguageWithFlag } from '../lib/languages';

export interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // e.g. 15 Oct 2026
  timeDisplay?: string;
  type: 'accepted' | 'negotiating';
  category: 'booking' | 'negotiation' | 'post';
  statusLabel: string;
  priceUSD: number;
  partnerName: string;
  partnerAvatar?: string;
  location?: string;
  groupSize?: number;
  originalObject: TourBooking | NegotiationOffer | TravelerPostRequest;
}

interface PortalEventsCalendarProps {
  userRole: 'guide' | 'traveler';
  currentUser?: User | null;
  bookings?: TourBooking[];
  negotiations?: NegotiationOffer[];
  posts?: TravelerPostRequest[];
  onOpenNegotiationModal?: (negotiation: NegotiationOffer) => void;
  onOpenBookingDetail?: (booking: TourBooking) => void;
  onOpenPostDetail?: (post: TravelerPostRequest) => void;
  onRespondNegotiation?: (offerId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number, message?: string, senderRole?: 'traveler' | 'guide') => void;
  onUpdateStatus?: (bookingId: string, status: 'matched' | 'en_route' | 'in_progress' | 'completed') => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  language?: Language;
}

// Convert any date string (ISO, slash format YYYY-MM-DD, DD/MM/YYYY, relative terms) to YYYY-MM-DD
export const normalizeToISODate = (dateInput?: string): string | null => {
  if (!dateInput || typeof dateInput !== 'string') return null;
  const trimmed = dateInput.trim();
  
  // YYYY-MM-DD format (with optional time or trailing text)
  const matchISO = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (matchISO) {
    return `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`;
  }

  // DD/MM/YYYY format
  const matchSlash = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchSlash) {
    const day = matchSlash[1].padStart(2, '0');
    const month = matchSlash[2].padStart(2, '0');
    const year = matchSlash[3];
    return `${year}-${month}-${day}`;
  }

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

  const matchInDays = lower.match(/in\s+(\d+)\s+day/);
  if (matchInDays) {
    const daysOffset = parseInt(matchInDays[1], 10) || 1;
    const future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset);
    const y = future.getFullYear();
    const m = String(future.getMonth() + 1).padStart(2, '0');
    const d = String(future.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (lower.includes('next month')) {
    const future = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const y = future.getFullYear();
    const m = String(future.getMonth() + 1).padStart(2, '0');
    const d = String(future.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback to JS Date parse
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
};

// Format YYYY-MM-DD to readable string
const formatReadableDate = (isoStr: string, lang: string = 'en'): string => {
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const [y, m, d] = parts.map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (lang === 'vi') {
    return `Ngày ${d} tháng ${m}, ${y}`;
  }
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const PortalEventsCalendar: React.FC<PortalEventsCalendarProps> = ({
  userRole,
  currentUser,
  bookings = [],
  negotiations = [],
  posts = [],
  onOpenNegotiationModal,
  onOpenBookingDetail,
  onOpenPostDetail,
  onUpdateStatus,
  onConfirmCompletion,
  language = 'en'
}) => {
  // Calendar View Month state
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'accepted' | 'negotiating'>('all');
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [activeModalEvent, setActiveModalEvent] = useState<CalendarEvent | null>(null);

  // Compile all calendar events with strict deduplication
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    const processedBookingIds = new Set<string>();
    const processedBookingPostIds = new Set<string>();
    const processedBookingNegIds = new Set<string>();
    const processedBookingKeys = new Set<string>();
    const processedAcceptedNegPostIds = new Set<string>();
    const processedNegotiatingPostIds = new Set<string>();

    // 1. Process Bookings (Accepted / Confirmed Events)
    (bookings || []).forEach(b => {
      if (b.status === 'cancelled') return;
      
      const matchingPost = b.postId ? (posts || []).find(p => String(p.id) === String(b.postId)) : null;
      const matchingNeg = b.negotiationId ? (negotiations || []).find(n => String(n.id) === String(b.negotiationId)) : null;

      const isoDate = normalizeToISODate(b.scheduledTime) || 
                      normalizeToISODate(matchingNeg?.selectedSlot?.dateStr) ||
                      normalizeToISODate((matchingNeg as any)?.preferredDate) ||
                      normalizeToISODate(matchingPost?.preferredDate) ||
                      normalizeToISODate(matchingPost?.scheduleSlots?.[0]?.dateStr) ||
                      (b.createdAt && !b.createdAt.includes('T') ? normalizeToISODate(b.createdAt) : null) ||
                      '2026-08-18';

      processedBookingIds.add(String(b.id));
      if (b.postId) processedBookingPostIds.add(String(b.postId));
      if (b.negotiationId) processedBookingNegIds.add(String(b.negotiationId));
      if (b.guideId && b.travelerId) {
        processedBookingKeys.add(`${b.guideId}_${b.travelerId}_${isoDate}_${b.totalPriceUSD}`);
      }
      if (b.travelerName) {
        processedBookingKeys.add(`${b.travelerName.toLowerCase().trim()}_${isoDate}_${b.totalPriceUSD}`);
      }

      let cleanTime = b.scheduledTime || '08:30 AM - 02:30 PM (Morning Slot)';
      if (cleanTime.includes('As Agreed')) {
        cleanTime = '08:30 AM - 02:30 PM (Morning Slot)';
      }

      events.push({
        id: `booking-${b.id}`,
        title: b.tourTitle || (language === 'vi' ? 'Lịch đặt Tour' : 'Tour Booking'),
        dateStr: isoDate,
        displayDate: formatReadableDate(isoDate, language),
        timeDisplay: cleanTime,
        type: 'accepted',
        category: 'booking',
        statusLabel: language === 'vi' ? 'Đã xác nhận (Accepted)' : 'Accepted Booking',
        priceUSD: b.totalPriceUSD || 0,
        partnerName: userRole === 'guide' ? b.travelerName : b.guideName,
        partnerAvatar: userRole === 'guide' ? b.travelerAvatar : b.guideAvatar,
        location: b.pickupLocation || (language === 'vi' ? 'Điểm hẹn tour' : 'Tour Pickup Location'),
        groupSize: b.groupSize,
        originalObject: b
      });
    });

    // 2. Process Negotiations
    (negotiations || []).forEach(n => {
      if (n.status === 'declined') return;

      const isAccepted = n.status === 'accepted';
      const eventType: 'accepted' | 'negotiating' = isAccepted ? 'accepted' : 'negotiating';
      
      const matchingPost = n.postId ? (posts || []).find(p => String(p.id) === String(n.postId)) : null;

      const isoDate = normalizeToISODate(n.selectedSlot?.dateStr) || 
                      normalizeToISODate((n as any).preferredDate) ||
                      normalizeToISODate(matchingPost?.preferredDate) ||
                      normalizeToISODate(matchingPost?.scheduleSlots?.[0]?.dateStr) ||
                      normalizeToISODate(n.scheduledTime) ||
                      (n.createdAt && !n.createdAt.includes('T') ? normalizeToISODate(n.createdAt) : null) ||
                      '2026-08-18';

      // Avoid duplicating if booking already created or if this is already handled by a booking
      const matchesExistingBooking = 
        processedBookingNegIds.has(String(n.id)) ||
        (n.postId && processedBookingPostIds.has(String(n.postId))) ||
        (n.guideId && n.travelerId && processedBookingKeys.has(`${n.guideId}_${n.travelerId}_${isoDate}_${n.offeredPriceUSD}`)) ||
        (n.travelerName && processedBookingKeys.has(`${n.travelerName.toLowerCase().trim()}_${isoDate}_${n.offeredPriceUSD}`)) ||
        (bookings || []).some(b => b.negotiationId === n.id || (b.postId && b.postId === n.postId));

      if (matchesExistingBooking) {
        // Already rendered as a confirmed booking in calendar, strictly suppress duplicate
        return;
      }

      if (isAccepted) {
        if (n.postId) processedAcceptedNegPostIds.add(String(n.postId));
      } else {
        if (n.postId) processedNegotiatingPostIds.add(String(n.postId));
      }

      let timeDisplay = (language === 'vi' ? 'Khung giờ thỏa thuận' : 'Flexible / Agreed Slot');
      if (n.selectedSlot && n.selectedSlot.startTime && n.selectedSlot.endTime) {
        timeDisplay = `${n.selectedSlot.startTime} - ${n.selectedSlot.endTime}`;
      } else if (matchingPost?.scheduleSlots?.[0]) {
        timeDisplay = `${matchingPost.scheduleSlots[0].startTime} - ${matchingPost.scheduleSlots[0].endTime}`;
      }

      events.push({
        id: `negotiation-${n.id}`,
        title: n.tourTitle || (language === 'vi' ? 'Thương lượng giá Tour' : 'Custom Tour Negotiation'),
        dateStr: isoDate,
        displayDate: formatReadableDate(isoDate, language),
        timeDisplay: timeDisplay,
        type: eventType,
        category: 'negotiation',
        statusLabel: isAccepted 
          ? (language === 'vi' ? 'Đã chấp nhận (Accepted)' : 'Accepted Proposal')
          : (language === 'vi' ? 'Đang thương lượng' : 'In Negotiation'),
        priceUSD: n.offeredPriceUSD || 0,
        partnerName: userRole === 'guide' ? n.travelerName : n.guideName,
        partnerAvatar: userRole === 'guide' ? undefined : n.guideAvatar,
        groupSize: n.groupSize,
        originalObject: n
      });
    });

    // 3. Process Traveler Posts (if open or negotiating)
    (posts || []).forEach(p => {
      if (p.status === 'closed') return;
      if (processedBookingPostIds.has(String(p.id)) || processedAcceptedNegPostIds.has(String(p.id))) return;
      if (p.status === 'booked') return;
      if (processedNegotiatingPostIds.has(String(p.id))) return;

      const isoDate = normalizeToISODate(p.preferredDate) || 
                      normalizeToISODate(p.scheduleSlots?.[0]?.dateStr) || 
                      (p.createdAt && !p.createdAt.includes('T') ? normalizeToISODate(p.createdAt) : null) || 
                      '2026-08-18';
      const isBooked = p.status === 'booked';

      events.push({
        id: `post-${p.id}`,
        title: p.title || (language === 'vi' ? 'Yêu cầu tìm HDV' : 'Traveler Tour Request'),
        dateStr: isoDate,
        displayDate: formatReadableDate(isoDate, language),
        timeDisplay: `${p.durationHours} ${language === 'vi' ? 'Giờ' : 'Hours'}`,
        type: isBooked ? 'accepted' : 'negotiating',
        category: 'post',
        statusLabel: isBooked
          ? (language === 'vi' ? 'Đã chốt tour (Booked)' : 'Booked Post')
          : (language === 'vi' ? 'Đang nhận báo giá' : 'Open for Bids'),
        priceUSD: p.maxBudgetUSD || 0,
        partnerName: p.travelerName || 'Traveler',
        partnerAvatar: p.travelerAvatar,
        location: p.city,
        groupSize: p.groupSize,
        originalObject: p
      });
    });

    // 4. Final Deduplication Gate: ensure unique event keys
    const seenEventKeys = new Set<string>();
    const deduplicatedEvents: CalendarEvent[] = [];

    for (const evt of events) {
      const compoundKey = `${evt.dateStr}_${evt.partnerName}_${evt.priceUSD}_${evt.type}_${evt.category === 'booking' ? 'booking' : evt.id}`;
      if (!seenEventKeys.has(compoundKey)) {
        seenEventKeys.add(compoundKey);
        deduplicatedEvents.push(evt);
      }
    }

    return deduplicatedEvents;
  }, [bookings, negotiations, posts, userRole, language]);

  // Filter events by selected type filter
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'accepted') return calendarEvents.filter(e => e.type === 'accepted');
    if (selectedFilter === 'negotiating') return calendarEvents.filter(e => e.type === 'negotiating');
    return calendarEvents;
  }, [calendarEvents, selectedFilter]);

  // Map events by dateStr YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach(e => {
      const list = map.get(e.dateStr) || [];
      list.push(e);
      map.set(e.dateStr, list);
    });
    return map;
  }, [filteredEvents]);

  // Calendar days grid generation
  const calendarMonthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Starting day of week (Monday = 0 ... Sunday = 6)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday = 6

    const daysInMonth = lastDayOfMonth.getDate();

    const gridCells: {
      dateObj: Date;
      isoDate: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Today's date ISO
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      gridCells.push({
        dateObj: d,
        isoDate: iso,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: iso === todayIso
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      gridCells.push({
        dateObj: d,
        isoDate: iso,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: iso === todayIso
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remainingCells = 42 - gridCells.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      gridCells.push({
        dateObj: d,
        isoDate: iso,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: iso === todayIso
      });
    }

    return gridCells;
  }, [currentDate]);

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDateIso(todayIso);
  };

  const selectedDayEvents = selectedDateIso ? (eventsByDate.get(selectedDateIso) || []) : [];

  const monthYearLabel = currentDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  const weekDayHeaders = language === 'vi'
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const acceptedCount = calendarEvents.filter(e => e.type === 'accepted').length;
  const negotiatingCount = calendarEvents.filter(e => e.type === 'negotiating').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-4 sm:p-6 space-y-6">
      
      {/* Calendar Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-teal-600 text-2xl">calendar_month</span>
            <h3 className="text-xl font-extrabold text-slate-900 capitalize">
              {monthYearLabel}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'vi' 
              ? 'Lịch tổng hợp các sự kiện đã chốt và đang thương lượng giá.'
              : 'Overview calendar showing all accepted tours and active negotiating offers.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Add Next Confirmed Event to Google Calendar if any confirmed event exists */}
          {(() => {
            const nextAcceptedEvent = calendarEvents.find(e => e.type === 'accepted');
            if (!nextAcceptedEvent) return null;
            return (
              <AddToGoogleCalendarButton
                payload={{
                  title: nextAcceptedEvent.title,
                  dateStr: nextAcceptedEvent.dateStr,
                  timeRangeStr: nextAcceptedEvent.timeDisplay,
                  partnerName: nextAcceptedEvent.partnerName,
                  partnerRole: userRole === 'guide' ? 'traveler' : 'guide',
                  priceUSD: nextAcceptedEvent.priceUSD,
                  location: nextAcceptedEvent.location || 'Vietnam',
                  bookingId: nextAcceptedEvent.id
                }}
                variant="outline"
                size="sm"
                language={language}
              />
            );
          })()}

          {/* Today Button */}
          <button
            onClick={handleGoToday}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
          >
            <span className="material-symbols-outlined text-sm">today</span>
            <span>{language === 'vi' ? 'Hôm nay' : 'Today'}</span>
          </button>

          {/* Month Steppers */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
              title="Next Month"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Badges & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
        
        {/* Filter Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-500 text-[11px] mr-1">
            {language === 'vi' ? 'Lọc sự kiện:' : 'Filter Events:'}
          </span>

          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {language === 'vi' ? `Tất cả (${calendarEvents.length})` : `All (${calendarEvents.length})`}
          </button>

          <button
            onClick={() => setSelectedFilter('accepted')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedFilter === 'accepted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>{language === 'vi' ? `Đã xác nhận (${acceptedCount})` : `Accepted (${acceptedCount})`}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('negotiating')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedFilter === 'negotiating'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <span>{language === 'vi' ? `Đang thương lượng (${negotiatingCount})` : `Negotiating (${negotiatingCount})`}</span>
          </button>
        </div>

        {/* Color Legend */}
        <div className="flex items-center space-x-4 text-[11px] font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 border border-emerald-600 inline-block shadow-xs"></span>
            <span className="text-emerald-950 font-extrabold">{language === 'vi' ? 'Đã xác nhận' : 'Accepted Event'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500 border border-amber-600 inline-block shadow-xs"></span>
            <span className="text-amber-950 font-extrabold">{language === 'vi' ? 'Đang thương lượng' : 'Negotiating Event'}</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100/50">
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-900 text-white text-center py-2.5 text-xs font-black uppercase tracking-wider">
          {weekDayHeaders.map((header) => (
            <div key={header} className="py-0.5">
              {header}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {calendarMonthGrid.map((cell) => {
            const dayEvents = eventsByDate.get(cell.isoDate) || [];
            const isSelected = selectedDateIso === cell.isoDate;

            return (
              <div
                key={cell.isoDate}
                onClick={() => setSelectedDateIso(cell.isoDate)}
                className={`min-h-[96px] sm:min-h-[110px] p-1.5 sm:p-2 bg-white transition-all cursor-pointer relative flex flex-col justify-between group ${
                  !cell.isCurrentMonth ? 'opacity-40 bg-slate-50/70' : 'hover:bg-teal-50/30'
                } ${isSelected ? 'ring-2 ring-teal-600 ring-inset bg-teal-50/40' : ''}`}
              >
                {/* Top cell bar */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-teal-600 text-white shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Pills list inside cell */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalEvent(evt);
                      }}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold truncate border shadow-xs transition-transform hover:scale-[1.02] cursor-pointer flex items-center space-x-1 ${
                        evt.type === 'accepted'
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                          : 'bg-amber-100 text-amber-950 border-amber-300'
                      }`}
                      title={`${evt.title} - $${evt.priceUSD}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${evt.type === 'accepted' ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}

                  {dayEvents.length > 2 && (
                    <p className="text-[10px] font-extrabold text-teal-700 hover:text-teal-800 pl-0.5">
                      +{dayEvents.length - 2} {language === 'vi' ? 'sự kiện' : 'more'}
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Event List Details */}
      {selectedDateIso && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <span className="material-symbols-outlined text-teal-600 text-lg">event_available</span>
              <span>
                {language === 'vi' ? 'Sự kiện ngày:' : 'Events on:'} {formatReadableDate(selectedDateIso, language)}
              </span>
            </h4>

            <button
              onClick={() => setSelectedDateIso(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              {language === 'vi' ? 'Không có sự kiện nào trong ngày này.' : 'No events scheduled for this selected date.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setActiveModalEvent(evt)}
                  className={`p-3.5 rounded-2xl border bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                    evt.type === 'accepted' ? 'border-emerald-300/80 hover:border-emerald-500' : 'border-amber-300/80 hover:border-amber-500'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                        evt.type === 'accepted'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {evt.type === 'accepted' ? '🟢 Accepted' : '🟡 Negotiating'}
                      </span>

                      <span className="font-extrabold text-slate-900 text-xs">
                        ${evt.priceUSD} USD
                      </span>
                    </div>

                    <h5 className="font-extrabold text-slate-900 text-xs line-clamp-1">{evt.title}</h5>
                    <p className="text-[11px] text-slate-600">
                      👤 {userRole === 'guide' ? 'Traveler:' : 'Guide:'} <span className="font-bold text-slate-800">{evt.partnerName}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ⏰ {evt.timeDisplay} {evt.location ? `• 📍 ${evt.location}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 pt-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (evt.category === 'negotiation' && onOpenNegotiationModal) {
                          onOpenNegotiationModal(evt.originalObject as NegotiationOffer);
                        } else if (evt.category === 'booking' && onOpenBookingDetail) {
                          onOpenBookingDetail(evt.originalObject as TourBooking);
                        } else if (evt.category === 'post' && onOpenPostDetail) {
                          onOpenPostDetail(evt.originalObject as TravelerPostRequest);
                        } else {
                          setActiveModalEvent(evt);
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        evt.type === 'accepted'
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {language === 'vi' ? 'Chi tiết' : 'Details'}
                    </button>

                    {evt.type === 'accepted' && (
                      <AddToGoogleCalendarButton
                        payload={{
                          title: evt.title,
                          dateStr: evt.dateStr,
                          timeRangeStr: evt.timeDisplay,
                          partnerName: evt.partnerName,
                          partnerRole: userRole === 'guide' ? 'traveler' : 'guide',
                          priceUSD: evt.priceUSD,
                          location: evt.location || 'Vietnam',
                          bookingId: evt.id
                        }}
                        variant="outline"
                        size="sm"
                        dropdownPlacement="top"
                        language={language}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Event Inspection Modal */}
      {activeModalEvent && activeModalEvent.category === 'booking' && (
        <TourBookingHubModal
          isOpen={true}
          onClose={() => setActiveModalEvent(null)}
          booking={activeModalEvent.originalObject as TourBooking}
          allBookings={bookings && bookings.length > 0 ? bookings : [activeModalEvent.originalObject as TourBooking]}
          currentUserRole={userRole}
          currentUser={currentUser || ({ id: userRole === 'guide' ? 'u_guide_1' : 'u_traveler_1', name: userRole === 'guide' ? 'Local Guide' : 'Traveler', role: userRole } as any)}
          onUpdateStatus={onUpdateStatus}
          onConfirmCompletion={onConfirmCompletion}
          language={language}
        />
      )}

      {activeModalEvent && activeModalEvent.category === 'negotiation' && activeModalEvent.type === 'accepted' && (
        <TourBookingHubModal
          isOpen={true}
          onClose={() => setActiveModalEvent(null)}
          booking={
            (bookings || []).find(b => b.negotiationId === (activeModalEvent.originalObject as NegotiationOffer).id) || {
              id: 'bk_' + activeModalEvent.id,
              bookingType: 'negotiated_post',
              travelerId: (activeModalEvent.originalObject as NegotiationOffer).travelerId,
              travelerName: (activeModalEvent.originalObject as NegotiationOffer).travelerName,
              travelerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
              guideId: (activeModalEvent.originalObject as NegotiationOffer).guideId,
              guideName: (activeModalEvent.originalObject as NegotiationOffer).guideName,
              guideAvatar: (activeModalEvent.originalObject as NegotiationOffer).guideAvatar,
              guidePhone: '+84 908 123 456',
              tourTitle: activeModalEvent.title,
              pickupLocation: 'Traveler Hotel / Agreed Meeting Point',
              transportMode: 'scooter',
              groupSize: (activeModalEvent.originalObject as NegotiationOffer).groupSize || 1,
              totalPriceUSD: activeModalEvent.priceUSD,
              scheduledTime: activeModalEvent.timeDisplay,
              status: 'matched',
              createdAt: new Date().toISOString(),
              pinCode: '8492',
              paymentStatus: 'held_in_escrow'
            }
          }
          allBookings={bookings && bookings.length > 0 ? bookings : []}
          currentUserRole={userRole}
          currentUser={currentUser || ({ id: userRole === 'guide' ? 'u_guide_1' : 'u_traveler_1', name: userRole === 'guide' ? 'Local Guide' : 'Traveler', role: userRole } as any)}
          onUpdateStatus={onUpdateStatus}
          onConfirmCompletion={onConfirmCompletion}
          language={language}
        />
      )}

      {activeModalEvent && activeModalEvent.category === 'negotiation' && activeModalEvent.type === 'negotiating' && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-4 my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 text-white flex items-center justify-between bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-2xl">hourglass_top</span>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {language === 'vi' ? 'Sự Kiện Đang Thương Lượng' : 'Active Negotiation Proposal'}
                  </h3>
                  <p className="text-[11px] text-slate-200">
                    {activeModalEvent.displayDate}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalEvent(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Details */}
            <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1 overscroll-contain">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">{language === 'vi' ? 'Tên sự kiện:' : 'Event Title:'}</span>
                  <span className="font-extrabold text-slate-900 text-sm">{activeModalEvent.title}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">{language === 'vi' ? 'Giá đề xuất hiện tại:' : 'Current Offer Price:'}</span>
                  <span className="font-black text-amber-600 text-sm">${activeModalEvent.priceUSD} USD</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">{userRole === 'guide' ? 'Traveler:' : 'Tour Guide:'}</span>
                  <span className="font-bold text-slate-900">{activeModalEvent.partnerName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">{language === 'vi' ? 'Thời gian slot:' : 'Proposed Slot:'}</span>
                  <span className="font-bold text-slate-800">{activeModalEvent.timeDisplay}</span>
                </div>
              </div>

              {/* Status Indicator Note */}
              <div className="p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-950">
                <span className="material-symbols-outlined text-base">schedule</span>
                <span>
                  {language === 'vi' ? 'Sự kiện này đang trong quá trình thương lượng giá trực tiếp.' : 'This offer is currently under active price negotiation between parties.'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>

                  {onOpenNegotiationModal && (
                    <button
                      onClick={() => {
                        const neg = activeModalEvent.originalObject as NegotiationOffer;
                        setActiveModalEvent(null);
                        onOpenNegotiationModal(neg);
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold cursor-pointer shadow-sm"
                    >
                      {language === 'vi' ? 'Mở Chat Thương Lượng 💬' : 'Open Proposal Chat 💬'}
                    </button>
                  )}
                </div>
              </div>

          </div>
        </div>
      )}

      {/* Traveler Request Post Inspection Modal */}
      {activeModalEvent && activeModalEvent.category === 'post' && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-0 my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 text-white flex items-center justify-between bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 shrink-0">
              <div className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-2xl text-teal-400">campaign</span>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {language === 'vi' ? 'Chi Tiết Yêu Cầu Tour' : 'Traveler Request Details'}
                  </h3>
                  <p className="text-[11px] text-teal-200">
                    {activeModalEvent.displayDate}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalEvent(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const post = activeModalEvent.originalObject as TravelerPostRequest;
              return (
                <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
                  
                  {/* Traveler Summary Card */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.travelerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'}
                        alt={post.travelerName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-300"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{post.travelerName || 'Traveler'}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">📍 {post.city || 'Vietnam'}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      post.status === 'booked' 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                        : 'bg-teal-100 text-teal-900 border-teal-300'
                    }`}>
                      {post.status === 'booked' 
                        ? (language === 'vi' ? 'Đã Chốt Tour' : 'Booked') 
                        : (language === 'vi' ? 'Đang Nhận Báo Giá' : 'Open for Bids')}
                    </span>
                  </div>

                  {/* Request Highlights */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500">{language === 'vi' ? 'Tiêu đề chuyến đi:' : 'Trip Title:'}</span>
                      <span className="font-black text-slate-900 text-xs">{post.title}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500">{language === 'vi' ? 'Ngân sách mong muốn:' : 'Budget Range:'}</span>
                      <span className="font-black text-emerald-700 text-sm">
                        ${post.minBudgetUSD || 0} - ${post.maxBudgetUSD || 0} USD
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500">{language === 'vi' ? 'Thời lượng & Đoàn:' : 'Duration & Group:'}</span>
                      <span className="font-bold text-slate-800">
                        {post.durationHours} {language === 'vi' ? 'Giờ' : 'Hours'} • {post.groupSize} {language === 'vi' ? 'Khách' : 'Travelers'}
                      </span>
                    </div>

                    {(post.preferredLanguage || (post.preferredLanguages && post.preferredLanguages.length > 0)) && (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">{language === 'vi' ? 'Ngôn ngữ thuyết minh:' : 'Spoken Tour Language:'}</span>
                        <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                          {formatLanguageWithFlag(post.preferredLanguage || post.preferredLanguages[0], language === 'vi')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Schedule Slots (if defined) */}
                  {post.scheduleSlots && post.scheduleSlots.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                      <p className="font-bold text-teal-950 text-xs flex items-center space-x-1.5">
                        <span className="material-symbols-outlined text-sm text-teal-700">calendar_month</span>
                        <span>{language === 'vi' ? 'Khung giờ yêu cầu:' : 'Requested Time Slots:'}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {post.scheduleSlots.map((slot, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl bg-white border border-teal-300 text-teal-950 font-extrabold text-[11px] shadow-2xs">
                            📅 {slot.dateStr} ({slot.startTime} - {slot.endTime})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Traveler Description */}
                  {post.description && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        {language === 'vi' ? 'Mô tả & Ghi chú từ khách:' : 'Traveler Notes & Requirements:'}
                      </p>
                      <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                        {post.description}
                      </p>
                    </div>
                  )}

                  {/* Modal Footer Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveModalEvent(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                    >
                      {language === 'vi' ? 'Đóng' : 'Close'}
                    </button>

                      {userRole === 'guide' && post.status !== 'booked' && (
                        <button
                          onClick={() => {
                            const p = post;
                            setActiveModalEvent(null);
                            if (onOpenPostDetail) {
                              onOpenPostDetail(p);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black cursor-pointer shadow-md transition-all flex items-center space-x-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">send</span>
                          <span>{language === 'vi' ? 'Gửi Báo Giá Ngay' : 'Bid / Send Price Offer'}</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })()}

          </div>
        </div>
      )}

    </div>
  );
};
