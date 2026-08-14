import React, { useState } from 'react';
import { GuideProfile, TourBooking, TravelerPostRequest, NegotiationOffer } from '../../types';
import { NegotiationHistoryModal } from '../../components/NegotiationHistoryModal';
import { PortalEventsCalendar } from '../../components/PortalEventsCalendar';
import { TourBookingHubModal } from '../../components/TourBookingHubModal';
import { Language } from '../../lib/translations';

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
  language = 'en'
}) => {
  const isVerified = guideProfile.kycStatus === 'verified' || guideProfile.verified;

  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'board'>('calendar');

  const [selectedPost, setSelectedPost] = useState<TravelerPostRequest | null>(null);
  const [bidPrice, setBidPrice] = useState<number>(50);
  const [bidMessage, setBidMessage] = useState<string>('Hello! I am a verified licensed local guide. I can host your custom tour!');

  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(45);

  const [historyModalNegotiation, setHistoryModalNegotiation] = useState<NegotiationOffer | null>(null);
  const [selectedHubBooking, setSelectedHubBooking] = useState<TourBooking | null>(null);

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
    b => b.guideId === guideProfile.id || b.guideName?.toLowerCase() === guideProfile.fullName?.toLowerCase()
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
    n => n.guideId === guideProfile.id || n.guideName?.toLowerCase() === guideProfile.fullName?.toLowerCase()
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'calendar'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>📅 {language === 'vi' ? 'Lịch Sự Kiện Tour & Thương Lượng' : 'Events Calendar'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('board')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'board'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">campaign</span>
            <span>📋 {language === 'vi' ? 'Bảng Báo Giá & Quản Lý Đơn' : 'Live Bidding & Management Board'}</span>
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
          bookings={myBookings}
          negotiations={myNegotiations}
          posts={posts}
          onOpenNegotiationModal={(neg) => setHistoryModalNegotiation(neg)}
          onOpenBookingDetail={(b) => setSelectedHubBooking(b)}
          onOpenPostDetail={(p) => setSelectedPost(p)}
          onRespondNegotiation={handleRespondNegotiationWithSync}
          onUpdateStatus={onUpdateStatus}
          onConfirmCompletion={onConfirmCompletion}
          language={language}
        />
      )}

      {/* SECTION 1: Open Traveler Requests in City (Bidding Hub) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">campaign</span>
              <span>Live Traveler Requests Board</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Answer Travelers & Tour Company Custom Requests
            </h3>
            <p className="text-xs text-slate-500">
              Travelers post custom trip requirements. Search by city, budget, or keywords and send direct price offers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border">
              Showing {filteredPosts.length} of {posts.length} Custom Requests
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
                placeholder="Search request title, details, traveler name, languages..."
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
                <option value="all">📍 All Cities ({posts.length})</option>
                {guideProfile.city && (
                  <option value={guideProfile.city.toLowerCase()}>
                    ⭐ My City ({guideProfile.city})
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
                <option value="newest">🕒 Sort: Newest First</option>
                <option value="budget_high">💰 Sort: Highest Budget First</option>
                <option value="budget_low">🏷️ Sort: Lowest Budget First</option>
              </select>
            </div>
          </div>

          {/* Detailed Criteria Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/70 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Quick City Buttons */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-500 text-[11px]">Quick Location:</span>
                <button
                  type="button"
                  onClick={() => setSelectedCity('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCity === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Cities
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
                <span className="text-[11px] font-bold text-slate-500">Max Budget:</span>
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
                <span className="text-[11px] font-bold text-slate-500">Group Size:</span>
                <select
                  value={minGroupSize}
                  onChange={(e) => setMinGroupSize(e.target.value)}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">Any</option>
                  <option value="1">1+ Traveler</option>
                  <option value="2">2+ Travelers</option>
                  <option value="4">4+ Travelers</option>
                  <option value="6">6+ Travelers</option>
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
                <span>Reset Filters</span>
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
                    <strong>Verification Under Admin Review ⏳:</strong> Your Tour Guide License Card & CCCD submission is currently being reviewed. Bidding will be enabled upon approval.
                  </>
                ) : (
                  <>
                    <strong>Verification Required to Bid:</strong> You must submit your Tour Guide License Card & CCCD to place bids on traveler posts.
                  </>
                )}
              </span>
            </div>
            {onOpenKYCModal && (
              <button
                onClick={onOpenKYCModal}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-sm"
              >
                {guideProfile.kycStatus === 'pending' ? 'View Application ⏳' : 'Submit Verification 📜'}
              </button>
            )}
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">find_in_page</span>
            <p className="text-slate-600 font-bold text-sm">No custom requests found matching your filter criteria.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Try clearing your keyword search or adjusting location and budget constraints.</p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Reset Search Filters
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
                            <span>Closed</span>
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-800 text-[10px] font-black uppercase flex items-center space-x-1">
                          <span className="material-symbols-outlined text-xs text-teal-700">location_on</span>
                          <span>{post.city}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase">
                          Budget: ${post.minBudgetUSD}-${post.maxBudgetUSD}
                        </span>
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
                                • ⏱️ {post.durationHours} Hours
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
                            • ⏱️ {post.durationHours} Hours
                          </span>
                        )}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                    <span>👥 {post.groupSize} Travelers</span>
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
                          <span>{existingNegotiation.lastSenderRole === 'traveler' ? '📩 Traveler Negotiated:' : '🤝 Active Bid:'}</span>
                          <span className="text-emerald-700 font-black">${existingNegotiation.offeredPriceUSD} USD</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          existingNegotiation.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          existingNegotiation.lastSenderRole === 'traveler' ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' :
                          'bg-teal-100 text-teal-900 border border-teal-300'
                        }`}>
                          {existingNegotiation.status === 'accepted'
                            ? 'Accepted'
                            : existingNegotiation.lastSenderRole === 'traveler'
                            ? 'Awaiting Your Response ⏳'
                            : 'Offer Sent ⏳'}
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
                  <span className="text-xs font-bold text-teal-700">{post.bidsCount || (existingNegotiation ? 1 : 0)} Bids Received</span>
                  
                  <div className="flex items-center space-x-2">
                    {existingNegotiation ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setHistoryModalNegotiation(existingNegotiation)}
                          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <span className="material-symbols-outlined text-sm">history_edu</span>
                          <span>History & Chat</span>
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
                            {existingNegotiation.lastSenderRole === 'traveler' ? 'Respond / Counter' : 'Update Bid'}
                          </span>
                        </button>
                      </>
                    ) : post.status === 'closed' ? (
                      <span className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center space-x-1 cursor-not-allowed">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span>Post Closed</span>
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
                            ? 'Send Price Bid'
                            : guideProfile.kycStatus === 'pending'
                            ? 'Under Review ⏳'
                            : 'Verification Required'}
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
          <span>Active Price Negotiation Hub ({myNegotiations.length})</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Negotiate prices directly with travelers before confirming tour bookings.
        </p>

        {!isVerified && myNegotiations.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center space-x-2">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0">
              {guideProfile.kycStatus === 'pending' ? 'hourglass_top' : 'lock'}
            </span>
            <span>
              {guideProfile.kycStatus === 'pending'
                ? 'Your License Verification is currently under admin review. Accepting offers will be enabled once approved.'
                : 'License verification is required to accept or send counter offers in negotiations.'}
            </span>
          </div>
        )}

        {myNegotiations.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active price negotiations right now.</p>
        ) : (
          <div className="space-y-4">
            {myNegotiations.map((neg) => (
              <div key={neg.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">Traveler: {neg.travelerName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      neg.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      neg.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {neg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Current Offer Price: <strong className="text-emerald-700 text-sm">${neg.offeredPriceUSD} USD</strong>
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
                    <span>History & Chat</span>
                  </button>

                  {neg.status !== 'accepted' && (
                    <>
                      {neg.lastSenderRole === 'guide' ? (
                        <div className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                          <span className="material-symbols-outlined text-sm font-bold animate-pulse">hourglass_empty</span>
                          <span>Awaiting traveler response...</span>
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
                              ? `Accept $${neg.offeredPriceUSD}`
                              : guideProfile.kycStatus === 'pending'
                              ? '⏳ Under Review'
                              : '🔒 Verify First'}
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
                            Counter Offer
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
          <span>Confirmed Tour Bookings ({myBookings.length})</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Tour bookings assigned to you from travelers or tour companies.
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
                    {b.paymentStatus === 'released' ? '✅ Released to Wallet' : b.paymentStatus === 'refunded' ? '↩️ Refunded' : '🛡️ Held in Escrow'}
                  </span>
                </div>

                <p className="text-xs text-slate-500">Traveler: {b.travelerName} • Pickup: {b.pickupLocation}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-emerald-700">${b.totalPriceUSD} USD</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold">
                    Safety PIN: {b.pinCode}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Dual Acceptance: Traveler {b.travelerConfirmedCompletion ? '✓' : '⏳'} | Guide {b.guideConfirmedCompletion ? '✓' : '⏳'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase">
                  {(b.status || 'matched').replace('_', ' ')}
                </span>

                <div className="flex items-center space-x-2">
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
                        <span>Guide En Route</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAcceptBooking(b.id)}
                        className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                      >
                        <span>🎒</span>
                        <span>Start Tour</span>
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
                      <span>Arrived & Start Tour</span>
                    </button>
                  )}

                  {b.status !== 'completed' && onConfirmCompletion && (
                    <button
                      type="button"
                      onClick={() => onConfirmCompletion(b.id, 'guide')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
                        b.guideConfirmedCompletion
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {b.guideConfirmedCompletion ? 'check_circle' : 'verified'}
                      </span>
                      <span>{b.guideConfirmedCompletion ? '✓ You Accepted Completion' : 'Accept Tour Completed'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bid Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative border border-slate-100 space-y-4 my-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h4 className="font-extrabold text-slate-900 text-lg">{language === 'vi' ? 'Gửi Báo Giá / Đấu Giá Tour' : 'Send Price Quote / Bid'}</h4>
            <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-100 text-xs space-y-1">
              <p className="font-extrabold text-teal-950 flex items-center space-x-1.5">
                <span>👤 {selectedPost.travelerName}</span>
                <span>•</span>
                <span className="text-teal-700 font-bold">{selectedPost.title}</span>
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-teal-800 pt-0.5">
                <span className="font-bold">
                  📅 {selectedPost.scheduleSlots?.[0] ? `${selectedPost.scheduleSlots[0].dateStr} (${selectedPost.scheduleSlots[0].startTime} - ${selectedPost.scheduleSlots[0].endTime})` : selectedPost.preferredDate || 'Flexible date'}
                </span>
                <span>•</span>
                <span className="font-bold">👥 {selectedPost.groupSize} {language === 'vi' ? 'khách' : 'guests'}</span>
                <span>•</span>
                <span className="font-bold">💰 {language === 'vi' ? 'Ngân sách' : 'Budget'}: ${selectedPost.minBudgetUSD} - ${selectedPost.maxBudgetUSD}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Offered Price ($ USD)</label>
              <input
                type="number"
                min="10"
                value={bidPrice}
                onChange={(e) => setBidPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Negotiation Note / Offer Message</label>
              <textarea
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 h-20"
              />
            </div>

            <button
              onClick={handleConfirmBid}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg cursor-pointer"
            >
              Submit Price Quote to Traveler
            </button>
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

            <h4 className="font-extrabold text-slate-900 text-lg">Send Counter Offer</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Counter Price ($ USD)</label>
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
              Send Counter Offer
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
        onRespondNegotiation={handleRespondNegotiationWithSync}
        onOpenKYCModal={onOpenKYCModal}
      />

      {/* Tour Booking Central Hub Modal */}
      <TourBookingHubModal
        isOpen={!!selectedHubBooking}
        onClose={() => setSelectedHubBooking(null)}
        booking={selectedHubBooking ? (bookings.find(b => b.id === selectedHubBooking.id) || selectedHubBooking) : null}
        allBookings={bookings}
        currentUser={null}
        onUpdateStatus={onUpdateStatus}
        onConfirmCompletion={onConfirmCompletion}
        language={language}
      />

    </div>
  );
};
