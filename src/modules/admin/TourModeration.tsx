import React from 'react';
import { TourPackage, TravelerPostRequest } from '../../types';
import { Language } from '../../lib/translations';

interface TourModerationProps {
  tours: TourPackage[];
  posts: TravelerPostRequest[];
  language?: Language;
}

export const TourModeration: React.FC<TourModerationProps> = ({ tours = [], posts = [], language = 'en' }) => {
  const safeTours = tours || [];
  const safePosts = posts || [];

  return (
    <div className="space-y-6">
      
      {/* Moderation Section 1: Guide Tours */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center space-x-2">
          <span className="material-symbols-outlined text-teal-600">travel_explore</span>
          <span>
            {language === 'vi'
              ? `Kiểm Duyệt Gói Tour Đã Tạo (${safeTours.length})`
              : `Created Tour Packages Moderation (${safeTours.length})`}
          </span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'vi'
            ? 'Theo dõi và quản lý các gói tour do hướng dẫn viên đã xác thực đăng tải.'
            : 'Monitor custom tours published by verified tourist guides.'}
        </p>

        {safeTours.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            {language === 'vi' ? 'Chưa có gói tour nào được tạo.' : 'No created tours to moderate.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeTours.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-200 flex space-x-4 bg-slate-50/50">
                <img
                  src={t.imageUrl}
                  alt={t.title}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="flex-1 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 truncate">{t.title}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ${t.priceUSDPerPerson}/{language === 'vi' ? 'khách' : 'person'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{language === 'vi' ? 'HDV:' : 'Guide:'} {t.guideName} • {t.city}</p>
                  <p className="text-slate-600 line-clamp-2">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moderation Section 2: Traveler Request Posts */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center space-x-2">
          <span className="material-symbols-outlined text-amber-500">campaign</span>
          <span>
            {language === 'vi'
              ? `Yêu Cầu Tìm HDV Từ Du Khách (${safePosts.length})`
              : `Traveler Post Requests (${safePosts.length})`}
          </span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'vi'
            ? 'Các bài đăng tìm hướng dẫn viên từ cộng đồng du khách.'
            : 'Public tour requests posted by travelers seeking custom guides.'}
        </p>

        {safePosts.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            {language === 'vi' ? 'Chưa có bài đăng yêu cầu tour nào.' : 'No traveler post requests.'}
          </p>
        ) : (
          <div className="space-y-3">
            {safePosts.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{p.title}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                      {p.city}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{p.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'vi'
                      ? `Đăng bởi ${p.travelerName} • Ngân sách: $${p.minBudgetUSD}-$${p.maxBudgetUSD} USD • ${p.bidsCount} Báo giá từ HDV`
                      : `Posted by ${p.travelerName} • Budget: $${p.minBudgetUSD}-$${p.maxBudgetUSD} USD • ${p.bidsCount} Guide Bids`}
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
