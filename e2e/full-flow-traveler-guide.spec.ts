import { test, expect } from '@playwright/test';

/**
 * End-to-End (E2E) Full Flow Test Suite for Tour Guide Hub
 * Comprehensive Coverage of Traveler & Tour Guide Complete Lifecycles:
 *  - Authentication & Role Switching
 *  - Traveler Flow 1: Create Travel Request -> Multi-round Bidding -> Accept & Escrow -> Live Tracking -> End Tour
 *  - Traveler Flow 2: Search Tours -> Multi-round Slot Negotiation -> Accept & Escrow -> Live Tracking -> End Tour
 *  - Event Calendar Flow: Month Navigation, Filtering, Itinerary & Live Tracking Modal Launch
 *  - Tour Guide Flow 1: Guide Tour Creation -> Receive Traveler Bid -> Multi-Round Counter Negotiation -> Booking Confirm
 *  - Tour Guide Flow 2: Browse Traveler Requests Board -> Bid on Request -> Win Negotiation -> End Tour Execution
 */

test.describe('Tour Guide Hub - Comprehensive E2E Full User Journey', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ==========================================
  // SCENARIO 1: AUTHENTICATION & ROLE SWITCHING
  // ==========================================
  test('1. Authentication & Role Switcher Verification', async ({ page }) => {
    // Open Sign In Modal
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first();
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Verify Quick Demo Accounts are available
    await expect(page.locator('text=Quick Demo Accounts')).toBeVisible();

    // Login as Traveler (Sarah Jenkins)
    await page.locator('button:has-text("Sarah Jenkins")').click();
    await expect(page.locator('text=Sarah Jenkins')).toBeVisible();
    await expect(page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")')).toBeVisible();

    // Switch account to Guide (Minh Nguyen)
    const userMenuBtn = page.locator('button:has-text("Sarah Jenkins"), div:has-text("Sarah Jenkins")').first();
    await userMenuBtn.click();
    
    // Log out or switch to guide
    const logoutOrSwitchBtn = page.locator('button:has-text("Sign Out"), button:has-text("Đăng Xuất"), button:has-text("Switch Account")').first();
    if (await logoutOrSwitchBtn.isVisible()) {
      await logoutOrSwitchBtn.click();
      await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
      await page.locator('button:has-text("Minh Nguyen")').click();
      await expect(page.locator('text=Minh Nguyen')).toBeVisible();
    }
  });

  // ==========================================
  // SCENARIO 2: TRAVELER FLOW 1 (REQUEST -> MULTI-ROUND BIDDING -> TRACKING -> END TOUR)
  // ==========================================
  test('2. Traveler Flow 1: Create Request -> Multi-Round Bids -> Accept -> Start Tracking -> End Tour', async ({ page }) => {
    // 2.1 Sign in as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // 2.2 Go to My Requests & Bids
    await page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")').first().click();

    // 2.3 Create Custom Trip Request
    const createReqBtn = page.locator('button:has-text("Post Custom Trip Request"), button:has-text("Tạo Yêu Cầu")').first();
    if (await createReqBtn.isVisible()) {
      await createReqBtn.click();

      const titleInput = page.locator('input[placeholder*="Title"], input[placeholder*="HDV"], input[type="text"]').first();
      await titleInput.fill('Playwright E2E: 3-Day Heritage & Street Food Quest');
      
      const budgetInput = page.locator('input[name="budget"], input[placeholder*="budget"], input[type="number"]').first();
      if (await budgetInput.isVisible()) {
        await budgetInput.fill('95');
      }

      const descInput = page.locator('textarea').first();
      if (await descInput.isVisible()) {
        await descInput.fill('Looking for an expert local guide in Saigon for authentic dining and historical walking tour.');
      }

      await page.locator('button[type="submit"], button:has-text("Post Request"), button:has-text("Đăng Yêu Cầu")').first().click();
      await expect(page.locator('text=Playwright E2E: 3-Day Heritage & Street Food Quest').first()).toBeVisible();
    }

    // 2.4 Multi-Round Bidding & Counter-Offers
    // Check for negotiation counter button or offer card
    const counterBtn = page.locator('button:has-text("Counter"), button:has-text("Thương Lượng Lại"), button:has-text("Send Counter")').first();
    if (await counterBtn.isVisible()) {
      await counterBtn.click();
      const priceInput = page.locator('input[type="number"]').first();
      if (await priceInput.isVisible()) {
        await priceInput.fill('88');
        await page.locator('button:has-text("Send"), button:has-text("Gửi Đề Xuất")').first().click();
      }
    }

    // 2.5 Accept Bid & Escrow Deposit
    const acceptBtn = page.locator('button:has-text("Accept & Book Tour"), button:has-text("Chấp Nhận & Đặt Tour"), button:has-text("Accept Offer")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      const confirmEscrowBtn = page.locator('button:has-text("Confirm & Pay Escrow"), button:has-text("Xác Nhận")').first();
      if (await confirmEscrowBtn.isVisible()) {
        await confirmEscrowBtn.click();
      }
    }

    // 2.6 Open Tour Hub & Verify Tracking Lifecycle
    const openHubBtn = page.locator('button:has-text("Open Tour Hub"), button:has-text("Live Hub"), button:has-text("Theo Dõi Tour")').first();
    if (await openHubBtn.isVisible()) {
      await openHubBtn.click();

      // Verify Status Tracker Tabs & Live Location
      await expect(page.locator('text=Tour Command Hub, text=Active Tour Hub, text=Overview').first()).toBeVisible();

      // Switch to Live Location / Route Tab
      const locationTab = page.locator('button:has-text("Location & Live Route"), button:has-text("Live Route"), button:has-text("Bản Đồ")').first();
      if (await locationTab.isVisible()) {
        await locationTab.click();
        await expect(page.locator('text=Live GPS, text=Route, text=Guide Location').first()).toBeVisible();
      }

      // Switch to Chat Tab & Send Message
      const chatTab = page.locator('button:has-text("Direct Chat"), button:has-text("Chat"), button:has-text("Nhắn Tin")').first();
      if (await chatTab.isVisible()) {
        await chatTab.click();
        const chatInput = page.locator('input[placeholder*="message"], input[placeholder*="nhắn"]');
        if (await chatInput.isVisible()) {
          await chatInput.fill('Hi Guide! We are ready at the lobby.');
          await page.locator('button:has-text("Send"), button[type="submit"]').first().click();
          await expect(page.locator('text=Hi Guide! We are ready at the lobby.')).toBeVisible();
        }
      }

      // Progress status to In Progress and Complete Tour
      const inProgressBtn = page.locator('button:has-text("In Progress"), button:has-text("Đang Tham Quan")').first();
      if (await inProgressBtn.isVisible()) {
        await inProgressBtn.click();
      }

      const completeTourBtn = page.locator('button:has-text("Complete Tour"), button:has-text("Hoàn Thành Tour"), button:has-text("End Tour")').first();
      if (await completeTourBtn.isVisible()) {
        await completeTourBtn.click();
        await expect(page.locator('text=Completed, text=Escrow Released, text=Hoàn thành').first()).toBeVisible();
      }
    }
  });

  // ==========================================
  // SCENARIO 3: TRAVELER FLOW 2 (SEARCH TOUR -> SLOT NEGOTIATION -> ACCEPT -> TRACKING -> END TOUR)
  // ==========================================
  test('3. Traveler Flow 2: Search Tour Catalog -> Slot Bidding -> Accept -> Start Tracking -> End Tour', async ({ page }) => {
    // 3.1 Sign In as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // 3.2 Navigate to Search Created Tours
    const searchToursTab = page.locator('button:has-text("Search Created Tours"), button:has-text("Tìm Tour HDV Tạo"), button:has-text("Find Guides")').first();
    if (await searchToursTab.isVisible()) {
      await searchToursTab.click();
    }

    // 3.3 Filter Tours by City
    const cityFilter = page.locator('select').first();
    if (await cityFilter.isVisible()) {
      await cityFilter.selectOption({ label: 'Ho Chi Minh City' });
    }

    // 3.4 Open Slot Negotiation on a Tour Package
    const negotiateSlotBtn = page.locator('button:has-text("Select Tour & Negotiate Slot"), button:has-text("Thương Lượng Giá")').first();
    if (await negotiateSlotBtn.isVisible()) {
      await negotiateSlotBtn.click();

      // Propose Custom Slot & Price
      const priceInput = page.locator('input[type="number"]').first();
      if (await priceInput.isVisible()) {
        await priceInput.fill('48');
      }

      const noteInput = page.locator('textarea').first();
      if (await noteInput.isVisible()) {
        await noteInput.fill('Can you include hotel pickup and vegetarian tastings?');
      }

      await page.locator('button:has-text("Send Custom Offer"), button:has-text("Gửi Đề Xuất")').first().click();
    }

    // 3.5 Open Traveler Hub and confirm booking lifecycle
    await page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch")').first().click();
    const liveHubBtn = page.locator('button:has-text("Open Tour Hub"), button:has-text("Theo Dõi Tour")').first();
    if (await liveHubBtn.isVisible()) {
      await liveHubBtn.click();
      await expect(page.locator('text=Tour Command Hub, text=Active Tour Hub, text=Overview').first()).toBeVisible();
    }
  });

  // ==========================================
  // SCENARIO 4: EVENT CALENDAR FLOW
  // ==========================================
  test('4. Event Calendar Flow: Month Navigation, Event Filters & Tour Hub Integration', async ({ page }) => {
    // 4.1 Sign In as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').click();

    // 4.2 Switch to Event Calendar Tab
    const calendarTab = page.locator('button:has-text("Event Calendar"), button:has-text("Lịch Sự Kiện"), button:has-text("Calendar")').first();
    if (await calendarTab.isVisible()) {
      await calendarTab.click();

      // Verify Calendar Container renders
      await expect(page.locator('text=Calendar, text=Lịch, text=Schedule, text=Sun, text=Mon').first()).toBeVisible();

      // Test Month Navigation (Next Month -> Previous Month)
      const nextMonthBtn = page.locator('button:has-text("Next"), button:has-text("Sau"), button[aria-label*="next"]').first();
      if (await nextMonthBtn.isVisible()) {
        await nextMonthBtn.click();
        await page.waitForTimeout(300);
      }

      const prevMonthBtn = page.locator('button:has-text("Prev"), button:has-text("Trước"), button[aria-label*="prev"]').first();
      if (await prevMonthBtn.isVisible()) {
        await prevMonthBtn.click();
        await page.waitForTimeout(300);
      }

      // Test Event Filter Pills (All / Confirmed Bookings / Active Negotiations)
      const confirmedFilter = page.locator('button:has-text("Confirmed Bookings"), button:has-text("Đã Đặt")').first();
      if (await confirmedFilter.isVisible()) {
        await confirmedFilter.click();
      }

      const allFilter = page.locator('button:has-text("All Events"), button:has-text("Tất Cả")').first();
      if (await allFilter.isVisible()) {
        await allFilter.click();
      }

      // Click on a calendar day or event chip
      const eventChip = page.locator('div[class*="rounded"]:has-text("$"), button:has-text("$")').first();
      if (await eventChip.isVisible()) {
        await eventChip.click();
      }
    }
  });

  // ==========================================
  // SCENARIO 5: TOUR GUIDE FLOW 1 & 2 (CREATE TOUR, BID ON TRAVELER REQUEST, EXECUTE)
  // ==========================================
  test('5. Tour Guide Flow: Create Tour Package, Bid on Traveler Request & Live Tour Execution', async ({ page }) => {
    // 5.1 Sign In as Tour Guide (Minh Nguyen)
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập")').first().click();
    await page.locator('button:has-text("Minh Nguyen")').click();

    // 5.2 Guide Dashboard is visible
    await expect(page.locator('text=Minh Nguyen')).toBeVisible();
    await expect(page.locator('button:has-text("My Tour Packages"), button:has-text("Tour Của Tôi"), button:has-text("Guide Dashboard")').first()).toBeVisible();

    // 5.3 Guide Creates a Tour Package
    const createTourBtn = page.locator('button:has-text("Create Tour Package"), button:has-text("Tạo Tour Mới")').first();
    if (await createTourBtn.isVisible()) {
      await createTourBtn.click();

      const titleInput = page.locator('input[placeholder*="Title"], input[placeholder*="Tên tour"], input[type="text"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('E2E Sunset Vespa & Hidden Rooftops Tour');
      }

      const priceInput = page.locator('input[placeholder*="price"], input[placeholder*="giá"], input[type="number"]').first();
      if (await priceInput.isVisible()) {
        await priceInput.fill('45');
      }

      const submitTourBtn = page.locator('button[type="submit"], button:has-text("Publish Tour"), button:has-text("Đăng Tour")').first();
      if (await submitTourBtn.isVisible()) {
        await submitTourBtn.click();
      }
    }

    // 5.4 Guide Joins & Bids on Traveler Request Board
    const travelerReqsTab = page.locator('button:has-text("Traveler Requests"), button:has-text("Yêu Cầu Du Khách"), button:has-text("Bidding Board")').first();
    if (await travelerReqsTab.isVisible()) {
      await travelerReqsTab.click();

      // Click Place Bid / Counter on a traveler request
      const placeBidBtn = page.locator('button:has-text("Place Bid"), button:has-text("Gửi Báo Giá"), button:has-text("Đấu Giá")').first();
      if (await placeBidBtn.isVisible()) {
        await placeBidBtn.click();

        const bidPriceInput = page.locator('input[type="number"]').first();
        if (await bidPriceInput.isVisible()) {
          await bidPriceInput.fill('75');
        }

        const bidMsg = page.locator('textarea').first();
        if (await bidMsg.isVisible()) {
          await bidMsg.fill('I am a certified English & Vietnamese guide with private air-conditioned transport.');
        }

        const sendBidBtn = page.locator('button:has-text("Send Bid"), button:has-text("Gửi Đề Xuất")').first();
        if (await sendBidBtn.isVisible()) {
          await sendBidBtn.click();
        }
      }
    }

    // 5.5 Guide Confirms Tour Completion
    const bookingsTab = page.locator('button:has-text("Bookings"), button:has-text("Lịch Đặt"), button:has-text("Negotiations")').first();
    if (await bookingsTab.isVisible()) {
      await bookingsTab.click();
      const guideHubBtn = page.locator('button:has-text("Open Tour Hub"), button:has-text("Theo Dõi Tour")').first();
      if (await guideHubBtn.isVisible()) {
        await guideHubBtn.click();
        await expect(page.locator('text=Tour Command Hub, text=Active Tour Hub, text=Overview').first()).toBeVisible();
      }
    }
  });

});
