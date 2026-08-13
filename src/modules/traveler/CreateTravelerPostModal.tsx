import React, { useState } from 'react';
import { User, ScheduleSlot } from '../../types';
import { Language, translations } from '../../lib/translations';
import { CalendarDragDropPicker } from '../../components/CalendarDragDropPicker';

interface CreateTravelerPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  selectedCity: string;
  onCreatePost: (postData: any) => void;
  language?: Language;
}

export const CreateTravelerPostModal: React.FC<CreateTravelerPostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedCity,
  onCreatePost,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const t = translations[language] || translations.en;

  const [title, setTitle] = useState<string>('');
  const [city, setCity] = useState<string>(selectedCity || 'Ho Chi Minh City');
  
  // Custom interactive Time Slot Picker State using CalendarDragDropPicker
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    {
      id: 'default_slot_1',
      dateStr: '10/10/2026',
      startTime: '4:00 PM',
      endTime: '8:00 PM',
      displayLabel: '4:00 PM - 8:00 PM on 10/10/2026'
    }
  ]);

  const [groupSize, setGroupSize] = useState<number>(2);
  const [minBudgetUSD, setMinBudgetUSD] = useState<number>(30);
  const [maxBudgetUSD, setMaxBudgetUSD] = useState<number>(60);
  const [description, setDescription] = useState<string>('');
  const [languagesInput, setLanguagesInput] = useState<string>('English');
  const [loading, setLoading] = useState<boolean>(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (scheduleSlots.length === 0) {
      alert(language === 'vi' ? 'Vui lòng thêm ít nhất một khung giờ yêu cầu!' : 'Please add at least one preferred time slot!');
      return;
    }

    setLoading(true);
    const preferredLanguages = languagesInput.split(',').map(s => s.trim()).filter(Boolean);

    // Combine multiple slots for the preferredDate representation
    const aggregatedPreferredDate = scheduleSlots.map(s => s.displayLabel || `${s.startTime} - ${s.endTime} on ${s.dateStr}`).join('; ');
    const totalDurationHours = scheduleSlots.reduce((sum, s) => sum + calculateSlotDuration(s), 0);

    setTimeout(() => {
      onCreatePost({
        travelerId: currentUser?.id || 'u_traveler_1',
        travelerName: currentUser?.name || 'Sarah Jenkins',
        travelerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        title,
        city,
        preferredDate: aggregatedPreferredDate,
        durationHours: totalDurationHours,
        groupSize,
        minBudgetUSD,
        maxBudgetUSD,
        description,
        preferredLanguages
      });
      setLoading(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative border border-slate-100 my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex items-center space-x-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-base">campaign</span>
          <span>{t.customPostBadge}</span>
        </div>
        <h3 className="font-extrabold text-xl text-slate-900 mb-1">
          {t.postRequestModalTitle}
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {t.postRequestModalSub}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.tripTitleLabel}</label>
            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.tripTitlePlaceholder}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.cityLabel}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          </div>

          {/* Calendar Drag Drop Picker */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'vi' ? 'Lịch Chọn Khung Giờ Yêu Cầu (Kéo & Thả)' : 'Schedule Time Slots (Click & Drag)'}
            </label>
            <CalendarDragDropPicker
              value={scheduleSlots}
              onChange={setScheduleSlots}
              language={language === 'vi' ? 'vi' : 'en'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.groupSizeLabel}</label>
              <input
                type="number"
                name="group-size"
                min="1"
                required
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.maxBudgetLabel}</label>
              <input
                type="number"
                name="budget"
                min="10"
                required
                value={maxBudgetUSD}
                onChange={(e) => setMaxBudgetUSD(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.tripDetailsLabel}</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.tripDetailsPlaceholder}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 h-24 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.preferredLanguagesLabel}</label>
            <input
              type="text"
              value={languagesInput}
              onChange={(e) => setLanguagesInput(e.target.value)}
              placeholder="English, French, Japanese..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined text-lg">post_add</span>
            <span>{loading ? t.publishingBtn : t.publishRequestBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
