import React, { useState } from 'react';
import { GuideProfile, TourBooking, TravelerPostRequest, NegotiationOffer, TourPackage } from '../../types';
import { KYCSubmissionModal } from './KYCSubmissionModal';
import { CreateTourModal } from './CreateTourModal';
import { TourDetailModal } from './TourDetailModal';
import { EditTourModal } from './EditTourModal';
import { GuideBookingsAndNegotiations } from './GuideBookingsAndNegotiations';
import { Language } from '../../lib/translations';

interface GuideDashboardProps {
  guideProfile: GuideProfile;
  bookings: TourBooking[];
  posts: TravelerPostRequest[];
  negotiations: NegotiationOffer[];
  tours: TourPackage[];
  onToggleStatus: (guideId: string, isOnline: boolean) => void;
  onSubmitKYC: (payload: {
    cardNumber: string;
    issuingAuthority: string;
    expiryDate: string;
    cardImageUrl: string;
    cccdNumber: string;
    cccdFrontUrl: string;
    cccdBackUrl: string;
    facePhotoUrl: string;
    tourGuideCardUrl: string;
    agreedToTerms: boolean;
  }) => void;
  onCreateTour: (tourData: any) => void;
  onUpdateTour?: (tourData: any) => void;
  onAcceptBooking: (bookingId: string) => void;
  onSendBidToPost: (postId: string, offerPrice: number, message: string) => void;
  onRespondNegotiation: (offerId: string, action: 'accept' | 'counter' | 'decline', counterPrice?: number, message?: string) => void;
  onConfirmCompletion?: (bookingId: string, role: 'traveler' | 'guide') => void;
  language?: Language;
}

export const GuideDashboard: React.FC<GuideDashboardProps> = ({
  guideProfile,
  bookings,
  posts,
  negotiations,
  tours,
  onToggleStatus,
  onSubmitKYC,
  onCreateTour,
  onUpdateTour,
  onAcceptBooking,
  onSendBidToPost,
  onRespondNegotiation,
  onConfirmCompletion,
  language = 'en'
}) => {
  const [isKYCModalOpen, setIsKYCModalOpen] = useState<boolean>(false);
  const [isCreateTourOpen, setIsCreateTourOpen] = useState<boolean>(false);

  // Detail & Edit Modals state
  const [selectedTourForDetail, setSelectedTourForDetail] = useState<TourPackage | null>(null);
  const [selectedTourForEdit, setSelectedTourForEdit] = useState<TourPackage | null>(null);

  const myTours = (tours || []).filter(
    t => t.guideId === guideProfile.id || t.guideName?.toLowerCase() === guideProfile.fullName?.toLowerCase()
  );

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Tourist Guide Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <img
              src={guideProfile.avatar}
              alt={guideProfile.fullName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-400 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white">{guideProfile.fullName}</h1>
                
                {/* KYC Badge Status */}
                {guideProfile.kycStatus === 'verified' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-500/30 flex items-center space-x-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>Verified License 📜</span>
                  </span>
                ) : guideProfile.kycStatus === 'pending' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold border border-amber-500/30 flex items-center space-x-1">
                    <span className="material-symbols-outlined text-xs">hourglass_top</span>
                    <span>KYC Pending Admin Review</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-extrabold border border-rose-500/30 flex items-center space-x-1">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    <span>Unverified License</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {guideProfile.bio}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-300 font-medium">
                <span>📍 {guideProfile.city}</span>
                <span>★ {guideProfile.rating} ({guideProfile.reviewCount} Reviews)</span>
                <span>💵 ${guideProfile.hourlyRateUSD}/hr</span>
                <span>🛵 {guideProfile.vehicleModel || 'Scooter / Walking'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap md:flex-col gap-2.5 justify-end">
            
            {/* Online Status Toggle */}
            <button
              onClick={() => onToggleStatus(guideProfile.id, !guideProfile.isOnline)}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md ${
                guideProfile.isOnline
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${guideProfile.isOnline ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>{guideProfile.isOnline ? 'Online for Dispatch' : 'Offline'}</span>
            </button>

            {/* KYC Card Verify Status Button */}
            <button
              onClick={() => setIsKYCModalOpen(true)}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5 ${
                guideProfile.kycStatus === 'verified' || guideProfile.verified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : guideProfile.kycStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                  : guideProfile.kycStatus === 'rejected'
                  ? 'bg-rose-500 hover:bg-rose-400 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {guideProfile.kycStatus === 'verified' || guideProfile.verified
                  ? 'verified'
                  : guideProfile.kycStatus === 'pending'
                  ? 'hourglass_top'
                  : guideProfile.kycStatus === 'rejected'
                  ? 'release_alert'
                  : 'badge'}
              </span>
              <span>
                {guideProfile.kycStatus === 'verified' || guideProfile.verified
                  ? 'Verified Guide 📜'
                  : guideProfile.kycStatus === 'pending'
                  ? 'Under Review ⏳'
                  : guideProfile.kycStatus === 'rejected'
                  ? 'Re-submit License ⚠️'
                  : 'Verify Tour Guide Card'}
              </span>
            </button>

            {/* Create Tour Button */}
            <button
              onClick={() => setIsCreateTourOpen(true)}
              className="px-4 py-2 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Create Tour Package</span>
            </button>

          </div>

        </div>

        {/* Verification Status Alert Banner */}
        {guideProfile.kycStatus !== 'verified' && !guideProfile.verified && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            {guideProfile.kycStatus === 'pending' ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0">hourglass_top</span>
                  <div>
                    <p className="font-extrabold text-white text-sm">License Verification Pending Admin Review</p>
                    <p className="text-amber-200/90 text-xs mt-0.5">Your Tour Guide Card & CCCD submission is being reviewed by Admin. Tour creation & bidding will be unlocked upon approval.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKYCModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-sm"
                >
                  View Application 📜
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-rose-400 text-2xl shrink-0">gavel</span>
                  <div>
                    <p className="font-extrabold text-white text-sm">Tour Guide Verification Required</p>
                    <p className="text-rose-200/90 text-xs mt-0.5">You must submit your official Tour Guide License Card & CCCD before creating tour packages or bidding on traveler requests.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKYCModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-lg transition-all flex items-center space-x-1.5"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>Submit Verification Now</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guide Published Tours Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="material-symbols-outlined text-teal-600">inventory_2</span>
              <span>My Published Custom Tours ({myTours.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click 'Detail' to inspect or 'Edit' to make changes (editing is allowed only if zero active negotiations or bookings exist).
            </p>
          </div>

          <button
            onClick={() => setIsCreateTourOpen(true)}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 cursor-pointer flex items-center space-x-1 shrink-0 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add Tour Package</span>
          </button>
        </div>

        {myTours.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="material-symbols-outlined text-3xl text-slate-400">tour</span>
            <p className="text-xs font-bold text-slate-700">No Published Custom Tours Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first tour package above to showcase your local expertise and accept direct traveler bookings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTours.map((t) => {
              // Lock condition check
              const tourNegotiations = (negotiations || []).filter(
                n => (n.tourId === t.id || (n.tourTitle && n.tourTitle.toLowerCase() === t.title.toLowerCase())) &&
                     n.status !== 'declined'
              );

              const tourBookings = (bookings || []).filter(
                b => (b.tourId === t.id || (b.tourTitle && b.tourTitle.toLowerCase() === t.title.toLowerCase())) &&
                     b.status !== 'cancelled'
              );

              const isLocked = tourNegotiations.length > 0 || tourBookings.length > 0;

              return (
                <div key={t.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                  <div className="relative">
                    <img src={t.imageUrl} alt={t.title} className="w-full h-36 object-cover" />
                    
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-teal-900/80 backdrop-blur-md text-teal-200 text-[10px] font-bold uppercase">
                        {t.category}
                      </span>
                    </div>

                    {/* Lock vs Editable Badge */}
                    <div className="absolute top-2 right-2">
                      {isLocked ? (
                        <span
                          title={`Editing Locked: ${tourNegotiations.length} Negotiations, ${tourBookings.length} Bookings`}
                          className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black shadow flex items-center space-x-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">lock</span>
                          <span>Locked</span>
                        </span>
                      ) : (
                        <span
                          title="Unlocked: Ready to edit"
                          className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black shadow flex items-center space-x-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                          <span>Editable</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                        {t.title}
                      </h4>
                      <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                        ⏱️ {t.durationHours} Hours • 💵 ${t.priceUSDPerPerson}/person
                      </p>

                      {isLocked ? (
                        <div className="text-[10px] text-amber-800 font-bold mt-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-200 flex items-center space-x-1">
                          <span className="material-symbols-outlined text-xs text-amber-600">lock</span>
                          <span className="truncate">
                            Locked ({tourNegotiations.length > 0 ? `${tourNegotiations.length} Negs` : ''}{tourNegotiations.length > 0 && tourBookings.length > 0 ? ' & ' : ''}{tourBookings.length > 0 ? `${tourBookings.length} Bookings` : ''})
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-emerald-700 font-medium mt-1.5 flex items-center space-x-1">
                          <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
                          <span>Ready to edit (0 active negs/bookings)</span>
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTourForDetail(t)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-all flex items-center justify-center space-x-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>Detail</span>
                      </button>

                      <button
                        disabled={isLocked}
                        onClick={() => {
                          if (!isLocked) setSelectedTourForEdit(t);
                        }}
                        className={`flex-1 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1 ${
                          isLocked
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-sm active:scale-95'
                        }`}
                        title={isLocked ? 'Cannot edit tour: Active negotiations or bookings exist' : 'Edit Tour'}
                      >
                        <span className="material-symbols-outlined text-sm">{isLocked ? 'lock' : 'edit'}</span>
                        <span>{isLocked ? 'Locked' : 'Edit'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookings, Requests & Negotiations Module */}
      <GuideBookingsAndNegotiations
        guideProfile={guideProfile}
        bookings={bookings}
        posts={posts}
        negotiations={negotiations}
        onAcceptBooking={onAcceptBooking}
        onSendBidToPost={onSendBidToPost}
        onRespondNegotiation={onRespondNegotiation}
        onConfirmCompletion={onConfirmCompletion}
        onOpenKYCModal={() => setIsKYCModalOpen(true)}
      />

      {/* Modals */}
      <KYCSubmissionModal
        isOpen={isKYCModalOpen}
        onClose={() => setIsKYCModalOpen(false)}
        guideProfile={guideProfile}
        onSubmitKYC={onSubmitKYC}
        language={language}
      />

      <CreateTourModal
        isOpen={isCreateTourOpen}
        onClose={() => setIsCreateTourOpen(false)}
        guideProfile={guideProfile}
        onCreateTour={onCreateTour}
        onOpenKYCModal={() => setIsKYCModalOpen(true)}
        language={language}
      />

      <TourDetailModal
        isOpen={!!selectedTourForDetail}
        onClose={() => setSelectedTourForDetail(null)}
        tour={selectedTourForDetail}
        negotiations={negotiations}
        bookings={bookings}
        onOpenEdit={(tourToEdit) => {
          setSelectedTourForDetail(null);
          setSelectedTourForEdit(tourToEdit);
        }}
        language={language}
      />

      <EditTourModal
        isOpen={!!selectedTourForEdit}
        onClose={() => setSelectedTourForEdit(null)}
        tour={selectedTourForEdit}
        guideProfile={guideProfile}
        negotiations={negotiations}
        bookings={bookings}
        onUpdateTour={(tourData) => {
          if (onUpdateTour) onUpdateTour(tourData);
        }}
        language={language}
      />

    </section>
  );
};

