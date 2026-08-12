import React, { useState } from 'react';
import { GuideProfile, TourBooking } from '../types';

interface GuideDashboardProps {
  guideProfile: GuideProfile;
  bookings: TourBooking[];
  onToggleOnline: (isOnline: boolean) => void;
  onAcceptBooking: (bookingId: string) => void;
}

export const GuideDashboard: React.FC<GuideDashboardProps> = ({
  guideProfile,
  bookings,
  onToggleOnline,
  onAcceptBooking
}) => {
  const [incomingPing, setIncomingPing] = useState<boolean>(false);

  const simulateIncomingPing = () => {
    setIncomingPing(true);
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Guide Banner & Online Switch */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={guideProfile.avatar}
            alt={guideProfile.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white">{guideProfile.fullName}</h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Guide Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ★ {guideProfile.rating} • {guideProfile.city} • {guideProfile.vehicleModel || 'Scooter'}
            </p>
          </div>
        </div>

        {/* Status Toggle & Simulation Trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={simulateIncomingPing}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            <span>Simulate Incoming Tour Ping</span>
          </button>

          <button
            onClick={() => onToggleOnline(!guideProfile.isOnline)}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer ${
              guideProfile.isOnline
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${guideProfile.isOnline ? 'bg-slate-950 animate-ping' : 'bg-slate-500'}`}></span>
            <span>{guideProfile.isOnline ? 'Online • Ready for Rides' : 'Offline'}</span>
          </button>
        </div>
      </div>

      {/* Simulated Incoming Grab Tour Request Popup */}
      {incomingPing && (
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl border-2 border-emerald-500 text-white shadow-2xl animate-bounce">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">moped</span>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">New Instant Tour Request!</p>
                <h3 className="text-lg font-bold">Sarah Jenkins • Ben Thanh Market</h3>
                <p className="text-xs text-slate-300">2 Hours Scooter Food Tour • $36 USD Fare</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIncomingPing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setIncomingPing(false);
                  onAcceptBooking('bk_1001');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg cursor-pointer"
              >
                Accept Tour Ride ($36 USD)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earnings', value: '$1,420 USD', icon: 'payments', color: 'text-emerald-600' },
          { label: 'Completed Tours', value: `${guideProfile.completedTours} Tours`, icon: 'task_alt', color: 'text-teal-600' },
          { label: 'Average Rating', value: `★ ${guideProfile.rating}`, icon: 'star', color: 'text-amber-500' },
          { label: 'Response Rate', value: '99.2%', icon: 'bolt', color: 'text-indigo-600' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">{stat.label}</span>
              <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

    </section>
  );
};
