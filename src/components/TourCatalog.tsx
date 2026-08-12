import React, { useState } from 'react';
import { TourPackage, User, TourBooking } from '../types';

interface TourCatalogProps {
  tours: TourPackage[];
  selectedCity: string;
  currentUser: User | null;
  onBookingCreated: (booking: TourBooking) => void;
}

export const TourCatalog: React.FC<TourCatalogProps> = ({
  tours,
  selectedCity,
  currentUser,
  onBookingCreated
}) => {
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('Tomorrow at 09:00 AM');
  const [groupSize, setGroupSize] = useState<number>(1);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const filteredTours = tours.filter(t => t.city.toLowerCase() === selectedCity.toLowerCase()) || tours;

  const handleBookPackage = async (tour: TourPackage) => {
    setIsBooking(true);
    try {
      const response = await fetch('/api/bookings/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerId: currentUser?.id || 'u_1',
          travelerName: currentUser?.name || 'Sarah Jenkins',
          travelerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
          tourId: tour.id,
          scheduledTime: scheduledTime,
          groupSize: groupSize
        })
      });

      const data = await response.json();
      setIsBooking(false);
      if (data.booking) {
        onBookingCreated(data.booking);
        setSelectedTour(null);
      }
    } catch (err) {
      console.error(err);
      setIsBooking(false);
    }
  };

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span>Curated Tour Experiences</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Top Rated Scheduled Tours in {selectedCity}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Handcrafted experiences led by verified local guides with all entrance fees & food included.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map((tour) => (
          <div
            key={tour.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              {/* Cover Image & Rating Badge */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={tour.imageUrl}
                  alt={tour.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center space-x-1">
                  <span className="material-symbols-outlined text-sm text-teal-400">schedule</span>
                  <span>{tour.durationHours} Hours</span>
                </div>

                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-900 flex items-center space-x-1 shadow">
                  <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                  <span>{tour.rating} ({tour.reviewsCount})</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <div className="flex items-center space-x-2 text-xs text-teal-600 font-bold uppercase tracking-wider mb-1">
                  <span>{tour.category}</span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug">
                  {tour.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {tour.description}
                </p>

                {/* Guide Info */}
                <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                  <img
                    src={tour.guideAvatar}
                    alt={tour.guideName}
                    className="w-8 h-8 rounded-full object-cover border border-teal-500"
                  />
                  <div>
                    <p className="text-[11px] text-slate-500">Led by Local Expert</p>
                    <p className="text-xs font-bold text-slate-900">{tour.guideName}</p>
                  </div>
                </div>

                {/* Inclusions List */}
                <div className="space-y-1 mb-3">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Inclusions:</p>
                  {tour.inclusions.slice(0, 3).map((inc, i) => (
                    <div key={`${tour.id}-inc-${i}`} className="flex items-center space-x-1.5 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>

                {/* Guide Schedule Slots (if defined) */}
                {tour.scheduleSlots && tour.scheduleSlots.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 mb-3 space-y-1">
                    <p className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider flex items-center space-x-1">
                      <span className="material-symbols-outlined text-xs text-teal-600">event_available</span>
                      <span>Guide Schedule Slots:</span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tour.scheduleSlots.map((slot, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white text-teal-800 text-[10px] font-bold border border-teal-200 shadow-2xs">
                          {slot.displayLabel || `${slot.startTime}-${slot.endTime} on ${slot.dateStr}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price & Book Button */}
            <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Per Person</p>
                <p className="text-lg font-extrabold text-slate-900">${tour.priceUSDPerPerson} USD</p>
              </div>

              <button
                onClick={() => setSelectedTour(tour)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center space-x-1"
              >
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>Book Package</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setSelectedTour(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-extrabold text-lg text-slate-900 mb-1">
              Book {selectedTour.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Led by {selectedTour.guideName} • {selectedTour.durationHours} Hours
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Time / Date</label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {selectedTour.scheduleSlots && selectedTour.scheduleSlots.length > 0 ? (
                    selectedTour.scheduleSlots.map((slot, idx) => {
                      const label = slot.displayLabel || `${slot.startTime} - ${slot.endTime} on ${slot.dateStr}`;
                      return (
                        <option key={idx} value={label}>
                          {label}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="8:00 AM - 10:00 AM on 10/10/2026">8:00 AM - 10:00 AM on 10/10/2026</option>
                      <option value="4:00 PM - 5:00 PM on 12/10/2026">4:00 PM - 5:00 PM on 12/10/2026</option>
                      <option value="Today at 02:00 PM">Today at 02:00 PM</option>
                      <option value="Tomorrow at 09:00 AM">Tomorrow at 09:00 AM</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Group Size</label>
                <div className="flex items-center space-x-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGroupSize(num)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        groupSize === num
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      {num} {num === 1 ? 'Person' : 'Ppl'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 flex justify-between items-center text-slate-900 font-bold">
                <span className="text-xs text-teal-800">Total Booking Price</span>
                <span className="text-base text-teal-700">${selectedTour.priceUSDPerPerson * groupSize} USD</span>
              </div>
            </div>

            <button
              onClick={() => handleBookPackage(selectedTour)}
              disabled={isBooking}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{isBooking ? 'Processing...' : 'Confirm Scheduled Booking'}</span>
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
