# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-workflow.spec.js >> OpenHIE Mock EHR - Workshop Workflow Tests >> 3. Patient search page
- Location: tests/workshop-workflow.spec.js:62:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/dashboard" until "load"
  navigated to "http://localhost:5173/dashboard?w=AK26-A&u=Thomas&c=rhu-kalibo"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - banner [ref=e6]:
      - button "🏥 RHU Kalibo ↻" [ref=e8] [cursor=pointer]:
        - generic [ref=e9]: 🏥
        - generic [ref=e10]: RHU Kalibo
        - generic [ref=e11]: ↻
      - strong [ref=e13]: Thomas
      - button "👁️" [ref=e14] [cursor=pointer]
      - button "🚪" [ref=e15] [cursor=pointer]
      - button "📡 Logs" [ref=e16] [cursor=pointer]:
        - generic [ref=e17]: 📡
        - generic [ref=e18]: Logs
    - main [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: 🏥
        - generic [ref=e23]:
          - strong [ref=e24]: RHU Kalibo
          - paragraph [ref=e25]: Primary care — register patients, record visits, order labs, view results, refer to hospital
      - heading "What do you want to do?" [level=1] [ref=e26]
      - generic [ref=e27]:
        - link "➕ Register Patient Add new person to SHR" [ref=e28] [cursor=pointer]:
          - /url: /patient/new?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e29]: ➕
          - generic [ref=e30]:
            - strong [ref=e31]: Register Patient
            - generic [ref=e32]: Add new person to SHR
        - link "🔍 Find Patient Search by name or ID" [ref=e33] [cursor=pointer]:
          - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e34]: 🔍
          - generic [ref=e35]:
            - strong [ref=e36]: Find Patient
            - generic [ref=e37]: Search by name or ID
        - link "📋 Record Visit Document encounter" [ref=e38] [cursor=pointer]:
          - /url: /encounter?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e39]: 📋
          - generic [ref=e40]:
            - strong [ref=e41]: Record Visit
            - generic [ref=e42]: Document encounter
        - link "🩺 Record Vitals BP, HR, Temperature" [ref=e43] [cursor=pointer]:
          - /url: /vitals?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e44]: 🩺
          - generic [ref=e45]:
            - strong [ref=e46]: Record Vitals
            - generic [ref=e47]: BP, HR, Temperature
        - link "🧪 Order Labs Create lab orders / referrals" [ref=e48] [cursor=pointer]:
          - /url: /service-request?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e49]: 🧪
          - generic [ref=e50]:
            - strong [ref=e51]: Order Labs
            - generic [ref=e52]: Create lab orders / referrals
        - link "💊 Prescribe Create medication orders" [ref=e53] [cursor=pointer]:
          - /url: /medication-request?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e54]: 💊
          - generic [ref=e55]:
            - strong [ref=e56]: Prescribe
            - generic [ref=e57]: Create medication orders
        - link "🔬 View Lab Results Check patient lab reports" [ref=e58] [cursor=pointer]:
          - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e59]: 🔬
          - generic [ref=e60]:
            - strong [ref=e61]: View Lab Results
            - generic [ref=e62]: Check patient lab reports
        - link "💉 View Medications Check prescriptions & dispensed meds" [ref=e63] [cursor=pointer]:
          - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
          - generic [ref=e64]: 💉
          - generic [ref=e65]:
            - strong [ref=e66]: View Medications
            - generic [ref=e67]: Check prescriptions & dispensed meds
      - generic [ref=e68]:
        - heading "🔗 HIE Data Overview" [level=2] [ref=e69]
        - paragraph [ref=e70]:
          - text: Data visible to
          - strong [ref=e71]: RHU Kalibo
          - text: across all clinics
        - generic [ref=e72]:
          - link "1 Patients" [ref=e73] [cursor=pointer]:
            - /url: /patient/search
            - generic [ref=e74]: "1"
            - generic [ref=e75]: Patients
          - link "2 Encounters" [ref=e76] [cursor=pointer]:
            - /url: /patient/search
            - generic [ref=e77]: "2"
            - generic [ref=e78]: Encounters
          - link "1 Lab Orders" [ref=e79] [cursor=pointer]:
            - /url: /inbox?tab=orders
            - generic [ref=e80]: "1"
            - generic [ref=e81]: Lab Orders
          - link "2 Prescriptions" [ref=e82] [cursor=pointer]:
            - /url: /inbox?tab=rx
            - generic [ref=e83]: "2"
            - generic [ref=e84]: Prescriptions
          - link "0 Lab Reports" [ref=e85] [cursor=pointer]:
            - /url: /inbox?tab=reports
            - generic [ref=e86]: "0"
            - generic [ref=e87]: Lab Reports
          - link "2 Dispensed" [ref=e88] [cursor=pointer]:
            - /url: /inbox?tab=dispensed
            - generic [ref=e89]: "2"
            - generic [ref=e90]: Dispensed
      - generic [ref=e91]:
        - generic [ref=e92]:
          - heading "👤 My Patients" [level=2] [ref=e93]
          - generic [ref=e94]: 1 patient
        - generic [ref=e95]:
          - generic: 🔍
          - textbox "Search patients by name, PHID, or condition…" [ref=e96]
        - 'link "👨 Paolo Buenaventura Clara 36 years • male PHID: PH-1777811966817 📋 Check up Today 🩺 HR 80 • Temp 37°C • SpO2 99% • RR 20 • Wt 120kg 🏥 Viral infection, unspecified Updated 2 hr ago Open →" [ref=e98] [cursor=pointer]':
          - /url: /patient/2116?w=AK26-A&u=Thomas&c=rhu-kalibo
          - generic [ref=e99]:
            - generic [ref=e100]: 👨
            - generic [ref=e101]:
              - heading "Paolo Buenaventura Clara" [level=3] [ref=e102]
              - generic [ref=e103]:
                - generic [ref=e104]: 36 years • male
                - generic [ref=e105]: "PHID: PH-1777811966817"
          - generic [ref=e106]:
            - generic [ref=e107]:
              - generic [ref=e108]: 📋
              - generic [ref=e109]:
                - strong [ref=e110]: Check up
                - generic [ref=e111]: Today
            - generic [ref=e112]:
              - generic [ref=e113]: 🩺
              - generic [ref=e114]: HR 80 • Temp 37°C • SpO2 99% • RR 20 • Wt 120kg
            - generic [ref=e115]:
              - generic [ref=e116]: 🏥
              - generic [ref=e117]: Viral infection, unspecified
          - generic [ref=e118]:
            - generic [ref=e119]: Updated 2 hr ago
            - generic [ref=e120]: Open →
      - generic [ref=e121]:
        - paragraph [ref=e122]:
          - text: "🎓 Workshop:"
          - strong [ref=e123]: AK26-A
        - paragraph [ref=e124]:
          - text: "🌐 Group Filter:"
          - button "🏷️ Group Only" [ref=e125] [cursor=pointer]
    - navigation [ref=e126]:
      - link "🏠 Home" [ref=e127] [cursor=pointer]:
        - /url: /dashboard?w=AK26-A&u=Thomas&c=rhu-kalibo
        - generic [ref=e128]: 🏠
        - generic [ref=e129]: Home
      - link "👤 Patients" [ref=e130] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo
        - generic [ref=e131]: 👤
        - generic [ref=e132]: Patients
      - link "📥 Inbox ●" [ref=e133] [cursor=pointer]:
        - /url: /inbox?w=AK26-A&u=Thomas&c=rhu-kalibo
        - generic [ref=e134]: 📥
        - generic [ref=e135]: Inbox
        - generic [ref=e136]: ●
      - link "🔧 Developer" [ref=e137] [cursor=pointer]:
        - /url: /developer?w=AK26-A&u=Thomas&c=rhu-kalibo
        - generic [ref=e138]: 🔧
        - generic [ref=e139]: Developer
  - generic [ref=e140]: Join Workshop - OpenHIE Mock EHR
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('OpenHIE Mock EHR - Workshop Workflow Tests', () => {
  4   |   const workshopCode = 'AK26-A';
  5   |   const userName = 'Thomas';
  6   |   const clinicId = 'rhu-kalibo';
  7   |   
  8   |   test.beforeEach(async ({ page }) => {
  9   |     // Navigate to workshop page
  10  |     await page.goto('/workshop');
  11  |     await page.waitForLoadState('networkidle');
  12  |   });
  13  | 
  14  |   test('1. Workshop login flow', async ({ page }) => {
  15  |     // Fill workshop form using correct selectors
  16  |     await page.fill('#workshop-code', workshopCode);
  17  |     await page.fill('#first-name', userName);
  18  |     
  19  |     // Select clinic by clicking the clinic card
  20  |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  21  |     
  22  |     // Submit form
  23  |     await page.click('button[type="submit"]');
  24  |     
  25  |     // Wait for navigation to dashboard
  26  |     await page.waitForURL('/dashboard', { timeout: 10000 });
  27  |     
  28  |     // Verify dashboard loaded
  29  |     await expect(page.locator('text=What do you want to do?')).toBeVisible();
  30  |     await expect(page.locator(`text=Workshop: ${workshopCode}`)).toBeVisible();
  31  |     // Use more specific selector for username to avoid duplicate text
  32  |     await expect(page.locator('.user-info strong')).toHaveText(userName);
  33  |     
  34  |     console.log('✅ Workshop login successful');
  35  |   });
  36  | 
  37  |   test('2. Dashboard navigation and UI', async ({ page }) => {
  38  |     // First login
  39  |     await page.fill('#workshop-code', workshopCode);
  40  |     await page.fill('#first-name', userName);
  41  |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  42  |     await page.click('button[type="submit"]');
  43  |     await page.waitForURL('/dashboard');
  44  |     
  45  |     // Verify all action cards are visible
  46  |     await expect(page.locator('a:has-text("Find Patient")')).toBeVisible();
  47  |     await expect(page.locator('a:has-text("Register Patient")')).toBeVisible();
  48  |     await expect(page.locator('a:has-text("Record Visit")')).toBeVisible();
  49  |     await expect(page.locator('a:has-text("Record Vitals")')).toBeVisible();
  50  |     
  51  |     // Verify workshop info section
  52  |     await expect(page.locator(`text=${workshopCode}`).first()).toBeVisible();
  53  |     
  54  |     // Test bottom navigation
  55  |     await expect(page.locator('a:has-text("Home")')).toBeVisible();
  56  |     await expect(page.locator('a:has-text("Patients")')).toBeVisible();
  57  |     await expect(page.locator('a:has-text("Developer")')).toBeVisible();
  58  |     
  59  |     console.log('✅ Dashboard navigation OK');
  60  |   });
  61  | 
  62  |   test('3. Patient search page', async ({ page }) => {
  63  |     // Login first
  64  |     await page.fill('#workshop-code', workshopCode);
  65  |     await page.fill('#first-name', userName);
  66  |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  67  |     await page.click('button[type="submit"]');
> 68  |     await page.waitForURL('/dashboard');
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  69  |     
  70  |     // Navigate to patient search
  71  |     await page.click('a:has-text("Find Patient")');
  72  |     await page.waitForURL('/patient/search');
  73  |     
  74  |     // Verify page loaded
  75  |     await expect(page.locator('h1:has-text("Find Patient")')).toBeVisible();
  76  |     await expect(page.locator('input[placeholder*="Filter patients"]')).toBeVisible();
  77  |     await expect(page.locator('button:has-text("Search")')).toBeVisible();
  78  |     
  79  |     // Test search functionality
  80  |     await page.fill('input[placeholder*="Filter patients"]', 'Test');
  81  |     await page.click('button:has-text("Search")');
  82  |     
  83  |     // Wait for results or empty state
  84  |     await page.waitForTimeout(2000);
  85  |     
  86  |     // Should show either results or "No patients found"
  87  |     const hasResults = await page.locator('.patient-card').count() > 0;
  88  |     const hasEmptyState = await page.locator('text=No patients found').isVisible().catch(() => false);
  89  |     
  90  |     expect(hasResults || hasEmptyState).toBe(true);
  91  |     
  92  |     // Verify back button works
  93  |     await page.click('a:has-text("Back to Dashboard")');
  94  |     await page.waitForURL('/dashboard');
  95  |     
  96  |     console.log('✅ Patient search page OK');
  97  |   });
  98  | 
  99  |   test('4. Patient registration page', async ({ page }) => {
  100 |     // Login first
  101 |     await page.fill('#workshop-code', workshopCode);
  102 |     await page.fill('#first-name', userName);
  103 |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  104 |     await page.click('button[type="submit"]');
  105 |     await page.waitForURL('/dashboard');
  106 |     
  107 |     // Navigate to patient registration
  108 |     await page.click('a:has-text("Register Patient")');
  109 |     await page.waitForURL('/patient/new');
  110 |     
  111 |     // Verify page loaded
  112 |     await expect(page.locator('h1:has-text("Register New Patient")')).toBeVisible();
  113 |     await expect(page.locator('input#familyName')).toBeVisible();
  114 |     await expect(page.locator('input#givenName')).toBeVisible();
  115 |     await expect(page.locator('select#gender')).toBeVisible();
  116 |     await expect(page.locator('input#birthDate')).toBeVisible();
  117 |     
  118 |     // Fill out form (but don't submit to avoid creating test data)
  119 |     await page.fill('input#givenName', 'Test');
  120 |     await page.fill('input#familyName', 'Patient');
  121 |     await page.selectOption('select#gender', 'male');
  122 |     await page.fill('input#birthDate', '1990-01-01');
  123 |     await page.fill('input#phId', '1234-5678901-2');
  124 |     
  125 |     // Verify workshop badge is shown
  126 |     await expect(page.locator(`text=${workshopCode}`)).toBeVisible();
  127 |     
  128 |     // Cancel and go back
  129 |     await page.click('a:has-text("Cancel")');
  130 |     await page.waitForURL('/patient/search');
  131 |     
  132 |     console.log('✅ Patient registration page OK');
  133 |   });
  134 | 
  135 |   test('5. Encounter page loads', async ({ page }) => {
  136 |     // Login first
  137 |     await page.fill('#workshop-code', workshopCode);
  138 |     await page.fill('#first-name', userName);
  139 |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  140 |     await page.click('button[type="submit"]');
  141 |     await page.waitForURL('/dashboard');
  142 |     
  143 |     // Navigate to encounter page
  144 |     await page.click('a:has-text("Record Visit")');
  145 |     
  146 |     // Check if page loads or shows error
  147 |     await page.waitForTimeout(2000);
  148 |     
  149 |     // Should either show encounter form or redirect/prompt for patient selection
  150 |     const currentUrl = page.url();
  151 |     console.log('Encounter page URL:', currentUrl);
  152 |     
  153 |     // Verify page doesn't show 404
  154 |     const has404 = await page.locator('text=404').isVisible().catch(() => false);
  155 |     const hasNotFound = await page.locator('text=Not Found').isVisible().catch(() => false);
  156 |     
  157 |     if (has404 || hasNotFound) {
  158 |       throw new Error('Encounter page shows 404 error');
  159 |     }
  160 |     
  161 |     // Should show something (either form or message about selecting patient)
  162 |     const hasContent = await page.locator('h1, h2, .page-header, form').count() > 0;
  163 |     expect(hasContent).toBe(true);
  164 |     
  165 |     console.log('✅ Encounter page accessible');
  166 |   });
  167 | 
  168 |   test('6. Vitals page loads', async ({ page }) => {
```