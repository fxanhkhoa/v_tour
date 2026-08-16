import React, { useState, useEffect, useRef } from 'react';
import { TourBooking, ChatMessage, User } from '../types';
import { Language } from '../lib/translations';
import { AddToGoogleCalendarButton } from './AddToGoogleCalendarButton';
import { TourVideoCallRoom } from './TourVideoCallRoom';
import { exportPdfFromElement, triggerSystemPrint } from '../lib/printUtils';

interface TourBookingHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: TourBooking | null;
  allBookings?: TourBooking[];
  currentUser?: User | null;
  currentUserRole?: 'traveler' | 'guide' | 'admin';
  onUpdateStatus?: (bookingId: string, status: any, role?: 'traveler' | 'guide') => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  language?: Language;
}

export const TourBookingHubModal: React.FC<TourBookingHubModalProps> = ({
  isOpen,
  onClose,
  booking,
  allBookings = [],
  currentUser,
  currentUserRole,
  onUpdateStatus,
  onConfirmCompletion,
  language = 'en'
}) => {
  // Determine active booking list and selected item ID
  const safeBookings = allBookings.length > 0 ? allBookings : (booking ? [booking] : []);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(booking?.id || safeBookings[0]?.id || null);
  const [localStatuses, setLocalStatuses] = useState<{ [id: string]: 'matched' | 'en_route' | 'in_progress' | 'completed' }>({});
  const [localConfirmations, setLocalConfirmations] = useState<{
    [id: string]: { travelerConfirmed?: boolean; guideConfirmed?: boolean }
  }>({});

  // Ref for printable pass
  const tourPassRef = useRef<HTMLDivElement>(null);
  const [isExportingPassPdf, setIsExportingPassPdf] = useState(false);

  // Sync selected booking ID whenever modal opens or booking prop changes
  useEffect(() => {
    if (booking?.id) {
      setSelectedBookingId(booking.id);
      if (booking.status) {
        setLocalStatuses(prev => ({ ...prev, [booking.id]: booking.status }));
      }
      setLocalConfirmations(prev => ({
        ...prev,
        [booking.id]: {
          travelerConfirmed: Boolean(booking.travelerConfirmedCompletion),
          guideConfirmed: Boolean(booking.guideConfirmedCompletion)
        }
      }));
    } else if (safeBookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(safeBookings[0].id);
      if (safeBookings[0].status) {
        setLocalStatuses(prev => ({ ...prev, [safeBookings[0].id]: safeBookings[0].status }));
      }
      setLocalConfirmations(prev => ({
        ...prev,
        [safeBookings[0].id]: {
          travelerConfirmed: Boolean(safeBookings[0].travelerConfirmedCompletion),
          guideConfirmed: Boolean(safeBookings[0].guideConfirmedCompletion)
        }
      }));
    }
  }, [booking?.id, isOpen]);

  // Always fetch latest authoritative booking status directly from server on open
  useEffect(() => {
    if (!isOpen || !selectedBookingId) return;
    const fetchLatestBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${selectedBookingId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking) {
            if (data.booking.status) {
              setLocalStatuses(prev => ({ ...prev, [selectedBookingId]: data.booking.status }));
            }
            setLocalConfirmations(prev => ({
              ...prev,
              [selectedBookingId]: {
                travelerConfirmed: Boolean(data.booking.travelerConfirmedCompletion),
                guideConfirmed: Boolean(data.booking.guideConfirmedCompletion)
              }
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch latest booking status:', err);
      }
    };
    fetchLatestBooking();
  }, [selectedBookingId, isOpen]);

  const [showCompletionConfirmModal, setShowCompletionConfirmModal] = useState(false);

  // Tab state inside the hub
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'chat' | 'videocall' | 'guide'>('overview');

  // Video call state
  const [isVideoCallActive, setIsVideoCallActive] = useState<boolean>(false);
  const [isVideoCallFloating, setIsVideoCallFloating] = useState<boolean>(false);

  // Messenger state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // Checklist interactive state
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    item_0: true,
    item_1: false,
    item_2: true,
    item_3: false
  });

  // Copied feedback
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Derive current selected booking with local status override or server status
  const bookingInList = safeBookings.find(b => b.id === selectedBookingId) || (booking?.id === selectedBookingId ? booking : null) || safeBookings[0] || null;

  // Accurately determine active role from explicit prop, user object, or path
  const userRole: 'traveler' | 'guide' =
    currentUserRole === 'guide'
      ? 'guide'
      : currentUserRole === 'traveler'
        ? 'traveler'
        : currentUser?.role === 'guide'
          ? 'guide'
          : currentUser?.role === 'traveler'
            ? 'traveler'
            : (typeof window !== 'undefined' && window.location.pathname.includes('/guide'))
              ? 'guide'
              : 'traveler';

  const counterpartyRole = userRole === 'guide' ? 'Traveler' : 'Guide';

  const guideConfirmed = selectedBookingId && localConfirmations[selectedBookingId]?.guideConfirmed !== undefined
    ? localConfirmations[selectedBookingId].guideConfirmed
    : Boolean(bookingInList?.guideConfirmedCompletion);

  const travelerConfirmed = selectedBookingId && localConfirmations[selectedBookingId]?.travelerConfirmed !== undefined
    ? localConfirmations[selectedBookingId].travelerConfirmed
    : Boolean(bookingInList?.travelerConfirmedCompletion);

  const isDualConfirmed = Boolean(guideConfirmed && travelerConfirmed);

  const userHasConfirmed = userRole === 'guide' ? guideConfirmed : travelerConfirmed;
  const counterpartyHasConfirmed = userRole === 'guide' ? travelerConfirmed : guideConfirmed;

  // Check if tour has transitioned to completed status
  const isMarkedCompleted = (selectedBookingId && localStatuses[selectedBookingId] === 'completed') || userHasConfirmed || isDualConfirmed || bookingInList?.status === 'completed';

  const currentStatus: 'matched' | 'en_route' | 'in_progress' | 'completed' = isMarkedCompleted
    ? 'completed'
    : ((selectedBookingId && localStatuses[selectedBookingId]) || (bookingInList?.status as any) || 'matched');

  const selectedBooking: TourBooking | null = bookingInList ? {
    ...bookingInList,
    status: currentStatus,
    guideConfirmedCompletion: guideConfirmed,
    travelerConfirmedCompletion: travelerConfirmed,
    paymentStatus: isDualConfirmed ? 'released' : bookingInList.paymentStatus
  } : null;

  const promptConfirmCompletion = () => {
    setShowCompletionConfirmModal(true);
  };

  const executeConfirmCompletion = async () => {
    setShowCompletionConfirmModal(false);
    if (!selectedBooking) return;
    const bId = selectedBooking.id;

    // Optimistically update only the current user's role confirmation and status to completed
    setLocalStatuses(prev => ({ ...prev, [bId]: 'completed' }));
    setLocalConfirmations(prev => ({
      ...prev,
      [bId]: {
        guideConfirmed: userRole === 'guide' ? true : (prev[bId]?.guideConfirmed ?? guideConfirmed),
        travelerConfirmed: userRole === 'traveler' ? true : (prev[bId]?.travelerConfirmed ?? travelerConfirmed)
      }
    }));

    if (onConfirmCompletion) {
      onConfirmCompletion(bId, userRole);
    } else {
      try {
        const res = await fetch(`/api/bookings/${bId}/confirm-completion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: userRole })
        });
        const data = await res.json();
        if (data.booking) {
          setLocalConfirmations(prev => ({
            ...prev,
            [bId]: {
              travelerConfirmed: Boolean(data.booking.travelerConfirmedCompletion),
              guideConfirmed: Boolean(data.booking.guideConfirmedCompletion)
            }
          }));
          if (data.booking.status) {
            setLocalStatuses(prev => ({ ...prev, [bId]: data.booking.status }));
          }
        }
      } catch (err) {
        console.error('Failed to confirm completion via API:', err);
      }
    }

    if (onUpdateStatus) {
      onUpdateStatus(bId, 'completed', userRole);
    }
  };

  const handleStatusChange = async (newStatus: 'matched' | 'en_route' | 'in_progress' | 'completed') => {
    if (!selectedBooking) return;
    const bId = selectedBooking.id;

    if (newStatus === 'completed') {
      promptConfirmCompletion();
      return;
    }

    setLocalStatuses(prev => ({ ...prev, [bId]: newStatus }));

    try {
      const res = await fetch(`/api/bookings/${bId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, role: userRole })
      });
      const data = await res.json();
      if (data.booking && data.booking.status) {
        setLocalStatuses(prev => ({ ...prev, [bId]: data.booking.status }));
      }
    } catch (err) {
      console.error('Failed to update booking status via API:', err);
    }

    if (onUpdateStatus) {
      onUpdateStatus(bId, newStatus, userRole);
    }
  };

  useEffect(() => {
    if (selectedBooking?.id) {
      fetchChatMessages(selectedBooking.id);
    }
  }, [selectedBooking?.id]);

  const fetchChatMessages = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/chat/${bookingId}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || !selectedBooking) return;

    try {
      const res = await fetch(`/api/chat/${selectedBooking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id || 'u_1',
          senderName: currentUser?.name || (currentUser?.role === 'guide' ? 'Local Guide' : 'Traveler'),
          senderRole: currentUser?.role || 'traveler',
          text: textToSend
        })
      });

      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...(prev || []), data.message]);
        if (!customText) setChatInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartVideoCall = (autoNotify = true) => {
    setIsVideoCallActive(true);
    setIsVideoCallFloating(false);
    setActiveTab('videocall');
    if (autoNotify && selectedBooking) {
      handleSendMessage(
        undefined,
        `📹 Started a Live Google Meet Video Call: meet.tourguidehub.com/tgh-${selectedBooking.id.slice(0, 8)}. Click 'Join Call' to enter!`
      );
    }
  };

  const handleEndVideoCall = () => {
    setIsVideoCallActive(false);
    setIsVideoCallFloating(false);
    setActiveTab('chat');
  };

  const handleCopy = (text: string, type: 'pin' | 'address') => {
    navigator.clipboard.writeText(text);
    if (type === 'pin') {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (!isOpen || !selectedBooking) return null;

  // Format Date & Time gracefully
  const rawTime = selectedBooking.scheduledTime || '2026-08-16 (08:30 AM - 02:30 PM)';
  const formattedTime = rawTime.includes('As Agreed')
    ? 'Aug 16, 2026 • 08:30 AM - 02:30 PM (Morning Slot)'
    : rawTime;

  // Pre-tour checklist items
  const defaultChecklist = selectedBooking.guideChecklist || [
    language === 'vi' ? 'Hộ chiếu / CCCD để mua vé tham quan' : 'Valid government photo ID / passport for site entry tickets',
    language === 'vi' ? 'Giày đi bộ thoải mái & quần áo nhẹ' : 'Comfortable walking shoes & lightweight clothing',
    language === 'vi' ? 'Kem chống nắng, nón/mũ & kính râm' : 'Sunscreen, hat & sunglasses for outdoor walking',
    language === 'vi' ? 'Sạc đầy pin điện thoại để chụp ảnh' : 'Fully charged phone for photos and guide contact'
  ];

  // Inclusions items
  const defaultInclusions = selectedBooking.inclusions || [
    language === 'vi' ? 'Hướng dẫn viên bản địa có chứng chỉ' : 'Licensed Private Local English / Bilingual Guide',
    language === 'vi' ? 'Phương tiện xe tay ga / SUV & nón bảo hiểm' : 'Private Scooter / SUV Transportation with Helmets & Fuel',
    language === 'vi' ? 'Toàn bộ vé tham quan & di tích' : 'All Heritage & Monument Entry Tickets Included',
    language === 'vi' ? 'Nước suối lạnh & thử món ăn đường phố' : 'Cold Bottled Water & Local Street Food Samples',
    language === 'vi' ? 'Bảo hiểm Escrow Vault giữ tiền an toàn' : 'Platform Escrow Vault Payment Protection'
  ];

  const meetingInstructions = selectedBooking.meetingInstructions || (
    language === 'vi' 
      ? 'Hướng dẫn viên sẽ đón bạn tại sảnh khách sạn hoặc điểm hẹn đã chốt trước 10 phút. HDV sẽ đeo thẻ xác minh Tour Guide Hub.'
      : 'Your guide will arrive in your hotel lobby or designated landmark 10 minutes before tour departure holding a Tour Guide Hub verification badge.'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full h-[92vh] max-h-[92vh] min-h-[400px] overflow-hidden shadow-2xl border border-slate-200 flex flex-col relative my-auto">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-teal-800/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-inner shrink-0">
              <span className="material-symbols-outlined text-2xl">confirmation_number</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">
                  {language === 'vi' ? 'Trung Tâm Đặt Tour & Thẻ Tour Pass' : 'Tour Pass & Booking Central Hub'}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-300 font-mono text-[10px] font-bold border border-teal-400/30">
                  #{selectedBooking.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-md">
                {selectedBooking.tourTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Escrow Shield & Dual Completion Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="material-symbols-outlined text-amber-600 text-xl">verified_user</span>
            <div>
              <p className="font-extrabold text-amber-950 text-xs flex items-center space-x-2">
                <span>{language === 'vi' ? 'Bảo vệ Tiền Cọc Escrow Vault:' : 'Platform Escrow Vault Shield:'}</span>
                <span className="text-teal-700 font-black">${selectedBooking.totalPriceUSD} USD</span>
              </p>
              <p className="text-[11px] text-amber-800">
                {selectedBooking.paymentStatus === 'released'
                  ? (language === 'vi' ? '✓ Tiền đã giải ngân cho HDV sau khi hoàn thành.' : '✓ Funds released to guide after dual completion confirmation.')
                  : (language === 'vi' ? 'Tiền được giữ an toàn trên hệ thống. Chỉ giải ngân khi cả 2 bên xác nhận hoàn tất.' : 'Funds held securely in platform escrow. Released only upon dual completion confirmation.')}
              </p>
            </div>
          </div>

          {/* Dual completion status */}
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
              travelerConfirmed ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white text-slate-600 border-slate-300'
            }`}>
              Traveler: {travelerConfirmed ? '✓ Accepted' : '⏳ Pending'}
            </span>
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
              guideConfirmed ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white text-slate-600 border-slate-300'
            }`}>
              Guide: {guideConfirmed ? '✓ Accepted' : '⏳ Pending'}
            </span>

            {!isDualConfirmed ? (
              userHasConfirmed ? (
                <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center space-x-1">
                  <span className="material-symbols-outlined text-xs text-amber-700">hourglass_top</span>
                  <span>{language === 'vi' ? `Bạn đã xác nhận (Chờ ${counterpartyRole})` : `You Accepted (Awaiting ${counterpartyRole})`}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={promptConfirmCompletion}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-[11px] shadow-sm cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                >
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>{language === 'vi' ? 'Xác Nhận Hoàn Thành' : 'Confirm Completion'}</span>
                </button>
              )
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[11px] flex items-center space-x-1">
                <span className="material-symbols-outlined text-xs text-emerald-700">task_alt</span>
                <span>{language === 'vi' ? '✓ Đã Hoàn Thành & Giải Ngân' : '✓ Completed & Released'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Sidebar + Main Content Layout */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Navigation Tabs / Bookings List */}
          <div className="w-full md:w-56 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-3 flex flex-col justify-between shrink-0 md:min-h-0 md:overflow-y-auto space-y-3">
            
            {/* If multiple bookings, selector list */}
            {safeBookings.length > 1 && (
              <div className="space-y-1.5 pb-2.5 border-b border-slate-200">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                  {language === 'vi' ? 'Danh Sách Tour' : 'Your Bookings'} ({safeBookings.length})
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {safeBookings.map((bk) => (
                    <button
                      key={bk.id}
                      onClick={() => setSelectedBookingId(bk.id)}
                      className={`w-full p-2 rounded-xl text-left text-xs transition-all cursor-pointer truncate ${
                        selectedBooking.id === bk.id
                          ? 'bg-white border border-teal-500 ring-2 ring-teal-500/20 font-bold text-slate-900 shadow-2xs'
                          : 'bg-white/60 border border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <p className="truncate font-semibold">{bk.tourTitle}</p>
                      <span className="text-[10px] text-teal-700">${bk.totalPriceUSD} USD</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1 mb-1 hidden md:block">
                {language === 'vi' ? 'Thẻ Quản Lý Tour' : 'Hub Navigation'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-col gap-1.5">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`p-2 sm:p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 truncate ${
                    activeTab === 'overview'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg shrink-0">event_available</span>
                  <span className="truncate">{language === 'vi' ? '1. Tổng Quan' : '1. Schedule'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('location')}
                  className={`p-2 sm:p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 truncate ${
                    activeTab === 'location'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg shrink-0">pin_drop</span>
                  <span className="truncate">{language === 'vi' ? '2. Địa Điểm' : '2. Pickup & PIN'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`p-2 sm:p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 relative truncate ${
                    activeTab === 'chat'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg shrink-0">chat</span>
                  <span className="truncate">{language === 'vi' ? '3. Nhắn Tin' : '3. Messenger'}</span>
                  {messages.length > 0 && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('videocall');
                    if (!isVideoCallActive) {
                      setIsVideoCallActive(true);
                    }
                  }}
                  className={`p-2 sm:p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 relative truncate ${
                    activeTab === 'videocall'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : isVideoCallActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20 font-extrabold'
                        : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg shrink-0">video_camera_front</span>
                  <span className="truncate">{language === 'vi' ? '4. Gọi Video (Meet)' : '4. Video Call'}</span>
                  {isVideoCallActive && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('guide')}
                  className={`p-2 sm:p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 truncate ${
                    activeTab === 'guide'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg shrink-0">badge</span>
                  <span className="truncate">{language === 'vi' ? '5. HDV & Hỗ Trợ' : '5. Guide Info'}</span>
                </button>
              </div>
            </div>

            {/* Quick Live Tour Status Tracker */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 text-xs space-y-2 shadow-2xs">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {language === 'vi' ? 'Trạng Thái Tour' : 'Live Status Tracker'}
              </p>
              
              <div className="space-y-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleStatusChange('matched')}
                  className={`w-full text-left p-1.5 rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentStatus === 'matched' ? 'bg-teal-100 text-teal-950 font-extrabold border border-teal-300' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>📍</span>
                    <span>Matched</span>
                  </span>
                  {currentStatus === 'matched' && <span className="text-[9px] bg-teal-800 text-white px-1.5 py-0.5 rounded-md">ACTIVE</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('en_route')}
                  className={`w-full text-left p-1.5 rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentStatus === 'en_route' ? 'bg-amber-100 text-amber-950 font-extrabold border border-amber-300' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>🛵</span>
                    <span>Guide En Route</span>
                  </span>
                  {currentStatus === 'en_route' && <span className="text-[9px] bg-amber-800 text-white px-1.5 py-0.5 rounded-md">ACTIVE</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('in_progress')}
                  className={`w-full text-left p-1.5 rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentStatus === 'in_progress' ? 'bg-emerald-100 text-emerald-950 font-extrabold border border-emerald-300' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>🎒</span>
                    <span>On Tour Now</span>
                  </span>
                  {currentStatus === 'in_progress' && <span className="text-[9px] bg-emerald-800 text-white px-1.5 py-0.5 rounded-md">ACTIVE</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('completed')}
                  className={`w-full text-left p-1.5 rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentStatus === 'completed'
                      ? (isDualConfirmed
                          ? 'bg-indigo-100 text-indigo-950 font-extrabold border border-indigo-300'
                          : 'bg-amber-100 text-amber-950 font-extrabold border border-amber-300')
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <span>{isDualConfirmed ? '🏁' : userHasConfirmed ? '⏳' : counterpartyHasConfirmed ? '🔔' : '🏁'}</span>
                    <span className="truncate">
                      {isDualConfirmed
                        ? 'Completed'
                        : userHasConfirmed
                          ? 'Awaiting ' + counterpartyRole
                          : counterpartyHasConfirmed
                            ? counterpartyRole + ' Completed'
                            : 'Completed'}
                    </span>
                  </span>
                  {currentStatus === 'completed' && (
                    isDualConfirmed ? (
                      <span className="text-[9px] bg-indigo-800 text-white px-1.5 py-0.5 rounded-md shrink-0">RELEASED</span>
                    ) : userHasConfirmed ? (
                      <span className="text-[9px] bg-amber-700 text-white px-1.5 py-0.5 rounded-md shrink-0">PENDING</span>
                    ) : (
                      <span className="text-[9px] bg-teal-700 text-white px-1.5 py-0.5 rounded-md shrink-0">ACTION REQ</span>
                    )
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Main Content Pane */}
          <div ref={tourPassRef} className="printable-document flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-5 bg-slate-50/40">
            
            {/* TAB 1: OVERVIEW & SCHEDULE */}
            {activeTab === 'overview' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Live Tour Stage Controller */}
                <div className="p-4 rounded-3xl bg-white border border-teal-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-teal-600 text-lg">alt_route</span>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                        {language === 'vi' ? 'Trạng Thái & Tiến Độ Tour' : 'Live Tour Stage Controller'}
                      </h5>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">Tap to switch stage:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange('matched')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 ${
                        currentStatus === 'matched'
                          ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span className="text-base">📍</span>
                      <span className="text-[11px]">1. Matched</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${currentStatus === 'matched' ? 'bg-teal-900 text-teal-200' : 'text-slate-400'}`}>
                        {currentStatus === 'matched' ? '● CURRENT' : 'Scheduled'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('en_route')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 ${
                        currentStatus === 'en_route'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-amber-50 border-slate-200'
                      }`}
                    >
                      <span className="text-base">🛵</span>
                      <span className="text-[11px]">2. Guide En Route</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${currentStatus === 'en_route' ? 'bg-amber-900 text-amber-100' : 'text-slate-400'}`}>
                        {currentStatus === 'en_route' ? '● CURRENT' : 'Departing'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('in_progress')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 ${
                        currentStatus === 'in_progress'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
                          : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border-slate-200'
                      }`}
                    >
                      <span className="text-base">🎒</span>
                      <span className="text-[11px]">3. On Tour Now</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${currentStatus === 'in_progress' ? 'bg-emerald-900 text-emerald-100' : 'text-slate-400'}`}>
                        {currentStatus === 'in_progress' ? '● CURRENT' : 'Active'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('completed')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 ${
                        currentStatus === 'completed'
                          ? (isDualConfirmed
                              ? 'bg-indigo-700 text-white border-indigo-800 shadow-sm ring-2 ring-indigo-400'
                              : userHasConfirmed
                                ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400'
                                : 'bg-teal-600 text-white border-teal-700 shadow-sm ring-2 ring-teal-400')
                          : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 border-slate-200'
                      }`}
                    >
                      <span className="text-base">{isDualConfirmed ? '🏁' : userHasConfirmed ? '⏳' : counterpartyHasConfirmed ? '🔔' : '🏁'}</span>
                      <span className="text-[11px]">4. Completed</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${
                        currentStatus === 'completed'
                          ? (isDualConfirmed
                              ? 'bg-indigo-950 text-indigo-200'
                              : userHasConfirmed
                                ? 'bg-amber-900 text-amber-100'
                                : 'bg-teal-950 text-teal-100')
                          : 'text-slate-400'
                      }`}>
                        {currentStatus === 'completed'
                          ? (isDualConfirmed
                              ? '● DUAL ACCEPTED'
                              : userHasConfirmed
                                ? `✓ YOU (${counterpartyRole.toUpperCase()} PENDING)`
                                : `Tap to Confirm (${counterpartyRole} Done)`)
                          : 'Tap to Complete'}
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Prominent Scheduled Date & Time Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-teal-950 text-white shadow-md space-y-3 relative">
                  <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <span className="material-symbols-outlined text-8xl">schedule</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 font-bold text-[11px] flex items-center space-x-1">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      <span>{language === 'vi' ? 'Lịch Trình Đã Xác Nhận' : 'Confirmed Tour Schedule'}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <AddToGoogleCalendarButton
                        payload={{
                          title: selectedBooking.tourTitle,
                          dateStr: selectedBooking.scheduledTime,
                          timeRangeStr: selectedBooking.scheduledTime,
                          partnerName: currentUser?.role === 'guide' ? selectedBooking.travelerName : selectedBooking.guideName,
                          partnerRole: currentUser?.role === 'guide' ? 'traveler' : 'guide',
                          priceUSD: selectedBooking.totalPriceUSD,
                          pinCode: selectedBooking.pinCode,
                          location: selectedBooking.pickupLocation,
                          bookingId: selectedBooking.id
                        }}
                        variant="compact"
                        size="sm"
                        language={language}
                      />
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] shadow-sm">
                        ● Active Tour Pass
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                      {language === 'vi' ? 'Thời gian diễn ra tour:' : 'Scheduled Date & Slot:'}
                    </p>
                    <p className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight">
                      {formattedTime}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">{language === 'vi' ? 'Thời lượng:' : 'Duration:'}</p>
                      <p className="font-extrabold text-white">6 Hours</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">{language === 'vi' ? 'Số lượng khách:' : 'Group Size:'}</p>
                      <p className="font-extrabold text-white">{selectedBooking.groupSize} Traveler(s)</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">{language === 'vi' ? 'Phương tiện:' : 'Transport:'}</p>
                      <p className="font-extrabold text-teal-300 capitalize">{selectedBooking.transportMode || 'Scooter'}</p>
                    </div>
                  </div>
                </div>

                {/* Tour Title & Overview summary */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                    <span className="material-symbols-outlined text-teal-600">tour</span>
                    <span>{selectedBooking.tourTitle}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Agreed Price</span>
                      <p className="font-black text-teal-700 text-base">${selectedBooking.totalPriceUSD} USD</p>
                      <p className="text-[10px] text-slate-500">All-inclusive tour rate</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Local Guide</span>
                      <p className="font-bold text-slate-900 text-sm">{selectedBooking.guideName}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">✓ Licensed & Identity Verified</p>
                    </div>
                  </div>
                </div>

                {/* What's Included Box */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-teal-800 flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-base">task_alt</span>
                    <span>{language === 'vi' ? 'Dịch Vụ Bao Gồm Trong Tour' : 'What is Included in This Tour'}</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {defaultInclusions.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="material-symbols-outlined text-teal-600 text-sm mt-0.5">check_circle</span>
                        <span className="font-semibold text-slate-800">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: PICKUP, LOCATION & SAFETY PIN */}
            {activeTab === 'location' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Verification Safety PIN Banner */}
                <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white shadow-md flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-bold border border-teal-400/30 uppercase">
                      Safety Verification PIN
                    </span>
                    <h4 className="font-extrabold text-sm text-white">
                      {language === 'vi' ? 'Mã PIN Đồng Phục Đón Khách' : 'Meetup Verification PIN Code'}
                    </h4>
                    <p className="text-[11px] text-slate-300 max-w-sm">
                      {language === 'vi'
                        ? 'Đọc mã 4 số này cho HDV khi gặp mặt để đảm bảo đón đúng người.'
                        : 'Provide this 4-digit safety code to your guide when meeting to verify identity.'}
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-teal-300 text-center shadow-lg text-slate-900 shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">PIN CODE</p>
                    <p className="text-2xl font-black text-teal-700 font-mono tracking-widest my-0.5">
                      {selectedBooking.pinCode || '8492'}
                    </p>
                    <button
                      onClick={() => handleCopy(selectedBooking.pinCode || '8492', 'pin')}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-[10px] cursor-pointer transition-all border border-teal-200"
                    >
                      {copiedPin ? '✓ Copied!' : 'Copy PIN'}
                    </button>
                  </div>
                </div>

                {/* Pickup Address & Meeting Instructions */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <span className="material-symbols-outlined text-teal-600 text-base">pin_drop</span>
                      <span>{language === 'vi' ? 'Địa Điểm Đón & Hướng Dẫn' : 'Pickup Point & Meeting Instructions'}</span>
                    </h5>

                    <button
                      onClick={() => handleCopy(selectedBooking.pickupLocation, 'address')}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer flex items-center space-x-1"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span>{copiedAddress ? 'Copied!' : 'Copy Address'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="material-symbols-outlined text-rose-600 text-lg">location_on</span>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Exact Pickup Location</p>
                        <p className="font-extrabold text-slate-900 text-sm">{selectedBooking.pickupLocation}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center space-x-1">
                        <span className="material-symbols-outlined text-sm text-teal-600">info</span>
                        <span>Guide Pickup Notes:</span>
                      </p>
                      <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                        {meetingInstructions}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Pre-Tour Checklist */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-teal-800 flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-base">checklist</span>
                    <span>{language === 'vi' ? 'Danh Sách Chuẩn Bị Trước Khi Đi Tour' : 'Pre-Tour Preparation Checklist'}</span>
                  </h5>

                  <div className="space-y-2 text-xs">
                    {defaultChecklist.map((item, idx) => {
                      const key = `item_${idx}`;
                      const isChecked = !!checkedItems[key];
                      return (
                        <label
                          key={idx}
                          onClick={() => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))}
                          className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <span className={isChecked ? 'line-through text-slate-500 font-medium' : 'font-semibold'}>
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: DIRECT TOUR MESSENGER */}
            {activeTab === 'chat' && (
              <div className="space-y-4 animate-fade-in">
                
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <img
                      src={userRole === 'guide' ? selectedBooking.travelerAvatar : selectedBooking.guideAvatar}
                      alt={userRole === 'guide' ? selectedBooking.travelerName : selectedBooking.guideName}
                      className="w-9 h-9 rounded-full object-cover border-2 border-teal-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900">
                        {userRole === 'guide' ? selectedBooking.travelerName : selectedBooking.guideName}
                      </p>
                      <p className="text-[10px] text-teal-700 font-semibold">
                        {userRole === 'guide' ? 'Verified Traveler' : (selectedBooking.guidePhone || '+84 908 123 456')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Google Meet Live Video Call Button */}
                    <button
                      type="button"
                      onClick={() => handleStartVideoCall(true)}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
                      title="Start Google Meet Style Video Call"
                    >
                      <span className="material-symbols-outlined text-base">video_camera_front</span>
                      <span>{language === 'vi' ? 'Gọi Video Meet' : 'Start Video Call'}</span>
                    </button>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] hidden sm:inline-block">
                      ● Active
                    </span>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-2xs space-y-3 flex flex-col justify-between min-h-[280px]">
                  
                  {/* Messages Stream */}
                  <div className="space-y-3 overflow-y-auto max-h-[240px] pr-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                        <span className="material-symbols-outlined text-3xl text-slate-300">chat_bubble_outline</span>
                        <p className="font-bold">No messages yet</p>
                        <p className="text-[10px]">Send a quick message or start a live video call to coordinate!</p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isCallInvitation = m.text.includes('📹') || m.text.toLowerCase().includes('google meet');
                        const isMe = m.senderRole === (currentUser?.role || userRole);

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            {isCallInvitation ? (
                              /* Video Call Invitation Card */
                              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-teal-950 text-white border border-teal-500/40 shadow-md max-w-sm space-y-2.5">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-400/40 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">video_camera_front</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-white">Google Meet Video Call</p>
                                    <p className="text-[10px] text-teal-200">{m.senderName} started a call</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleStartVideoCall(false)}
                                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl shadow cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                                >
                                  <span className="material-symbols-outlined text-sm">videocam</span>
                                  <span>{language === 'vi' ? 'Tham Gia Cuộc Gọi Ngay' : 'Join Video Call'}</span>
                                </button>
                              </div>
                            ) : (
                              <div
                                className={`max-w-xs p-3 rounded-2xl text-xs ${
                                  isMe
                                    ? 'bg-teal-600 text-white rounded-br-none shadow-xs'
                                    : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-none shadow-2xs'
                                }`}
                              >
                                <p className="font-bold text-[10px] opacity-80 mb-0.5">{m.senderName}</p>
                                <p>{m.text}</p>
                              </div>
                            )}
                            <span className="text-[9px] text-slate-400 mt-0.5">{m.timestamp}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick message suggestions chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(undefined, "Hi! I am in the lobby waiting 👋")}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      "I'm in lobby 👋"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage(undefined, "Hi! Where is our exact meeting spot?")}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      "Where is pickup point?"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartVideoCall(true)}
                      className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold transition-colors cursor-pointer border border-teal-200 flex items-center space-x-1"
                    >
                      <span className="material-symbols-outlined text-xs">videocam</span>
                      <span>"Start Video Call 📹"</span>
                    </button>
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                    >
                      Send
                    </button>
                  </form>

                </div>

              </div>
            )}

            {/* TAB 4: GOOGLE MEET LIVE VIDEO CALL ROOM */}
            {activeTab === 'videocall' && (
              <div className="w-full h-full flex-1 flex flex-col min-h-[460px] animate-fade-in">
                <TourVideoCallRoom
                  booking={selectedBooking}
                  currentUser={currentUser}
                  currentUserRole={userRole}
                  language={language}
                  onEndCall={handleEndVideoCall}
                  messages={messages}
                  onSendMessage={(text) => handleSendMessage(undefined, text)}
                  onToggleFloating={() => {
                    setIsVideoCallFloating(true);
                    setActiveTab('overview');
                  }}
                />
              </div>
            )}

            {/* TAB 4: GUIDE INFO & EMERGENCY SUPPORT */}
            {activeTab === 'guide' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Guide Profile Card */}
                <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedBooking.guideAvatar}
                      alt={selectedBooking.guideName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-base text-slate-900">{selectedBooking.guideName}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                          ✓ Verified License
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Licensed Local Tour Guide • Vietnam Heritage Expert</p>
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 mt-1">
                        <span>★ 4.9 (128 reviews)</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-700">English, Vietnamese, French</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <a
                      href={`tel:${selectedBooking.guidePhone || '+84908123456'}`}
                      className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 font-bold flex items-center justify-center space-x-2 hover:bg-teal-100 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">call</span>
                      <span>Call Guide ({selectedBooking.guidePhone || '+84 908 123 456'})</span>
                    </a>

                    <button
                      onClick={() => setActiveTab('chat')}
                      className="p-3 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                      <span>Open Live Chat</span>
                    </button>
                  </div>
                </div>

                {/* Emergency Assistance & Escrow Vault Security */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                  <h5 className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <span className="material-symbols-outlined text-amber-700 text-base">shield</span>
                    <span>{language === 'vi' ? 'Hỗ Trợ Khẩn Cấp & Bảo Vệ Escrow' : 'Emergency Support & Escrow Dispute Protection'}</span>
                  </h5>
                  <p className="text-amber-800 leading-relaxed">
                    {language === 'vi'
                      ? 'Nêu bạn gặp sự cố trên đường tour hoặc HDV không xuất hiện, tiền cọc $ ' + selectedBooking.totalPriceUSD + ' USD của bạn luôn được bảo vệ 100% trong Escrow Vault. Vui lòng liên hệ Hotline tổng đài 24/7.'
                      : `If your guide fails to show up or if you encounter issues, your $${selectedBooking.totalPriceUSD} USD payment is protected in platform escrow. Contact our 24/7 Hotline.`}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-amber-900">
                    <span>📞 24/7 Support Hotline: +84 1800 888 999</span>
                    <span>🛡️ 100% Refund Guarantee</span>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Footer Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isExportingPassPdf}
              onClick={async () => {
                if (!tourPassRef.current || !selectedBooking) return;
                setIsExportingPassPdf(true);
                try {
                  await exportPdfFromElement(
                    tourPassRef.current,
                    `Tour_Pass_${selectedBooking.id}`
                  );
                } finally {
                  setIsExportingPassPdf(false);
                }
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>{isExportingPassPdf ? (language === 'vi' ? 'Đang tạo...' : 'Generating...') : (language === 'vi' ? 'Lưu Tour Pass (.pdf)' : 'Save Tour Pass (.pdf)')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (tourPassRef.current) {
                  triggerSystemPrint(tourPassRef.current);
                } else {
                  window.print();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>{language === 'vi' ? 'In Thẻ' : 'Print Pass'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {language === 'vi' ? 'Đóng Trung Tâm Tour' : 'Close Tour Hub'}
          </button>
        </div>

      </div>

      {/* Completion Confirmation Dialog Modal */}
      {showCompletionConfirmModal && selectedBooking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up relative">
            
            {/* Header with Icon */}
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner">
                <span className="material-symbols-outlined text-2xl font-bold">task_alt</span>
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                  {language === 'vi' ? 'Xác Nhận Hoàn Tất Chuyến Đi?' : 'Confirm Tour Completion?'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'vi' ? 'Bảo chứng Escrow Vault Platform' : 'Escrow Vault Protection System'}
                </p>
              </div>
            </div>

            {/* Tour Mini Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Tên tour:' : 'Tour:'}</span>
                <span className="font-bold text-slate-900 truncate max-w-[210px]">{selectedBooking.tourTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Tổng tiền tour:' : 'Agreed Amount:'}</span>
                <span className="font-black text-emerald-700 font-mono text-sm">${selectedBooking.totalPriceUSD} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">
                  {userRole === 'guide'
                    ? (language === 'vi' ? 'Du khách:' : 'Traveler:')
                    : (language === 'vi' ? 'Hướng dẫn viên:' : 'Guide:')}
                </span>
                <span className="font-bold text-slate-800">
                  {userRole === 'guide' ? selectedBooking.travelerName : selectedBooking.guideName}
                </span>
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-[11px] space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                <span className="material-symbols-outlined text-xs text-amber-700">info</span>
                <span>{language === 'vi' ? 'Cơ chế giải ngân Escrow Vault' : 'Escrow Release Policy'}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {userRole === 'guide'
                  ? (language === 'vi'
                      ? `Bạn đang xác nhận chuyến đi này đã hoàn tất. Hệ thống sẽ ghi nhận trạng thái và gửi thông báo cho du khách (${selectedBooking.travelerName || 'Traveler'}) xác nhận để giải ngân khoản tiền $${selectedBooking.totalPriceUSD} USD vào tài khoản của bạn.`
                      : `You are confirming that this tour is completed. The traveler (${selectedBooking.travelerName || 'Traveler'}) will be notified to confirm and release the $${selectedBooking.totalPriceUSD} USD payout to your account.`)
                  : (language === 'vi'
                      ? `Bạn đang xác nhận chuyến đi đã hoàn tất và dịch vụ đã hoàn thành. Toàn bộ tiền cọc bảo đảm $${selectedBooking.totalPriceUSD} USD trong Escrow Vault sẽ được giải ngân cho hướng dẫn viên (${selectedBooking.guideName || 'Guide'}).`
                      : `You are confirming that this tour is completed and you are satisfied. The $${selectedBooking.totalPriceUSD} USD escrow funds will be unlocked and released to your guide (${selectedBooking.guideName || 'Guide'}).`)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCompletionConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Hủy / Quay lại' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={executeConfirmCompletion}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{language === 'vi' ? 'Xác Nhận Hoàn Thành' : 'Yes, Confirm Completion'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Minimized Video Call Window */}
      {isVideoCallActive && (isVideoCallFloating || activeTab !== 'videocall') && (
        <TourVideoCallRoom
          booking={selectedBooking}
          currentUser={currentUser}
          currentUserRole={userRole}
          language={language}
          onEndCall={handleEndVideoCall}
          messages={messages}
          onSendMessage={(text) => handleSendMessage(undefined, text)}
          isFloating={true}
          onToggleFloating={() => {
            setIsVideoCallFloating(false);
            setActiveTab('videocall');
          }}
        />
      )}

    </div>
  );
};
