# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 4. Patient search functionality
- Location: tests/workshop-ak26a-complete.spec.js:242:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("Find Patient"), h1:has-text("Search"), .page-header').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1:has-text("Find Patient"), h1:has-text("Search"), .page-header').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - heading "500" [level=1] [ref=e5]
    - paragraph [ref=e6]: Internal Error
  - generic [ref=e7]: OpenHIE Mock EHR
```

# Test source

```ts
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
  250 | 
  251 |     // Verify search page loaded
> 252 |     await expect(page.locator('h1:has-text("Find Patient"), h1:has-text("Search"), .page-header').first()).toBeVisible();
      |                                                                                                            ^ Error: expect(locator).toBeVisible() failed
  253 |     await expect(page.locator('input[placeholder*="Filter patients"], input[placeholder*="Search patients"], input[type="text"]').first()).toBeVisible();
  254 | 
  255 |     // Test search functionality
  256 |     await page.fill('input[placeholder*="Filter patients"], input[placeholder*="Search patients"]', 'Test');
  257 |     await page.click('button:has-text("Search")');
  258 | 
  259 |     // Wait for results
  260 |     await page.waitForTimeout(2000);
  261 | 
  262 |     // Should show either results or empty state
  263 |     const hasPatientCards = await page.locator('.patient-card').count() > 0;
  264 |     const hasEmptyState = await page.locator('text=No patients found').isVisible().catch(() => false);
  265 |     const hasPatientRows = await page.locator('.patient-row').count() > 0;
  266 | 
  267 |     expect(hasPatientCards || hasEmptyState || hasPatientRows).toBe(true);
  268 | 
  269 |     // If we have results, click first patient
  270 |     if (hasPatientCards || hasPatientRows) {
  271 |       const firstPatient = page.locator('.patient-card, .patient-row').first();
  272 |       await firstPatient.click();
  273 |       
  274 |       // Wait for patient detail page
  275 |       await page.waitForURL('**/patient/**');
  276 |       await page.waitForTimeout(2000);
  277 | 
  278 |       // Verify patient detail page loaded
  279 |       const url = page.url();
  280 |       expect(url).toMatch(/\/patient\/[a-zA-Z0-9-]+/);
  281 | 
  282 |       // Look for patient info
  283 |       const hasPatientInfo = await page.locator('.patient-header, .patient-info, h2, h3').count() > 0;
  284 |       expect(hasPatientInfo).toBe(true);
  285 | 
  286 |       // Verify action buttons on patient page
  287 |       const hasActions = await page.locator('a:has-text("Record Vitals"), a:has-text("New Encounter"), a:has-text("Record Visit"), button:has-text("Record Vitals"), button:has-text("New Encounter")').count() > 0;
  288 |       expect(hasActions).toBe(true);
  289 | 
  290 |       console.log('✅ Patient search and detail view successful');
  291 |     } else {
  292 |       console.log('ℹ️ No patients found in search (empty database is OK)');
  293 |     }
  294 | 
  295 |     // Test back button
  296 |     await page.click('a:has-text("Back"), a:has-text("←"), .back-link').catch(() => {
  297 |       // If no back button, navigate directly
  298 |       return page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  299 |     });
  300 |   });
  301 | 
  302 |   // ==========================================
  303 |   // TEST 5: Encounter Recording Flow
  304 |   // ==========================================
  305 |   test('5. Record visit/encounter flow', async ({ page }) => {
  306 |     // Login with hospital (has all capabilities)
  307 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-hospital`);
  308 |     await page.waitForTimeout(2000);
  309 | 
  310 |     // Navigate to encounter page
  311 |     await page.click('a:has-text("Record Visit")');
  312 |     await page.waitForTimeout(2000);
  313 | 
  314 |     const currentUrl = page.url();
  315 | 
  316 |     // If no patient selected, should show patient selection prompt
  317 |     if (currentUrl.includes('/encounter') && !currentUrl.includes('patient=')) {
  318 |       // Should show prompt to select patient
  319 |       const hasSelectPrompt = await page.locator('text=Select a Patient').isVisible().catch(() => false) ||
  320 |                              await page.locator('text=Find Patient').isVisible().catch(() => false) ||
  321 |                              await page.locator('.select-patient-prompt').isVisible().catch(() => false);
  322 |       
  323 |       if (hasSelectPrompt) {
  324 |         console.log('✅ Encounter page shows patient selection prompt correctly');
  325 |       }
  326 |     }
  327 | 
  328 |     // Navigate with patient parameter to test full form
  329 |     await page.goto(`/encounter?w=${workshopCode}&u=${userName}&c=aklan-hospital&patient=test-patient-123`);
  330 |     await page.waitForTimeout(2000);
  331 | 
  332 |     // Verify encounter form elements
  333 |     const hasFormElements = await page.locator('input, select, textarea').count() > 0;
  334 |     const hasSubmitButton = await page.locator('button[type="submit"]').isVisible().catch(() => false);
  335 | 
  336 |     if (hasFormElements && hasSubmitButton) {
  337 |       console.log('✅ Encounter form loaded with patient context');
  338 |     } else {
  339 |       // Page might show different state
  340 |       const url = page.url();
  341 |       expect(url).toContain('/encounter');
  342 |       console.log('✅ Encounter page accessible (form state may vary)');
  343 |     }
  344 |   });
  345 | 
  346 |   // ==========================================
  347 |   // TEST 6: Vitals Recording Flow
  348 |   // ==========================================
  349 |   test('6. Record vitals flow', async ({ page }) => {
  350 |     // Login
  351 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  352 |     await page.waitForTimeout(2000);
```