# 🧪 End-to-End (E2E) Full Flow Testing & Architecture Guide
### Tri-Persona (Traveler, Tour Guide & System Admin) Complete User Journeys
**Platform:** Vietnam Local Tour Guide Hub — React + Vite + Express + Firebase Firestore + Google Workspace
**Comprehensive Guide:** See [FULL_FLOW_E2E_GUIDE.md](./FULL_FLOW_E2E_GUIDE.md) for the complete master architectural breakdown.

---

## 📌 Executive Summary & Test Scope

This guide details the complete End-to-End (E2E) verification framework for **Tour Guide Hub**, covering all three roles (**Traveler**, **Tour Guide**, and **System Admin**) across all marketplace workflows:

1. **Authentication & Session Tokens**: Sign up, login, Google OAuth with Firebase, credential verification, and role switching.
2. **Traveler Flow 1 (Custom Request Board)**: Create custom request $\rightarrow$ Multi-round bidding & counters $\rightarrow$ Accept & escrow deposit $\rightarrow$ Start live tracking (`matched` $\rightarrow$ `en_route` $\rightarrow$ `in_progress`) $\rightarrow$ End tour & dual escrow release.
3. **Traveler Flow 2 (Tour Package Search & Negotiation)**: Search directory $\rightarrow$ Custom slot & price negotiation (multi-round) $\rightarrow$ Accept $\rightarrow$ Start tracking $\rightarrow$ End tour.
4. **Google Workspace Sync (Google Contacts & Calendar)**: One-click export to Google Contacts (People API) with guide phone numbers and Google Calendar events.
5. **Event Calendar Flow**: Interactive monthly agenda, filtering confirmed bookings vs. active negotiations, date normalization, and direct Tour Hub launch.
6. **Tour Guide Flow 1 (Package Lifecycle)**: Create tour package $\rightarrow$ Receive traveler slot bids $\rightarrow$ Multi-round counter negotiation $\rightarrow$ Confirm booking $\rightarrow$ Live tour operations.
7. **Tour Guide Flow 2 (Traveler Request Bidding)**: Browse public requests board $\rightarrow$ Place bid $\rightarrow$ Negotiate multi-round terms $\rightarrow$ Win bid $\rightarrow$ Execute tour $\rightarrow$ Escrow payout.
8. **Admin Operations**: System analytics, Tour Guide KYC document approvals, tour listing moderation, and user account management.

---

## ☁️ Database Architecture & Cloud Persistence (Firebase Firestore)

The backend (`server.ts` & `src/db/firebase.ts`) synchronizes all entities with Firebase Firestore:

| Collection | Schema Key Fields | Description |
| :--- | :--- | :--- |
| `users` | `id`, `name`, `email`, `role`, `token`, `guideProfile` | User credentials, session tokens & roles (`traveler`, `guide`, `admin`) |
| `guides` | `id`, `userId`, `fullName`, `city`, `verified`, `kycStatus`, `hourlyRateUSD` | Tour guide verified credentials, ratings & licenses |
| `posts` | `id`, `travelerId`, `title`, `city`, `preferredDate`, `budget`, `status` | Public custom traveler trip requests (`open`, `booked`, `closed`) |
| `tours` | `id`, `guideId`, `title`, `city`, `priceUSDPerPerson`, `durationHours` | Pre-created guide tour catalog packages & slots |
| `negotiations` | `id`, `postId`, `tourId`, `offeredPriceUSD`, `messages`, `status` | Multi-round price & slot negotiations (`pending`, `countered`, `accepted`, `declined`) |
| `bookings` | `id`, `status`, `paymentStatus`, `scheduledTime`, `pinCode`, `escrowHoldTxId` | Confirmed bookings held in escrow (`matched`, `en_route`, `in_progress`, `completed`) |
| `chat` | `id`, `bookingId`, `senderId`, `senderRole`, `text`, `timestamp` | Live in-tour messaging between Traveler and Guide |
| `kyc` | `id`, `guideId`, `cardNumber`, `cccdNumber`, `status` | Guide license and national ID verification records |

---

## 👥 Test Personas & Quick Demo Accounts

| Persona | Name | Email / Login | Role | Default Password |
| :--- | :--- | :--- | :--- | :--- |
| **Traveler** | Sarah Jenkins | `sarah@example.com` | `traveler` | `password123` |
| **Tour Guide** | Minh Nguyen | `minh@example.com` | `guide` | `password123` |
| **Admin** | System Admin | `admin@example.com` | `admin` | `password123` |

*Quick Access*: In the UI, click **Sign In** in the top navigation header and select any profile under **Quick Demo Accounts** for instant login.

---

## 🔄 Detailed Step-by-Step Test Scenarios

```
                                  E2E FULL LIFECYCLE FLOW
                                  
   TRAVELER                                                TOUR GUIDE
   ┌───────────────────────┐                               ┌───────────────────────┐
   │ 1. Sign Up / Log In   │                               │ 1. Sign Up / KYC Auth │
   └──────────┬────────────┘                               └──────────┬────────────┘
              │                                                       │
              ▼                                                       ▼
   ┌───────────────────────┐   Round 1: Initial Guide Bid  ┌───────────────────────┐
   │ 2. Post Trip Request  │ ◄──────────────────────────── │ 2. Bid on Request /   │
   │    or Search Tour     │ ────────────────────────────► │    Create Tour Package│
   └──────────┬────────────┘   Round 2 & 3: Counter-offers └──────────┬────────────┘
              │                                                       │
              ▼                                                       ▼
   ┌───────────────────────┐       Accept Offer            ┌───────────────────────┐
   │ 3. Escrow Deposit     │ ════════════════════════════► │ 3. Confirmed Booking  │
   │    Held in Reserve    │                               │    Slot Reserved      │
   └──────────┬────────────┘                               └──────────┬────────────┘
              │                                                       │
              ▼                                                       ▼
   ┌───────────────────────────────────────────────────────────────────────────────┐
   │ 4. LIVE TOUR HUB & REAL-TIME TRACKING                                         │
   │    [ matched ]  ──►  [ en_route (GPS Map) ]  ──►  [ in_progress (Live Chat) ] │
   └──────────────────────────────────────┬────────────────────────────────────────┘
                                          │
                                          ▼
   ┌───────────────────────────────────────────────────────────────────────────────┐
   │ 5. DUAL COMPLETION & ESCROW PAYOUT                                            │
   │    Traveler Confirms ✓  +  Guide Confirms ✓  ──► Funds Released to Guide ($)  │
   └───────────────────────────────────────────────────────────────────────────────┘
```

---

### 🗺️ Scenario 1: Traveler Flow 1 (Custom Request Board $\rightarrow$ Multi-Round Bidding $\rightarrow$ Tracking $\rightarrow$ End Tour)

#### Step 1.1: Traveler Account Authentication
1. Click **Sign In** in the top header.
2. Select **Sarah Jenkins (Traveler)** or enter `sarah@example.com`.
3. **Verification**:
   - Navigation header shows traveler profile banner.
   - Session token saved in `localStorage` and verified against `/api/auth/verify-token`.

#### Step 1.2: Create Custom Trip Request
1. Open **My Requests & Bids** $\rightarrow$ Click **Post Custom Trip Request 📝**.
2. Input request data:
   - **Title**: `"3-Day Hidden Street Food & Photography Quest"`
   - **Destination**: `Ho Chi Minh City`
   - **Preferred Date**: `"2026-08-20 at 06:00 PM"`
   - **Budget Range**: `$70 - $110 USD`
   - **Group Size**: `2 Travelers`
   - **Requirements**: `"Need an English speaking guide with motorbikes and food safety knowledge."`
3. Click **Post Request**.
4. **Verification**:
   - `POST /api/traveler/posts` responds `200 OK`.
   - Post is added to Firestore `posts` collection with status `open`.

#### Step 1.3: Multi-Round Bidding & Negotiation
1. **Round 1 (Guide Bid)**: Guide Minh Nguyen finds the post and places an initial bid at **$100 USD** with message: *"I can guide you to 6 authentic street food stalls with private motorbikes."*
2. **Round 2 (Traveler Counter)**: Traveler views bid under **Price Bids & Offers** $\rightarrow$ clicks **Counter Offer** $\rightarrow$ proposes **$85 USD** with message: *"Could we meet at $85 for 2 people?"*
3. **Round 3 (Guide Counter with Value Add)**: Guide counters with **$90 USD** and adds: *"$90 sounds great, and I will also include craft beer tastings and dessert!"*
4. **Verification**:
   - Negotiation offer updates in Firestore `negotiations` collection.
   - Status updates sequentially: `pending` $\rightarrow$ `countered` $\rightarrow$ `countered`.
   - Full message history preserves all price points and timestamps.

#### Step 1.4: Accept Bid & Escrow Deposit
1. Traveler clicks **Accept & Book Tour** on the $90 proposal.
2. Fills checkout details (Hotel pickup: *Caravelle Hotel*, Emergency contact: *+1 555 019 2831*).
3. Clicks **Confirm & Pay Escrow Deposit**.
4. **Verification**:
   - `POST /api/negotiations/:id/respond` (`action: accept`) returns `200 OK`.
   - A new booking document is created in Firestore `bookings` collection with:
     - `status: "matched"`
     - `paymentStatus: "held_in_escrow"`
     - `totalPriceUSD: 90`
     - `escrowHoldTxId: "ESCROW_TX_..."`
   - Post status transitions to `booked`, automatically closing other competing bids.

#### Step 1.5: Live Tracking Lifecycle & In-Tour Coordination
1. Click **Open Tour Hub 🚀** on the booking card.
2. **Status Progressions**:
   - Click **En Route 🛵**: Guide GPS marker appears on map navigating towards pickup point.
   - Click **In Progress 🚩**: Tour officially starts; timeline and emergency support activate.
3. **Live Chat**:
   - Switch to **Direct Chat** tab.
   - Send: *"Hi Minh! We are waiting in front of the lobby wearing blue hats."*
   - Verify instant persistence via `POST /api/chat/:bookingId`.

#### Step 1.6: Dual Completion & Escrow Payout
1. Traveler clicks **Confirm Completion ✓** inside Tour Hub.
   - Booking record sets `travelerConfirmedCompletion: true`.
   - Escrow remains `held_in_escrow` pending guide confirmation.
2. Guide clicks **Confirm Completion ✓** on their dashboard.
   - Booking record sets `guideConfirmedCompletion: true`.
   - Condition met: Both parties confirmed $\rightarrow$ `status: "completed"`, `paymentStatus: "released"`.
3. **Verification**:
   - Escrow ledger logs payout release to guide.

---

### 🔍 Scenario 2: Traveler Flow 2 (Tour Search $\rightarrow$ Slot Bidding $\rightarrow$ Accept $\rightarrow$ Tracking $\rightarrow$ End Tour)

#### Step 2.1: Search & Filter Tour Packages
1. Navigate to **Search Created Tours & Negotiate**.
2. Select City: **Ho Chi Minh City**, Category: **Photography & Sunset**.
3. Choose tour card: *"Sunset Saigon River & Rooftop Photography Tour"* ($55/person).

#### Step 2.2: Slot Selection & Custom Price Bidding
1. Click **Select Tour & Negotiate Slot 🤝**.
2. Select slot: `2026-08-25 (16:30 - 19:30)`, Group size: `2 travelers` (Base total: $110).
3. Propose custom offer: **$90 USD** ($45/person) with note: *"Can you do $90 if we bring our own camera gear?"*
4. Click **Send Custom Offer**.

#### Step 2.3: Multi-Round Slot Negotiation
1. Guide reviews offer in **Guide Dashboard** $\rightarrow$ **Active Slot Negotiations**.
2. Guide counters: **$100 USD** with message: *"How about $100 and I include signature rooftop cocktails for both?"*
3. Traveler receives notification $\rightarrow$ clicks **Accept Offer**.

#### Step 2.4: Escrow Booking, Live Hub & Completion
1. Escrow deposit ($100) is locked in platform reserve.
2. Tour Hub launches $\rightarrow$ transitions `matched` $\rightarrow$ `en_route` $\rightarrow$ `in_progress` $\rightarrow$ `completed`.
3. Booking status is verified as `completed` with funds released.

---

### 📅 Scenario 3: Event Calendar Flow

#### Step 3.1: Interactive Monthly Calendar Navigation
1. Click **Event Calendar 📅** tab in the main navigation.
2. Verify month header displays current view (e.g. *August 2026*).
3. Test navigation buttons: Click **Next Month ❯** and **Previous Month ❮**.

#### Step 3.2: Filter Bookings vs. Negotiations
1. Toggle filters:
   - **All Events**: Shows both confirmed bookings and open slot negotiations.
   - **Confirmed Bookings (Green)**: Filters exclusively for booked tours with active escrow.
   - **Active Negotiations (Amber)**: Filters for dates with pending counter-offers.
2. Click any scheduled event pill (e.g. `2026-08-20: $90 Street Food Quest`).
3. **Verification**:
   - Side drawer / detail modal opens with full partner profile, pickup location, group size, and current status badge.

#### Step 3.3: Direct Tour Hub Launch from Calendar
1. On an active booking inside the calendar view, click **Launch Tour Hub 🚀**.
2. Verify Tour Hub opens directly with the selected booking's live GPS route, chat messages, and tracking controls.

---

### 🧑‍💼 Scenario 4: Tour Guide Flows (Create Tour Package & Bid on Traveler Requests)

#### Step 4.1: Guide Authentication & KYC Verification
1. Sign in as **Minh Nguyen (Tour Guide)**.
2. Verify guide status displays **Licensed Guide 📜** & **Verified Guide Card 🔵**.
3. (If new guide account): Submit KYC license card $\rightarrow$ Admin reviews and approves via `/api/admin/kyc/:id/review`.

#### Step 4.2: Create Tour Package (Guide Flow 1)
1. Click **Create Tour Package ➕** in Guide Dashboard.
2. Enter details:
   - **Title**: `"Sunset Saigon River & Rooftop Photography Tour"`
   - **Category**: `"Photography & Sunset"`
   - **Price**: `$55 USD / Person`
   - **Duration**: `3 Hours`
   - **Inclusions**: `["Photo coaching", "Welcome cocktails", "Private transport"]`
3. Click **Publish Tour Package**.
4. **Verification**: Tour appears in public search catalog for travelers.

#### Step 4.3: Bid on Traveler Requests (Guide Flow 2)
1. In Guide Dashboard, click **Traveler Requests Board 📋**.
2. Select an open traveler request (e.g. Sarah's Danang Request).
3. Click **Place Price Bid 💼**.
4. Enter proposed price **$100 USD** and intro message.
5. Click **Send Bid Proposal**.
6. Follow through counter-negotiation rounds until traveler accepts $\rightarrow$ Booking arrives in Guide's active bookings queue.

---

## ⚡ Automated Test Execution

You can run the full automated test suite using the configured npm scripts:

### 1. Standalone Instant API & Persistence Test Runner
Executes all 22 lifecycle steps directly against the server and Firestore database with high-speed deterministic verification:

```bash
npm run test:e2e-api
```

**Sample Output:**
```
=============================================================
🚀 STARTING TOUR GUIDE HUB E2E FULL FLOW TEST SUITE
📡 Target Backend: http://localhost:3000
=============================================================

--- SUITE 1: AUTHENTICATION & ACCOUNT REGISTRATION ---
  ▶ [Auth] 1.1 Traveler Registration & Session Token Generation... PASSED (120ms)
  ▶ [Auth] 1.2 Tour Guide Registration & Automatic Profile Provisioning... PASSED (52ms)
  ▶ [Auth] 1.3 Guide KYC License Submission & Admin Verification Approval... PASSED (133ms)
  ▶ [Auth] 1.4 Session Token Verification via Authorization Header... PASSED (17ms)

--- SUITE 2: TRAVELER REQUEST -> MULTI-ROUND BIDDING -> TRACKING -> END TOUR ---
  ▶ [Traveler Flow 1] 2.1 Traveler Creates Custom Trip Request on Request Board... PASSED (21ms)
  ▶ [Traveler Flow 1] 2.2 Guide Submits Initial Bid (Round 1: $100 USD)... PASSED (80ms)
  ▶ [Traveler Flow 1] 2.3 Traveler Counter-Offers (Round 2: $85 USD)... PASSED (33ms)
  ▶ [Traveler Flow 1] 2.4 Guide Counter-Offers with Value Add (Round 3: $90 USD)... PASSED (48ms)
  ▶ [Traveler Flow 1] 2.5 Traveler Accepts Bid & Generates Escrow Booking ($90)... PASSED (117ms)
  ▶ [Traveler Flow 1] 2.6 Live Tracking Lifecycle: matched -> en_route -> in_progress... PASSED (56ms)
  ▶ [Traveler Flow 1] 2.7 Live Messaging during Active Tour... PASSED (18ms)
  ▶ [Traveler Flow 1] 2.8 Dual Confirmation & End Tour with Escrow Release... PASSED (108ms)

--- SUITE 3: TOUR SEARCH -> SLOT NEGOTIATION -> ACCEPT -> TRACKING -> END TOUR ---
  ▶ [Traveler Flow 2] 3.1 Guide Creates Tour Package in Catalog... PASSED (30ms)
  ▶ [Traveler Flow 2] 3.2 Traveler Searches & Filters Tours in Directory... PASSED (17ms)
  ▶ [Traveler Flow 2] 3.3 Traveler Initiates Custom Slot Offer (Round 1: $45 USD/person)... PASSED (46ms)
  ▶ [Traveler Flow 2] 3.4 Guide Counters Slot Negotiation (Round 2: $100 USD with cocktail upgrade)... PASSED (41ms)
  ▶ [Traveler Flow 2] 3.5 Traveler Accepts Counter & Confirms Escrow Booking ($100)... PASSED (51ms)
  ▶ [Traveler Flow 2] 3.6 Live Tour Hub Tracking & End Tour Completion... PASSED (84ms)

--- SUITE 4: EVENT CALENDAR SYNC & MULTI-VIEW VERIFICATION ---
  ▶ [Calendar Flow] 4.1 Query Traveler Calendar Bookings & Negotiations... PASSED (30ms)
  ▶ [Calendar Flow] 4.2 Query Guide Calendar Schedule Slots & Bookings... PASSED (24ms)
  ▶ [Calendar Flow] 4.3 Verify Calendar Date Normalization & Event Model... PASSED (0ms)

--- SUITE 5: ESCROW LEDGER & REVENUE SUMMARY ---
  ▶ [Escrow & Admin] 5.1 Verify Total Released Funds in Escrow Ledger... PASSED (20ms)

=============================================================
📊 TEST SUMMARY RESULTS
   Total Tests : 22
   Passed      : 22
   Failed      : 0
=============================================================
```

### 2. Browser Playwright E2E Test Suite
Runs headful or headless browser testing simulating clicks, typing, modal overlays, tab switches, and live trackers:

```bash
# Run the complete dual persona full flow Playwright suite
npx playwright test e2e/full-flow-traveler-guide.spec.ts

# Run all test suites
npm run test:e2e-full
```

---

## ✅ Quality Assurance Verification Matrix

| Area | Test Condition | Expected Behavior | Status |
| :--- | :--- | :--- | :---: |
| **Auth** | Sign up with role `traveler` | User profile stored in Firestore `users`, JWT token returned | ✅ PASS |
| **Auth** | Sign up with role `guide` | Guide profile created in Firestore `guides`, KYC unsubmitted | ✅ PASS |
| **KYC** | Guide submits license & CCCD | Status becomes `pending`, admin can approve/reject | ✅ PASS |
| **Bidding** | Multi-round price counters ($100 $\rightarrow$ $85 $\rightarrow$ $90) | History preserved with message trail, timestamps, and roles | ✅ PASS |
| **Escrow** | Traveler accepts bid | Booking created, payment status `held_in_escrow` | ✅ PASS |
| **Tracking** | Status changes (`matched` $\rightarrow$ `en_route` $\rightarrow$ `in_progress`) | Map GPS coordinates and status timeline update reactively | ✅ PASS |
| **Chat** | Traveler/Guide sends in-tour message | Real-time persistence in Firestore `chat` collection | ✅ PASS |
| **Dual Completion** | Single party confirmation | Escrow remains held until second party confirms | ✅ PASS |
| **Dual Completion** | Both parties confirmed | Status `completed`, payment `released`, funds payout logged | ✅ PASS |
| **Calendar** | Relative and ISO date formats (`today`, `tomorrow`, `2026-08-20`) | Correctly normalized to calendar cells with status colors | ✅ PASS |
| **Calendar** | Filter by Confirmed vs Negotiating | Event pills filter dynamically without page reload | ✅ PASS |
