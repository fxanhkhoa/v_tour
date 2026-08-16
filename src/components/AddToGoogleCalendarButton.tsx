import React, { useState, useRef, useEffect } from 'react';
import { CalendarEventPayload, buildGoogleCalendarUrl, downloadIcsFile } from '../lib/googleCalendar';
import { Language } from '../lib/translations';

interface AddToGoogleCalendarButtonProps {
  payload: CalendarEventPayload;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  language?: Language;
  showDropdown?: boolean;
  dropdownPlacement?: 'top' | 'bottom' | 'auto';
}

export const AddToGoogleCalendarButton: React.FC<AddToGoogleCalendarButtonProps> = ({
  payload,
  variant = 'outline',
  size = 'sm',
  className = '',
  language = 'en',
  showDropdown = true,
  dropdownPlacement = 'auto'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && dropdownRef.current) {
      if (dropdownPlacement === 'top') {
        setOpenUpward(true);
      } else if (dropdownPlacement === 'bottom') {
        setOpenUpward(false);
      } else {
        // Auto detect based on space from bottom of viewport / container
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 220);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleOpenGoogleCalendar = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const url = buildGoogleCalendarUrl(payload);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleDownloadIcs = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    downloadIcsFile(payload);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2.5 space-x-1.5 rounded-xl',
    md: 'text-xs sm:text-sm py-2 px-3.5 space-x-2 rounded-xl',
    lg: 'text-sm py-2.5 px-4 space-x-2 rounded-2xl'
  }[size];

  const variantClasses = {
    primary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm font-black active:scale-95',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700',
    outline: 'bg-white hover:bg-teal-50/60 text-teal-800 border border-teal-300/80 font-bold shadow-2xs hover:border-teal-500',
    compact: 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-extrabold shadow-2xs',
    minimal: 'text-teal-600 hover:text-teal-700 hover:bg-teal-50/80 font-bold p-1 rounded-lg'
  }[variant];

  // SVG Google Calendar Logo
  const GoogleCalendarIcon = () => (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
    </svg>
  );

  if (!showDropdown) {
    return (
      <button
        onClick={handleOpenGoogleCalendar}
        className={`inline-flex items-center justify-center transition-all cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
        title={language === 'vi' ? 'Thêm vào Google Calendar' : 'Add to Google Calendar'}
      >
        <GoogleCalendarIcon />
        <span className="whitespace-nowrap font-bold">
          {language === 'vi' ? 'Google Calendar' : 'Google Calendar'}
        </span>
      </button>
    );
  }

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={dropdownRef}>
      <div className="inline-flex rounded-xl shadow-2xs">
        {/* Main 1-Click Button */}
        <button
          onClick={handleOpenGoogleCalendar}
          className={`inline-flex items-center justify-center transition-all cursor-pointer ${sizeClasses} ${variantClasses} rounded-r-none border-r-0`}
          title={language === 'vi' ? 'Thêm ngay vào Google Calendar' : 'Add directly to Google Calendar'}
        >
          <GoogleCalendarIcon />
          <span className="whitespace-nowrap font-bold">
            {language === 'vi' ? 'Google Calendar' : 'Google Calendar'}
          </span>
        </button>

        {/* Dropdown Toggle */}
        <button
          onClick={toggleDropdown}
          className={`px-1.5 flex items-center justify-center transition-all cursor-pointer ${variantClasses} rounded-l-none border-l border-teal-200/50`}
          title="More calendar options"
        >
          <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
        </button>
      </div>

      {/* Options Menu */}
      {isOpen && (
        <div className={`absolute right-0 ${
          openUpward ? 'bottom-full mb-1.5 origin-bottom-right' : 'top-full mt-1.5 origin-top-right'
        } w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl z-[100] overflow-hidden animate-fade-in p-1.5 space-y-1`}>
          <div className="px-2.5 py-1.5 border-b border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {language === 'vi' ? 'Đồng bộ Lịch' : 'Calendar Sync'}
            </p>
          </div>

          <button
            onClick={handleOpenGoogleCalendar}
            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-800 hover:bg-teal-50 hover:text-teal-900 transition-colors flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <GoogleCalendarIcon />
            </div>
            <div>
              <p className="font-extrabold leading-none">{language === 'vi' ? 'Google Calendar' : 'Google Calendar'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{language === 'vi' ? 'Mở trong tab mới' : 'Open in Google web'}</p>
            </div>
          </button>

          <button
            onClick={handleDownloadIcs}
            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm">download</span>
            </div>
            <div>
              <p className="font-extrabold leading-none">{language === 'vi' ? 'Tải file iCal (.ics)' : 'Download iCal (.ics)'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{language === 'vi' ? 'Apple / Outlook / Phone' : 'Apple, Outlook & Phone'}</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
