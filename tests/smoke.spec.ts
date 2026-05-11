import { test, expect, Page } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
  });

  async function login(page: Page) {
    await page.goto('/');

    // Step 1: Enter phone
    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.waitFor({ state: 'visible' });
    await phoneInput.fill('8787311620');
    await page.click('button:has-text("Request OTP")');

    // Step 2: Enter OTP
    await expect(page.locator('text=Enter your OTP')).toBeVisible({ timeout: 15000 });
    // Use fill on the specific input instead of global keyboard to avoid focus races
    const otpInput = page.locator('input[type="tel"]').first();
    await otpInput.fill('123456');
    await page.click('button:has-text("Continue")');

    // Step 3: Handle MPIN if prompted
    const mpinText = page.locator('text=Welcome back');
    if (await mpinText.isVisible({ timeout: 10000 }).catch(() => false)) {
      const mpinInput = page.locator('input[type="tel"]').first();
      await mpinInput.fill('8787');
      await page.click('button:has-text("Unlock")');
    }

    await expect(page).toHaveURL(/.*home/, { timeout: 20000 });
  }

  test('Login flow', async ({ page }) => {
    await login(page);
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('Logout flow', async ({ page }) => {
    await login(page);
    await page.goto('/more');
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('Skeleton loading states', async ({ page }) => {
    await login(page);
    await page.goto('/order-history');
    const skeleton = page.getByTestId('base-list-skeleton');
    await expect(skeleton).toBeVisible();
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });
  });

  test('Navigation smoke', async ({ page }) => {
    await login(page);
    const pages = ['/rewards', '/settings', '/saved-addresses'];
    for (const route of pages) {
      await page.goto(route);
      await expect(page.locator('body')).not.toContainText('Something went wrong');
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });
});
