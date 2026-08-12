import React, { useState, useEffect } from 'react';
import { TourBooking, ChatMessage, User } from '../types';

interface LiveBookingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: TourBooking[];
  currentUser: User | null;
  onUpdateStatus: (bookingId: string, status: any) => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
}

export const LiveBookingTrackerModal: React.FC<LiveBookingTrackerModalProps> = ({
  isOpen,
  onClose,
  bookings,
  currentUser,
  onUpdateStatus,
  onConfirmCompletion
}) => {
  if (!isOpen) return null;

  const [selectedBooking, setSelectedBooking] = useState<TourBooking | null>(bookings[0] || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  useEffect(() => {
    if (selectedBooking) {
      fetchChatMessages(selectedBooking.id);
    }
  }, [selectedBooking]);

  const fetchChatMessages = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/chat/${bookingId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedBooking) return;

    try {
      const res = await fetch(`/api/chat/${selectedBooking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id || 'u_1',
          senderName: currentUser?.name || 'Sarah Jenkins',
          senderRole: currentUser?.role || 'traveler',
          text: chatInput
        })
      });

      const data = await res.json();
      if (data.message) {
        setMessages([...messages, data.message]);
        setChatInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-teal-400 text-2xl">confirmation_number</span>
            <div>
              <h3 className="font-extrabold text-base text-white">Active Tour Bookings</h3>
              <p className="text-xs text-slate-300">Live Status & Direct Messenger</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-3">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
            <p className="text-sm font-bold">No active bookings yet</p>
            <p className="text-xs">Request an instant local guide or book a scheduled tour package!</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Bookings List Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-3 overflow-y-auto space-y-2">
              {bookings.map((bk) => (
                <button
                  key={bk.id}
                  onClick={() => setSelectedBooking(bk)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedBooking?.id === bk.id
                      ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-teal-700 uppercase">{bk.bookingType}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      bk.status === 'en_route' ? 'bg-amber-100 text-amber-800' :
                      bk.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {bk.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900 truncate">{bk.tourTitle}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Guide: {bk.guideName}</p>
                </button>
              ))}
            </div>

            {/* Booking Detail & Messenger */}
            {selectedBooking && (
              <div className="flex-1 flex flex-col overflow-y-auto p-5">
                
                {/* Status Timeline */}
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <img
                        src={selectedBooking.guideAvatar}
                        alt={selectedBooking.guideName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{selectedBooking.guideName}</p>
                        <p className="text-xs text-teal-700 font-semibold">{selectedBooking.guidePhone || '+84 908 123 456'}</p>
                      </div>
                    </div>

                    {/* Grab Verification PIN */}
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-teal-300 text-center shadow-sm">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Safety PIN</p>
                      <p className="text-sm font-extrabold text-teal-700 font-mono tracking-widest">{selectedBooking.pinCode}</p>
                    </div>
                  </div>

                  {/* Status Steps */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <button
                      onClick={() => onUpdateStatus(selectedBooking.id, 'matched')}
                      className={`p-2 rounded-xl border font-bold transition-all cursor-pointer ${
                        selectedBooking.status === 'matched' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      Matched 📍
                    </button>
                    <button
                      onClick={() => onUpdateStatus(selectedBooking.id, 'en_route')}
                      className={`p-2 rounded-xl border font-bold transition-all cursor-pointer ${
                        selectedBooking.status === 'en_route' ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-600'
                      }`}
                    >
                      En Route 🛵
                    </button>
                    <button
                      onClick={() => onUpdateStatus(selectedBooking.id, 'in_progress')}
                      className={`p-2 rounded-xl border font-bold transition-all cursor-pointer ${
                        selectedBooking.status === 'in_progress' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      On Tour 🎒
                    </button>
                  </div>
                </div>

                {/* Platform Escrow Payment & Dual Acceptance Box */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-amber-600">account_balance_wallet</span>
                      <div>
                        <p className="text-xs font-black text-amber-950 uppercase tracking-wide">Platform Escrow Vault</p>
                        <p className="text-[11px] text-amber-800">
                          Amount: <strong className="text-slate-900">${selectedBooking.totalPriceUSD} USD</strong> (Held by Platform)
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {selectedBooking.paymentStatus === 'released' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] flex items-center space-x-1 shadow">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>Released to Guide</span>
                      </span>
                    ) : selectedBooking.paymentStatus === 'refunded' ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] flex items-center space-x-1 shadow">
                        <span className="material-symbols-outlined text-xs">undo</span>
                        <span>Refunded</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center space-x-1 shadow">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        <span>Held in Escrow</span>
                      </span>
                    )}
                  </div>

                  {/* Dual Acceptance State */}
                  <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">Dual Confirmation Requirement:</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedBooking.escrowHoldTxId || 'ESCROW_TX_ACTIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                      <div className={`p-2 rounded-xl border font-bold transition-all ${
                        selectedBooking.travelerConfirmedCompletion
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        Traveler: {selectedBooking.travelerConfirmedCompletion ? '✓ Accepted' : '⏳ Pending'}
                      </div>
                      <div className={`p-2 rounded-xl border font-bold transition-all ${
                        selectedBooking.guideConfirmedCompletion
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        Guide: {selectedBooking.guideConfirmedCompletion ? '✓ Accepted' : '⏳ Pending'}
                      </div>
                    </div>

                    {/* Dual Confirmation Action Button */}
                    {selectedBooking.status !== 'completed' && onConfirmCompletion && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onConfirmCompletion(selectedBooking.id, currentUser?.role === 'guide' ? 'guide' : 'traveler')}
                          className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow cursor-pointer flex items-center justify-center space-x-2 transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span>
                            {(currentUser?.role === 'guide' ? selectedBooking.guideConfirmedCompletion : selectedBooking.travelerConfirmedCompletion)
                              ? '✓ You Accepted Tour Completed'
                              : 'Click to Accept Tour Completed & Release Funds'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Container */}
                <div className="flex-1 flex flex-col justify-between border border-slate-200 rounded-2xl p-4 bg-slate-50 min-h-[220px]">
                  
                  {/* Messages Stream */}
                  <div className="space-y-3 overflow-y-auto max-h-[200px] mb-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.senderRole === (currentUser?.role || 'traveler') ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-2xl text-xs ${
                            m.senderRole === (currentUser?.role || 'traveler')
                              ? 'bg-teal-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p className="font-bold text-[10px] opacity-80 mb-0.5">{m.senderName}</p>
                          <p>{m.text}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5">{m.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chat Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message to your guide..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                    >
                      Send
                    </button>
                  </form>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
