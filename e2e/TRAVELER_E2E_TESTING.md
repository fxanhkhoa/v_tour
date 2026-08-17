# 🧪 Traveler Journey End-to-End (E2E) Test Documentation

This document outlines the complete End-to-End (E2E) testing framework, test scenarios, manual verification steps, automated Playwright test suite, and **Firebase Firestore** cloud persistence verification for the **Traveler** user journey on **Tour Guide Hub**.

---

## ☁️ Database Architecture & Cloud Persistence (Firebase Firestore)

The application backend (`server.ts` & `src/db/firebase.ts`) is powered by **Firebase Firestore** for durable cloud persistence across all core Traveler operations:

- **Collection `users`**: User profiles & Traveler session tokens.
- **Collection `posts`**: Traveler custom trip requests & budget requirements.
- **Collection `negotiations`**: Slot negotiation price offers & guide counter-proposals.
- **Collection `bookings`**: Confirmed tour bookings, schedule dates & escrow deposit states.
- **Collection `chat`**: Real-time message logs between Traveler and Guide.

---

## 🔑 Test Account Credentials

- **Role**: Traveler
- **Account Name**: Sarah Jenkins
- **Email / Username**: `sarah@example.com`
- **Default Password**: `password123`
- **Quick Access**: Available directly via **Quick Demo Accounts** in the **Sign In** modal.

---

## 📋 Comprehensive Test Scenarios & Step-by-Step Guide

### **Step 1: Traveler Authentication & Session Setup**
1. Click **Sign In** in the top navigation header bar.
2. Select **Sarah Jenkins (Traveler Profile)** under *Quick Demo Accounts*.
3. **Expected Results**: 
   - Navbar updates to display **Sarah Jenkins**.
   - **My Requests & Bids** tab becomes visible in the header navigation.
   - User session token is retrieved and verified against Firebase Firestore `users` collection.

---

### **Step 2: Explore Local Tour Packages & Directory Search**
1. Navigate to the **Search Created Tours & Negotiate** section.
2. Select **Ho Chi Minh City** from the City dropdown filter.
3. Filter by Category or Max Price slider.
4. **Expected Results**:
   - Directory queries Firebase Firestore `tours` collection in real time.
   - Tour cards display price per person, guide name, ratings, duration, category badge, and available schedule slots.

---

### **Step 3: Tour Slot Selection & Custom Price Offer Negotiation**
1. On a tour package card, click **Select Tour & Negotiate Slot 🤝**.
2. In the scrollable negotiation modal:
   - **Select Available Schedule Slot**: Pick an upcoming slot or propose a custom time.
   - **Group Size**: 2 Travelers.
   - **Proposed Price per Person**: `$95 USD`.
   - **Special Request Notes**: *"Looking for hotel pickup and vegetarian food options."*
3. Click **Send Custom Offer**.
4. **Expected Results**:
   - Proposal submits instantly and persists to the Firestore `negotiations` collection.
   - Negotiation card appears under **My Requests & Bids** -> **Active Price Negotiations** with status `Pending Guide Response`.

---

### **Step 4: Post a Custom Trip Request (City Request Board)**
1. Navigate to **My Requests & Bids** -> **Live Traveler Requests Board**.
2. Click **Post Custom Trip Request 📝**.
3. Fill in request details:
   - **Trip Title**: `"2-Day Private Danang & Hoi An Heritage Tour"`
   - **Destination**: `Da Nang`
   - **Budget per Person**: `$120 USD`
   - **Group Size**: `3 Travelers`
   - **Custom Requirements**: *"Need fluent English speaking guide with SUV vehicle for Ba Na Hills."*
4. Click **Post Request**.
5. **Expected Results**:
   - Request document is created in Firebase Firestore `posts` collection with status `Open for Bids`.
   - Request appears live on the public city request board.

---

### **Step 5: Review Bids & Accept Escrow Booking**
1. Go to **My Requests & Bids** -> **Price Bids & Offers**.
2. View incoming counter-offers submitted by guides.
3. Click **Accept & Book Tour** on an offer.
4. Complete the checkout modal:
   - **Hotel Pickup Address**: `Caravelle Hotel, District 1, Ho Chi Minh City`
   - **Emergency Contact**: `+1 555 019 2831`
   - **Dietary Restrictions**: `1 Vegetarian traveler`
5. Click **Confirm & Pay Escrow Deposit**.
6. **Expected Results**:
   - Booking document created in Firebase Firestore `bookings` collection with status `Confirmed / Escrow Paid`.
   - Escrow funds are held in platform reserve until tour completion.

---

### **Step 6: Real-Time Messaging & Coordination**
1. Click **Chat with Guide 💬** on the active booking card.
2. Send message: *"Hi Minh, please meet us at Caravelle Hotel lobby at 8:00 AM tomorrow!"*
3. **Expected Results**:
   - Message document saved to Firestore `chat` collection.
   - Appears instantly in chat log with timestamp and delivery checkmark.

---

### **Step 7: Dual Tour Completion & Rating Submission**
1. Navigate to **Live Booking Tracker Modal**.
2. Click **Confirm Completion ✓** as Traveler.
3. **Expected Results**:
   - Status updates to `Traveler Completed ✓` in Firestore.
   - Once Guide also confirms (`Guide Completed ✓`), booking status updates to `Completed` and escrow funds are released.
4. Fill in Review Form:
   - **Star Rating**: `5 / 5 Stars`
   - **Feedback**: *"Amazing street food tour with Minh! Highly knowledgeable and friendly."*
5. Click **Submit Review**.

---

## 🔍 Database & API Health Verification

To verify that Traveler requests, negotiations, and bookings are properly stored in Firebase Firestore, you can test backend API endpoints or run the node verification script:

### **Checking API Responses**
```bash
# Verify Traveler posts in Firestore
curl http://localhost:3000/api/traveler/posts?city=All

# Verify active tour packages in Firestore
curl http://localhost:3000/api/tours?city=All
```

### **Firestore Collection Verification Script**
```javascript
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function verifyFirestoreData() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'dwc-1f2f6';
  initializeApp({ projectId });
  const db = getFirestore();

  const collections = ['users', 'guides', 'tours', 'posts', 'negotiations', 'bookings', 'chat'];
  for (const name of collections) {
    const snap = await db.collection(name).get();
    console.log(`Collection '${name}': ${snap.size} documents in Firestore`);
  }
}
verifyFirestoreData();
```

---

## 🤖 Automated Playwright E2E Test Suite

The automated test script is saved at `/e2e/traveler-flow.spec.ts`.

### **Running the Automated Tests**
```bash
npm run test:e2e
```

### **Test File Overview (`/e2e/traveler-flow.spec.ts`)**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Traveler End-to-End Full User Journey', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Step 1: Traveler Login via Quick Demo Account', async ({ page }) => {
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').click();
    await page.locator('button:has-text("Sarah Jenkins")').click();
    await expect(page.locator('text=Sarah Jenkins')).toBeVisible();
    await expect(page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")')).toBeVisible();
  });

  test('Step 2: Explore & Filter Local Tour Packages', async ({ page }) => {
    const findGuidesTab = page.locator('button:has-text("Search Created Tours"), button:has-text("Tìm Tour HDV Tạo"), button:has-text("Find Guides")');
    if (await findGuidesTab.isVisible()) {
      await findGuidesTab.click();
    }

    const cityFilter = page.locator('select').first();
    await cityFilter.selectOption({ label: 'Ho Chi Minh City' });
    await expect(page.locator('text=Ho Chi Minh City').first()).toBeVisible();
  });

  test('Step 3: Post a Custom Traveler Trip Request', async ({ page }) => {
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    const postRequestBtn = page.locator('button:has-text("Post Custom Trip Request"), button:has-text("Đăng Yêu Cầu Chuyến Đi")').first();
    await postRequestBtn.click();

    await page.locator('input[placeholder*="Title"], input[placeholder*="HDV"], input[type="text"]').first().fill('E2E Test: 2-Day Private Street Food Tour');
    await page.locator('select').first().selectOption('Ho Chi Minh City');
    await page.locator('input[type="number"]').first().fill('120');
    await page.locator('textarea').fill('Looking for an English speaking local food guide with private car pickup.');

    await page.locator('button[type="submit"], button:has-text("Post Request"), button:has-text("Đăng Yêu Cầu")').click();
    await expect(page.locator('text=E2E Test: 2-Day Private Street Food Tour')).toBeVisible();
  });

  test('Step 4: Tour Slot Selection & Price Offer Negotiation', async ({ page }) => {
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    const negotiateBtn = page.locator('button:has-text("Select Tour & Negotiate Slot"), button:has-text("Chọn Tour & Thương Lượng Giá")').first();
    await expect(negotiateBtn).toBeVisible();
    await negotiateBtn.click();

    await page.locator('input[type="number"]').first().fill('95');
    await page.locator('textarea').fill('Can you include hotel pickup and vegetarian food options?');

    await page.locator('button:has-text("Send Custom Offer"), button:has-text("Gửi Đề Xuất Thương Lượng")').click();
    await expect(page.locator('text=$95').first()).toBeVisible();
  });
});
```

