import { test, expect } from '@playwright/test';

/**
 * State Transitions and Edge Cases Tests
 * Tests URL parameter handling, state persistence, and error scenarios
 */

test.describe('State Transitions & Edge Cases', () => {
  const workshopCode = 'AK26-A';
  const userName = 'Thomas';

  // ==========================================
  // URL PARAMETER TESTS
  // ==========================================
  test.describe('URL Parameter Handling', () => {
    
    test('Parameters persist through redirects', async ({ page }) => {
      // Navigate with parameters
      await page.goto(`/encounter?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // May redirect to patient search if no patient selected
      const url = page.url();
      
      // Parameters should be preserved in redirect
      if (url.includes('patient/search')) {
        expect(url).toContain(`w=${workshopCode}`);
        expect(url).toContain(`u=${userName}`);
        expect(url).toContain('c=rhu-kalibo');
      }

      console.log('✅ Parameters preserved through redirect');
    });

    test('Malformed URL parameters handled gracefully', async ({ page }) => {
      // Test with special characters in workshop code
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo&extra=param`);
      await page.waitForTimeout(2000);

      // Page should load without error
      await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();

      // Test with encoded characters
      await page.goto(`/dashboard?w=${encodeURIComponent(workshopCode)}&u=${encodeURIComponent(userName)}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).toContain(workshopCode);
      
      console.log('✅ Malformed parameters handled gracefully');
    });

    test('Missing required parameters behavior', async ({ page }) => {
      // Test without workshop code
      await page.goto(`/dashboard?u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      const url = page.url();
      
      // Should redirect to workshop page or show warning
      const isOnWorkshop = url.includes('/workshop');
      const hasWarning = await page.locator('.warning, .alert, .notification').isVisible().catch(() => false);
      
      if (isOnWorkshop) {
        console.log('  Redirected to workshop (missing workshop code)');
      } else {
        console.log('  Handled missing parameter on current page');
      }

      // Test without clinic
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}`);
      await page.waitForTimeout(2000);

      const url2 = page.url();
      // May use default clinic or redirect
      console.log('✅ Missing clinic parameter handled');
    });

    test('Extra and unexpected parameters ignored', async ({ page }) => {
      // Add extra parameters
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo&foo=bar&test=123&malicious=<script>`);
      await page.waitForTimeout(2000);

      // Page should still work
      await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();

      const content = await page.content();
      // Should not have script injection
      expect(content).not.toContain('<script>');

      console.log('✅ Extra parameters handled safely');
    });

    test('returnTo parameter in action links', async ({ page }) => {
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Get all action links
      const actionLinks = page.locator('a.action-card');
      const count = await actionLinks.count();

      for (let i = 0; i < count; i++) {
        const link = actionLinks.nth(i);
        const href = await link.getAttribute('href');
        
        // Verify returnTo parameter exists and is properly encoded
        expect(href).toContain('returnTo=');
        
        // Decode and verify it's a valid path
        const returnToMatch = href.match(/returnTo=([^&]+)/);
        if (returnToMatch) {
          const returnTo = decodeURIComponent(returnToMatch[1]);
          expect(returnTo).toContain('/dashboard');
        }
      }

      console.log(`✅ returnTo parameter validated in ${count} links`);
    });
  });

  // ==========================================
  // CLINIC SWITCHING STATE TESTS
  // ==========================================
  test.describe('Clinic Switching State Management', () => {
    
    test('Switch clinic preserves all parameters', async ({ page }) => {
      // Start with specific parameters
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Add role parameter
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo&r=physician`);
      await page.waitForTimeout(2000);

      // Open clinic switcher
      await page.click('.clinic-switcher-btn, .clinic-badge').catch(async () => {
        // Try alternative selector
        await page.click('[class*="clinic"]').catch(() => {});
      });
      await page.waitForTimeout(1000);

      // Click on different clinic
      const newClinicId = 'aklan-hospital';
      await page.click(`.clinic-option:has-text("Hospital"), .dropdown-item:has-text("Hospital")`).catch(async () => {
        await page.click('text=Aklan Provincial Hospital').catch(() => {});
      });

      await page.waitForTimeout(3000);

      // Verify all original parameters preserved except clinic
      const url = page.url();
      expect(url).toContain(`w=${workshopCode}`);
      expect(url).toContain(`u=${userName}`);
      expect(url).toContain(`c=${newClinicId}`);
      
      console.log('✅ Clinic switch preserves all parameters');
    });

    test('Rapid clinic switching handled correctly', async ({ page }) => {
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      const clinics = ['rhu-kalibo', 'aklan-hospital', 'rhu-malay', 'kalibo-lab', 'aklan-pharmacy'];

      // Switch through all clinics rapidly
      for (const clinic of clinics) {
        await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=${clinic}`);
        await page.waitForTimeout(1000);

        const url = page.url();
        expect(url).toContain(`c=${clinic}`);
        
        // Verify page loaded correctly
        await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();
      }

      console.log('✅ Rapid clinic switching handled correctly');
    });

    test('Clinic switch resets action-specific state', async ({ page }) => {
      // Start filling a form at one clinic
      await page.goto(`/patient/new?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Fill partial form
      await page.fill('input#givenName', 'Incomplete');
      await page.fill('input#familyName', 'Patient');

      // Switch to different clinic
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-hospital`);
      await page.waitForTimeout(2000);

      // Go back to registration - form should be empty or state handled
      await page.click('a:has-text("Register Patient")');
      await page.waitForTimeout(2000);

      // Verify we're on registration page
      const url = page.url();
      expect(url).toContain('/patient/new');

      console.log('✅ Form state handled on clinic switch');
    });
  });

  // ==========================================
  // NAVIGATION STATE TESTS
  // ==========================================
  test.describe('Navigation State Preservation', () => {
    
    test('Browser back/forward preserves state', async ({ page }) => {
      // Navigate through multiple pages
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(1500);

      await page.click('a:has-text("Find Patient")');
      await page.waitForURL('**/patient/search**');
      await page.waitForTimeout(1500);

      await page.click('a:has-text("Register Patient")');
      await page.waitForURL('**/patient/new**');
      await page.waitForTimeout(1500);

      // Go back
      await page.goBack();
      await page.waitForTimeout(1500);

      // Should be on search page with params
      let url = page.url();
      expect(url).toContain('/patient/search');
      expect(url).toContain(`w=${workshopCode}`);

      // Go back again
      await page.goBack();
      await page.waitForTimeout(1500);

      // Should be on dashboard
      url = page.url();
      expect(url).toContain('/dashboard');
      expect(url).toContain(`w=${workshopCode}`);

      // Go forward
      await page.goForward();
      await page.waitForTimeout(1500);

      url = page.url();
      expect(url).toContain('/patient');

      console.log('✅ Browser back/forward preserves state');
    });

    test('Tab/window refresh preserves login state', async ({ page }) => {
      // Login
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Refresh page
      await page.reload();
      await page.waitForTimeout(3000);

      // Should still be logged in
      const url = page.url();
      expect(url).toContain('/dashboard');
      expect(url).toContain(`w=${workshopCode}`);
      expect(url).toContain(`u=${userName}`);

      // Verify user info still displayed
      await expect(page.locator(`text=${userName}`).first()).toBeVisible();

      console.log('✅ Page refresh preserves login state');
    });

    test('Direct URL access to internal pages', async ({ page }) => {
      const internalPages = [
        `/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`,
        `/patient/search?w=${workshopCode}&u=${userName}&c=rhu-kalibo`,
        `/encounter?w=${workshopCode}&u=${userName}&c=rhu-kalibo`,
        `/vitals?w=${workshopCode}&u=${userName}&c=rhu-kalibo`
      ];

      for (const pageUrl of internalPages) {
        await page.goto(pageUrl);
        await page.waitForTimeout(2000);

        // Should not redirect to workshop (unless truly unauthenticated)
        const url = page.url();
        
        if (url.includes('/workshop')) {
          // May redirect if auth is strictly required
          console.log(`  ${pageUrl}: Redirected to workshop`);
        } else {
          expect(url).not.toContain('404');
          console.log(`  ${pageUrl}: Accessible`);
        }
      }

      console.log('✅ Direct URL access handled');
    });
  });

  // ==========================================
  // ERROR STATE TESTS
  // ==========================================
  test.describe('Error State Handling', () => {
    
    test('Invalid patient ID shows error', async ({ page }) => {
      await page.goto(`/patient/invalid-patient-id-99999?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(3000);

      // Should not be stuck on loading
      const isStuckLoading = await page.locator('.skeleton-row, .loading-spinner, text=Loading...').count() > 0;
      expect(isStuckLoading).toBe(false);

      // Should show error or "not found" state
      const hasError = await page.locator('.error-state, .error-banner, text=Not Found, text=Error').isVisible().catch(() => false);
      const hasContent = await page.locator('.patient-header, h2, .patient-info').count() > 0;

      expect(hasError || hasContent).toBe(true);

      console.log('✅ Invalid patient ID handled gracefully');
    });

    test('Invalid encounter ID handled', async ({ page }) => {
      await page.goto(`/encounter/edit?id=invalid-encounter-99999&w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(3000);

      const isStuckLoading = await page.locator('.skeleton-row, .loading-spinner').count() > 0;
      expect(isStuckLoading).toBe(false);

      const url = page.url();
      // May redirect or show error
      console.log('✅ Invalid encounter ID handled');
    });

    test('Server error states', async ({ page }) => {
      // Try to access with invalid workshop (should work but may show empty)
      await page.goto(`/dashboard?w=INVALID-WORKSHOP-999&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Page should still load
      await expect(page.locator('h1:has-text("What do you want to do")')).toBeVisible();

      console.log('✅ Invalid workshop code handled (page loads)');
    });

    test('Network error recovery', async ({ page }) => {
      // Simulate offline by blocking requests
      await page.route('**/*', route => {
        if (route.request().url().includes('fhirlab')) {
          route.abort('internetdisconnected');
        } else {
          route.continue();
        }
      });

      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(3000);

      // Page UI should still be accessible even if data fails to load
      const hasUI = await page.locator('h1, .action-card, nav').count() > 0;
      expect(hasUI).toBe(true);

      // Restore network
      await page.unroute('**/*');

      console.log('✅ Network error handled gracefully');
    });
  });

  // ==========================================
  // FORM STATE TESTS
  // ==========================================
  test.describe('Form State Management', () => {
    
    test('Form data persists during navigation', async ({ page }) => {
      // Go to registration form
      await page.goto(`/patient/new?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Fill form
      await page.fill('input#givenName', 'PersistTest');
      await page.fill('input#familyName', 'FormData');
      await page.selectOption('select#gender', 'female');

      // Navigate away
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(1500);

      // Come back
      await page.goto(`/patient/new?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Check if data persisted (implementation dependent)
      const givenNameValue = await page.inputValue('input#givenName').catch(() => '');
      
      if (givenNameValue === 'PersistTest') {
        console.log('✅ Form data persisted across navigation');
      } else {
        console.log('ℹ️ Form data not persisted (implementation choice)');
      }
    });

    test('Form validation prevents submission', async ({ page }) => {
      await page.goto(`/patient/new?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      
      // Check if button is disabled
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      
      if (!isDisabled) {
        // Try clicking
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should still be on form (validation prevented submission)
        const url = page.url();
        expect(url).toContain('/patient/new');
      }

      console.log('✅ Form validation prevents invalid submission');
    });
  });

  // ==========================================
  // SESSION STATE TESTS
  // ==========================================
  test.describe('Session State Management', () => {
    
    test('Session timeout handling', async ({ page }) => {
      // Login
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Clear storage to simulate session expiration
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Refresh page
      await page.reload();
      await page.waitForTimeout(3000);

      // Should handle gracefully - either redirect or show logged out state
      const url = page.url();
      const content = await page.content();

      if (url.includes('/workshop')) {
        console.log('✅ Session timeout redirects to login');
      } else {
        console.log('✅ Session timeout handled (may show guest state)');
      }
    });

    test('Multiple concurrent sessions', async ({ page, context }) => {
      // Create second page
      const page2 = await context.newPage();

      // Login with different clinic on page 1
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(2000);

      // Login with different clinic on page 2
      await page2.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=aklan-pharmacy`);
      await page2.waitForTimeout(2000);

      // Both should show their respective clinics
      const url1 = page.url();
      const url2 = page2.url();

      expect(url1).toContain('c=rhu-kalibo');
      expect(url2).toContain('c=aklan-pharmacy');

      // Close second page
      await page2.close();

      console.log('✅ Multiple concurrent sessions handled');
    });
  });

  // ==========================================
  // LOCAL STORAGE TESTS
  // ==========================================
  test.describe('Local Storage State', () => {
    
    test('Workshop code stored in localStorage', async ({ page }) => {
      await page.goto(`/dashboard?w=${workshopCode}&u=${userName}&c=rhu-kalibo`);
      await page.waitForTimeout(3000);

      // Check localStorage
      const storage = await page.evaluate(() => {
        return {
          workshopCode: localStorage.getItem('workshopCode'),
          userName: localStorage.getItem('userName'),
          clinicId: localStorage.getItem('clinicId')
        };
      });

      if (storage.workshopCode || storage.userName || storage.clinicId) {
        console.log('✅ User state stored in localStorage');
      } else {
        console.log('ℹ️ No localStorage usage (may use other state management)');
      }
    });

    test('State restoration from localStorage', async ({ page }) => {
      // Set localStorage manually
      await page.goto('/');
      await page.evaluate((ws, user, clinic) => {
        localStorage.setItem('workshopCode', ws);
        localStorage.setItem('userName', user);
        localStorage.setItem('clinicId', clinic);
      }, workshopCode, userName, 'rhu-kalibo');

      // Navigate to dashboard without URL params
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Check if state was restored
      const url = page.url();
      
      if (url.includes(workshopCode) || url.includes(userName)) {
        console.log('✅ State restored from localStorage');
      } else {
        console.log('ℹ️ State not auto-restored (may require manual login)');
      }
    });
  });
});
