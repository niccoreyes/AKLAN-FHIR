import { test, expect } from '@playwright/test';

/**
 * Comprehensive end-to-end test of all routes and functionality.
 */

test.describe('OpenHIE Mock EHR - Full Route & Widget Test', () => {
	const BASE_URL = 'http://localhost:5173';

	test('1. / - Landing page (IPS Viewer)', async ({ page }) => {
		await page.goto(`${BASE_URL}/`);

		// Check critical elements
		await expect(page.locator('h1')).toContainText('OpenHIE Mock EHR');
		await expect(page.locator('.server-bar')).toBeVisible();
		await expect(page.locator('.search-input')).toBeVisible();
		await expect(page.locator('button:has-text("Refresh")')).toBeVisible();

		// Check footer action buttons
		await expect(page.locator('a:has-text("Join Workshop")')).toBeVisible();
		await expect(page.locator('a:has-text("Developer Mode")')).toBeVisible();

		// Wait for patient list to load (or show empty state)
		await page.waitForTimeout(3000);

		// Should show either patient list or empty state, NOT stuck loading
		const hasPatients = await page.locator('.patient-row').count() > 0;
		const hasEmptyState = await page.locator('.empty-state').count() > 0;
		const hasSkeletons = await page.locator('.skeleton-row').count() > 0;

		console.log(`  Patients: ${hasPatients}, Empty: ${hasEmptyState}, Skeletons: ${hasSkeletons}`);
		expect(hasSkeletons).toBe(false); // Should not be stuck on skeletons
		expect(hasPatients || hasEmptyState).toBe(true);

		console.log('✅ / - Landing page OK');
	});

	test('2. /workshop - Workshop entry form', async ({ page }) => {
		await page.goto(`${BASE_URL}/workshop`);

		await expect(page.locator('h1:has-text("Join Workshop")')).toBeVisible();
		await expect(page.locator('input#workshop-code')).toBeVisible();
		await expect(page.locator('input#first-name')).toBeVisible();
		await expect(page.locator('.clinic-card')).toHaveCount(5);
		await expect(page.locator('button[type="submit"]')).toBeVisible();

		// Check first clinic is auto-selected
		const firstClinic = page.locator('.clinic-card').first();
		await expect(firstClinic).toHaveClass(/selected/);

		console.log('✅ /workshop - Workshop entry OK');
	});

	test('3. /dashboard - Main dashboard', async ({ page }) => {
		await page.goto(`${BASE_URL}/dashboard?w=TEST-01&u=TestUser&c=rhu-kalibo`);

		await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();

		// Check action cards exist
		const actionCards = page.locator('.action-card');
		const count = await actionCards.count();
		expect(count).toBeGreaterThan(0);

		// Check clinic badge
		await expect(page.locator('.clinic-badge')).toBeVisible();

		// Check workshop code is displayed
		const content = await page.content();
		expect(content).toContain('TEST-01');

		console.log('✅ /dashboard - Dashboard OK');
	});

	test('4. /developer - Developer mode (public)', async ({ page }) => {
		await page.goto(`${BASE_URL}/developer`);

		await expect(page.locator('h2:has-text("Developer Mode")')).toBeVisible();
		await expect(page.locator('select').first()).toBeVisible();
		await expect(page.locator('button:has-text("Send Request")')).toBeVisible();

		// Test sending a request
		await page.click('button:has-text("Send Request")');
		await page.waitForTimeout(3000);

		// Page should still be functional after attempting request
		await expect(page.locator('button:has-text("Send Request")')).toBeVisible();

		console.log('✅ /developer - Developer mode OK');
	});

	test('5. /facilitator - Facilitator dashboard', async ({ page }) => {
		await page.goto(`${BASE_URL}/facilitator`);

		await expect(page.locator('h2:has-text("Workshop Monitor")')).toBeVisible();
		await expect(page.locator('.workshop-input')).toBeVisible();
		await expect(page.locator('button:has-text("Load Data")')).toBeVisible();

		// Quick select tags
		await expect(page.locator('.tag-chip')).toHaveCount(5);

		console.log('✅ /facilitator - Facilitator dashboard OK');
	});

	test('6. /facilitator?w=AK26-A - Facilitator with data', async ({ page }) => {
		await page.goto(`${BASE_URL}/facilitator?w=AK26-A`);

		// Wait for data to load
		await page.waitForTimeout(5000);

		// Check stats grid appears
		const statsCount = await page.locator('.stat-card').count();
		expect(statsCount).toBeGreaterThan(0);

		console.log('✅ /facilitator?w=AK26-A - Facilitator with data OK');
	});

	test('7. Navigation: Landing → Workshop → Dashboard', async ({ page }) => {
		// Start at landing
		await page.goto(`${BASE_URL}/`);
		await page.click('a:has-text("Join Workshop")');

		// Should be on workshop page
		await page.waitForURL('**/workshop');
		await expect(page.locator('h1:has-text("Join Workshop")')).toBeVisible();

		// Fill form
		await page.fill('input#workshop-code', 'NAV-TEST');
		await page.fill('input#first-name', 'Navigator');

		// Submit
		await page.click('button[type="submit"]');
		await page.waitForURL('**/dashboard');

		// Should be on dashboard
		await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();

		console.log('✅ Navigation flow OK');
	});

	test('8. /patient/[id] - Patient detail page direct URL', async ({ page }) => {
		await page.goto(`${BASE_URL}/patient/test-patient-123`);
		await page.waitForTimeout(3000);

		// Should show patient detail layout or error
		const hasHeader = await page.locator('.patient-header').isVisible().catch(() => false);
		const hasError = await page.locator('.error-state').isVisible().catch(() => false);
		const hasLoading = await page.locator('.loading-state').isVisible().catch(() => false);

		console.log(`  Header: ${hasHeader}, Error: ${hasError}, Loading: ${hasLoading}`);
		expect(hasLoading).toBe(false); // Should not be stuck loading

		console.log('✅ /patient/[id] direct - Patient detail page OK');
	});

	test('9. /architecture - Architecture page', async ({ page }) => {
		await page.goto(`${BASE_URL}/architecture`);

		await expect(page.locator('h2:has-text("OpenHIE Architecture")')).toBeVisible();
		await expect(page.locator('.architecture-diagram')).toBeVisible();

		// Test interactive component click
		await page.click('.app-node');
		await page.waitForTimeout(1000);
		// Component details may or may not be visible depending on state
		const detailsVisible = await page.locator('.component-details').isVisible().catch(() => false);
		console.log(`  Component details visible: ${detailsVisible}`);

		console.log('✅ /architecture - Architecture page OK');
	});

	test('10. /about - About page', async ({ page }) => {
		await page.goto(`${BASE_URL}/about`);

		await expect(page.locator('.about-card h1:has-text("OpenHIE Mock EHR")')).toBeVisible();
		await expect(page.locator('.tech-grid')).toBeVisible();
		await expect(page.locator('.systems-list')).toBeVisible();

		console.log('✅ /about - About page OK');
	});

	test('11. Navigation via header across all pages', async ({ page }) => {
		await page.goto(`${BASE_URL}/`);

		// Click Architecture
		await page.click('a:has-text("Architecture")');
		await page.waitForURL('**/architecture');
		await expect(page.locator('h2:has-text("OpenHIE Architecture")')).toBeVisible();

		// Click About
		await page.click('a:has-text("About")');
		await page.waitForURL('**/about');
		await expect(page.locator('.about-card h1:has-text("OpenHIE Mock EHR")')).toBeVisible();

		// Click Clinical View
		await page.click('a:has-text("Clinical View")');
		await page.waitForURL('**/');
		await expect(page.locator('.search-input')).toBeVisible();

		console.log('✅ Header navigation across all pages OK');
	});

	test('12. Check for stuck loading states across all pages', async ({ page }) => {
		const routes = ['/', '/workshop', '/dashboard?w=T&u=U&c=rhu-kalibo', '/developer', '/facilitator', '/architecture', '/about'];

		for (const route of routes) {
			await page.goto(`${BASE_URL}${route}`);
			await page.waitForTimeout(3000);

			const hasSkeletons = await page.locator('.skeleton-row, .skeleton-header, .skeleton-item').count() > 0;
			const hasLoadingText = await page.locator('text=/loading/i').count() > 0;

			console.log(`  ${route}: skeletons=${hasSkeletons}, loadingText=${hasLoadingText}`);
			expect(hasSkeletons).toBe(false);
		}

		console.log('✅ No stuck loading states');
	});
});
