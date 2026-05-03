# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 2. Dashboard - Aklan Provincial Pharmacy clinic capabilities
- Location: tests/workshop-ak26a-complete.spec.js:120:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a.action-card:has-text("Inbox")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('a.action-card:has-text("Inbox")')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - banner [ref=e6]:
    - button "💊 Aklan Pharmacy ↻" [ref=e8] [cursor=pointer]:
      - generic [ref=e9]: 💊
      - generic [ref=e10]: Aklan Pharmacy
      - generic [ref=e11]: ↻
    - strong [ref=e13]: Thomas
    - button "👁️" [ref=e14] [cursor=pointer]
    - button "🚪" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e18]: 💊
      - generic [ref=e19]:
        - strong [ref=e20]: Aklan Provincial Pharmacy
        - paragraph [ref=e21]: Pharmacy — receive prescriptions, dispense medications
    - heading "What do you want to do?" [level=1] [ref=e22]
    - generic [ref=e23]:
      - link "📥 Work Queue Orders & requests from other clinics" [ref=e24] [cursor=pointer]:
        - /url: /inbox?w=AK26-A&u=Thomas&c=aklan-pharmacy&returnTo=%2Fdashboard
        - generic [ref=e25]: 📥
        - generic [ref=e26]:
          - strong [ref=e27]: Work Queue
          - generic [ref=e28]: Orders & requests from other clinics
      - link "💊 Dispense Dispense medications" [ref=e29] [cursor=pointer]:
        - /url: /dispense?w=AK26-A&u=Thomas&c=aklan-pharmacy&returnTo=%2Fdashboard
        - generic [ref=e30]: 💊
        - generic [ref=e31]:
          - strong [ref=e32]: Dispense
          - generic [ref=e33]: Dispense medications
    - generic [ref=e34]:
      - heading "🔗 HIE Data Overview" [level=2] [ref=e35]
      - paragraph [ref=e36]:
        - text: Data visible to
        - strong [ref=e37]: Aklan Pharmacy
        - text: across all clinics
      - generic [ref=e38]:
        - link "17 Patients" [ref=e39] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e40]: "17"
          - generic [ref=e41]: Patients
        - link "1 Encounters" [ref=e42] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e43]: "1"
          - generic [ref=e44]: Encounters
        - link "3 Lab Orders" [ref=e45] [cursor=pointer]:
          - /url: /inbox?tab=orders
          - generic [ref=e46]: "3"
          - generic [ref=e47]: Lab Orders
        - link "3 Prescriptions" [ref=e48] [cursor=pointer]:
          - /url: /inbox?tab=rx
          - generic [ref=e49]: "3"
          - generic [ref=e50]: Prescriptions
        - link "4 Lab Reports" [ref=e51] [cursor=pointer]:
          - /url: /inbox?tab=reports
          - generic [ref=e52]: "4"
          - generic [ref=e53]: Lab Reports
        - link "3 Dispensed" [ref=e54] [cursor=pointer]:
          - /url: /inbox?tab=dispensed
          - generic [ref=e55]: "3"
          - generic [ref=e56]: Dispensed
    - generic [ref=e57]:
      - paragraph [ref=e58]:
        - text: "🎓 Workshop:"
        - strong [ref=e59]: AK26-A
      - paragraph [ref=e60]:
        - text: "🌐 Group Filter:"
        - button "🏷️ Group Only" [ref=e61] [cursor=pointer]
  - navigation [ref=e62]:
    - link "🏠 Home" [ref=e63] [cursor=pointer]:
      - /url: /dashboard?w=AK26-A&u=Thomas&c=aklan-pharmacy
      - generic [ref=e64]: 🏠
      - generic [ref=e65]: Home
    - link "👤 Patients" [ref=e66] [cursor=pointer]:
      - /url: /patient/search?w=AK26-A&u=Thomas&c=aklan-pharmacy
      - generic [ref=e67]: 👤
      - generic [ref=e68]: Patients
    - link "📥 Inbox ●" [ref=e69] [cursor=pointer]:
      - /url: /inbox?w=AK26-A&u=Thomas&c=aklan-pharmacy
      - generic [ref=e70]: 📥
      - generic [ref=e71]: Inbox
      - generic [ref=e72]: ●
    - link "🔧 Developer" [ref=e73] [cursor=pointer]:
      - /url: /developer?w=AK26-A&u=Thomas&c=aklan-pharmacy
      - generic [ref=e74]: 🔧
      - generic [ref=e75]: Developer
```

# Test source

```ts
  36  |     {
  37  |       id: 'kalibo-lab',
  38  |       name: 'Kalibo Medical Laboratory',
  39  |       shortName: 'Kalibo Lab',
  40  |       actions: ['Inbox', 'Lab Reports'],
  41  |       restrictedActions: ['Register Patient', 'Record Visit', 'Record Vitals', 'Order Labs', 'Prescribe']
  42  |     },
  43  |     {
  44  |       id: 'aklan-pharmacy',
  45  |       name: 'Aklan Provincial Pharmacy',
  46  |       shortName: 'Aklan Pharmacy',
  47  |       actions: ['Inbox', 'Dispense'],
  48  |       restrictedActions: ['Register Patient', 'Record Visit', 'Record Vitals', 'Order Labs', 'Prescribe', 'Lab Reports']
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
> 136 |         await expect(actionLink).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
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
  149 |         await expect(restrictedLink).not.toBeVisible();
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
```