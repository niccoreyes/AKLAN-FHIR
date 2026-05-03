# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 11. Clinic switching preserves workshop context
- Location: tests/workshop-ak26a-complete.spec.js:523:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Aklan Provincial')
Expected: visible
Error: strict mode violation: locator('text=Aklan Provincial') resolved to 3 elements:
    1) <span class="clinic-name svelte-x1i5gj">Aklan Provincial</span> aka getByRole('button', { name: '🏥 Aklan Provincial ↻' })
    2) <strong class="svelte-x1i5gj">Aklan Provincial Hospital</strong> aka getByText('Aklan Provincial Hospital')
    3) <strong class="svelte-x1i5gj">Aklan Provincial</strong> aka getByRole('main').getByText('Aklan Provincial', { exact: true })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Aklan Provincial')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - banner [ref=e6]:
    - button "🏥 Aklan Provincial ↻" [ref=e8] [cursor=pointer]:
      - generic [ref=e9]: 🏥
      - generic [ref=e10]: Aklan Provincial
      - generic [ref=e11]: ↻
    - strong [ref=e13]: Thomas
    - button "👁️" [ref=e14] [cursor=pointer]
    - button "🚪" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e18]: 🏥
      - generic [ref=e19]:
        - strong [ref=e20]: Aklan Provincial Hospital
        - paragraph [ref=e21]: Secondary care — full clinical services including lab reporting and medication tracking
    - heading "What do you want to do?" [level=1] [ref=e22]
    - generic [ref=e23]:
      - link "➕ Register Patient Add new person to SHR" [ref=e24] [cursor=pointer]:
        - /url: /patient/new?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e25]: ➕
        - generic [ref=e26]:
          - strong [ref=e27]: Register Patient
          - generic [ref=e28]: Add new person to SHR
      - link "🔍 Find Patient Search by name or ID" [ref=e29] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e30]: 🔍
        - generic [ref=e31]:
          - strong [ref=e32]: Find Patient
          - generic [ref=e33]: Search by name or ID
      - link "📋 Record Visit Document encounter" [ref=e34] [cursor=pointer]:
        - /url: /encounter?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e35]: 📋
        - generic [ref=e36]:
          - strong [ref=e37]: Record Visit
          - generic [ref=e38]: Document encounter
      - link "🩺 Record Vitals BP, HR, Temperature" [ref=e39] [cursor=pointer]:
        - /url: /vitals?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e40]: 🩺
        - generic [ref=e41]:
          - strong [ref=e42]: Record Vitals
          - generic [ref=e43]: BP, HR, Temperature
      - link "🧪 Order Labs Create lab orders / referrals" [ref=e44] [cursor=pointer]:
        - /url: /service-request?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e45]: 🧪
        - generic [ref=e46]:
          - strong [ref=e47]: Order Labs
          - generic [ref=e48]: Create lab orders / referrals
      - link "💊 Prescribe Create medication orders" [ref=e49] [cursor=pointer]:
        - /url: /medication-request?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e50]: 💊
        - generic [ref=e51]:
          - strong [ref=e52]: Prescribe
          - generic [ref=e53]: Create medication orders
      - link "📄 Lab Results Create diagnostic reports" [ref=e54] [cursor=pointer]:
        - /url: /diagnostic-report?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e55]: 📄
        - generic [ref=e56]:
          - strong [ref=e57]: Lab Results
          - generic [ref=e58]: Create diagnostic reports
      - link "🔬 View Lab Results Check patient lab reports" [ref=e59] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e60]: 🔬
        - generic [ref=e61]:
          - strong [ref=e62]: View Lab Results
          - generic [ref=e63]: Check patient lab reports
      - link "💉 View Medications Check prescriptions & dispensed meds" [ref=e64] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=aklan-hospital&returnTo=%2Fdashboard
        - generic [ref=e65]: 💉
        - generic [ref=e66]:
          - strong [ref=e67]: View Medications
          - generic [ref=e68]: Check prescriptions & dispensed meds
    - generic [ref=e69]:
      - heading "🔗 HIE Data Overview" [level=2] [ref=e70]
      - paragraph [ref=e71]:
        - text: Data visible to
        - strong [ref=e72]: Aklan Provincial
        - text: across all clinics
      - generic [ref=e73]:
        - link "17 Patients" [ref=e74] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e75]: "17"
          - generic [ref=e76]: Patients
        - link "1 Encounters" [ref=e77] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e78]: "1"
          - generic [ref=e79]: Encounters
        - link "3 Lab Orders" [ref=e80] [cursor=pointer]:
          - /url: /inbox?tab=orders
          - generic [ref=e81]: "3"
          - generic [ref=e82]: Lab Orders
        - link "3 Prescriptions" [ref=e83] [cursor=pointer]:
          - /url: /inbox?tab=rx
          - generic [ref=e84]: "3"
          - generic [ref=e85]: Prescriptions
        - link "4 Lab Reports" [ref=e86] [cursor=pointer]:
          - /url: /inbox?tab=reports
          - generic [ref=e87]: "4"
          - generic [ref=e88]: Lab Reports
        - link "3 Dispensed" [ref=e89] [cursor=pointer]:
          - /url: /inbox?tab=dispensed
          - generic [ref=e90]: "3"
          - generic [ref=e91]: Dispensed
    - generic [ref=e92]:
      - paragraph [ref=e93]:
        - text: "🎓 Workshop:"
        - strong [ref=e94]: AK26-A
      - paragraph [ref=e95]:
        - text: "🌐 Group Filter:"
        - button "🏷️ Group Only" [ref=e96] [cursor=pointer]
  - navigation [ref=e97]:
    - link "🏠 Home" [ref=e98] [cursor=pointer]:
      - /url: /dashboard?w=AK26-A&u=Thomas&c=aklan-hospital
      - generic [ref=e99]: 🏠
      - generic [ref=e100]: Home
    - link "👤 Patients" [ref=e101] [cursor=pointer]:
      - /url: /patient/search?w=AK26-A&u=Thomas&c=aklan-hospital
      - generic [ref=e102]: 👤
      - generic [ref=e103]: Patients
    - link "📥 Inbox ●" [ref=e104] [cursor=pointer]:
      - /url: /inbox?w=AK26-A&u=Thomas&c=aklan-hospital
      - generic [ref=e105]: 📥
      - generic [ref=e106]: Inbox
      - generic [ref=e107]: ●
    - link "🔧 Developer" [ref=e108] [cursor=pointer]:
      - /url: /developer?w=AK26-A&u=Thomas&c=aklan-hospital
      - generic [ref=e109]: 🔧
      - generic [ref=e110]: Developer
```

# Test source

```ts
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
> 552 |     await expect(page.locator('text=Aklan Provincial')).toBeVisible();
      |                                                         ^ Error: expect(locator).toBeVisible() failed
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
  597 |       // Verify page loaded (no 404)
  598 |       const has404 = await page.locator('text=404').isVisible().catch(() => false);
  599 |       const hasNotFound = await page.locator('text=Not Found').isVisible().catch(() => false);
  600 | 
  601 |       expect(has404 || hasNotFound).toBe(false);
  602 | 
  603 |       // Verify URL still has params (or redirect preserved them)
  604 |       const url = page.url();
  605 |       const hasWorkshopCode = url.includes(workshopCode) || url.includes('w=');
  606 |       
  607 |       // Some pages redirect, so we just verify no error
  608 |       console.log(`  ${route}: OK`);
  609 |     }
  610 | 
  611 |     console.log('✅ All routes accessible with workshop parameters');
  612 |   });
  613 | 
  614 |   // ==========================================
  615 |   // TEST 13: Bottom Navigation Bar
  616 |   // ==========================================
  617 |   test('13. Bottom navigation bar functionality', async ({ page }) => {
  618 |     // Start at dashboard
  619 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  620 |     await page.waitForTimeout(2000);
  621 | 
  622 |     // Test Home link
  623 |     await page.click('a.nav-item:has-text("Home"), a:has-text("Home")');
  624 |     await page.waitForTimeout(1500);
  625 |     expect(page.url()).toContain('/dashboard');
  626 | 
  627 |     // Test Patients link
  628 |     await page.click('a.nav-item:has-text("Patients"), a:has-text("Patients")');
  629 |     await page.waitForURL('**/patient/search**');
  630 |     await expect(page.locator('h1:has-text("Find Patient"), h1:has-text("Search")')).toBeVisible();
  631 | 
  632 |     // Test Developer link
  633 |     await page.click('a.nav-item:has-text("Developer"), a:has-text("Developer")');
  634 |     await page.waitForURL('**/developer**');
  635 |     await page.waitForTimeout(1500);
  636 |     
  637 |     // Verify developer page loaded
  638 |     const hasDevHeader = await page.locator('h1:has-text("Developer"), h2:has-text("Developer")').isVisible().catch(() => false);
  639 |     const hasSendButton = await page.locator('button:has-text("Send")').isVisible().catch(() => false);
  640 |     expect(hasDevHeader || hasSendButton).toBe(true);
  641 | 
  642 |     console.log('✅ Bottom navigation bar works correctly');
  643 |   });
  644 | 
  645 |   // ==========================================
  646 |   // TEST 14: Link Testing - All Action Links
  647 |   // ==========================================
  648 |   test('14. All action links have valid hrefs', async ({ page }) => {
  649 |     // Login with RHU Kalibo (has most actions)
  650 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  651 |     await page.waitForTimeout(2000);
  652 | 
```