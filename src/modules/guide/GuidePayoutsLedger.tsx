import React, { useState } from 'react';
import { GuideProfile, TourBooking } from '../../types';
import { Language } from '../../lib/translations';
import { exportPdfFromHtml, triggerSystemPrint, downloadHtmlDocument } from '../../lib/printUtils';

interface GuidePayoutsLedgerProps {
  guideProfile: GuideProfile;
  bookings: TourBooking[];
  onOpenBookingHub: (booking: TourBooking) => void;
  onOpenPayoutModal?: () => void;
  language?: Language;
}

export const GuidePayoutsLedger: React.FC<GuidePayoutsLedgerProps> = ({
  guideProfile,
  bookings,
  onOpenBookingHub,
  onOpenPayoutModal,
  language = 'en'
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'released' | 'held_in_escrow' | 'refunded'>('released');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<TourBooking | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const myBookings = (bookings || []).filter(
    b => b.guideId === guideProfile.id || b.guideName?.toLowerCase() === guideProfile.fullName?.toLowerCase()
  );

  // Financial aggregates
  const transferredBookings = myBookings.filter(b => b.paymentStatus === 'released');
  const totalTransferredUSD = transferredBookings.reduce((sum, b) => sum + (b.totalPriceUSD || 0), 0);
  const totalTransferredVND = totalTransferredUSD * 25400;

  const escrowHeldBookings = myBookings.filter(b => b.paymentStatus === 'held_in_escrow' || (!b.paymentStatus && b.status !== 'completed'));
  const totalHeldEscrowUSD = escrowHeldBookings.reduce((sum, b) => sum + (b.totalPriceUSD || 0), 0);

  // Filter and sort bookings
  const filteredBookings = myBookings
    .filter(b => {
      // Status filter
      if (filterStatus === 'released') {
        if (b.paymentStatus !== 'released') return false;
      } else if (filterStatus === 'held_in_escrow') {
        if (b.paymentStatus !== 'held_in_escrow' && b.paymentStatus !== undefined) return false;
      } else if (filterStatus === 'refunded') {
        if (b.paymentStatus !== 'refunded') return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = b.tourTitle?.toLowerCase().includes(q);
        const matchTraveler = b.travelerName?.toLowerCase().includes(q);
        const matchId = b.id?.toLowerCase().includes(q);
        const matchPin = b.pinCode?.includes(q);
        if (!matchTitle && !matchTraveler && !matchId && !matchPin) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'amount_high') return (b.totalPriceUSD || 0) - (a.totalPriceUSD || 0);
      if (sortBy === 'amount_low') return (a.totalPriceUSD || 0) - (b.totalPriceUSD || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      return new Date(b.escrowReleasedAt || b.createdAt || 0).getTime() - new Date(a.escrowReleasedAt || a.createdAt || 0).getTime();
    });

  const formatVND = (usdAmount: number) => {
    return (usdAmount * 25400).toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Transferred */}
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-5 rounded-3xl text-white border border-emerald-800/40 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <span className="material-symbols-outlined text-6xl">payments</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{language === 'vi' ? 'Tổng Đã Nhận Chuyển Khoản' : 'Total Transferred Payouts'}</span>
            </div>
            <p className="text-3xl font-black tracking-tight text-white mt-1">
              ${totalTransferredUSD.toLocaleString()} <span className="text-xs font-normal text-emerald-300">USD</span>
            </p>
            <p className="text-xs text-emerald-300/80 font-mono mt-0.5">
              ≈ {totalTransferredVND.toLocaleString('vi-VN')} ₫
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[11px] text-slate-300">
            <span>{language === 'vi' ? 'Số tour hoàn tất:' : 'Completed tours:'}</span>
            <span className="font-extrabold text-emerald-400">{transferredBookings.length} tours</span>
          </div>
        </div>

        {/* Metric 2: Held in Escrow */}
        <div className="bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 p-5 rounded-3xl text-white border border-amber-800/40 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <span className="material-symbols-outlined text-6xl">lock_clock</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-base">shield</span>
              <span>{language === 'vi' ? 'Đang Khóa Trong Escrow' : 'Locked in Escrow'}</span>
            </div>
            <p className="text-3xl font-black tracking-tight text-white mt-1">
              ${totalHeldEscrowUSD.toLocaleString()} <span className="text-xs font-normal text-amber-300">USD</span>
            </p>
            <p className="text-xs text-amber-300/80 font-mono mt-0.5">
              ≈ {formatVND(totalHeldEscrowUSD)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-900/60 flex items-center justify-between text-[11px] text-slate-300">
            <span>{language === 'vi' ? 'Chờ xác nhận xong:' : 'Pending dual check:'}</span>
            <span className="font-extrabold text-amber-400">{escrowHeldBookings.length} tours</span>
          </div>
        </div>

        {/* Metric 3: Linked Payout Bank Card Details */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 rounded-3xl text-white border border-slate-700 shadow-lg relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-teal-400 text-lg">account_balance</span>
                <span className="text-xs font-extrabold text-teal-300 uppercase tracking-wider">
                  {language === 'vi' ? 'Tài Khoản Ngân Hàng Nhận Tiền' : 'Direct Payout Bank Account'}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenPayoutModal}
                className="px-2.5 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[11px] cursor-pointer transition-all flex items-center space-x-1"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                <span>{guideProfile.bankAccount?.accountNumber ? (language === 'vi' ? 'Thay Đổi' : 'Change') : (language === 'vi' ? 'Thêm STK' : 'Add Bank')}</span>
              </button>
            </div>

            {guideProfile.bankAccount?.accountNumber ? (
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-white">{guideProfile.bankAccount.bankName}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      ✓ NAPAS 24/7
                    </span>
                  </div>
                  <p className="text-base font-mono font-bold tracking-widest text-teal-300 mt-1">
                    •••• •••• •••• {guideProfile.bankAccount.accountNumber.slice(-4)}
                  </p>
                  <p className="text-[11px] text-slate-400 uppercase font-mono mt-0.5">
                    {guideProfile.bankAccount.accountHolder} {guideProfile.bankAccount.branchName && `• ${guideProfile.bankAccount.branchName}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">SWIFT</span>
                  <span className="text-xs font-mono font-extrabold text-slate-200">{guideProfile.bankAccount.swiftCode || 'VTCBVNVX'}</span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-xs text-amber-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-amber-400 text-lg">warning</span>
                  <span>{language === 'vi' ? 'Chưa cấu hình tài khoản nhận tiền giải ngân.' : 'No payout bank account configured.'}</span>
                </div>
                <button
                  onClick={onOpenPayoutModal}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-[11px] cursor-pointer"
                >
                  {language === 'vi' ? 'Cài Đặt Ngay' : 'Setup Now'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="material-symbols-outlined text-emerald-400 text-xs">bolt</span>
              <span>{language === 'vi' ? 'Giải ngân tự động ngay khi hoàn tất 2 bên' : 'Instant auto-disbursement upon dual acceptance'}</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">0% Payout Fee</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'released', label: language === 'vi' ? '✅ Đã Chuyển Khoản' : '✅ Transferred Payouts', count: transferredBookings.length },
            { id: 'held_in_escrow', label: language === 'vi' ? '🛡️ Đang Giữ Escrow' : '🛡️ In Escrow', count: escrowHeldBookings.length },
            { id: 'all', label: language === 'vi' ? 'Tất Cả' : 'All Tours', count: myBookings.length }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                filterStatus === st.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{st.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterStatus === st.id ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Sort Inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm tour, mã đơn, du khách...' : 'Search tour, traveler, booking...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">
              search
            </span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="newest">{language === 'vi' ? 'Mới Nhất' : 'Newest'}</option>
            <option value="oldest">{language === 'vi' ? 'Cũ Nhất' : 'Oldest'}</option>
            <option value="amount_high">{language === 'vi' ? 'Số Tiền Cao Nhất' : 'Highest Payout'}</option>
            <option value="amount_low">{language === 'vi' ? 'Số Tiền Thấp Nhất' : 'Lowest Payout'}</option>
          </select>
        </div>

      </div>

      {/* Payouts Transferred List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="material-symbols-outlined text-emerald-600">account_balance_wallet</span>
              <span>{language === 'vi' ? 'Danh Sách Tour Đã Chuyển Tiền & Giải Ngân' : 'Transferred Money & Payout Ledger'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi' 
                ? 'Theo dõi chi tiết các khoản thanh toán tour đã giải ngân từ quỹ ký quỹ Escrow vào tài khoản ngân hàng của bạn.' 
                : 'Detailed ledger of all tour payouts released from escrow directly to your bank account.'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              {language === 'vi' ? 'Không tìm thấy khoản chuyển tiền nào' : 'No payout transfers found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {filterStatus === 'released' 
                ? (language === 'vi' 
                    ? 'Khi bạn và du khách cùng bấm xác nhận hoàn thành tour, tiền từ Escrow sẽ được chuyển ngay vào tài khoản này.'
                    : 'When you and the traveler confirm tour completion, escrow funds are instantly released here.')
                : (language === 'vi' ? 'Thử thay đổi bộ lọc tìm kiếm hoặc xem lại các trạng thái khác.' : 'Try adjusting your search criteria or switching status filter.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBookings.map((b) => {
              const isReleased = b.paymentStatus === 'released';
              const releaseDate = b.escrowReleasedAt ? new Date(b.escrowReleasedAt).toLocaleDateString() : new Date(b.createdAt).toLocaleDateString();
              const releaseTime = b.escrowReleasedAt ? new Date(b.escrowReleasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              
              return (
                <div key={b.id} className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Tour Title & Traveler Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center space-x-1 ${
                        isReleased 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : b.paymentStatus === 'refunded'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        <span className="material-symbols-outlined text-xs">
                          {isReleased ? 'check_circle' : b.paymentStatus === 'refunded' ? 'replay' : 'lock'}
                        </span>
                        <span>
                          {isReleased 
                            ? (language === 'vi' ? 'Đã Chuyển Khoản' : 'Transferred to Bank') 
                            : b.paymentStatus === 'refunded' 
                            ? 'Refunded' 
                            : (language === 'vi' ? 'Đang Khóa Trong Escrow' : 'Held in Escrow')}
                        </span>
                      </span>

                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        ID: {b.id.toUpperCase()}
                      </span>

                      {b.escrowHoldTxId && (
                        <span className="text-[11px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          Ref: {b.escrowHoldTxId}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-base sm:text-lg text-slate-900">
                      {b.tourTitle}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <img
                          src={b.travelerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={b.travelerName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-700">{b.travelerName}</span>
                      </div>
                      <span>•</span>
                      <span>📍 {b.pickupLocation}</span>
                      <span>•</span>
                      <span>👥 {b.groupSize} {b.groupSize === 1 ? 'Traveler' : 'Travelers'}</span>
                      <span>•</span>
                      <span className="font-mono">PIN: {b.pinCode}</span>
                    </div>

                    {/* Dual Confirmation Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.travelerConfirmedCompletion ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {language === 'vi' ? 'Du khách xác nhận: ' : 'Traveler Confirmed: '}
                        {b.travelerConfirmedCompletion ? '✓' : (language === 'vi' ? '⏳ Chờ' : '⏳ Pending')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.guideConfirmedCompletion ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {language === 'vi' ? 'HDV xác nhận: ' : 'Guide Confirmed: '}
                        {b.guideConfirmedCompletion ? '✓' : (language === 'vi' ? '⏳ Chờ' : '⏳ Pending')}
                      </span>
                      {b.escrowReleasedAt && (
                        <span className="text-[10px] text-slate-400">
                          {language === 'vi' ? 'Giải ngân lúc: ' : 'Released on: '}{releaseDate} {releaseTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle / Right: Payout Amount & Bank Destination */}
                  <div className="flex flex-col lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <div className="flex lg:flex-col items-baseline lg:items-end justify-between">
                        <span className="text-2xl font-black text-emerald-700 tracking-tight">
                          +${b.totalPriceUSD} <span className="text-xs font-bold text-slate-400">USD</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          ≈ {formatVND(b.totalPriceUSD)}
                        </span>
                      </div>

                      {/* Transferred Bank Account Target */}
                      <div className="mt-1.5 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-[11px] text-slate-700 font-mono">
                        <span className="material-symbols-outlined text-xs text-teal-600">account_balance</span>
                        <span>
                          {guideProfile.bankAccount?.bankName 
                            ? `${guideProfile.bankAccount.bankName.split(' ')[0]} ••••${guideProfile.bankAccount.accountNumber.slice(-4)}`
                            : 'Direct Bank Wire (NAPAS 24/7)'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptBooking(b)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs cursor-pointer transition-colors flex items-center space-x-1"
                        title={language === 'vi' ? 'Xem Biên Nhận Giải Ngân' : 'View Payout Receipt'}
                      >
                        <span className="material-symbols-outlined text-sm">receipt</span>
                        <span>{language === 'vi' ? 'Xem Biên Nhận' : 'Receipt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenBookingHub(b)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer transition-colors flex items-center space-x-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm">confirmation_number</span>
                        <span>{language === 'vi' ? 'Trung Tâm Đơn Tour' : 'Tour Pass Hub'}</span>
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout Transaction Receipt Modal */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-auto animate-scale-in">
            <button
              onClick={() => setSelectedReceiptBooking(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-5 border-b border-dashed border-slate-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {language === 'vi' ? 'GIẢI NGÂN KÝ QUỸ ESCROW NỀN TẢNG' : 'PLATFORM ESCROW DISBURSEMENT'}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                ${selectedReceiptBooking.totalPriceUSD} USD
              </h3>
              <p className="text-xs font-mono font-bold text-slate-500">
                ≈ {formatVND(selectedReceiptBooking.totalPriceUSD)}
              </p>
            </div>

            {/* Receipt Metadata */}
            <div className="py-4 space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Mã Giao Dịch:' : 'Transaction Ref:'}</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedReceiptBooking.escrowHoldTxId || `TX-${selectedReceiptBooking.id.toUpperCase()}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Mã Đơn Đặt Tour:' : 'Tour Booking ID:'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceiptBooking.id.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Tên Tour:' : 'Tour Title:'}</span>
                <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
                  {selectedReceiptBooking.tourTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Du Khách:' : 'Traveler:'}</span>
                <span className="font-bold text-slate-900">{selectedReceiptBooking.travelerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Ngân Hàng Nhận Tiền:' : 'Payout Destination:'}</span>
                <span className="font-bold text-teal-700">
                  {guideProfile.bankAccount?.bankName || 'NAPAS 24/7 Direct'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Số Tài Khoản:' : 'Account Number:'}</span>
                <span className="font-mono font-bold text-slate-900">
                  {guideProfile.bankAccount?.accountNumber 
                    ? `•••• •••• •••• ${guideProfile.bankAccount.accountNumber.slice(-4)}`
                    : 'Verified on file'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Chủ Tài Khoản:' : 'Account Holder:'}</span>
                <span className="font-mono font-bold text-slate-900 uppercase">
                  {guideProfile.bankAccount?.accountHolder || guideProfile.fullName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Trạng Thái:' : 'Status:'}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedReceiptBooking.paymentStatus === 'released' 
                    ? (language === 'vi' ? '✓ ĐÃ GIẢI NGÂN & CHUYỂN KHOẢN' : '✓ SETTLED & TRANSFERRED') 
                    : (language === 'vi' ? 'ĐANG GIỮ TRONG ESCROW' : 'HELD IN ESCROW')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'vi' ? 'Thời Gian Giải Ngân:' : 'Settlement Date:'}</span>
                <span className="font-mono text-slate-900">
                  {selectedReceiptBooking.escrowReleasedAt 
                    ? new Date(selectedReceiptBooking.escrowReleasedAt).toLocaleString() 
                    : new Date(selectedReceiptBooking.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stamp & Footer */}
            <div className="pt-4 border-t border-dashed border-slate-200 text-center space-y-3">
              <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500">
                {language === 'vi' 
                  ? `🛡️ Giải ngân Escrow được chứng thực bằng mã PIN bảo mật kép (${selectedReceiptBooking.pinCode}).`
                  : `🛡️ Platform escrow disbursement verified with dual confirmation cryptographic safety PIN (${selectedReceiptBooking.pinCode}).`}
              </div>

              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={async () => {
                    if (!selectedReceiptBooking) return;
                    setIsExportingPdf(true);
                    const gross = selectedReceiptBooking.totalPriceUSD;
                    const fee = gross * 0.05;
                    const netUSD = gross - fee;
                    const netVND = Math.round(netUSD * 25400);
                    const html = `
                      <div class="header-box">
                        <div>
                          <div class="brand-title">TOUR GUIDE HUB</div>
                          <div class="brand-sub">Official Guide Disbursement Voucher</div>
                        </div>
                        <div>
                          <div class="doc-title">Remittance Receipt</div>
                          <div class="doc-meta">Tx: <strong>${selectedReceiptBooking.escrowHoldTxId || 'ESCROW_TX_CONFIRMED'}</strong></div>
                        </div>
                      </div>
                      <div class="info-grid">
                        <div>
                          <p><strong>Beneficiary Guide:</strong> ${guideProfile.fullName || guideProfile.name}</p>
                          <p><strong>License #:</strong> ${guideProfile.licenseNumber || 'VNAT-VERIFIED'}</p>
                          <p><strong>Bank Account:</strong> ${guideProfile.bankAccount?.bankName || 'Techcombank'} - ${guideProfile.bankAccount?.accountNumber || '••••9999'}</p>
                        </div>
                        <div style="text-align: right;">
                          <p><strong>Tour Title:</strong> ${selectedReceiptBooking.tourTitle}</p>
                          <p><strong>Traveler:</strong> ${selectedReceiptBooking.travelerName || 'Guest'}</p>
                          <p><strong>Verification PIN:</strong> <span style="font-family: monospace; font-weight: 800;">${selectedReceiptBooking.pinCode}</span></p>
                        </div>
                      </div>
                      <table class="statement-table">
                        <thead>
                          <tr>
                            <th>Item Description</th>
                            <th>Calculation</th>
                            <th style="text-align: right;">Amount (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Gross Tour Booking Total</td>
                            <td>Agreed Rate (${selectedReceiptBooking.groupSize || 1} Pax)</td>
                            <td style="text-align: right; font-weight: 700;">$${gross.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Platform Escrow & Safety Surcharge (5%)</td>
                            <td>Platform Operating Fee</td>
                            <td style="text-align: right; color: #b91c1c;">-$${fee.toFixed(2)}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr style="background: #f0fdfa; font-weight: 800;">
                            <td colspan="2" style="text-align: right; padding: 10px;">Net Disbursed Payout:</td>
                            <td style="text-align: right; padding: 10px; color: #0f766e; font-size: 14px;">$${netUSD.toFixed(2)} USD (≈ ${netVND.toLocaleString()} VND)</td>
                          </tr>
                        </tfoot>
                      </table>
                      <div class="footer-seal">
                        <div>
                          <p style="margin: 0; font-weight: 700;">Disbursed via 24/7 NAPAS 247 Instant Transfer</p>
                        </div>
                        <div class="seal-box">PAID & SETTLED</div>
                      </div>
                    `;
                    try {
                      await exportPdfFromHtml(html, `Guide_Disbursement_${selectedReceiptBooking.id}`);
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center space-x-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>{isExportingPdf ? (language === 'vi' ? 'Đang xuất...' : 'Exporting...') : (language === 'vi' ? 'Tải PDF' : 'Save PDF')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const gross = selectedReceiptBooking.totalPriceUSD;
                    const fee = gross * 0.05;
                    const netUSD = gross - fee;
                    const netVND = Math.round(netUSD * 25400);
                    const html = `
                      <div class="header-box">
                        <div>
                          <div class="brand-title">TOUR GUIDE HUB</div>
                          <div class="brand-sub">Official Guide Disbursement Voucher</div>
                        </div>
                        <div>
                          <div class="doc-title">Remittance Receipt</div>
                          <div class="doc-meta">Tx: <strong>${selectedReceiptBooking.escrowHoldTxId || 'ESCROW_TX_CONFIRMED'}</strong></div>
                        </div>
                      </div>
                      <div class="info-grid">
                        <div>
                          <p><strong>Beneficiary Guide:</strong> ${guideProfile.fullName || guideProfile.name}</p>
                          <p><strong>License #:</strong> ${guideProfile.licenseNumber || 'VNAT-VERIFIED'}</p>
                          <p><strong>Bank Account:</strong> ${guideProfile.bankAccount?.bankName || 'Techcombank'} - ${guideProfile.bankAccount?.accountNumber || '••••9999'}</p>
                        </div>
                        <div style="text-align: right;">
                          <p><strong>Tour Title:</strong> ${selectedReceiptBooking.tourTitle}</p>
                          <p><strong>Traveler:</strong> ${selectedReceiptBooking.travelerName || 'Guest'}</p>
                          <p><strong>Verification PIN:</strong> <span style="font-family: monospace; font-weight: 800;">${selectedReceiptBooking.pinCode}</span></p>
                        </div>
                      </div>
                      <table class="statement-table">
                        <thead>
                          <tr>
                            <th>Item Description</th>
                            <th>Calculation</th>
                            <th style="text-align: right;">Amount (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Gross Tour Booking Total</td>
                            <td>Agreed Rate (${selectedReceiptBooking.groupSize || 1} Pax)</td>
                            <td style="text-align: right; font-weight: 700;">$${gross.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Platform Escrow & Safety Surcharge (5%)</td>
                            <td>Platform Operating Fee</td>
                            <td style="text-align: right; color: #b91c1c;">-$${fee.toFixed(2)}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr style="background: #f0fdfa; font-weight: 800;">
                            <td colspan="2" style="text-align: right; padding: 10px;">Net Disbursed Payout:</td>
                            <td style="text-align: right; padding: 10px; color: #0f766e; font-size: 14px;">$${netUSD.toFixed(2)} USD (≈ ${netVND.toLocaleString()} VND)</td>
                          </tr>
                        </tfoot>
                      </table>
                      <div class="footer-seal">
                        <div>
                          <p style="margin: 0; font-weight: 700;">Disbursed via 24/7 NAPAS 247 Instant Transfer</p>
                        </div>
                        <div class="seal-box">PAID & SETTLED</div>
                      </div>
                    `;
                    downloadHtmlDocument(html, `Guide_Disbursement_${selectedReceiptBooking.id}.html`, 'Guide Remittance Receipt');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer flex items-center space-x-1"
                  title={language === 'vi' ? 'In hoặc tải tệp HTML' : 'Print Document or Save HTML'}
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>{language === 'vi' ? 'In / HTML' : 'Print / HTML'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptBooking(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs cursor-pointer"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
