import React, { useState } from 'react';
import { TravelerPostRequest, NegotiationOffer, TourBooking } from '../../types';
import { Language, translations } from '../../lib/translations';
import { NegotiationHistoryModal } from '../../components/NegotiationHistoryModal';

interface TravelerPostsAndBidsProps {
  posts: TravelerPostRequest[];
  negotiations: NegotiationOffer[];
  bookings: TourBooking[];
  onRespondNegotiation: (offerId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number, message?: string) => void;
  onOpenNewPostModal: () => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  language?: Language;
}

export const TravelerPostsAndBids: React.FC<TravelerPostsAndBidsProps> = ({
  posts,
  negotiations,
  bookings,
  onRespondNegotiation,
  onOpenNewPostModal,
  onConfirmCompletion,
  language = 'en'
}) => {
  const t = translations[language] || translations.en;
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(45);

  // Custom detailed view for traveler request bids
  const [viewingBidsPost, setViewingBidsPost] = useState<TravelerPostRequest | null>(null);
  const [counteringBidId, setCounteringBidId] = useState<string | null>(null);
  const [bidCounterPrice, setBidCounterPrice] = useState<number>(0);

  const [historyModalNegotiation, setHistoryModalNegotiation] = useState<NegotiationOffer | null>(null);

  // Filter and sort state for open posts
  const [postSearchQuery, setPostSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [postSortBy, setPostSortBy] = useState<'newest' | 'oldest' | 'bids_high' | 'budget_high'>('newest');

  const availableCities = React.useMemo(() => {
    const set = new Set<string>();
    (posts || []).forEach(p => {
      if (p.city) set.add(p.city);
    });
    return Array.from(set).sort();
  }, [posts]);

  const filteredAndSortedPosts = React.useMemo(() => {
    return (posts || [])
      .filter(post => {
        // Status filter
        if (selectedStatusFilter !== 'all' && post.status !== selectedStatusFilter) {
          return false;
        }
        // City filter
        if (selectedCityFilter !== 'all' && post.city?.toLowerCase() !== selectedCityFilter.toLowerCase()) {
          return false;
        }
        // Search query
        if (postSearchQuery.trim() !== '') {
          const q = postSearchQuery.toLowerCase().trim();
          const matchTitle = post.title?.toLowerCase().includes(q);
          const matchDesc = post.description?.toLowerCase().includes(q);
          const matchCity = post.city?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCity) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (postSortBy === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (postSortBy === 'bids_high') {
          return getBidsForPost(b).length - getBidsForPost(a).length;
        }
        if (postSortBy === 'budget_high') {
          return b.maxBudgetUSD - a.maxBudgetUSD;
        }
        // Default: 'newest' (Newest to Oldest)
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id).localeCompare(String(a.id));
      });
  }, [posts, selectedStatusFilter, selectedCityFilter, postSearchQuery, postSortBy, negotiations]);

  const hasActivePostFilters = postSearchQuery !== '' || selectedStatusFilter !== 'all' || selectedCityFilter !== 'all' || postSortBy !== 'newest';

  const handleResetPostFilters = () => {
    setPostSearchQuery('');
    setSelectedStatusFilter('all');
    setSelectedCityFilter('all');
    setPostSortBy('newest');
  };

  const getBidsForPost = (post: TravelerPostRequest) => {
    if (!post) return [];
    return negotiations.filter(n => {
      if (!n) return false;
      // 1. Direct exact match by postId
      if (n.postId && post.id && String(n.postId) === String(post.id)) return true;
      
      // 2. Fallback for legacy negotiations without postId
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
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: Traveler Posted Requests */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">campaign</span>
              <span>{t.publishedRequestsBadge}</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {t.openPostsTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {t.openPostsSub}
            </p>
          </div>

          <button
            onClick={onOpenNewPostModal}
            className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>{t.createPostBtn}</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        {posts.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              {/* Search input */}
              <div className="md:col-span-5 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm kiếm tiêu đề, chi tiết, thành phố...' : 'Search post title, details, destination...'}
                  value={postSearchQuery}
                  onChange={(e) => setPostSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                {postSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPostSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* City Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedCityFilter}
                  onChange={(e) => setSelectedCityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">📍 {language === 'vi' ? 'Tất cả thành phố' : 'All Destinations'}</option>
                  {availableCities.map(c => (
                    <option key={c} value={c.toLowerCase()}>
                      📍 {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order Selector (Default newest to oldest) */}
              <div className="md:col-span-4">
                <select
                  value={postSortBy}
                  onChange={(e) => setPostSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                >
                  <option value="newest">🕒 {language === 'vi' ? 'Mới nhất đến cũ nhất' : 'Sort: Newest to Oldest'}</option>
                  <option value="oldest">⌛ {language === 'vi' ? 'Cũ nhất đến mới nhất' : 'Sort: Oldest to Newest'}</option>
                  <option value="bids_high">🏷️ {language === 'vi' ? 'Nhiều báo giá nhất' : 'Sort: Most Bids Received'}</option>
                  <option value="budget_high">💰 {language === 'vi' ? 'Ngân sách cao nhất' : 'Sort: Highest Budget'}</option>
                </select>
              </div>
            </div>

            {/* Quick Status Buttons & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/70 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-500 text-[11px] mr-1">
                  {language === 'vi' ? 'Trạng thái:' : 'Status:'}
                </span>
                {[
                  { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
                  { id: 'open', label: language === 'vi' ? 'Đang mở' : 'Open' },
                  { id: 'negotiating', label: language === 'vi' ? 'Đang thương lượng' : 'Negotiating' },
                  { id: 'booked', label: language === 'vi' ? 'Đã đặt' : 'Booked' },
                  { id: 'closed', label: language === 'vi' ? 'Đã đóng' : 'Closed' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatusFilter === st.id
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[11px] font-bold text-slate-400">
                  {language === 'vi' ? `Hiển thị ${filteredAndSortedPosts.length}/${posts.length} yêu cầu` : `Showing ${filteredAndSortedPosts.length} of ${posts.length} posts`}
                </span>

                {hasActivePostFilters && (
                  <button
                    type="button"
                    onClick={handleResetPostFilters}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-extrabold flex items-center space-x-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                  >
                    <span className="material-symbols-outlined text-xs">restart_alt</span>
                    <span>{language === 'vi' ? 'Đặt lại bộ lọc' : 'Reset Filters'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
            <span className="material-symbols-outlined text-3xl text-slate-300">post_add</span>
            <p className="text-xs font-bold mt-2">{t.noPostsYet}</p>
            <button
              onClick={onOpenNewPostModal}
              className="mt-3 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {t.postFirstBtn}
            </button>
          </div>
        ) : filteredAndSortedPosts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <span className="material-symbols-outlined text-3xl text-slate-400">find_in_page</span>
            <p className="text-xs font-bold mt-2 text-slate-700">
              {language === 'vi' ? 'Không tìm thấy yêu cầu nào phù hợp với bộ lọc.' : 'No open travel posts match your current search and filter criteria.'}
            </p>
            <button
              onClick={handleResetPostFilters}
              className="mt-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {language === 'vi' ? 'Đặt lại bộ lọc' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedPosts.map((post) => {
              const matchingBids = getBidsForPost(post);
              const totalBids = matchingBids.length;

              return (
                <div key={post.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-sm">{post.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        post.status === 'open' ? 'bg-teal-100 text-teal-800' :
                        post.status === 'negotiating' ? 'bg-amber-100 text-amber-800' :
                        post.status === 'booked' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{post.description}</p>
                    
                    {post.preferredDate && (
                      <div className="inline-flex items-center space-x-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        <span>{post.preferredDate}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400">
                      📍 {post.city} • Budget: ${post.minBudgetUSD}-${post.maxBudgetUSD} USD • {totalBids} {t.bidsReceived}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingBidsPost(post)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>{language === 'vi' ? `Xem Báo Giá (${totalBids})` : `View Bids (${totalBids})`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Price Negotiations & Bids Counter */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
          <span className="material-symbols-outlined text-amber-500">handshake</span>
          <span>{t.incomingBidsTitle} ({negotiations.length})</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {t.incomingBidsSub}
        </p>

        {negotiations.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{t.noBidsYet}</p>
        ) : (
          <div className="space-y-4">
            {negotiations.map((neg) => (
              <div key={neg.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-extrabold text-slate-900 text-sm">{neg.tourTitle || `Custom Guide Hire`}</span>
                    <span className="text-xs text-slate-600 font-bold">• {t.guideLabel}: {neg.guideName} (★ {neg.guideRating})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      neg.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {neg.status}
                    </span>
                  </div>

                  {/* Slot & Group size info if tour based */}
                  {neg.selectedSlot && (
                    <div className="flex items-center space-x-2 text-[11px] text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 w-fit">
                      <span>🗓️ {neg.selectedSlot.displayLabel || `${neg.selectedSlot.dateStr} (${neg.selectedSlot.startTime} - ${neg.selectedSlot.endTime})`}</span>
                      {neg.groupSize && <span>• 👥 {neg.groupSize} travelers</span>}
                    </div>
                  )}

                  <p className="text-xs text-slate-700">
                    {t.guideOfferedPrice}: <strong className="text-emerald-700 text-sm">${neg.offeredPriceUSD} USD</strong>
                    {neg.originalPriceUSD && neg.originalPriceUSD !== neg.offeredPriceUSD && (
                      <span className="text-slate-400 line-through text-[11px] ml-2">${neg.originalPriceUSD} USD</span>
                    )}
                  </p>
                  {neg.messages && neg.messages.length > 0 && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200">
                      "{neg.messages[neg.messages.length - 1]?.text}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setHistoryModalNegotiation(neg)}
                    className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs cursor-pointer shadow-xs flex items-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-sm">history_edu</span>
                    <span>{language === 'vi' ? 'Lịch Sử & Chat' : 'History & Chat'}</span>
                  </button>

                  {neg.status !== 'accepted' && (
                    <>
                      {neg.lastSenderRole === 'traveler' ? (
                        <div className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                          <span className="material-symbols-outlined text-sm font-bold animate-pulse">hourglass_empty</span>
                          <span>{language === 'vi' ? 'Đang đợi HDV phản hồi...' : 'Awaiting guide response...'}</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onRespondNegotiation(neg.id, 'accept', undefined, 'Deal accepted!')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                          >
                            {t.acceptOffer} ${neg.offeredPriceUSD}
                          </button>
                          <button
                            onClick={() => {
                              setCounteringOfferId(neg.id);
                              setCounterPrice(neg.offeredPriceUSD - 5);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                          >
                            {t.counterOffer}
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

      {/* SECTION 3: Active Traveler Bookings */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
          <span className="material-symbols-outlined text-emerald-600">confirmation_number</span>
          <span>{t.confirmedBookingsTitle} ({bookings.length})</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {t.confirmedBookingsSub}
        </p>

        {bookings.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{t.noBookingsYet}</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-extrabold text-slate-900 text-sm">{b.tourTitle}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      b.paymentStatus === 'released' ? 'bg-emerald-100 text-emerald-800' :
                      b.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {b.paymentStatus === 'released' ? '✅ Escrow Released' : b.paymentStatus === 'refunded' ? '↩️ Refunded' : '🛡️ Paid into Escrow'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">{t.assignedGuideLabel}: {b.guideName} • {t.pickupLabel}: {b.pickupLocation}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-emerald-700">${b.totalPriceUSD} USD</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold">
                      {t.safetyPinLabel}: {b.pinCode}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Dual Acceptance: Traveler {b.travelerConfirmedCompletion ? '✓' : '⏳'} | Guide {b.guideConfirmedCompletion ? '✓' : '⏳'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase">
                    {b.status.replace('_', ' ')}
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
                      <span>{b.travelerConfirmedCompletion ? '✓ You Accepted Completion' : 'Accept Tour Completed'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Counter Offer Modal */}
      {counteringOfferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 space-y-4">
            <button
              onClick={() => setCounteringOfferId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h4 className="font-extrabold text-slate-900 text-lg">{t.sendCounterOffer}</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.proposeCounterPrice}</label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                onRespondNegotiation(counteringOfferId, 'counter', counterPrice, `Counter offer price: $${counterPrice} USD`);
                setCounteringOfferId(null);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl cursor-pointer"
            >
              {t.sendCounterOffer}
            </button>
          </div>
        </div>
      )}

      {/* Guide Bids Detail Modal */}
      {viewingBidsPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setViewingBidsPost(null);
                setCounteringBidId(null);
              }}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Post Request Info */}
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold uppercase mb-2 border border-teal-100">
                <span className="material-symbols-outlined text-xs">campaign</span>
                <span>{language === 'vi' ? 'Thông Tin Yêu Cầu Của Bạn' : 'Your Original Custom Request'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {viewingBidsPost.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                <span>📍 {viewingBidsPost.city}</span>
                <span>⏱️ {viewingBidsPost.durationHours} {language === 'vi' ? 'Giờ' : 'Hours'}</span>
                <span>👥 {viewingBidsPost.groupSize} {language === 'vi' ? 'Khách' : 'Travelers'}</span>
                <span>💰 Budget: ${viewingBidsPost.minBudgetUSD}-${viewingBidsPost.maxBudgetUSD} USD</span>
              </p>
              
              <div className="mt-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {viewingBidsPost.description}
                </p>
                {viewingBidsPost.preferredDate && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-150 flex items-center space-x-2 text-[11px] text-teal-800 font-extrabold">
                    <span className="material-symbols-outlined text-sm">calendar_clock</span>
                    <span>{viewingBidsPost.preferredDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bids Title */}
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <span className="material-symbols-outlined text-teal-600 text-base">local_offer</span>
                <span>
                  {language === 'vi' ? 'Danh Sách Báo Giá Từ HDV Bản Địa' : 'Guide Offers & Bids Received'} (
                  {getBidsForPost(viewingBidsPost).length}
                  )
                </span>
              </h4>

              {/* Bids List */}
              {(() => {
                const bids = getBidsForPost(viewingBidsPost);
                if (bids.length === 0) {
                  return (
                    <div className="p-8 text-center bg-amber-50/50 border border-dashed border-amber-200 rounded-2xl text-slate-500">
                      <span className="material-symbols-outlined text-3xl text-amber-500">hourglass_empty</span>
                      <p className="text-xs font-bold mt-2">
                        {language === 'vi' ? 'Chưa nhận được báo giá nào cho yêu cầu này.' : 'No guide offers received yet for this request.'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {language === 'vi' ? 'Các hướng dẫn viên bản địa sẽ sớm gửi báo giá dịch vụ trực tiếp cho bạn.' : 'Local verified guides are reviewing and will post custom offers shortly!'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {bids.map((bid) => {
                      const isWaitingForGuide = bid.lastSenderRole === 'traveler';
                      const isAccepted = bid.status === 'accepted';
                      const isDeclined = bid.status === 'declined';

                      return (
                        <div key={bid.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3.5 hover:border-teal-200 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            {/* Guide Profile */}
                            <div className="flex items-center space-x-3">
                              <img
                                src={bid.guideAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                                alt={bid.guideName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-extrabold text-slate-900 text-xs sm:text-sm">{bid.guideName}</p>
                                <div className="flex items-center space-x-1 text-[10px] text-amber-500 font-extrabold">
                                  <span className="material-symbols-outlined text-xs font-bold">star</span>
                                  <span>{bid.guideRating || '5.0'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Offered Price */}
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase">{language === 'vi' ? 'BÁO GIÁ' : 'OFFERED PRICE'}</p>
                              <p className="text-base font-black text-emerald-600">${bid.offeredPriceUSD} USD</p>
                            </div>
                          </div>

                          {/* Guide Message */}
                          {bid.messages && bid.messages.length > 0 && (
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium italic relative">
                              "{bid.messages[bid.messages.length - 1].text}"
                            </div>
                          )}

                          {/* Status and Action Buttons */}
                          <div className="flex items-center justify-end gap-2 flex-wrap pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setHistoryModalNegotiation(bid)}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-black text-[11px] cursor-pointer transition-all flex items-center space-x-1"
                            >
                              <span className="material-symbols-outlined text-xs">history_edu</span>
                              <span>{language === 'vi' ? 'Lịch Sử & Chat' : 'History & Chat'}</span>
                            </button>
                            {isAccepted ? (
                              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center space-x-1">
                                <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                                <span>{language === 'vi' ? 'Đã Chấp Nhận & Đặt Lịch' : 'Accepted & Hired ✓'}</span>
                              </span>
                            ) : isDeclined ? (
                              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                                {language === 'vi' ? 'Đã Từ Chối' : 'Declined'}
                              </span>
                            ) : isWaitingForGuide ? (
                              <div className="text-[10px] text-amber-600 font-extrabold bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg flex items-center space-x-1 animate-pulse">
                                <span className="material-symbols-outlined text-xs font-bold">hourglass_empty</span>
                                <span>{language === 'vi' ? 'Đang đợi HDV phản hồi...' : 'Awaiting guide response...'}</span>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRespondNegotiation(bid.id, 'accept', undefined, 'Deal accepted!');
                                    setViewingBidsPost(null);
                                  }}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
                                >
                                  {language === 'vi' ? 'Chấp Nhận & Thuê' : 'Accept & Hire'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCounteringBidId(bid.id);
                                    setBidCounterPrice(bid.offeredPriceUSD - 5);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-[11px] rounded-lg cursor-pointer transition-all"
                                >
                                  {language === 'vi' ? 'Thương Lượng' : 'Counter Offer'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    onRespondNegotiation(bid.id, 'decline', undefined, 'Offer declined');
                                    setViewingBidsPost(null);
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold text-[11px] rounded-lg cursor-pointer transition-all"
                                >
                                  {language === 'vi' ? 'Từ Chối' : 'Decline'}
                                </button>
                              </>
                            )}
                          </div>

                          {/* Inline Counter Offer Input */}
                          {counteringBidId === bid.id && (
                            <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5 animate-fadeIn">
                              <p className="text-[10px] font-black text-amber-800 uppercase">{language === 'vi' ? 'ĐỀ XUẤT GIÁ MỚI' : 'PROPOSE NEW PRICE'}</p>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-xs text-slate-600">$</span>
                                <input
                                  type="number"
                                  value={bidCounterPrice}
                                  onChange={(e) => setBidCounterPrice(Number(e.target.value))}
                                  className="p-1.5 w-24 bg-white border border-amber-300 rounded-lg text-xs font-black text-slate-900"
                                />
                                <span className="text-xs font-bold text-slate-500">USD</span>
                              </div>
                              <div className="flex space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRespondNegotiation(bid.id, 'counter', bidCounterPrice, `Traveler countered with price $${bidCounterPrice} USD`);
                                    setCounteringBidId(null);
                                    setViewingBidsPost(null);
                                  }}
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded cursor-pointer"
                                >
                                  {language === 'vi' ? 'Gửi Đề Xuất' : 'Send Counter Offer'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCounteringBidId(null)}
                                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-500 font-bold text-[10px] rounded border border-slate-200 cursor-pointer"
                                >
                                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* Negotiation History Modal */}
      <NegotiationHistoryModal
        isOpen={!!historyModalNegotiation}
        onClose={() => setHistoryModalNegotiation(null)}
        negotiation={historyModalNegotiation}
        currentUserRole="traveler"
        onRespondNegotiation={onRespondNegotiation}
      />

    </div>
  );
};
