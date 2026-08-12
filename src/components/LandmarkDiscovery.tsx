import React, { useState } from 'react';
import { Landmark } from '../types';

interface LandmarkDiscoveryProps {
  landmarks: Landmark[];
  selectedCity: string;
  onSelectLandmarkForGuide: (landmark: Landmark) => void;
  onOpenAIPlanner: () => void;
}

export const LandmarkDiscovery: React.FC<LandmarkDiscoveryProps> = ({
  landmarks,
  selectedCity,
  onSelectLandmarkForGuide,
  onOpenAIPlanner
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Landmarks', icon: 'auto_awesome' },
    { id: 'heritage', label: 'Heritage & History', icon: 'account_balance' },
    { id: 'food', label: 'Street Food & Night Stalls', icon: 'ramen_dining' },
    { id: 'hidden_gem', label: 'Hidden Gems', icon: 'visibility_off' },
    { id: 'culture', label: 'Temples & Culture', icon: 'temple_buddhist' },
    { id: 'photo', label: 'Photo Spots', icon: 'photo_camera' }
  ];

  const filteredLandmarks = landmarks.filter(l => {
    const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
    }
  };

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Banner / Hero Prompt */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white mb-8 border border-slate-800 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
            <span className="material-symbols-outlined text-sm">explore</span>
            <span>Discover Local Landmarks in {selectedCity}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Explore Landmarks with On-Demand Local Experts
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mb-6">
            Like Grab for tour guides! Browse iconic attractions, play instant audio overviews, or match with a local guide on a scooter or walking tour in under 3 minutes.
          </p>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectLandmarkForGuide(landmarks[0])}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center space-x-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-lg">moped</span>
              <span>Dispatch Guide Now</span>
            </button>
            <button
              onClick={onOpenAIPlanner}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center space-x-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-teal-400 text-lg">auto_awesome</span>
              <span>Generate AI Itinerary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder={`Search landmarks in ${selectedCity}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Category Filter Chips & View Mode */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">map</span>
              <span>Map View</span>
            </button>
          </div>
        </div>

      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* VIEW 1: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLandmarks.map((landmark) => (
            <div
              key={landmark.id}
              className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Image & Badges */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={landmark.imageUrl}
                  alt={landmark.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide uppercase">
                    {landmark.category.replace('_', ' ')}
                  </span>
                  {landmark.entryFeeUSD === 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                      FREE ENTRY
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center space-x-1 shadow">
                  <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                  <span>{landmark.rating}</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-600 transition-colors mb-1">
                    {landmark.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mb-3">
                    <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                    <span>{landmark.address}</span>
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {landmark.description}
                  </p>

                  {/* Highlight Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {landmark.highlights.slice(0, 3).map((hl, i) => (
                      <span key={`${landmark.id}-hl-${i}`} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                        ✨ {hl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Audio Guide simulator toggle */}
                  {landmark.audioGuideUrl ? (
                    <button
                      onClick={() => toggleAudio(landmark.id)}
                      className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        playingAudioId === landmark.id
                          ? 'bg-teal-50 text-teal-700 border-teal-300 animate-pulse'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {playingAudioId === landmark.id ? 'pause' : 'volume_up'}
                      </span>
                      <span>{playingAudioId === landmark.id ? 'Playing Audio' : 'Audio Guide'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{landmark.suggestedDurationMins}m suggested</span>
                    </span>
                  )}

                  {/* Grab-style Guide Match Button */}
                  <button
                    onClick={() => onSelectLandmarkForGuide(landmark)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">person_pin_circle</span>
                    <span>Book Guide Here</span>
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: INTERACTIVE MAP VIEW */}
      {viewMode === 'map' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <span className="material-symbols-outlined text-teal-400">map</span>
                <span>Interactive Landmark & Guide Map ({selectedCity})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Click pins to dispatch a local guide directly to the landmark.
              </p>
            </div>
          </div>

          {/* Simulated Map Canvas */}
          <div className="relative h-96 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-4">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

            {/* Simulated Street Paths */}
            <svg className="absolute inset-0 w-full h-full opacity-20 stroke-teal-500" strokeWidth="2" fill="none">
              <path d="M 50 100 Q 200 300 400 150 T 800 250" />
              <path d="M 100 350 Q 300 100 700 300" />
              <line x1="200" y1="0" x2="200" y2="400" />
              <line x1="500" y1="0" x2="500" y2="400" />
            </svg>

            {/* Landmark Map Pins */}
            {filteredLandmarks.map((lm, idx) => {
              const positions = [
                { top: '25%', left: '30%' },
                { top: '45%', left: '60%' },
                { top: '70%', left: '40%' },
                { top: '30%', left: '75%' },
                { top: '65%', left: '80%' }
              ];
              const pos = positions[idx % positions.length];

              return (
                <div
                  key={lm.id}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                  onClick={() => onSelectLandmarkForGuide(lm)}
                >
                  {/* Pin Icon */}
                  <div className="w-9 h-9 rounded-full bg-teal-500 border-2 border-white text-slate-950 font-bold flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                  </div>

                  {/* Tooltip Card */}
                  <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <p className="font-bold text-xs text-white truncate">{lm.name}</p>
                    <p className="text-[10px] text-teal-400 font-medium">★ {lm.rating} • {lm.category}</p>
                    <p className="text-[10px] text-slate-300 mt-1">Tap to book guide</p>
                  </div>
                </div>
              );
            })}

            {/* Simulated Live Guide Scooter Icon */}
            <div className="absolute top-[50%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 bg-emerald-500/90 text-slate-950 px-2 py-1 rounded-full text-[10px] font-bold shadow-lg animate-bounce z-20">
              <span className="material-symbols-outlined text-xs">moped</span>
              <span>Guide Minh (Nearby)</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              📍 Simulated Map View • {filteredLandmarks.length} Landmarks
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
