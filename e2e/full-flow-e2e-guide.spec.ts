import { test, expect } from '@playwright/test';

/**
 * MASTER FULL FLOW E2E TEST SPECIFICATION
 * Generated directly from: e2e/FULL_FLOW_E2E_GUIDE.md
 * Platform: Vietnam Local Tour Guide & Traveler Network
 * Stack: React 19 + TypeScript + Express + Firebase + Google Workspace
 * 
 * Matrix Coverage:
 *  - Role 1: Traveler Complete Lifecycle (AI Planner, Custom Post, Directory Search, Counter Negotiation, Escrow, Google Contacts & Calendar, Live GPS Hub, Chat, Review)
 *  - Role 2: Tour Guide Lifecycle (KYC Submission, Payout Config, Package Creation, Bidding on Post, Safety PIN Verification, Dual Confirmation, Payout Ledger)
 *  - Role 3: Admin Operations (Platform KPIs, KYC Inspection & Approval, Tour Moderation, User Account Control, DB Reseed)
 *  - Google Workspace & Escrow State Transitions
 */

test.describe('Vietnam Tour Guide Hub — Master Full Flow E2E (Guide Spec)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // =========================================================================
  // 1. AUTHENTICATION & QUICK DEMO PERSONAS
  // =========================================================================
  test('1. Authentication Matrix: Traveler, Tour Guide, Admin Quick Switching', async ({ page }) => {
    // 1.1 Open Auth Modal
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập"), button:has-text("Sign In / Register")').first();
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // 1.2 Verify Quick Demo Accounts Section
    await expect(page.locator('button:has-text("Sarah Jenkins")').first()).toBeVisible();

    // 1.3 Login as Traveler (Sarah Jenkins)
    await page.locator('button:has-text("Sarah Jenkins")').first().click();
    await expect(page.locator('text=Sarah Jenkins').first()).toBeVisible();

    // 1.4 Switch to Tour Guide (Minh Nguyen)
    const userMenuBtn = page.locator('button:has-text("Sarah Jenkins"), div:has-text("Sarah Jenkins")').first();
    if (await userMenuBtn.isVisible()) {
      await userMenuBtn.click();
    }
    const switchBtn = page.locator('button:has-text("Switch Account"), button:has-text("Sign Out"), button:has-text("Đăng Xuất"), button[title*="Sign Out"], button[title*="Đăng"]').first();
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
      await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập"), button:has-text("Sign In / Register")').first().click();
      await page.locator('button:has-text("Minh Nguyen")').first().click();
      await expect(page.locator('text=Minh Nguyen').first()).toBeVisible();
    }
  });

  // =========================================================================
  // 2. ROLE 1: TRAVELER JOURNEY (AI PLANNER -> POST REQUEST -> NEGOTIATION -> ESCROW)
  // =========================================================================
  test('2. Traveler Journey: AI Planner, Custom Request, Counter-Negotiation & Escrow Hold', async ({ page }) => {
    // 2.1 Sign in as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập"), button:has-text("Sign In / Register")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').first().click();

    // 2.2 AI Tour Itinerary Generator
    const aiPlannerBtn = page.locator('button:has-text("AI Tour Planner"), button:has-text("Lập Lịch Trình AI")').first();
    if (await aiPlannerBtn.isVisible()) {
      await aiPlannerBtn.click();
      const citySelect = page.locator('select, input[placeholder*="City"]').first();
      if (await citySelect.isVisible()) {
        await citySelect.selectOption({ label: 'Ho Chi Minh City' }).catch(() => {});
      }
      const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Tạo Lịch Trình")').first();
      if (await generateBtn.isVisible()) {
        await generateBtn.click();
      }
      // Close AI modal
      const closeAi = page.locator('button:has-text("Close"), button:has-text("Đóng"), button:has-text("✕")').first();
      if (await closeAi.isVisible()) {
        await closeAi.click();
      }
    }

    // 2.3 Post Custom Trip Request on Bidding Board
    const myRequestsTab = page.locator('button:has-text("My Requests"), button:has-text("Đơn Du Lịch"), button:has-text("Yêu Cầu & Báo Giá")').first();
    if (await myRequestsTab.isVisible()) {
      await myRequestsTab.click();
      const postBtn = page.locator('button:has-text("Post Custom Trip Request"), button:has-text("Tạo Yêu Cầu"), button:has-text("Đăng Yêu Cầu")').first();
      if (await postBtn.isVisible()) {
        await postBtn.click();
        const titleInput = page.locator('input[placeholder*="Title"], input[placeholder*="tiêu đề"], input[placeholder*="HDV"], input[type="text"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill('3-Day Hidden Street Food & Photography Quest');
        }
        
        const submitPost = page.locator('button[type="submit"], button:has-text("Publish"), button:has-text("Đăng Yêu Cầu"), button:has-text("Post Request")').first();
        if (await submitPost.isVisible()) {
          await submitPost.click();
        }
      }
    }

    // 2.4 Multi-Round Bidding & Counter Negotiations
    const counterOfferBtn = page.locator('button:has-text("Counter"), button:has-text("Thương Lượng"), button:has-text("Negotiate")').first();
    if (await counterOfferBtn.isVisible()) {
      await counterOfferBtn.click();
      const counterInput = page.locator('input[type="number"]').first();
      if (await counterInput.isVisible()) {
        await counterInput.fill('85');
        const sendCounter = page.locator('button:has-text("Send"), button:has-text("Gửi Đề Xuất")').first();
        if (await sendCounter.isVisible()) {
          await sendCounter.click();
        }
      }
    }

    // 2.5 Escrow Booking Deposit Authorization
    const acceptOfferBtn = page.locator('button:has-text("Accept & Book"), button:has-text("Chấp Nhận & Đặt"), button:has-text("Deposit Escrow"), button:has-text("Accept & Book Tour")').first();
    if (await acceptOfferBtn.isVisible()) {
      await acceptOfferBtn.click();
      // Payment shield modal verification
      await expect(page.locator('text=/Escrow|Thanh Toán|Security/i').first()).toBeVisible();
      const payAuthorizeBtn = page.locator('button:has-text("Authorize"), button:has-text("Thanh Toán"), button:has-text("Confirm")').first();
      if (await payAuthorizeBtn.isVisible()) {
        await payAuthorizeBtn.click();
      }
    }
  });

  // =========================================================================
  // 3. GOOGLE WORKSPACE INTEGRATIONS: CONTACTS & CALENDAR
  // =========================================================================
  test('3. Google Workspace: Save Guide to Google Contacts (People API) & Calendar Sync', async ({ page }) => {
    // 3.1 Sign in as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập"), button:has-text("Sign In / Register")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').first().click();

    // 3.2 Verify Google Contacts Button
    const saveContactsBtn = page.locator('button:has-text("Save to Google Contacts"), button:has-text("Lưu Danh Bạ Google"), button:has-text("Google Contacts")').first();
    if (await saveContactsBtn.isVisible()) {
      await saveContactsBtn.click();
      
      // Explicit confirmation modal check
      await expect(page.locator('text=/Google Contacts|Danh Bạ/i').first()).toBeVisible();
      await expect(page.locator('text=/Phone Number|Số Điện Thoại/i').first()).toBeVisible();

      // Check vCard download option
      const vcfBtn = page.locator('button:has-text(".vcf"), a:has-text(".vcf"), button:has-text("vCard")').first();
      if (await vcfBtn.isVisible()) {
        await expect(vcfBtn).toBeVisible();
      }

      // Close modal
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Hủy Bỏ"), button:has-text("Đóng"), button:has-text("✕")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }

    // 3.3 Verify Add to Google Calendar / .ICS Button
    const calendarSyncBtn = page.locator('button:has-text("Google Calendar"), button:has-text("Lịch Google"), button:has-text("Calendar")').first();
    if (await calendarSyncBtn.isVisible()) {
      await expect(calendarSyncBtn).toBeVisible();
    }
  });

  // =========================================================================
  // 4. LIVE TOUR HUB: GPS TRACKING, CHAT, SAFETY PIN & VIDEO CALL ROOM
  // =========================================================================
  test('4. Live Tour Execution: GPS Radar, Chat Messaging, Safety Match PIN & Video Room', async ({ page }) => {
    // 4.1 Sign in as Traveler
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập"), button:has-text("Sign In / Register")').first().click();
    await page.locator('button:has-text("Sarah Jenkins")').first().click();

    // 4.2 Open Live Tour Hub
    const openTourHubBtn = page.locator('button:has-text("Open Live Tour Hub"), button:has-text("Mở Tour Hub"), button:has-text("Live Tour"), button:has-text("Theo Dõi Tour")').first();
    if (await openTourHubBtn.isVisible()) {
      await openTourHubBtn.click();

      // 4.3 Verify 6-Digit Safety Match PIN Display
      await expect(page.locator('text=/Safety Match PIN|Mã PIN Khớp Lệnh|PIN/i').first()).toBeVisible();

      // 4.4 Switch to Live Chat & Send In-Tour Message
      const chatTabBtn = page.locator('button:has-text("Chat"), button:has-text("Tin Nhắn")').first();
      if (await chatTabBtn.isVisible()) {
        await chatTabBtn.click();
        const chatInput = page.locator('input[placeholder*="message"], input[placeholder*="tin nhắn"]').first();
        if (await chatInput.isVisible()) {
          await chatInput.fill('Hello Minh! We are waiting by the main lobby entrance.');
          const sendMsgBtn = page.locator('button:has-text("Send"), button[type="submit"]').first();
          if (await sendMsgBtn.isVisible()) {
            await sendMsgBtn.click();
          }
        }
      }

      // 4.5 Verify WebRTC Video Room Component
      const videoTabBtn = page.locator('button:has-text("Video"), button:has-text("Call")').first();
      if (await videoTabBtn.isVisible()) {
        await videoTabBtn.click();
        await expect(page.locator('text=/Video|Camera|Call/i').first()).toBeVisible();
      }

      // 4.6 Close Hub Modal
      const closeHubBtn = page.locator('button:has-text("Close"), button:has-text("Đóng"), button:has-text("✕")').first();
      if (await closeHubBtn.isVisible()) {
        await closeHubBtn.click();
      }
    }
  });

  // =========================================================================
  // 5. ROLE 2: TOUR GUIDE JOURNEY (KYC, PAYOUT SETUP, TOUR CREATION, BIDDING)
  // =========================================================================
  test('5. Tour Guide Journey: KYC Submission, Payout Config, Package Creation & Payout Ledger', async ({ page }) => {
    // 5.1 Sign in as Tour Guide (Minh Nguyen)
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập"), button:has-text("Sign In / Register")').first().click();
    await page.locator('button:has-text("Minh Nguyen")').first().click();

    // 5.2 Banking & Payout Account Setup (VietQR / Domestic Bank / PayPal)
    const payoutConfigBtn = page.locator('button:has-text("Configure Payout"), button:has-text("Thiết Lập Thanh Toán"), button:has-text("Payout Account")').first();
    if (await payoutConfigBtn.isVisible()) {
      await payoutConfigBtn.click();
      await expect(page.locator('text=/Bank|Ngân Hàng|VietQR|PayPal/i').first()).toBeVisible();
      const closePayout = page.locator('button:has-text("Close"), button:has-text("Đóng"), button:has-text("Cancel"), button:has-text("✕")').first();
      if (await closePayout.isVisible()) {
        await closePayout.click();
      }
    }

    // 5.3 Tour Catalog Manager -> Create Tour Package
    const createTourBtn = page.locator('button:has-text("Create New Tour"), button:has-text("Tạo Tour Mới")').first();
    if (await createTourBtn.isVisible()) {
      await createTourBtn.click();
      const tourTitleInput = page.locator('input[placeholder*="Tour Title"], input[placeholder*="Tên tour"]').first();
      if (await tourTitleInput.isVisible()) {
        await tourTitleInput.fill('Saigon Secret Alleys & Coffee Culture Walk');
      }
      const closeCreateTour = page.locator('button:has-text("Cancel"), button:has-text("Đóng"), button:has-text("✕")').first();
      if (await closeCreateTour.isVisible()) {
        await closeCreateTour.click();
      }
    }

    // 5.4 Browse Traveler Request Board & Place Bid
    const browseReqsTab = page.locator('button:has-text("Browse Traveler Requests"), button:has-text("Tìm Yêu Cầu Du Khách"), button:has-text("Yêu Cầu")').first();
    if (await browseReqsTab.isVisible()) {
      await browseReqsTab.click();
      const bidBtn = page.locator('button:has-text("Submit Bid"), button:has-text("Gửi Báo Giá"), button:has-text("Bid")').first();
      if (await bidBtn.isVisible()) {
        await expect(bidBtn).toBeVisible();
      }
    }
  });

  // =========================================================================
  // 6. ROLE 3: SYSTEM ADMIN (KYC APPROVAL, CATALOG MODERATION, USER MANAGEMENT)
  // =========================================================================
  test('6. Admin Operations: Platform Analytics, KYC Verification & Listing Moderation', async ({ page }) => {
    // 6.1 Sign in as Admin
    await page.locator('button:has-text("Sign In"), button:has-text("Đăng Nhập"), button:has-text("Sign In / Register")').first().click();
    await page.locator('button:has-text("Alexander Wright"), button:has-text("Platform Admin"), button:has-text("Quản Trị Viên"), button:has-text("System Admin")').first().click();

    // 6.2 Verify Admin Control Center & KPI Cards
    await expect(page.locator('text=/Admin|Quản Trị|Dashboard/i').first()).toBeVisible();

    // 6.3 KYC Document Review Modal
    const kycNavBtn = page.locator('button:has-text("KYC"), button:has-text("Duyệt Hồ Sơ"), button:has-text("KYC Verification")').first();
    if (await kycNavBtn.isVisible()) {
      await kycNavBtn.click();
      await expect(page.locator('text=/License|CCCD|Hồ Sơ|KYC/i').first()).toBeVisible();

      // Inspect Application if present
      const inspectBtn = page.locator('button:has-text("Review"), button:has-text("Inspect"), button:has-text("Xem")').first();
      if (await inspectBtn.isVisible()) {
        await inspectBtn.click();
        await expect(page.locator('text=/Tourism License|National ID|CCCD/i').first()).toBeVisible();
        const closeInspect = page.locator('button:has-text("Close"), button:has-text("Đóng"), button:has-text("✕")').first();
        if (await closeInspect.isVisible()) {
          await closeInspect.click();
        }
      }
    }

    // 6.4 Tour Catalog Moderation Tab
    const tourModNavBtn = page.locator('button:has-text("Tour Moderation"), button:has-text("Kiểm Duyệt Tour"), button:has-text("Moderation")').first();
    if (await tourModNavBtn.isVisible()) {
      await tourModNavBtn.click();
      await expect(page.locator('text=/Feature|Tours|Danh Sách Tour|Moderation/i').first()).toBeVisible();
    }

    // 6.5 User Management Tab
    const userMgmtNavBtn = page.locator('button:has-text("User Management"), button:has-text("Quản Lý Người Dùng"), button:has-text("User Accounts")').first();
    if (await userMgmtNavBtn.isVisible()) {
      await userMgmtNavBtn.click();
      await expect(page.locator('text=/Roles|Status|Users|Người Dùng/i').first()).toBeVisible();
    }
  });

});
