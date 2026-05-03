# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 18. Logout clears session
- Location: tests/workshop-ak26a-complete.spec.js:773:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('.user-menu-btn, button:has-text("Thomas"), .user-avatar')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - banner [ref=e6]:
    - button "🏥 RHU Kalibo ↻" [ref=e8] [cursor=pointer]:
      - generic [ref=e9]: 🏥
      - generic [ref=e10]: RHU Kalibo
      - generic [ref=e11]: ↻
    - strong [ref=e13]: Thomas
    - button "👁️" [ref=e14] [cursor=pointer]
    - button "🚪" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e18]: 🏥
      - generic [ref=e19]:
        - strong [ref=e20]: RHU Kalibo
        - paragraph [ref=e21]: Primary care — register patients, record visits, order labs, view results, refer to hospital
    - heading "What do you want to do?" [level=1] [ref=e22]
    - generic [ref=e23]:
      - link "➕ Register Patient Add new person to SHR" [ref=e24] [cursor=pointer]:
        - /url: /patient/new?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e25]: ➕
        - generic [ref=e26]:
          - strong [ref=e27]: Register Patient
          - generic [ref=e28]: Add new person to SHR
      - link "🔍 Find Patient Search by name or ID" [ref=e29] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e30]: 🔍
        - generic [ref=e31]:
          - strong [ref=e32]: Find Patient
          - generic [ref=e33]: Search by name or ID
      - link "📋 Record Visit Document encounter" [ref=e34] [cursor=pointer]:
        - /url: /encounter?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e35]: 📋
        - generic [ref=e36]:
          - strong [ref=e37]: Record Visit
          - generic [ref=e38]: Document encounter
      - link "🩺 Record Vitals BP, HR, Temperature" [ref=e39] [cursor=pointer]:
        - /url: /vitals?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e40]: 🩺
        - generic [ref=e41]:
          - strong [ref=e42]: Record Vitals
          - generic [ref=e43]: BP, HR, Temperature
      - link "🧪 Order Labs Create lab orders / referrals" [ref=e44] [cursor=pointer]:
        - /url: /service-request?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e45]: 🧪
        - generic [ref=e46]:
          - strong [ref=e47]: Order Labs
          - generic [ref=e48]: Create lab orders / referrals
      - link "💊 Prescribe Create medication orders" [ref=e49] [cursor=pointer]:
        - /url: /medication-request?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e50]: 💊
        - generic [ref=e51]:
          - strong [ref=e52]: Prescribe
          - generic [ref=e53]: Create medication orders
      - link "🔬 View Lab Results Check patient lab reports" [ref=e54] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e55]: 🔬
        - generic [ref=e56]:
          - strong [ref=e57]: View Lab Results
          - generic [ref=e58]: Check patient lab reports
      - link "💉 View Medications Check prescriptions & dispensed meds" [ref=e59] [cursor=pointer]:
        - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo&returnTo=%2Fdashboard
        - generic [ref=e60]: 💉
        - generic [ref=e61]:
          - strong [ref=e62]: View Medications
          - generic [ref=e63]: Check prescriptions & dispensed meds
    - generic [ref=e64]:
      - heading "🔗 HIE Data Overview" [level=2] [ref=e65]
      - paragraph [ref=e66]:
        - text: Data visible to
        - strong [ref=e67]: RHU Kalibo
        - text: across all clinics
      - generic [ref=e68]:
        - link "17 Patients" [ref=e69] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e70]: "17"
          - generic [ref=e71]: Patients
        - link "1 Encounters" [ref=e72] [cursor=pointer]:
          - /url: /patient/search
          - generic [ref=e73]: "1"
          - generic [ref=e74]: Encounters
        - link "3 Lab Orders" [ref=e75] [cursor=pointer]:
          - /url: /inbox?tab=orders
          - generic [ref=e76]: "3"
          - generic [ref=e77]: Lab Orders
        - link "3 Prescriptions" [ref=e78] [cursor=pointer]:
          - /url: /inbox?tab=rx
          - generic [ref=e79]: "3"
          - generic [ref=e80]: Prescriptions
        - link "4 Lab Reports" [ref=e81] [cursor=pointer]:
          - /url: /inbox?tab=reports
          - generic [ref=e82]: "4"
          - generic [ref=e83]: Lab Reports
        - link "3 Dispensed" [ref=e84] [cursor=pointer]:
          - /url: /inbox?tab=dispensed
          - generic [ref=e85]: "3"
          - generic [ref=e86]: Dispensed
    - generic [ref=e87]:
      - paragraph [ref=e88]:
        - text: "🎓 Workshop:"
        - strong [ref=e89]: AK26-A
      - paragraph [ref=e90]:
        - text: "🌐 Group Filter:"
        - button "🏷️ Group Only" [ref=e91] [cursor=pointer]
  - navigation [ref=e92]:
    - link "🏠 Home" [ref=e93] [cursor=pointer]:
      - /url: /dashboard?w=AK26-A&u=Thomas&c=rhu-kalibo
      - generic [ref=e94]: 🏠
      - generic [ref=e95]: Home
    - link "👤 Patients" [ref=e96] [cursor=pointer]:
      - /url: /patient/search?w=AK26-A&u=Thomas&c=rhu-kalibo
      - generic [ref=e97]: 👤
      - generic [ref=e98]: Patients
    - link "📥 Inbox ●" [ref=e99] [cursor=pointer]:
      - /url: /inbox?w=AK26-A&u=Thomas&c=rhu-kalibo
      - generic [ref=e100]: 📥
      - generic [ref=e101]: Inbox
      - generic [ref=e102]: ●
    - link "🔧 Developer" [ref=e103] [cursor=pointer]:
      - /url: /developer?w=AK26-A&u=Thomas&c=rhu-kalibo
      - generic [ref=e104]: 🔧
      - generic [ref=e105]: Developer
```

# Test source

```ts
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
> 779 |     await page.click('.user-menu-btn, button:has-text("Thomas"), .user-avatar');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
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
  824 |       // Verify URL contains expected path
  825 |       const url = page.url();
  826 |       expect(url).toContain(step.expectedUrl);
  827 | 
  828 |       // Verify workshop context maintained
  829 |       if (!step.action === 'goto') {
  830 |         expect(url).toContain(`w=${workshopCode}`);
  831 |         expect(url).toContain(`u=${userName}`);
  832 |       }
  833 |     }
  834 | 
  835 |     console.log('✅ Cross-page navigation maintains state');
  836 |   });
  837 | 
  838 |   // ==========================================
  839 |   // TEST 20: End-to-End Complete Workflow
  840 |   // ==========================================
  841 |   test('20. End-to-end complete workflow', async ({ page }) => {
  842 |     console.log('Starting end-to-end workflow test...');
  843 | 
  844 |     // Step 1: Login
  845 |     await page.goto('/workshop');
  846 |     await page.click(`button.chip:has-text("${workshopCode}")`);
  847 |     await page.waitForTimeout(800);
  848 |     await page.fill('input#first-name', userName);
  849 |     await page.waitForTimeout(800);
  850 |     await page.click('.clinic-card:has-text("RHU Kalibo")');
  851 |     await page.waitForTimeout(800);
  852 |     await page.click('button[type="submit"]');
  853 |     await page.waitForURL('**/dashboard', { timeout: 15000 });
  854 |     console.log('  Step 1: Login complete');
  855 | 
  856 |     // Step 2: Register a patient
  857 |     await page.click('a:has-text("Register Patient")');
  858 |     await page.waitForURL('**/patient/new**');
  859 |     
  860 |     const testId = Date.now();
  861 |     await page.fill('input#givenName', `E2E${testId}`);
  862 |     await page.fill('input#familyName', 'TestPatient');
  863 |     await page.selectOption('select#gender', 'male');
  864 |     await page.fill('input#birthDate', '1985-03-15');
  865 |     await page.fill('input#phId', `E2E-${testId}`);
  866 |     
  867 |     await page.click('button[type="submit"]');
  868 |     await page.waitForTimeout(3000);
  869 |     console.log('  Step 2: Patient registration submitted');
  870 | 
  871 |     // Step 3: Search for the patient
  872 |     await page.goto(`/patient/search?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
  873 |     await page.waitForTimeout(2000);
  874 |     
  875 |     await page.fill('input[placeholder*="Filter"], input[placeholder*="Search"]', `E2E${testId}`);
  876 |     await page.click('button:has-text("Search")');
  877 |     await page.waitForTimeout(2000);
  878 |     console.log('  Step 3: Patient search performed');
  879 | 
```