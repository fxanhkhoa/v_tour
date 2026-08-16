import React, { useState } from 'react';
import { User, ScheduleSlot, TourBooking } from '../../types';
import { Language, translations } from '../../lib/translations';
import { CalendarDragDropPicker, mergeScheduleSlots } from '../../components/CalendarDragDropPicker';
import { validateSlotsAgainstBookings } from '../../lib/conflictCheck';
import { MockPaymentGateway, PaymentSuccessResult } from '../../components/MockPaymentGateway';

interface CreateTravelerPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  selectedCity: string;
  onCreatePost: (postData: any) => void;
  bookings?: TourBooking[];
  language?: Language;
}

export const CreateTravelerPostModal: React.FC<CreateTravelerPostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedCity,
  onCreatePost,
  bookings = [],
  language = 'en'
}) => {
  if (!isOpen) return null;

  const t = translations[language] || translations.en;

  // Multi-step Wizard: Step 1 (Trip Details) -> Step 2 (Deposit & Mock Payment)
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details');

  const [title, setTitle] = useState<string>('');
  const [city, setCity] = useState<string>(selectedCity || 'Ho Chi Minh City');
  
  // Custom interactive Time Slot Picker State using CalendarDragDropPicker
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [groupSize, setGroupSize] = useState<number>(2);
  const [minBudgetUSD, setMinBudgetUSD] = useState<number>(30);
  const [maxBudgetUSD, setMaxBudgetUSD] = useState<number>(60);
  const [description, setDescription] = useState<string>('');
  const [languagesInput, setLanguagesInput] = useState<string>('English');

  // Filter traveler's active confirmed bookings
  const myActiveBookings = (bookings || []).filter(
    b => (b.travelerId === currentUser?.id || currentUser?.role === 'admin') && b.status !== 'cancelled'
  );

  // Helper functions to parse hours and calculate duration of slots
  const parseHourFromStr = (timeStr: string): number => {
    if (!timeStr) return 0;
    const lower = timeStr.toLowerCase().trim();
    const match = lower.match(/(\d+):?(\d+)?\s*(am|pm)?/);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const isPm = match[3] === 'pm';
    const isAm = match[3] === 'am';
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h;
  };

  const calculateSlotDuration = (slot: ScheduleSlot) => {
    const startH = parseHourFromStr(slot.startTime);
    const endH = parseHourFromStr(slot.endTime);
    let diff = endH - startH;
    if (diff <= 0) diff += 24;
    return diff;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (!title.trim() || !description.trim()) return;

    if (scheduleSlots.length === 0) {
      alert(language === 'vi' ? 'Vui lòng thêm ít nhất một khung giờ yêu cầu!' : 'Please add at least one preferred time slot!');
      return;
    }

    // Pre-submission Conflict Check against confirmed bookings
    const conflictCheck = validateSlotsAgainstBookings(scheduleSlots, myActiveBookings, language === 'vi' ? 'vi' : 'en');
    if (conflictCheck.hasConflict) {
      setConflictError(
        conflictCheck.conflictDetails ||
        (language === 'vi' 
          ? 'Phát hiện trùng lịch với tour đã đặt trước! Vui lòng chọn khung giờ khác.' 
          : 'Schedule conflict detected with your confirmed tour booking! Please adjust your time slots.')
      );
      return;
    }

    // Transition to Mock Payment Gateway step
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (result: PaymentSuccessResult) => {
    const preferredLanguages = languagesInput.split(',').map(s => s.trim()).filter(Boolean);
    const mergedSlots = mergeScheduleSlots(scheduleSlots);
    const aggregatedPreferredDate = mergedSlots.map(s => s.displayLabel || `${s.startTime} - ${s.endTime} on ${s.dateStr}`).join('; ');
    const totalDurationHours = mergedSlots.reduce((sum, s) => sum + calculateSlotDuration(s), 0);

    const postPayload = {
      travelerId: currentUser?.id || 'u_' + Date.now(),
      travelerName: currentUser?.name || 'Traveler',
      travelerEmail: currentUser?.email,
      travelerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      title,
      city,
      preferredDate: aggregatedPreferredDate,
      scheduleSlots: mergedSlots,
      durationHours: totalDurationHours,
      groupSize,
      minBudgetUSD,
      maxBudgetUSD,
      description,
      preferredLanguages,
      depositAmountUSD: result.amountUSD,
      depositStatus: 'paid_in_escrow',
      depositPaymentMethod: result.cardBrand ? `${result.paymentMethod}_${result.cardBrand}` : result.paymentMethod,
      depositTxId: result.txId,
      depositPaidAt: result.paidAt
    };

    onCreatePost(postPayload);
    onClose();
    setCurrentStep('details');
  };

  const handleClose = () => {
    setCurrentStep('details');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg md:max-w-3xl lg:max-w-5xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 lg:p-9 shadow-2xl relative border border-slate-100 my-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
        </button>

        {/* Modal Header & Multi-Step Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center space-x-2 text-teal-600 text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">campaign</span>
              <span>{t.customPostBadge}</span>
            </div>

            {/* Step Indicator Badges */}
            <div className="flex items-center space-x-2 text-xs">
              <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full font-bold transition-colors ${
                currentStep === 'details' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                <span>{currentStep === 'payment' ? '✓' : '1'}</span>
                <span>{language === 'vi' ? 'Thông Tin Tour' : 'Trip Details'}</span>
              </span>
              <span className="text-slate-300">→</span>
              <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full font-bold transition-colors ${
                currentStep === 'payment' 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                <span>2</span>
                <span>{language === 'vi' ? 'Ký Quỹ Escrow (Visa / QR)' : 'Escrow Deposit'}</span>
              </span>
            </div>
          </div>

          <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 mb-1">
            {currentStep === 'details' ? t.postRequestModalTitle : (language === 'vi' ? 'Ký Quỹ Tiền Cọc Đảm Bảo Trước Khi Đăng Bài' : 'Escrow Deposit & Mock Payment Gateway')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {currentStep === 'details' 
              ? (language === 'vi' 
                  ? 'Mô tả nhu cầu của bạn. Sau khi điền thông tin, bạn sẽ ký quỹ ngân sách vào Escrow Vault để chứng minh yêu cầu thật.' 
                  : 'Specify your itinerary and preferred time slots. You will deposit your tour budget into platform escrow before posting.')
              : (language === 'vi' 
                  ? 'Khoản tiền ký quỹ được giữ 100% an toàn trên Escrow Vault. Chỉ giải ngân cho hướng dẫn viên sau khi hoàn thành tour.' 
                  : 'Deposit your budget into secure platform escrow. Funds are 100% refundable and only released to the guide upon tour completion.')}
          </p>
        </div>

        {conflictError && (
          <div className="mb-5 p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 text-xs sm:text-sm font-semibold flex items-start space-x-3 shadow-sm animate-shake">
            <span className="material-symbols-outlined text-rose-600 text-xl flex-shrink-0 mt-0.5">warning</span>
            <div className="flex-1">
              <p className="font-bold text-rose-800 uppercase tracking-wider text-[11px] mb-0.5">
                {language === 'vi' ? '⚠️ Phát Hiện Xung Đột Lịch Trình' : '⚠️ Schedule Conflict Detected'}
              </p>
              <p>{conflictError}</p>
            </div>
            <button
              type="button"
              onClick={() => setConflictError(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* STEP 1: Trip Request Details & Drag/Drop Slot Picker */}
        {currentStep === 'details' ? (
          <form onSubmit={handleProceedToPayment} className="space-y-6 text-xs sm:text-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Column: Trip Details & Preferences */}
              <div className="col-span-12 space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {t.tripTitleLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.tripTitlePlaceholder}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">{t.cityLabel}</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium transition-all"
                    >
                      <option value="Ho Chi Minh City">Ho Chi Minh City</option>
                      <option value="Hanoi">Hanoi</option>
                      <option value="Da Nang">Da Nang</option>
                      <option value="Hoi An">Hoi An</option>
                      <option value="Hue">Hue</option>
                      <option value="Nha Trang">Nha Trang</option>
                      <option value="Sapa">Sapa</option>
                      <option value="Phu Quoc">Phu Quoc</option>
                      <option value="Ha Long Bay">Ha Long Bay</option>
                      <option value="Can Tho">Can Tho</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">{t.preferredLanguagesLabel}</label>
                    <input
                      type="text"
                      value={languagesInput}
                      onChange={(e) => setLanguagesInput(e.target.value)}
                      placeholder="English, French, Japanese..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">{t.groupSizeLabel}</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="group-size"
                        min="1"
                        required
                        value={groupSize}
                        onChange={(e) => setGroupSize(Number(e.target.value))}
                        className="w-full p-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-bold transition-all"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-lg">
                        group
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">{t.maxBudgetLabel}</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="budget"
                        min="10"
                        required
                        value={maxBudgetUSD}
                        onChange={(e) => setMaxBudgetUSD(Number(e.target.value))}
                        className="w-full p-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm transition-all"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-lg">
                        attach_money
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {t.tripDetailsLabel} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.tripDetailsPlaceholder}
                    rows={4}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm transition-all resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Calendar Time Slots Picker */}
              <div className="col-span-12 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">
                    {language === 'vi' ? 'Lịch Chọn Khung Giờ Yêu Cầu (Kéo & Thả)' : 'Schedule Time Slots (Click & Drag)'} <span className="text-rose-500">*</span>
                  </label>
                  {scheduleSlots.length > 0 && (
                    <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {scheduleSlots.length} {language === 'vi' ? 'khung giờ' : 'slot(s)'}
                    </span>
                  )}
                </div>
                <div className="flex-1 bg-slate-50/50 p-2 sm:p-3 rounded-2xl border border-slate-200">
                  <CalendarDragDropPicker
                    value={scheduleSlots}
                    onChange={(slots) => {
                      setScheduleSlots(slots);
                      setConflictError(null);
                    }}
                    existingBookings={myActiveBookings}
                    language={language === 'vi' ? 'vi' : 'en'}
                  />
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                <span className="material-symbols-outlined text-teal-600 text-base">shield</span>
                <span>
                  {language === 'vi' 
                    ? `Ký quỹ đảm bảo: $${maxBudgetUSD} USD (Giữ trong Escrow Vault)` 
                    : `Escrow Security Deposit: $${maxBudgetUSD} USD (Fully Protected)`}
                </span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-1/2 sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 sm:w-auto px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-teal-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span className="material-symbols-outlined text-lg">payment</span>
                  <span>
                    {language === 'vi' 
                      ? `Tiếp Tục Ký Quỹ ($${maxBudgetUSD} USD) →` 
                      : `Proceed to Deposit ($${maxBudgetUSD} USD) →`}
                  </span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* STEP 2: Mock Escrow Deposit Payment Gateway */
          <MockPaymentGateway
            amountUSD={maxBudgetUSD}
            itemTitle={title}
            itemSubtitle={`${city} • ${groupSize} ${language === 'vi' ? 'khách' : 'travelers'}`}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => setCurrentStep('details')}
            language={language}
          />
        )}
      </div>
    </div>
  );
};
