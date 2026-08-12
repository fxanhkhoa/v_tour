export type UserRole = 'traveler' | 'guide' | 'admin';

export type KYCStatus = 'unsubmitted' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone?: string;
  bio?: string;
  token?: string;
  status?: 'active' | 'suspended';
  // Guide specific fields
  guideProfile?: GuideProfile;
}

export interface KYCApplication {
  id: string;
  guideId: string;
  guideName: string;
  guideAvatar: string;
  cardNumber: string;
  issuingAuthority: string;
  expiryDate: string;
  cardImageUrl: string;
  // Pipeline fields
  cccdNumber?: string;
  cccdFrontUrl?: string;
  cccdBackUrl?: string;
  facePhotoUrl?: string;
  tourGuideCardUrl?: string;
  agreedToTerms?: boolean;
  status: KYCStatus;
  submittedAt: string;
  rejectionReason?: string;
  declineInstructions?: string;
}

export interface GuideProfile {
  id: string;
  userId: string;
  fullName: string;
  avatar: string;
  city: string;
  rating: number;
  reviewCount: number;
  hourlyRateUSD: number;
  languages: string[];
  bio: string;
  tourTypes: ('walking' | 'scooter' | 'car' | 'bicycle' | 'food' | 'history' | 'culture' | 'heritage' | 'nature' | 'photography')[];
  badges: string[];
  isOnline: boolean;
  currentLat: number;
  currentLng: number;
  vehicleModel?: string;
  verified: boolean;
  kycStatus: KYCStatus;
  kycCardNumber?: string;
  completedTours: number;
}

export interface ScheduleSlot {
  id: string;
  dateStr: string; // e.g. "10/10/2026" or "2026-10-10"
  startTime: string; // e.g. "08:00" or "8:00 AM"
  endTime: string; // e.g. "10:00" or "10:00 AM"
  displayLabel?: string;
}

export interface TourPackage {
  id: string;
  title: string;
  city: string;
  category: string;
  durationHours: number;
  priceUSDPerPerson: number;
  imageUrl: string;
  description: string;
  inclusions: string[];
  itinerarySummary?: string;
  scheduleSlots?: ScheduleSlot[];
  guideId: string;
  guideName: string;
  guideAvatar: string;
  rating: number;
  reviewsCount: number;
  status: 'published' | 'pending_review' | 'archived';
  createdAt: string;
}

export type RequestPostStatus = 'open' | 'negotiating' | 'booked' | 'closed';

export interface TravelerPostRequest {
  id: string;
  travelerId: string;
  travelerName: string;
  travelerAvatar: string;
  title: string;
  city: string;
  preferredDate: string;
  durationHours: number;
  groupSize: number;
  minBudgetUSD: number;
  maxBudgetUSD: number;
  description: string;
  preferredLanguages: string[];
  status: RequestPostStatus;
  createdAt: string;
  bidsCount: number;
}

export type NegotiationStatus = 'pending' | 'countered' | 'accepted' | 'declined';

export interface NegotiationOffer {
  id: string;
  postId?: string; // If tied to a traveler post
  tourId?: string; // If tied to a guide's created tour package
  tourTitle?: string;
  selectedSlot?: ScheduleSlot;
  groupSize?: number;
  travelerId: string;
  travelerName: string;
  guideId: string;
  guideName: string;
  guideAvatar: string;
  guideRating: number;
  offeredPriceUSD: number;
  originalPriceUSD: number;
  lastSenderRole: 'traveler' | 'guide';
  status: NegotiationStatus;
  messages: {
    senderRole: 'traveler' | 'guide';
    text: string;
    priceUSD?: number;
    timestamp: string;
  }[];
  updatedAt: string;
}

export type BookingType = 'instant' | 'scheduled' | 'negotiated_post';
export type BookingStatus = 'searching' | 'matched' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentEscrowStatus = 'held_in_escrow' | 'released' | 'refunded';

export interface TourBooking {
  id: string;
  bookingType: BookingType;
  travelerId: string;
  travelerName: string;
  travelerAvatar: string;
  guideId: string;
  guideName: string;
  guideAvatar: string;
  guidePhone?: string;
  tourTitle: string;
  pickupLocation: string;
  transportMode: 'walking' | 'scooter' | 'car' | 'bicycle';
  groupSize: number;
  totalPriceUSD: number;
  scheduledTime?: string;
  status: BookingStatus;
  createdAt: string;
  pinCode: string; // Safety verification PIN
  postId?: string;

  // Escrow & Payment Fields
  paymentStatus?: PaymentEscrowStatus;
  travelerConfirmedCompletion?: boolean;
  guideConfirmedCompletion?: boolean;
  escrowReleasedAt?: string;
  escrowHoldTxId?: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'traveler' | 'guide' | 'admin';
  text: string;
  timestamp: string;
}

export interface Landmark {
  id: string;
  name: string;
  category: 'heritage' | 'food' | 'nature' | 'photo' | 'culture' | 'hidden_gem';
  city: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string;
  description: string;
  rating: number;
  openingHours: string;
  entryFeeUSD: number;
  suggestedDurationMins: number;
  highlights: string[];
  audioGuideUrl?: string;
}

export interface AIItineraryResponse {
  title: string;
  summary: string;
  days: {
    dayNumber: number;
    title: string;
    activities: {
      time: string;
      title: string;
      description: string;
      landmarkName?: string;
      tips?: string;
    }[];
  }[];
  recommendedGuideType: string;
  estimatedBudgetUSD: number;
}

export interface AdminSystemStats {
  totalUsers: number;
  totalGuides: number;
  totalTravelers: number;
  totalPendingKYC: number;
  totalActivePosts: number;
  totalTours: number;
  totalBookings: number;
  totalRevenueUSD: number;
}
