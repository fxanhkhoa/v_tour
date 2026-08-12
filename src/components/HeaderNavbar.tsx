import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Language, translations } from '../lib/translations';

interface HeaderNavbarProps {
  currentUser: User | null;
  selectedCity: string;
  onCityChange: (city: string) => void;
  onOpenAuth: () => void;
  onOpenExportRepo: () => void;
  onOpenTracker?: () => void;
  onLogout: () => void;
  pendingKYCCount?: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentUser,
  selectedCity,
  onCityChange,
  onOpenAuth,
  onOpenExportRepo,
  onOpenTracker,
  onLogout,
  pendingKYCCount = 0,
  language,
  onLanguageChange
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const cities = ['Ho Chi Minh City', 'Bangkok', 'Tokyo', 'Hanoi', 'Da Nang', 'Kyoto'];
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2.5 cursor-pointer text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-extrabold shadow-md shadow-emerald-500/20">
            <span className="material-symbols-outlined text-xl">map</span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base sm:text-lg tracking-tight text-white">
                Tour Guide <span className="text-teal-400">Hub</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden md:block">
              Verified Local Guides Platform
            </p>
          </div>
        </Link>

        {/* Center: Main Navigation Tabs */}
        <nav className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 text-xs font-bold space-x-1">
          {/* Home Route - Visible to everyone */}
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all cursor-pointer ${
              location.pathname === '/'
                ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span className="material-symbols-outlined text-base">home</span>
            <span className="hidden md:inline">{t.home}</span>
          </Link>

          {/* Traveler Route - Visible ONLY when logged in as traveler */}
          {currentUser?.role === 'traveler' && (
            <Link
              to="/traveler"
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all cursor-pointer ${
                location.pathname === '/traveler'
                  ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className="material-symbols-outlined text-base">luggage</span>
              <span className="hidden md:inline">{t.traveler}</span>
            </Link>
          )}

          {/* Guide Route - Visible ONLY when logged in as tourist guide */}
          {currentUser?.role === 'guide' && (
            <Link
              to="/guide"
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all cursor-pointer ${
                location.pathname === '/guide'
                  ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>
              <span className="hidden md:inline">{t.touristGuide}</span>
            </Link>
          )}

          {/* Admin Route - Visible ONLY when logged in as platform admin */}
          {currentUser?.role === 'admin' && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all relative cursor-pointer ${
                location.pathname === '/admin'
                  ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span className="hidden md:inline">{t.admin}</span>
              {pendingKYCCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
              )}
            </Link>
          )}
        </nav>

        {/* Right Actions: City Dropdown, Tracker, Language Switcher & User Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Active Escrow & Tour Tracker Button */}
          {currentUser && onOpenTracker && (
            <button
              onClick={onOpenTracker}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              title="Open Escrow Vault & Live Tour Tracker"
            >
              <span className="material-symbols-outlined text-sm text-amber-400">account_balance_wallet</span>
              <span className="hidden sm:inline">Escrow & Tracker</span>
            </button>
          )}

          {/* City Dropdown (visible in traveler view or desktop) */}
          <div className="hidden xl:flex items-center bg-slate-800/80 rounded-xl border border-slate-700/80 px-2.5 py-1 text-xs">
            <span className="material-symbols-outlined text-teal-400 text-sm mr-1">location_on</span>
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent text-white font-extrabold focus:outline-none cursor-pointer text-xs"
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-slate-900 text-white">
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700/90 p-0.5 text-[11px] font-black">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-teal-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('vi')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                language === 'vi'
                  ? 'bg-teal-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tiếng Việt"
            >
              VI
            </button>
          </div>

          {/* User Auth Info / Guest Login Button */}
          {currentUser ? (
            <div className="flex items-center space-x-2 bg-slate-800/80 p-1 pr-2.5 rounded-2xl border border-slate-700">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-teal-500"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white truncate max-w-[100px] leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[9px] font-extrabold uppercase text-teal-400">
                  {currentUser.role}
                </p>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                className="text-slate-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                title={t.signOut}
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>{t.signIn}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
