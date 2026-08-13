import React, { useState, useMemo } from 'react';
import { GuideProfile, TourPackage, ScheduleSlot, NegotiationOffer } from '../../types';
import { Language, translations } from '../../lib/translations';

interface GuideDirectoryAndNegotiateProps {
  tours?: TourPackage[];
  guides: GuideProfile[];
  selectedCity: string;
  onCityChange?: (city: string) => void;
  onNegotiateWithGuide: (
    guide: GuideProfile,
    offeredPriceUSD: number,
    message: string,
    tourId?: string,
    tourTitle?: string,
    selectedSlot?: ScheduleSlot,
    groupSize?: number,
    originalPriceUSD?: number
  ) => void;
  language?: Language;
  negotiations?: NegotiationOffer[];
}

export const GuideDirectoryAndNegotiate: React.FC<GuideDirectoryAndNegotiateProps> = ({
  tours = [],
  guides,
  selectedCity,
  onCityChange,
  onNegotiateWithGuide,
  language = 'en',
  negotiations = []
}) => {
  const t = translations[language] || translations.en;

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [maxPriceUSD, setMaxPriceUSD] = useState<number>(100);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);

  // Tour Negotiation Modal State
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);
  const [customDateStr, setCustomDateStr] = useState<string>('');
  const [customStartTime, setCustomStartTime] = useState<string>('09:00');
  const [customEndTime, setCustomEndTime] = useState<string>('12:00');
  const [groupSize, setGroupSize] = useState<number>(2);
  const [offeredPrice, setOfferedPrice] = useState<number>(50);
  const [offerMessage, setOfferMessage] = useState<string>('');

  // Unique categories
  const categories = ['All', 'Food', 'Culture', 'Scooter', 'Nature', 'History', 'Adventure', 'Photography'];
  const cities = ['All', 'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Hue', 'Nha Trang', 'Sapa', 'Phu Quoc', 'Ha Long Bay', 'Can Tho'];

  // Filtered Tours
  const filteredTours = useMemo(() => {
    return (tours || []).filter((tour) => {
      // City match
      const cityMatch = !selectedCity || selectedCity === 'All' || (tour.city && tour.city.toLowerCase() === selectedCity.toLowerCase());
      
      // Category match
      const catMatch = categoryFilter === 'All' || (tour.category && tour.category.toLowerCase().includes(categoryFilter.toLowerCase()));

      // Query match
      const q = searchQuery.toLowerCase().trim();
      const queryMatch = !q ||
        (tour.title && tour.title.toLowerCase().includes(q)) ||
        (tour.description && tour.description.toLowerCase().includes(q)) ||
        (tour.guideName && tour.guideName.toLowerCase().includes(q)) ||
        (tour.category && tour.category.toLowerCase().includes(q)) ||
        (tour.city && tour.city.toLowerCase().includes(q));

      // Price match
      const priceMatch = tour.priceUSDPerPerson <= maxPriceUSD;

      // Guide verification match
      if (filterVerifiedOnly) {
        const guide = (guides || []).find(g => g.id === tour.guideId || g.fullName === tour.guideName);
        if (guide && !guide.verified && guide.kycStatus !== 'verified') return false;
      }

      return cityMatch && catMatch && queryMatch && priceMatch;
    });
  }, [tours, guides, selectedCity, categoryFilter, searchQuery, maxPriceUSD, filterVerifiedOnly]);

  // Open modal for tour
  const handleOpenTourNegotiation = (tour: TourPackage) => {
    setSelectedTour(tour);
    const defaultSlot = tour.scheduleSlots && tour.scheduleSlots.length > 0 ? tour.scheduleSlots[0] : null;
    setSelectedSlot(defaultSlot);
    setUseCustomTime(!defaultSlot);
    setGroupSize(2);
    const baseTotal = tour.priceUSDPerPerson * 2;
    setOfferedPrice(baseTotal);
    setOfferMessage(`Hi ${tour.guideName}! I would like to negotiate this tour for ${2} travelers.`);
  };

  // Recalculate price when group size changes
  const handleGroupSizeChange = (newSize: number) => {
    if (newSize < 1) return;
    setGroupSize(newSize);
    if (selectedTour) {
      setOfferedPrice(selectedTour.priceUSDPerPerson * newSize);
    }
  };

  // Confirm Tour Negotiation
  const handleConfirmTourOffer = () => {
    if (!selectedTour) return;

    let finalGuide = guides.find(g => g.id === selectedTour.guideId || g.fullName.toLowerCase() === selectedTour.guideName.toLowerCase());
    if (!finalGuide) {
      finalGuide = {
        id: selectedTour.guideId || 'g_1',
        userId: 'u_guide_1',
        fullName: selectedTour.guideName,
        avatar: selectedTour.guideAvatar,
        city: selectedTour.city,
        rating: selectedTour.rating || 4.9,
        reviewCount: selectedTour.reviewsCount || 50,
        hourlyRateUSD: 20,
        languages: ['English', 'Vietnamese'],
        bio: selectedTour.description,
        tourTypes: ['walking', 'food', 'culture'],
        badges: ['Licensed Guide 📜'],
        isOnline: true,
        currentLat: 10.7769,
        currentLng: 106.7009,
        verified: true,
        kycStatus: 'verified',
        completedTours: 100
      };
    }

    let slotObj: ScheduleSlot | undefined = undefined;
    if (!useCustomTime && selectedSlot) {
      slotObj = selectedSlot;
    } else if (customDateStr) {
      slotObj = {
        id: 'custom_' + Date.now(),
        dateStr: customDateStr,
        startTime: customStartTime,
        endTime: customEndTime,
        displayLabel: `${customDateStr} (${customStartTime} - ${customEndTime})`
      };
    } else {
      slotObj = {
        id: 'slot_default',
        dateStr: 'Flexible Date',
        startTime: '09:00',
        endTime: '12:00',
        displayLabel: 'Flexible Schedule as Agreed'
      };
    }

    const baseTotal = selectedTour.priceUSDPerPerson * groupSize;

    onNegotiateWithGuide(
      finalGuide,
      offeredPrice,
      offerMessage || `Negotiating for ${selectedTour.title} (${groupSize} travelers)`,
      selectedTour.id,
      selectedTour.title,
      slotObj,
      groupSize,
      baseTotal
    );

    setSelectedTour(null);
  };

  return (
    <div className="space-y-6">

      {/* Main Container Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-1 border border-teal-200">
              <span className="material-symbols-outlined text-sm">explore</span>
              <span>{language === 'vi' ? 'Khám Phá Tour HDV Tạo & Thương Lượng' : 'Search Guide Created Tours & Negotiate'}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Tìm Tour Do Hướng Dẫn Viên Thiết Kế' : 'Browse Local Tours & Negotiate Price & Time Slot'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {language === 'vi'
                ? 'Tìm kiếm các tour do HDV bản địa đăng tải, chọn khung giờ phù hợp và đề xuất mức giá thương lượng trực tiếp.'
                : 'Filter guide-created itineraries by city, category, or budget. Pick an available schedule slot and negotiate custom prices directly.'}
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          
          {/* Top Search Input & City Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Keyword Input */}
            <div className="lg:col-span-2 relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm tên tour, điểm đến, ẩm thực, HDV...' : 'Search tour titles, highlights, guide name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* City Filter */}
            <div>
              <select
                value={selectedCity || 'All'}
                onChange={(e) => {
                  if (onCityChange) {
                    onCityChange(e.target.value);
                  }
                }}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="All">{language === 'vi' ? '🏙️ Tất cả thành phố' : '🏙️ All Cities'}</option>
                {cities.filter(c => c !== 'All').map(city => (
                  <option key={city} value={city}>📍 {city}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="All">{language === 'vi' ? '🏷️ Tất cả chủ đề' : '🏷️ All Categories'}</option>
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>✨ {cat}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Secondary Filters: Price Slider & License Checkbox */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200/60 text-xs">
            
            {/* Price Filter Slider */}
            <div className="flex items-center space-x-3">
              <span className="font-extrabold text-slate-700 whitespace-nowrap">
                {language === 'vi' ? 'Giá tối đa/người:' : 'Max Price/Person:'} <strong className="text-teal-700">${maxPriceUSD} USD</strong>
              </span>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={maxPriceUSD}
                onChange={(e) => setMaxPriceUSD(Number(e.target.value))}
                className="w-32 accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Verified License Toggle */}
            <label className="inline-flex items-center space-x-2 cursor-pointer text-slate-700 font-bold">
              <input
                type="checkbox"
                checked={filterVerifiedOnly}
                onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>{language === 'vi' ? 'Chỉ xem HDV có thẻ hành nghề 📜' : 'Show Verified License Guides Only 📜'}</span>
            </label>

          </div>

        </div>

        {/* RESULTS GRID - TOURS VIEW */}
        <div>
          {filteredTours.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">travel_explore</span>
              <p className="text-sm font-bold">{language === 'vi' ? 'Không tìm thấy tour phù hợp với bộ lọc' : 'No tours found matching your search criteria'}</p>
              <p className="text-xs text-slate-400">{language === 'vi' ? 'Thử giảm giá, đổi từ khóa hoặc chọn thành phố khác.' : 'Try adjusting your max price slider or keyword search.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTours.map((tour) => {
                const existingNegotiation = negotiations?.find(
                  (n) => n.tourId === tour.id && (n.status === 'pending' || n.status === 'countered')
                );

                return (
                  <div
                    key={tour.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Tour Image Header */}
                      <div className="relative h-48 overflow-hidden bg-slate-900">
                        <img
                          src={tour.imageUrl}
                          alt={tour.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border border-white/20">
                          {tour.category}
                        </div>
                        {existingNegotiation && (
                          <div className="absolute top-12 left-3 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border border-white/20 flex items-center space-x-1 shadow-md z-10">
                            <span className="material-symbols-outlined text-[12px] font-black">pending_actions</span>
                            <span>{language === 'vi' ? 'Đã Gửi Đề Xuất' : 'Offer Sent'}</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-teal-500 text-slate-950 font-black px-3 py-1 rounded-full text-xs shadow-md">
                          ${tour.priceUSDPerPerson} <span className="text-[10px] font-bold">/person</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                          <span>📍 {tour.city}</span>
                          <span>⏱️ {tour.durationHours} {language === 'vi' ? 'Giờ' : 'Hours'}</span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                          {tour.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-2">
                          {tour.description}
                        </p>

                        {/* Guide Info Tag */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={tour.guideAvatar}
                              alt={tour.guideName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">{tour.guideName}</p>
                              <p className="text-[10px] text-amber-500 font-bold">★ {tour.rating} ({tour.reviewsCount} reviews)</p>
                            </div>
                          </div>

                          {/* Slots Badge */}
                          <div className="text-right">
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              <span>{tour.scheduleSlots?.length || 0} {language === 'vi' ? 'Khung giờ' : 'Slots'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-5 pt-0">
                      {existingNegotiation ? (
                        <div className="w-full py-2.5 rounded-2xl bg-amber-50 text-amber-800 font-extrabold text-xs border border-amber-200 flex items-center justify-center space-x-2">
                          <span className="material-symbols-outlined text-sm text-amber-500 font-bold">check_circle</span>
                          <span>{language === 'vi' ? `Đã Gửi Đề Xuất ($${existingNegotiation.offeredPriceUSD})` : `Offer Sent ($${existingNegotiation.offeredPriceUSD})`}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenTourNegotiation(tour)}
                          className="w-full py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">handshake</span>
                          <span>{language === 'vi' ? 'Chọn Tour & Thương Lượng Giá' : 'Select Tour & Negotiate Slot'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* TOUR DETAILS & NEGOTIATION MODAL */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative border border-slate-100 space-y-5 my-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedTour(null)}
              className="sticky top-0 float-right -mt-1 -mr-1 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all z-20 shadow-sm"
              title="Close"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start border-b border-slate-100 pb-4">
              <img
                src={selectedTour.imageUrl}
                alt={selectedTour.title}
                className="w-full sm:w-36 h-28 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase">
                    {selectedTour.category}
                  </span>
                  <span className="text-xs font-bold text-slate-500">📍 {selectedTour.city}</span>
                </div>
                <h4 className="font-black text-slate-900 text-lg leading-snug">{selectedTour.title}</h4>
                <p className="text-xs text-slate-500">
                  {language === 'vi' ? 'Được tạo bởi HDV:' : 'Hosted by:'} <strong className="text-slate-800">{selectedTour.guideName}</strong> • ⭐ {selectedTour.rating}
                </p>
              </div>
            </div>

            {/* Tour Description & Inclusions */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <p className="text-xs text-slate-700 leading-relaxed">{selectedTour.description}</p>
              
              {selectedTour.itinerarySummary && (
                <p className="text-xs font-bold text-teal-800 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                  🗺️ {selectedTour.itinerarySummary}
                </p>
              )}

              {selectedTour.inclusions && selectedTour.inclusions.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                    {language === 'vi' ? 'Dịch vụ bao gồm:' : 'Inclusions:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTour.inclusions.map((inc, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                        ✓ {inc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 1: SELECT TIME SLOT / SCHEDULE */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center space-x-1">
                <span className="material-symbols-outlined text-teal-600 text-base">calendar_clock</span>
                <span>{language === 'vi' ? '1. Chọn Khung Giờ HDV Mở Hoặc Tùy Chỉnh' : '1. Select Available Schedule Slot'}</span>
              </h5>

              {/* Slots List */}
              {selectedTour.scheduleSlots && selectedTour.scheduleSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTour.scheduleSlots.map((slot) => {
                    const isSelected = !useCustomTime && selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setUseCustomTime(false);
                        }}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-extrabold text-slate-900">{slot.displayLabel || `${slot.dateStr} (${slot.startTime} - ${slot.endTime})`}</p>
                        <p className="text-[10px] text-teal-700 font-bold mt-0.5">
                          {isSelected ? '✓ Selected Slot' : 'Click to select'}
                        </p>
                      </button>
                    );
                  })}

                  {/* Custom Time Option */}
                  <button
                    type="button"
                    onClick={() => setUseCustomTime(true)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      useCustomTime
                        ? 'bg-teal-50 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-slate-900">
                      ✏️ {language === 'vi' ? 'Đề xuất ngày & giờ riêng' : 'Propose custom date & time'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {useCustomTime ? '✓ Custom time active' : 'Click to input custom schedule'}
                    </p>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {language === 'vi' ? 'HDV chưa mở khung giờ cố định. Nhập thời gian bạn muốn bên dưới:' : 'No set slots available. Input your preferred schedule below:'}
                </p>
              )}

              {/* Custom Date & Time Inputs */}
              {(useCustomTime || !selectedTour.scheduleSlots || selectedTour.scheduleSlots.length === 0) && (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3">
                  <p className="text-xs font-bold text-amber-900">
                    📅 {language === 'vi' ? 'Nhập ngày giờ đề xuất của bạn:' : 'Enter your proposed date & time slot:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-0.5">{language === 'vi' ? 'Ngày' : 'Date'}</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={customDateStr}
                        onChange={(e) => setCustomDateStr(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-0.5">{language === 'vi' ? 'Giờ bắt đầu' : 'Start Time'}</label>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-0.5">{language === 'vi' ? 'Giờ kết thúc' : 'End Time'}</label>
                      <input
                        type="time"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: NUMBER OF TRAVELERS */}
            <div className="space-y-2">
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center space-x-1">
                <span className="material-symbols-outlined text-teal-600 text-base">groups</span>
                <span>{language === 'vi' ? '2. Số Lượng Khách Du Lịch' : '2. Number of Travelers'}</span>
              </h5>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {groupSize} {groupSize === 1 ? 'Traveler' : 'Travelers'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ${selectedTour.priceUSDPerPerson} USD/person baseline rate
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleGroupSizeChange(groupSize - 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-sm text-slate-900 w-4 text-center">{groupSize}</span>
                  <button
                    type="button"
                    onClick={() => handleGroupSizeChange(groupSize + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3: NEGOTIATE PROPOSED PRICE & OFFER MESSAGE */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center space-x-1">
                <span className="material-symbols-outlined text-teal-600 text-base">handshake</span>
                <span>{language === 'vi' ? '3. Đề Xuất Mức Giá Thương Lượng & Lời Nhắn' : '3. Negotiate Offer Price & Custom Request'}</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    {language === 'vi' ? 'Mức Giá Bạn Đề Xuất ($ USD):' : 'Your Proposed Total Price ($ USD):'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(Number(e.target.value))}
                    className="w-full p-3 bg-teal-50/50 border-2 border-teal-500/80 rounded-2xl text-lg font-black text-teal-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {language === 'vi' ? 'Giá gốc theo niêm yết:' : 'Listed total baseline:'} <strong>${selectedTour.priceUSDPerPerson * groupSize} USD</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    {language === 'vi' ? 'Ghi chú / Yêu cầu đặc biệt:' : 'Special Note or Preferences:'}
                  </label>
                  <textarea
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder={language === 'vi' ? 'Nhập lời nhắn hoặc ghi chú về ăn uống, điểm hẹn...' : 'Add special requests, hotel pickup details, dietary needs...'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 h-20 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Offer Button */}
            <div className="pt-2">
              <button
                onClick={handleConfirmTourOffer}
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                <span>
                  {language === 'vi'
                    ? `Gửi Yêu Cầu Thương Lượng $${offeredPrice} USD Cho Tour`
                    : `Send $${offeredPrice} USD Negotiation Offer for Tour`}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
