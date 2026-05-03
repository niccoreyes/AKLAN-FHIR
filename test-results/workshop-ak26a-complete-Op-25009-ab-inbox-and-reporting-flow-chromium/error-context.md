# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 9. Lab inbox and reporting flow
- Location: tests/workshop-ak26a-complete.spec.js:451:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/diagnostic-report"
Received string:    "http://localhost:5173/inbox?tab=reports"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - banner [ref=e6]:
      - generic [ref=e7]:
        - link "←" [ref=e8] [cursor=pointer]:
          - /url: /dashboard
        - heading "📥 Work Queue" [level=1] [ref=e9]
      - paragraph [ref=e10]: Cross-clinic requests visible to Kalibo Lab
    - generic [ref=e11]:
      - button "🧪 Lab Orders" [ref=e12] [cursor=pointer]:
        - generic [ref=e13]: 🧪
        - text: Lab Orders
      - button "📄 Lab Reports" [ref=e14] [cursor=pointer]:
        - generic [ref=e15]: 📄
        - text: Lab Reports
    - main [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: 📄 Report
            - generic [ref=e21]: final
          - generic [ref=e22]:
            - strong [ref=e23]: Lipid Panel
            - paragraph [ref=e24]: 👤 Workflow, Test1777794791416
            - paragraph [ref=e25]: May 3, 07:39 PM
          - generic [ref=e27]: 2571-8
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]: 📄 Report
            - generic [ref=e31]: final
          - generic [ref=e32]:
            - strong [ref=e33]: Lipid Panel
            - paragraph [ref=e34]: 👤 Workflow, Test1777795603502
            - paragraph [ref=e35]: May 3, 07:39 PM
          - generic [ref=e37]: 2571-8
        - generic [ref=e38]:
          - generic [ref=e39]:
            - generic [ref=e40]: 📄 Report
            - generic [ref=e41]: final
          - generic [ref=e42]:
            - strong [ref=e43]: Complete Blood Count
            - paragraph [ref=e44]: 👤 Workflow, Test1777795603502
            - paragraph [ref=e45]: May 3, 07:26 PM
          - generic [ref=e46]:
            - generic [ref=e47]: 2093-3
            - generic [ref=e48]: 13457-7
            - generic [ref=e49]: 2085-9
            - generic [ref=e50]: 2571-8
        - generic [ref=e51]:
          - generic [ref=e52]:
            - generic [ref=e53]: 📄 Report
            - generic [ref=e54]: final
          - generic [ref=e55]:
            - strong [ref=e56]: Blood Pressure
            - paragraph [ref=e57]: 👤 Workflow, Test1777794791416
            - paragraph [ref=e58]: May 3, 07:05 PM
          - generic [ref=e60]: 8480-6
    - navigation [ref=e61]:
      - link "🏠 Home" [ref=e62] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e63]: 🏠
        - generic [ref=e64]: Home
      - link "👤 Patients" [ref=e65] [cursor=pointer]:
        - /url: /patient/search
        - generic [ref=e66]: 👤
        - generic [ref=e67]: Patients
      - link "📥 Inbox" [ref=e68] [cursor=pointer]:
        - /url: /inbox
        - generic [ref=e69]: 📥
        - generic [ref=e70]: Inbox
      - link "🔧 Developer" [ref=e71] [cursor=pointer]:
        - /url: /developer
        - generic [ref=e72]: 🔧
        - generic [ref=e73]: Developer
  - generic [ref=e74]: OpenHIE Mock EHR
```

# Test source

```ts
  381 |       await page.fill('input#diastolic', '80');
  382 |       await page.fill('input#heartRate', '72');
  383 |       await page.fill('input#temperature', '37.0');
  384 |       
  385 |       console.log('✅ Vitals form loaded and can be filled');
  386 |     } else {
  387 |       const url = page.url();
  388 |       expect(url).toContain('/vitals');
  389 |       console.log('✅ Vitals page accessible');
  390 |     }
  391 |   });
  392 | 
  393 |   // ==========================================
  394 |   // TEST 7: Service Request (Order Labs) Flow
  395 |   // ==========================================
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
> 481 |     expect(reportUrl).toContain('/diagnostic-report');
      |                       ^ Error: expect(received).toContain(expected) // indexOf
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
  496 |     await expect(page.locator('a:has-text("Dispense")')).toBeVisible();
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
```