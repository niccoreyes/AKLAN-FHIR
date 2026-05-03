# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 10. Pharmacy inbox and dispensing flow
- Location: tests/workshop-ak26a-complete.spec.js:489:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a:has-text("Dispense")')
Expected: visible
Error: strict mode violation: locator('a:has-text("Dispense")') resolved to 2 elements:
    1) <a class="action-card svelte-x1i5gj" href="/dispense?w=AK26-A&u=Thomas&c=aklan-pharmacy&returnTo=%2Fdashboard">…</a> aka getByRole('link', { name: '💊 Dispense Dispense' })
    2) <a href="/inbox?tab=dispensed" class="stat-card svelte-x1i5gj">…</a> aka getByRole('link', { name: 'Dispensed' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('a:has-text("Dispense")')

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
  396 |   test('7. Order labs (Service Request) flow', async ({ page }) => {
  397 |     // Login with RHU Kalibo
  398 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  399 |     await page.waitForTimeout(2000);
  400 | 
  401 |     // Navigate to service request page
  402 |     await page.click('a:has-text("Order Labs")');
  403 |     await page.waitForTimeout(2000);
  404 | 
  405 |     // Verify service request page loaded
  406 |     const url = page.url();
  407 |     expect(url).toContain('/service-request');
  408 | 
  409 |     // Verify page elements
  410 |     const hasForm = await page.locator('form, input, select').count() > 0;
  411 |     const hasPageTitle = await page.locator('h1:has-text("Order"), h1:has-text("Service")').isVisible().catch(() => false);
  412 | 
  413 |     expect(hasForm || hasPageTitle).toBe(true);
  414 | 
  415 |     // Verify URL parameters preserved
  416 |     expect(url).toContain(`w=${workshopCode}`);
  417 |     expect(url).toContain(`u=${userName}`);
  418 |     expect(url).toContain('c=rhu-kalibo');
  419 | 
  420 |     console.log('✅ Service request page accessible with proper context');
  421 |   });
  422 | 
  423 |   // ==========================================
  424 |   // TEST 8: Medication Request (Prescribe) Flow
  425 |   // ==========================================
  426 |   test('8. Prescribe medication flow', async ({ page }) => {
  427 |     // Login with hospital (can prescribe)
  428 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-hospital`);
  429 |     await page.waitForTimeout(2000);
  430 | 
  431 |     // Navigate to medication request page
  432 |     await page.click('a:has-text("Prescribe")');
  433 |     await page.waitForTimeout(2000);
  434 | 
  435 |     // Verify medication request page loaded
  436 |     const url = page.url();
  437 |     expect(url).toContain('/medication-request');
  438 | 
  439 |     // Verify page elements
  440 |     const hasForm = await page.locator('form, input, select').count() > 0;
  441 |     const hasPageTitle = await page.locator('h1:has-text("Prescribe"), h1:has-text("Medication")').isVisible().catch(() => false);
  442 | 
  443 |     expect(hasForm || hasPageTitle).toBe(true);
  444 | 
  445 |     console.log('✅ Medication request page accessible');
  446 |   });
  447 | 
  448 |   // ==========================================
  449 |   // TEST 9: Lab Inbox and Reporting
  450 |   // ==========================================
  451 |   test('9. Lab inbox and reporting flow', async ({ page }) => {
  452 |     // Login with lab
  453 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=kalibo-lab`);
  454 |     await page.waitForTimeout(2000);
  455 | 
  456 |     // Verify lab-specific actions
  457 |     await expect(page.locator('a:has-text("Inbox")')).toBeVisible();
  458 |     await expect(page.locator('a:has-text("Lab Reports")')).toBeVisible();
  459 | 
  460 |     // Navigate to inbox
  461 |     await page.click('a:has-text("Inbox")');
  462 |     await page.waitForURL('**/inbox**');
  463 |     await page.waitForTimeout(2000);
  464 | 
  465 |     // Verify inbox loaded
  466 |     const url = page.url();
  467 |     expect(url).toContain('/inbox');
  468 |     expect(url).toContain(`w=${workshopCode}`);
  469 | 
  470 |     // Verify inbox elements
  471 |     const hasInboxElements = await page.locator('.inbox-item, .request-card, h1, h2').count() > 0;
  472 |     expect(hasInboxElements).toBe(true);
  473 | 
  474 |     // Navigate to diagnostic report
  475 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=kalibo-lab`);
  476 |     await page.waitForTimeout(1500);
  477 |     await page.click('a:has-text("Lab Reports")');
  478 |     await page.waitForTimeout(2000);
  479 | 
  480 |     const reportUrl = page.url();
  481 |     expect(reportUrl).toContain('/diagnostic-report');
  482 | 
  483 |     console.log('✅ Lab inbox and reporting accessible');
  484 |   });
  485 | 
  486 |   // ==========================================
  487 |   // TEST 10: Pharmacy Inbox and Dispensing
  488 |   // ==========================================
  489 |   test('10. Pharmacy inbox and dispensing flow', async ({ page }) => {
  490 |     // Login with pharmacy
  491 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-pharmacy`);
  492 |     await page.waitForTimeout(2000);
  493 | 
  494 |     // Verify pharmacy-specific actions
  495 |     await expect(page.locator('a:has-text("Inbox")')).toBeVisible();
> 496 |     await expect(page.locator('a:has-text("Dispense")')).toBeVisible();
      |                                                          ^ Error: expect(locator).toBeVisible() failed
  497 | 
  498 |     // Navigate to inbox
  499 |     await page.click('a:has-text("Inbox")');
  500 |     await page.waitForURL('**/inbox**');
  501 |     await page.waitForTimeout(2000);
  502 | 
  503 |     // Verify inbox loaded
  504 |     const url = page.url();
  505 |     expect(url).toContain('/inbox');
  506 |     expect(url).toContain('c=aklan-pharmacy');
  507 | 
  508 |     // Navigate to dispense
  509 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-pharmacy`);
  510 |     await page.waitForTimeout(1500);
  511 |     await page.click('a:has-text("Dispense")');
  512 |     await page.waitForTimeout(2000);
  513 | 
  514 |     const dispenseUrl = page.url();
  515 |     expect(dispenseUrl).toContain('/dispense');
  516 | 
  517 |     console.log('✅ Pharmacy inbox and dispensing accessible');
  518 |   });
  519 | 
  520 |   // ==========================================
  521 |   // TEST 11: Clinic Switching and State Preservation
  522 |   // ==========================================
  523 |   test('11. Clinic switching preserves workshop context', async ({ page }) => {
  524 |     // Start with RHU Kalibo
  525 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  526 |     await page.waitForTimeout(2000);
  527 | 
  528 |     // Verify initial state
  529 |     let url = page.url();
  530 |     expect(url).toContain('c=rhu-kalibo');
  531 | 
  532 |     // Open clinic switcher
  533 |     await page.click('.clinic-switcher-btn, .clinic-badge, button:has-text("RHU")');
  534 |     await page.waitForTimeout(1000);
  535 | 
  536 |     // Select Aklan Hospital
  537 |     await page.click('.clinic-option:has-text("Aklan Provincial"), .dropdown-item:has-text("Hospital")').catch(async () => {
  538 |       // Alternative: try clicking by exact text
  539 |       await page.click('text=Aklan Provincial Hospital');
  540 |     });
  541 | 
  542 |     // Wait for navigation
  543 |     await page.waitForTimeout(3000);
  544 | 
  545 |     // Verify new clinic
  546 |     url = page.url();
  547 |     expect(url).toContain('c=aklan-hospital');
  548 |     expect(url).toContain(`w=${workshopCode}`);
  549 |     expect(url).toContain(`u=${userName}`);
  550 | 
  551 |     // Verify dashboard loaded with new clinic actions
  552 |     await expect(page.locator('text=Aklan Provincial')).toBeVisible();
  553 | 
  554 |     // Switch to pharmacy
  555 |     await page.click('.clinic-switcher-btn, .clinic-badge');
  556 |     await page.waitForTimeout(1000);
  557 |     
  558 |     await page.click('.clinic-option:has-text("Pharmacy"), .dropdown-item:has-text("Pharmacy")').catch(async () => {
  559 |       await page.click('text=Aklan Provincial Pharmacy');
  560 |     });
  561 | 
  562 |     await page.waitForTimeout(3000);
  563 | 
  564 |     url = page.url();
  565 |     expect(url).toContain('c=aklan-pharmacy');
  566 | 
  567 |     // Verify pharmacy-specific actions shown
  568 |     await expect(page.locator('a:has-text("Inbox")')).toBeVisible();
  569 |     await expect(page.locator('a:has-text("Dispense")')).toBeVisible();
  570 | 
  571 |     console.log('✅ Clinic switching preserves workshop context');
  572 |   });
  573 | 
  574 |   // ==========================================
  575 |   // TEST 12: URL Parameter Persistence Across Navigation
  576 |   // ==========================================
  577 |   test('12. URL parameters persist across all navigation', async ({ page }) => {
  578 |     const baseParams = `w=${workshopCode}&u=${userName}&c=rhu-kalibo`;
  579 |     
  580 |     // Test all major routes
  581 |     const routes = [
  582 |       '/dashboard',
  583 |       '/patient/search',
  584 |       '/patient/new',
  585 |       '/encounter',
  586 |       '/vitals',
  587 |       '/service-request',
  588 |       '/medication-request',
  589 |       '/inbox'
  590 |     ];
  591 | 
  592 |     for (const route of routes) {
  593 |       // Navigate to route with params
  594 |       await page.goto(`${route}?${baseParams}`);
  595 |       await page.waitForTimeout(1500);
  596 | 
```