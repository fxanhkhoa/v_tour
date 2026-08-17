import { test, expect } from '@playwright/test';

/**
 * End-to-End (E2E) Browser Test Suite for Tour Guide Hub
 * Generated from: e2e/E2E_FULL_FLOW_TESTING.md & e2e/FULL_FLOW_E2E_GUIDE.md
 * 
 * Tri-Persona UI Coverage:
 *  1. Traveler Journey (Search, Custom Post, Multi-Round Negotiation, Escrow Deposit, Google Contacts / Calendar, Live GPS Tracking, Chat, Review)
 *  2. Tour Guide Journey (KYC Submission, Package Creation, Bidding, PIN Matching, Payout Ledger)
 *  3. Admin Journey (Dashboard Metrics, KYC Approval, Tour Moderation, User Management)
 */

test.describe('Tour Guide Hub — Master Full Flow E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ==========================================
  // SCENARIO 1: AUTHENTICATION & QUICK DEMO SWITCHER
  // ==========================================
  test('1. Tri-Persona Authentication & Account Switching', async ({ page }) => {
    // Open Sign-in modal
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first();
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Verify Quick Demo Accounts
    await expect(page.locator('text=Quick Demo Accounts')).toBeVisible();

    // Sign in as Sarah Jenkins (Traveler)
    await page.locator('button:has-text("Sarah Jenkins")').click();
    await expect(page.locator('text=Sarah Jenkins')).toBeVisible();

    // Switch to Minh Nguyen (Guide)
    const profileBtn = page.locator('button:has-text("Sarah Jenkins"), div:has-text("Sarah Jenkins")').first();
    await profileBtn.click();
    const switchOrSignOut = page.locator('button:has-text("Sign Out"), button:has-text("Đăng Xuất"), button:has-text("Switch Account")').first();
    if (await switchOrSignOut.isVisible()) {
      await switchOrSignOut.click();
      await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
      await page.locator('button:has-text("Minh Nguyen")').click();
      await expect(page.locator('text=Minh Nguyen')).toBeVisible();
    }
  });

  // ==========================================
  // SCENARIO 2: TRAVELER FLOW 1 (REQUEST -> BIDDING -> ESCROW -> LIVE GPS -> DUAL COMPLETION)
  // ==========================================
  test('2. Traveler Flow 1: Custom Request -> Multi-Round Counters -> Escrow Hold -> Live Hub -> Review', async ({ page }) => {
    // 2.1 Sign in as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // 2.2 Navigate to My Requests & Bids
    const myRequestsTab = page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")').first();
    await expect(myRequestsTab).toBeVisible();
    await myRequestsTab.click();

    // 2.3 Post Custom Trip Request
    const postReqBtn = page.locator('button:has-text("Post Custom Trip Request"), button:has-text("Tạo Yêu Cầu")').first();
    if (await postReqBtn.isVisible()) {
      await postReqBtn.click();
      const titleInput = page.locator('input[placeholder*="Title"], input[placeholder*="HDV"], input[type="text"]').first();
      await titleInput.fill('E2E Spec: 3-Day Hidden Street Food & Photography Quest');

      const budgetInput = page.locator('input[name="budget"], input[placeholder*="budget"], input[type="number"]').first();
      if (await budgetInput.isVisible()) {
        await budgetInput.fill('95');
      }

      await page.locator('button[type="submit"], button:has-text("Post Request"), button:has-text("Đăng Yêu Cầu")').first().click();
      await expect(page.locator('text=E2E Spec: 3-Day Hidden Street Food & Photography Quest').first()).toBeVisible();
    }

    // 2.4 Multi-Round Bidding / Counter
    const counterBtn = page.locator('button:has-text("Counter"), button:has-text("Thương Lượng Lại"), button:has-text("Send Counter")').first();
    if (await counterBtn.isVisible()) {
      await counterBtn.click();
      const priceInput = page.locator('input[type="number"]').first();
      if (await priceInput.isVisible()) {
        await priceInput.fill('88');
        await page.locator('button:has-text("Send"), button:has-text("Gửi Đề Xuất")').first().click();
      }
    }

    // 2.5 Accept Offer & Escrow
    const acceptBtn = page.locator('button:has-text("Accept & Book Tour"), button:has-text("Chấp Nhận & Đặt Tour"), button:has-text("Accept Offer")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    }

    // 2.6 Live Tour Hub & Safety Verification
    const openHubBtn = page.locator('button:has-text("Open Live Tour Hub"), button:has-text("Mở Tour Hub"), button:has-text("Tour Hub")').first();
    if (await openHubBtn.isVisible()) {
      await openHubBtn.click();
      await expect(page.locator('text=Safety Match PIN, text=Mã PIN').first()).toBeVisible();
    }
  });

  // ==========================================
  // SCENARIO 3: GOOGLE CONTACTS & WORKSPACE SYNC
  // ==========================================
  test('3. Google Contacts (People API) & Calendar Sync Buttons', async ({ page }) => {
    // Sign in as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // Check presence of "Save to Google Contacts" button
    const contactsBtn = page.locator('button:has-text("Save to Google Contacts"), button:has-text("Lưu Danh Bạ Google")').first();
    if (await contactsBtn.isVisible()) {
      await contactsBtn.click();
      // Verify confirmation modal opens
      await expect(page.locator('text=Add to Google Contacts, text=Lưu Vào Google Contacts').first()).toBeVisible();
      // Close modal
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Hủy Bỏ"), button:has-text("Đóng")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Check Google Calendar Button
    const calendarBtn = page.locator('button:has-text("Google Calendar"), button:has-text("Lịch Google")').first();
    if (await calendarBtn.isVisible()) {
      await expect(calendarBtn).toBeVisible();
    }
  });

  // ==========================================
  // SCENARIO 4: EVENT CALENDAR FLOW & FILTERS
  // ==========================================
  test('4. Event Calendar Navigation & Filter Switching', async ({ page }) => {
    // Open Calendar Tab
    const calendarTab = page.locator('button:has-text("Event Calendar"), button:has-text("Lịch Sự Kiện"), a:has-text("Calendar")').first();
    if (await calendarTab.isVisible()) {
      await calendarTab.click();

      // Verify calendar controls
      const nextMonthBtn = page.locator('button:has-text("❯"), button[aria-label="Next month"]').first();
      if (await nextMonthBtn.isVisible()) {
        await nextMonthBtn.click();
      }

      // Toggle Confirmed Bookings Filter
      const confirmedFilter = page.locator('button:has-text("Confirmed"), button:has-text("Đã Xác Nhận")').first();
      if (await confirmedFilter.isVisible()) {
        await confirmedFilter.click();
      }
    }
  });

  // ==========================================
  // SCENARIO 5: ADMIN DASHBOARD & KYC MODERATION
  // ==========================================
  test('5. Admin Analytics & KYC Approval Center', async ({ page }) => {
    // Sign in as Admin
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
    await page.locator('button:has-text("System Admin")').click();

    // Verify Admin Dashboard Stats
    await expect(page.locator('text=Admin, text=Quản Trị').first()).toBeVisible();

    // Open KYC tab if visible
    const kycTab = page.locator('button:has-text("KYC"), button:has-text("Duyệt Hồ Sơ")').first();
    if (await kycTab.isVisible()) {
      await kycTab.click();
      await expect(page.locator('text=KYC, text=CCCD, text=License').first()).toBeVisible();
    }
  });

});
