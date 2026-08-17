import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Playwright Video Recording Script for AI Tour Planner ✨ Flow
 * 
 * Flow:
 * 1. Open App UI at http://localhost:3001
 * 2. Visual cursor moves to & clicks "AI Tour Planner ✨"
 * 3. Select Destination: Ho Chi Minh City
 * 4. Select Vibe: Artisan Coffee, Secret Speakeasies & Photography
 * 5. Click "Generate Smart Itinerary"
 * 6. Observe Golden micro-particles radiating VFX & multi-day plan real-time streaming
 * 7. Drag budget slider to $85 USD
 * 8. Click "Convert into Public Trip Request"
 */

test.use({
  video: {
    mode: 'on',
    size: { width: 1280, height: 800 }
  },
  viewport: { width: 1280, height: 800 }
});

test('Record AI Tour Planner ✨ interactive journey with Golden VFX', async ({ page }) => {
  // Ensure video directory exists
  const videoDir = path.join(process.cwd(), 'playwright-videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Inject visual mouse cursor helper into the DOM to visually depict user cursor clicks & drags
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div');
      cursor.id = 'playwright-visual-cursor';
      cursor.style.position = 'fixed';
      cursor.style.top = '0px';
      cursor.style.left = '0px';
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.borderRadius = '50%';
      cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
      cursor.style.border = '2px solid white';
      cursor.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.9)';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transition = 'transform 0.1s ease, width 0.15s, height 0.15s, background-color 0.15s';
      cursor.style.transform = 'translate(-50%, -50%)';
      document.body.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });

      window.addEventListener('mousedown', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.75)';
        cursor.style.backgroundColor = 'rgba(245, 158, 11, 0.95)';
      });

      window.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
      });
    });
  });

  // Helper function for smooth mouse movement
  const smoothMouseMove = async (targetX: number, targetY: number, steps = 15) => {
    await page.mouse.move(targetX, targetY, { steps });
  };

  // Step 1: Navigate to application homepage
  console.log('Navigating to http://localhost:3001...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Step 2: Cursor moves to and clicks "AI Tour Planner ✨"
  const aiPlannerBtn = page.locator('#ai-tour-planner-btn, button:has-text("AI Tour Planner ✨")').first();
  await expect(aiPlannerBtn).toBeVisible({ timeout: 10000 });

  const aiBtnBox = await aiPlannerBtn.boundingBox();
  if (aiBtnBox) {
    await smoothMouseMove(aiBtnBox.x + aiBtnBox.width / 2, aiBtnBox.y + aiBtnBox.height / 2, 20);
    await page.waitForTimeout(400);
  }
  await aiPlannerBtn.click();
  await page.waitForTimeout(800);

  // Verify AI Tour Planner modal is open
  const modalHeader = page.locator('h2:has-text("AI Tour Planner")').first();
  await expect(modalHeader).toBeVisible();

  // Step 3: Pick Destination: Ho Chi Minh City
  const destSelect = page.locator('#destination-select').first();
  await expect(destSelect).toBeVisible();
  const destBox = await destSelect.boundingBox();
  if (destBox) {
    await smoothMouseMove(destBox.x + destBox.width / 2, destBox.y + destBox.height / 2, 15);
    await page.waitForTimeout(300);
  }
  await destSelect.selectOption('Ho Chi Minh City');
  await page.waitForTimeout(600);

  // Step 4: Pick Vibe: Artisan Coffee, Secret Speakeasies & Photography
  const vibeSelect = page.locator('#vibe-select').first();
  await expect(vibeSelect).toBeVisible();
  const vibeBox = await vibeSelect.boundingBox();
  if (vibeBox) {
    await smoothMouseMove(vibeBox.x + vibeBox.width / 2, vibeBox.y + vibeBox.height / 2, 15);
    await page.waitForTimeout(300);
  }
  await vibeSelect.selectOption('Artisan Coffee, Secret Speakeasies & Photography');
  await page.waitForTimeout(600);

  // Step 5: Click "Generate Smart Itinerary"
  const generateBtn = page.locator('#generate-itinerary-btn, button:has-text("Generate Smart Itinerary")').first();
  await expect(generateBtn).toBeVisible();
  const genBox = await generateBtn.boundingBox();
  if (genBox) {
    await smoothMouseMove(genBox.x + genBox.width / 2, genBox.y + genBox.height / 2, 15);
    await page.waitForTimeout(400);
  }
  await generateBtn.click();

  // Step 6: VFX Golden micro-particles radiate & multi-day plan streams onto screen in real-time
  console.log('Observing Golden micro-particles VFX & real-time streaming...');
  await page.waitForTimeout(4000);

  // Verify itinerary summary card is visible
  const itineraryTitle = page.locator('h3:has-text("Custom 3-Day Ho Chi Minh City Speakeasy")').first();
  await expect(itineraryTitle).toBeVisible();

  // Step 7: Drag budget slider to $85 USD
  const budgetSlider = page.locator('#budget-slider').first();
  await expect(budgetSlider).toBeVisible();
  const sliderBox = await budgetSlider.boundingBox();

  if (sliderBox) {
    const startX = sliderBox.x + sliderBox.width * 0.5;
    const startY = sliderBox.y + sliderBox.height / 2;
    await smoothMouseMove(startX, startY, 15);
    await page.mouse.down();
    
    // Calculate target position for $85 (min 30, max 250, total range 220) -> ($85-30)/220 = 55/220 = 25% of width
    const targetX = sliderBox.x + sliderBox.width * 0.25;
    await smoothMouseMove(targetX, startY, 15);
    await page.mouse.up();
    await page.waitForTimeout(300);
  }

  // Explicitly set slider value to 85 to ensure badge shows $85 USD
  await page.evaluate(() => {
    const slider = document.querySelector('#budget-slider') as HTMLInputElement;
    if (slider) {
      slider.value = '85';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await page.waitForTimeout(1000);
  await expect(page.locator('#budget-value-badge')).toHaveText('$85 USD');

  // Step 8: Click "Convert into Public Trip Request"
  const convertBtn = page.locator('#convert-trip-request-btn, button:has-text("Convert into Public Trip Request")').first();
  await expect(convertBtn).toBeVisible();
  const convertBox = await convertBtn.boundingBox();
  if (convertBox) {
    await smoothMouseMove(convertBox.x + convertBox.width / 2, convertBox.y + convertBox.height / 2, 15);
    await page.waitForTimeout(400);
  }
  await convertBtn.click();

  // Verify conversion success message
  await expect(page.locator('text=Successfully converted into a Public Trip Request')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(2500);

  // Close page & save video
  const videoPath = await page.video()?.path();
  console.log('Recorded video path:', videoPath);
});
