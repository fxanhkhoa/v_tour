import React, { useState } from 'react';
import { User, GuideProfile, TravelerPostRequest, NegotiationOffer, TourBooking, TourPackage, ScheduleSlot } from '../../types';
import { CreateTravelerPostModal } from './CreateTravelerPostModal';
import { GuideDirectoryAndNegotiate } from './GuideDirectoryAndNegotiate';
import { TravelerPostsAndBids } from './TravelerPostsAndBids';
import { TravelerSpendingDashboard } from './TravelerSpendingDashboard';
import { PortalEventsCalendar } from '../../components/PortalEventsCalendar';
import { NegotiationHistoryModal } from '../../components/NegotiationHistoryModal';
import { AddToGoogleCalendarButton } from '../../components/AddToGoogleCalendarButton';
import { AddToGoogleContactsButton } from '../../components/AddToGoogleContactsButton';
import { Language, translations } from '../../lib/translations';

interface TravelerDashboardProps {
  currentUser: User | null;
  selectedCity: string;
  onCityChange?: (city: string) => void;
  guides: GuideProfile[];
  posts: TravelerPostRequest[];
  negotiations: NegotiationOffer[];
  bookings: TourBooking[];
  tours?: TourPackage[];
  onCreatePost: (postData: any) => void;
  onClosePost?: (postId: string) => void;
  onUpdatePostStatus?: (postId: string, status: 'open' | 'negotiating' | 'booked' | 'closed') => void;
  onNegotiateWithGuide: (
    guide: GuideProfile,
    offeredPriceUSD: number,
    message: string,
    tourId?: string,
    tourTitle?: string,
    selectedSlot?: ScheduleSlot,
    groupSize?: number,
    originalPriceUSD?: number
  ) => void;
  onRespondNegotiation: (offerId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number, message?: string, senderRole?: 'traveler' | 'guide') => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  onUpdateStatus?: (bookingId: string, status: 'matched' | 'en_route' | 'in_progress' | 'completed') => void;
  language?: Language;
}

export const TravelerDashboard: React.FC<TravelerDashboardProps> = ({
  currentUser,
  selectedCity,
  onCityChange,
  guides,
  posts,
  negotiations,
  bookings,
  tours = [],
  onCreatePost,
  onClosePost,
  onUpdatePostStatus,
  onNegotiateWithGuide,
  onRespondNegotiation,
  onConfirmCompletion,
  onUpdateStatus,
  language = 'en'
}) => {
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState<'guides' | 'my_posts' | 'bookings' | 'spending' | 'calendar'>('my_posts');
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [historyModalNegotiation, setHistoryModalNegotiation] = useState<NegotiationOffer | null>(null);

  // Dynamically resolve active negotiation object to ensure live state updates in modal
  const activeNegotiation = historyModalNegotiation
    ? (negotiations.find(n => n.id === historyModalNegotiation.id) || historyModalNegotiation)
    : null;

  const handleRespondNegotiationWithSync = (
    offerId: string,
    action: 'accept' | 'counter' | 'decline',
    counterPriceVal?: number,
    message?: string,
    senderRole?: 'traveler' | 'guide'
  ) => {
    onRespondNegotiation(offerId, action, counterPriceVal, message, senderRole);
    if (action === 'accept') {
      setHistoryModalNegotiation(prev => prev && prev.id === offerId ? { ...prev, status: 'accepted' } : prev);
    }
  };

  // Scope traveler posts strictly to active authenticated traveler
  const myPosts = React.useMemo(() => {
    if (!currentUser) return [];
    const userId = currentUser.id;
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userName = currentUser.name?.toLowerCase().trim();

    return (posts || []).filter(p => {
      if (p.travelerId === userId) return true;
      if (userEmail && (p as any).travelerEmail?.toLowerCase().trim() === userEmail) return true;
      if (userName && p.travelerName?.toLowerCase().trim() === userName) return true;
      return false;
    });
  }, [posts, currentUser]);

  const myActivePosts = myPosts.filter(p => p.status !== 'booked' && p.status !== 'closed');
  const myPostIds = React.useMemo(() => new Set(myPosts.map(p => String(p.id))), [myPosts]);

  // Scope negotiations strictly to active authenticated traveler
  const myNegotiations = React.useMemo(() => {
    if (!currentUser) return [];
    const userId = currentUser.id;
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userName = currentUser.name?.toLowerCase().trim();

    return (negotiations || []).filter(n => {
      if (n.travelerId === userId) return true;
      if (userEmail && (n as any).travelerEmail?.toLowerCase().trim() === userEmail) return true;
      if (userName && n.travelerName?.toLowerCase().trim() === userName) return true;
      if (n.postId && myPostIds.has(String(n.postId))) return true;
      return false;
    });
  }, [negotiations, currentUser, myPostIds]);

  // Scope bookings strictly to active authenticated traveler
  const myBookings = React.useMemo(() => {
    if (!currentUser) return [];
    const userId = currentUser.id;
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userName = currentUser.name?.toLowerCase().trim();

    return (bookings || []).filter(b => {
      if (b.travelerId === userId) return true;
      if (userEmail && (b as any).travelerEmail?.toLowerCase().trim() === userEmail) return true;
      if (userName && b.travelerName?.toLowerCase().trim() === userName) return true;
      if (b.postId && myPostIds.has(String(b.postId))) return true;
      return false;
    });
  }, [bookings, currentUser, myPostIds]);

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Traveler Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold mb-2 border border-teal-500/30">
            <span className="material-symbols-outlined text-sm">backpack</span>
            <span>{t.travelerHubBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.travelerHeroTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {t.travelerHeroSub}
          </p>
        </div>

        <button
          onClick={() => setIsPostModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer flex items-center space-x-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-lg">post_add</span>
          <span>{t.postRequestBtn}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('my_posts')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'my_posts'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">campaign</span>
          <span>{t.myRequestsTab} ({myActivePosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'guides'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">explore</span>
          <span>{language === 'vi' ? 'Tìm Tour HDV Tạo & Thương Lượng' : 'Search Created Tours & Negotiate'} ({tours.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'bookings'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">confirmation_number</span>
          <span>{t.confirmedBookingsTab} ({myBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('spending')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'spending'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
          <span>💳 {language === 'vi' ? 'Sổ Chi Tiêu' : 'Spending Hub'}</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'calendar'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          <span>📅 {language === 'vi' ? 'Lịch Sự Kiện' : 'Events Calendar'}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'spending' && (
        <TravelerSpendingDashboard
          currentUser={currentUser}
          bookings={myBookings}
          negotiations={myNegotiations}
          guides={guides}
          tours={tours}
          language={language}
        />
      )}
      {activeTab === 'calendar' && (
        <PortalEventsCalendar
          userRole="traveler"
          currentUser={currentUser}
          bookings={myBookings}
          negotiations={myNegotiations}
          posts={myPosts}
          onOpenNegotiationModal={(neg) => setHistoryModalNegotiation(neg)}
          onRespondNegotiation={handleRespondNegotiationWithSync}
          onUpdateStatus={onUpdateStatus}
          onConfirmCompletion={onConfirmCompletion}
          language={language}
        />
      )}
      {activeTab === 'my_posts' && (
        <TravelerPostsAndBids
          posts={myPosts}
          negotiations={myNegotiations}
          bookings={myBookings}
          onRespondNegotiation={onRespondNegotiation}
          onOpenNewPostModal={() => setIsPostModalOpen(true)}
          onClosePost={onClosePost}
          onUpdatePostStatus={onUpdatePostStatus}
          onConfirmCompletion={onConfirmCompletion}
          onUpdateStatus={onUpdateStatus}
          language={language}
        />
      )}

      {activeTab === 'guides' && (
        <GuideDirectoryAndNegotiate
          tours={tours}
          guides={guides}
          selectedCity={selectedCity}
          onCityChange={onCityChange}
          onNegotiateWithGuide={onNegotiateWithGuide}
          language={language}
          negotiations={negotiations}
        />
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">{t.myActiveBookings}</h3>
              <p className="text-xs text-slate-500">
                {language === 'vi' ? 'Quản lý tour đã đặt và tình trạng giải ngân bảo chứng Escrow' : 'Manage your active tours and escrow disbursement status'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('spending')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-xs border border-teal-200 cursor-pointer transition-colors flex items-center space-x-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-teal-600">account_balance_wallet</span>
              <span>{language === 'vi' ? 'Xem Sổ Chi Tiêu & Hoá Đơn' : 'View Spending & Receipts'}</span>
            </button>
          </div>
          {myBookings.length === 0 ? (
            <p className="text-xs text-slate-400 italic">{t.noBookingsYet}</p>
          ) : (
            myBookings.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-slate-900 text-sm">{b.tourTitle}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      b.paymentStatus === 'released' ? 'bg-emerald-100 text-emerald-800' :
                      b.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {b.paymentStatus === 'released' 
                        ? (language === 'vi' ? '✅ Đã Giải Ngân Escrow' : '✅ Escrow Released')
                        : b.paymentStatus === 'refunded' 
                        ? (language === 'vi' ? '↩️ Đã Hoàn Tiền' : '↩️ Refunded')
                        : (language === 'vi' ? '🛡️ Đã Ký Quỹ Đảm Bảo' : '🛡️ Held in Platform Escrow')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{t.guideLabel}: {b.guideName} • {t.totalLabel}: ${b.totalPriceUSD} USD</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-mono font-bold text-teal-700">{t.safetyPinLabel}: {b.pinCode}</span>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {language === 'vi' ? 'Xác nhận kép' : 'Dual Acceptance'}: {language === 'vi' ? 'Khách' : 'Traveler'} {b.travelerConfirmedCompletion ? '✓' : '⏳'} | {language === 'vi' ? 'HDV' : 'Guide'} {b.guideConfirmedCompletion ? '✓' : '⏳'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <AddToGoogleContactsButton
                    payload={{
                      name: b.guideName,
                      phone: b.guidePhone || '+84 908 123 456',
                      tourTitle: b.tourTitle,
                      bookingId: b.id,
                      pinCode: b.pinCode,
                      role: 'Licensed Tour Guide'
                    }}
                    variant="compact"
                    size="sm"
                    language={language}
                  />

                  <AddToGoogleCalendarButton
                    payload={{
                      title: b.tourTitle,
                      dateStr: b.scheduledTime,
                      timeRangeStr: b.scheduledTime,
                      partnerName: b.guideName,
                      partnerRole: 'guide',
                      priceUSD: b.totalPriceUSD,
                      pinCode: b.pinCode,
                      location: b.pickupLocation,
                      bookingId: b.id
                    }}
                    variant="outline"
                    size="sm"
                    language={language}
                  />

                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold uppercase">
                    {language === 'vi'
                      ? (b.status === 'matched' ? 'Đã Ghép Nối' :
                         b.status === 'en_route' ? 'HDV Đang Đến' :
                         b.status === 'in_progress' ? 'Đang Đi Tour' :
                         b.status === 'completed' ? 'Hoàn Thành' : b.status)
                      : (b.status || 'matched').replace('_', ' ')}
                  </span>

                  {b.status !== 'completed' && onConfirmCompletion && (
                    <button
                      type="button"
                      onClick={() => onConfirmCompletion(b.id, 'traveler')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
                        b.travelerConfirmedCompletion
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {b.travelerConfirmedCompletion ? 'check_circle' : 'verified'}
                      </span>
                      <span>
                        {b.travelerConfirmedCompletion
                          ? (language === 'vi' ? '✓ Bạn Đã Xác Nhận Hoàn Thành' : '✓ You Accepted Completion')
                          : (language === 'vi' ? 'Xác Nhận Tour Hoàn Thành' : 'Accept Tour Completed')}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Traveler Request Modal */}
      <CreateTravelerPostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        currentUser={currentUser}
        selectedCity={selectedCity}
        onCreatePost={onCreatePost}
        bookings={bookings}
        language={language}
      />

      {/* Negotiation History Modal */}
      <NegotiationHistoryModal
        isOpen={!!historyModalNegotiation}
        onClose={() => setHistoryModalNegotiation(null)}
        negotiation={activeNegotiation}
        currentUserRole="traveler"
        language={language}
        onRespondNegotiation={handleRespondNegotiationWithSync}
      />

    </section>
  );
};
