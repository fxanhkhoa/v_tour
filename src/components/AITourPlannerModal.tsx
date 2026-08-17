import React, { useState, useEffect, useRef } from 'react';
import { AIItineraryResponse } from '../types';

interface AITourPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectLandmarkForGuide?: (landmarkName: string) => void;
  onConvertToPublicPost?: (payload: any) => void;
}

export const AITourPlannerModal: React.FC<AITourPlannerModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectLandmarkForGuide,
  onConvertToPublicPost
}) => {
  if (!isOpen) return null;

  const [destination, setDestination] = useState<string>(selectedCity && selectedCity !== 'All' ? selectedCity : 'Ho Chi Minh City');
  const [selectedVibe, setSelectedVibe] = useState<string>('Artisan Coffee, Secret Speakeasies & Photography');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Artisan Coffee', 'Secret Speakeasies', 'Photography']);
  const [budgetUSD, setBudgetUSD] = useState<number>(85);
  const [loading, setLoading] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [streamedDaysCount, setStreamedDaysCount] = useState<number>(0);
  const [itinerary, setItinerary] = useState<AIItineraryResponse | null>(null);
  const [vfxActive, setVfxActive] = useState<boolean>(false);
  const [conversionSuccess, setConversionSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync destination if prop changes
  useEffect(() => {
    if (selectedCity && selectedCity !== 'All') {
      setDestination(selectedCity);
    }
  }, [selectedCity]);

  // Golden micro-particles VFX Canvas animation effect
  useEffect(() => {
    if (!vfxActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      alpha: number;
      life: number;
      maxLife: number;
    }> = [];

    const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#d97706', '#ffffff'];

    // Spawn 80 golden radiating micro-particles from center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 3;

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particles.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        radius: 1.2 + Math.random() * 2.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.8 + Math.random() * 0.2,
        life: 0,
        maxLife: 60 + Math.random() * 60
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
        ctx.restore();

        // Respawn particle if expired while vfx is active
        if (p.life >= p.maxLife && vfxActive) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 3.5;
          particles[index] = {
            x: centerX + (Math.random() - 0.5) * 60,
            y: centerY + (Math.random() - 0.5) * 60,
            radius: 1.2 + Math.random() * 2.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 0.9,
            life: 0,
            maxLife: 50 + Math.random() * 50
          };
        }
      });

      if (vfxActive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [vfxActive]);

  const vibePresets = [
    'Artisan Coffee, Secret Speakeasies & Photography',
    'Street Food & Hidden Alleyways',
    'Colonial History & Culture',
    'Rooftop Bars & Modern City Lights',
    'Temples, Sacred Sites & Markets'
  ];

  const interestOptions = [
    'Artisan Coffee', 'Secret Speakeasies', 'Photography',
    'Street Food', 'Colonial History', 'Hidden Alleys',
    'Modern Rooftops', 'Temples & Sacred Sites'
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
    setVfxActive(true);
    setItinerary(null);
    setStreaming(false);
    setStreamedDaysCount(0);
    setConversionSuccess(false);

    // Simulate real-time streaming & AI calculation
    setTimeout(() => {
      const generated: AIItineraryResponse = {
        title: `✨ Custom 3-Day ${destination} Speakeasy & Artisan Experience`,
        summary: `Tailored for ${selectedVibe}. Discover 1920s hidden bars, heritage specialty roasteries, and urban rooftop photography spots in ${destination}.`,
        recommendedGuideType: 'Licensed Foodie & Cultural Photographer Guide',
        estimatedBudgetUSD: budgetUSD,
        days: [
          {
            dayNumber: 1,
            title: 'Day 1: Artisan Specialty Coffee & Secret Rooftops',
            activities: [
              {
                time: '09:00 AM',
                title: 'Heritage Specialty Coffee Tasting at 42 Nguyen Hue',
                description: 'Explore a restored 1960s apartment building converted into independent artisan cafes. Sample authentic egg coffee and hand-dripped Arabica.',
                landmarkName: 'Nguyen Hue Walking Street',
                tips: 'Best lighting for portraits near the balcony edge at 10 AM.'
              },
              {
                time: '02:30 PM',
                title: 'Hidden French Colonial Alleyway Photo Walk',
                description: 'Walk through narrow District 1 alleyways lined with old architecture, vibrant street art, and vintage antique shops.',
                landmarkName: 'Fine Arts Museum Alley',
                tips: 'Use a 35mm lens for dramatic depth of field in tight alleys.'
              },
              {
                time: '07:30 PM',
                title: 'Concealed Entrance Prohibition Speakeasy Bar',
                description: 'Enter through a vintage tailor shop mirror door into a hidden craft cocktail lounge featuring custom gin infusions.',
                landmarkName: 'District 1 Hidden Speakeasy',
                tips: 'Password changes daily; your guide holds private VIP reservation.'
              }
            ]
          },
          {
            dayNumber: 2,
            title: 'Day 2: Vintage Vespa Roastery & Jazz Speakeasy',
            activities: [
              {
                time: '10:00 AM',
                title: 'Roastery Lab Tour & Cupping Session',
                description: 'Private cupping session with master roasters in District 3. Learn single-origin bean processing and Robusta roasting techniques.',
                landmarkName: 'District 3 Roastery Lab',
                tips: 'Includes a complimentary bag of freshly roasted Dalat Arabica beans.'
              },
              {
                time: '03:00 PM',
                title: 'Architectural Photography at Central Post Office & Cathedral',
                description: 'Capture iconic French Gothic & Renaissance Revival landmarks with expert guide photo composition guidance.',
                landmarkName: 'Saigon Central Post Office',
                tips: 'Golden hour light hits the Post Office archways around 3:45 PM.'
              },
              {
                time: '08:00 PM',
                title: 'Underground Vinyl & Live Jazz Lounge',
                description: 'Sip signature tropical cocktails while listening to live acoustic jazz tucked away behind an innocent noodle shop doorway.',
                landmarkName: 'Japan Town Alley Speakeasy',
                tips: 'Dress code: Smart casual.'
              }
            ]
          },
          {
            dayNumber: 3,
            title: 'Day 3: Sunset River Cruise & Rooftop Mixology',
            activities: [
              {
                time: '04:30 PM',
                title: 'Sunset River Speedboat & Skyline Photography',
                description: 'Private boat ride along the Saigon River capturing panoramic city views as evening lights switch on.',
                landmarkName: 'Saigon Waterbus Pier',
                tips: 'Great opportunity for long-exposure skyline shots.'
              },
              {
                time: '08:00 PM',
                title: '360° Panoramic Rooftop Lounge Celebration',
                description: 'Conclude your trip with bespoke cocktail pairings overlooking the illuminated city skyline.',
                landmarkName: 'Bitexco Financial Tower Rooftop',
                tips: 'Includes reserved window seating.'
              }
            ]
          }
        ]
      };

      setLoading(false);
      setStreaming(true);
      setItinerary(generated);

      // Stream days progressively
      setStreamedDaysCount(1);
      setTimeout(() => setStreamedDaysCount(2), 600);
      setTimeout(() => {
        setStreamedDaysCount(3);
        setStreaming(false);
        setTimeout(() => setVfxActive(false), 1200);
      }, 1200);

    }, 1200);
  };

  const handleConvertToRequest = () => {
    if (!itinerary) return;

    const newPostPayload = {
      title: `${destination}: ${selectedVibe}`,
      city: destination,
      preferredDate: 'Next 3 Days (Flexible)',
      groupSize: 2,
      minBudgetUSD: Math.round(budgetUSD * 0.8),
      maxBudgetUSD: budgetUSD,
      description: `AI Smart Itinerary Request for ${destination}.\n\nVibe: ${selectedVibe}.\nInterests: ${selectedInterests.join(', ')}.\n\nSchedule Summary:\n${itinerary.summary}\n\nSeeking a verified local guide to conduct this private itinerary!`,
      preferredLanguage: 'English'
    };

    if (onConvertToPublicPost) {
      onConvertToPublicPost(newPostPayload);
    }
    setConversionSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-lg animate-fade-in">
      <div className="bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-800 text-white relative">
        
        {/* Particle Canvas Overlay for Golden Micro-Particles VFX */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-700 ${
            vfxActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-6 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-1.5">
            <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
            <span>Gemini 3.6 Flash • Smart Tour Generator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>AI Tour Planner</span>
            <span className="text-amber-400">✨</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Craft custom multi-day itineraries with real-time AI streaming & instant guide conversion.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Destination Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <span className="material-symbols-outlined text-amber-400 text-base">location_on</span>
                <span>Destination</span>
              </label>
              <select
                id="destination-select"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-white font-extrabold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer shadow-inner"
              >
                <option value="Ho Chi Minh City">Ho Chi Minh City</option>
                <option value="Hanoi">Hanoi</option>
                <option value="Da Nang">Da Nang</option>
                <option value="Hoi An">Hoi An</option>
                <option value="Hue">Hue</option>
                <option value="Nha Trang">Nha Trang</option>
                <option value="Phu Quoc">Phu Quoc</option>
              </select>
            </div>

            {/* Vibe Selection Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <span className="material-symbols-outlined text-amber-400 text-base">auto_awesome</span>
                <span>Travel Vibe</span>
              </label>
              <select
                id="vibe-select"
                value={selectedVibe}
                onChange={(e) => {
                  setSelectedVibe(e.target.value);
                  if (e.target.value.includes('Artisan Coffee')) {
                    setSelectedInterests(['Artisan Coffee', 'Secret Speakeasies', 'Photography']);
                  }
                }}
                className="w-full p-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer shadow-inner"
              >
                {vibePresets.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Interactive Vibe Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Specific Vibe Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInterest(opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    selectedInterests.includes(opt)
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {selectedInterests.includes(opt) ? '✓ ' : '+ '} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            id="generate-itinerary-btn"
            onClick={handleGenerateItinerary}
            disabled={loading || streaming}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-amber-300/40 relative overflow-hidden"
          >
            <span className="material-symbols-outlined text-xl animate-spin-slow">auto_awesome</span>
            <span>{loading ? 'Analyzing Landmarks & Secret Spots...' : 'Generate Smart Itinerary'}</span>
          </button>

          {/* VFX Loading Particle Banner */}
          {loading && (
            <div className="p-8 text-center bg-slate-950/80 rounded-2xl border border-amber-500/40 shadow-2xl relative overflow-hidden">
              <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-extrabold text-amber-300 animate-pulse">
                ✨ Golden VFX: Gemini 3.6 Flash is streaming live itinerary...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Curating speakeasy passwords, artisan coffee roasteries & golden hour photo spots in {destination}
              </p>
            </div>
          )}

          {/* Streamed Itinerary Content */}
          {itinerary && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-fade-in">
              
              {/* Summary Card */}
              <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 rounded-2xl border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-extrabold text-white text-base sm:text-lg text-amber-300">
                    {itinerary.title}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[11px] uppercase tracking-wider shrink-0">
                    AI Live Streamed
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {itinerary.summary}
                </p>

                {/* Budget Slider Section */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="material-symbols-outlined text-amber-400 text-base">payments</span>
                      <span>Target Budget per Day</span>
                    </label>
                    <span id="budget-value-badge" className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
                      ${budgetUSD} USD
                    </span>
                  </div>

                  <input
                    id="budget-slider"
                    type="range"
                    min="30"
                    max="250"
                    step="5"
                    value={budgetUSD}
                    onChange={(e) => setBudgetUSD(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>$30 (Backpacker)</span>
                    <span className="text-amber-400">$85 (Recommended)</span>
                    <span>$250 (VIP Luxury)</span>
                  </div>
                </div>
              </div>

              {/* Multi-Day Streamed Activities */}
              <div className="space-y-4">
                {itinerary.days?.slice(0, streamedDaysCount).map((day) => (
                  <div key={day.dayNumber} className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 transition-all animate-slide-up">
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                      <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
                        {day.dayNumber}
                      </span>
                      <h4 className="font-extrabold text-amber-300 text-sm">{day.title}</h4>
                    </div>

                    <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-amber-500/40">
                      {day.activities?.map((act, i) => (
                        <div key={`act-${day.dayNumber}-${i}`} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 text-xs hover:border-amber-500/30 transition-all">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                              {act.time}
                            </span>
                            {act.landmarkName && (
                              <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                                <span className="material-symbols-outlined text-xs text-amber-400">pin_drop</span>
                                <span>{act.landmarkName}</span>
                              </span>
                            )}
                          </div>
                          <p className="font-extrabold text-white text-xs mb-1">{act.title}</p>
                          <p className="text-slate-300 text-xs leading-relaxed mb-2">{act.description}</p>
                          {act.tips && (
                            <p className="text-[11px] text-amber-300 bg-amber-950/50 p-2 rounded-lg border border-amber-500/30 font-medium">
                              💡 Pro Tip: {act.tips}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Conversion Action Section */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <button
                  id="convert-trip-request-btn"
                  onClick={handleConvertToRequest}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-emerald-300/40"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                  <span>Convert into Public Trip Request</span>
                </button>

                {conversionSuccess && (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-bold text-center animate-fade-in flex items-center justify-center space-x-2">
                    <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                    <span>Successfully converted into a Public Trip Request! Local guides can now submit bids.</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
