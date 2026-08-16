import React, { useState, useEffect } from 'react';
import { KYCApprovalTable } from './KYCApprovalTable';
import { UserManagement } from './UserManagement';
import { TourModeration } from './TourModeration';
import { AdminSystemStats, KYCApplication, User, TourPackage, TravelerPostRequest, TourBooking } from '../../types';
import { Language } from '../../lib/translations';

interface AdminDashboardProps {
  stats: AdminSystemStats;
  kycList: KYCApplication[];
  users: User[];
  tours: TourPackage[];
  posts: TravelerPostRequest[];
  bookings?: TourBooking[];
  onReviewKYC: (id: string, action: 'approve' | 'reject', reason?: string, instructions?: string) => void;
  onToggleUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  onRefresh?: () => void;
  language?: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats = {
    totalUsers: 0,
    totalGuides: 0,
    totalPendingKYC: 0,
    totalActivePosts: 0,
    totalTours: 0,
    totalBookings: 0,
    totalRevenueUSD: 0
  },
  kycList = [],
  users = [],
  tours = [],
  posts = [],
  bookings = [],
  onReviewKYC,
  onToggleUserStatus,
  onRefresh,
  language = 'en'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'users' | 'moderation' | 'escrow'>('overview');
  const [escrowSummary, setEscrowSummary] = useState<{
    totalHeldUSD: number;
    totalReleasedUSD: number;
    totalRefundedUSD: number;
    totalEscrowBookingsCount: number;
  }>({
    totalHeldUSD: 0,
    totalReleasedUSD: 0,
    totalRefundedUSD: 0,
    totalEscrowBookingsCount: 0
  });
  const [localBookings, setLocalBookings] = useState<TourBooking[]>(bookings);

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    fetchEscrowSummary();
  }, []);

  const fetchEscrowSummary = async () => {
    try {
      const res = await fetch('/api/admin/escrow-summary');
      const data = await res.json();
      if (data.summary) {
        setEscrowSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch escrow summary:', err);
    }
  };

  const handleTabChange = (tab: 'overview' | 'kyc' | 'users' | 'moderation' | 'escrow') => {
    setActiveTab(tab);
    if (onRefresh) onRefresh();
    if (tab === 'escrow') fetchEscrowSummary();
  };

  const handleEscrowAction = async (bookingId: string, action: 'force_release' | 'refund') => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/escrow-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminReason: 'Admin manual back-office override' })
      });
      const data = await res.json();
      if (data.booking) {
        setLocalBookings(prev => prev.map(b => b.id === bookingId ? data.booking : b));
        fetchEscrowSummary();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Escrow action failed:', err);
    }
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Back Office Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2 border border-amber-500/30">
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            <span>{language === 'vi' ? 'Trung Tâm Tuân Thủ & Quản Trị Hệ Thống' : 'Platform Back Office & Compliance Hub'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {language === 'vi' ? 'Bảng Điều Khiển Quản Trị Viên' : 'Admin Management Console'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {language === 'vi'
              ? 'Kiểm duyệt thẻ HDV (KYC), quản lý danh sách người dùng, theo dõi tour đã đăng và yêu cầu từ du khách.'
              : 'Audit Tour Guide KYC Cards, manage user directory accounts, monitor created tours and traveler request posts.'}
          </p>
        </div>

        {/* Stats Highlight Badges & Manual Refresh Button */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              <span>{language === 'vi' ? 'Đồng Bộ Dữ Liệu' : 'Sync All Data'}</span>
            </button>
          )}

          <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-center px-3 border-r border-slate-800">
              <p className="text-xs text-slate-400 font-medium">{language === 'vi' ? 'Chờ Duyệt KYC' : 'Pending KYC'}</p>
              <p className="text-lg font-extrabold text-amber-400">{stats.totalPendingKYC}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-xs text-slate-400 font-medium">{language === 'vi' ? 'Tổng Doanh Thu' : 'Total Revenue'}</p>
              <p className="text-lg font-extrabold text-emerald-400">${stats.totalRevenueUSD} USD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Module Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => handleTabChange('overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          <span>{language === 'vi' ? 'Tổng Quan Hệ Thống' : 'System Overview'}</span>
        </button>

        <button
          onClick={() => handleTabChange('kyc')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 relative ${
            activeTab === 'kyc'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">badge</span>
          <span>{language === 'vi' ? 'Xác Minh Thẻ HDV (KYC)' : 'KYC Card Verification'}</span>
          {stats.totalPendingKYC > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold ml-1">
              {stats.totalPendingKYC}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">group</span>
          <span>{language === 'vi' ? 'Quản Lý Người Dùng' : 'User Management'}</span>
        </button>

        <button
          onClick={() => handleTabChange('moderation')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'moderation'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">travel_explore</span>
          <span>{language === 'vi' ? 'Kiểm Duyệt Tour & Bài Đăng' : 'Tours & Post Moderation'}</span>
        </button>

        <button
          onClick={() => handleTabChange('escrow')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'escrow'
              ? 'bg-emerald-600 text-white shadow-md font-extrabold'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
          <span>{language === 'vi' ? 'Ký Quỹ Escrow Vault' : 'Escrow Payments Vault'}</span>
          {escrowSummary.totalHeldUSD > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              ${escrowSummary.totalHeldUSD}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: language === 'vi' ? 'Tổng Người Dùng Đăng Ký' : 'Total Registered Users', value: stats.totalUsers, icon: 'group', color: 'text-teal-600' },
              { label: language === 'vi' ? 'Hướng Dẫn Viên Đã Xác Thực' : 'Verified Tourist Guides', value: stats.totalGuides, icon: 'badge', color: 'text-emerald-600' },
              { label: language === 'vi' ? 'Hồ Sơ KYC Chờ Duyệt' : 'Pending KYC Verification', value: stats.totalPendingKYC, icon: 'pending_actions', color: 'text-amber-500' },
              { label: language === 'vi' ? 'Yêu Cầu Tour Đang Mở' : 'Open Traveler Requests', value: stats.totalActivePosts, icon: 'campaign', color: 'text-indigo-600' },
              { label: language === 'vi' ? 'Gói Tour Đã Đăng' : 'Published Tour Packages', value: stats.totalTours, icon: 'inventory_2', color: 'text-blue-600' },
              { label: language === 'vi' ? 'Đơn Đặt Tour Xác Nhận' : 'Confirmed Tour Bookings', value: stats.totalBookings, icon: 'confirmation_number', color: 'text-teal-600' },
              { label: language === 'vi' ? 'Tổng Doanh Số Nền Tảng (GMV)' : 'Platform GMV Revenue', value: `$${stats.totalRevenueUSD} USD`, icon: 'payments', color: 'text-emerald-600' },
              { label: language === 'vi' ? 'Trạng Thái Tuân Thủ' : 'Active Compliance Status', value: language === 'vi' ? 'Hoạt Động 100%' : '100% Operational', icon: 'verified', color: 'text-amber-500' }
            ].map((st, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-bold">{st.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{st.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${st.color}`}>
                  <span className="material-symbols-outlined text-2xl">{st.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center space-x-2">
                <span className="material-symbols-outlined text-amber-500">priority_high</span>
                <span>{language === 'vi' ? 'Hành Động Cần Xử Lý Ngay' : 'Immediate Back-Office Actions'}</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex justify-between items-center text-amber-900 font-bold">
                  <span>
                    {language === 'vi'
                      ? `${stats.totalPendingKYC} Hồ sơ Thẻ HDV đang chờ duyệt`
                      : `${stats.totalPendingKYC} Tourist Guide Card Pending Verification`}
                  </span>
                  <button
                    onClick={() => setActiveTab('kyc')}
                    className="px-3 py-1 bg-amber-500 text-slate-950 rounded-xl text-xs cursor-pointer font-extrabold"
                  >
                    {language === 'vi' ? 'Xem Xét Ngay' : 'Review Now'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center space-x-2">
                <span className="material-symbols-outlined text-teal-600">health_and_safety</span>
                <span>{language === 'vi' ? 'Kiểm Tra Sức Khỏe & An Toàn Hệ Thống' : 'System Health & Safety Audit'}</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p>{language === 'vi' ? '✓ Tất cả chi trả HDV và mã PIN đặt tour được đồng bộ theo thời gian thực.' : '✓ All guide payouts and booking PINs synchronized in real-time.'}</p>
                <p>{language === 'vi' ? '✓ Hệ thống máy chủ backend theo dõi liên tục các tin nhắn thương lượng giá.' : '✓ Express backend routes monitoring active price negotiation messages.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <KYCApprovalTable kycList={kycList} onReviewKYC={onReviewKYC} language={language} />
      )}

      {activeTab === 'users' && (
        <UserManagement users={users} onToggleUserStatus={onToggleUserStatus} onRefreshUsers={onRefresh} language={language} />
      )}

      {activeTab === 'moderation' && (
        <TourModeration tours={tours} posts={posts} language={language} />
      )}

      {activeTab === 'escrow' && (
        <div className="space-y-6">
          {/* Escrow Vault Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-900 font-bold uppercase tracking-wider">
                    {language === 'vi' ? 'Đang Khóa Trong Escrow' : 'Held in Escrow'}
                  </p>
                  <p className="text-2xl font-black text-amber-950 mt-1">${escrowSummary.totalHeldUSD} USD</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">lock</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-800 mt-2 font-medium">
                {language === 'vi' ? 'Chờ Cả 2 Bên Xác Nhận Hoàn Tất' : 'Awaiting Dual Completion Sign-off'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-3xl border border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-900 font-bold uppercase tracking-wider">
                    {language === 'vi' ? 'Đã Giải Ngân Cho HDV' : 'Released to Guides'}
                  </p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">${escrowSummary.totalReleasedUSD} USD</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">verified</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-800 mt-2 font-medium">
                {language === 'vi' ? 'Cả 2 Đã Chấp Nhận & Đã Giải Ngân' : 'Dual Accepted & Released'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-3xl border border-rose-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-rose-900 font-bold uppercase tracking-wider">
                    {language === 'vi' ? 'Giao Dịch Đã Hoàn Tiền' : 'Refunded Transactions'}
                  </p>
                  <p className="text-2xl font-black text-rose-950 mt-1">${escrowSummary.totalRefundedUSD} USD</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">undo</span>
                </div>
              </div>
              <p className="text-[11px] text-rose-800 mt-2 font-medium">
                {language === 'vi' ? 'Đã Hoàn Lại Cho Du Khách' : 'Returned to Traveler'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'vi' ? 'Tổng Số Đơn Đặt Tour' : 'Total Bookings'}
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{escrowSummary.totalEscrowBookingsCount}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {language === 'vi' ? '100% Được Giám Sát Bởi Ban Quản Trị' : '100% Monitored by Back Office'}
              </p>
            </div>
          </div>

          {/* Escrow Ledger & Override Actions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
                  <span className="material-symbols-outlined text-amber-500">account_balance_wallet</span>
                  <span>{language === 'vi' ? 'Sổ Cái Escrow & Danh Mục Xác Nhận Đôi' : 'Escrow Ledger & Dual Acceptance Directory'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'vi'
                    ? 'Tiền được tự động chuyển cho HDV khi CẢ du khách và HDV cùng xác nhận hoàn thành. Quản trị viên có quyền can thiệp đặc biệt.'
                    : 'Funds are automatically transferred to guides when BOTH traveler and guide accept tour completion. Admins have override authority.'}
                </p>
              </div>

              <button
                onClick={fetchEscrowSummary}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>{language === 'vi' ? 'Làm Mới Vault' : 'Refresh Vault'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">{language === 'vi' ? 'Tour / Mã Đơn' : 'Tour / Booking ID'}</th>
                    <th className="p-3">{language === 'vi' ? 'Du Khách' : 'Traveler'}</th>
                    <th className="p-3">{language === 'vi' ? 'Hướng Dẫn Viên' : 'Guide'}</th>
                    <th className="p-3">{language === 'vi' ? 'Số Tiền' : 'Amount'}</th>
                    <th className="p-3">{language === 'vi' ? 'Trạng Thái Thanh Toán' : 'Payment Status'}</th>
                    <th className="p-3">{language === 'vi' ? 'Xác Nhận Đôi' : 'Dual Acceptance'}</th>
                    <th className="p-3 text-right">{language === 'vi' ? 'Can Thiệp Admin' : 'Admin Override'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                        {language === 'vi' ? 'Không tìm thấy đơn đặt tour nào trong sổ cái ký quỹ.' : 'No active or past bookings found in the escrow ledger.'}
                      </td>
                    </tr>
                  ) : (
                    localBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <p className="font-extrabold text-slate-900 line-clamp-1">{b.tourTitle}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{b.id} • PIN: {b.pinCode}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{b.travelerName}</td>
                        <td className="p-3 font-semibold text-slate-800">{b.guideName}</td>
                        <td className="p-3 font-extrabold text-slate-900">${b.totalPriceUSD} USD</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            b.paymentStatus === 'released' ? 'bg-emerald-100 text-emerald-800' :
                            b.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {b.paymentStatus === 'released'
                              ? (language === 'vi' ? '✅ Đã Giải Ngân' : '✅ Released')
                              : b.paymentStatus === 'refunded'
                              ? (language === 'vi' ? '↩️ Đã Hoàn Tiền' : '↩️ Refunded')
                              : (language === 'vi' ? '🔒 Khóa Trong Escrow' : '🔒 Held in Escrow')}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col text-[10px] space-y-0.5">
                            <span className={b.travelerConfirmedCompletion ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                              {language === 'vi' ? 'Du khách: ' : 'Traveler: '}
                              {b.travelerConfirmedCompletion
                                ? (language === 'vi' ? '✓ Đã Đồng Ý' : '✓ Accepted')
                                : (language === 'vi' ? '⏳ Chờ Xử Lý' : '⏳ Pending')}
                            </span>
                            <span className={b.guideConfirmedCompletion ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                              {language === 'vi' ? 'HDV: ' : 'Guide: '}
                              {b.guideConfirmedCompletion
                                ? (language === 'vi' ? '✓ Đã Đồng Ý' : '✓ Accepted')
                                : (language === 'vi' ? '⏳ Chờ Xử Lý' : '⏳ Pending')}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {b.paymentStatus === 'held_in_escrow' ? (
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleEscrowAction(b.id, 'force_release')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] cursor-pointer shadow-sm transition-all"
                                title={language === 'vi' ? 'Giải ngân khoản tiền đang giữ cho HDV' : 'Force release held funds to guide'}
                              >
                                {language === 'vi' ? 'Giải Ngân Ngay' : 'Force Release'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEscrowAction(b.id, 'refund')}
                                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] cursor-pointer shadow-sm transition-all"
                                title={language === 'vi' ? 'Hoàn tiền đang giữ lại cho du khách' : 'Force refund held funds back to traveler'}
                              >
                                {language === 'vi' ? 'Hoàn Tiền Khách' : 'Refund Traveler'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              {language === 'vi' ? 'Không cần xử lý' : 'No action needed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
