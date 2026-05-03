# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 13. Bottom navigation bar functionality
- Location: tests/workshop-ak26a-complete.spec.js:617:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("Find Patient"), h1:has-text("Search")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1:has-text("Find Patient"), h1:has-text("Search")')

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
> 630 |     await expect(page.locator('h1:has-text("Find Patient"), h1:has-text("Search")')).toBeVisible();
      |                                                                                      ^ Error: expect(locator).toBeVisible() failed
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
  653 |     // Get all action card links
  654 |     const actionLinks = page.locator('a.action-card');
  655 |     const count = await actionLinks.count();
  656 | 
  657 |     console.log(`  Found ${count} action links`);
  658 | 
  659 |     for (let i = 0; i < count; i++) {
  660 |       const link = actionLinks.nth(i);
  661 |       const href = await link.getAttribute('href');
  662 |       const text = await link.textContent();
  663 | 
  664 |       // Verify href exists and has parameters
  665 |       expect(href).toBeTruthy();
  666 |       expect(href).toContain('returnTo=');
  667 | 
  668 |       console.log(`  ${text?.trim()}: ${href}`);
  669 |     }
  670 | 
  671 |     // Verify specific important links exist
  672 |     const importantActions = ['Register Patient', 'Find Patient', 'Record Visit', 'Record Vitals', 'Order Labs', 'Prescribe'];
  673 |     for (const action of importantActions) {
  674 |       const link = page.locator(`a.action-card:has-text("${action}")`);
  675 |       const exists = await link.isVisible().catch(() => false);
  676 |       
  677 |       if (exists) {
  678 |         const href = await link.getAttribute('href');
  679 |         expect(href).toContain(`w=${workshopCode}`);
  680 |         expect(href).toContain(`u=${userName}`);
  681 |       }
  682 |     }
  683 | 
  684 |     console.log('✅ All action links validated');
  685 |   });
  686 | 
  687 |   // ==========================================
  688 |   // TEST 15: Developer Mode Testing
  689 |   // ==========================================
  690 |   test('15. Developer mode API testing', async ({ page }) => {
  691 |     await page.goto('/developer');
  692 |     await page.waitForTimeout(2000);
  693 | 
  694 |     // Verify developer page loaded
  695 |     await expect(page.locator('h1:has-text("Developer"), h2:has-text("Developer")')).toBeVisible();
  696 |     await expect(page.locator('button:has-text("Send Request"), button:has-text("Send")')).toBeVisible();
  697 | 
  698 |     // Test sending a GET request
  699 |     await page.click('button:has-text("Send Request"), button:has-text("Send")');
  700 |     await page.waitForTimeout(3000);
  701 | 
  702 |     // Verify response area shows something
  703 |     const hasResponse = await page.locator('.response-area, .response-panel, pre, .json-content').isVisible().catch(() => false);
  704 |     
  705 |     if (hasResponse) {
  706 |       console.log('✅ Developer mode API test returned response');
  707 |     } else {
  708 |       console.log('ℹ️ Developer mode accessible (response visibility may vary)');
  709 |     }
  710 | 
  711 |     // Verify page is still functional
  712 |     await expect(page.locator('button:has-text("Send Request"), button:has-text("Send")')).toBeVisible();
  713 |   });
  714 | 
  715 |   // ==========================================
  716 |   // TEST 16: Facilitator Dashboard
  717 |   // ==========================================
  718 |   test('16. Facilitator dashboard access', async ({ page }) => {
  719 |     await page.goto('/facilitator');
  720 |     await page.waitForTimeout(2000);
  721 | 
  722 |     // Verify facilitator page loaded
  723 |     await expect(page.locator('h2:has-text("Workshop Monitor"), h1:has-text("Facilitator")')).toBeVisible();
  724 |     
  725 |     // Test loading workshop data
  726 |     await page.fill('input.workshop-input, input[placeholder*="workshop"]', workshopCode);
  727 |     await page.click('button:has-text("Load"), button:has-text("Monitor")');
  728 |     await page.waitForTimeout(3000);
  729 | 
  730 |     // Verify stats loaded or error shown
```