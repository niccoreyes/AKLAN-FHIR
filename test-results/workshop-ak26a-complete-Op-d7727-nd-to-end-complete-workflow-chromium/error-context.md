# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-ak26a-complete.spec.js >> OpenHIE Mock EHR - Complete Workshop Flow (AK26-A + Thomas) >> 20. End-to-end complete workflow
- Location: tests/workshop-ak26a-complete.spec.js:841:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button disabled type="submit" data-loading="false" data-has-clinic="true" data-has-username="true" data-has-workshop="false" class="submit svelte-1qiizl6">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    113 × waiting for element to be visible, enabled and stable
        - element is not enabled
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e6]:
  - banner [ref=e7]:
    - link "← Public Viewer" [ref=e9] [cursor=pointer]:
      - /url: /
    - heading "🎓 Join Workshop" [level=1] [ref=e10]
    - paragraph [ref=e11]: OpenHIE Mock EHR
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]: Workshop Code
      - textbox "Workshop Code" [ref=e16]:
        - /placeholder: Type or select a workshop code...
      - generic [ref=e17]:
        - generic [ref=e18]: "Quick select:"
        - generic [ref=e19]:
          - button "AK26-A" [ref=e20] [cursor=pointer]
          - button "AK26-B" [ref=e21] [cursor=pointer]
          - button "AK26-C" [ref=e22] [cursor=pointer]
          - button "AK26-D" [ref=e23] [cursor=pointer]
          - button "AK26-E" [ref=e24] [cursor=pointer]
    - generic [ref=e25]:
      - generic [ref=e26]: First Name
      - textbox "First Name" [ref=e27]:
        - /placeholder: Enter your first name
        - text: Thomas
    - generic [ref=e28]:
      - generic [ref=e29]: Select Clinic
      - generic [ref=e30]:
        - button "🏥 RHU Kalibo Rural Health Unit" [active] [ref=e31] [cursor=pointer]:
          - generic [ref=e32]: 🏥
          - generic [ref=e33]: RHU Kalibo
          - generic [ref=e34]: Rural Health Unit
        - button "🏥 Aklan Provincial Provincial Hospital" [ref=e35] [cursor=pointer]:
          - generic [ref=e36]: 🏥
          - generic [ref=e37]: Aklan Provincial
          - generic [ref=e38]: Provincial Hospital
        - button "🏥 RHU Malay Rural Health Unit" [ref=e39] [cursor=pointer]:
          - generic [ref=e40]: 🏥
          - generic [ref=e41]: RHU Malay
          - generic [ref=e42]: Rural Health Unit
        - button "🧪 Kalibo Lab Diagnostic Center" [ref=e43] [cursor=pointer]:
          - generic [ref=e44]: 🧪
          - generic [ref=e45]: Kalibo Lab
          - generic [ref=e46]: Diagnostic Center
        - button "💊 Aklan Pharmacy Pharmacy" [ref=e47] [cursor=pointer]:
          - generic [ref=e48]: 💊
          - generic [ref=e49]: Aklan Pharmacy
          - generic [ref=e50]: Pharmacy
    - generic [ref=e51]:
      - generic [ref=e52]: Select Your Role (Optional)
      - generic [ref=e53]:
        - button "📝 Registration Clerk Register new patients" [ref=e54] [cursor=pointer]:
          - generic [ref=e55]: 📝
          - generic [ref=e56]:
            - generic [ref=e57]: Registration Clerk
            - generic [ref=e58]: Register new patients
        - button "👩‍⚕️ Nurse / BHW Record vital signs and assessments" [ref=e59] [cursor=pointer]:
          - generic [ref=e60]: 👩‍⚕️
          - generic [ref=e61]:
            - generic [ref=e62]: Nurse / BHW
            - generic [ref=e63]: Record vital signs and assessments
        - button "👨‍⚕️ Physician Diagnose and create referrals" [ref=e64] [cursor=pointer]:
          - generic [ref=e65]: 👨‍⚕️
          - generic [ref=e66]:
            - generic [ref=e67]: Physician
            - generic [ref=e68]: Diagnose and create referrals
        - button "🧪 Lab Technician Process lab orders and results" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: 🧪
          - generic [ref=e71]:
            - generic [ref=e72]: Lab Technician
            - generic [ref=e73]: Process lab orders and results
        - button "💊 Pharmacist Dispense medications" [ref=e74] [cursor=pointer]:
          - generic [ref=e75]: 💊
          - generic [ref=e76]:
            - generic [ref=e77]: Pharmacist
            - generic [ref=e78]: Dispense medications
    - button "🚀 Enter EHR System" [disabled] [ref=e79]:
      - generic [ref=e80]: 🚀 Enter EHR System
  - contentinfo [ref=e81]:
    - link "← Public Viewer" [ref=e83] [cursor=pointer]:
      - /url: /
```

# Test source

```ts
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
> 852 |     await page.click('button[type="submit"]');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
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
  880 |     // Step 4: Navigate to various pages
  881 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-hospital`);
  882 |     await page.waitForTimeout(1500);
  883 |     
  884 |     await page.click('a:has-text("Order Labs")');
  885 |     await page.waitForTimeout(2000);
  886 |     console.log('  Step 4: Lab order page accessed');
  887 | 
  888 |     // Step 5: Switch clinics
  889 |     await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=kalibo-lab`);
  890 |     await page.waitForTimeout(1500);
  891 |     
  892 |     await page.click('a:has-text("Inbox")');
  893 |     await page.waitForTimeout(2000);
  894 |     console.log('  Step 5: Lab inbox accessed from lab clinic');
  895 | 
  896 |     // Step 6: Access developer mode
  897 |     await page.click('a.nav-item:has-text("Developer"), a:has-text("Developer")');
  898 |     await page.waitForTimeout(2000);
  899 |     console.log('  Step 6: Developer mode accessed');
  900 | 
  901 |     // Step 7: Return home
  902 |     await page.click('a.nav-item:has-text("Home"), a:has-text("Home")');
  903 |     await page.waitForTimeout(1500);
  904 |     
  905 |     const finalUrl = page.url();
  906 |     expect(finalUrl).toContain('/dashboard');
  907 |     expect(finalUrl).toContain(`w=${workshopCode}`);
  908 |     expect(finalUrl).toContain(`u=${userName}`);
  909 |     console.log('  Step 7: Returned to dashboard');
  910 | 
  911 |     console.log('✅ End-to-end workflow completed successfully');
  912 |   });
  913 | });
  914 | 
```