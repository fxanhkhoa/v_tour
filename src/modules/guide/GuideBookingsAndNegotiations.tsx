import React, { useState } from 'react';
import { GuideProfile, TourBooking, TravelerPostRequest, NegotiationOffer } from '../../types';
import { NegotiationHistoryModal } from '../../components/NegotiationHistoryModal';
import { PortalEventsCalendar } from '../../components/PortalEventsCalendar';
import { TourBookingHubModal } from '../../components/TourBookingHubModal';
import { GuidePayoutsLedger } from './GuidePayoutsLedger';
import { Language } from '../../lib/translations';
import { AddToGoogleCalendarButton } from '../../components/AddToGoogleCalendarButton';
import { formatLanguageWithFlag } from '../../lib/languages';

interface GuideBookingsAndNegotiationsProps {
  guideProfile: GuideProfile;
  bookings: TourBooking[];
  posts: TravelerPostRequest[];
  negotiations: NegotiationOffer[];
  onAcceptBooking: (bookingId: string) => void;
  onSendBidToPost: (postId: string, offerPrice: number, message: string) => void;
  onRespondNegotiation: (offerId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number, message?: string, senderRole?: 'traveler' | 'guide') => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  onUpdateStatus?: (bookingId: string, status: 'matched' | 'en_route' | 'in_progress' | 'completed') => void;
  onOpenKYCModal?: () => void;
  onOpenPayoutModal?: () => void;
  language?: Language;
}

export const GuideBookingsAndNegotiations: React.FC<GuideBookingsAndNegotiationsProps> = ({
  guideProfile,
  bookings,
  posts,
  negotiations,
  onAcceptBooking,
  onSendBidToPost,
  onRespondNegotiation,
  onConfirmCompletion,
  onUpdateStatus,
  onOpenKYCModal,
  onOpenPayoutModal,
  language = 'en'
}) => {
  const isVerified = guideProfile.kycStatus === 'verified' || guideProfile.verified;

  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'board' | 'payouts'>('calendar');

  const [selectedPost, setSelectedPost] = useState<TravelerPostRequest | null>(null);
  const [bidPrice, setBidPrice] = useState<number>(50);
  const [bidMessage, setBidMessage] = useState<string>('Hello! I am a verified licensed local guide. I can host your custom tour!');

  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(45);

  const [historyModalNegotiation, setHistoryModalNegotiation] = useState<NegotiationOffer | null>(null);
  const [selectedHubBooking, setSelectedHubBooking] = useState<TourBooking | null>(null);
  const [bookingToConfirmCompletion, setBookingToConfirmCompletion] = useState<TourBooking | null>(null);

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

  // Search & Filter State for Custom Requests
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [minGroupSize, setMinGroupSize] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'budget_low'>('newest');

  const myBookings = (bookings || []).filter(
    b => b.guideId === guideProfile.id ||
         (guideProfile.userId && (b as any).guideUserId === guideProfile.userId) ||
         (guideProfile.fullName && b.guideName?.toLowerCase().trim() === guideProfile.fullName?.toLowerCase().trim())
  );

  // Extract all unique cities from posts + guide city
  const availableCities = React.useMemo(() => {
    const citySet = new Set<string>();
    if (guideProfile.city) citySet.add(guideProfile.city);
    (posts || []).forEach(p => {
      if (p.city) citySet.add(p.city);
    });
    return Array.from(citySet).sort();
  }, [posts, guideProfile.city]);

  // Filter posts with full search criteria
  const filteredPosts = React.useMemo(() => {
    return (posts || []).filter(post => {
      // City filter
      if (selectedCity !== 'all') {
        if (post.city?.toLowerCase() !== selectedCity.toLowerCase()) return false;
      }

      // Max Budget filter
      if (maxBudget !== '' && !isNaN(Number(maxBudget))) {
        if (post.minBudgetUSD > Number(maxBudget)) return false;
      }

      // Group Size filter
      if (minGroupSize !== '' && !isNaN(Number(minGroupSize))) {
        if (post.groupSize < Number(minGroupSize)) return false;
      }

      // Keyword search (title, description, travelerName, city, languages)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = post.title?.toLowerCase().includes(q);
        const matchDesc = post.description?.toLowerCase().includes(q);
        const matchName = post.travelerName?.toLowerCase().includes(q);
        const matchCity = post.city?.toLowerCase().includes(q);
        const matchLang = post.preferredLanguages?.some(l => l.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchName && !matchCity && !matchLang) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'budget_high') return b.maxBudgetUSD - a.maxBudgetUSD;
      if (sortBy === 'budget_low') return a.minBudgetUSD - b.minBudgetUSD;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [posts, selectedCity, maxBudget, minGroupSize, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery !== '' || selectedCity !== 'all' || maxBudget !== '' || minGroupSize !== '' || sortBy !== 'newest';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setMaxBudget('');
    setMinGroupSize('');
    setSortBy('newest');
  };

  const myNegotiations = (negotiations || []).filter(
    n => n.guideId === guideProfile.id ||
         (guideProfile.userId && (n as any).guideUserId === guideProfile.userId) ||
         (guideProfile.fullName && n.guideName?.toLowerCase().trim() === guideProfile.fullName?.toLowerCase().trim())
  );

  const handleConfirmBid = () => {
    if (!selectedPost || !isVerified) return;
    onSendBidToPost(selectedPost.id, bidPrice, bidMessage);
    setSelectedPost(null);
  };

  return (
    <div className="space-y-8">
      
      {/* Sub-navigation View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2 sm:p-3 rounded-2xl text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'calendar'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>{language === 'vi' ? '📅 Lịch Sự Kiện' : '📅 Events Calendar'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('board')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'board'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">campaign</span>
            <span>{language === 'vi' ? '📋 Bảng Đấu Giá & Quản Lý Đơn' : '📋 Bidding & Management'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('payouts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'payouts'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">payments</span>
            <span>{language === 'vi' ? '💸 Tiền Đã Chuyển & Giải Ngân' : '💸 Transferred Money & Payouts'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono">
              ${myBookings.filter(b => b.paymentStatus === 'released').reduce((sum, b) => sum + (b.totalPriceUSD || 0), 0)}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold text-slate-300 px-2">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Accepted ({myBookings.length})</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Negotiating ({myNegotiations.length})</span>
          </span>
        </div>
      </div>

      {/* Render Portal Events Calendar when 'calendar' subtab selected */}
      {activeSubTab === 'calendar' && (
        <PortalEventsCalendar
          userRole="guide"
          currentUser={{ id: guideProfile.userId || guideProfile.id, name: guideProfile.fullName, role: 'guide', avatar: guideProfile.avatar } as any}
          bookings={myBookings}
          negotiations={myNegotiations}
          posts={posts}
          onOpenNegotiationModal={(neg) => setHistoryModalNegotiation(neg)}
          onOpenBookingDetail={(b) => setSelectedHubBooking(b)}
          onOpenPostDetail={(p) => {
            setSelectedPost(p);
            setBidPrice(p.maxBudgetUSD || p.minBudgetUSD || 50);
            setBidMessage(`Hello ${p.travelerName || 'Traveler'}! I am a verified local guide in ${p.city || 'the area'}. I would love to guide your group of ${p.groupSize} for this ${p.durationHours || 3}-hour tour conducted in ${p.preferredLanguage || p.preferredLanguages?.[0] || 'English'}.`);
          }}
          onRespondNegotiation={handleRespondNegotiationWithSync}
          onUpdateStatus={onUpdateStatus}
          onConfirmCompletion={onConfirmCompletion}
          language={language}
        />
      )}

      {/* Render Transferred Money & Payouts Ledger when 'payouts' subtab selected */}
      {activeSubTab === 'payouts' && (
        <GuidePayoutsLedger
          guideProfile={guideProfile}
          bookings={myBookings}
          onOpenBookingHub={(b) => setSelectedHubBooking(b)}
          onOpenPayoutModal={onOpenPayoutModal}
          language={language}
        />
      )}

      {/* Render Live Bidding & Management Board when 'board' subtab selected */}
      {activeSubTab === 'board' && (
        <>
          {/* SECTION 1: Open Traveler Requests in City (Bidding Hub) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">campaign</span>
              <span>{language === 'vi' ? 'Bảng Yêu Cầu Chuyến Đi Trực Tiếp' : 'Live Traveler Requests Board'}</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {language === 'vi' ? 'Phản Hồi & Báo Giá Yêu Cầu Tour Của Du Khách' : 'Answer Travelers & Tour Company Custom Requests'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'vi'
                ? 'Du khách đăng yêu cầu chuyến đi tùy chỉnh. Tìm kiếm theo thành phố, ngân sách hoặc từ khóa và gửi báo giá trực tiếp.'
                : 'Travelers post custom trip requirements. Search by city, budget, or keywords and send direct price offers.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border">
              {language === 'vi' 
                ? `Hiển thị ${filteredPosts.length} / ${posts.length} yêu cầu` 
                : `Showing ${filteredPosts.length} of ${posts.length} Custom Requests`}
            </span>
          </div>
        </div>

        {/* Search & Criteria Filter Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            {/* Search Keyword */}
            <div className="md:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm tiêu đề yêu cầu, thông tin chi tiết, tên du khách, ngôn ngữ...' : 'Search request title, details, traveler name, languages...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* City Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
              >
                <option value="all">{language === 'vi' ? `📍 Tất Cả Điểm Đến (${posts.length})` : `📍 All Cities (${posts.length})`}</option>
                {guideProfile.city && (
                  <option value={guideProfile.city.toLowerCase()}>
                    ⭐ {language === 'vi' ? `Thành Phố Của Tôi (${guideProfile.city})` : `My City (${guideProfile.city})`}
                  </option>
                )}
                {availableCities
                  .filter(c => c.toLowerCase() !== guideProfile.city?.toLowerCase())
                  .map(c => (
                    <option key={c} value={c.toLowerCase()}>
                      📍 {c}
                    </option>
                  ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="md:col-span-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
              >
                <option value="newest">{language === 'vi' ? '🕒 Sắp xếp: Mới Nhất' : '🕒 Sort: Newest First'}</option>
                <option value="budget_high">{language === 'vi' ? '💰 Sắp xếp: Ngân Sách Cao Nhất' : '💰 Sort: Highest Budget First'}</option>
                <option value="budget_low">{language === 'vi' ? '🏷️ Sắp xếp: Ngân Sách Thấp Nhất' : '🏷️ Sort: Lowest Budget First'}</option>
              </select>
            </div>
          </div>

          {/* Detailed Criteria Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/70 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Quick City Buttons */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-500 text-[11px]">{language === 'vi' ? 'Địa điểm nhanh:' : 'Quick Location:'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCity('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCity === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'vi' ? 'Tất Cả' : 'All Cities'}
                </button>
                {guideProfile.city && (
                  <button
                    type="button"
                    onClick={() => setSelectedCity(guideProfile.city.toLowerCase())}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      selectedCity === guideProfile.city.toLowerCase()
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>⭐ {guideProfile.city}</span>
                  </button>
                )}
              </div>

              {/* Max Budget Filter */}
              <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">{language === 'vi' ? 'Ngân sách tối đa:' : 'Max Budget:'}</span>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-20 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 font-semibold">USD</span>
              </div>

              {/* Group Size Filter */}
              <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">{language === 'vi' ? 'Số lượng khách:' : 'Group Size:'}</span>
                <select
                  value={minGroupSize}
                  onChange={(e) => setMinGroupSize(e.target.value)}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">{language === 'vi' ? 'Bất kỳ' : 'Any'}</option>
                  <option value="1">{language === 'vi' ? 'Từ 1 khách' : '1+ Traveler'}</option>
                  <option value="2">{language === 'vi' ? 'Từ 2 khách' : '2+ Travelers'}</option>
                  <option value="4">{language === 'vi' ? 'Từ 4 khách' : '4+ Travelers'}</option>
                  <option value="6">{language === 'vi' ? 'Từ 6 khách' : '6+ Travelers'}</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-extrabold flex items-center space-x-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
              >
                <span className="material-symbols-outlined text-xs">restart_alt</span>
                <span>{language === 'vi' ? 'Đặt Lại Bộ Lọc' : 'Reset Filters'}</span>
              </button>
            )}
          </div>
        </div>

        {!isVerified && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-2.5 font-semibold">
              <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">
                {guideProfile.kycStatus === 'pending' ? 'hourglass_top' : 'lock'}
              </span>
              <span>
                {guideProfile.kycStatus === 'pending' ? (
                  <>
                    <strong>{language === 'vi' ? 'Hồ Sơ Đang Chờ Admin Duyệt ⏳:' : 'Verification Under Admin Review ⏳:'}</strong>{' '}
                    {language === 'vi'
                      ? 'Thẻ HDV & CCCD của bạn đang được kiểm tra. Tính năng báo giá sẽ tự động mở sau khi duyệt.'
                      : 'Your Tour Guide License Card & CCCD submission is currently being reviewed. Bidding will be enabled upon approval.'}
                  </>
                ) : (
                  <>
                    <strong>{language === 'vi' ? 'Yêu Cầu Xác Thực Để Đấu Giá:' : 'Verification Required to Bid:'}</strong>{' '}
                    {language === 'vi'
                      ? 'Bạn cần nộp Thẻ Hướng Dẫn Viên & CCCD để có thể gửi báo giá cho du khách.'
                      : 'You must submit your Tour Guide License Card & CCCD to place bids on traveler posts.'}
                  </>
                )}
              </span>
            </div>
            {onOpenKYCModal && (
              <button
                onClick={onOpenKYCModal}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-sm"
              >
                {guideProfile.kycStatus === 'pending'
                  ? (language === 'vi' ? 'Xem Hồ Sơ ⏳' : 'View Application ⏳')
                  : (language === 'vi' ? 'Nộp Hồ Sơ Xác Thực 📜' : 'Submit Verification 📜')}
              </button>
            )}
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">find_in_page</span>
            <p className="text-slate-600 font-bold text-sm">
              {language === 'vi' ? 'Không tìm thấy yêu cầu nào phù hợp với bộ lọc.' : 'No custom requests found matching your filter criteria.'}
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {language === 'vi' ? 'Thử xóa từ khóa tìm kiếm hoặc điều chỉnh địa điểm và ngân sách.' : 'Try clearing your keyword search or adjusting location and budget constraints.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Đặt Lại Bộ Lọc' : 'Reset Search Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => {
              const matchingNegotiations = (negotiations || []).filter(n => {
                if (!n) return false;
                if (n.postId && post.id && String(n.postId) === String(post.id)) return true;
                
                if (!n.postId) {
                  const isTravelerMatch = (n.travelerId && post.travelerId && n.travelerId === post.travelerId) ||
                                          (n.travelerName && post.travelerName && n.travelerName.toLowerCase().trim() === post.travelerName.toLowerCase().trim());
                  if (isTravelerMatch && n.tourTitle && post.title) {
                    const nTitle = n.tourTitle.toLowerCase();
                    const pTitle = post.title.toLowerCase();
                    if (nTitle === pTitle || nTitle.includes(pTitle) || pTitle.includes(nTitle)) return true;
                  }
                }

                return false;
              });

              const myNeg = matchingNegotiations.find(n => n.guideId === guideProfile.id);
              const existingNegotiation = myNeg || matchingNegotiations[0] || null;

              return (
                <div key={post.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <img
                          src={post.travelerAvatar}
                          alt={post.travelerName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-bold text-xs text-slate-900">{post.travelerName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {post.status === 'closed' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wide flex items-center space-x-1 border border-slate-300">
                            <span className="material-symbols-outlined text-[11px]">lock</span>
                            <span>{language === 'vi' ? 'Đã Đóng' : 'Closed'}</span>
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-800 text-[10px] font-black uppercase flex items-center space-x-1">
                          <span className="material-symbols-outlined text-xs text-teal-700">location_on</span>
                          <span>{post.city}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase">
                          {language === 'vi' ? 'Ngân sách:' : 'Budget:'} ${post.minBudgetUSD}-${post.maxBudgetUSD}
                        </span>
                        {post.depositAmountUSD && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center space-x-1 ${
                            post.depositStatus === 'paid_in_escrow'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : post.depositStatus === 'transferred_to_booking'
                              ? 'bg-teal-100 text-teal-800 border border-teal-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className="material-symbols-outlined text-xs text-emerald-600">verified_user</span>
                            <span>Escrow: ${post.depositAmountUSD}</span>
                          </span>
                        )}
                      </div>
                    </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1">{post.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-2.5">{post.description}</p>

                  {/* Time Slots & Hour Base Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {post.scheduleSlots && post.scheduleSlots.length > 0 ? (
                      post.scheduleSlots.map((slot, idx) => {
                        const slotText = (slot.startTime && slot.endTime && slot.dateStr)
                          ? `${slot.startTime} - ${slot.endTime} on ${slot.dateStr}`
                          : (slot.displayLabel || `${slot.startTime || ''} - ${slot.endTime || ''} on ${slot.dateStr || post.preferredDate || ''}`);

                        return (
                          <span
                            key={slot.id || idx}
                            className="inline-flex items-center space-x-1 text-[11px] bg-teal-50 border border-teal-200/90 text-teal-900 px-2 py-0.5 rounded-lg font-bold"
                          >
                            <span className="material-symbols-outlined text-xs text-teal-700">schedule</span>
                            <span>{slotText}</span>
                            {post.durationHours > 0 && (
                              <span className="text-teal-800 font-extrabold">
                                • ⏱️ {post.durationHours} {language === 'vi' ? 'Giờ' : 'Hours'}
                              </span>
                            )}
                          </span>
                        );
                      })
                    ) : post.preferredDate ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] bg-teal-50 border border-teal-200 text-teal-900 px-2 py-0.5 rounded-lg font-bold">
                        <span className="material-symbols-outlined text-xs text-teal-700">calendar_clock</span>
                        <span>{post.preferredDate}</span>
                        {post.durationHours > 0 && (
                          <span className="text-teal-800 font-extrabold">
                            • ⏱️ {post.durationHours} {language === 'vi' ? 'Giờ' : 'Hours'}
                          </span>
                        )}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                    <span>👥 {post.groupSize} {language === 'vi' ? 'Du khách' : 'Travelers'}</span>
                    {post.preferredLanguages && post.preferredLanguages.length > 0 && (
                      <span>🗣️ {post.preferredLanguages.join(', ')}</span>
                    )}
                  </div>

                  {existingNegotiation && (
                    <div className={`mt-3 p-3 rounded-2xl border text-xs space-y-1.5 ${
                      existingNegotiation.lastSenderRole === 'traveler'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-950'
                        : existingNegotiation.status === 'accepted'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950'
                        : 'bg-teal-500/10 border-teal-500/30 text-teal-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold flex items-center space-x-1">
                          <span>{existingNegotiation.lastSenderRole === 'traveler' ? (language === 'vi' ? '📩 Du khách đề xuất:' : '📩 Traveler Negotiated:') : (language === 'vi' ? '🤝 Báo giá đang gửi:' : '🤝 Active Bid:')}</span>
                          <span className="text-emerald-700 font-black">${existingNegotiation.offeredPriceUSD} USD</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          existingNegotiation.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          existingNegotiation.lastSenderRole === 'traveler' ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' :
                          'bg-teal-100 text-teal-900 border border-teal-300'
                        }`}>
                          {existingNegotiation.status === 'accepted'
                            ? (language === 'vi' ? 'Đã Chấp Nhận' : 'Accepted')
                            : existingNegotiation.lastSenderRole === 'traveler'
                            ? (language === 'vi' ? 'Chờ Bạn Phản Hồi ⏳' : 'Awaiting Your Response ⏳')
                            : (language === 'vi' ? 'Đã Gửi Báo Giá ⏳' : 'Offer Sent ⏳')}
                        </span>
                      </div>
                      {existingNegotiation.messages && existingNegotiation.messages.length > 0 && (
                        <p className="text-[11px] text-slate-700 italic line-clamp-2">
                          "{existingNegotiation.messages[existingNegotiation.messages.length - 1]?.text}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-teal-700">
                    {language === 'vi' 
                      ? `${post.bidsCount || (existingNegotiation ? 1 : 0)} Lượt báo giá đã nhận` 
                      : `${post.bidsCount || (existingNegotiation ? 1 : 0)} Bids Received`}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {existingNegotiation ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setHistoryModalNegotiation(existingNegotiation)}
                          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <span className="material-symbols-outlined text-sm">history_edu</span>
                          <span>{language === 'vi' ? 'Lịch Sử & Nhắn Tin' : 'History & Chat'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isVerified) {
                              if (onOpenKYCModal) onOpenKYCModal();
                              return;
                            }
                            if (existingNegotiation.lastSenderRole === 'traveler') {
                              setHistoryModalNegotiation(existingNegotiation);
                            } else {
                              setSelectedPost(post);
                              setBidPrice(existingNegotiation.offeredPriceUSD);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer shadow-xs flex items-center space-x-1"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {existingNegotiation.lastSenderRole === 'traveler' ? 'question_answer' : 'edit_note'}
                          </span>
                          <span>
                            {existingNegotiation.lastSenderRole === 'traveler' 
                              ? (language === 'vi' ? 'Phản Hồi / Đề Xuất Giá' : 'Respond / Counter') 
                              : (language === 'vi' ? 'Cập Nhật Giá' : 'Update Bid')}
                          </span>
                        </button>
                      </>
                    ) : post.status === 'closed' ? (
                      <span className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center space-x-1 cursor-not-allowed">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span>{language === 'vi' ? 'Yêu Cầu Đã Đóng' : 'Post Closed'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isVerified) {
                            if (onOpenKYCModal) onOpenKYCModal();
                            return;
                          }
                          setSelectedPost(post);
                          setBidPrice(post.maxBudgetUSD);
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-xs shadow transition-all cursor-pointer flex items-center space-x-1 ${
                          isVerified
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : guideProfile.kycStatus === 'pending'
                            ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                            : 'bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isVerified ? 'payments' : guideProfile.kycStatus === 'pending' ? 'hourglass_top' : 'lock'}
                        </span>
                        <span>
                          {isVerified
                            ? (language === 'vi' ? 'Gửi Báo Giá' : 'Send Price Bid')
                            : guideProfile.kycStatus === 'pending'
                            ? (language === 'vi' ? 'Đang Chờ Duyệt ⏳' : 'Under Review ⏳')
                            : (language === 'vi' ? 'Cần Xác Thực Thẻ' : 'Verification Required')}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* SECTION 2: Active Price Negotiations & Offers */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
          <span className="material-symbols-outlined text-amber-500">handshake</span>
          <span>{language === 'vi' ? `Khu Vực Đang Thương Lượng Giá (${myNegotiations.length})` : `Active Price Negotiation Hub (${myNegotiations.length})`}</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {language === 'vi'
            ? 'Thương lượng giá trực tiếp với du khách trước khi xác nhận đơn đặt tour.'
            : 'Negotiate prices directly with travelers before confirming tour bookings.'}
        </p>

        {!isVerified && myNegotiations.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center space-x-2">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0">
              {guideProfile.kycStatus === 'pending' ? 'hourglass_top' : 'lock'}
            </span>
            <span>
              {guideProfile.kycStatus === 'pending'
                ? (language === 'vi' ? 'Hồ sơ xác thực thẻ của bạn đang được Admin duyệt. Bạn sẽ có thể đồng ý báo giá sau khi được duyệt.' : 'Your License Verification is currently under admin review. Accepting offers will be enabled once approved.')
                : (language === 'vi' ? 'Cần xác thực thẻ hướng dẫn viên để chấp nhận hoặc phản hồi đề xuất giá trong thương lượng.' : 'License verification is required to accept or send counter offers in negotiations.')}
            </span>
          </div>
        )}

        {myNegotiations.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            {language === 'vi' ? 'Hiện không có cuộc thương lượng giá nào đang diễn ra.' : 'No active price negotiations right now.'}
          </p>
        ) : (
          <div className="space-y-4">
            {myNegotiations.map((neg) => (
              <div key={neg.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {language === 'vi' ? 'Du khách:' : 'Traveler:'} {neg.travelerName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      neg.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      neg.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {neg.status === 'accepted' ? (language === 'vi' ? 'Đã Chấp Nhận' : 'Accepted') :
                       neg.status === 'countered' ? (language === 'vi' ? 'Đã Đề Xuất Lại' : 'Countered') : neg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    {language === 'vi' ? 'Giá Đề Xuất Hiện Tại:' : 'Current Offer Price:'} <strong className="text-emerald-700 text-sm">${neg.offeredPriceUSD} USD</strong>
                  </p>
                  {neg.messages && neg.messages.length > 0 && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200">
                      "{neg.messages[neg.messages.length - 1]?.text}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setHistoryModalNegotiation(neg)}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs cursor-pointer shadow-xs flex items-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-sm">history_edu</span>
                    <span>{language === 'vi' ? 'Lịch Sử & Nhắn Tin' : 'History & Chat'}</span>
                  </button>

                  {neg.status !== 'accepted' && (
                    <>
                      {neg.lastSenderRole === 'guide' ? (
                        <div className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                          <span className="material-symbols-outlined text-sm font-bold animate-pulse">hourglass_empty</span>
                          <span>{language === 'vi' ? 'Đang chờ du khách phản hồi...' : 'Awaiting traveler response...'}</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              if (!isVerified) {
                                if (onOpenKYCModal) onOpenKYCModal();
                                return;
                              }
                              onRespondNegotiation(neg.id, 'accept', undefined, 'Accepted offer price!', 'guide');
                            }}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-sm ${
                              isVerified
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : guideProfile.kycStatus === 'pending'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {isVerified
                              ? `${language === 'vi' ? 'Đồng ý' : 'Accept'} $${neg.offeredPriceUSD}`
                              : guideProfile.kycStatus === 'pending'
                              ? (language === 'vi' ? '⏳ Đang Chờ Duyệt' : '⏳ Under Review')
                              : (language === 'vi' ? '🔒 Cần Xác Thực' : '🔒 Verify First')}
                          </button>
                          <button
                            onClick={() => {
                              if (!isVerified) {
                                if (onOpenKYCModal) onOpenKYCModal();
                                return;
                              }
                              setCounteringOfferId(neg.id);
                              setCounterPrice(neg.offeredPriceUSD + 5);
                            }}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-sm ${
                              isVerified ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {language === 'vi' ? 'Đề Xuất Giá Khác' : 'Counter Offer'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Direct Incoming Bookings Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
          <span className="material-symbols-outlined text-emerald-600">confirmation_number</span>
          <span>{language === 'vi' ? `Danh Sách Đơn Đặt Tour Đã Xác Nhận (${myBookings.length})` : `Confirmed Tour Bookings (${myBookings.length})`}</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {language === 'vi' ? 'Các chuyến đi tour được giao cho bạn từ du khách hoặc công ty du lịch.' : 'Tour bookings assigned to you from travelers or tour companies.'}
        </p>

        <div className="space-y-3">
          {myBookings.map((b) => (
            <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="font-extrabold text-slate-900 text-sm">{b.tourTitle}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    b.paymentStatus === 'released' ? 'bg-emerald-100 text-emerald-800' :
                    b.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {b.paymentStatus === 'released' 
                      ? (language === 'vi' ? '✅ Đã Giải Ngân Vào Ví' : '✅ Released to Wallet') 
                      : b.paymentStatus === 'refunded' 
                      ? (language === 'vi' ? '↩️ Đã Hoàn Tiền' : '↩️ Refunded') 
                      : (language === 'vi' ? '🛡️ Đang Khóa Ký Quỹ Escrow' : '🛡️ Held in Escrow')}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {language === 'vi' ? 'Du khách:' : 'Traveler:'} {b.travelerName} • {language === 'vi' ? 'Điểm đón:' : 'Pickup:'} {b.pickupLocation}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-emerald-700">${b.totalPriceUSD} USD</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold">
                    {language === 'vi' ? 'Mã PIN Khởi Hành:' : 'Safety PIN:'} {b.pinCode}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {language === 'vi'
                      ? `Xác Nhận 2 Bên: Du khách ${b.travelerConfirmedCompletion ? '✓' : '⏳'} | HDV ${b.guideConfirmedCompletion ? '✓' : '⏳'}`
                      : `Dual Acceptance: Traveler ${b.travelerConfirmedCompletion ? '✓' : '⏳'} | Guide ${b.guideConfirmedCompletion ? '✓' : '⏳'}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase">
                  {b.status === 'matched' ? (language === 'vi' ? 'ĐÃ GHÉP ĐƠN' : 'MATCHED') :
                   b.status === 'en_route' ? (language === 'vi' ? 'ĐANG DI CHUYỂN' : 'EN ROUTE') :
                   b.status === 'in_progress' ? (language === 'vi' ? 'ĐANG DIỄN RA' : 'IN PROGRESS') :
                   b.status === 'completed' ? (language === 'vi' ? 'ĐÃ HOÀN THÀNH' : 'COMPLETED') :
                   (b.status || 'matched').replace('_', ' ')}
                </span>

                <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                  <AddToGoogleCalendarButton
                    payload={{
                      title: b.tourTitle,
                      dateStr: b.scheduledTime,
                      timeRangeStr: b.scheduledTime,
                      partnerName: b.travelerName,
                      partnerRole: 'traveler',
                      priceUSD: b.totalPriceUSD,
                      pinCode: b.pinCode,
                      location: b.pickupLocation,
                      bookingId: b.id
                    }}
                    variant="outline"
                    size="sm"
                    language={language}
                  />

                  <button
                    type="button"
                    onClick={() => setSelectedHubBooking(b)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all flex items-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    <span>Tour Pass & Hub</span>
                  </button>

                  {b.status === 'matched' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus ? onUpdateStatus(b.id, 'en_route') : onAcceptBooking(b.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all flex items-center space-x-1"
                      >
                        <span>🛵</span>
                        <span>{language === 'vi' ? 'HDV Đang Đến' : 'Guide En Route'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAcceptBooking(b.id)}
                        className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                      >
                        <span>🎒</span>
                        <span>{language === 'vi' ? 'Bắt Đầu Tour' : 'Start Tour'}</span>
                      </button>
                    </>
                  )}

                  {b.status === 'en_route' && (
                    <button
                      type="button"
                      onClick={() => onAcceptBooking(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                    >
                      <span>🎒</span>
                      <span>{language === 'vi' ? 'Đã Đến & Bắt Đầu Tour' : 'Arrived & Start Tour'}</span>
                    </button>
                  )}

                  {onConfirmCompletion && (
                    b.status === 'completed' ? (
                      b.guideConfirmedCompletion && b.travelerConfirmedCompletion ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1">
                          <span className="material-symbols-outlined text-sm text-emerald-700">task_alt</span>
                          <span>{language === 'vi' ? '✓ Đã Hoàn Tất & Giải Ngân' : '✓ Completed & Escrow Released'}</span>
                        </span>
                      ) : b.guideConfirmedCompletion ? (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center space-x-1">
                          <span className="material-symbols-outlined text-sm text-amber-700">hourglass_top</span>
                          <span>{language === 'vi' ? '✓ Bạn Đã Xác Nhận (Chờ Du Khách)' : '✓ You Accepted (Awaiting Traveler)'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBookingToConfirmCompletion(b)}
                          className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
                        >
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>{language === 'vi' ? 'Xác Nhận Tour Hoàn Thành' : 'Accept Tour Completed'}</span>
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBookingToConfirmCompletion(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
                          b.guideConfirmedCompletion
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {b.guideConfirmedCompletion ? 'check_circle' : 'verified'}
                        </span>
                        <span>
                          {b.guideConfirmedCompletion
                            ? (language === 'vi' ? '✓ Bạn Đã Xác Nhận' : '✓ You Accepted Completion')
                            : (language === 'vi' ? 'Xác Nhận Tour Hoàn Thành' : 'Accept Tour Completed')}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Bid Modal with Comprehensive Traveler Details */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative border border-slate-100 space-y-5 my-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            {/* Modal Title */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800 material-symbols-outlined text-base">
                  local_offer
                </span>
                <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  {language === 'vi' ? 'Gửi Báo Giá / Đấu Giá Tour' : 'Send Price Quote / Bid'}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'vi' 
                  ? 'Xem chi tiết yêu cầu chuyến đi của khách và gửi báo giá cạnh tranh' 
                  : 'Review complete traveler request details & submit your competitive quote'}
              </p>
            </div>

            {/* Traveler Profile Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-teal-50/40 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={selectedPost.travelerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'}
                  alt={selectedPost.travelerName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h5 className="font-extrabold text-slate-900 text-sm truncate">
                    {selectedPost.travelerName || 'Traveler'}
                  </h5>
                  <p className="text-xs text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                    <span className="material-symbols-outlined text-xs text-teal-600">location_on</span>
                    <span>{selectedPost.city || 'Vietnam'}</span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(selectedPost.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              {selectedPost.depositStatus === 'paid_in_escrow' && (
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10.5px] font-black">
                    <span className="material-symbols-outlined text-xs text-emerald-700">verified_user</span>
                    <span>${selectedPost.depositAmountUSD || 10} Escrow</span>
                  </span>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    {language === 'vi' ? 'Đã Ký Quỹ Đảm Bảo' : 'Verified Traveler'}
                  </p>
                </div>
              )}
            </div>

            {/* Comprehensive Traveler Request Details */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="border-b border-slate-200/80 pb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  {language === 'vi' ? 'Chuyến Đi Yêu Cầu' : 'Requested Tour'}
                </span>
                <h4 className="font-black text-slate-900 text-base leading-snug">
                  {selectedPost.title}
                </h4>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Spoken Language */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                    {language === 'vi' ? 'Ngôn Ngữ Yêu Cầu' : 'Preferred Language'}
                  </span>
                  <span className="font-extrabold text-amber-900 flex items-center space-x-1 text-xs">
                    <span>
                      {formatLanguageWithFlag(selectedPost.preferredLanguage || (selectedPost.preferredLanguages && selectedPost.preferredLanguages[0]) || 'English', language === 'vi')}
                    </span>
                  </span>
                </div>

                {/* Budget Range */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                    {language === 'vi' ? 'Ngân Sách Dự Kiến' : 'Target Budget'}
                  </span>
                  <span className="font-black text-teal-700 text-xs sm:text-sm">
                    ${selectedPost.minBudgetUSD} - ${selectedPost.maxBudgetUSD} USD
                  </span>
                </div>

                {/* Duration & Group */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                    {language === 'vi' ? 'Thời Lượng & Số Khách' : 'Duration & Group'}
                  </span>
                  <span className="font-extrabold text-slate-800 text-xs">
                    ⏱️ {selectedPost.durationHours || 3}h • 👥 {selectedPost.groupSize} {language === 'vi' ? 'khách' : 'travelers'}
                  </span>
                </div>
              </div>

              {/* Requested Dates / Schedule Slots */}
              {selectedPost.scheduleSlots && selectedPost.scheduleSlots.length > 0 ? (
                <div className="p-3 rounded-xl bg-white border border-teal-200">
                  <span className="text-[10.5px] font-bold text-teal-800 flex items-center space-x-1 mb-1.5">
                    <span className="material-symbols-outlined text-xs">calendar_month</span>
                    <span>{language === 'vi' ? 'Khung Giờ Đã Chọn:' : 'Requested Schedule Slots:'}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.scheduleSlots.map((slot, sIdx) => (
                      <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-300 text-teal-950 font-bold text-[11px]">
                        📅 {slot.dateStr} ({slot.startTime} - {slot.endTime})
                      </span>
                    ))}
                  </div>
                </div>
              ) : selectedPost.preferredDate && (
                <div className="p-2.5 rounded-xl bg-white border border-teal-200 text-xs text-teal-900 font-bold flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-sm text-teal-700">event</span>
                  <span>{selectedPost.preferredDate}</span>
                </div>
              )}

              {/* Full Traveler Description & Requirements */}
              {selectedPost.description && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <span className="text-[10.5px] font-bold text-amber-900 flex items-center space-x-1">
                    <span className="material-symbols-outlined text-xs">notes</span>
                    <span>{language === 'vi' ? 'Yêu Cầu & Ghi Chú Chi Tiết Từ Khách:' : 'Traveler Notes & Special Requirements:'}</span>
                  </span>
                  <p className="text-slate-800 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                    "{selectedPost.description}"
                  </p>
                </div>
              )}
            </div>

            {/* Bidding & Price Proposal Form */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  {language === 'vi' ? 'Giá Báo Của Bạn ($ USD Toàn Chuyến)' : 'Your Price Quote ($ USD Total)'}
                </label>
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className="text-slate-400">{language === 'vi' ? 'Chọn nhanh:' : 'Quick:'}</span>
                  <button
                    type="button"
                    onClick={() => setBidPrice(selectedPost.minBudgetUSD)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer text-[10px]"
                  >
                    ${selectedPost.minBudgetUSD} (Min)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBidPrice(Math.round((selectedPost.minBudgetUSD + selectedPost.maxBudgetUSD) / 2))}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer text-[10px]"
                  >
                    ${Math.round((selectedPost.minBudgetUSD + selectedPost.maxBudgetUSD) / 2)} (Avg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBidPrice(selectedPost.maxBudgetUSD)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer text-[10px]"
                  >
                    ${selectedPost.maxBudgetUSD} (Max)
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-black text-slate-400 text-base">$</span>
                <input
                  type="number"
                  min="10"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-16 py-2.5 bg-white border border-teal-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  placeholder="e.g. 50"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">USD</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>{language === 'vi' ? 'Lời Nhắn / Kế Hoạch Đề Xuất Cho Khách' : 'Proposal Note / Message to Traveler'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {language === 'vi' ? 'Nêu rõ lịch trình, phương tiện, hỗ trợ ngôn ngữ' : 'Highlight itinerary, transport, language support'}
                  </span>
                </label>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder={language === 'vi' ? 'Chào bạn! Tôi là hướng dẫn viên địa phương đã được xác thực...' : 'Hello! I am an official licensed guide in this city. I will provide full commentary in your preferred language...'}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 font-medium transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmBid}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-98 text-white font-black text-xs shadow-lg shadow-teal-600/20 cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>{language === 'vi' ? 'Gửi Báo Giá Cho Khách Ngay' : 'Submit Price Quote to Traveler'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counteringOfferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative border border-slate-100 space-y-4 my-auto">
            <button
              onClick={() => setCounteringOfferId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h4 className="font-extrabold text-slate-900 text-lg">
              {language === 'vi' ? 'Gửi Giá Đề Xuất Lại' : 'Send Counter Offer'}
            </h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Giá Đề Xuất Lại ($ USD)' : 'Counter Price ($ USD)'}
              </label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                onRespondNegotiation(counteringOfferId, 'counter', counterPrice, `Counter offer price: $${counterPrice} USD`, 'guide');
                setCounteringOfferId(null);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl cursor-pointer"
            >
              {language === 'vi' ? 'Gửi Giá Đề Xuất' : 'Send Counter Offer'}
            </button>
          </div>
        </div>
      )}

      {/* Negotiation History & Chat Modal */}
      <NegotiationHistoryModal
        isOpen={!!historyModalNegotiation}
        onClose={() => setHistoryModalNegotiation(null)}
        negotiation={activeNegotiation}
        currentUserRole="guide"
        isVerifiedGuide={isVerified}
        language={language}
        onRespondNegotiation={handleRespondNegotiationWithSync}
        onOpenKYCModal={onOpenKYCModal}
      />

      {/* Tour Booking Central Hub Modal */}
      <TourBookingHubModal
        isOpen={!!selectedHubBooking}
        onClose={() => setSelectedHubBooking(null)}
        booking={selectedHubBooking ? (bookings.find(b => b.id === selectedHubBooking.id) || selectedHubBooking) : null}
        allBookings={bookings}
        currentUserRole="guide"
        currentUser={{ id: guideProfile.id, name: guideProfile.name, role: 'guide' } as any}
        onUpdateStatus={onUpdateStatus}
        onConfirmCompletion={onConfirmCompletion}
        language={language}
      />

      {/* Completion Confirmation Dialog Modal for Guide */}
      {bookingToConfirmCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up relative">
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

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Tên tour:' : 'Tour:'}</span>
                <span className="font-bold text-slate-900 truncate max-w-[210px]">{bookingToConfirmCompletion.tourTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Tổng tiền tour:' : 'Agreed Amount:'}</span>
                <span className="font-black text-emerald-700 font-mono text-sm">${bookingToConfirmCompletion.totalPriceUSD} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Du khách:' : 'Traveler:'}</span>
                <span className="font-bold text-slate-800">{bookingToConfirmCompletion.travelerName || 'Traveler'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-[11px] space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                <span className="material-symbols-outlined text-xs text-amber-700">info</span>
                <span>{language === 'vi' ? 'Lưu ý giải ngân HDV' : 'Guide Escrow Release Note'}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {language === 'vi'
                  ? `Bạn đang xác nhận chuyến đi này đã hoàn tất. Hệ thống sẽ ghi nhận xác nhận của bạn và thông báo cho du khách (${bookingToConfirmCompletion.travelerName || 'Traveler'}) xác nhận để mở khóa giải ngân $${bookingToConfirmCompletion.totalPriceUSD} USD vào tài khoản của bạn.`
                  : `You are confirming that this tour is completed. The traveler (${bookingToConfirmCompletion.travelerName || 'Traveler'}) will be notified to confirm and release the $${bookingToConfirmCompletion.totalPriceUSD} USD payout to your account.`}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookingToConfirmCompletion(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Hủy / Quay lại' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirmCompletion && bookingToConfirmCompletion) {
                    onConfirmCompletion(bookingToConfirmCompletion.id, 'guide');
                  }
                  setBookingToConfirmCompletion(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{language === 'vi' ? 'Xác Nhận Hoàn Thành' : 'Yes, Confirm Completion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
