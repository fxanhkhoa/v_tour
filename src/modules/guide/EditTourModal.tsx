import React, { useState, useEffect } from 'react';
import { TourPackage, GuideProfile, ScheduleSlot, NegotiationOffer, TourBooking } from '../../types';
import { Language } from '../../lib/translations';
import { CalendarDragDropPicker, mergeScheduleSlots } from '../../components/CalendarDragDropPicker';

interface EditTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: TourPackage | null;
  guideProfile: GuideProfile;
  negotiations: NegotiationOffer[];
  bookings: TourBooking[];
  onUpdateTour: (tourData: any) => void;
  language?: Language;
}

const CATEGORIES = [
  'History & Culture',
  'Food & Scooter',
  'Hidden Alleys',
  'Photography',
  'Nightlife',
  'Adventure & Nature',
  'Food & Cultural',
  'Culture & Bicycle',
  'Nature & Cruise',
  'Food & TukTuk'
];

export const EditTourModal: React.FC<EditTourModalProps> = ({
  isOpen,
  onClose,
  tour,
  guideProfile,
  negotiations = [],
  bookings = [],
  onUpdateTour,
  language = 'en'
}) => {
  if (!isOpen || !tour) return null;

  // Double check if locked by active negotiations or bookings
  const tourNegotiations = (negotiations || []).filter(
    n => (n.tourId === tour.id || (n.tourTitle && n.tourTitle.toLowerCase() === tour.title.toLowerCase())) &&
         n.status !== 'declined'
  );

  const tourBookings = (bookings || []).filter(
    b => (b.tourId === tour.id || (b.tourTitle && b.tourTitle.toLowerCase() === tour.title.toLowerCase())) &&
         b.status !== 'cancelled'
  );

  const isLocked = tourNegotiations.length > 0 || tourBookings.length > 0;

  // Local Form State
  const [title, setTitle] = useState<string>(tour.title || '');
  const [category, setCategory] = useState<string>(tour.category || 'History & Culture');
  const [city, setCity] = useState<string>(tour.city || guideProfile.city);
  const [durationHours, setDurationHours] = useState<number>(tour.durationHours || 3);
  const [priceUSDPerPerson, setPriceUSDPerPerson] = useState<number>(tour.priceUSDPerPerson || 30);
  const [imageUrl, setImageUrl] = useState<string>(tour.imageUrl || '');
  const [description, setDescription] = useState<string>(tour.description || '');
  const [inclusionsInput, setInclusionsInput] = useState<string>((tour.inclusions || []).join(', '));
  const [itinerarySummary, setItinerarySummary] = useState<string>(tour.itinerarySummary || '');
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(tour.scheduleSlots || []);

  // New Slot Input State
  const [newSlotDate, setNewSlotDate] = useState<string>('');
  const [newSlotStartTime, setNewSlotStartTime] = useState<string>('09:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState<string>('12:00');

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (tour) {
      setTitle(tour.title || '');
      setCategory(tour.category || 'History & Culture');
      setCity(tour.city || guideProfile.city);
      setDurationHours(tour.durationHours || 3);
      setPriceUSDPerPerson(tour.priceUSDPerPerson || 30);
      setImageUrl(tour.imageUrl || '');
      setDescription(tour.description || '');
      setInclusionsInput((tour.inclusions || []).join(', '));
      setItinerarySummary(tour.itinerarySummary || '');
      setScheduleSlots(tour.scheduleSlots || []);
    }
  }, [tour, guideProfile]);

  const handleAddSlot = () => {
    if (!newSlotDate) return;
    const newSlot: ScheduleSlot = {
      id: 'slot_' + Date.now(),
      dateStr: newSlotDate,
      startTime: newSlotStartTime,
      endTime: newSlotEndTime,
      displayLabel: `${newSlotStartTime} - ${newSlotEndTime} on ${newSlotDate}`
    };
    setScheduleSlots(mergeScheduleSlots([...scheduleSlots, newSlot]));
    setNewSlotDate('');
  };

  const handleRemoveSlot = (slotId: string) => {
    setScheduleSlots(scheduleSlots.filter(s => s.id !== slotId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    const inclusions = inclusionsInput.split(',').map(s => s.trim()).filter(Boolean);
    const mergedSlots = mergeScheduleSlots(scheduleSlots);

    setTimeout(() => {
      onUpdateTour({
        tourId: tour.id,
        guideId: guideProfile.id,
        title,
        city,
        category,
        durationHours: Number(durationHours),
        priceUSDPerPerson: Number(priceUSDPerPerson),
        imageUrl,
        description,
        inclusions,
        itinerarySummary,
        scheduleSlots: mergedSlots
      });
      setLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-base">edit_note</span>
          <span>{language === 'vi' ? 'Công Cụ Chỉnh Sửa Tour' : 'Guide Tour Editor'}</span>
        </div>
        <h3 className="font-extrabold text-xl text-slate-900 mb-1">
          {language === 'vi' ? 'Chỉnh Sửa Tour Package' : 'Edit Tour Package'}
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {language === 'vi'
            ? 'Cập nhật nội dung, lịch trình, giá cả và khung giờ phục vụ cho tour.'
            : 'Update itinerary highlights, pricing, duration, inclusions, and schedule slots.'}
        </p>

        {/* LOCK WARNING BLOCK */}
        {isLocked ? (
          <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 space-y-3 mb-6">
            <div className="flex items-center space-x-2 font-black text-sm text-rose-800">
              <span className="material-symbols-outlined text-rose-600 text-xl">block</span>
              <span>
                {language === 'vi'
                  ? 'Không Thể Chỉnh Sửa Tour Vì Đã Có Lượt Đặt / Thương Lượng'
                  : 'Cannot Edit Tour: Active Negotiations or Traveler Bookings Exist'}
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              {language === 'vi'
                ? 'Để bảo vệ tính toàn vẹn thông tin đối với các du khách đã gửi đề xuất hoặc đặt tour, bạn không thể chỉnh sửa tour khi có ít nhất 1 thương lượng hoặc booking đang hoạt động.'
                : 'To protect booking terms for travelers who have submitted offers or completed bookings, editing is disabled whenever active negotiations or bookings are associated with this tour.'}
            </p>
            <div className="pt-2 text-xs font-bold text-rose-900">
              Active Items: {tourNegotiations.length} Negotiations, {tourBookings.length} Bookings
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-xl bg-rose-700 text-white font-bold text-xs shadow hover:bg-rose-800 cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên Tour' : 'Tour Title'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hanoi Old Quarter Egg Coffee & Street Food Crawl"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>

            {/* Category & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Thể Loại Tour' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Thành Phố' : 'City'}
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>
            </div>

            {/* Duration & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Thời Lượng (Giờ)' : 'Duration (Hours)'}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Giá Niêm Yết / Khách ($ USD)' : 'Price / Person ($ USD)'}
                </label>
                <input
                  type="number"
                  min="5"
                  required
                  value={priceUSDPerPerson}
                  onChange={(e) => setPriceUSDPerPerson(Number(e.target.value))}
                  className="w-full p-2.5 bg-teal-50 border border-teal-300 rounded-xl text-teal-900 font-black text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Đường Dẫn Ảnh Đại Diện Tour (Image URL)' : 'Cover Image URL'}
              </label>
              <input
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Mô Tả Chi Tiết' : 'Full Tour Description'}
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Itinerary Summary */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tóm Tắt Điểm Đến / Lịch Trình' : 'Itinerary Route Summary'}
              </label>
              <input
                type="text"
                value={itinerarySummary}
                onChange={(e) => setItinerarySummary(e.target.value)}
                placeholder="e.g. Cathedral -> Old Quarter Alley -> Egg Coffee Workshop"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Inclusions */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Dịch Vụ Bao Gồm (Phân cách bởi dấu phẩy)' : 'Inclusions (Comma separated)'}
              </label>
              <input
                type="text"
                value={inclusionsInput}
                onChange={(e) => setInclusionsInput(e.target.value)}
                placeholder="e.g. Private Guide, Food Tastings, Helmets, Tickets"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* SCHEDULE SLOTS EDITOR WITH CALENDAR TIME SLOT PICKER */}
            <div className="pt-3 border-t border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-slate-900 uppercase tracking-wide flex items-center space-x-1">
                  <span className="material-symbols-outlined text-teal-600 text-base">calendar_month</span>
                  <span>{language === 'vi' ? 'Quản Lý Khung Giờ Mở (Time Slot Picker)' : 'Manage Available Schedule Slots (Time Slot Picker)'}</span>
                </h5>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {scheduleSlots.length} Slots Active
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                {language === 'vi'
                  ? 'Kéo thả trên lịch bên dưới hoặc dùng bộ chọn ngày/giờ để thêm khung giờ phục vụ tour.'
                  : 'Drag on the calendar grid below or use the quick date/time picker to add available tour time slots.'}
              </p>

              {/* Interactive Calendar Drag-Drop Picker */}
              <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200 overflow-hidden">
                <CalendarDragDropPicker
                  value={scheduleSlots}
                  onChange={setScheduleSlots}
                  language={language}
                />
              </div>

              {/* Quick HTML5 Date & Time Slot Adder */}
              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-2">
                <p className="font-bold text-teal-900 text-[11px] flex items-center space-x-1">
                  <span className="material-symbols-outlined text-sm text-teal-600">more_time</span>
                  <span>{language === 'vi' ? 'Bộ chọn Ngày & Giờ nhanh (Quick Time Slot Picker):' : 'Quick Date & Time Slot Picker:'}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold text-teal-900 uppercase mb-0.5">Date</label>
                    <input
                      type="date"
                      value={newSlotDate.includes('/') ? '' : newSlotDate}
                      onChange={(e) => {
                        const val = e.target.value; // YYYY-MM-DD
                        if (!val) return;
                        const [y, m, d] = val.split('-');
                        setNewSlotDate(`${d}/${m}/${y}`);
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-teal-900 uppercase mb-0.5">Start Time</label>
                    <input
                      type="time"
                      value={newSlotStartTime}
                      onChange={(e) => setNewSlotStartTime(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-teal-900 uppercase mb-0.5">End Time</label>
                    <input
                      type="time"
                      value={newSlotEndTime}
                      onChange={(e) => setNewSlotEndTime(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs cursor-pointer shadow transition-all flex items-center justify-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-sm">add_task</span>
                    <span>{language === 'vi' ? 'Thêm Khung Giờ' : 'Add Time Slot'}</span>
                  </button>
                </div>
              </div>

              {/* Saved Slots Pills */}
              {scheduleSlots.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600">Active Time Slots ({scheduleSlots.length}):</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {scheduleSlots.map((slot, idx) => (
                      <div
                        key={slot.id || `slot_edit_${idx}_${slot.dateStr}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center space-x-2 group transition-all"
                      >
                        <span>📅 {slot.displayLabel || `${slot.dateStr} (${slot.startTime} - ${slot.endTime})`}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                          title="Remove Slot"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer transition-all"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={loading || isLocked}
                className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center space-x-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{loading ? 'Saving...' : (language === 'vi' ? 'Lưu Thay Đổi Tour' : 'Save Tour Changes')}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
