# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 16. Facilitator dashboard access
- Location: tests/workshop-ak26a-complete.spec.js:718:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2:has-text("Workshop Monitor"), h1:has-text("Facilitator")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h2:has-text("Workshop Monitor"), h1:has-text("Facilitator")')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "500" [level=1] [ref=e5]
  - paragraph [ref=e6]: Internal Error
```

# Test source

```ts
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
> 723 |     await expect(page.locator('h2:has-text("Workshop Monitor"), h1:has-text("Facilitator")')).toBeVisible();
      |                                                                                               ^ Error: expect(locator).toBeVisible() failed
  724 |     
  725 |     // Test loading workshop data
  726 |     await page.fill('input.workshop-input, input[placeholder*="workshop"]', workshopCode);
  727 |     await page.click('button:has-text("Load"), button:has-text("Monitor")');
  728 |     await page.waitForTimeout(3000);
  729 | 
  730 |     // Verify stats loaded or error shown
  731 |     const hasStats = await page.locator('.stat-card, .stats-grid, .participant-card').count() > 0;
  732 |     const hasEmpty = await page.locator('text=No data, text=empty, text=found').isVisible().catch(() => false);
  733 | 
  734 |     expect(hasStats || hasEmpty).toBe(true);
  735 | 
  736 |     console.log('✅ Facilitator dashboard accessible');
  737 |   });
  738 | 
  739 |   // ==========================================
  740 |   // TEST 17: Error State Handling
  741 |   // ==========================================
  742 |   test('17. Error state handling', async ({ page }) => {
  743 |     // Test invalid patient ID
  744 |     await page.goto(`/patient/invalid-id-12345?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  745 |     await page.waitForTimeout(3000);
  746 | 
  747 |     // Should show error state or redirect, not get stuck
  748 |     const hasError = await page.locator('.error-state, .error-banner, .error-message').isVisible().catch(() => false);
  749 |     const hasContent = await page.locator('h1, h2, .patient-header').count() > 0;
  750 |     const isStuckLoading = await page.locator('.skeleton-row, .skeleton-header, .loading-spinner').count() > 0;
  751 | 
  752 |     // Should not be stuck on loading
  753 |     expect(isStuckLoading).toBe(false);
  754 | 
  755 |     // Should show either error or some content
  756 |     expect(hasError || hasContent).toBe(true);
  757 | 
  758 |     // Test 404 page
  759 |     await page.goto('/nonexistent-page-12345');
  760 |     await page.waitForTimeout(2000);
  761 | 
  762 |     const has404Error = await page.locator('text=404, text=Not Found, .error-404').isVisible().catch(() => false);
  763 |     // 404 handling may vary, just verify page doesn't crash
  764 |     const pageContent = await page.content();
  765 |     expect(pageContent.length).toBeGreaterThan(0);
  766 | 
  767 |     console.log('✅ Error states handled correctly');
  768 |   });
  769 | 
  770 |   // ==========================================
  771 |   // TEST 18: Logout Flow
  772 |   // ==========================================
  773 |   test('18. Logout clears session', async ({ page }) => {
  774 |     // Login first
  775 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  776 |     await page.waitForTimeout(2000);
  777 | 
  778 |     // Open user menu
  779 |     await page.click('.user-menu-btn, button:has-text("Thomas"), .user-avatar');
  780 |     await page.waitForTimeout(1000);
  781 | 
  782 |     // Click logout
  783 |     await page.click('button:has-text("Log Out"), button:has-text("Logout"), .logout-btn');
  784 |     await page.waitForTimeout(2000);
  785 | 
  786 |     // Verify redirect to workshop or home page
  787 |     const url = page.url();
  788 |     const isLoggedOut = url.includes('/workshop') || url === 'http://localhost:5173/' || url.endsWith('/');
  789 |     
  790 |     expect(isLoggedOut).toBe(true);
  791 | 
  792 |     console.log('✅ Logout flow successful');
  793 |   });
  794 | 
  795 |   // ==========================================
  796 |   // TEST 19: Cross-Page Navigation Consistency
  797 |   // ==========================================
  798 |   test('19. Cross-page navigation maintains state', async ({ page }) => {
  799 |     // Start at dashboard
  800 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-hospital`);
  801 |     await page.waitForTimeout(2000);
  802 | 
  803 |     // Navigate through multiple pages
  804 |     const navigationFlow = [
  805 |       { action: 'click', target: 'a:has-text("Register Patient")', expectedUrl: '/patient/new' },
  806 |       { action: 'back', expectedUrl: '/dashboard' },
  807 |       { action: 'click', target: 'a:has-text("Find Patient")', expectedUrl: '/patient/search' },
  808 |       { action: 'back', expectedUrl: '/dashboard' },
  809 |       { action: 'click', target: 'a:has-text("Record Visit")', expectedUrl: '/encounter' },
  810 |       { action: 'goto', target: `/dashboard?w=${workshopCode}&u=${userName}&c=aklan-hospital`, expectedUrl: '/dashboard' }
  811 |     ];
  812 | 
  813 |     for (const step of navigationFlow) {
  814 |       if (step.action === 'click') {
  815 |         await page.click(step.target);
  816 |       } else if (step.action === 'back') {
  817 |         await page.goBack();
  818 |       } else if (step.action === 'goto') {
  819 |         await page.goto(step.target);
  820 |       }
  821 | 
  822 |       await page.waitForTimeout(1500);
  823 | 
```