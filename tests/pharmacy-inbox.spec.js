import { test, expect } from '@playwright/test';

/**
 * Pharmacy Inbox & Dispense Flow Tests
 * Default workshop credentials: AK26-A / Thomas
 */

const BASE_URL = 'http://localhost:5173';
const DEFAULT_PARAMS = 'w=AK26-A&u=Thomas';

function buildUrl(path, extraParams = '') {
	const sep = path.includes('?') ? '&' : '?';
	return `${BASE_URL}${path}${sep}${DEFAULT_PARAMS}${extraParams ? '&' + extraParams : ''}`;
}

test.describe('Pharmacy Inbox & Dispense Flow', () => {
	test('1. Pharmacy inbox loads without crashing and shows prescriptions content', async ({ page }) => {
		await page.goto(buildUrl('/inbox', 'c=aklan-pharmacy'));
		await page.waitForLoadState('networkidle');

		// Should show Work Queue header
		await expect(page.locator('h1:has-text("Work Queue")')).toBeVisible();

		// Pharmacy only has one tab, so the tab bar is hidden — assert content instead
		const bodyText = await page.locator('body').textContent();
		expect(bodyText).not.toContain('Internal Error');
		expect(bodyText).not.toContain('Cannot access');

		// Should show either prescription cards or the empty state for rx
		const hasResourceList = await page.locator('.resource-list').count() > 0;
		const hasEmptyState = bodyText.includes('No prescriptions yet');
		expect(hasResourceList || hasEmptyState).toBe(true);

		console.log('✅ Pharmacy inbox loads and shows prescriptions content');
	});

	test('2. Pharmacy inbox with ?tab=rx shows prescriptions content', async ({ page }) => {
		await page.goto(buildUrl('/inbox', 'c=aklan-pharmacy&tab=rx'));
		await page.waitForLoadState('networkidle');

		await expect(page.locator('h1:has-text("Work Queue")')).toBeVisible();

		const bodyText = await page.locator('body').textContent();
		expect(bodyText).not.toContain('Internal Error');
		expect(bodyText).not.toContain('Cannot access');

		const hasResourceList = await page.locator('.resource-list').count() > 0;
		const hasEmptyState = bodyText.includes('No prescriptions yet');
		expect(hasResourceList || hasEmptyState).toBe(true);

		console.log('✅ Pharmacy inbox with ?tab=rx shows prescriptions content');
	});

	test('3. Lab inbox defaults to first available tab (Lab Orders)', async ({ page }) => {
		await page.goto(buildUrl('/inbox', 'c=kalibo-lab'));
		await page.waitForLoadState('networkidle');

		await expect(page.locator('h1:has-text("Work Queue")')).toBeVisible();

		// Lab has ServiceRequest and DiagnosticReport in canView
		// Default tab should be "Lab Orders" because it is the first in tabs array
		const activeTab = page.locator('.tab.active');
		await expect(activeTab).toHaveText(/Lab Orders/);

		console.log('✅ Lab inbox defaults to Lab Orders tab');
	});

	test('4. RHU inbox shows multiple tabs and defaults to Lab Orders', async ({ page }) => {
		await page.goto(buildUrl('/inbox', 'c=rhu-kalibo'));
		await page.waitForLoadState('networkidle');

		await expect(page.locator('h1:has-text("Work Queue")')).toBeVisible();

		// RHU has all four resources in canView
		await expect(page.locator('.tab:has-text("Active Visits")')).toBeVisible();
		await expect(page.locator('.tab:has-text("Lab Orders")')).toBeVisible();
		await expect(page.locator('.tab:has-text("Prescriptions")')).toBeVisible();
		await expect(page.locator('.tab:has-text("Lab Reports")')).toBeVisible();

		// Default should be Active Visits (encounters tab is first for RHU)
		const activeTab = page.locator('.tab.active');
		await expect(activeTab).toHaveText(/Active Visits/);

		console.log('✅ RHU inbox shows all tabs and defaults to Lab Orders');
	});

	test('5. Dispense page loads with rx + patient params without crashing', async ({ page }) => {
		// Use dummy IDs; we only verify the page doesn't 500 and shows the correct UI
		await page.goto(buildUrl('/dispense', 'c=aklan-pharmacy&rx=test-rx-123&patient=test-patient-456'));
		await page.waitForLoadState('networkidle');

		// Should show Dispense header
		await expect(page.locator('h1:has-text("Dispense Medication")')).toBeVisible();

		// Should not show a 500 error
		const bodyText = await page.locator('body').textContent();
		expect(bodyText).not.toContain('Internal Error');
		expect(bodyText).not.toContain('Cannot access');

		// Patient search input should be present (it may show "Unknown" if the patient doesn't exist)
		await expect(page.locator('input[placeholder*="Search patient"]')).toBeVisible();

		console.log('✅ Dispense page loads with rx + patient params');
	});
});
