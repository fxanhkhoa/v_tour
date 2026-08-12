import React, { useState } from 'react';
import { Landmark, GuideProfile, TourBooking, User } from '../types';

interface GrabInstantGuideBookingProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLandmark: Landmark | null;
  guides: GuideProfile[];
  currentUser: User | null;
  onBookingCreated: (booking: TourBooking) => void;
}

export const GrabInstantGuideBooking: React.FC<GrabInstantGuideBookingProps> = ({
  isOpen,
  onClose,
  selectedLandmark,
  guides,
  currentUser,
  onBookingCreated
}) => {
  if (!isOpen) return null;

  const [pickupLocation, setPickupLocation] = useState<string>(
    selectedLandmark ? selectedLandmark.name : 'Ben Thanh Market Gate 1'
  );
  const [transportMode, setTransportMode] = useState<'scooter' | 'walking' | 'car' | 'bicycle'>('scooter');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const activeGuides = guides.filter(g => g.isOnline);
  const selectedGuide = activeGuides.find(g => g.tourTypes.includes(transportMode)) || activeGuides[0] || guides[0];

  const estimatedFareUSD = (selectedGuide ? selectedGuide.hourlyRateUSD : 18) * durationHours;

  const handleRequestGuide = async () => {
    setIsSearching(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/bookings/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerId: currentUser?.id || 'u_1',
          travelerName: currentUser?.name || 'Sarah Jenkins',
          travelerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
          pickupLocation: pickupLocation,
          pickupLat: selectedLandmark ? selectedLandmark.lat : 10.7725,
          pickupLng: selectedLandmark ? selectedLandmark.lng : 106.6980,
          transportMode: transportMode,
          durationHours: durationHours
        })
      });

      const data = await response.json();

      // Simulate 2 seconds of Grab radar matching animation
      setTimeout(() => {
        setIsSearching(false);
        if (data.booking) {
          onBookingCreated(data.booking);
          onClose();
        } else {
          setErrorMsg('Failed to match with guide. Please try again.');
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      setIsSearching(false);
      setErrorMsg('Connection error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">moped</span>
            <span>Grab-Style On-Demand Dispatch</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Request Instant Local Tour Guide
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Verified local guide arrives at your location in 3–5 minutes.
          </p>
        </div>

        {/* Searching Radar Animation Overlay */}
        {isSearching ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            {/* Animated Radar Pulse */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse"></div>
              <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg z-10">
                <span className="material-symbols-outlined text-3xl animate-spin">moped</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Pinging Nearby Guides...</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Searching for top-rated English speaking guide near <strong className="text-slate-800">{pickupLocation}</strong>
            </p>
            <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-pulse">
              Matching with {selectedGuide?.fullName}...
            </div>
          </div>
        ) : (
          /* Form Content */
          <div className="p-6 space-y-5">
            
            {/* Pickup Location Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pickup Landmark / Location
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 text-xl">
                  location_on
                </span>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter landmark or hotel name..."
                />
              </div>
            </div>

            {/* Transport Mode Options */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tour Mode & Transport
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'scooter', name: 'Scooter / Vespa', icon: 'moped', desc: 'Fast & Authentic' },
                  { id: 'walking', name: 'Walking Tour', icon: 'directions_walk', desc: 'Hidden Alleys' },
                  { id: 'car', name: 'Private Car', icon: 'directions_car', desc: 'Air-Con Luxury' },
                  { id: 'bicycle', name: 'Bicycle Tour', icon: 'directions_bike', desc: 'Eco & Scenic' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTransportMode(mode.id as any)}
                    className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                      transportMode === mode.id
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      transportMode === mode.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className="material-symbols-outlined text-lg">{mode.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{mode.name}</p>
                      <p className="text-[10px] text-slate-500">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tour Duration Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tour Duration
                </label>
                <span className="text-xs font-bold text-teal-600">{durationHours} Hours</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 4].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDurationHours(hrs)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      durationHours === hrs
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                  </button>
                ))}
              </div>
            </div>

            {/* Matched Guide Card Preview */}
            {selectedGuide && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedGuide.avatar}
                    alt={selectedGuide.fullName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-slate-900">{selectedGuide.fullName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Online Now
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ★ {selectedGuide.rating} ({selectedGuide.completedTours} tours) • {selectedGuide.vehicleModel || 'Scooter'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Hourly</p>
                  <p className="text-sm font-extrabold text-slate-900">${selectedGuide.hourlyRateUSD}/hr</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
            )}

            {/* Total Fare & Dispatch Button */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-slate-900 font-bold mb-3">
                <span className="text-xs text-slate-500">Estimated Total Fare</span>
                <span className="text-lg text-emerald-600">${estimatedFareUSD} USD</span>
              </div>

              <button
                type="button"
                onClick={handleRequestGuide}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">electric_scooter</span>
                <span>Confirm & Request Guide Now</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
