import React, { useState } from 'react';
import { TravelerPostRequest, NegotiationOffer, TourBooking } from '../../types';
import { Language, translations } from '../../lib/translations';

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
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-sm">{post.title}</h4>
                    <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold uppercase">
                      {post.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{post.description}</p>
                  <p className="text-[11px] text-slate-400">
                    📍 {post.city} • Budget: ${post.minBudgetUSD}-${post.maxBudgetUSD} USD • {post.bidsCount} {t.bidsReceived}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-teal-700">
                    {post.bidsCount} {t.bidsReceived}
                  </span>
                </div>
              </div>
            ))}
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
                  {neg.messages.length > 0 && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200">
                      "{neg.messages[neg.messages.length - 1].text}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {neg.status !== 'accepted' && (
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

    </div>
  );
};
