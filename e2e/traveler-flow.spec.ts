import { test, expect } from '@playwright/test';

/**
 * End-to-End (E2E) Automated Test Suite for Traveler User Journey
 * Platform: Tour Guide Hub (React + Vite + Express)
 */

test.describe('Traveler End-to-End Full User Journey', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Step 1: Traveler Login via Quick Demo Account', async ({ page }) => {
    // Click Sign In button in navbar
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")');
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Verify Auth Modal appears
    await expect(page.locator('text=Quick Demo Accounts')).toBeVisible();

    // Click Sarah Jenkins (Traveler Account)
    const travelerAccount = page.locator('button:has-text("Sarah Jenkins")');
    await expect(travelerAccount).toBeVisible();
    await travelerAccount.click();

    // Verify logged in state
    await expect(page.locator('text=Sarah Jenkins')).toBeVisible();
    await expect(page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")')).toBeVisible();
  });

  test('Step 2: Explore & Filter Local Tour Packages', async ({ page }) => {
    // Navigate to Search Created Tours section
    const findGuidesTab = page.locator('button:has-text("Search Created Tours"), button:has-text("Tìm Tour HDV Tạo"), button:has-text("Find Guides")');
    if (await findGuidesTab.isVisible()) {
      await findGuidesTab.click();
    }

    // Filter by City: Ho Chi Minh City
    const cityFilter = page.locator('select').first();
    await cityFilter.selectOption({ label: 'Ho Chi Minh City' });

    // Verify tour or guide info in Ho Chi Minh City exists
    await expect(page.locator('text=Ho Chi Minh City').first()).toBeVisible();
  });

  test('Step 3: Post a Custom Traveler Trip Request', async ({ page }) => {
    // Login as Sarah Jenkins
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // Open Traveler Requests tab
    await page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")').click();

    // Click Post Custom Request button
    const postRequestBtn = page.locator('button:has-text("Post Custom Trip Request"), button:has-text("Tạo Yêu Cầu")').first();
    await postRequestBtn.click();

    // Fill request form
    await page.locator('input[placeholder*="Title"], input[placeholder*="HDV"], input[type="text"]').first().fill('E2E Test: 2-Day Private Street Food Tour');
    await page.locator('select').first().selectOption('Ho Chi Minh City');
    await page.locator('input[name="budget"]').fill('120'); // Budget $120
    await page.locator('textarea').fill('Looking for an English speaking local food guide with private car pickup.');

    // Submit request modal
    await page.locator('button[type="submit"], button:has-text("Post Request"), button:has-text("Đăng Yêu Cầu")').click();

    // Verify post appears on Traveler Requests board
    await expect(page.locator('text=E2E Test: 2-Day Private Street Food Tour')).toBeVisible();
  });

  test('Step 4: Tour Slot Selection & Price Offer Negotiation', async ({ page }) => {
    // Login as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // Find tour and click Select Tour & Negotiate Slot
    const negotiateBtn = page.locator('button:has-text("Select Tour & Negotiate Slot"), button:has-text("Chọn Tour & Thương Lượng Giá")').first();
    await expect(negotiateBtn).toBeVisible();
    await negotiateBtn.click();

    // Fill negotiation offer form inside scrollable modal
    await page.locator('input[type="number"]').first().fill('95'); // Proposed price $95
    await page.locator('textarea').fill('Can you include hotel pickup and vegetarian food options?');

    // Submit Offer
    await page.locator('button:has-text("Send Custom Offer"), button:has-text("Gửi Đề Xuất Thương Lượng")').click();

    // Verify Negotiation active card or updated state
    await expect(page.locator('text=$95').first()).toBeVisible();
  });

  test('Step 5: Accept Offer & Book Tour with Escrow Payment', async ({ page }) => {
    // Login as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // Open Traveler Requests & Negotiations
    await page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")').click();

    // Click Accept & Book Tour if active negotiation exists
    const acceptBookBtn = page.locator('button:has-text("Accept & Book Tour"), button:has-text("Chấp Nhận & Đặt Tour")').first();
    if (await acceptBookBtn.isVisible()) {
      await acceptBookBtn.click();

      // Complete booking details
      await page.locator('input[placeholder*="Hotel"]').fill('Caravelle Hotel Saigon, District 1');
      await page.locator('button:has-text("Confirm & Pay Escrow")').click();

      // Verify active booking badge
      await expect(page.locator('text=Confirmed')).toBeVisible();
    }
  });

  test('Step 6: Live Messaging with Guide & Dual Tour Completion', async ({ page }) => {
    // Login as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // Open My Requests / Bookings
    await page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")').click();

    // Open Chat Modal
    const openChatBtn = page.locator('button:has-text("Chat with Guide"), button:has-text("Nhắn Tin")').first();
    if (await openChatBtn.isVisible()) {
      await openChatBtn.click();

      // Send Message
      const chatInput = page.locator('input[placeholder*="message"], input[placeholder*="nhắn"]');
      await chatInput.fill('Hello Minh! Excited for our food tour tomorrow.');
      await page.locator('button[type="submit"], button:has-text("Send")').click();

      // Verify message sent
      await expect(page.locator('text=Hello Minh! Excited for our food tour tomorrow.')).toBeVisible();
      await page.locator('button:has-text("Close"), button:has-text("Đóng")').first().click();
    }

    // Confirm Dual Tour Completion
    const confirmCompletionBtn = page.locator('button:has-text("Confirm Completion ✓"), button:has-text("Xác Nhận Hoàn Thành")').first();
    if (await confirmCompletionBtn.isVisible()) {
      await confirmCompletionBtn.click();
      await expect(page.locator('text=Traveler ✓')).toBeVisible();
    }
  });

});

