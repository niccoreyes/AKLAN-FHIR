# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-workflow.spec.js >> OpenHIE Mock EHR - Workshop Workflow Tests >> 9. Clinic switching preserves URL params
- Location: tests/workshop-workflow.spec.js:273:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - heading "🎓 Join Workshop" [level=1] [ref=e8]
      - paragraph [ref=e9]: OpenHIE Mock EHR
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Workshop Code
        - textbox "Workshop Code" [ref=e14]:
          - /placeholder: Type or select a workshop code...
          - text: AK26-A
        - generic [ref=e15]:
          - generic [ref=e16]: "Quick select:"
          - generic [ref=e17]:
            - button "AK26-A" [ref=e18] [cursor=pointer]
            - button "AK26-B" [ref=e19] [cursor=pointer]
            - button "AK26-C" [ref=e20] [cursor=pointer]
            - button "AK26-D" [ref=e21] [cursor=pointer]
            - button "AK26-E" [ref=e22] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e24]: First Name
        - textbox "First Name" [ref=e25]:
          - /placeholder: Enter your first name
          - text: Thomas
      - generic [ref=e26]:
        - generic [ref=e27]: Select Clinic
        - generic [ref=e28]:
          - button "🏥 RHU Kalibo Rural Health Unit" [ref=e29] [cursor=pointer]:
            - generic [ref=e30]: 🏥
            - generic [ref=e31]: RHU Kalibo
            - generic [ref=e32]: Rural Health Unit
          - button "🏥 Aklan Provincial Provincial Hospital" [ref=e33] [cursor=pointer]:
            - generic [ref=e34]: 🏥
            - generic [ref=e35]: Aklan Provincial
            - generic [ref=e36]: Provincial Hospital
          - button "🏥 RHU Malay Rural Health Unit" [ref=e37] [cursor=pointer]:
            - generic [ref=e38]: 🏥
            - generic [ref=e39]: RHU Malay
            - generic [ref=e40]: Rural Health Unit
          - button "🧪 Kalibo Lab Diagnostic Center" [ref=e41] [cursor=pointer]:
            - generic [ref=e42]: 🧪
            - generic [ref=e43]: Kalibo Lab
            - generic [ref=e44]: Diagnostic Center
          - button "💊 Aklan Pharmacy Pharmacy" [active] [ref=e45] [cursor=pointer]:
            - generic [ref=e46]: 💊
            - generic [ref=e47]: Aklan Pharmacy
            - generic [ref=e48]: Pharmacy
      - generic [ref=e49]:
        - generic [ref=e50]: Select Your Role (Optional)
        - generic [ref=e51]:
          - button "📝 Registration Clerk Register new patients" [ref=e52] [cursor=pointer]:
            - generic [ref=e53]: 📝
            - generic [ref=e54]:
              - generic [ref=e55]: Registration Clerk
              - generic [ref=e56]: Register new patients
          - button "👩‍⚕️ Nurse / BHW Record vital signs and assessments" [ref=e57] [cursor=pointer]:
            - generic [ref=e58]: 👩‍⚕️
            - generic [ref=e59]:
              - generic [ref=e60]: Nurse / BHW
              - generic [ref=e61]: Record vital signs and assessments
          - button "👨‍⚕️ Physician Diagnose and create referrals" [ref=e62] [cursor=pointer]:
            - generic [ref=e63]: 👨‍⚕️
            - generic [ref=e64]:
              - generic [ref=e65]: Physician
              - generic [ref=e66]: Diagnose and create referrals
          - button "🧪 Lab Technician Process lab orders and results" [ref=e67] [cursor=pointer]:
            - generic [ref=e68]: 🧪
            - generic [ref=e69]:
              - generic [ref=e70]: Lab Technician
              - generic [ref=e71]: Process lab orders and results
          - button "💊 Pharmacist Dispense medications" [ref=e72] [cursor=pointer]:
            - generic [ref=e73]: 💊
            - generic [ref=e74]:
              - generic [ref=e75]: Pharmacist
              - generic [ref=e76]: Dispense medications
      - button "🚀 Enter EHR System" [disabled] [ref=e77]:
        - generic [ref=e78]: 🚀 Enter EHR System
    - link "← Back to Public Viewer" [ref=e80] [cursor=pointer]:
      - /url: /
```

# Test source

```ts
  181 |     
  182 |     const currentUrl = page.url();
  183 |     console.log('Vitals page URL:', currentUrl);
  184 |     
  185 |     // Verify page doesn't show 404
  186 |     const has404 = await page.locator('text=404').isVisible().catch(() => false);
  187 |     const hasNotFound = await page.locator('text=Not Found').isVisible().catch(() => false);
  188 |     
  189 |     if (has404 || hasNotFound) {
  190 |       throw new Error('Vitals page shows 404 error');
  191 |     }
  192 |     
  193 |     // Should show something
  194 |     const hasContent = await page.locator('h1, h2, .page-header, form').count() > 0;
  195 |     expect(hasContent).toBe(true);
  196 |     
  197 |     console.log('✅ Vitals page accessible');
  198 |   });
  199 | 
  200 |   test('7. Full workflow: register patient then view', async ({ page }) => {
  201 |     // Login
  202 |     await page.fill('#workshop-code', workshopCode);
  203 |     await page.fill('#first-name', userName);
  204 |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  205 |     await page.click('button[type="submit"]');
  206 |     await page.waitForURL('/dashboard');
  207 |     
  208 |     // Navigate to patient registration
  209 |     await page.click('a:has-text("Register Patient")');
  210 |     await page.waitForURL('/patient/new');
  211 |     
  212 |     // Fill form with unique test data
  213 |     const testName = `Test${Date.now()}`;
  214 |     await page.fill('input#givenName', testName);
  215 |     await page.fill('input#familyName', 'Workflow');
  216 |     await page.selectOption('select#gender', 'female');
  217 |     await page.fill('input#birthDate', '1985-05-15');
  218 |     
  219 |     // Submit form
  220 |     await page.click('button[type="submit"]');
  221 |     
  222 |     // Wait for success
  223 |     await page.waitForTimeout(3000);
  224 |     
  225 |     // Check for success message
  226 |     const hasSuccess = await page.locator('text=Patient Created Successfully').isVisible().catch(() => false);
  227 |     
  228 |     if (hasSuccess) {
  229 |       // Verify success banner shows
  230 |       await expect(page.locator('text=Start Encounter')).toBeVisible();
  231 |       await expect(page.locator('text=Record Vitals')).toBeVisible();
  232 |       
  233 |       console.log('✅ Patient registration workflow successful');
  234 |     } else {
  235 |       // If creation failed (maybe server issue), just verify form submitted
  236 |       const currentUrl = page.url();
  237 |       console.log('Form submitted, current URL:', currentUrl);
  238 |       
  239 |       // Check no error
  240 |       const hasError = await page.locator('.error-banner').isVisible().catch(() => false);
  241 |       if (hasError) {
  242 |         const errorText = await page.locator('.error-banner').textContent();
  243 |         console.log('Error:', errorText);
  244 |       }
  245 |       
  246 |       // Pass test if we at least got to patient/new (endpoint works)
  247 |       expect(currentUrl).toContain('/patient');
  248 |       console.log('✅ Patient registration endpoint accessible (server may be unavailable)');
  249 |     }
  250 |   });
  251 | 
  252 |   test('8. Navigation via bottom nav bar', async ({ page }) => {
  253 |     // Login
  254 |     await page.fill('#workshop-code', workshopCode);
  255 |     await page.fill('#first-name', userName);
  256 |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  257 |     await page.click('button[type="submit"]');
  258 |     await page.waitForURL('/dashboard');
  259 |     
  260 |     // Test Patients link in bottom nav
  261 |     await page.click('a.nav-item:has-text("Patients")');
  262 |     await page.waitForURL('/patient/search');
  263 |     await expect(page.locator('h1:has-text("Find Patient")')).toBeVisible();
  264 |     
  265 |     // Test Home link
  266 |     await page.click('a.nav-item:has-text("Home")');
  267 |     await page.waitForURL('/dashboard');
  268 |     await expect(page.locator('text=What do you want to do?')).toBeVisible();
  269 |     
  270 |     console.log('✅ Bottom navigation works');
  271 |   });
  272 | 
  273 |   test('9. Clinic switching preserves URL params', async ({ page }) => {
  274 |     // Login with initial clinic (pharmacy)
  275 |     await page.fill('#workshop-code', workshopCode);
  276 |     await page.fill('#first-name', userName);
  277 |     await page.click(`.clinic-card:has-text("Aklan Pharmacy")`);
  278 |     // Wait for form state to update and button to be enabled
  279 |     await page.waitForTimeout(1000);
  280 |     // Wait for submit button to be enabled
> 281 |     await page.waitForFunction(() => {
      |                ^ Error: page.waitForFunction: Test timeout of 60000ms exceeded.
  282 |       const btn = document.querySelector('button[type="submit"]');
  283 |       return btn && !btn.disabled;
  284 |     });
  285 |     await page.click('button[type="submit"]');
  286 |     await page.waitForURL(/\/dashboard.*/);
  287 |     
  288 |     // Verify initial URL has all params
  289 |     let url = page.url();
  290 |     expect(url).toContain('w=AK26-A');
  291 |     expect(url).toContain('u=Thomas');
  292 |     expect(url).toContain('c=aklan-pharmacy');
  293 |     
  294 |     console.log('✅ Initial login with pharmacy OK');
  295 |     
  296 |     // Switch clinic using the clinic badge dropdown
  297 |     await page.click('.clinic-badge');
  298 |     await page.waitForSelector('.clinic-dropdown', { state: 'visible' });
  299 |     
  300 |     // Click on RHU Kalibo option
  301 |     await page.click('.clinic-option:has-text("RHU Kalibo")');
  302 |     
  303 |     // Wait for navigation and verify new clinic
  304 |     await page.waitForURL(/.*c=rhu-kalibo.*/);
  305 | 
  306 |     // Verify URL still has all params with new clinic
  307 |     url = page.url();
  308 |     expect(url).toContain('w=AK26-A');
  309 |     expect(url).toContain('u=Thomas');
  310 |     expect(url).toContain('c=rhu-kalibo');
  311 | 
  312 |     console.log('✅ Clinic switch preserves params');
  313 | 
  314 |     // Now click on Prescribe action
  315 |     await page.click('a:has-text("Prescribe")');
  316 | 
  317 |     // Wait for medication-request page with returnTo
  318 |     await page.waitForURL(/\/medication-request.*/);
  319 |     
  320 |     // Verify URL has all params including returnTo
  321 |     url = page.url();
  322 |     expect(url).toContain('w=AK26-A');
  323 |     expect(url).toContain('u=Thomas');
  324 |     expect(url).toContain('c=rhu-kalibo');
  325 |     expect(url).toContain('returnTo=');
  326 |     
  327 |     // Page should load, not redirect to /
  328 |     await expect(page.locator('h1:has-text("Prescribe Medication")')).toBeVisible({ timeout: 5000 });
  329 |     
  330 |     console.log('✅ Prescribe page loads correctly after clinic switch');
  331 |   });
  332 | 
  333 |   test('10. Action links preserve workshop context', async ({ page }) => {
  334 |     // Login
  335 |     await page.fill('#workshop-code', workshopCode);
  336 |     await page.fill('#first-name', userName);
  337 |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  338 |     // Wait for form state to update and button to be enabled
  339 |     await page.waitForTimeout(1000);
  340 |     // Wait for submit button to be enabled
  341 |     await page.waitForFunction(() => {
  342 |       const btn = document.querySelector('button[type="submit"]');
  343 |       return btn && !btn.disabled;
  344 |     });
  345 |     await page.click('button[type="submit"]');
  346 |     await page.waitForURL(/\/dashboard.*/);
  347 | 
  348 |     // Check that all visible action links contain workshop params
  349 |     // RHU Kalibo has: register, encounter, vitals, order, prescribe
  350 |     const actions = ['Register Patient', 'Record Visit', 'Record Vitals', 'Order Labs', 'Prescribe'];
  351 | 
  352 |     for (const action of actions) {
  353 |       const link = page.locator(`a.action-card:has-text("${action}")`);
  354 |       await expect(link).toBeVisible();
  355 |       const href = await link.getAttribute('href');
  356 | 
  357 |       // All links should have returnTo and workshop params
  358 |       expect(href).toContain('returnTo=');
  359 |       expect(href).toContain('w=AK26-A');
  360 |       expect(href).toContain('u=Thomas');
  361 |       expect(href).toContain('c=rhu-kalibo');
  362 |     }
  363 |     
  364 |     console.log('✅ All action links preserve workshop context');
  365 |   });
  366 | });
```