# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> OpenHIE Mock EHR - Basic Tests >> can fill and submit workshop entry form
- Location: tests/app.spec.js:46:2

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button disabled type="submit" data-loading="false" data-has-clinic="true" data-has-workshop="false" data-has-username="false" class="submit svelte-1qiizl6">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e6]:
  - banner [ref=e7]:
    - link "← Public Viewer" [ref=e9] [cursor=pointer]:
      - /url: /
    - heading "🎓 Join Workshop" [level=1] [ref=e10]
    - paragraph [ref=e11]: OpenHIE Mock EHR
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]: Workshop Code
      - textbox "Workshop Code" [ref=e16]:
        - /placeholder: Type or select a workshop code...
      - generic [ref=e17]:
        - generic [ref=e18]: "Quick select:"
        - generic [ref=e19]:
          - button "AK26-A" [ref=e20] [cursor=pointer]
          - button "AK26-B" [ref=e21] [cursor=pointer]
          - button "AK26-C" [ref=e22] [cursor=pointer]
          - button "AK26-D" [ref=e23] [cursor=pointer]
          - button "AK26-E" [ref=e24] [cursor=pointer]
    - generic [ref=e25]:
      - generic [ref=e26]: First Name
      - textbox "First Name" [active] [ref=e27]:
        - /placeholder: Enter your first name
        - text: TestUser
    - generic [ref=e28]:
      - generic [ref=e29]: Select Clinic
      - generic [ref=e30]:
        - button "🏥 RHU Kalibo Rural Health Unit" [ref=e31] [cursor=pointer]:
          - generic [ref=e32]: 🏥
          - generic [ref=e33]: RHU Kalibo
          - generic [ref=e34]: Rural Health Unit
        - button "🏥 Aklan Provincial Provincial Hospital" [ref=e35] [cursor=pointer]:
          - generic [ref=e36]: 🏥
          - generic [ref=e37]: Aklan Provincial
          - generic [ref=e38]: Provincial Hospital
        - button "🏥 RHU Malay Rural Health Unit" [ref=e39] [cursor=pointer]:
          - generic [ref=e40]: 🏥
          - generic [ref=e41]: RHU Malay
          - generic [ref=e42]: Rural Health Unit
        - button "🧪 Kalibo Lab Diagnostic Center" [ref=e43] [cursor=pointer]:
          - generic [ref=e44]: 🧪
          - generic [ref=e45]: Kalibo Lab
          - generic [ref=e46]: Diagnostic Center
        - button "💊 Aklan Pharmacy Pharmacy" [ref=e47] [cursor=pointer]:
          - generic [ref=e48]: 💊
          - generic [ref=e49]: Aklan Pharmacy
          - generic [ref=e50]: Pharmacy
    - generic [ref=e51]:
      - generic [ref=e52]: Select Your Role (Optional)
      - generic [ref=e53]:
        - button "📝 Registration Clerk Register new patients" [ref=e54] [cursor=pointer]:
          - generic [ref=e55]: 📝
          - generic [ref=e56]:
            - generic [ref=e57]: Registration Clerk
            - generic [ref=e58]: Register new patients
        - button "👩‍⚕️ Nurse / BHW Record vital signs and assessments" [ref=e59] [cursor=pointer]:
          - generic [ref=e60]: 👩‍⚕️
          - generic [ref=e61]:
            - generic [ref=e62]: Nurse / BHW
            - generic [ref=e63]: Record vital signs and assessments
        - button "👨‍⚕️ Physician Diagnose and create referrals" [ref=e64] [cursor=pointer]:
          - generic [ref=e65]: 👨‍⚕️
          - generic [ref=e66]:
            - generic [ref=e67]: Physician
            - generic [ref=e68]: Diagnose and create referrals
        - button "🧪 Lab Technician Process lab orders and results" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: 🧪
          - generic [ref=e71]:
            - generic [ref=e72]: Lab Technician
            - generic [ref=e73]: Process lab orders and results
        - button "💊 Pharmacist Dispense medications" [ref=e74] [cursor=pointer]:
          - generic [ref=e75]: 💊
          - generic [ref=e76]:
            - generic [ref=e77]: Pharmacist
            - generic [ref=e78]: Dispense medications
    - button "🚀 Enter EHR System" [disabled] [ref=e79]:
      - generic [ref=e80]: 🚀 Enter EHR System
  - contentinfo [ref=e81]:
    - link "← Public Viewer" [ref=e83] [cursor=pointer]:
      - /url: /
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('OpenHIE Mock EHR - Basic Tests', () => {
  4   | 	test('landing page loads correctly', async ({ page }) => {
  5   | 		await page.goto('/');
  6   | 
  7   | 		// Check title
  8   | 		await expect(page).toHaveTitle(/OpenHIE Mock EHR/);
  9   | 
  10  | 		// Check main heading
  11  | 		await expect(page.locator('h1')).toContainText('OpenHIE Mock EHR');
  12  | 
  13  | 		// Check server status bar
  14  | 		await expect(page.locator('.server-bar')).toBeVisible();
  15  | 
  16  | 		// Check search input for patients
  17  | 		await expect(page.locator('input[placeholder*="Search patients" i]')).toBeVisible();
  18  | 
  19  | 		// Check refresh button
  20  | 		await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
  21  | 
  22  | 		// Check footer action buttons
  23  | 		await expect(page.locator('a:has-text("Join Workshop")')).toBeVisible();
  24  | 		await expect(page.locator('a:has-text("Developer Mode")')).toBeVisible();
  25  | 
  26  | 		console.log('✅ Landing page (IPS viewer) loaded successfully');
  27  | 	});
  28  | 
  29  | 	test('workshop entry page loads correctly', async ({ page }) => {
  30  | 		await page.goto('/workshop');
  31  | 
  32  | 		// Check title
  33  | 		await expect(page).toHaveTitle(/OpenHIE Mock EHR/);
  34  | 
  35  | 		// Check form inputs
  36  | 		await expect(page.locator('input#workshop-code')).toBeVisible();
  37  | 		await expect(page.locator('input#first-name')).toBeVisible();
  38  | 
  39  | 		// Check clinic selection buttons
  40  | 		const clinicButtons = page.locator('button.clinic-card').first();
  41  | 		await expect(clinicButtons).toBeVisible();
  42  | 
  43  | 		console.log('✅ Workshop entry page loaded successfully');
  44  | 	});
  45  | 
  46  | 	test('can fill and submit workshop entry form', async ({ page }) => {
  47  | 		await page.goto('/workshop');
  48  | 
  49  | 		// Fill workshop code
  50  | 		await page.fill('input#workshop-code', 'TEST-01');
  51  | 		
  52  | 		// Fill name
  53  | 		await page.fill('input#first-name', 'TestUser');
  54  | 
  55  | 		// Click submit button (first clinic is auto-selected)
> 56  | 		await page.click('button[type="submit"]');
      |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  57  | 
  58  | 		// Wait for navigation to dashboard
  59  | 		await page.waitForURL('**/dashboard');
  60  | 
  61  | 		// Check URL
  62  | 		const url = page.url();
  63  | 		console.log('✅ Form submitted, URL:', url);
  64  | 
  65  | 		// Should be on dashboard
  66  | 		expect(url).toContain('/dashboard');
  67  | 	});
  68  | 
  69  | 	test('dashboard page has correct elements', async ({ page }) => {
  70  | 		// Navigate directly with params
  71  | 		await page.goto('/dashboard?w=TEST-01&u=TestUser&c=rhu-kalibo');
  72  | 
  73  | 		// Wait for page to load
  74  | 		await page.waitForTimeout(1500);
  75  | 
  76  | 		// Check for dashboard elements
  77  | 		const header = page.locator('h1:has-text("What do you want to do")');
  78  | 		await expect(header).toBeVisible();
  79  | 
  80  | 		// Check action cards exist
  81  | 		const actionCards = page.locator('a[class*="action-card"], button[class*="action-card"]');
  82  | 		const count = await actionCards.count();
  83  | 		expect(count).toBeGreaterThan(0);
  84  | 
  85  | 		// Check workshop code is displayed somewhere
  86  | 		const pageContent = await page.content();
  87  | 		expect(pageContent).toContain('TEST-01');
  88  | 
  89  | 		console.log('✅ Dashboard loaded with', count, 'action cards');
  90  | 	});
  91  | 
  92  | 	test('developer mode is accessible', async ({ page }) => {
  93  | 		// Navigate to developer page
  94  | 		await page.goto('/developer');
  95  | 
  96  | 		// Wait for page to load
  97  | 		await page.waitForTimeout(1500);
  98  | 
  99  | 		// Check for developer page elements
  100 | 		const devHeader = page.locator('h1:has-text("Developer Mode")');
  101 | 		const isVisible = await devHeader.isVisible().catch(() => false);
  102 | 
  103 | 		if (!isVisible) {
  104 | 			console.log('⚠️ Developer page header not found, checking for redirect...');
  105 | 			const url = page.url();
  106 | 			console.log('Current URL:', url);
  107 | 			expect(url).toMatch(/localhost:5173/);
  108 | 		} else {
  109 | 			// Check method selector
  110 | 			await expect(page.locator('select').first()).toBeVisible();
  111 | 
  112 | 			// Check send button
  113 | 			await expect(page.locator('button:has-text("Send Request")')).toBeVisible();
  114 | 
  115 | 			console.log('✅ Developer mode accessible');
  116 | 		}
  117 | 	});
  118 | 
  119 | 	test('terminology server is reachable', async ({ page }) => {
  120 | 		await page.goto('/developer');
  121 | 
  122 | 		// Wait for page to load
  123 | 		await page.waitForTimeout(2000);
  124 | 
  125 | 		// Check if we're on the developer page
  126 | 		const sendButton = page.locator('button:has-text("Send Request")').first();
  127 | 		const isOnDevPage = await sendButton.isVisible().catch(() => false);
  128 | 
  129 | 		if (!isOnDevPage) {
  130 | 			console.log('⚠️ Not on developer page, skipping terminology test');
  131 | 			return;
  132 | 		}
  133 | 
  134 | 		// Click Send with default GET request to test connectivity
  135 | 		await page.click('button:has-text("Send Request")');
  136 | 
  137 | 		// Wait for response
  138 | 		await page.waitForTimeout(3000);
  139 | 
  140 | 		// Check if we got any response
  141 | 		const pageContent = await page.content();
  142 | 		const hasResponse = pageContent.includes('200') ||
  143 | 			                  pageContent.includes('Response') ||
  144 | 			                  pageContent.includes('status');
  145 | 
  146 | 		if (hasResponse) {
  147 | 			console.log('✅ Terminology/FHIR server responded');
  148 | 		} else {
  149 | 			console.log('⚠️ No response data visible in UI');
  150 | 		}
  151 | 
  152 | 		// The test passes if the page loaded and we attempted a request
  153 | 		expect(isOnDevPage).toBe(true);
  154 | 	});
  155 | 
  156 | 	test('FHIR logs panel can be toggled and appears on all pages', async ({ page }) => {
```