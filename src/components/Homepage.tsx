import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GuideProfile, User } from '../types';
import { Language, translations } from '../lib/translations';

interface HomepageProps {
  currentUser: User | null;
  guides: GuideProfile[];
  onOpenAuth: () => void;
  language: Language;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export const Homepage: React.FC<HomepageProps> = ({
  currentUser,
  guides,
  onOpenAuth,
  language,
  selectedCity: propSelectedCity,
  onCityChange
}) => {
  const t = translations[language];
  const navigate = useNavigate();
  const [localCity, setLocalCity] = React.useState<string>('All');

  const selectedCity = propSelectedCity !== undefined ? propSelectedCity : localCity;
  const setSelectedCity = (city: string) => {
    setLocalCity(city);
    if (onCityChange) onCityChange(city);
  };

  const popularCities = ['All', 'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Hue', 'Nha Trang', 'Sapa', 'Phu Quoc', 'Ha Long Bay', 'Can Tho'];

  const filteredGuides = guides.filter(g => {
    if (selectedCity === 'All') return true;
    return g.city.toLowerCase() === selectedCity.toLowerCase();
  });

  const handleTravelerClick = () => {
    if (currentUser?.role === 'traveler') {
      navigate('/traveler');
    } else {
      onOpenAuth();
    }
  };

  const handleGuideClick = () => {
    if (currentUser?.role === 'guide') {
      navigate('/guide');
    } else {
      onOpenAuth();
    }
  };

  const handleAdminClick = () => {
    if (currentUser?.role === 'admin') {
      navigate('/admin');
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-black uppercase tracking-wider mb-6">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>{t.heroBadge}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            {t.heroSubtitle}
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={handleTravelerClick}
              className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 flex items-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-lg">explore</span>
              <span>{t.exploreGuidesBtn}</span>
            </button>

            <button
              onClick={handleGuideClick}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm border border-slate-700 flex items-center space-x-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-lg">badge</span>
              <span>{t.becomeGuideBtn}</span>
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={handleAdminClick}
                className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-800 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-teal-400">admin_panel_settings</span>
                <span>{t.adminAccessBtn}</span>
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto bg-slate-800/60 p-6 rounded-3xl border border-slate-700/80 backdrop-blur-md shadow-2xl">
            <div className="text-center p-2">
              <div className="text-2xl sm:text-3xl font-black text-teal-400 mb-0.5">100%</div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{t.statsVerifiedGuides}</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-0.5">6+</div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{t.statsCitiesCovered}</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl sm:text-3xl font-black text-teal-300 mb-0.5">VNAT</div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{t.statsLicenseMatch}</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-0.5">⚡ Grab</div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{t.statsInstantBooking}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
            {t.ecosystemTitle}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {t.ecosystemSubtitle}
          </p>
        </div>

        <div className={`grid grid-cols-1 ${currentUser?.role === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'} gap-8`}>
          {/* Card 1: Traveler */}
          <div className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700/80 hover:border-teal-500/50 transition-all flex flex-col justify-between group shadow-xl">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">luggage</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">
                {t.travelerFeatureTitle}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                {t.travelerFeatureDesc}
              </p>
              <ul className="space-y-2 text-xs text-slate-400 mb-8 font-medium">
                <li className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-teal-400 text-sm">check_circle</span>
                  <span>{t.travelerFeaturePoint1}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-teal-400 text-sm">check_circle</span>
                  <span>{t.travelerFeaturePoint2}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-teal-400 text-sm">check_circle</span>
                  <span>{t.travelerFeaturePoint3}</span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleTravelerClick}
              className="w-full py-3 rounded-xl bg-slate-700 hover:bg-teal-500 hover:text-slate-950 text-teal-300 font-extrabold text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>{t.exploreGuidesBtn}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Card 2: Guide */}
          <div className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between group shadow-xl">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">badge</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">
                {t.guideFeatureTitle}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                {t.guideFeatureDesc}
              </p>
              <ul className="space-y-2 text-xs text-slate-400 mb-8 font-medium">
                <li className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                  <span>{t.guideFeaturePoint1}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                  <span>{t.guideFeaturePoint2}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                  <span>{t.guideFeaturePoint3}</span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleGuideClick}
              className="w-full py-3 rounded-xl bg-slate-700 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-extrabold text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>{t.becomeGuideBtn}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Card 3: Admin (Only visible if logged in as admin) */}
          {currentUser?.role === 'admin' && (
            <div className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700/80 hover:border-amber-500/50 transition-all flex flex-col justify-between group shadow-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3">
                  {t.adminFeatureTitle}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                  {t.adminFeatureDesc}
                </p>
                <ul className="space-y-2 text-xs text-slate-400 mb-8 font-medium">
                  <li className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-amber-400 text-sm">check_circle</span>
                    <span>{t.adminFeaturePoint1}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-amber-400 text-sm">check_circle</span>
                    <span>{t.adminFeaturePoint2}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-amber-400 text-sm">check_circle</span>
                    <span>{t.adminFeaturePoint3}</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleAdminClick}
                className="w-full py-3 rounded-xl bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-extrabold text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>{t.adminAccessBtn}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* National License Verification Feature Highlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 border-y border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold mb-4">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>{t.natDbIntegrationBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
              {t.govVerificationTitle}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              {t.govVerificationDesc}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <span className="material-symbols-outlined text-teal-400 mt-0.5">pin</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.cardNumVerifyTitle}</h4>
                  <p className="text-[11px] text-slate-400">{t.cardNumVerifyDesc}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <span className="material-symbols-outlined text-emerald-400 mt-0.5">face</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.fraudPrevTitle}</h4>
                  <p className="text-[11px] text-slate-400">{t.fraudPrevDesc}</p>
                </div>
              </div>
            </div>

            <a
              href="https://huongdanvien.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300 font-extrabold text-xs transition-colors"
            >
              <span>{t.checkPortalBtn}</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">{t.lookupPortalTitle}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400">
                {t.liveVerifiedBadge}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">{t.guideNameLabel}</span>
                <span className="text-white font-extrabold">Nguyen Van Minh</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">{t.licenseNumberLabel}</span>
                <span className="text-teal-300 font-mono font-bold">101180293</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">{t.issuingAuthorityPortalLabel}</span>
                <span className="text-white">{t.issuingAuthHCMC}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">{t.nationalStatusLabel}</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                  {t.activeLicenseBadge}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Guides Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
            {t.featuredGuidesTitle}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {t.featuredGuidesSubtitle}
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {popularCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                selectedCity === city
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.slice(0, 6).map((guide) => (
            <div key={guide.id} className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 hover:border-teal-500/50 transition-all flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={guide.avatar}
                    alt={guide.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-extrabold text-base text-white">{guide.fullName}</h3>
                      {guide.verified && (
                        <span className="material-symbols-outlined text-teal-400 text-base" title="VNAT Verified">
                          verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-300 mt-0.5">
                      <span className="flex items-center text-amber-400 font-extrabold">
                        ★ {guide.rating} ({guide.reviewCount})
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 font-medium">{guide.city}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-4">
                  {guide.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {guide.languages.map((lang) => (
                    <span key={lang} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-extrabold border border-slate-700">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">{t.hourlyRate}</span>
                  <span className="text-lg font-black text-teal-400">${guide.hourlyRateUSD}/hr</span>
                </div>

                <button
                  onClick={handleTravelerClick}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer"
                >
                  {t.viewGuideProfile}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-teal-900/40 via-slate-900 to-slate-950 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {t.ctaTitle}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
            {t.ctaSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={handleTravelerClick}
              className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-lg cursor-pointer transition-all"
            >
              {t.getStartedTraveler}
            </button>
            <button
              onClick={onOpenAuth}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm border border-slate-700 cursor-pointer transition-all"
            >
              {t.signIn}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
