import React, { useState } from 'react';
import { GuideProfile, ScheduleSlot } from '../../types';
import { CalendarDragDropPicker } from '../../components/CalendarDragDropPicker';
import { Language } from '../../lib/translations';

interface CreateTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideProfile: GuideProfile;
  onCreateTour: (tourData: any) => void;
  onOpenKYCModal?: () => void;
  language?: Language;
}

const RANDOM_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-ce74f45814d0?auto=format&fit=crop&w=800&q=80'
];

const getRandomImage = () => {
  return RANDOM_COVER_IMAGES[Math.floor(Math.random() * RANDOM_COVER_IMAGES.length)];
};

export const CreateTourModal: React.FC<CreateTourModalProps> = ({
  isOpen,
  onClose,
  guideProfile,
  onCreateTour,
  onOpenKYCModal,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const isVerified = guideProfile.kycStatus === 'verified' || guideProfile.verified;

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('History & Culture');
  const [durationHours, setDurationHours] = useState<number>(3);
  const [priceUSDPerPerson, setPriceUSDPerPerson] = useState<number>(30);
  const [imageUrl, setImageUrl] = useState<string>(() => getRandomImage());
  const [description, setDescription] = useState<string>('');
  const [inclusionsInput, setInclusionsInput] = useState<string>('Local Guide Service, Food Tastings, Bottled Water, Entry Fees');
  const [itinerarySummary, setItinerarySummary] = useState<string>('');

  // Initial schedule slots with example slots requested by user
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    {
      id: 'slot_init_1',
      dateStr: '10/10/2026',
      startTime: '8:00 AM',
      endTime: '10:00 AM',
      displayLabel: '8:00 AM - 10:00 AM on 10/10/2026'
    },
    {
      id: 'slot_init_2',
      dateStr: '12/10/2026',
      startTime: '4:00 PM',
      endTime: '5:00 PM',
      displayLabel: '4:00 PM - 5:00 PM on 12/10/2026'
    }
  ]);

  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    const inclusions = inclusionsInput.split(',').map(s => s.trim()).filter(Boolean);

    setTimeout(() => {
      onCreateTour({
        guideId: guideProfile.id,
        title,
        city: guideProfile.city,
        category,
        durationHours,
        priceUSDPerPerson,
        imageUrl,
        description,
        inclusions,
        itinerarySummary,
        scheduleSlots
      });
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {!isVerified ? (
          <div className="text-center py-6 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-xl text-slate-900">
                License Verification Required
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                To maintain high quality and tourist safety, you must submit your official <strong>Tour Guide License Card</strong> and <strong>CCCD identity documents</strong> for Admin verification before you can publish custom tour packages.
              </p>
            </div>

            {guideProfile.kycStatus === 'pending' ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold flex items-center justify-center space-x-2">
                <span className="material-symbols-outlined text-base">hourglass_top</span>
                <span>Your License Verification is currently Pending Admin Review.</span>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenKYCModal) onOpenKYCModal();
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer flex items-center justify-center space-x-2 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">badge</span>
                  <span>Submit Tour Guide License Card & CCCD</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer pt-2 inline-block"
            >
              Cancel & Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Tour Guide Creator Tool</span>
            </div>
            <h3 className="font-extrabold text-xl text-slate-900 mb-1">
              Create New Tour Package
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Publish a custom tour offering in {guideProfile.city} for individual travelers or tour companies to book directly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tour Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Secret Rooftop Cafes & Street Food Vespa Tour"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="History & Culture">History & Culture</option>
                    <option value="Food & Scooter">Food & Scooter</option>
                    <option value="Hidden Alleys">Hidden Alleys</option>
                    <option value="Photography">Photography</option>
                    <option value="Nightlife">Nightlife</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price per Person ($ USD)</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={priceUSDPerPerson}
                    onChange={(e) => setPriceUSDPerPerson(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tour Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what travelers will experience, taste, and see..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 h-20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Inclusions (comma separated)</label>
                <input
                  type="text"
                  value={inclusionsInput}
                  onChange={(e) => setInclusionsInput(e.target.value)}
                  placeholder="Guide fee, helmet, food tastings, entrance tickets"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Drag & Drop Calendar Availability Picker */}
              <div className="pt-2">
                <CalendarDragDropPicker
                  value={scheduleSlots}
                  onChange={setScheduleSlots}
                  language={language}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Cover Image URL</label>
                  <button
                    type="button"
                    onClick={() => setImageUrl(getRandomImage())}
                    className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[11px] font-extrabold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">shuffle</span>
                    <span>Randomize Cover Image</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-16 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-2xs">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-base">image</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span className="material-symbols-outlined text-lg">publish</span>
                <span>{loading ? 'Publishing Tour...' : 'Publish Tour Package'}</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
