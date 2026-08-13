import React, { useState } from 'react';
import { NegotiationOffer } from '../types';

interface NegotiationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  negotiation: NegotiationOffer | null;
  currentUserRole: 'traveler' | 'guide';
  isVerifiedGuide?: boolean;
  onRespondNegotiation: (
    offerId: string,
    action: 'accept' | 'counter' | 'decline',
    counterPrice?: number,
    message?: string
  ) => void;
  onOpenKYCModal?: () => void;
}

export const NegotiationHistoryModal: React.FC<NegotiationHistoryModalProps> = ({
  isOpen,
  onClose,
  negotiation,
  currentUserRole,
  isVerifiedGuide = true,
  onRespondNegotiation,
  onOpenKYCModal
}) => {
  if (!isOpen || !negotiation) return null;

  const [counterPrice, setCounterPrice] = useState<number>(
    negotiation.offeredPriceUSD ? negotiation.offeredPriceUSD : 50
  );
  const [customMessage, setCustomMessage] = useState<string>('');
  const [showCounterInput, setShowCounterInput] = useState<boolean>(false);

  const messages = negotiation.messages || [];
  const isAccepted = negotiation.status === 'accepted';
  const isDeclined = negotiation.status === 'declined';
  const isMyTurnToRespond = negotiation.lastSenderRole !== currentUserRole && !isAccepted && !isDeclined;

  const handleAction = (action: 'accept' | 'counter' | 'decline') => {
    if (currentUserRole === 'guide' && !isVerifiedGuide) {
      if (onOpenKYCModal) onOpenKYCModal();
      return;
    }

    if (action === 'counter') {
      if (counterPrice <= 0) return;
      onRespondNegotiation(
        negotiation.id,
        'counter',
        counterPrice,
        customMessage || `Counter-offered $${counterPrice} USD`
      );
    } else if (action === 'accept') {
      onRespondNegotiation(
        negotiation.id,
        'accept',
        undefined,
        customMessage || `Accepted price offer of $${negotiation.offeredPriceUSD} USD!`
      );
    } else if (action === 'decline') {
      onRespondNegotiation(
        negotiation.id,
        'decline',
        undefined,
        customMessage || 'Declined offer'
      );
    }
    setCustomMessage('');
    setShowCounterInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <span className="material-symbols-outlined text-xl">handshake</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Negotiation History & Proposal Chat
              </h3>
              <p className="text-xs text-slate-300 font-medium line-clamp-1">
                {negotiation.tourTitle || 'Custom Guide Request Negotiation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Top Overview Cards */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center space-x-2.5">
            <img
              src={negotiation.guideAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={negotiation.guideName}
              className="w-9 h-9 rounded-full object-cover border border-teal-500"
            />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tour Guide</span>
              <span className="font-extrabold text-slate-900">{negotiation.guideName}</span>
              <span className="text-[10px] text-amber-500 font-bold block">★ {negotiation.guideRating || 5.0}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm shrink-0">
              {negotiation.travelerName ? negotiation.travelerName[0] : 'T'}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Traveler</span>
              <span className="font-extrabold text-slate-900">{negotiation.travelerName}</span>
            </div>
          </div>

          <div className="col-span-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-bold">Current Offer Price:</span>
              <span className="text-lg font-black text-emerald-700">${negotiation.offeredPriceUSD} USD</span>
              {negotiation.originalPriceUSD && negotiation.originalPriceUSD !== negotiation.offeredPriceUSD && (
                <span className="text-slate-400 line-through text-xs font-semibold">
                  ${negotiation.originalPriceUSD} USD
                </span>
              )}
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
              isAccepted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              isDeclined ? 'bg-rose-100 text-rose-800 border border-rose-300' :
              'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {isAccepted ? '✅ Offer Accepted' : isDeclined ? '❌ Declined' : `⏳ Status: ${negotiation.status}`}
            </span>
          </div>
        </div>

        {/* Message & Offer History Timeline */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-100/50">
          <div className="text-center my-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
              📜 Negotiation Timeline & Conversation
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="p-6 text-center text-slate-400 italic text-xs">
              No message history recorded yet. Send your initial offer or counter proposal below!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSenderMe = msg.senderRole === currentUserRole;
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isSenderMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-500 font-bold">
                    <span className={`px-1.5 py-0.2 rounded font-extrabold uppercase ${
                      msg.senderRole === 'guide' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {msg.senderRole === 'guide' ? 'Guide' : 'Traveler'}
                    </span>
                    <span>{msg.timestamp || 'Just now'}</span>
                  </div>

                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs shadow-xs border ${
                    isSenderMe
                      ? 'bg-slate-900 text-white rounded-tr-none border-slate-800'
                      : 'bg-white text-slate-900 rounded-tl-none border-slate-200'
                  }`}>
                    {msg.priceUSD !== undefined && (
                      <div className={`mb-1.5 text-xs font-black inline-flex items-center space-x-1 px-2 py-0.5 rounded ${
                        isSenderMe ? 'bg-teal-500/20 text-teal-300' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <span>💰 Proposed Price:</span>
                        <span>${msg.priceUSD} USD</span>
                      </div>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Interactive Response Controls Footer */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          {isAccepted ? (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center">
              🎉 Negotiation completed! This price agreement of ${negotiation.offeredPriceUSD} USD has been confirmed into a tour booking.
            </div>
          ) : isDeclined ? (
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold text-center">
              This price offer negotiation is closed.
            </div>
          ) : !isMyTurnToRespond ? (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-amber-600 animate-spin text-base shrink-0">hourglass_top</span>
                  <span>
                    {currentUserRole === 'guide'
                      ? `Bid offer of $${negotiation.offeredPriceUSD} USD sent! Awaiting traveler response...`
                      : `Counter proposal of $${negotiation.offeredPriceUSD} USD sent! Awaiting tour guide response...`}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-amber-200/80 text-amber-950 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0">
                  Awaiting Response ⏳
                </span>
              </div>

              {/* Disabled Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 opacity-60">
                <button
                  disabled
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200 shadow-none"
                >
                  Decline
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    disabled
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-slate-200 text-slate-400 font-extrabold text-xs cursor-not-allowed shadow-none"
                  >
                    Counter Price
                  </button>

                  <button
                    disabled
                    type="button"
                    className="px-4 py-2 rounded-xl bg-slate-200 text-slate-400 font-black text-xs cursor-not-allowed shadow-none"
                  >
                    <span>Accept Offer (${negotiation.offeredPriceUSD})</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentUserRole === 'guide' && !isVerifiedGuide && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
                  <span>🔒 License verification required to counter or accept offers.</span>
                  {onOpenKYCModal && (
                    <button
                      onClick={onOpenKYCModal}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-[11px] font-black cursor-pointer"
                    >
                      Verify Now
                    </button>
                  )}
                </div>
              )}

              {/* Message / Counter input toggle */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Add a note or message with your offer/response..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />

                {showCounterInput && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                    <label className="text-xs font-extrabold text-amber-900 shrink-0">
                      New Counter Offer Price ($USD):
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-amber-900">$</span>
                      <input
                        type="number"
                        min="5"
                        max="2000"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(Number(e.target.value))}
                        className="w-24 p-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                      />
                      <button
                        onClick={() => handleAction('counter')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                      >
                        Send Counter
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Response Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => handleAction('decline')}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs cursor-pointer border border-slate-200 transition-colors"
                >
                  Decline
                </button>

                <div className="flex items-center space-x-2">
                  {!showCounterInput ? (
                    <button
                      onClick={() => {
                        setShowCounterInput(true);
                        setCounterPrice(negotiation.offeredPriceUSD);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-xs transition-all"
                    >
                      Counter Price
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCounterInput(false)}
                      className="px-3 py-2 text-slate-500 text-xs font-bold hover:underline cursor-pointer"
                    >
                      Cancel Counter
                    </button>
                  )}

                  <button
                    onClick={() => handleAction('accept')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-sm transition-all flex items-center space-x-1"
                  >
                    <span>Accept Offer (${negotiation.offeredPriceUSD})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
