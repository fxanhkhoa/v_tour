import React, { useState } from 'react';
import { User } from '../../types';
import { Language, translations } from '../../lib/translations';

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
  const [preferredDate, setPreferredDate] = useState<string>('Tomorrow at 09:00 AM');
  const [durationHours, setDurationHours] = useState<number>(4);
  const [groupSize, setGroupSize] = useState<number>(2);
  const [minBudgetUSD, setMinBudgetUSD] = useState<number>(30);
  const [maxBudgetUSD, setMaxBudgetUSD] = useState<number>(60);
  const [description, setDescription] = useState<string>('');
  const [languagesInput, setLanguagesInput] = useState<string>('English');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    const preferredLanguages = languagesInput.split(',').map(s => s.trim()).filter(Boolean);

    setTimeout(() => {
      onCreatePost({
        travelerId: currentUser?.id || 'u_traveler_1',
        travelerName: currentUser?.name || 'Sarah Jenkins',
        travelerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        title,
        city,
        preferredDate,
        durationHours,
        groupSize,
        minBudgetUSD,
        maxBudgetUSD,
        description,
        preferredLanguages
      });
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100">
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
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.tripTitlePlaceholder}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.cityLabel}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Ho Chi Minh City">Ho Chi Minh City</option>
                <option value="Bangkok">Bangkok</option>
                <option value="Tokyo">Tokyo</option>
                <option value="Hanoi">Hanoi</option>
                <option value="Da Nang">Da Nang</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.dateTimeLabel}</label>
              <input
                type="text"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                placeholder="Tomorrow at 09:00 AM"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.durationLabel}</label>
              <input
                type="number"
                min="1"
                required
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.groupSizeLabel}</label>
              <input
                type="number"
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
