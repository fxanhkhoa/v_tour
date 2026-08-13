import React from 'react';
import { GuideProfile } from '../types';

interface GuideListProps {
  guides: GuideProfile[];
  selectedCity: string;
  onSelectGuide: (guide: GuideProfile) => void;
}

export const GuideList: React.FC<GuideListProps> = ({
  guides = [],
  selectedCity,
  onSelectGuide
}) => {
  const safeGuides = guides || [];
  const filtered = safeGuides.filter(g => !selectedCity || selectedCity === 'All' || (g.city && g.city.toLowerCase() === selectedCity.toLowerCase()));
  const cityGuides = filtered.length > 0 ? filtered : safeGuides;

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Verified Local Experts</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Meet Top Local Tour Guides in {selectedCity}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Background-checked, multilingual drivers and passionate storytellers ready for instant booking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cityGuides.map((guide) => (
          <div
            key={guide.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Avatar & Online Badge */}
              <div className="relative mb-4 flex items-center justify-center">
                <div className="relative">
                  <img
                    src={guide.avatar}
                    alt={guide.fullName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md"
                  />
                  {guide.isOnline && (
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow animate-pulse" title="Online & Ready"></span>
                  )}
                </div>
              </div>

              {/* Name & Rating */}
              <div className="text-center mb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center justify-center space-x-1">
                  <span>{guide.fullName}</span>
                  {guide.verified && (
                    <span className="material-symbols-outlined text-teal-500 text-base" title="Verified Guide">
                      verified
                    </span>
                  )}
                </h3>

                <div className="flex items-center justify-center space-x-1 text-xs font-bold text-slate-700 mt-0.5">
                  <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                  <span>{guide.rating}</span>
                  <span className="text-slate-400 font-normal">({guide.completedTours} tours)</span>
                </div>
              </div>

              {/* Languages Spoken */}
              <div className="flex flex-wrap justify-center gap-1 mb-3">
                {(guide.languages || []).map((lang, i) => (
                  <span key={`${guide.id}-lang-${i}`} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    🗣️ {lang}
                  </span>
                ))}
              </div>

              {/* Bio snippet */}
              <p className="text-xs text-slate-600 line-clamp-3 text-center mb-4 leading-relaxed">
                "{guide.bio}"
              </p>

              {/* Badges */}
              <div className="flex flex-wrap justify-center gap-1 mb-4">
                {(guide.badges || []).map((b, i) => (
                  <span key={`${guide.id}-badge-${i}`} className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200/60">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Price & Instant Request */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Hourly Rate</p>
                <p className="text-sm font-extrabold text-slate-900">${guide.hourlyRateUSD}/hr</p>
              </div>

              <button
                onClick={() => onSelectGuide(guide)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-1 shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">moped</span>
                <span>Request Guide</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};
