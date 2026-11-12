import { expect, test, type Page } from '@playwright/test';

const DAY_LABELS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function localDateAndDay() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  const dateKey = local.toISOString().slice(0, 10);
  const dayIndex = (local.getUTCDay() + 6) % 7;
  return { dateKey, dayKey: DAY_LABELS[dayIndex] };
}

function monitorPage(page: Page) {
  const issues: string[] = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const location = message.location().url;
    if (text.includes('401') && (location.includes('/api/auth/me') || text.includes('auth'))) return;
    issues.push(`console: ${text}`);
  });

  page.on('pageerror', (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? '';
    if (failure.includes('ERR_ABORTED')) return;
    issues.push(`requestfailed: ${request.method()} ${request.url()} ${failure}`);
  });

  page.on('response', (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    if (response.status() === 401 && url.includes('/api/auth/me')) return;
    if (response.status() === 401 && !url.includes('/api/')) return;
    issues.push(`response ${response.status()}: ${response.url()}`);
  });

  return issues;
}

async function completeAllSets(page: Page) {
  const checkboxes = page.getByRole('checkbox');
  await expect(checkboxes.first()).toBeVisible({ timeout: 15_000 });
  const count = await checkboxes.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await checkboxes.nth(index).click();
    await page.waitForTimeout(200);
  }
}

test('full workout and diet flow', async ({ page }) => {
  const issues = monitorPage(page);
  const { dayKey } = localDateAndDay();
  const email = `smoke+e2e-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.test`;

  await page.goto('/signup');
  await page.getByLabel('Name').fill('E2E User');
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill('E2ePassword123');
  await page.getByRole('button', { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('button', { name: /Set your weekly workout plan/i })).toBeVisible();

  await page.getByRole('button', { name: /Set your weekly workout plan/i }).click();
  await expect(page).toHaveURL(/\/plan$/);
  await page.locator(`a[href="/plan/${dayKey}"]`).last().click();
  await expect(page).toHaveURL(new RegExp(`/plan/${dayKey}$`));

  await page.getByRole('button', { name: 'Chest', exact: true }).click();
  await expect(page.getByRole('link', { name: /Add exercise/i })).toBeVisible();

  await page.getByRole('link', { name: /Add exercise/i }).click();
  await expect(page).toHaveURL(/\/exercises\?/);
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  await expect(page.getByRole('button', { name: /Add to plan/i })).toBeVisible();
  await page.getByRole('button', { name: /Add to plan/i }).click();
  await expect(page.getByText(/Added to/i).first()).toBeVisible();
  await page.getByRole('link', { name: 'Done', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/plan/${dayKey}$`));

  await page.getByRole('button', { name: 'Add my own', exact: true }).first().click();
  await page.locator('#custom-name').fill('E2E Custom Press');
  await page.getByRole('button', { name: /Add to plan/i }).click();
  await expect(page.locator('#custom-name')).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText('E2E Custom Press').first()).toBeVisible();

  await page.goto('/dashboard');
  await page.getByRole('button', { name: /Start today/i }).click();
  await expect(page).toHaveURL(/\/workout$/);

  const exerciseLinks = page.locator('a[href^="/workout/exercise/"]');
  await expect(exerciseLinks).toHaveCount(2);
  await exerciseLinks.nth(0).click();
  await expect(page).toHaveURL(/\/workout\/exercise\//);
  await completeAllSets(page);
  await expect(page).toHaveURL(/\/workout$/, { timeout: 15_000 });

  await page.locator('a[href^="/workout/exercise/"]').nth(1).click();
  await expect(page).toHaveURL(/\/workout\/exercise\//);
  await completeAllSets(page);
  await expect(page).toHaveURL(/\/workout$/, { timeout: 15_000 });

  await expect(page.getByText('Workout complete').first()).toBeVisible();
  await page.getByRole('button', { name: /Finish & save/i }).click();
  await expect(page.getByText('Exercise results')).toBeVisible();

  await page.goto('/progress');
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(page.getByText('Consistency').first()).toBeVisible();

  await page.goto('/diet/assistant');
  await expect(page.getByRole('heading', { name: 'Diet assistant' })).toBeVisible();
  await expect(page.getByText(/left today/)).toBeVisible();
  await page.getByRole('button', { name: /^Generate$/ }).click();
  await expect(page.getByText('Draft plan')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Add to my diet plan/i }).click();
  await expect(page).toHaveURL(/\/diet\/plan$/);

  expect(issues, `Browser issues:\n${issues.join('\n')}`).toEqual([]);
});
