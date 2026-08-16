import React, { useState } from 'react';
import { User } from '../../types';
import { Language } from '../../lib/translations';

interface UserManagementProps {
  users: User[];
  onToggleUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  onRefreshUsers?: () => void;
  language?: Language;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users = [],
  onToggleUserStatus,
  onRefreshUsers,
  language = 'en'
}) => {
  const safeUsers = users || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'traveler' | 'guide' | 'admin'>('all');

  const filteredUsers = safeUsers.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (r: 'all' | 'traveler' | 'guide' | 'admin') => {
    if (language === 'vi') {
      switch (r) {
        case 'all': return 'Tất cả';
        case 'traveler': return 'Du khách';
        case 'guide': return 'Hướng dẫn viên';
        case 'admin': return 'Quản trị viên';
      }
    }
    return r === 'all' ? 'All' : r === 'traveler' ? 'Traveler' : r === 'guide' ? 'Guide' : 'Admin';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
            <span className="material-symbols-outlined text-teal-600">manage_accounts</span>
            <span>{language === 'vi' ? 'Danh Bạ Người Dùng Nền Tảng' : 'Platform User Directory'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'vi'
              ? 'Quản lý tài khoản Du Khách, Hướng Dẫn Viên và Quản Trị Viên.'
              : 'Manage Travelers, Tourist Guides, and Back-Office Admins.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {onRefreshUsers && (
            <button
              onClick={onRefreshUsers}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer"
              title={language === 'vi' ? 'Lấy danh sách người dùng mới nhất từ máy chủ' : 'Fetch latest user list from server'}
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>{language === 'vi' ? 'Làm Mới' : 'Refresh Users'}</span>
            </button>
          )}

          <span className="px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
            {filteredUsers.length} / {safeUsers.length} {language === 'vi' ? 'Người Dùng' : 'Users'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'vi' ? 'Tìm theo tên, email, SĐT, ID...' : 'Search by name, email, phone, ID...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">
            {language === 'vi' ? 'Vai trò:' : 'Role:'}
          </span>
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
            {(['all', 'traveler', 'guide', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getRoleLabel(r)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">{language === 'vi' ? 'Người Dùng' : 'User'}</th>
              <th className="p-4">{language === 'vi' ? 'Email & SĐT' : 'Email & Phone'}</th>
              <th className="p-4">{language === 'vi' ? 'Vai Trò' : 'Role'}</th>
              <th className="p-4">{language === 'vi' ? 'Trạng Thái' : 'Account Status'}</th>
              <th className="p-4 text-right">{language === 'vi' ? 'Hành Động' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">
                    group_off
                  </span>
                  {language === 'vi' ? 'Không tìm thấy người dùng nào phù hợp.' : 'No users found matching your criteria.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || 'User')}`}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="text-slate-800 font-medium">{u.email}</p>
                    <p className="text-[10px] text-slate-500">{u.phone || 'N/A'}</p>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      u.role === 'admin'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : u.role === 'guide'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-teal-100 text-teal-800 border-teal-200'
                    }`}>
                      {u.role === 'admin'
                        ? (language === 'vi' ? 'QUẢN TRỊ' : 'ADMIN')
                        : u.role === 'guide'
                        ? (language === 'vi' ? 'HDV DU LỊCH' : 'GUIDE')
                        : (language === 'vi' ? 'DU KHÁCH' : 'TRAVELER')}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.status === 'suspended'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.status === 'suspended'
                        ? (language === 'vi' ? 'Đã Khóa' : 'Suspended')
                        : (language === 'vi' ? 'Hoạt Động' : 'Active')}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => onToggleUserStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                          u.status === 'suspended'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {u.status === 'suspended'
                          ? (language === 'vi' ? 'Mở Khóa' : 'Re-activate')
                          : (language === 'vi' ? 'Khóa Tài Khoản' : 'Suspend User')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
