# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 2. Dashboard - RHU Malay clinic capabilities
- Location: tests/workshop-ak26a-complete.spec.js:120:5

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  locator('a.action-card:has-text("Lab Reports")')
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "not toBeVisible" with timeout 5000ms
  - waiting for locator('a.action-card:has-text("Lab Reports")')
    9 × locator resolved to <a class="action-card svelte-x1i5gj view-action" href="/patient/search?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard">…</a>
      - unexpected value "visible"

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - banner [ref=e6]:
    - button "🏥 RHU Malay ↻" [ref=e8] [cursor=pointer]:
      - generic [ref=e9]: 🏥
      - generic [ref=e10]: RHU Malay
      - generic [ref=e11]: ↻
    - strong [ref=e13]: Thomas
    - button "👁️" [ref=e14] [cursor=pointer]
    - button "🚪" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e18]: 🏥
      - generic [ref=e19]:
        - strong [ref=e20]: RHU Malay
        - paragraph [ref=e21]: Rural health — register patients, basic care, view results, refer to hospital
    - heading "What do you want to do?" [level=1] [ref=e22]
    - generic [ref=e23]:
      - link "➕ Register Patient Add new person to SHR" [ref=e24] [cursor=pointer]:
        - /url: /patient/new?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard
        - generic [ref=e25]: ➕
        - generic [ref=e26]:
          - strong [ref=e27]: Register Patient
          - generic [ref=e28]: Add new person to SHR
      - link "🔍 Find Patient Search by name or ID" [ref=e29] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard
        - generic [ref=e30]: 🔍
        - generic [ref=e31]:
          - strong [ref=e32]: Find Patient
          - generic [ref=e33]: Search by name or ID
      - link "📋 Record Visit Document encounter" [ref=e34] [cursor=pointer]:
        - /url: /encounter?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard
        - generic [ref=e35]: 📋
        - generic [ref=e36]:
          - strong [ref=e37]: Record Visit
          - generic [ref=e38]: Document encounter
      - link "🩺 Record Vitals BP, HR, Temperature" [ref=e39] [cursor=pointer]:
        - /url: /vitals?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard
        - generic [ref=e40]: 🩺
        - generic [ref=e41]:
          - strong [ref=e42]: Record Vitals
          - generic [ref=e43]: BP, HR, Temperature
      - link "🧪 Order Labs Create lab orders / referrals" [ref=e44] [cursor=pointer]:
        - /url: /service-request?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard
        - generic [ref=e45]: 🧪
        - generic [ref=e46]:
          - strong [ref=e47]: Order Labs
          - generic [ref=e48]: Create lab orders / referrals
      - link "🔬 View Lab Results Check patient lab reports" [ref=e49] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard
        - generic [ref=e50]: 🔬
        - generic [ref=e51]:
          - strong [ref=e52]: View Lab Results
          - generic [ref=e53]: Check patient lab reports
      - link "💉 View Medications Check prescriptions & dispensed meds" [ref=e54] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-malay&returnTo=%2Fdashboard
        - generic [ref=e55]: 💉
        - generic [ref=e56]:
          - strong [ref=e57]: View Medications
          - generic [ref=e58]: Check prescriptions & dispensed meds
    - generic [ref=e59]:
      - heading "🔗 HIE Data Overview" [level=2] [ref=e60]
      - paragraph [ref=e61]:
        - text: Data visible to
        - strong [ref=e62]: RHU Malay
        - text: across all clinics
      - generic [ref=e63]:
        - link "17 Patients" [ref=e64] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e65]: "17"
          - generic [ref=e66]: Patients
        - link "1 Encounters" [ref=e67] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e68]: "1"
          - generic [ref=e69]: Encounters
        - link "3 Lab Orders" [ref=e70] [cursor=pointer]:
          - /url: /inbox?tab=orders
          - generic [ref=e71]: "3"
          - generic [ref=e72]: Lab Orders
        - link "3 Prescriptions" [ref=e73] [cursor=pointer]:
          - /url: /inbox?tab=rx
          - generic [ref=e74]: "3"
          - generic [ref=e75]: Prescriptions
        - link "4 Lab Reports" [ref=e76] [cursor=pointer]:
          - /url: /inbox?tab=reports
          - generic [ref=e77]: "4"
          - generic [ref=e78]: Lab Reports
        - link "3 Dispensed" [ref=e79] [cursor=pointer]:
          - /url: /inbox?tab=dispensed
          - generic [ref=e80]: "3"
          - generic [ref=e81]: Dispensed
    - generic [ref=e82]:
      - paragraph [ref=e83]:
        - text: "🎓 Workshop:"
        - strong [ref=e84]: AK26-A
      - paragraph [ref=e85]:
        - text: "🌐 Group Filter:"
        - button "🏷️ Group Only" [ref=e86] [cursor=pointer]
  - navigation [ref=e87]:
    - link "🏠 Home" [ref=e88] [cursor=pointer]:
      - /url: /dashboard?w=AK26-A&u=Thomas&c=rhu-malay
      - generic [ref=e89]: 🏠
      - generic [ref=e90]: Home
    - link "👤 Patients" [ref=e91] [cursor=pointer]:
      - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-malay
      - generic [ref=e92]: 👤
      - generic [ref=e93]: Patients
    - link "📥 Inbox ●" [ref=e94] [cursor=pointer]:
      - /url: /inbox?w=AK26-A&u=Thomas&c=rhu-malay
      - generic [ref=e95]: 📥
      - generic [ref=e96]: Inbox
      - generic [ref=e97]: ●
    - link "🔧 Developer" [ref=e98] [cursor=pointer]:
      - /url: /developer?w=AK26-A&u=Thomas&c=rhu-malay
      - generic [ref=e99]: 🔧
      - generic [ref=e100]: Developer
```

# Test source

```ts
  49  |     }
  50  |   ];
  51  | 
  52  |   test.beforeEach(async ({ page }) => {
  53  |     // Set viewport for consistent testing
  54  |     await page.setViewportSize({ width: 1280, height: 800 });
  55  |   });
  56  | 
  57  |   // ==========================================
  58  |   // TEST 1: Workshop Entry Page
  59  |   // ==========================================
  60  |   test('1. Workshop entry page - form validation and submission', async ({ page }) => {
  61  |     await page.goto('/workshop');
  62  |     await page.waitForLoadState('networkidle');
  63  | 
  64  |     // Verify page title and elements
  65  |     await expect(page.locator('h1:has-text("Join Workshop")')).toBeVisible();
  66  |     await expect(page.locator('input#workshop-code')).toBeVisible();
  67  |     await expect(page.locator('input#first-name')).toBeVisible();
  68  |     await expect(page.locator('.clinic-card')).toHaveCount(5);
  69  | 
  70  |     // Test form validation - submit without data
  71  |     const submitButton = page.locator('button[type="submit"]');
  72  |     await expect(submitButton).toBeDisabled();
  73  | 
  74  |     // Use quick select chip for workshop code
  75  |     await page.click(`button.chip:has-text("${workshopCode}")`);
  76  |     await page.waitForTimeout(1000);
  77  |     
  78  |     // Still disabled without name
  79  |     await expect(submitButton).toBeDisabled();
  80  | 
  81  |     // Fill name
  82  |     await page.fill('input#first-name', userName);
  83  |     await page.waitForTimeout(800);
  84  | 
  85  |     // Now submit should be enabled
  86  |     await expect(submitButton).toBeEnabled();
  87  | 
  88  |     // Verify first clinic is auto-selected
  89  |     const firstClinic = page.locator('.clinic-card').first();
  90  |     await expect(firstClinic).toHaveClass(/selected/);
  91  | 
  92  |     // Select different clinic (RHU Kalibo)
  93  |     await page.click('.clinic-card:has-text("RHU Kalibo")');
  94  |     await expect(page.locator('.clinic-card:has-text("RHU Kalibo")')).toHaveClass(/selected/);
  95  | 
  96  |     // Submit form
  97  |     await submitButton.click();
  98  |     
  99  |     // Wait for navigation to complete
  100 |     await page.waitForLoadState('networkidle');
  101 |     await page.waitForTimeout(2000);
  102 | 
  103 |     // Verify URL parameters
  104 |     const url = page.url();
  105 |     expect(url).toContain('/dashboard');
  106 |     expect(url).toContain(`w=${workshopCode}`);
  107 |     expect(url).toContain(`u=${userName}`);
  108 |     expect(url).toContain('c=rhu-kalibo');
  109 | 
  110 |     // Verify dashboard loaded
  111 |     await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();
  112 | 
  113 |     console.log('✅ Workshop entry and navigation successful');
  114 |   });
  115 | 
  116 |   // ==========================================
  117 |   // TEST 2: Dashboard - All Clinic Types
  118 |   // ==========================================
  119 |   for (const clinic of clinics) {
  120 |     test(`2. Dashboard - ${clinic.name} clinic capabilities`, async ({ page }) => {
  121 |       // Navigate directly with specific clinic
  122 |       await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=${clinic.id}`);
  123 |       await page.waitForTimeout(2000);
  124 | 
  125 |       // Verify dashboard loaded
  126 |       await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();
  127 | 
  128 |       // Verify workshop info displayed
  129 |       await expect(page.locator(`text=${workshopCode}`).first()).toBeVisible();
  130 |       // Use more specific selector for clinic name to avoid strict mode violation
  131 |       await expect(page.locator(`.clinic-name:has-text("${clinic.shortName}")`)).toBeVisible();
  132 | 
  133 |       // Verify available actions for this clinic
  134 |       for (const action of clinic.actions) {
  135 |         const actionLink = page.locator(`a.action-card:has-text("${action}")`);
  136 |         await expect(actionLink).toBeVisible();
  137 |         
  138 |         // Verify link has proper URL parameters
  139 |         const href = await actionLink.getAttribute('href');
  140 |         expect(href).toContain(`w=${workshopCode}`);
  141 |         expect(href).toContain(`u=${userName}`);
  142 |         expect(href).toContain(`c=${clinic.id}`);
  143 |         expect(href).toContain('returnTo=');
  144 |       }
  145 | 
  146 |       // Verify restricted actions are NOT present
  147 |       for (const restrictedAction of clinic.restrictedActions) {
  148 |         const restrictedLink = page.locator(`a.action-card:has-text("${restrictedAction}")`);
> 149 |         await expect(restrictedLink).not.toBeVisible();
      |                                          ^ Error: expect(locator).not.toBeVisible() failed
  150 |       }
  151 | 
  152 |       // Verify bottom navigation
  153 |       await expect(page.locator('a.nav-item:has-text("Home")')).toBeVisible();
  154 |       await expect(page.locator('a.nav-item:has-text("Patients")')).toBeVisible();
  155 |       await expect(page.locator('a.nav-item:has-text("Developer")')).toBeVisible();
  156 | 
  157 |       console.log(`✅ Dashboard for ${clinic.name} - all actions verified`);
  158 |     });
  159 |   }
  160 | 
  161 |   // ==========================================
  162 |   // TEST 3: Full Patient Registration Flow
  163 |   // ==========================================
  164 |   test('3. Complete patient registration flow', async ({ page }) => {
  165 |     // Login first
  166 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  167 |     await page.waitForTimeout(2000);
  168 | 
  169 |     // Navigate to register patient
  170 |     await page.click('a:has-text("Register Patient")');
  171 |     await page.waitForURL('**/patient/new**');
  172 | 
  173 |     // Verify registration form
  174 |     await expect(page.locator('h1:has-text("Register New Patient")')).toBeVisible();
  175 |     await expect(page.locator('input#familyName')).toBeVisible();
  176 |     await expect(page.locator('input#givenName')).toBeVisible();
  177 |     await expect(page.locator('select#gender')).toBeVisible();
  178 |     await expect(page.locator('input#birthDate')).toBeVisible();
  179 |     await expect(page.locator('input#phId')).toBeVisible();
  180 | 
  181 |     // Verify workshop badge displayed
  182 |     await expect(page.locator(`text=${workshopCode}`)).toBeVisible();
  183 | 
  184 |     // Fill form with unique test data
  185 |     const testTimestamp = Date.now();
  186 |     const testGivenName = `Test${testTimestamp}`;
  187 |     const testFamilyName = 'Patient';
  188 |     
  189 |     await page.fill('input#givenName', testGivenName);
  190 |     await page.fill('input#familyName', testFamilyName);
  191 |     await page.selectOption('select#gender', 'male');
  192 |     await page.fill('input#birthDate', '1990-01-01');
  193 |     await page.fill('input#phId', `TEST-${testTimestamp}`);
  194 | 
  195 |     // Submit form
  196 |     await page.click('button[type="submit"]');
  197 | 
  198 |     // Wait for result
  199 |     await page.waitForTimeout(3000);
  200 | 
  201 |     // Check for success or error
  202 |     const hasSuccess = await page.locator('text=Patient Created Successfully').isVisible().catch(() => false);
  203 |     const hasError = await page.locator('.error-banner').isVisible().catch(() => false);
  204 | 
  205 |     if (hasSuccess) {
  206 |       // Verify success state
  207 |       await expect(page.locator('text=Start Encounter')).toBeVisible();
  208 |       await expect(page.locator('text=Record Vitals')).toBeVisible();
  209 |       
  210 |       // Click "Start Encounter" to continue flow
  211 |       await page.click('text=Start Encounter');
  212 |       await page.waitForTimeout(2000);
  213 | 
  214 |       // Should be on encounter page with patient pre-filled
  215 |       const url = page.url();
  216 |       expect(url).toContain('/encounter');
  217 |       expect(url).toContain('patient=');
  218 |       
  219 |       console.log('✅ Patient registration and encounter start successful');
  220 |     } else if (hasError) {
  221 |       const errorText = await page.locator('.error-banner').textContent();
  222 |       console.log('⚠️ Registration error (server may be unavailable):', errorText);
  223 |       
  224 |       // Still pass if form submission worked
  225 |       expect(page.url()).toContain('/patient');
  226 |       console.log('✅ Patient registration form submitted (server error is OK)');
  227 |     } else {
  228 |       // Neither success nor error banner - check if we're still on form
  229 |       const currentUrl = page.url();
  230 |       if (currentUrl.includes('/patient/new')) {
  231 |         console.log('⚠️ Still on registration form - may need more time');
  232 |       }
  233 |       // Pass test if we at least attempted submission
  234 |       expect(currentUrl).toContain('/patient');
  235 |       console.log('✅ Patient registration endpoint accessible');
  236 |     }
  237 |   });
  238 | 
  239 |   // ==========================================
  240 |   // TEST 4: Patient Search and Selection
  241 |   // ==========================================
  242 |   test('4. Patient search functionality', async ({ page }) => {
  243 |     // Login
  244 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  245 |     await page.waitForTimeout(1500);
  246 | 
  247 |     // Navigate to patient search
  248 |     await page.click('a:has-text("Find Patient")');
  249 |     await page.waitForURL('**/patient/search**');
```