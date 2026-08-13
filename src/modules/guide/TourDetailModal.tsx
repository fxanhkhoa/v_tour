import React from 'react';
import { TourPackage, NegotiationOffer, TourBooking } from '../../types';
import { Language } from '../../lib/translations';

interface TourDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: TourPackage | null;
  negotiations: NegotiationOffer[];
  bookings: TourBooking[];
  onOpenEdit: (tour: TourPackage) => void;
  language?: Language;
}

export const TourDetailModal: React.FC<TourDetailModalProps> = ({
  isOpen,
  onClose,
  tour,
  negotiations = [],
  bookings = [],
  onOpenEdit,
  language = 'en'
}) => {
  if (!isOpen || !tour) return null;

  // Filter negotiations & bookings related to this specific tour
  const tourNegotiations = (negotiations || []).filter(
    n => (n.tourId === tour.id || (n.tourTitle && n.tourTitle.toLowerCase() === tour.title.toLowerCase())) &&
         n.status !== 'declined'
  );

  const tourBookings = (bookings || []).filter(
    b => (b.tourId === tour.id || (b.tourTitle && b.tourTitle.toLowerCase() === tour.title.toLowerCase())) &&
         b.status !== 'cancelled'
  );

  const isLocked = tourNegotiations.length > 0 || tourBookings.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-auto space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all z-10"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Cover Header */}
        <div className="relative h-48 sm:h-56 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-4 overflow-hidden rounded-t-3xl bg-slate-900">
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          
          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                {tour.category}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20">
                📍 {tour.city}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20">
                ⏱️ {tour.durationHours} Hours
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black leading-tight text-white">
              {tour.title}
            </h3>
            <p className="text-xs text-teal-300 font-bold">
              ${tour.priceUSDPerPerson} USD / traveler • Created by {tour.guideName}
            </p>
          </div>
        </div>

        {/* LOCK STATUS & EDIT ELIGIBILITY BANNER */}
        {isLocked ? (
          <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-amber-900 font-black text-sm">
              <span className="material-symbols-outlined text-amber-700 text-xl">lock</span>
              <span>
                {language === 'vi'
                  ? 'Khóa chỉnh sửa tour: Đã có thương lượng hoặc lượt đặt!'
                  : 'Editing Locked: Tour has Active Negotiations or Traveler Bookings'}
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {language === 'vi'
                ? 'Theo quy định nền tảng, tour này hiện KHÔNG THỂ chỉnh sửa vì đã có du khách đang thương lượng giá hoặc đặt tour. Bạn chỉ có thể sửa tour khi không còn thương lượng hay booking nào.'
                : 'Per platform rules, you CANNOT edit this tour package because travelers currently have active negotiation offers or confirmed bookings associated with it. Editing is permitted only when zero active negotiations/bookings exist.'}
            </p>

            {/* List active negotiations */}
            {tourNegotiations.length > 0 && (
              <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                <p className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide">
                  💬 Active Negotiations ({tourNegotiations.length}):
                </p>
                <div className="space-y-1">
                  {tourNegotiations.map((n) => (
                    <div key={n.id} className="text-xs text-amber-950 font-bold bg-white/80 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                      <span>Traveler: {n.travelerName} (${n.offeredPriceUSD} USD offer)</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-200 text-amber-900">{n.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List active bookings */}
            {tourBookings.length > 0 && (
              <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                <p className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide">
                  🎟️ Traveler Bookings ({tourBookings.length}):
                </p>
                <div className="space-y-1">
                  {tourBookings.map((b) => (
                    <div key={b.id} className="text-xs text-amber-950 font-bold bg-white/80 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                      <span>Traveler: {b.travelerName} ({b.scheduledTime})</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-900 text-xs font-extrabold">
              <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
              <span>
                {language === 'vi'
                  ? 'Chưa có thương lượng/booking. Bạn có thể tự do chỉnh sửa tour này!'
                  : 'Unlocked: No negotiations or bookings. You can freely edit this tour!'}
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenEdit(tour);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow cursor-pointer transition-all flex items-center space-x-1 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{language === 'vi' ? 'Chỉnh Sửa' : 'Edit Tour'}</span>
            </button>
          </div>
        )}

        {/* Tour Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            {language === 'vi' ? 'Mô tả Tour' : 'Tour Description'}
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            {tour.description}
          </p>
        </div>

        {/* Route / Itinerary Summary */}
        {tour.itinerarySummary && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {language === 'vi' ? 'Tóm Tắt Tận Nơi / Hành Trình' : 'Itinerary & Route Highlights'}
            </h4>
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs font-bold text-teal-900">
              🗺️ {tour.itinerarySummary}
            </div>
          </div>
        )}

        {/* Inclusions */}
        {tour.inclusions && tour.inclusions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {language === 'vi' ? 'Dịch Vụ Bao Gồm' : 'Tour Inclusions'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {tour.inclusions.map((inc, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <span className="text-teal-600">✓</span>
                  <span>{inc}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Slots */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>{language === 'vi' ? 'Khung Giờ Đã Mở' : 'Available Schedule Slots'}</span>
            <span className="text-[10px] text-teal-700 font-bold">{tour.scheduleSlots?.length || 0} Slots</span>
          </h4>

          {tour.scheduleSlots && tour.scheduleSlots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tour.scheduleSlots.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <span className="material-symbols-outlined text-teal-600 text-base">calendar_clock</span>
                  <span>{s.displayLabel || `${s.dateStr} (${s.startTime} - ${s.endTime})`}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-200">
              No set slots defined. Travelers propose custom dates upon booking.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer transition-all"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>

          <button
            disabled={isLocked}
            onClick={() => {
              if (isLocked) return;
              onClose();
              onOpenEdit(tour);
            }}
            className={`px-6 py-2.5 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2 ${
              isLocked
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-teal-600 hover:bg-teal-500 text-white active:scale-95'
            }`}
            title={isLocked ? 'Cannot edit tour while negotiations or bookings exist' : 'Edit Tour'}
          >
            <span className="material-symbols-outlined text-base">{isLocked ? 'lock' : 'edit'}</span>
            <span>
              {isLocked
                ? (language === 'vi' ? 'Khóa Sửa (Có Booking/Thương Lượng)' : 'Editing Locked (Has Active Bookings)')
                : (language === 'vi' ? 'Chỉnh Sửa Tour Package' : 'Edit Tour Package')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
