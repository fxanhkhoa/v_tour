import React, { useState } from 'react';
import { AIItineraryResponse, Landmark } from '../types';

interface AITourPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectLandmarkForGuide: (landmarkName: string) => void;
}

export const AITourPlannerModal: React.FC<AITourPlannerModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectLandmarkForGuide
}) => {
  if (!isOpen) return null;

  const [durationDays, setDurationDays] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Street Food', 'History']);
  const [budgetStyle, setBudgetStyle] = useState<'budget' | 'moderate' | 'luxury'>('moderate');
  const [loading, setLoading] = useState<boolean>(false);
  const [itinerary, setItinerary] = useState<AIItineraryResponse | null>(null);

  const interestOptions = [
    'Street Food', 'Colonial History', 'Hidden Alleys', 'Photography',
    'Temples & Sacred Sites', 'Modern Rooftops', 'Coffee Culture', 'Shopping'
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleGenerateItinerary = async () => {
    setLoading(true);
    setItinerary(null);

    try {
      const response = await fetch('/api/ai/recommend-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: selectedCity,
          durationDays,
          interests: selectedInterests,
          budget: budgetStyle,
          pace: 'balanced'
        })
      });

      const data = await response.json();
      setLoading(false);
      if (data.itinerary) {
        setItinerary(data.itinerary);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white sticky top-0 z-10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>Gemini 3.6 Flash Tour Generator</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            AI Personalized Tour Itinerary Builder
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Custom schedule crafted for {selectedCity} based on your interests and travel style.
          </p>
        </div>

        {/* Input Parameters */}
        <div className="p-6 space-y-5">
          
          {/* Duration Days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Trip Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    durationDays === days
                      ? 'bg-teal-600 text-white border-teal-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {days} {days === 1 ? 'Day Express' : `${days} Days Trip`}
                </button>
              ))}
            </div>
          </div>

          {/* Interests Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Travel Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInterest(opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                    selectedInterests.includes(opt)
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {selectedInterests.includes(opt) ? '✓ ' : '+ '} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateItinerary}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
            <span>{loading ? 'Generating Custom Itinerary with AI...' : 'Generate Itinerary Now'}</span>
          </button>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold text-slate-800">Gemini 3.6 Flash is analyzing local landmarks...</p>
              <p className="text-[11px] text-slate-500 mt-1">Creating optimal route, timings & local guide pairings</p>
            </div>
          )}

          {/* Output Itinerary Display */}
          {itinerary && (
            <div className="space-y-6 pt-4 border-t border-slate-200">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200">
                <h3 className="font-extrabold text-slate-900 text-base mb-1">{itinerary.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed mb-3">{itinerary.summary}</p>
                <div className="flex items-center space-x-4 text-xs font-bold text-teal-900">
                  <span>💡 Guide Pair: {itinerary.recommendedGuideType}</span>
                  <span>💵 ~${itinerary.estimatedBudgetUSD} USD</span>
                </div>
              </div>

              {/* Day Breakdown */}
              {itinerary.days?.map((day) => (
                <div key={day.dayNumber} className="space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {day.dayNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{day.title}</h4>
                  </div>

                  <div className="space-y-3 pl-3 border-l-2 border-teal-500/30">
                    {day.activities?.map((act, i) => (
                      <div key={`act-${day.dayNumber}-${i}`} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-teal-700">{act.time}</span>
                          {act.landmarkName && (
                            <button
                              onClick={() => {
                                onSelectLandmarkForGuide(act.landmarkName || 'Ben Thanh Market');
                                onClose();
                              }}
                              className="px-2 py-0.5 rounded bg-teal-600 text-white font-bold text-[10px] hover:bg-teal-700 cursor-pointer"
                            >
                              Book Guide Here
                            </button>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-xs mb-1">{act.title}</p>
                        <p className="text-slate-600 mb-1.5">{act.description}</p>
                        {act.tips && (
                          <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-1.5 rounded-lg border border-amber-200/60">
                            💡 Tip: {act.tips}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
