import React, { useState } from 'react';
import { GuideProfile, ScheduleSlot } from '../../types';
import { CalendarDragDropPicker, mergeScheduleSlots } from '../../components/CalendarDragDropPicker';
import { TourImageUploader } from '../../components/TourImageUploader';
import { Language } from '../../lib/translations';
import { LanguageDropdown } from '../../lib/languages';

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

  const isVi = language === 'vi';
  const isVerified = guideProfile.kycStatus === 'verified' || guideProfile.verified;

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('History & Culture');
  const [tourLanguage, setTourLanguage] = useState<string>(guideProfile.languages?.[0] || 'English');
  const [durationHours, setDurationHours] = useState<number>(3);
  const [priceUSDPerPerson, setPriceUSDPerPerson] = useState<number>(30);
  const [imageUrl, setImageUrl] = useState<string>(() => getRandomImage());
  const [description, setDescription] = useState<string>('');
  const [inclusionsInput, setInclusionsInput] = useState<string>('Local Guide Service, Food Tastings, Bottled Water, Entry Fees');
  const [itinerarySummary, setItinerarySummary] = useState<string>('');

  // Initial schedule slots with example slots requested by user
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;
    if (!title.trim() || !description.trim()) {
      setFormError(isVi ? 'Vui lòng điền đầy đủ tiêu đề và mô tả tour.' : 'Please fill in the tour title and description.');
      return;
    }

    if (!imageUrl) {
      setFormError(isVi ? 'Vui lòng tải ảnh bìa cho tour từ máy tính của bạn.' : 'Please upload a cover image for this tour from your machine.');
      return;
    }

    setFormError('');
    setLoading(true);
    const inclusions = inclusionsInput.split(',').map(s => s.trim()).filter(Boolean);

    const mergedSlots = mergeScheduleSlots(scheduleSlots);

    setTimeout(() => {
      onCreateTour({
        guideId: guideProfile.id,
        title,
        city: guideProfile.city,
        category,
        language: tourLanguage,
        languages: [tourLanguage],
        durationHours,
        priceUSDPerPerson,
        imageUrl,
        description,
        inclusions,
        itinerarySummary,
        scheduleSlots: mergedSlots
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
                {isVi ? 'Yêu Cầu Xác Minh Thẻ Hướng Dẫn Viên' : 'License Verification Required'}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {isVi
                  ? 'Để đảm bảo an toàn cho du khách và tuân thủ quy định pháp luật, bạn cần nộp Thẻ Hướng Dẫn Viên Du Lịch và CCCD để Admin duyệt trước khi đăng gói tour.'
                  : 'To maintain high quality and tourist safety, you must submit your official Tour Guide License Card and CCCD identity documents for Admin verification before you can publish custom tour packages.'}
              </p>
            </div>

            {guideProfile.kycStatus === 'pending' ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold flex items-center justify-center space-x-2">
                <span className="material-symbols-outlined text-base">hourglass_top</span>
                <span>{isVi ? 'Hồ sơ xác minh thẻ của bạn đang chờ Admin duyệt.' : 'Your License Verification is currently Pending Admin Review.'}</span>
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
                  <span>{isVi ? 'Nộp Thẻ Hướng Dẫn Viên & CCCD Ngay' : 'Submit Tour Guide License Card & CCCD'}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer pt-2 inline-block"
            >
              {isVi ? 'Hủy & Quay Lại Bảng Điều Khiển' : 'Cancel & Return to Dashboard'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>{isVi ? 'Công Cụ Đăng Tour Mới' : 'Tour Guide Creator Tool'}</span>
            </div>
            <h3 className="font-extrabold text-xl text-slate-900 mb-1">
              {isVi ? 'Tạo Gói Tour Du Lịch Mới' : 'Create New Tour Package'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {isVi
                ? `Đăng gói tour đặc sắc tại ${guideProfile.city} để du khách hoặc công ty lữ hành đặt trực tiếp.`
                : `Publish a custom tour offering in ${guideProfile.city} for individual travelers or tour companies to book directly.`}
            </p>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center space-x-2 mb-4">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isVi ? 'Tên Gói Tour' : 'Tour Title'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isVi ? 'Ví dụ: Khám Phá Cà Phê Trứng & Ẩm Thực Phố Cổ Bằng Xe Máy' : 'e.g. Secret Rooftop Cafes & Street Food Vespa Tour'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isVi ? 'Thể Loại Tour' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="History & Culture">{isVi ? 'Lịch Sử & Văn Hóa' : 'History & Culture'}</option>
                    <option value="Food & Scooter">{isVi ? 'Ẩm Thực & Xe Máy Vespa' : 'Food & Scooter'}</option>
                    <option value="Hidden Alleys">{isVi ? 'Ngõ Hẻm Bí Mật' : 'Hidden Alleys'}</option>
                    <option value="Photography">{isVi ? 'Nhiếp Ảnh & Check-in' : 'Photography'}</option>
                    <option value="Nightlife">{isVi ? 'Đêm Phố & Giải Trí' : 'Nightlife'}</option>
                    <option value="Nature & Trekking">{isVi ? 'Thiên Nhiên & Trekking' : 'Nature & Trekking'}</option>
                    <option value="Heritage & Architecture">{isVi ? 'Di Sản & Kiến Trúc' : 'Heritage & Architecture'}</option>
                  </select>
                </div>

                <div>
                  <LanguageDropdown
                    value={tourLanguage}
                    onChange={setTourLanguage}
                    label={isVi ? 'Ngôn Ngữ Thuyết Minh' : 'Spoken Tour Language'}
                    required
                    isVietnamese={isVi}
                    helperText={isVi ? 'Tour sẽ được thuyết minh bằng ngôn ngữ này' : 'Tour will be guided & spoken in this language'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isVi ? 'Thời Lượng (Giờ)' : 'Duration (Hours)'}
                  </label>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    {isVi ? 'Giá Niêm Yết / Khách ($ USD)' : 'Price per Person ($ USD)'}
                  </label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={priceUSDPerPerson}
                    onChange={(e) => setPriceUSDPerPerson(Number(e.target.value))}
                    className="w-full p-2.5 bg-teal-50 border border-teal-200 rounded-xl font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isVi ? 'Mô Tả Chi Tiết Trải Nghiệm Tour' : 'Tour Description'}
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isVi ? 'Mô tả chi tiết những trải nghiệm đặc biệt, món ăn, điểm đến du khách sẽ được thưởng thức...' : 'Describe what travelers will experience, taste, and see...'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 h-20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isVi ? 'Dịch Vụ Bao Gồm (Phân cách bằng dấu phẩy)' : 'Inclusions (comma separated)'}
                </label>
                <input
                  type="text"
                  value={inclusionsInput}
                  onChange={(e) => setInclusionsInput(e.target.value)}
                  placeholder={isVi ? 'HDV bản địa, nón bảo hiểm, các món ăn thử, vé tham quan' : 'Guide fee, helmet, food tastings, entrance tickets'}
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

              {/* Cover Image Uploader - Direct Upload from Machine */}
              <div className="pt-2">
                <TourImageUploader
                  imageUrl={imageUrl}
                  onChange={setImageUrl}
                  language={language}
                  label={isVi ? 'Ảnh Bìa Tour (Tải Lên Từ Máy Tính / Thiết Bị Của Bạn)' : 'Tour Cover Image (Upload From Your Computer / Device)'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span className="material-symbols-outlined text-lg">publish</span>
                <span>{loading ? (isVi ? 'Đang Xuất Bản Tour...' : 'Publishing Tour...') : (isVi ? 'Đăng Gói Tour Lên Hệ Thống' : 'Publish Tour Package')}</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

