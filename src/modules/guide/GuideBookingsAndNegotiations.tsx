import React, { useState } from 'react';
import { GuideProfile, TourBooking, TravelerPostRequest, NegotiationOffer } from '../../types';

interface GuideBookingsAndNegotiationsProps {
  guideProfile: GuideProfile;
  bookings: TourBooking[];
  posts: TravelerPostRequest[];
  negotiations: NegotiationOffer[];
  onAcceptBooking: (bookingId: string) => void;
  onSendBidToPost: (postId: string, offerPrice: number, message: string) => void;
  onRespondNegotiation: (offerId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number, message?: string) => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  onOpenKYCModal?: () => void;
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
  onOpenKYCModal
}) => {
  const isVerified = guideProfile.kycStatus === 'verified' || guideProfile.verified;

  const [selectedPost, setSelectedPost] = useState<TravelerPostRequest | null>(null);
  const [bidPrice, setBidPrice] = useState<number>(50);
  const [bidMessage, setBidMessage] = useState<string>('Hello! I am a verified licensed local guide. I can host your custom tour!');

  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(45);

  const myBookings = bookings.filter(
    b => b.guideId === guideProfile.id || b.guideName?.toLowerCase() === guideProfile.fullName?.toLowerCase()
  );
  const cityPosts = posts.filter(
    p => p.city.toLowerCase() === guideProfile.city.toLowerCase() || p.city === 'Ho Chi Minh City'
  );
  const myNegotiations = negotiations.filter(
    n => n.guideId === guideProfile.id || n.guideName?.toLowerCase() === guideProfile.fullName?.toLowerCase()
  );

  const handleConfirmBid = () => {
    if (!selectedPost || !isVerified) return;
    onSendBidToPost(selectedPost.id, bidPrice, bidMessage);
    setSelectedPost(null);
  };

  return (
    <div className="space-y-8">
      
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
              Travelers post custom trip requirements. Send direct price offers & negotiate directly.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border">
            {cityPosts.length} Open Requests in {guideProfile.city}
          </span>
        </div>

        {!isVerified && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-2.5 font-semibold">
              <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">lock</span>
              <span>
                <strong>Verification Required to Bid:</strong> You must submit your Tour Guide License Card & CCCD to place bids on traveler posts.
              </span>
            </div>
            {onOpenKYCModal && (
              <button
                onClick={onOpenKYCModal}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-sm"
              >
                Submit Verification 📜
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cityPosts.map((post) => (
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
                  <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase">
                    Budget: ${post.minBudgetUSD}-${post.maxBudgetUSD}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mb-1">{post.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-3 mb-3">{post.description}</p>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                  <span>📅 {post.preferredDate}</span>
                  <span>⏱️ {post.durationHours} Hours</span>
                  <span>👥 {post.groupSize} Travelers</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-teal-700">{post.bidsCount} Bids Received</span>
                <button
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
              </div>
            </div>
          ))}
        </div>
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
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0">lock</span>
            <span>License verification is required to accept or send counter offers in negotiations.</span>
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
                  {neg.messages.length > 0 && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200">
                      "{neg.messages[neg.messages.length - 1].text}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {neg.status !== 'accepted' && (
                    <>
                      <button
                        onClick={() => {
                          if (!isVerified) {
                            if (onOpenKYCModal) onOpenKYCModal();
                            return;
                          }
                          onRespondNegotiation(neg.id, 'accept', undefined, 'Accepted offer price!');
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
                  {b.status.replace('_', ' ')}
                </span>

                <div className="flex items-center space-x-2">
                  {b.status === 'matched' && (
                    <button
                      type="button"
                      onClick={() => onAcceptBooking(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                    >
                      Start Tour
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 space-y-4">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h4 className="font-extrabold text-slate-900 text-lg">Send Price Quote / Bid</h4>
            <p className="text-xs text-slate-500">Traveler: {selectedPost.travelerName} • {selectedPost.title}</p>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 space-y-4">
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
                onRespondNegotiation(counteringOfferId, 'counter', counterPrice, `Counter offer price: $${counterPrice} USD`);
                setCounteringOfferId(null);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl cursor-pointer"
            >
              Send Counter Offer
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
