import mongoose from 'mongoose';
import { 
  User, 
  GuideProfile, 
  KYCApplication, 
  TourPackage, 
  TravelerPostRequest, 
  NegotiationOffer, 
  TourBooking,
  ChatMessage
} from '../types.js';

// Define Schemas
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  avatar: { type: String },
  phone: { type: String },
  bio: { type: String },
  status: { type: String, default: 'active' },
  token: { type: String },
  guideProfile: { type: Object }
});

const GuideProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  avatar: { type: String },
  city: { type: String, required: true },
  rating: { type: Number, default: 5.0 },
  reviewCount: { type: Number, default: 0 },
  hourlyRateUSD: { type: Number, default: 20 },
  languages: [{ type: String }],
  bio: { type: String },
  tourTypes: [{ type: String }],
  badges: [{ type: String }],
  isOnline: { type: Boolean, default: true },
  currentLat: { type: Number, default: 10.7769 },
  currentLng: { type: Number, default: 106.7009 },
  vehicleModel: { type: String },
  verified: { type: Boolean, default: false },
  kycStatus: { type: String, default: 'unsubmitted' },
  kycCardNumber: { type: String },
  completedTours: { type: Number, default: 0 }
});

const KYCApplicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  guideId: { type: String, required: true },
  guideName: { type: String },
  guideAvatar: { type: String },
  cardNumber: { type: String },
  issuingAuthority: { type: String },
  expiryDate: { type: String },
  cardImageUrl: { type: String },
  cccdNumber: { type: String },
  cccdFrontUrl: { type: String },
  cccdBackUrl: { type: String },
  facePhotoUrl: { type: String },
  tourGuideCardUrl: { type: String },
  agreedToTerms: { type: Boolean, default: true },
  status: { type: String, default: 'pending' },
  rejectionReason: { type: String },
  declineInstructions: { type: String },
  submittedAt: { type: String }
});

const TourPackageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  city: { type: String, required: true },
  category: { type: String },
  durationHours: { type: Number, default: 3 },
  priceUSDPerPerson: { type: Number, default: 30 },
  imageUrl: { type: String },
  description: { type: String },
  inclusions: [{ type: String }],
  itinerarySummary: { type: String },
  scheduleSlots: [{ type: Object }],
  guideId: { type: String, required: true },
  guideName: { type: String },
  guideAvatar: { type: String },
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 0 },
  status: { type: String, default: 'published' },
  createdAt: { type: String }
});

const TravelerPostRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  travelerId: { type: String, required: true },
  travelerName: { type: String },
  travelerAvatar: { type: String },
  title: { type: String, required: true },
  city: { type: String, required: true },
  preferredDate: { type: String },
  durationHours: { type: Number, default: 4 },
  groupSize: { type: Number, default: 1 },
  minBudgetUSD: { type: Number, default: 30 },
  maxBudgetUSD: { type: Number, default: 60 },
  description: { type: String },
  preferredLanguages: [{ type: String }],
  status: { type: String, default: 'open' },
  createdAt: { type: String },
  bidsCount: { type: Number, default: 0 }
});

const NegotiationOfferSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  postId: { type: String },
  tourId: { type: String },
  tourTitle: { type: String },
  selectedSlot: {
    id: { type: String },
    dateStr: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    displayLabel: { type: String }
  },
  groupSize: { type: Number },
  travelerId: { type: String, required: true },
  travelerName: { type: String },
  guideId: { type: String, required: true },
  guideName: { type: String },
  guideAvatar: { type: String },
  guideRating: { type: Number },
  offeredPriceUSD: { type: Number },
  originalPriceUSD: { type: Number },
  lastSenderRole: { type: String },
  status: { type: String, default: 'pending' },
  messages: [{
    senderRole: { type: String },
    text: { type: String },
    priceUSD: { type: Number },
    timestamp: { type: String }
  }],
  updatedAt: { type: String }
});

const TourBookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bookingType: { type: String },
  travelerId: { type: String, required: true },
  travelerName: { type: String },
  travelerAvatar: { type: String },
  guideId: { type: String, required: true },
  guideName: { type: String },
  guideAvatar: { type: String },
  guidePhone: { type: String },
  tourTitle: { type: String },
  pickupLocation: { type: String },
  transportMode: { type: String },
  groupSize: { type: Number, default: 1 },
  totalPriceUSD: { type: Number, default: 0 },
  scheduledTime: { type: String },
  status: { type: String, default: 'matched' },
  createdAt: { type: String },
  pinCode: { type: String },
  postId: { type: String },
  paymentStatus: { type: String, default: 'held_in_escrow' },
  travelerConfirmedCompletion: { type: Boolean, default: false },
  guideConfirmedCompletion: { type: Boolean, default: false },
  escrowReleasedAt: { type: String },
  escrowHoldTxId: { type: String }
});

const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bookingId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
});

// Models
export const UserModel = mongoose.model('User', UserSchema);
export const GuideProfileModel = mongoose.model('GuideProfile', GuideProfileSchema);
export const KYCApplicationModel = mongoose.model('KYCApplication', KYCApplicationSchema);
export const TourPackageModel = mongoose.model('TourPackage', TourPackageSchema);
export const TravelerPostRequestModel = mongoose.model('TravelerPostRequest', TravelerPostRequestSchema);
export const NegotiationOfferModel = mongoose.model('NegotiationOffer', NegotiationOfferSchema);
export const TourBookingModel = mongoose.model('TourBooking', TourBookingSchema);
export const ChatMessageModel = mongoose.model('ChatMessage', ChatMessageSchema);

// Initial Seed Data
export const initialUsers: User[] = [
  {
    id: 'u_admin_1',
    name: 'Alexander Wright (Platform Admin)',
    email: 'admin@tourguidehub.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '+1 800-555-0199',
    bio: 'Tour Guide Hub Operations & Back-Office Compliance Lead.',
    status: 'active'
  },
  {
    id: 'u_traveler_1',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    role: 'traveler',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    phone: '+1 555-0192',
    bio: 'Avid traveler and foodie exploring Southeast Asia!',
    status: 'active'
  },
  {
    id: 'u_guide_1',
    name: 'Nguyen Van Minh',
    email: 'minh.tourguide@gmail.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    phone: '+84 908 123 456',
    bio: 'Licensed tour guide in HCMC with 6+ years of history & street food tours.',
    status: 'active'
  },
  {
    id: 'u_guide_2',
    name: 'Somchai Prasert',
    email: 'somchai@example.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    phone: '+66 81 234 5678',
    bio: 'Bangkok native specializing in floating markets and hidden temple architecture.',
    status: 'active'
  },
  {
    id: 'u_guide_3',
    name: 'Le Thi Mai Chi',
    email: 'maichi.hanoi@gmail.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '+84 912 345 678',
    bio: 'Hanoi Old Quarter native & street food enthusiast.',
    status: 'active'
  },
  {
    id: 'u_guide_4',
    name: 'Tran Duc Hoang',
    email: 'hoang.danang@gmail.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    phone: '+84 905 678 910',
    bio: 'Coastal adventure guide & drone photographer in Da Nang.',
    status: 'active'
  },
  {
    id: 'u_guide_5',
    name: 'Vo Thi Kim Anh',
    email: 'kimanh.hoian@gmail.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    phone: '+84 935 112 233',
    bio: 'Hoi An Ancient Town storyteller and culture ambassador.',
    status: 'active'
  },
  {
    id: 'u_guide_6',
    name: 'Pham Quoc Bao',
    email: 'baopham.hue@gmail.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    phone: '+84 903 445 566',
    bio: 'Imperial Citadel historian and royal cuisine expert.',
    status: 'active'
  },
  {
    id: 'u_guide_7',
    name: 'Nguyen Linh Chi',
    email: 'linhchi.phuquoc@gmail.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    phone: '+84 977 889 900',
    bio: 'Phu Quoc islander, boat captain, and diving instructor.',
    status: 'active'
  },
  {
    id: 'u_guide_8',
    name: 'Hoang Van Nam',
    email: 'namhoang.halong@gmail.com',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    phone: '+84 988 123 789',
    bio: 'Ha Long Bay sea kayak guide & cave exploration expert.',
    status: 'active'
  }
];

export const initialGuides: GuideProfile[] = [
  {
    id: 'g_1',
    userId: 'u_guide_1',
    fullName: 'Nguyen Van Minh',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    city: 'Ho Chi Minh City',
    rating: 4.95,
    reviewCount: 142,
    hourlyRateUSD: 20,
    languages: ['English', 'Vietnamese', 'French'],
    bio: 'Born and raised in Saigon District 1. Licensed expert on French colonial history, street coffee culture, and war heritage sites.',
    tourTypes: ['walking', 'scooter', 'food', 'history'],
    badges: ['Licensed Guide 📜', 'Super Guide 🏆', 'Top Driver 🛵'],
    isOnline: true,
    currentLat: 10.7769,
    currentLng: 106.7009,
    vehicleModel: 'Honda Vespa Sprint (Mint Green)',
    verified: true,
    kycStatus: 'verified',
    kycCardNumber: 'VN-TG-889012',
    completedTours: 238
  },
  {
    id: 'g_3',
    userId: 'u_guide_3',
    fullName: 'Le Thi Mai Chi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    city: 'Hanoi',
    rating: 4.98,
    reviewCount: 186,
    hourlyRateUSD: 22,
    languages: ['English', 'Vietnamese', 'French'],
    bio: 'Hanoi Old Quarter native & food blogger. Specialized in 36 Guild Streets food walks, egg coffee workshops, and ancient temple legends.',
    tourTypes: ['walking', 'food', 'culture', 'history'],
    badges: ['VNAT Licensed 📜', 'Foodie Queen 🍜', 'Heritage Expert 🏯'],
    isOnline: true,
    currentLat: 21.0285,
    currentLng: 105.8542,
    vehicleModel: 'Honda SH Mode (Pearl White)',
    verified: true,
    kycStatus: 'verified',
    kycCardNumber: 'VN-TG-991204',
    completedTours: 312
  },
  {
    id: 'g_4',
    userId: 'u_guide_4',
    fullName: 'Tran Duc Hoang',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    city: 'Da Nang',
    rating: 4.92,
    reviewCount: 110,
    hourlyRateUSD: 25,
    languages: ['English', 'Vietnamese', 'Korean'],
    bio: 'Coastal adventure guide & photographer. Marble Mountains, Ba Na Hills Golden Bridge, and Dragon Bridge night scooter rides!',
    tourTypes: ['scooter', 'car', 'nature', 'photography'],
    badges: ['Coastal Pro 🌊', 'Photographer 📸', 'Licensed Guide 📜'],
    isOnline: true,
    currentLat: 16.0544,
    currentLng: 108.2022,
    vehicleModel: 'Toyota Fortuner (Black 7-seater)',
    verified: true,
    kycStatus: 'verified',
    kycCardNumber: 'VN-TG-773412',
    completedTours: 195
  },
  {
    id: 'g_5',
    userId: 'u_guide_5',
    fullName: 'Vo Thi Kim Anh',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    city: 'Hoi An',
    rating: 4.99,
    reviewCount: 215,
    hourlyRateUSD: 18,
    languages: ['English', 'Vietnamese', 'Japanese'],
    bio: 'Hoi An Ancient Town storyteller. Lantern making workshops, organic farming in Tra Que, and Cam Thanh coconut boat rides.',
    tourTypes: ['walking', 'culture', 'food', 'nature'],
    badges: ['UNESCO Specialist 🏛️', 'Culture Ambassador 🏮'],
    isOnline: true,
    currentLat: 15.8801,
    currentLng: 108.3380,
    vehicleModel: 'Bicycle & Electric Shuttle Bus',
    verified: true,
    kycStatus: 'verified',
    kycCardNumber: 'VN-TG-664109',
    completedTours: 340
  },
  {
    id: 'g_6',
    userId: 'u_guide_6',
    fullName: 'Pham Quoc Bao',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    city: 'Hue',
    rating: 4.90,
    reviewCount: 89,
    hourlyRateUSD: 20,
    languages: ['English', 'Vietnamese', 'German'],
    bio: 'Imperial Citadel historian & royal cuisine enthusiast. Cycling tours along Perfume River to ancient tombs and pagodas.',
    tourTypes: ['history', 'walking', 'food', 'culture'],
    badges: ['Royal Historian 👑', 'Cycling Master 🚲'],
    isOnline: false,
    currentLat: 16.4637,
    currentLng: 107.5909,
    vehicleModel: 'Trek Trekking Bicycle & Private Van',
    verified: true,
    kycStatus: 'verified',
    kycCardNumber: 'VN-TG-552190',
    completedTours: 140
  },
  {
    id: 'g_7',
    userId: 'u_guide_7',
    fullName: 'Nguyen Linh Chi',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    city: 'Phu Quoc',
    rating: 4.96,
    reviewCount: 128,
    hourlyRateUSD: 28,
    languages: ['English', 'Vietnamese', 'Russian'],
    bio: 'Phu Quoc islander offering island-hopping speedboats, coral reef snorkeling, fish sauce distillery & pepper farm tours.',
    tourTypes: ['nature', 'car', 'food', 'photography'],
    badges: ['Boat Captain 🚤', 'Diving Instructor 🥽'],
    isOnline: true,
    currentLat: 10.2899,
    currentLng: 103.9840,
    vehicleModel: 'Mercury 300HP Speedboat & SUV',
    verified: true,
    kycStatus: 'verified',
    kycCardNumber: 'VN-TG-443210',
    completedTours: 210
  },
  {
    id: 'g_8',
    userId: 'u_guide_8',
    fullName: 'Hoang Van Nam',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    city: 'Ha Long Bay',
    rating: 4.94,
    reviewCount: 156,
    hourlyRateUSD: 30,
    languages: ['English', 'Vietnamese', 'Mandarin'],
    bio: 'Ha Long Bay native and kayak master. Discovering hidden limestone caves, floating fishing villages, and seafood markets.',
    tourTypes: ['nature', 'culture', 'photography'],
    badges: ['Sea Kayak Guide 🚣', 'Cave Explorer ⛰️'],
    isOnline: true,
    currentLat: 20.9599,
    currentLng: 107.0425,
    vehicleModel: 'Luxury Day Cruise Junk Boat',
    verified: true,
    kycStatus: 'verified',
    kycCardNumber: 'VN-TG-331002',
    completedTours: 275
  },
  {
    id: 'g_2',
    userId: 'u_guide_2',
    fullName: 'Somchai Prasert',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    city: 'Bangkok',
    rating: 4.90,
    reviewCount: 98,
    hourlyRateUSD: 25,
    languages: ['English', 'Thai', 'Mandarin'],
    bio: 'Passionate about Bangkok street art, hidden alleyways, and nighttime tuk-tuk food adventures!',
    tourTypes: ['scooter', 'car', 'food', 'culture'],
    badges: ['TukTuk Master 🛺', 'Foodie Pro 🍜'],
    isOnline: true,
    currentLat: 13.7563,
    currentLng: 100.5018,
    vehicleModel: 'Custom Electric TukTuk',
    verified: false,
    kycStatus: 'pending',
    kycCardNumber: 'TH-TG-442109',
    completedTours: 165
  }
];

export const initialKYCQueue: KYCApplication[] = [
  {
    id: 'kyc_1001',
    guideId: 'g_2',
    guideName: 'Somchai Prasert',
    guideAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    cardNumber: '101180293',
    issuingAuthority: 'Vietnam National Authority of Tourism (VNAT)',
    expiryDate: '2028-12-31',
    cardImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    cccdNumber: '079198004521',
    cccdFrontUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    cccdBackUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    facePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    tourGuideCardUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    agreedToTerms: true,
    status: 'pending',
    submittedAt: new Date(Date.now() - 2 * 3600000).toISOString()
  }
];

export const initialTourPackages: TourPackage[] = [
  {
    id: 'tp_1',
    title: 'Saigon Night Street Food & Hidden Alleys Scooter Tour',
    city: 'Ho Chi Minh City',
    category: 'Food & Scooter',
    durationHours: 3.5,
    priceUSDPerPerson: 35,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    description: 'Ride on the back of a vintage scooter with your expert local guide! Taste 7 authentic dishes across District 3, 4 & 10 including Banh Xeo and Coconut Ice Cream.',
    inclusions: ['Private Local Driver/Guide', 'All Food & Drinks (7 Tastings)', 'Safety Helmet & Insurance', 'Hotel Pickup & Dropoff'],
    itinerarySummary: 'District 1 Pick-up -> District 3 Secret Banh Xeo Alley -> District 4 Seafood Market -> Rooftop Coffee',
    scheduleSlots: [
      { id: 'slot_1', dateStr: '10/10/2026', startTime: '08:00', endTime: '10:00', displayLabel: '08:00 - 10:00 on 10/10/2026' },
      { id: 'slot_2', dateStr: '12/10/2026', startTime: '16:00', endTime: '17:00', displayLabel: '16:00 - 17:00 on 12/10/2026' },
      { id: 'slot_3', dateStr: '15/10/2026', startTime: '18:00', endTime: '21:30', displayLabel: '18:00 - 21:30 on 15/10/2026' }
    ],
    guideId: 'g_1',
    guideName: 'Minh Nguyen',
    guideAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 4.98,
    reviewsCount: 184,
    status: 'published',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'tp_2',
    title: 'Hanoi 36 Guild Streets Egg Coffee & Street Food Tasting Walk',
    city: 'Hanoi',
    category: 'Food & Cultural',
    durationHours: 3.0,
    priceUSDPerPerson: 28,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    description: 'Explore Hanoi Old Quarter hidden alleyways, taste original Bun Cha Obama, famous Pho Cuon, and master the secret recipe of Hanoi Egg Coffee in a 100-year-old heritage house.',
    inclusions: ['Food Blogger Local Guide', '6 Street Food Tastings', 'Secret Egg Coffee Workshop', 'English/French Translation'],
    itinerarySummary: 'St. Joseph Cathedral -> Hang Bac Silver Street -> Dong Xuan Market Food Alley -> Hidden Cafe Egg Coffee',
    scheduleSlots: [
      { id: 'slot_201', dateStr: '11/10/2026', startTime: '09:00', endTime: '12:00', displayLabel: '09:00 - 12:00 on 11/10/2026' },
      { id: 'slot_202', dateStr: '14/10/2026', startTime: '17:30', endTime: '20:30', displayLabel: '17:30 - 20:30 on 14/10/2026' }
    ],
    guideId: 'g_3',
    guideName: 'Mai Chi Le',
    guideAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.99,
    reviewsCount: 210,
    status: 'published',
    createdAt: '2026-02-01T09:00:00.000Z'
  },
  {
    id: 'tp_3',
    title: 'Da Nang Coastal Scooter Adventure & Dragon Bridge Night Spectacle',
    city: 'Da Nang',
    category: 'Scooter & Adventure',
    durationHours: 4.0,
    priceUSDPerPerson: 40,
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    description: 'Ride along My Khe beach, explore Marble Mountain caves, visit Son Tra Peninsula Lady Buddha, and witness Dragon Bridge breathing fire and water at night!',
    inclusions: ['Private Driver & SUV/Scooter', 'Entrance tickets to Marble Mountains', 'Seafood dinner on beach', 'Helmets & Cold Drinks'],
    itinerarySummary: 'Marble Mountains -> Son Tra Monkey Mountain -> My Khe Beach Seafood -> Dragon Bridge Fire Show',
    scheduleSlots: [
      { id: 'slot_301', dateStr: '12/10/2026', startTime: '15:00', endTime: '19:00', displayLabel: '15:00 - 19:00 on 12/10/2026' },
      { id: 'slot_302', dateStr: '16/10/2026', startTime: '16:00', endTime: '20:00', displayLabel: '16:00 - 20:00 on 16/10/2026' }
    ],
    guideId: 'g_4',
    guideName: 'Hoang Tran',
    guideAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    rating: 4.94,
    reviewsCount: 135,
    status: 'published',
    createdAt: '2026-02-10T10:00:00.000Z'
  },
  {
    id: 'tp_4',
    title: 'Hoi An Ancient Town Lantern Making & Tra Que Organic Farm Tour',
    city: 'Hoi An',
    category: 'Culture & Nature',
    durationHours: 4.5,
    priceUSDPerPerson: 32,
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    description: 'Cycle through emerald rice fields to Tra Que vegetable village, join a hands-on silk lantern craft workshop, and enjoy a traditional herbal foot bath.',
    inclusions: ['Bicycle rental & Guide', 'Lantern Crafting Materials', 'Organic Herbal Tea & Snack', 'Tra Que Farm Entrance'],
    itinerarySummary: 'Hoi An Old Town -> Tra Que Cycling -> Lantern Master Workshop -> Coconut Boat Canal Ride',
    scheduleSlots: [
      { id: 'slot_401', dateStr: '13/10/2026', startTime: '08:30', endTime: '13:00', displayLabel: '08:30 - 13:00 on 13/10/2026' },
      { id: 'slot_402', dateStr: '17/10/2026', startTime: '14:00', endTime: '18:30', displayLabel: '14:00 - 18:30 on 17/10/2026' }
    ],
    guideId: 'g_5',
    guideName: 'Kim Anh Vo',
    guideAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    rating: 4.99,
    reviewsCount: 240,
    status: 'published',
    createdAt: '2026-02-15T11:00:00.000Z'
  },
  {
    id: 'tp_5',
    title: 'Hue Imperial Citadel Dragon Boat & Royal Palace Heritage Tour',
    city: 'Hue',
    category: 'History & Heritage',
    durationHours: 5.0,
    priceUSDPerPerson: 42,
    imageUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
    description: 'Step into Vietnam imperial past with a historian guide! Cruise the Perfume River on a traditional dragon boat to Thien Mu Pagoda and Minh Mang Royal Tomb.',
    inclusions: ['Private Dragon Boat', 'Citadel & Tomb Entrance Tickets', 'Hue Royal Court Banquet Lunch', 'Licensed Historian Guide'],
    itinerarySummary: 'Perfume River Dock -> Thien Mu Pagoda -> Imperial Citadel Enclosure -> Minh Mang Royal Tomb',
    scheduleSlots: [
      { id: 'slot_501', dateStr: '11/10/2026', startTime: '08:00', endTime: '13:00', displayLabel: '08:00 - 13:00 on 11/10/2026' },
      { id: 'slot_502', dateStr: '18/10/2026', startTime: '12:30', endTime: '17:30', displayLabel: '12:30 - 17:30 on 18/10/2026' }
    ],
    guideId: 'g_6',
    guideName: 'Bao Quoc Nguyen',
    guideAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 4.96,
    reviewsCount: 162,
    status: 'published',
    createdAt: '2026-02-18T14:00:00.000Z'
  },
  {
    id: 'tp_6',
    title: 'Phu Quoc Speedboat Coral Reef Snorkeling & Island BBQ Safari',
    city: 'Phu Quoc',
    category: 'Adventure & Nature',
    durationHours: 6.0,
    priceUSDPerPerson: 48,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    description: 'Charter a high-speed boat to An Thoi archipelago! Snorkel pristine coral reefs at Fingernail Island, visit May Rut Islet, and indulge in a fresh sea urchin & lobster BBQ lunch on the beach.',
    inclusions: ['Private Speedboat & Captain', 'Snorkeling & Lifejacket Gear', 'Seafood BBQ Lunch on Island', 'GoPro Underwater Photos'],
    itinerarySummary: 'An Thoi Harbor -> Fingernail Island Reef Snorkeling -> May Rut Island BBQ -> Sunset Beach Bar',
    scheduleSlots: [
      { id: 'slot_601', dateStr: '10/10/2026', startTime: '08:30', endTime: '14:30', displayLabel: '08:30 - 14:30 on 10/10/2026' },
      { id: 'slot_602', dateStr: '15/10/2026', startTime: '12:00', endTime: '18:00', displayLabel: '12:00 - 18:00 on 15/10/2026' }
    ],
    guideId: 'g_1',
    guideName: 'Minh Nguyen',
    guideAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 4.97,
    reviewsCount: 98,
    status: 'published',
    createdAt: '2026-02-20T08:00:00.000Z'
  },
  {
    id: 'tp_7',
    title: 'Ha Long Bay Day Cruise Kayaking & Sung Sot Cave Exploration',
    city: 'Ha Long Bay',
    category: 'Nature & Cruise',
    durationHours: 7.0,
    priceUSDPerPerson: 55,
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    description: 'Sail through thousand limestone karst islands on a boutique wooden boat. Kayak through Luon Cave hidden lagoon, climb Ti Top Island peak for panoramic bay views, and enjoy a fresh buffet.',
    inclusions: ['Boutique Wooden Cruise', 'Kayaking & Bamboo Boat Gear', 'Seafood Buffet Lunch', 'Ha Long Bay Entrance Ticket'],
    itinerarySummary: 'Tuan Chau Harbor -> Sung Sot Cave -> Luon Cave Kayaking -> Ti Top Island Viewpoint',
    scheduleSlots: [
      { id: 'slot_701', dateStr: '12/10/2026', startTime: '08:00', endTime: '15:00', displayLabel: '08:00 - 15:00 on 12/10/2026' },
      { id: 'slot_702', dateStr: '19/10/2026', startTime: '09:00', endTime: '16:00', displayLabel: '09:00 - 16:00 on 19/10/2026' }
    ],
    guideId: 'g_3',
    guideName: 'Mai Chi Le',
    guideAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.98,
    reviewsCount: 154,
    status: 'published',
    createdAt: '2026-02-22T09:00:00.000Z'
  },
  {
    id: 'tp_8',
    title: 'Bangkok Old City Tuk Tuk Night Safari & Street Food Crawl',
    city: 'Bangkok',
    category: 'Food & TukTuk',
    durationHours: 4.0,
    priceUSDPerPerson: 38,
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    description: 'Zip through Bangkok glowing streets in a private Tuk Tuk! Taste Michelin Bib Gourmand Pad Thai at Thip Samai, visit Wat Pho at night, and savor mango sticky rice.',
    inclusions: ['Private Tuk Tuk & Licensed Guide', '6 Iconic Street Food Tastings', 'Wat Pho Night Entrance', 'Cold Herbal Drinks'],
    itinerarySummary: 'Yaowarat Chinatown -> Thip Samai Pad Thai -> Wat Pho Illuminated Stupa -> Flower Market',
    scheduleSlots: [
      { id: 'slot_801', dateStr: '14/10/2026', startTime: '18:00', endTime: '22:00', displayLabel: '18:00 - 22:00 on 14/10/2026' },
      { id: 'slot_802', dateStr: '20/10/2026', startTime: '18:30', endTime: '22:30', displayLabel: '18:30 - 22:30 on 20/10/2026' }
    ],
    guideId: 'g_4',
    guideName: 'Hoang Tran',
    guideAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    rating: 4.95,
    reviewsCount: 180,
    status: 'published',
    createdAt: '2026-02-25T11:00:00.000Z'
  },
  {
    id: 'tp_9',
    title: 'Saigon Cu Chi Tunnels Underground Network & Speedboat Cruise',
    city: 'Ho Chi Minh City',
    category: 'History & River Cruise',
    durationHours: 6.5,
    priceUSDPerPerson: 60,
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    description: 'Travel in style aboard a luxury speedboat up the Saigon River! Explore Ben Dinh Cu Chi underground tunnels, shoot target rifles, and savor riverside farm-to-table lunch.',
    inclusions: ['Luxury Speedboat Transport', 'Cu Chi Tunnels Entrance', 'Riverside Vietnamese Lunch', 'English Speaking Historian Guide'],
    itinerarySummary: 'Bach Dang Pier Speedboat -> Cu Chi Tunnels Tour -> Tapioca Tasting -> Riverside Resort Lunch',
    scheduleSlots: [
      { id: 'slot_901', dateStr: '11/10/2026', startTime: '07:30', endTime: '14:00', displayLabel: '07:30 - 14:00 on 11/10/2026' },
      { id: 'slot_902', dateStr: '16/10/2026', startTime: '08:00', endTime: '14:30', displayLabel: '08:00 - 14:30 on 16/10/2026' }
    ],
    guideId: 'g_1',
    guideName: 'Minh Nguyen',
    guideAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 4.99,
    reviewsCount: 220,
    status: 'published',
    createdAt: '2026-02-28T09:00:00.000Z'
  },
  {
    id: 'tp_10',
    title: 'Hanoi Red River Countryside Bike Tour & Bat Trang Ceramic Craft',
    city: 'Hanoi',
    category: 'Culture & Bicycle',
    durationHours: 5.0,
    priceUSDPerPerson: 35,
    imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
    description: 'Cross Long Bien Bridge by bicycle into peaceful rural villages. Visit 700-year-old Bat Trang pottery village, spin your own clay bowl on a potter wheel, and enjoy homecooked lunch.',
    inclusions: ['Trek Mountain Bike & Helmet', 'Hands-on Pottery Class & Clay souvenir', 'Local Family Homecooked Lunch', 'Red River Ferry Pass'],
    itinerarySummary: 'Long Bien Bridge Crossing -> Red River Banana Island -> Bat Trang Potter Workshop -> Family Lunch',
    scheduleSlots: [
      { id: 'slot_1001', dateStr: '13/10/2026', startTime: '08:00', endTime: '13:00', displayLabel: '08:00 - 13:00 on 13/10/2026' },
      { id: 'slot_1002', dateStr: '21/10/2026', startTime: '13:30', endTime: '18:30', displayLabel: '13:30 - 18:30 on 21/10/2026' }
    ],
    guideId: 'g_3',
    guideName: 'Mai Chi Le',
    guideAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.96,
    reviewsCount: 112,
    status: 'published',
    createdAt: '2026-03-01T10:00:00.000Z'
  }
];

export const initialTravelerPosts: TravelerPostRequest[] = [
  {
    id: 'post_101',
    travelerId: 'u_traveler_1',
    travelerName: 'Sarah Jenkins',
    travelerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    title: 'Looking for 1-Day English/French Guide for Cu Chi Tunnels & Saigon War Heritage',
    city: 'Ho Chi Minh City',
    preferredDate: 'Tomorrow at 08:30 AM',
    durationHours: 6,
    groupSize: 2,
    minBudgetUSD: 40,
    maxBudgetUSD: 65,
    description: 'We are a couple interested in deep historical insights regarding the Vietnam War, Cu Chi Tunnels, and colonial architecture. Prefer private AC car or scooter.',
    preferredLanguages: ['English', 'French'],
    status: 'open',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    bidsCount: 2
  }
];

export const initialNegotiationOffers: NegotiationOffer[] = [
  {
    id: 'neg_201',
    postId: 'post_101',
    travelerId: 'u_traveler_1',
    travelerName: 'Sarah Jenkins',
    guideId: 'g_1',
    guideName: 'Minh Nguyen',
    guideAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    guideRating: 4.95,
    offeredPriceUSD: 55,
    originalPriceUSD: 65,
    lastSenderRole: 'guide',
    status: 'pending',
    messages: [
      {
        senderRole: 'guide',
        text: 'Hello Sarah! I can guide both of you for 6 hours including private Cu Chi entrance tickets and my vintage Vespa or AC car. I offer $55 total!',
        priceUSD: 55,
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export const initialTourBookings: TourBooking[] = [
  {
    id: 'bk_1001',
    bookingType: 'negotiated_post',
    travelerId: 'u_traveler_1',
    travelerName: 'Sarah Jenkins',
    travelerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    guideId: 'g_1',
    guideName: 'Minh Nguyen',
    guideAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    guidePhone: '+84 908 123 456',
    tourTitle: 'Cu Chi Tunnels & War Heritage Private Tour',
    pickupLocation: 'Rex Hotel, District 1, HCMC',
    transportMode: 'scooter',
    groupSize: 2,
    totalPriceUSD: 55,
    scheduledTime: 'Tomorrow at 08:30 AM',
    status: 'en_route',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    pinCode: '8492',
    paymentStatus: 'held_in_escrow',
    travelerConfirmedCompletion: false,
    guideConfirmedCompletion: false,
    escrowHoldTxId: 'ESCROW_TX_1001'
  }
];

// In-Memory Fallback State (initialized with seed data)
const memoryUsers: any[] = JSON.parse(JSON.stringify(initialUsers));
const memoryGuides: any[] = JSON.parse(JSON.stringify(initialGuides));
const memoryKYC: any[] = JSON.parse(JSON.stringify(initialKYCQueue));
const memoryTours: any[] = JSON.parse(JSON.stringify(initialTourPackages));
const memoryPosts: any[] = JSON.parse(JSON.stringify(initialTravelerPosts));
const memoryNegotiations: any[] = JSON.parse(JSON.stringify(initialNegotiationOffers));
const memoryBookings: any[] = JSON.parse(JSON.stringify(initialTourBookings));
const memoryChat: any[] = [];

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectMongoDB() {
  mongoose.set('bufferCommands', false);
  const uri = process.env.MONGODB_URI || "mongodb+srv://dratinitechnology_db_user:OJMifjmPuzjrnHLR@cluster0.iiapgvw.mongodb.net/tourguidehub?retryWrites=true&w=majority";

  try {
    console.log('🍃 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      dbName: 'tourguidehub',
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000,
    });
    console.log('🍃 Successfully connected to MongoDB Atlas database!');

    // Seed data if database is empty
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database empty. Seeding initial Tour Guide Hub data into MongoDB...');
      await UserModel.insertMany(initialUsers);
      await GuideProfileModel.insertMany(initialGuides);
      await KYCApplicationModel.insertMany(initialKYCQueue);
      await TourPackageModel.insertMany(initialTourPackages);
      await TravelerPostRequestModel.insertMany(initialTravelerPosts);
      await NegotiationOfferModel.insertMany(initialNegotiationOffers);
      await TourBookingModel.insertMany(initialTourBookings);
      console.log('✅ MongoDB initial data seeding complete!');
    }
  } catch (err: any) {
    console.warn('⚠️ MongoDB Atlas connection restricted or timed out.');
    console.warn('👉 Note: To enable cloud persistence, add 0.0.0.0/0 to your MongoDB Atlas Network Access IP whitelist.');
    console.warn('⚡ Using high-speed in-memory data store as seamless fallback.');
  }
}

// ==================== REPOSITORY / DATA ACCESS HELPERS ====================

// User operations
export async function dbFindUserByEmail(email: string) {
  if (isMongoConnected()) {
    try {
      return await UserModel.findOne({ email: new RegExp('^' + email.trim() + '$', 'i') }).lean();
    } catch (e) {}
  }
  return memoryUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export async function dbFindUserById(id: string) {
  if (isMongoConnected()) {
    try {
      return await UserModel.findOne({ id }).lean();
    } catch (e) {}
  }
  return memoryUsers.find(u => u.id === id) || null;
}

export async function dbFindUserByToken(token: string) {
  if (!token) return null;
  if (isMongoConnected()) {
    try {
      const u = await UserModel.findOne({ token }).lean();
      if (u) return u;
    } catch (e) {}
  }
  const u = memoryUsers.find(x => x.token === token);
  return u || null;
}

export async function dbSaveUser(userData: any) {
  if (!userData.createdAt) {
    userData.createdAt = new Date().toISOString();
  }
  if (isMongoConnected()) {
    try {
      await UserModel.findOneAndUpdate({ id: userData.id }, userData, { upsert: true, new: true });
    } catch (e) {}
  }
  const idx = memoryUsers.findIndex(u => u.id === userData.id);
  if (idx >= 0) {
    memoryUsers[idx] = { ...memoryUsers[idx], ...userData };
  } else {
    memoryUsers.unshift(userData);
  }
  return userData;
}

export async function dbGetAllUsers() {
  if (isMongoConnected()) {
    try {
      const users = await UserModel.find({}).sort({ _id: -1 }).lean();
      if (users && users.length > 0) return users;
    } catch (e) {}
  }
  return [...memoryUsers];
}

// Guide Profile operations
export async function dbFindGuideByUserIdOrName(userId: string, name?: string) {
  if (isMongoConnected()) {
    try {
      const query: any[] = [{ userId }];
      if (name) query.push({ fullName: new RegExp('^' + name + '$', 'i') });
      return await GuideProfileModel.findOne({ $or: query }).lean();
    } catch (e) {}
  }
  return memoryGuides.find(g => g.userId === userId || (name && g.fullName.toLowerCase() === name.toLowerCase())) || null;
}

export async function dbFindGuideById(id: string) {
  if (isMongoConnected()) {
    try {
      return await GuideProfileModel.findOne({ id }).lean();
    } catch (e) {}
  }
  return memoryGuides.find(g => g.id === id) || null;
}

export async function dbSaveGuide(guideData: any) {
  if (isMongoConnected()) {
    try {
      await GuideProfileModel.findOneAndUpdate({ id: guideData.id }, guideData, { upsert: true, new: true });
    } catch (e) {}
  }
  const idx = memoryGuides.findIndex(g => g.id === guideData.id);
  if (idx >= 0) {
    memoryGuides[idx] = { ...memoryGuides[idx], ...guideData };
  } else {
    memoryGuides.push(guideData);
  }
  return guideData;
}

export async function dbGetGuides(city?: string, verifiedOnly?: boolean) {
  if (isMongoConnected()) {
    try {
      const query: any = {};
      if (city && city !== 'All') query.city = new RegExp('^' + city + '$', 'i');
      if (verifiedOnly) query.verified = true;
      return await GuideProfileModel.find(query).sort({ rating: -1 }).lean();
    } catch (e) {}
  }
  return memoryGuides.filter(g => {
    if (city && city !== 'All' && g.city.toLowerCase() !== city.toLowerCase()) return false;
    if (verifiedOnly && !g.verified) return false;
    return true;
  });
}

export async function dbGetOnlineGuide() {
  if (isMongoConnected()) {
    try {
      let g = await GuideProfileModel.findOne({ isOnline: true }).lean();
      if (!g) g = await GuideProfileModel.findOne({}).lean();
      return g;
    } catch (e) {}
  }
  let g = memoryGuides.find(x => x.isOnline);
  if (!g) g = memoryGuides[0];
  return g || null;
}

// KYC operations
export async function dbSaveKYC(kycData: any) {
  if (isMongoConnected()) {
    try {
      await KYCApplicationModel.findOneAndUpdate({ id: kycData.id }, kycData, { upsert: true, new: true });
    } catch (e) {}
  }
  const idx = memoryKYC.findIndex(k => k.id === kycData.id);
  if (idx >= 0) {
    memoryKYC[idx] = { ...memoryKYC[idx], ...kycData };
  } else {
    memoryKYC.unshift(kycData);
  }
  return kycData;
}

export async function dbGetKYCList() {
  if (isMongoConnected()) {
    try {
      return await KYCApplicationModel.find({}).sort({ createdAt: -1 }).lean();
    } catch (e) {}
  }
  return [...memoryKYC];
}

export async function dbFindKYCById(id: string) {
  if (isMongoConnected()) {
    try {
      return await KYCApplicationModel.findOne({ id }).lean();
    } catch (e) {}
  }
  return memoryKYC.find(k => k.id === id) || null;
}

// Tour Package operations
export async function dbSaveTour(tourData: any) {
  if (isMongoConnected()) {
    try {
      await TourPackageModel.findOneAndUpdate({ id: tourData.id }, tourData, { upsert: true, new: true });
    } catch (e) {}
  }
  const idx = memoryTours.findIndex(t => t.id === tourData.id);
  if (idx >= 0) {
    memoryTours[idx] = { ...memoryTours[idx], ...tourData };
  } else {
    memoryTours.unshift(tourData);
  }
  return tourData;
}

export async function dbGetTours(city?: string) {
  if (isMongoConnected()) {
    try {
      const query: any = {};
      if (city && city !== 'All') query.city = new RegExp('^' + city + '$', 'i');
      return await TourPackageModel.find(query).sort({ createdAt: -1 }).lean();
    } catch (e) {}
  }
  return memoryTours.filter(t => !city || city === 'All' || t.city.toLowerCase() === city.toLowerCase());
}

export async function dbFindTourById(id: string) {
  if (isMongoConnected()) {
    try {
      return await TourPackageModel.findOne({ id }).lean();
    } catch (e) {}
  }
  return memoryTours.find(t => t.id === id) || null;
}

// Traveler Posts
export async function dbSavePost(postData: any) {
  if (isMongoConnected()) {
    try {
      await TravelerPostRequestModel.findOneAndUpdate({ id: postData.id }, postData, { upsert: true, new: true });
    } catch (e) {}
  }
  const idx = memoryPosts.findIndex(p => p.id === postData.id);
  if (idx >= 0) {
    memoryPosts[idx] = { ...memoryPosts[idx], ...postData };
  } else {
    memoryPosts.unshift(postData);
  }
  return postData;
}

export async function dbGetPosts(city?: string, status?: string) {
  if (isMongoConnected()) {
    try {
      const query: any = {};
      if (city && city !== 'All') query.city = new RegExp('^' + city + '$', 'i');
      if (status) query.status = status;
      return await TravelerPostRequestModel.find(query).sort({ createdAt: -1 }).lean();
    } catch (e) {}
  }
  return memoryPosts.filter(p => {
    if (city && city !== 'All' && p.city.toLowerCase() !== city.toLowerCase()) return false;
    if (status && p.status !== status) return false;
    return true;
  });
}

export async function dbFindPostById(id: string) {
  if (isMongoConnected()) {
    try {
      return await TravelerPostRequestModel.findOne({ id }).lean();
    } catch (e) {}
  }
  return memoryPosts.find(p => p.id === id) || null;
}

// Negotiation Offers
export async function dbSaveNegotiation(negData: any) {
  if (isMongoConnected()) {
    try {
      await NegotiationOfferModel.findOneAndUpdate({ id: negData.id }, negData, { upsert: true, new: true });
    } catch (e) {}
  }
  const idx = memoryNegotiations.findIndex(n => n.id === negData.id);
  if (idx >= 0) {
    memoryNegotiations[idx] = { ...memoryNegotiations[idx], ...negData };
  } else {
    memoryNegotiations.unshift(negData);
  }
  return negData;
}

export async function dbFindNegotiationByPostAndGuide(postId: string, guideId: string) {
  if (isMongoConnected()) {
    try {
      return await NegotiationOfferModel.findOne({ postId, guideId }).lean();
    } catch (e) {}
  }
  return memoryNegotiations.find(n => n.postId === postId && n.guideId === guideId) || null;
}

export async function dbFindNegotiationById(id: string) {
  if (isMongoConnected()) {
    try {
      return await NegotiationOfferModel.findOne({ id }).lean();
    } catch (e) {}
  }
  return memoryNegotiations.find(n => n.id === id) || null;
}

export async function dbGetNegotiationsByUser(userId: string) {
  if (isMongoConnected()) {
    try {
      const query = userId === 'all' ? {} : { $or: [{ travelerId: userId }, { guideId: userId }] };
      return await NegotiationOfferModel.find(query).sort({ updatedAt: -1 }).lean();
    } catch (e) {}
  }
  return memoryNegotiations.filter(n => userId === 'all' || n.travelerId === userId || n.guideId === userId);
}

// Bookings
export async function dbSaveBooking(bookingData: any) {
  if (isMongoConnected()) {
    try {
      await TourBookingModel.findOneAndUpdate({ id: bookingData.id }, bookingData, { upsert: true, new: true });
    } catch (e) {}
  }
  const idx = memoryBookings.findIndex(b => b.id === bookingData.id);
  if (idx >= 0) {
    memoryBookings[idx] = { ...memoryBookings[idx], ...bookingData };
  } else {
    memoryBookings.unshift(bookingData);
  }
  return bookingData;
}

export async function dbFindBookingById(id: string) {
  if (isMongoConnected()) {
    try {
      return await TourBookingModel.findOne({ id }).lean();
    } catch (e) {}
  }
  return memoryBookings.find(b => b.id === id) || null;
}

export async function dbGetBookingsByUser(userId: string) {
  if (isMongoConnected()) {
    try {
      const query = userId === 'all' ? {} : { $or: [{ travelerId: userId }, { guideId: userId }] };
      return await TourBookingModel.find(query).sort({ createdAt: -1 }).lean();
    } catch (e) {}
  }
  return memoryBookings.filter(b => userId === 'all' || b.travelerId === userId || b.guideId === userId);
}

export async function dbGetAllBookings() {
  if (isMongoConnected()) {
    try {
      return await TourBookingModel.find({}).lean();
    } catch (e) {}
  }
  return [...memoryBookings];
}

// Chat Messages
export async function dbGetChatMessages(bookingId: string) {
  if (isMongoConnected()) {
    try {
      return await ChatMessageModel.find({ bookingId }).sort({ timestamp: 1 }).lean();
    } catch (e) {}
  }
  return memoryChat.filter(m => m.bookingId === bookingId);
}

export async function dbSaveChatMessage(msgData: any) {
  if (isMongoConnected()) {
    try {
      await ChatMessageModel.findOneAndUpdate({ id: msgData.id }, msgData, { upsert: true, new: true });
    } catch (e) {}
  }
  memoryChat.push(msgData);
  return msgData;
}
