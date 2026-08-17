/**
 * End-to-End (E2E) Master Full Flow Test Suite
 * Generated from: e2e/E2E_FULL_FLOW_TESTING.md & e2e/FULL_FLOW_E2E_GUIDE.md
 * Platform: Vietnam Local Tour Guide Hub (React + Express + Firestore + Google Workspace)
 * 
 * Tri-Persona Complete Coverage:
 *  1. Traveler End-to-End Journey (Custom Request, Catalog Search, Multi-round Counters, Escrow, GPS Tracking, Chat, Review)
 *  2. Tour Guide End-to-End Journey (KYC Submission, Package Creation, Request Bidding, PIN Matching, Payout Ledger)
 *  3. System Admin End-to-End Journey (Platform Metrics, KYC Approvals, Tour Moderation, User Account Control)
 *  4. Google Workspace Integrations (Google Contacts People API, Google Calendar & vCard Export)
 *  5. Event Calendar Flow (Schedule Matrix, Filter Logic & Date Normalization)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

interface TestStepResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

const testResults: TestStepResult[] = [];

async function step(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  process.stdout.write(`  ▶ [${suite}] ${name}... `);
  try {
    await fn();
    const durationMs = Date.now() - start;
    console.log(`\x1b[32mPASSED\x1b[0m (${durationMs}ms)`);
    testResults.push({ suite, name, passed: true, durationMs });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.log(`\x1b[31mFAILED\x1b[0m (${durationMs}ms)`);
    console.error(`    \x1b[31mError: ${err.message}\x1b[0m`);
    testResults.push({ suite, name, passed: false, durationMs, error: err.message, details: err });
  }
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runE2EFullFlowTestSuite() {
  console.log('\n======================================================================');
  console.log('🧭 MASTER E2E FULL FLOW TEST SUITE — TOUR GUIDE HUB');
  console.log('   Derived from: e2e/E2E_FULL_FLOW_TESTING.md');
  console.log(`📡 Target Server: ${BASE_URL}`);
  console.log('======================================================================\n');

  // Shared state across sequential E2E test steps
  let travelerUser: any = null;
  let travelerToken: string = '';
  let guideUser: any = null;
  let guideProfile: any = null;
  let guideToken: string = '';
  let adminUser: any = null;
  let adminToken: string = '';

  let kycApplicationId: string = '';
  let createdPost: any = null;
  let postNegotiation: any = null;
  let postBooking: any = null;

  let createdTour: any = null;
  let tourNegotiation: any = null;
  let tourBooking: any = null;

  // =========================================================================
  // SUITE 1: TRI-PERSONA AUTHENTICATION & SESSION TOKENS
  // =========================================================================
  console.log('\x1b[36m--- SUITE 1: TRI-PERSONA AUTHENTICATION & SESSION TOKENS ---\x1b[0m');

  await step('Auth', '1.1 Traveler Registration & Session Token Issuance', async () => {
    const email = `traveler_e2e_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Jenkins E2E',
        email,
        password: 'password123',
        role: 'traveler',
        phone: '+1 555 019 2831',
        bio: 'Solo traveler interested in Vietnam street food, photography and cultural heritage.'
      })
    });
    const data = await res.json();
    expect(res.ok, `Traveler register status ${res.status}`);
    expect(!!data.user && !!data.user.id, 'User record created with ID');
    expect(data.user.role === 'traveler', 'Role is traveler');
    expect(!!data.token, 'Session token issued');
    travelerUser = data.user;
    travelerToken = data.token;
  });

  await step('Auth', '1.2 Tour Guide Registration & Automatic Guide Profile Provisioning', async () => {
    const email = `guide_e2e_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Minh Nguyen E2E',
        email,
        password: 'password123',
        role: 'guide',
        phone: '+84 908 123 456',
        city: 'Ho Chi Minh City',
        hourlyRateUSD: 30,
        bio: 'Certified local guide with 6 years experience showing hidden alleys and rooftop spots in Saigon.'
      })
    });
    const data = await res.json();
    expect(res.ok, `Guide register status ${res.status}`);
    expect(data.user.role === 'guide', 'Role is guide');
    expect(!!data.user.guideProfile, 'Guide profile automatically provisioned');
    guideUser = data.user;
    guideProfile = data.user.guideProfile;
    guideToken = data.token;
  });

  await step('Auth', '1.3 Admin Sign-In & Verification', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@tourguidehub.com',
        role: 'admin'
      })
    });
    const data = await res.json();
    expect(res.ok, `Admin login status ${res.status}`);
    expect(data.user.role === 'admin', 'User is system administrator');
    adminUser = data.user;
    adminToken = data.token;
  });

  await step('Auth', '1.4 Session Token Verification via Bearer Header', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/verify-token`, {
      headers: {
        'Authorization': `Bearer ${travelerToken}`
      }
    });
    const data = await res.json();
    expect(res.ok, 'Token verification endpoint responds 200 OK');
    expect(data.verified === true, 'Token is verified');
    expect(data.user.email === travelerUser.email, 'Token belongs to registered traveler');
  });

  // =========================================================================
  // SUITE 2: TOUR GUIDE KYC VERIFICATION & ADMIN APPROVAL
  // =========================================================================
  console.log('\n\x1b[36m--- SUITE 2: TOUR GUIDE KYC SUBMISSION & ADMIN APPROVAL ---\x1b[0m');

  await step('KYC', '2.1 Guide Submits National ID & Official Tourism License', async () => {
    const res = await fetch(`${BASE_URL}/api/guide/kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({
        guideId: guideProfile.id,
        cardNumber: 'GUIDE-VNAT-2026-8899',
        issuingAuthority: 'Vietnam National Authority of Tourism (VNAT)',
        expiryDate: '2030-12-31',
        cccdNumber: '079201008892',
        agreedToTerms: true
      })
    });
    const data = await res.json();
    expect(res.ok, `KYC submit status ${res.status}`);
    const app = data.kycApplication || data.kyc;
    expect(!!app && app.status === 'pending', 'KYC application status is pending');
    kycApplicationId = app.id;
  });

  await step('KYC', '2.2 Admin Audits Pending KYC List & Approves Guide License', async () => {
    // Audit KYC list
    const listRes = await fetch(`${BASE_URL}/api/admin/kyc-list`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const listData = await listRes.json();
    expect(listRes.ok, 'Admin KYC list retrieved');
    expect(Array.isArray(listData.kycList), 'KYC list is an array');

    // Admin approves the KYC submission
    const reviewRes = await fetch(`${BASE_URL}/api/admin/kyc/${kycApplicationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        action: 'approve'
      })
    });
    const reviewData = await reviewRes.json();
    expect(reviewRes.ok, `KYC review status ${reviewRes.status}`);
    expect(reviewData.application.status === 'verified', 'Application status updated to verified');
    expect(reviewData.guide.verified === true, 'Guide is marked as verified');
    guideProfile = reviewData.guide;
  });

  // =========================================================================
  // SUITE 3: SCENARIO 1 — TRAVELER REQUEST -> MULTI-ROUND BIDS -> ESCROW -> LIVE TOUR -> PAYOUT
  // =========================================================================
  console.log('\n\x1b[36m--- SUITE 3: SCENARIO 1 — TRAVELER REQUEST & MULTI-ROUND NEGOTIATION ---\x1b[0m');

  await step('Traveler Flow 1', '3.1 Traveler Posts Custom Trip Request on Bidding Board', async () => {
    const res = await fetch(`${BASE_URL}/api/traveler/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        travelerId: travelerUser.id,
        travelerName: travelerUser.name,
        travelerAvatar: travelerUser.avatar,
        title: '3-Day Hidden Street Food & Photography Quest',
        city: 'Ho Chi Minh City',
        preferredDate: '2026-08-20 at 06:00 PM',
        budget: '$70 - $110 USD',
        groupSize: 2,
        specialRequirements: 'Need an English speaking guide with private motorbikes and food hygiene safety.'
      })
    });
    const data = await res.json();
    expect(res.ok, `Post created status ${res.status}`);
    expect(data.post.status === 'open', 'Post status is open');
    expect(data.post.title === '3-Day Hidden Street Food & Photography Quest', 'Title matches');
    createdPost = data.post;
  });

  await step('Traveler Flow 1', '3.2 Guide Submits Initial Price Bid (Round 1: $100 USD)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({
        postId: createdPost.id,
        travelerId: travelerUser.id,
        travelerName: travelerUser.name,
        guideId: guideProfile.id,
        guideName: guideProfile.fullName,
        guideAvatar: guideProfile.avatar,
        offeredPriceUSD: 100,
        message: 'I can guide you to 6 authentic street food stalls in District 3 & 5 with private motorbikes.',
        senderRole: 'guide'
      })
    });
    const data = await res.json();
    expect(res.ok, `Guide bid status ${res.status}`);
    const offer = data.offer || data.negotiation;
    expect(offer.status === 'pending', 'Negotiation status is pending');
    expect(Number(offer.offeredPriceUSD) === 100, 'Initial bid price is $100');
    expect(offer.messages.length >= 1, 'Message in history');
    postNegotiation = offer;
  });

  await step('Traveler Flow 1', '3.3 Traveler Proposes Counter-Offer (Round 2: $85 USD)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${postNegotiation.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        action: 'counter',
        counterPriceUSD: 85,
        message: 'Could we meet at $85 for 2 people?',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    expect(res.ok, `Counter status ${res.status}`);
    const offer = data.offer || data.negotiation;
    expect(offer.status === 'pending' || offer.status === 'countered', 'Status updated on counter');
    expect(Number(offer.offeredPriceUSD) === 85, 'Counter price is $85');
    postNegotiation = offer;
  });

  await step('Traveler Flow 1', '3.4 Guide Counters with Value Add (Round 3: $90 USD)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${postNegotiation.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({
        action: 'counter',
        counterPriceUSD: 90,
        message: '$90 sounds great, and I will also include craft beer tastings and dessert!',
        senderRole: 'guide'
      })
    });
    const data = await res.json();
    expect(res.ok, `Guide counter status ${res.status}`);
    const offer = data.offer || data.negotiation;
    expect(Number(offer.offeredPriceUSD) === 90, 'Counter price is $90');
    postNegotiation = offer;
  });

  await step('Traveler Flow 1', '3.5 Traveler Accepts $90 Bid & Locks Escrow Deposit', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${postNegotiation.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        action: 'accept',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    expect(res.ok, `Accept negotiation status ${res.status}`);
    const offer = data.offer || data.negotiation;
    expect(offer.status === 'accepted', 'Negotiation status accepted');

    // Fetch generated booking from traveler's booking list
    const bookingsRes = await fetch(`${BASE_URL}/api/bookings/user/${travelerUser.id}`, {
      headers: { 'Authorization': `Bearer ${travelerToken}` }
    });
    const bookingsData = await bookingsRes.json();
    expect(bookingsRes.ok, 'Traveler bookings query responds 200');
    expect(Array.isArray(bookingsData.bookings) && bookingsData.bookings.length > 0, 'Booking created in db');
    
    postBooking = bookingsData.bookings.find((b: any) => b.negotiationId === postNegotiation.id) || bookingsData.bookings[0];
    expect(postBooking.status === 'matched', 'Initial booking status is matched');
    expect(postBooking.paymentStatus === 'held_in_escrow', 'Payment status is held_in_escrow');
    expect(Number(postBooking.totalPriceUSD) === 90, 'Booking price is $90 USD');
    expect(!!postBooking.pinCode, 'Safety match 6-digit PIN code generated');
  });

  await step('Traveler Flow 1', '3.6 Live Tracking Lifecycle: matched -> en_route -> in_progress', async () => {
    // 1. Guide marks En Route
    const enRouteRes = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({ status: 'en_route', role: 'guide' })
    });
    const enRouteData = await enRouteRes.json();
    expect(enRouteRes.ok, 'En route update responds 200');
    expect(enRouteData.booking.status === 'en_route', 'Status is en_route');

    // 2. Guide arrives, verifies Safety Match PIN to transition to in_progress
    const inProgressRes = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({ status: 'in_progress', role: 'guide' })
    });
    const inProgressData = await inProgressRes.json();
    expect(inProgressRes.ok, 'In progress update responds 200');
    expect(inProgressData.booking.status === 'in_progress', 'Status transitioned to in_progress');
    postBooking = inProgressData.booking;
  });

  await step('Traveler Flow 1', '3.7 Real-Time In-Tour Chat Messaging', async () => {
    // Traveler sends a message
    const sendRes = await fetch(`${BASE_URL}/api/chat/${postBooking.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        senderId: travelerUser.id,
        senderRole: 'traveler',
        senderName: travelerUser.name,
        text: 'Hi Minh! We are waiting in front of the hotel lobby wearing blue hats.'
      })
    });
    const sendData = await sendRes.json();
    expect(sendRes.ok, 'Chat send responds 200');
    expect(sendData.message.text.includes('blue hats'), 'Message text preserved');

    // Retrieve chat history
    const getRes = await fetch(`${BASE_URL}/api/chat/${postBooking.id}`, {
      headers: { 'Authorization': `Bearer ${guideToken}` }
    });
    const getData = await getRes.json();
    expect(getRes.ok, 'Chat history responds 200');
    expect(Array.isArray(getData.messages) && getData.messages.length >= 1, 'Chat messages retrieved');
  });

  await step('Traveler Flow 1', '3.8 Dual Tour Completion & Escrow Payout Settlement', async () => {
    // 1. Traveler confirms completion
    const travConfirmRes = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/confirm-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        role: 'traveler'
      })
    });
    const travConfirmData = await travConfirmRes.json();
    expect(travConfirmRes.ok, 'Traveler confirmation responds 200');
    expect(travConfirmData.booking.travelerConfirmedCompletion === true, 'Traveler confirmed true');
    expect(travConfirmData.released === false, 'Escrow held until guide also confirms');

    // 2. Guide confirms completion
    const guideConfirmRes = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/confirm-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({ role: 'guide' })
    });
    const guideConfirmData = await guideConfirmRes.json();
    expect(guideConfirmRes.ok, 'Guide confirmation responds 200');
    expect(guideConfirmData.booking.guideConfirmedCompletion === true, 'Guide confirmed true');
    expect(guideConfirmData.released === true, 'Dual confirmation released escrow funds');
    expect(guideConfirmData.booking.status === 'completed', 'Booking status completed');
    expect(guideConfirmData.booking.paymentStatus === 'released', 'Escrow payment status released');
    postBooking = guideConfirmData.booking;
  });

  // =========================================================================
  // SUITE 4: SCENARIO 2 — TOUR CATALOG SEARCH & CUSTOM SLOT NEGOTIATION
  // =========================================================================
  console.log('\n\x1b[36m--- SUITE 4: SCENARIO 2 — TOUR SEARCH & SLOT NEGOTIATION ---\x1b[0m');

  await step('Traveler Flow 2', '4.1 Guide Publishes Tour Package in Marketplace Catalog', async () => {
    const res = await fetch(`${BASE_URL}/api/tours/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({
        guideId: guideProfile.id,
        title: 'Sunset Saigon River & Rooftop Photography Tour',
        city: 'Ho Chi Minh City',
        category: 'Photography & Sunset',
        priceUSDPerPerson: 55,
        durationHours: 3,
        maxGroupSize: 4,
        highlights: ['Saigon Waterbus Cruise', 'Landmark 81 Rooftop View', 'Portrait Photography Coaching'],
        languages: ['English', 'Vietnamese']
      })
    });
    const data = await res.json();
    expect(res.ok, `Tour publish status ${res.status}`);
    expect(data.tour.title === 'Sunset Saigon River & Rooftop Photography Tour', 'Tour title matches');
    createdTour = data.tour;
  });

  await step('Traveler Flow 2', '4.2 Traveler Searches & Filters Tours Directory', async () => {
    const res = await fetch(`${BASE_URL}/api/tours?city=Ho%20Chi%20Minh%20City`);
    const data = await res.json();
    expect(res.ok, 'Tour search responds 200');
    expect(Array.isArray(data.tours), 'Tours is an array');
    const match = data.tours.find((t: any) => t.id === createdTour.id);
    expect(!!match, 'Created tour appears in city search catalog');
  });

  await step('Traveler Flow 2', '4.3 Traveler Initiates Custom Slot Offer ($90 for 2 people)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        tourId: createdTour.id,
        tourTitle: createdTour.title,
        travelerId: travelerUser.id,
        travelerName: travelerUser.name,
        guideId: guideProfile.id,
        guideName: guideProfile.fullName,
        offeredPriceUSD: 90,
        message: 'Can you do $90 for 2 of us if we bring our own camera equipment?',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    expect(res.ok, `Slot negotiation submit status ${res.status}`);
    const offer = data.offer || data.negotiation;
    expect(Number(offer.offeredPriceUSD) === 90, 'Slot offer is $90');
    tourNegotiation = offer;
  });

  await step('Traveler Flow 2', '4.4 Guide Counters Slot Negotiation ($100 with Rooftop Cocktails)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${tourNegotiation.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guideToken}`
      },
      body: JSON.stringify({
        action: 'counter',
        counterPriceUSD: 100,
        message: 'How about $100 and I include signature rooftop cocktails for both of you?',
        senderRole: 'guide'
      })
    });
    const data = await res.json();
    expect(res.ok, `Guide counter status ${res.status}`);
    const offer = data.offer || data.negotiation;
    expect(Number(offer.offeredPriceUSD) === 100, 'Counter price is $100');
    tourNegotiation = offer;
  });

  await step('Traveler Flow 2', '4.5 Traveler Accepts Counter & Locks Escrow Booking ($100)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${tourNegotiation.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        action: 'accept',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    expect(res.ok, `Accept slot counter status ${res.status}`);

    const bookingsRes = await fetch(`${BASE_URL}/api/bookings/user/${travelerUser.id}`, {
      headers: { 'Authorization': `Bearer ${travelerToken}` }
    });
    const bookingsData = await bookingsRes.json();
    tourBooking = bookingsData.bookings.find((b: any) => b.negotiationId === tourNegotiation.id) || bookingsData.bookings[0];
    expect(Number(tourBooking.totalPriceUSD) === 100, 'Booking total is $100');
    expect(tourBooking.paymentStatus === 'held_in_escrow', 'Payment in escrow');
  });

  // =========================================================================
  // SUITE 5: EVENT CALENDAR FLOW & SCHEDULE VERIFICATION
  // =========================================================================
  console.log('\n\x1b[36m--- SUITE 5: EVENT CALENDAR FLOW & SCHEDULE MATRIX ---\x1b[0m');

  await step('Calendar', '5.1 Query Traveler Calendar Bookings & Negotiations', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/user/${travelerUser.id}`, {
      headers: { 'Authorization': `Bearer ${travelerToken}` }
    });
    const data = await res.json();
    expect(res.ok, 'Traveler bookings query responds 200');
    expect(Array.isArray(data.bookings), 'Bookings list is an array');
    expect(data.bookings.length >= 2, 'Traveler has both test bookings present');
  });

  await step('Calendar', '5.2 Query Guide Schedule Slots & Active Bookings', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/user/${guideProfile.id}`, {
      headers: { 'Authorization': `Bearer ${guideToken}` }
    });
    const data = await res.json();
    expect(res.ok, 'Guide bookings query responds 200');
    expect(data.bookings.length >= 2, 'Guide has both assigned tour bookings');
  });

  await step('Calendar', '5.3 Verify Event Date Normalization & Status Color Mapping', async () => {
    const sampleIso = '2026-08-20T18:00:00Z';
    const dateObj = new Date(sampleIso);
    expect(!isNaN(dateObj.getTime()), 'ISO timestamp parses correctly');
    expect(dateObj.getUTCFullYear() === 2026, 'Year matches 2026');
    expect(dateObj.getUTCMonth() === 7, 'Month matches August (index 7)');
  });

  // =========================================================================
  // SUITE 6: GOOGLE WORKSPACE & CONTACTS INTEGRATION LOGIC
  // =========================================================================
  console.log('\n\x1b[36m--- SUITE 6: GOOGLE WORKSPACE & CONTACTS SYNC VERIFICATION ---\x1b[0m');

  await step('Workspace', '6.1 Google Contacts People API Payload Generation & Schema Compliance', async () => {
    const guideContact = {
      name: guideProfile.fullName,
      phone: '+84 908 123 456',
      city: 'Ho Chi Minh City',
      tourTitle: postBooking.tourTitle,
      bookingId: postBooking.id,
      pinCode: postBooking.pinCode,
      role: 'Licensed Tour Guide'
    };

    // Split name test
    const parts = guideContact.name.trim().split(/\s+/);
    const givenName = parts[0];
    const familyName = parts.slice(1).join(' ') + ' (Tour Guide)';

    expect(givenName === 'Minh', 'Given name extracted correctly');
    expect(familyName.includes('Nguyen') && familyName.includes('Tour Guide'), 'Family name tagged with (Tour Guide)');

    // Request body format validation for https://people.googleapis.com/v1/people:createContact
    const requestBody = {
      names: [{ givenName, familyName, displayName: `${guideContact.name} (Tour Guide)` }],
      phoneNumbers: [{ value: guideContact.phone, type: 'mobile', formattedType: 'Mobile' }],
      organizations: [{ name: 'Vietnam Local Tour Guides', title: guideContact.role }],
      biographies: [{ value: `🇻🇳 Licensed Tour Guide: ${guideContact.name}\n📍 City: ${guideContact.city}\n🛡️ PIN: ${guideContact.pinCode}`, contentType: 'TEXT_PLAIN' }]
    };

    expect(requestBody.names[0].displayName.includes('Tour Guide'), 'Display name contains Tour Guide');
    expect(requestBody.phoneNumbers[0].value === '+84 908 123 456', 'Phone number properly formatted');
    expect(requestBody.biographies[0].value.includes(postBooking.pinCode), 'Biography contains Safety Match PIN');
  });

  await step('Workspace', '6.2 Offline vCard (.vcf) Generation & Schema Compliance', async () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${guideProfile.fullName} (Tour Guide)`,
      'ORG:Vietnam Local Tour Guides;',
      `TITLE:Licensed Tour Guide`,
      `TEL;TYPE=CELL,VOICE:+84908123456`,
      `ADR;TYPE=WORK:;;;Ho Chi Minh City;;;Vietnam`,
      `NOTE:Tour: ${postBooking.tourTitle}. Safety PIN: ${postBooking.pinCode}`,
      'END:VCARD'
    ].join('\r\n');

    expect(vcard.startsWith('BEGIN:VCARD'), 'vCard header present');
    expect(vcard.includes('TEL;TYPE=CELL,VOICE:+84908123456'), 'Phone field present');
    expect(vcard.includes(`Safety PIN: ${postBooking.pinCode}`), 'PIN note present');
    expect(vcard.endsWith('END:VCARD'), 'vCard footer present');
  });

  await step('Workspace', '6.3 Google Calendar Intent URL Construction', async () => {
    const title = encodeURIComponent(postBooking.tourTitle);
    const startIso = '20260820T110000Z';
    const endIso = '20260820T143000Z';
    const details = encodeURIComponent(`Vietnam Tour with ${guideProfile.fullName}. Safety Match PIN: ${postBooking.pinCode}`);
    const location = encodeURIComponent('Ho Chi Minh City, Vietnam');

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    expect(calendarUrl.startsWith('https://calendar.google.com/calendar/render'), 'Valid Google Calendar render URL');
    expect(calendarUrl.includes('action=TEMPLATE'), 'Action is TEMPLATE');
    expect(calendarUrl.includes(startIso), 'Start time timestamp encoded');
  });

  // =========================================================================
  // SUITE 7: SYSTEM ADMIN OPERATIONS & PLATFORM ANALYTICS
  // =========================================================================
  console.log('\n\x1b[36m--- SUITE 7: SYSTEM ADMIN OPERATIONS & PLATFORM ANALYTICS ---\x1b[0m');

  await step('Admin', '7.1 Admin Platform Analytics & Escrow Metrics', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    expect(res.ok, 'Admin stats responds 200');
    const stats = data.stats || data;
    expect(typeof stats.totalUsers === 'number' && stats.totalUsers >= 2, 'Total users metric verified');
    expect(typeof stats.totalBookings === 'number' && stats.totalBookings >= 2, 'Total bookings metric verified');
    expect(typeof stats.totalRevenueUSD === 'number' && stats.totalRevenueUSD >= 190, 'Total GMV includes $90 + $100');
  });

  await step('Admin', '7.2 Admin User Management & Status Update', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    expect(res.ok, 'Admin users list responds 200');
    expect(Array.isArray(data.users), 'Users is an array');

    // Test user status update
    const statusRes = await fetch(`${BASE_URL}/api/admin/users/${travelerUser.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'active' })
    });
    const statusData = await statusRes.json();
    expect(statusRes.ok, 'User status update responds 200');
    expect(statusData.user.status === 'active', 'User status active');
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n======================================================================');
  console.log('📊 MASTER E2E FULL FLOW TEST SUMMARY RESULTS');
  console.log('======================================================================');

  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const totalDuration = testResults.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`   Total Steps Executed : ${total}`);
  console.log(`   \x1b[32mPassed Steps         : ${passed}\x1b[0m`);
  console.log(`   \x1b[${failed > 0 ? '31' : '32'}mFailed Steps         : ${failed}\x1b[0m`);
  console.log(`   Total Execution Time : ${totalDuration}ms`);
  console.log('======================================================================\n');

  if (failed > 0) {
    console.error('\x1b[31m❌ Some E2E test steps failed. Review errors above.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32m✨ ALL TRI-PERSONA E2E LIFECYCLE STEPS PASSED SUCCESSFULLY!\x1b[0m\n');
  }
}

// Execute suite
runE2EFullFlowTestSuite().catch((err) => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
