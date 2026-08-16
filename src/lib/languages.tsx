import React, { useState, useRef, useEffect } from 'react';

export interface TourLanguage {
  code: string;
  name: string; // English standard name
  nameVi: string; // Vietnamese translated name
  nativeName: string; // Native script
  flag: string; // Flag emoji
  popular?: boolean;
  category: 'popular' | 'asia' | 'europe' | 'middle_east' | 'americas' | 'flexible';
}

export const TOUR_LANGUAGES: TourLanguage[] = [
  // Popular Languages
  { code: 'en', name: 'English', nameVi: 'Tiếng Anh', nativeName: 'English', flag: '🇬🇧', popular: true, category: 'popular' },
  { code: 'vi', name: 'Vietnamese', nameVi: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '🇻🇳', popular: true, category: 'popular' },
  { code: 'fr', name: 'French', nameVi: 'Tiếng Pháp', nativeName: 'Français', flag: '🇫🇷', popular: true, category: 'popular' },
  { code: 'ja', name: 'Japanese', nameVi: 'Tiếng Nhật', nativeName: '日本語', flag: '🇯🇵', popular: true, category: 'popular' },
  { code: 'ko', name: 'Korean', nameVi: 'Tiếng Hàn', nativeName: '한국어', flag: '🇰🇷', popular: true, category: 'popular' },
  { code: 'zh', name: 'Mandarin Chinese', nameVi: 'Tiếng Trung (Phổ Thông)', nativeName: '中文 (普通话)', flag: '🇨🇳', popular: true, category: 'popular' },
  { code: 'es', name: 'Spanish', nameVi: 'Tiếng Tây Ban Nha', nativeName: 'Español', flag: '🇪🇸', popular: true, category: 'popular' },
  { code: 'de', name: 'German', nameVi: 'Tiếng Đức', nativeName: 'Deutsch', flag: '🇩🇪', popular: true, category: 'popular' },
  { code: 'ru', name: 'Russian', nameVi: 'Tiếng Nga', nativeName: 'Русский', flag: '🇷🇺', popular: true, category: 'popular' },
  
  // Asia & Pacific
  { code: 'zh-yue', name: 'Cantonese', nameVi: 'Tiếng Quảng Đông', nativeName: '粵語 / 廣東話', flag: '🇭🇰', category: 'asia' },
  { code: 'th', name: 'Thai', nameVi: 'Tiếng Thái', nativeName: 'ภาษาไทย', flag: '🇹🇭', category: 'asia' },
  { code: 'id', name: 'Indonesian', nameVi: 'Tiếng Indonesia', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', category: 'asia' },
  { code: 'ms', name: 'Malay', nameVi: 'Tiếng Mã Lai', nativeName: 'Bahasa Melayu', flag: '🇲🇾', category: 'asia' },
  { code: 'hi', name: 'Hindi', nameVi: 'Tiếng Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', category: 'asia' },
  { code: 'tl', name: 'Tagalog (Filipino)', nameVi: 'Tiếng Philippines', nativeName: 'Wikang Tagalog', flag: '🇵🇭', category: 'asia' },
  { code: 'km', name: 'Khmer', nameVi: 'Tiếng Campuchia (Khmer)', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭', category: 'asia' },
  { code: 'my', name: 'Burmese', nameVi: 'Tiếng Myanmar (Miến Điện)', nativeName: 'မြန်မာစာ', flag: '🇲🇲', category: 'asia' },
  { code: 'lo', name: 'Lao', nameVi: 'Tiếng Lào', nativeName: 'ພາສາລາວ', flag: '🇱🇦', category: 'asia' },

  // Europe
  { code: 'it', name: 'Italian', nameVi: 'Tiếng Ý', nativeName: 'Italiano', flag: '🇮🇹', category: 'europe' },
  { code: 'nl', name: 'Dutch', nameVi: 'Tiếng Hà Lan', nativeName: 'Nederlands', flag: '🇳🇱', category: 'europe' },
  { code: 'pt', name: 'Portuguese', nameVi: 'Tiếng Bồ Đào Nha', nativeName: 'Português', flag: '🇵🇹', category: 'europe' },
  { code: 'pl', name: 'Polish', nameVi: 'Tiếng Ba Lan', nativeName: 'Polski', flag: '🇵🇱', category: 'europe' },
  { code: 'sv', name: 'Swedish', nameVi: 'Tiếng Thụy Điển', nativeName: 'Svenska', flag: '🇸🇪', category: 'europe' },
  { code: 'da', name: 'Danish', nameVi: 'Tiếng Đan Mạch', nativeName: 'Dansk', flag: '🇩🇰', category: 'europe' },
  { code: 'no', name: 'Norwegian', nameVi: 'Tiếng Na Uy', nativeName: 'Norsk', flag: '🇳🇴', category: 'europe' },
  { code: 'tr', name: 'Turkish', nameVi: 'Tiếng Thổ Nhĩ Kỳ', nativeName: 'Türkçe', flag: '🇹🇷', category: 'europe' },
  { code: 'el', name: 'Greek', nameVi: 'Tiếng Hy Lạp', nativeName: 'Ελληνικά', flag: '🇬🇷', category: 'europe' },
  { code: 'cs', name: 'Czech', nameVi: 'Tiếng Séc', nativeName: 'Čeština', flag: '🇨🇿', category: 'europe' },

  // Middle East & Others
  { code: 'ar', name: 'Arabic', nameVi: 'Tiếng Ả Rập', nativeName: 'العربية', flag: '🇸🇦', category: 'middle_east' },
  { code: 'he', name: 'Hebrew', nameVi: 'Tiếng Do Thái (Hebrew)', nativeName: 'עברית', flag: '🇮🇱', category: 'middle_east' },
  
  // Flexible & Multilingual
  { code: 'multi', name: 'Multilingual / Flexible', nameVi: 'Đa Ngôn Ngữ / Linh Hoạt', nativeName: 'Multilingual', flag: '🌐', category: 'flexible' }
];

/**
 * Find matching language object by name or code
 */
export function getLanguageOption(langStr: string): TourLanguage | undefined {
  if (!langStr) return undefined;
  const clean = langStr.trim().toLowerCase();
  return TOUR_LANGUAGES.find(l => 
    l.name.toLowerCase() === clean ||
    l.nameVi.toLowerCase() === clean ||
    l.nativeName.toLowerCase() === clean ||
    l.code.toLowerCase() === clean ||
    clean.includes(l.name.toLowerCase()) ||
    l.name.toLowerCase().includes(clean)
  );
}

/**
 * Returns flag emoji for a given language name
 */
export function getLanguageFlag(langStr: string): string {
  const found = getLanguageOption(langStr);
  return found ? found.flag : '🗣️';
}

/**
 * Returns formatted display label with flag
 */
export function formatLanguageWithFlag(langStr: string, isVi: boolean = false): string {
  if (!langStr) return '';
  const found = getLanguageOption(langStr);
  if (!found) return `🗣️ ${langStr}`;
  return `${found.flag} ${isVi ? found.nameVi : found.name}`;
}

interface LanguageDropdownProps {
  value: string;
  onChange: (languageName: string) => void;
  label?: string;
  required?: boolean;
  isVietnamese?: boolean;
  className?: string;
  helperText?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  value,
  onChange,
  label,
  required = false,
  isVietnamese = false,
  className = '',
  helperText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = getLanguageOption(value) || {
    code: 'custom',
    name: value || 'English',
    nameVi: value || 'Tiếng Anh',
    nativeName: value || 'English',
    flag: getLanguageFlag(value) || '🌐',
    category: 'popular' as const
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = TOUR_LANGUAGES.filter(lang => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nameVi.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block font-bold text-slate-700 mb-1.5 text-xs sm:text-sm">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-teal-500 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center justify-between text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className="text-lg leading-none">{selectedLang.flag}</span>
          <div className="text-left truncate">
            <span className="font-bold text-slate-900">
              {isVietnamese ? selectedLang.nameVi : selectedLang.name}
            </span>
            {selectedLang.nativeName && selectedLang.nativeName !== selectedLang.name && (
              <span className="text-slate-400 text-xs ml-1.5 hidden sm:inline">
                ({selectedLang.nativeName})
              </span>
            )}
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-lg ml-2 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 flex flex-col animate-in fade-in-50 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base">
                search
              </span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isVietnamese ? 'Tìm ngôn ngữ hướng dẫn...' : 'Search spoken language...'}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Language Options List */}
          <div className="overflow-y-auto p-1.5 divide-y divide-slate-50">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isVietnamese ? 'Không tìm thấy ngôn ngữ phù hợp' : 'No matching language found'}
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = selectedLang.name.toLowerCase() === lang.name.toLowerCase();
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onChange(lang.name);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base leading-none">{lang.flag}</span>
                      <div>
                        <span className="font-semibold">
                          {isVietnamese ? lang.nameVi : lang.name}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1.5">
                          {lang.nativeName}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-teal-600 text-base">check</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
          <span className="material-symbols-outlined text-xs">info</span>
          <span>{helperText}</span>
        </p>
      )}
    </div>
  );
};
