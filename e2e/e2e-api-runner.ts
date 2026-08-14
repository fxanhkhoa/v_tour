/**
 * End-to-End (E2E) Full Flow API & Persistence Test Runner
 * Platform: Tour Guide Hub
 * Tests the complete lifecycle for both Traveler and Tour Guide:
 *  - Sign up / Authentication
 *  - Traveler Flow 1: Create request -> Multi-round bidding -> Accept -> Start tracking -> End tour & Escrow release
 *  - Traveler Flow 2: Tour search -> Multi-round slot negotiation -> Accept -> Start tracking -> End tour
 *  - Event Calendar Flow: Sync, query and verify calendar event matrix
 *  - Tour Guide Flow 1: Create tour package -> Multi-round bidding & acceptance
 *  - Tour Guide Flow 2: Join traveler request -> Counter offer -> Accept -> Execution
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runStep(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  process.stdout.write(`  ▶ [${suite}] ${name}... `);
  try {
    await fn();
    const durationMs = Date.now() - start;
    console.log(`\x1b[32mPASSED\x1b[0m (${durationMs}ms)`);
    results.push({ suite, name, passed: true, durationMs });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.log(`\x1b[31mFAILED\x1b[0m (${durationMs}ms)`);
    console.error(`    \x1b[31mError: ${err.message}\x1b[0m`);
    results.push({ suite, name, passed: false, durationMs, error: err.message, details: err });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function startTests() {
  console.log('\n=============================================================');
  console.log('🚀 STARTING TOUR GUIDE HUB E2E FULL FLOW TEST SUITE');
  console.log(`📡 Target Backend: ${BASE_URL}`);
  console.log('=============================================================\n');

  let travelerUser: any = null;
  let guideUser: any = null;
  let testPost: any = null;
  let testTour: any = null;
  let postNegotiation: any = null;
  let postBooking: any = null;
  let tourNegotiation: any = null;
  let tourBooking: any = null;

  // ==========================================
  // SUITE 1: AUTHENTICATION & USER SETUP
  // ==========================================
  console.log('\x1b[36m--- SUITE 1: AUTHENTICATION & ACCOUNT REGISTRATION ---\x1b[0m');

  await runStep('Auth', '1.1 Traveler Registration & Session Token Generation', async () => {
    const uniqueEmail = `traveler_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Traveler E2E',
        email: uniqueEmail,
        password: 'password123',
        role: 'traveler',
        phone: '+1 555 123 4567',
        bio: 'Avid traveler exploring Southeast Asia'
      })
    });
    const data = await res.json();
    assert(res.ok, `Registration response status: ${res.status}`);
    assert(!!data.user && !!data.user.id, 'User object returned with ID');
    assert(data.user.role === 'traveler', 'User role is traveler');
    assert(!!data.token, 'Session token issued');
    travelerUser = data.user;
  });

  await runStep('Auth', '1.2 Tour Guide Registration & Automatic Profile Provisioning', async () => {
    const uniqueEmail = `guide_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Minh Guide E2E',
        email: uniqueEmail,
        password: 'password123',
        role: 'guide',
        phone: '+84 908 999 888',
        bio: 'Licensed professional guide in Ho Chi Minh City'
      })
    });
    const data = await res.json();
    assert(res.ok, `Guide registration status: ${res.status}`);
    assert(!!data.user && !!data.user.id, 'Guide user returned');
    assert(data.user.role === 'guide', 'Role is guide');
    assert(!!data.user.guideProfile, 'Guide profile object created');
    guideUser = data.user;
  });

  await runStep('Auth', '1.3 Guide KYC License Submission & Admin Verification Approval', async () => {
    // 1. Guide submits KYC
    const kycRes = await fetch(`${BASE_URL}/api/guide/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guideId: guideUser.guideProfile.id,
        cardNumber: '101180293',
        issuingAuthority: 'Vietnam National Authority of Tourism (VNAT)',
        expiryDate: '2030-12-31',
        tourGuideCardUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
        cccdNumber: '079201008892',
        agreedToTerms: true
      })
    });
    const kycData = await kycRes.json();
    assert(kycRes.ok && !!kycData.kycApplication, 'KYC submitted');
    assert(kycData.kycApplication.status === 'pending', 'KYC application pending');

    // 2. Admin reviews and approves KYC
    const approveRes = await fetch(`${BASE_URL}/api/admin/kyc/${kycData.kycApplication.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve'
      })
    });
    const approveData = await approveRes.json();
    assert(approveRes.ok && approveData.application.status === 'verified', 'KYC approved');
    assert(approveData.guide.verified === true, 'Guide is now verified');
    guideUser.guideProfile = approveData.guide;
  });

  await runStep('Auth', '1.4 Session Token Verification via Authorization Header', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/verify-token`, {
      headers: { Authorization: `Bearer ${travelerUser.token}` }
    });
    const data = await res.json();
    assert(res.ok && data.verified === true, 'Token verification succeeded');
    assert(data.user.email === travelerUser.email, 'Token verified for correct user');
  });

  // ==========================================
  // SUITE 2: TRAVELER FLOW 1 (REQUEST -> BIDDING -> TRACKING -> END)
  // ==========================================
  console.log('\n\x1b[36m--- SUITE 2: TRAVELER REQUEST -> MULTI-ROUND BIDDING -> TRACKING -> END TOUR ---\x1b[0m');

  await runStep('Traveler Flow 1', '2.1 Traveler Creates Custom Trip Request on Request Board', async () => {
    const res = await fetch(`${BASE_URL}/api/traveler/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        travelerId: travelerUser.id,
        travelerName: travelerUser.name,
        travelerAvatar: travelerUser.avatar,
        title: 'E2E Full Flow: Street Food & Hidden Alleys Adventure',
        city: 'Ho Chi Minh City',
        preferredDate: '2026-08-20 at 06:00 PM',
        durationHours: 4,
        groupSize: 2,
        minBudgetUSD: 70,
        maxBudgetUSD: 110,
        description: 'Need licensed guide with motorbikes and food safety knowledge.',
        preferredLanguages: ['English', 'Vietnamese']
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.post, 'Post created successfully');
    assert(data.post.status === 'open', 'Post status is open');
    testPost = data.post;
  });

  await runStep('Traveler Flow 1', '2.2 Guide Submits Initial Bid (Round 1: $100 USD)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: testPost.id,
        guideId: guideUser.guideProfile.id,
        travelerId: travelerUser.id,
        travelerName: travelerUser.name,
        offeredPriceUSD: 100,
        originalPriceUSD: 100,
        message: 'Hello! I can guide you through 6 authentic food stops with private motorbikes and helmets.',
        senderRole: 'guide'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.offer, 'Initial guide bid placed');
    assert(data.offer.offeredPriceUSD === 100, 'Price set to $100');
    assert(data.offer.status === 'pending', 'Negotiation status is pending');
    postNegotiation = data.offer;
  });

  await runStep('Traveler Flow 1', '2.3 Traveler Counter-Offers (Round 2: $85 USD)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${postNegotiation.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'counter',
        counterPriceUSD: 85,
        message: 'Could we meet in the middle at $85 for 2 people?',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.offer, 'Traveler counter-offer submitted');
    assert(data.offer.status === 'countered', 'Negotiation status marked as countered');
    assert(data.offer.offeredPriceUSD === 85, 'Offered price updated to $85');
    assert(data.offer.messages.length >= 2, 'Message history has multiple negotiation rounds');
    postNegotiation = data.offer;
  });

  await runStep('Traveler Flow 1', '2.4 Guide Counter-Offers with Value Add (Round 3: $90 USD)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${postNegotiation.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'counter',
        counterPriceUSD: 90,
        message: '$90 sounds great, and I will also include craft beer tastings and dessert at the end!',
        senderRole: 'guide'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.offer, 'Guide round 3 counter submitted');
    assert(data.offer.offeredPriceUSD === 90, 'Price set to $90');
    assert(data.offer.messages.length >= 3, 'Multiple bidding rounds logged');
    postNegotiation = data.offer;
  });

  await runStep('Traveler Flow 1', '2.5 Traveler Accepts Bid & Generates Escrow Booking ($90)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${postNegotiation.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        message: 'Deal accepted! Booking confirmed and escrow deposit paid.',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.booking, 'Booking generated upon acceptance');
    assert(data.offer.status === 'accepted', 'Offer status is accepted');
    assert(data.booking.paymentStatus === 'held_in_escrow', 'Payment is held safely in escrow');
    assert(data.booking.status === 'matched', 'Booking initial state is matched');
    assert(data.booking.totalPriceUSD === 90, 'Booking total matches negotiated price $90');
    postBooking = data.booking;
  });

  await runStep('Traveler Flow 1', '2.6 Live Tracking Lifecycle: matched -> en_route -> in_progress', async () => {
    // Transition to en_route
    let res = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'en_route' })
    });
    let data = await res.json();
    assert(res.ok && data.booking.status === 'en_route', 'Status transitioned to en_route');

    // Transition to in_progress
    res = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    });
    data = await res.json();
    assert(res.ok && data.booking.status === 'in_progress', 'Status transitioned to in_progress');
  });

  await runStep('Traveler Flow 1', '2.7 Live Messaging during Active Tour', async () => {
    const res = await fetch(`${BASE_URL}/api/chat/${postBooking.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: travelerUser.id,
        senderName: travelerUser.name,
        senderRole: 'traveler',
        text: 'Hi Minh, we are waiting right in front of the main hotel lobby!'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.message, 'Chat message persisted');
    assert(data.message.text.includes('main hotel lobby'), 'Message text matches');
  });

  await runStep('Traveler Flow 1', '2.8 Dual Confirmation & End Tour with Escrow Release', async () => {
    // Traveler confirms completion
    let res = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/confirm-completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'traveler' })
    });
    let data = await res.json();
    assert(res.ok && data.booking.travelerConfirmedCompletion === true, 'Traveler confirmed');
    assert(data.released === false, 'Escrow held until guide confirms');

    // Guide confirms completion
    res = await fetch(`${BASE_URL}/api/bookings/${postBooking.id}/confirm-completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'guide' })
    });
    data = await res.json();
    assert(res.ok && data.booking.guideConfirmedCompletion === true, 'Guide confirmed');
    assert(data.released === true, 'Dual acceptance released escrow funds');
    assert(data.booking.status === 'completed', 'Booking marked completed');
    assert(data.booking.paymentStatus === 'released', 'Payment released from escrow');
  });

  // ==========================================
  // SUITE 3: TOUR SEARCH -> BIDDING -> TRACKING -> END TOUR
  // ==========================================
  console.log('\n\x1b[36m--- SUITE 3: TOUR SEARCH -> SLOT NEGOTIATION -> ACCEPT -> TRACKING -> END TOUR ---\x1b[0m');

  await runStep('Traveler Flow 2', '3.1 Guide Creates Tour Package in Catalog', async () => {
    const res = await fetch(`${BASE_URL}/api/tours/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guideId: guideUser.guideProfile.id,
        title: 'E2E Sunset Saigon River & Rooftop Photography Tour',
        city: 'Ho Chi Minh City',
        category: 'Photography & Sunset',
        durationHours: 3,
        priceUSDPerPerson: 55,
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        description: 'Golden hour photography through hidden bridges and sunset rooftop bars.',
        inclusions: ['Photo coaching', 'Welcome cocktails', 'Private transport'],
        itinerarySummary: 'Pickup at 4:30 PM -> Thu Thiem Bridge sunset -> Rooftop drink'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.tour, 'Tour package created');
    assert(data.tour.priceUSDPerPerson === 55, 'Price is $55 per person');
    testTour = data.tour;
  });

  await runStep('Traveler Flow 2', '3.2 Traveler Searches & Filters Tours in Directory', async () => {
    const res = await fetch(`${BASE_URL}/api/tours?city=Ho%20Chi%20Minh%20City`);
    const data = await res.json();
    assert(res.ok && Array.isArray(data.tours), 'Tours returned array');
    const found = data.tours.find((t: any) => t.id === testTour.id);
    assert(!!found, 'Created tour found in city directory');
  });

  await runStep('Traveler Flow 2', '3.3 Traveler Initiates Custom Slot Offer (Round 1: $45 USD/person)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourId: testTour.id,
        tourTitle: testTour.title,
        selectedSlot: {
          id: 'slot_e2e_1',
          dateStr: '2026-08-25',
          startTime: '16:30',
          endTime: '19:30'
        },
        groupSize: 2,
        originalPriceUSD: 110, // 2 * $55
        travelerId: travelerUser.id,
        travelerName: travelerUser.name,
        guideId: guideUser.guideProfile.id,
        offeredPriceUSD: 90, // $45/person * 2
        message: 'Hi! We are 2 people. Can you do $90 total if we bring our own cameras?',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.offer, 'Slot negotiation proposal created');
    assert(data.offer.offeredPriceUSD === 90, 'Offer total $90');
    tourNegotiation = data.offer;
  });

  await runStep('Traveler Flow 2', '3.4 Guide Counters Slot Negotiation (Round 2: $100 USD with cocktail upgrade)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${tourNegotiation.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'counter',
        counterPriceUSD: 100,
        message: 'How about $100 total and I include premium signature cocktails for both of you?',
        senderRole: 'guide'
      })
    });
    const data = await res.json();
    assert(res.ok && data.offer.status === 'countered', 'Guide countered to $100');
    assert(data.offer.offeredPriceUSD === 100, 'Price updated to $100');
    tourNegotiation = data.offer;
  });

  await runStep('Traveler Flow 2', '3.5 Traveler Accepts Counter & Confirms Escrow Booking ($100)', async () => {
    const res = await fetch(`${BASE_URL}/api/negotiations/${tourNegotiation.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        message: 'Sounds fantastic! Booking confirmed at $100.',
        senderRole: 'traveler'
      })
    });
    const data = await res.json();
    assert(res.ok && !!data.booking, 'Booking generated from slot negotiation');
    assert(data.booking.paymentStatus === 'held_in_escrow', 'Escrow held');
    assert(data.booking.totalPriceUSD === 100, 'Booking total is $100');
    tourBooking = data.booking;
  });

  await runStep('Traveler Flow 2', '3.6 Live Tour Hub Tracking & End Tour Completion', async () => {
    // Progress through tracker states
    await fetch(`${BASE_URL}/api/bookings/${tourBooking.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'en_route' })
    });

    await fetch(`${BASE_URL}/api/bookings/${tourBooking.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    });

    // Complete tour directly via Hub API
    const res = await fetch(`${BASE_URL}/api/bookings/${tourBooking.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    const data = await res.json();
    assert(res.ok && data.booking.status === 'completed', 'Tour completed');
    assert(data.booking.paymentStatus === 'released', 'Escrow released upon completion');
  });

  // ==========================================
  // SUITE 4: EVENT CALENDAR FLOW
  // ==========================================
  console.log('\n\x1b[36m--- SUITE 4: EVENT CALENDAR SYNC & MULTI-VIEW VERIFICATION ---\x1b[0m');

  await runStep('Calendar Flow', '4.1 Query Traveler Calendar Bookings & Negotiations', async () => {
    const [bRes, nRes] = await Promise.all([
      fetch(`${BASE_URL}/api/bookings/user/${travelerUser.id}`),
      fetch(`${BASE_URL}/api/negotiations/user/${travelerUser.id}`)
    ]);
    const bData = await bRes.json();
    const nData = await nRes.json();

    assert(bRes.ok && Array.isArray(bData.bookings), 'Bookings retrieved');
    assert(nRes.ok && Array.isArray(nData.negotiations), 'Negotiations retrieved');
    assert(bData.bookings.length >= 2, 'Calendar includes both created test bookings');
  });

  await runStep('Calendar Flow', '4.2 Query Guide Calendar Schedule Slots & Bookings', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/user/${guideUser.guideProfile.id}`);
    const data = await res.json();
    assert(res.ok && Array.isArray(data.bookings), 'Guide bookings retrieved');
    const guideTourBooking = data.bookings.find((b: any) => b.id === tourBooking.id);
    assert(!!guideTourBooking, 'Guide calendar includes the photography tour booking');
  });

  await runStep('Calendar Flow', '4.3 Verify Calendar Date Normalization & Event Model', async () => {
    const b = postBooking;
    assert(!!b.scheduledTime, 'Booking has valid scheduled time for calendar');
    assert(!!b.tourTitle, 'Booking has display title for calendar pill');
    assert(!!b.status, 'Booking has status for calendar styling');
  });

  // ==========================================
  // SUITE 5: ESCROW & ADMIN LEDGER VERIFICATION
  // ==========================================
  console.log('\n\x1b[36m--- SUITE 5: ESCROW LEDGER & REVENUE SUMMARY ---\x1b[0m');

  await runStep('Escrow & Admin', '5.1 Verify Total Released Funds in Escrow Ledger', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/escrow-summary`);
    const data = await res.json();
    assert(res.ok, 'Escrow summary endpoint returned 200');
    assert(typeof data.totalReleasedUSD === 'number', 'totalReleasedUSD is a number');
    assert(data.totalReleasedUSD >= 190, 'Both $90 and $100 test tours accounted for in released funds');
    assert(data.totalBookings >= 2, 'Total bookings count verified');
  });

  // ==========================================
  // SUMMARY REPORT
  // ==========================================
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log('\n=============================================================');
  console.log('📊 TEST SUMMARY RESULTS');
  console.log(`   Total Tests : ${total}`);
  console.log(`   \x1b[32mPassed      : ${passed}\x1b[0m`);
  console.log(`   \x1b[${failed > 0 ? '31' : '32'}mFailed      : ${failed}\x1b[0m`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

startTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
