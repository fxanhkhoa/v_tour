# 🧭 Full-Flow End-to-End (E2E) Architecture & Testing Specification
### Comprehensive User Journeys for Traveler, Tour Guide, and Admin
**Platform:** Vietnam Local Tour Guide & Traveler Network  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Express (Node.js) + Firebase Firestore + Google GenAI + Google People API (Contacts) + Google Calendar

---

## 📋 Table of Contents
1. [System Architecture & Data Model](#1-system-architecture--data-model)
2. [Test Personas & Quick Access Accounts](#2-test-personas--quick-access-accounts)
3. [Full-Flow E2E Matrix Diagram](#3-full-flow-e2e-matrix-diagram)
4. [Role 1: Traveler End-to-End Journey](#4-role-1-traveler-end-to-end-journey)
   - 4.1 Account Creation & Google Sign-In
   - 4.2 AI-Powered Tour Itinerary Generation
   - 4.3 Custom Trip Request Creation & Bidding Board
   - 4.4 Tour Catalog Discovery & Custom Offer Negotiation
   - 4.5 Escrow Booking Deposit & Confirmation
   - 4.6 Google Contacts Sync (Save Guide Phone Number)
   - 4.7 Google Calendar & iCal Export
   - 4.8 Live Tour Execution (GPS Tracking, Chat, Safety PIN & Video Room)
   - 4.9 Tour Completion, Review & Escrow Settlement
5. [Role 2: Tour Guide End-to-End Journey](#5-role-2-tour-guide-end-to-end-journey)
   - 5.1 Registration & KYC License Submission
   - 5.2 Banking & Payout Account Setup
   - 5.3 Creating & Managing Tour Packages
   - 5.4 Bidding on Traveler Custom Requests
   - 5.5 Managing Incoming Negotiations & Multi-Round Counter Offers
   - 5.6 Operating the Live Tour & Safety PIN Verification
   - 5.7 Tour Completion Confirmation & Escrow Payouts
6. [Role 3: System Admin End-to-End Journey](#6-role-3-system-admin-end-to-end-journey)
   - 6.1 Platform Analytics & Financial Metrics
   - 6.2 Tour Guide KYC Verification & Document Approval
   - 6.3 Tour Package Content Moderation
   - 6.4 User Account Management & Moderation
   - 6.5 Database Reset & Seed Operations
7. [Escrow Financial Safety Mechanics](#7-escrow-financial-safety-mechanics)
8. [Google Workspace & Integration Architecture](#8-google-workspace--integration-architecture)
9. [E2E Quality Assurance Checklist](#9-e2e-quality-assurance-checklist)

---

## 1. System Architecture & Data Model

The application operates as a full-stack marketplace connecting international and domestic travelers with verified, licensed Vietnamese tour guides under an escrow protection model.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND (SPA)                            │
│  ├── Modules: /traveler, /guide, /admin                                     │
│  ├── Components: TourBookingHub, AddToGoogleContacts, CalendarPicker        │
│  └── Integrations: Google People API (Contacts), Google Calendar (.ics)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST APIs /api/*
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                             EXPRESS BACKEND SERVER                          │
│  ├── Auth & Session Middleware (Google OAuth + Firebase Auth)                │
│  ├── Escrow & Negotiation Engine (Multi-round counters, PIN generation)     │
│  ├── Real-time In-App Notification Hub & Chat Controller                    │
│  └── Google Gemini 2.5 Flash Client (AI Tour Planner)                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Persistence
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                      FIREBASE FIRESTORE DATA COLLECTIONS                     │
│  ├── `users`        - User profiles, roles, avatars, auth tokens            │
│  ├── `guides`       - Guide badges, verification status, languages, bios   │
│  ├── `kyc`          - National ID (CCCD), tour guide license scans         │
│  ├── `posts`        - Traveler custom trip requests & budget targets        │
│  ├── `tours`        - Published tour packages, schedules, tiered pricing    │
│  ├── `negotiations` - Multi-round bid & counter histories                   │
│  ├── `bookings`     - Escrow-held bookings, GPS coords, 6-digit match PINs  │
│  ├── `chat`         - Live message threads between matched parties          │
│  └── `notifications`- In-app instant activity alerts & status changes       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Test Personas & Quick Access Accounts

The platform includes pre-seeded demonstration accounts for rapid testing without manual registration:

| Persona | Name | Email | Role | Verification Status | Key Characteristics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Traveler** | Sarah Jenkins | `sarah@example.com` | `traveler` | Verified Email | Solo traveler looking for authentic food & culture tours |
| **Tour Guide** | Minh Nguyen | `minh@example.com` | `guide` | `approved` (Licensed) | English/Vietnamese guide in Ho Chi Minh City, 5★ rating |
| **Tour Guide (Pending)** | Le Van Hoang | `hoang@example.com` | `guide` | `pending` KYC | New applicant awaiting admin license verification |
| **Admin** | System Administrator | `admin@example.com` | `admin` | Full SuperAdmin | Platform operator with KYC, moderation & ledger control |

*Quick Login:* Click **Sign In** on the top navigation bar and select any profile under **Quick Demo Accounts** for instant authentication.

---

## 3. Full-Flow E2E Matrix Diagram

```
========================================================================================================================
TRAVELER JOURNEY                          TOUR GUIDE JOURNEY                            ADMIN JOURNEY
========================================================================================================================

[1] Post Custom Request / Browse Tours
        │
        ├── (Option A) Post Trip Request ─────► [1] Receive Request Notification
        │                                             │
        │                                             ├─► Submit Price Bid ($)
        │                                             │
        │◄── (Option B) Search Guide Catalog ─────────┴─► [2] Publish Tour Package & Slots
        │
[2] Multi-Round Negotiation & Chat
        │
        ├── Propose Counter-Offer ($) ────────► Review Counter & Update Terms
        │                                             │
        ◄── Receive Guide Counter-Offer ──────────────┘
        │
[3] Accept Offer & Deposit Escrow
        │
        ├── Funds Locked in Escrow ───────────► Booking Confirmed Slot
        │                                             │
[4] Workspace Integrations                            │
        │                                             │
        ├── Save Guide to Google Contacts ────────────┤
        ├── Add to Google Calendar / .ics ────────────┤
        │                                             │
[5] Live Tour Execution                               │
        │                                             │
        ├── Track Guide via GPS Radar ◄───────────────┼─► Update Status: "En Route"
        ├── Chat & Video Call Room ◄──────────────────┼─► In-Tour Messaging
        └── Meet & Exchange 6-Digit Safety PIN ◄──────┼─► Input Traveler PIN: "In Progress"
                                                      │
[6] Tour Conclusion & Financial Release               │
        │                                             │
        ├── Confirm Completed ✓ ──────────────────────┼─► Confirm Tour Finished ✓
        │                                             │         │
        ├── Submit 5★ Rating & Review                 ▼         ▼
        │                                      [3] Escrow Balance Released to Ledger
        │                                             │
        │                                             ├─► Request Bank/PayPal Payout
        │                                             │
        ▼                                             ▼         ▼
========================================================================================================================
                                                       [4] Admin Audits Logs, KYC & Payouts
========================================================================================================================
```

---

## 4. Role 1: Traveler End-to-End Journey

### 4.1 Account Creation & Google Sign-In
1. Navigate to the top navigation header and click **Sign In / Đăng nhập**.
2. **Standard Email Login / Registration**:
   - Toggle to **Sign Up**, select role **Traveler**, enter full name, email, and password.
   - Click **Create Account**.
3. **Google Sign-In Option**:
   - Click **Continue with Google**.
   - Authenticates via Google OAuth / Firebase Auth popup and issues an authenticated session token.
4. **Verification Point**:
   - Header displays the traveler avatar, name, and role badge (`Traveler`).
   - Browser receives authenticated token stored in memory & session.

### 4.2 AI-Powered Tour Itinerary Generation
1. In the Traveler Dashboard, click **AI Tour Planner ✨**.
2. Select destination (e.g. *Hanoi, Da Nang, Ho Chi Minh City*), duration in days, travel style (*Street Food, Historical, Adventure, Hidden Gems*), and budget level.
3. Click **Generate Smart Itinerary**.
4. The system queries Google Gemini 2.5 Flash to synthesize a customized day-by-day itinerary with recommended tour guide slots.
5. Click **Convert into Custom Trip Request** to autofill the request form with the AI recommendations.

### 4.3 Custom Trip Request Creation & Bidding Board
1. In the Traveler Dashboard, open **My Requests & Bids** and click **Post Custom Trip Request 📝**.
2. Enter trip specifications:
   - **Trip Title**: `3-Day Hidden Street Food & Photography Quest`
   - **Destination**: `Ho Chi Minh City`
   - **Preferred Date & Time**: `2026-08-20 at 06:00 PM`
   - **Target Budget**: `$85 USD`
   - **Group Size**: `2 Travelers`
   - **Special Requirements**: `English speaking guide, vegetarian friendly food stops.`
3. Click **Publish Trip Request**.
4. **Verification Point**:
   - Post status becomes `open` with `0 Bids`.
   - Post is broadcasted to all certified guides in Ho Chi Minh City.

### 4.4 Tour Catalog Discovery & Custom Offer Negotiation
1. Open **Explore Tours & Guides** to browse verified listings.
2. Filter by City, Maximum Price, Language (*English, French, Japanese*), or Category (*Street Food, History, Nature*).
3. Click on a Tour Card (e.g. *Saigon Midnight Scooter & Street Food Odyssey*).
4. Click **Negotiate Custom Offer / Book Slot**:
   - Pick an available date/time slot or enter custom timing.
   - Propose an initial custom price (e.g., offer `$55 USD` for a listed `$65 USD` tour).
   - Enter negotiation message: *"Can we customize the route to visit District 5 Chinatown?"*
5. Click **Send Offer to Guide**.
6. **Multi-Round Counter Negotiations**:
   - When the guide counters with `$60 USD`, the traveler receives an in-app notification.
   - Click **Negotiation History** to review the complete audit trail and price history.
   - The traveler can either:
     - Accept the counter-offer directly.
     - Propose a secondary counter-offer (e.g., `$58 USD`).
     - Decline and close the negotiation.

### 4.5 Escrow Booking Deposit & Confirmation
1. Once a price is agreed upon, click **Accept & Deposit Escrow**.
2. Review the **Mock Payment Gateway & Escrow Shield**:
   - Total Amount: `$60.00 USD` (100% held in safe escrow).
   - 0% risk guarantee — funds are never released to the guide until the traveler finishes the tour.
3. Select payment method (*Credit/Debit Card, MoMo E-Wallet, VNPay, PayPal*) and click **Authorize Escrow Hold**.
4. **Verification Point**:
   - Booking record created with initial status `matched`.
   - 6-Digit Safety Match PIN generated (e.g. `784920`).
   - Traveler's Spending Dashboard updates total committed escrow.

### 4.6 Google Contacts Sync (Save Guide Phone Number)
1. In the **Tour Booking Hub** or **My Bookings** card, locate the **Save to Google Contacts** button.
2. Click **Save to Google Contacts**:
   - An explicit confirmation modal opens, detailing the Guide's Name, Phone Number, Operating City, and Tour Reference.
   - Click **Confirm & Save Contact**.
   - The system calls the Google People API (`POST https://people.googleapis.com/v1/people:createContact`) with scope `https://www.googleapis.com/auth/contacts`.
3. **Alternative**: Click **Download .vcf** to download the offline vCard contact card for iOS/Android address book import.
4. **Verification Point**:
   - Success toast appears: *"Saved to Google Contacts!"*.
   - Guide's mobile phone number is directly accessible in the traveler's contacts list.

### 4.7 Google Calendar & iCal Export
1. On any confirmed booking or accepted negotiation, click **Add to Google Calendar**.
2. **Options provided**:
   - **Google Calendar Intent**: Opens Google Calendar web interface with pre-filled title, UTC timestamps, pickup location, safety PIN, and tour itinerary.
   - **Download .ICS File**: Downloads standard iCalendar event file.
3. **Verification Point**:
   - The event appears in the traveler's calendar with reminder alarms set for 1 hour prior to tour departure.

### 4.8 Live Tour Execution (GPS Tracking, Chat, Safety PIN & Video Room)
1. Click **Open Live Tour Hub** on the booking card.
2. **Phase 1: `matched`**
   - Traveler views the guide's contact info, safety PIN, pickup coordinates, and packing checklist.
3. **Phase 2: `en_route`**
   - The guide triggers "On My Way".
   - The interactive GPS radar displays the guide's simulated vehicle approaching the pickup landmark in real-time with estimated arrival time (ETA).
4. **Phase 3: `in_progress` (Safety Verification)**
   - Traveler meets the guide and provides the **6-digit Safety Match PIN**.
   - Guide validates the PIN on their terminal to unlock the active tour mode.
5. **In-Tour Tools**:
   - **Live Messaging**: Traveler and guide exchange text and image coordinates.
   - **Video Call Room**: Traveler can launch a browser WebRTC video/audio call with the guide.
   - **Emergency SOS & Support**: Quick access to tourist police hotline (`113`) and platform emergency desk.

### 4.9 Tour Completion, Review & Escrow Settlement
1. At the conclusion of the tour, the traveler clicks **Mark Tour Completed & Release Escrow**.
2. A confirmation prompt confirms the successful execution of the tour.
3. Once both parties confirm completion, the escrow funds are automatically cleared for guide payout.
4. The traveler submits a **5-Star Review & Feedback**:
   - Star Rating (1 to 5 stars).
   - Review text: *"Minh was an extraordinary guide! He took us to authentic local spots we never would have found on our own."*
5. Click **Submit Review & Close Tour**.

---

## 5. Role 2: Tour Guide End-to-End Journey

### 5.1 Registration & KYC License Submission
1. Click **Sign In**, select **Sign Up**, choose role **Tour Guide**, and register.
2. Upon first login, the guide is presented with the **KYC Verification Banner** (Status: `pending`).
3. Click **Submit KYC Verification**:
   - **Full Legal Name**: `Nguyen Van Minh`
   - **National ID / CCCD Number**: `079094001234`
   - **Tour Guide License Number**: `GUIDE-VNAT-2024-8899`
   - **Issuing Authority**: `Vietnam National Administration of Tourism (VNAT)`
   - **Operating Cities**: `Ho Chi Minh City, Mekong Delta`
   - **Spoken Languages**: `English (Fluent), Vietnamese (Native), French (Conversational)`
   - **Document Scans**: Upload front/back photos of National ID and Official Guide Card.
4. Click **Submit for Admin Review**.
5. *Once approved by the Admin, the guide receives the Verified Badge (🛡️ Verified Guide).*

### 5.2 Banking & Payout Account Setup
1. In the Guide Dashboard, open **Payouts & Banking** $\rightarrow$ Click **Configure Payout Account**.
2. Select payout method:
   - **Vietnam Domestic Bank (NAPAS / VietQR)**:
     - Bank Name: *Vietcombank / Techcombank / MB Bank / BIDV*
     - Account Number: `0071001234567`
     - Account Holder Name: `NGUYEN VAN MINH`
   - **International PayPal / Wise**:
     - PayPal Email: `minh.guide@example.com`
3. Click **Save Payout Settings**.
4. **Verification Point**:
   - VietQR code is automatically generated for instant electronic reconciliation.

### 5.3 Creating & Managing Tour Packages
1. Open the **Tour Catalog Manager** $\rightarrow$ Click **Create New Tour Package +**.
2. Enter tour details:
   - **Tour Title**: `Saigon Secret Alleys & Coffee Culture Walk`
   - **Destination City**: `Ho Chi Minh City`
   - **Category**: `Cultural / Coffee Tour`
   - **Base Price per Person**: `$45 USD`
   - **Duration**: `4.5 Hours`
   - **Max Group Size**: `6 People`
   - **Included Highlights**: `Specialty Egg Coffee, French Colonial Architecture, Antique Market.`
   - **Availability Slots**: Set morning slot (`08:30 AM - 01:00 PM`) and afternoon slot (`02:00 PM - 06:30 PM`).
3. Upload cover photos and image gallery.
4. Click **Publish Tour to Marketplace**.

### 5.4 Bidding on Traveler Custom Requests
1. Navigate to **Browse Traveler Requests Board**.
2. Filter open posts by City (*Ho Chi Minh City*).
3. Find Sarah's post: *"3-Day Hidden Street Food & Photography Quest" (Budget: $85 USD)*.
4. Click **Submit Proposal / Place Bid**:
   - Offer Price: `$80 USD`
   - Proposal Note: *"Hello Sarah! I am a licensed guide with 6 years experience in Saigon food culture. I have my own motorbike and professional camera to take photos of your trip."*
5. Click **Submit Bid Proposal**.
6. **Verification Point**:
   - Bid appears on the traveler's post; traveler receives an instant push/in-app alert.

### 5.5 Managing Incoming Negotiations & Multi-Round Counter Offers
1. Open **Active Negotiations & Bookings** tab.
2. Review active bids:
   - View traveler counters and proposed customized schedules.
3. Actions available to the guide:
   - **Accept Offer**: Finalizes terms and requests traveler deposit.
   - **Send Counter-Offer**: Adjust price (e.g., counter with `$75 USD`) and add revised schedule terms.
   - **Decline Offer**: Closes negotiation thread with polite reason.

### 5.6 Operating the Live Tour & Safety PIN Verification
1. On the scheduled tour date, open **Tour Operations Hub** for the confirmed booking.
2. **Step 1: Depart for Pickup**:
   - Click **Start Trip (En Route)**.
   - System updates status to `en_route` and initiates GPS beacon sharing with traveler.
3. **Step 2: Meet & Verify**:
   - Upon arriving at the designated meeting point, guide requests the **6-digit Safety Match PIN** from the traveler.
   - Guide enters PIN `784920` into the verification field and clicks **Validate & Start Tour**.
   - System confirms match and transitions status to `in_progress`.
4. **Step 3: Conduct Guided Tour**:
   - Utilize live in-app chat for landmark coordinates and itinerary stops.

### 5.7 Tour Completion Confirmation & Escrow Payouts
1. When the tour concludes, the guide clicks **Mark Tour Completed**.
2. Once the dual confirmation is met, the backend executes:
   - Status changes to `completed`.
   - Net payout amount (`$80.00 USD` minus platform fee) is credited to the **Guide Available Balance**.
3. In **Payouts & Earnings Ledger**:
   - Guide clicks **Request Withdrawal / Payout**.
   - System creates payout transaction record `#PAY-2026-XXXX`.
   - Funds are scheduled for transfer to the guide's configured Vietcombank or PayPal account.

---

## 6. Role 3: System Admin End-to-End Journey

### 6.1 Platform Analytics & Financial Metrics
1. Log in with `admin@example.com`.
2. Access the **SuperAdmin Control Center** (`/admin`).
3. View real-time KPI overview cards:
   - **Total Registered Users**: Breakdown of Travelers vs. Guides vs. Admins.
   - **Active Tour Guides**: Count of verified vs. unverified guides.
   - **Pending KYC Submissions**: Real-time counter of unreviewed guide credentials.
   - **Total Active Bookings**: Count of `matched`, `en_route`, and `in_progress` tours.
   - **Gross Merchandise Value (GMV)**: Total USD processed through escrow.
   - **Current Escrow Reserve**: Total funds currently held in protection vault.

### 6.2 Tour Guide KYC Verification & Document Approval
1. Open the **KYC Verification & Approval Hub** (`/admin/kyc`).
2. Review list of pending applications (e.g. *Le Van Hoang*).
3. Click **Inspect Application**:
   - High-resolution modal displays National ID (CCCD), Card Number, Full Legal Name, Guide License ID, and Issuing Authority.
4. **Admin Decisions**:
   - **Approve & Certify Guide**:
     - Clicks **Approve Application**.
     - Guide's profile is updated to `verified = true`, `kycStatus = 'approved'`.
     - Guide is immediately unlocked to create tours and bid on traveler posts.
   - **Reject / Request Additional Documents**:
     - Enters specific reason (e.g., *"License photo is blurry. Please upload clear scan of back page."*).
     - Guide receives notification to resubmit documents.

### 6.3 Tour Package Content Moderation
1. Navigate to **Tour Catalog Moderation** (`/admin/tours`).
2. Inspect published tours across all cities.
3. Actions:
   - **Feature Tour**: Highlights top-rated tours on the platform homepage hero carousel.
   - **Suspend / Unpublish Tour**: Temporarily pauses tours that violate safety guidelines or community standards.
   - **Price Outlier Audit**: Flags unusually high or low pricing for investigation.

### 6.4 User Account Management & Moderation
1. Navigate to **User Management** (`/admin/users`).
2. Search and filter users by Name, Email, or Role.
3. Actions available:
   - **Change Role**: Upgrade traveler to guide, or appoint co-administrators.
   - **Suspend / Ban Account**: Restrict malicious actors or fraudulent accounts.
   - **Reset Password / Session**: Invalidate active tokens for compromised accounts.

### 6.5 Database Reset & Seed Operations
1. In the Admin settings tab, locate **System Diagnostics & Seed Tools**.
2. Click **Reset & Reseed Demonstration Database**:
   - Reinitializes clean test data for Sarah Jenkins (Traveler), Minh Nguyen (Guide), and Le Van Hoang (Pending Guide).
   - Recreates initial sample bookings, custom posts, and active negotiations.

---

## 7. Escrow Financial Safety Mechanics

The platform incorporates an Escrow Protection Framework to prevent fraud and guarantee safety for both parties:

```
[ TRAVELER ]                                          [ ESCROW HOLD VAULT ]                                     [ TOUR GUIDE ]
     │                                                         │                                                      │
     ├── 1. Authorized Deposit ($60.00) ──────────────────────►│                                                      │
     │      (Card / MoMo / VNPay)                              │                                                      │
     │                                                         │── Funds locked in Escrow ──┐                         │
     │                                                         │   (Protected Reserve)      │                         │
     │                                                         │◄───────────────────────────┘                         │
     │                                                         │                                                      │
     ├── 2. Live Tour Execution ───────────────────────────────┼─────────────────────────────────────────────────────►│
     │      (Safety PIN Verified)                              │                                                      │
     │                                                         │                                                      │
     ├── 3. Traveler Confirms Completion ─────────────────────►│                                                      │
     │                                                         │                                                      │
     │                                                         │◄── 4. Guide Confirms Completion ─────────────────────┤
     │                                                         │                                                      │
     │                                                         ├── 5. Dual Verification Match ──┐                     │
     │                                                         │                                │                     │
     │                                                         │◄───────────────────────────────┘                     │
     │                                                         │                                                      │
     │                                                         │──── 6. Release Net Payout ($54.00) ─────────────────►│
     │                                                         │     (90% to Guide Ledger, 10% Platform Fee)          │
     ▼                                                         ▼                                                      ▼
```

### Escrow State Machine Rules:
1. **`held`**: Traveler funds are authorized and sequestered in the escrow vault upon booking agreement.
2. **`disputed`**: If either party files an emergency dispute or fails to show up, the funds remain frozen while an Admin reviews chat logs and GPS audit breadcrumbs.
3. **`refunded`**: If the guide cancels before the tour commences, 100% of the funds are refunded to the traveler.
4. **`released`**: Funds are only released to the guide when **both** traveler and guide mark the tour as complete.

---

## 8. Google Workspace & Integration Architecture

### 8.1 Google Contacts (People API)
- **Endpoint**: `https://people.googleapis.com/v1/people:createContact`
- **Scope**: `https://www.googleapis.com/auth/contacts`
- **Payload Schema**:
  - `names`: Given name, Family name with `(Tour Guide)` tag.
  - `phoneNumbers`: Guide's verified contact phone number formatted for international dialing (`+84 ...`).
  - `organizations`: `Vietnam Local Tour Guides`, Title: `Licensed Tour Guide`.
  - `biographies`: Notes containing operating city, tour title, booking reference, and safety PIN.
- **Security Compliance**:
  - In-memory token management only (never persisted in `localStorage` or `sessionStorage`).
  - Mandatory explicit confirmation modal before writing any contact to user account.
  - Offline `.vcf` vCard download option provided for maximum accessibility.

### 8.2 Google Calendar (.ICS & URL Intents)
- **Direct Web Intent**: `https://calendar.google.com/calendar/render?action=TEMPLATE...`
- **Payload Parameters**:
  - `text`: Tour Title & Guide Name.
  - `dates`: ISO UTC formatted start/end timestamps.
  - `details`: Comprehensive tour summary, safety match PIN, pricing breakdown, and pickup instructions.
  - `location`: Exact pickup address/city in Vietnam.
- **iCalendar Engine**: Generates RFC-5545 compliant `.ics` calendar files for Apple Calendar, Outlook, and Android devices.

---

## 9. E2E Quality Assurance Checklist

| Module | Test Case | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Auth** | Google OAuth & Demo Login | Successful token issue, correct role landing page redirect | ✅ PASS |
| **AI Planner** | Gemini 2.5 Flash Itinerary | Generates structured multi-day itinerary with budget estimates | ✅ PASS |
| **Bidding** | Traveler Custom Post | Post visible to guides in matching city; bids counter increments | ✅ PASS |
| **Negotiation** | Multi-Round Counter Offers | Both parties can propose counter prices; full history audit log | ✅ PASS |
| **Escrow** | Deposit Authorization | Funds locked; booking created with initial status `matched` | ✅ PASS |
| **Contacts** | Google Contacts Sync | Creates contact in Google People API after explicit confirmation | ✅ PASS |
| **Calendar** | Google Calendar / .ics | Event generated with correct UTC offset and safety PIN in notes | ✅ PASS |
| **Live GPS** | Status Progression | Transitions `matched` $\rightarrow$ `en_route` $\rightarrow$ `in_progress` $\rightarrow$ `completed` | ✅ PASS |
| **Safety PIN** | 6-Digit PIN Validation | Prevents starting `in_progress` tour until correct PIN is verified | ✅ PASS |
| **Payouts** | Dual Escrow Settlement | Released to guide ledger upon dual completion confirmation | ✅ PASS |
| **KYC** | Admin License Approval | Approving KYC unblocks guide's ability to publish and bid | ✅ PASS |
| **Moderation** | Tour Package Audit | Admin can feature, pause, or remove catalog tours | ✅ PASS |

---
*Document Version: 2.4.0 — Maintained by Core Engineering Team.*
