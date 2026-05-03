# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workshop-workflow.spec.js >> OpenHIE Mock EHR - Workshop Workflow Tests >> 8. Navigation via bottom nav bar
- Location: tests/workshop-workflow.spec.js:252:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a.nav-item:has-text("Home")')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: 🏥
        - generic [ref=e8]:
          - heading "OpenHIE Mock EHR" [level=1] [ref=e9]
          - text: FHIR Fundamentals 2026 - Aklan
      - navigation [ref=e10]:
        - link "Clinical View" [ref=e11] [cursor=pointer]:
          - /url: /
        - link "Technical Dashboard" [ref=e12] [cursor=pointer]:
          - /url: /developer
        - link "Architecture" [ref=e13] [cursor=pointer]:
          - /url: /architecture
        - link "About" [ref=e14] [cursor=pointer]:
          - /url: /about
    - generic [ref=e15]:
      - generic [ref=e18]: "SHR: cdr.fhirlab.net"
      - generic [ref=e21]: "Terminology: tx.fhirlab.net"
    - generic [ref=e22]:
      - generic [ref=e23]:
        - link "← Back to Dashboard" [ref=e24] [cursor=pointer]:
          - /url: /dashboard
        - heading "🔍 Find Patient" [level=1] [ref=e25]
        - paragraph [ref=e26]: "Showing all 7 patients from workshop: AK26-A"
      - generic [ref=e27]:
        - generic [ref=e28]:
          - textbox "Filter patients by name (or leave empty to show all)..." [ref=e29]
          - button "🔍 Search" [ref=e30] [cursor=pointer]
        - generic [ref=e32] [cursor=pointer]:
          - checkbox "🏷️ Only show AK26-A patients" [checked] [ref=e33]
          - generic [ref=e34]: 🏷️ Only show AK26-A patients
      - generic [ref=e35]:
        - generic [ref=e36]:
          - heading "👥 Patient Deck (AK26-A)" [level=2] [ref=e37]
          - generic [ref=e38]: 7 of 7 patients
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]:
              - generic [ref=e42]: 👩
              - generic [ref=e43]:
                - heading "Test1777794937695 Workflow" [level=3] [ref=e44]
                - generic [ref=e45]:
                  - generic [ref=e47]: 40 years • female
                  - generic [ref=e48]: 🏷️ AK26-A
                - generic [ref=e49]: "ID: 2033"
            - generic [ref=e50]:
              - button "👁️ View" [ref=e51] [cursor=pointer]
              - button "📋 Visit" [ref=e52] [cursor=pointer]
              - button "🩺 Vitals" [ref=e53] [cursor=pointer]
          - generic [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e56]: 👩
              - generic [ref=e57]:
                - heading "Test1777794933074 Workflow" [level=3] [ref=e58]
                - generic [ref=e59]:
                  - generic [ref=e61]: 40 years • female
                  - generic [ref=e62]: 🏷️ AK26-A
                - generic [ref=e63]: "ID: 2032"
            - generic [ref=e64]:
              - button "👁️ View" [ref=e65] [cursor=pointer]
              - button "📋 Visit" [ref=e66] [cursor=pointer]
              - button "🩺 Vitals" [ref=e67] [cursor=pointer]
          - generic [ref=e68]:
            - generic [ref=e69]:
              - generic [ref=e70]: 👩
              - generic [ref=e71]:
                - heading "Test1777794896652 Workflow" [level=3] [ref=e72]
                - generic [ref=e73]:
                  - generic [ref=e75]: 40 years • female
                  - generic [ref=e76]: 🏷️ AK26-A
                - generic [ref=e77]: "ID: 2031"
            - generic [ref=e78]:
              - button "👁️ View" [ref=e79] [cursor=pointer]
              - button "📋 Visit" [ref=e80] [cursor=pointer]
              - button "🩺 Vitals" [ref=e81] [cursor=pointer]
          - generic [ref=e82]:
            - generic [ref=e83]:
              - generic [ref=e84]: 👩
              - generic [ref=e85]:
                - heading "Test1777794891619 Workflow" [level=3] [ref=e86]
                - generic [ref=e87]:
                  - generic [ref=e89]: 40 years • female
                  - generic [ref=e90]: 🏷️ AK26-A
                - generic [ref=e91]: "ID: 2030"
            - generic [ref=e92]:
              - button "👁️ View" [ref=e93] [cursor=pointer]
              - button "📋 Visit" [ref=e94] [cursor=pointer]
              - button "🩺 Vitals" [ref=e95] [cursor=pointer]
          - generic [ref=e96]:
            - generic [ref=e97]:
              - generic [ref=e98]: 👩
              - generic [ref=e99]:
                - heading "Test1777794796533 Workflow" [level=3] [ref=e100]
                - generic [ref=e101]:
                  - generic [ref=e103]: 40 years • female
                  - generic [ref=e104]: 🏷️ AK26-A
                - generic [ref=e105]: "ID: 2029"
            - generic [ref=e106]:
              - button "👁️ View" [ref=e107] [cursor=pointer]
              - button "📋 Visit" [ref=e108] [cursor=pointer]
              - button "🩺 Vitals" [ref=e109] [cursor=pointer]
          - generic [ref=e110]:
            - generic [ref=e111]:
              - generic [ref=e112]: 👩
              - generic [ref=e113]:
                - heading "Test1777794791416 Workflow" [level=3] [ref=e114]
                - generic [ref=e115]:
                  - generic [ref=e117]: 40 years • female
                  - generic [ref=e118]: 🏷️ AK26-A
                - generic [ref=e119]: "ID: 2028"
            - generic [ref=e120]:
              - button "👁️ View" [ref=e121] [cursor=pointer]
              - button "📋 Visit" [ref=e122] [cursor=pointer]
              - button "🩺 Vitals" [ref=e123] [cursor=pointer]
          - generic [ref=e124]:
            - generic [ref=e125]:
              - generic [ref=e126]: 👨
              - generic [ref=e127]:
                - heading "Roger Rogerson" [level=3] [ref=e128]
                - generic [ref=e129]:
                  - generic [ref=e131]: 0 years • male
                  - generic [ref=e132]: 🏷️ AK26-A
                - generic [ref=e133]: "ID: 2027"
            - generic [ref=e134]:
              - button "👁️ View" [ref=e135] [cursor=pointer]
              - button "📋 Visit" [ref=e136] [cursor=pointer]
              - button "🩺 Vitals" [ref=e137] [cursor=pointer]
  - generic [ref=e138]: Join Workshop - OpenHIE Mock EHR
```

# Test source

```ts
  166 |   });
  167 | 
  168 |   test('6. Vitals page loads', async ({ page }) => {
  169 |     // Login first
  170 |     await page.fill('#workshop-code', workshopCode);
  171 |     await page.fill('#first-name', userName);
  172 |     await page.click(`.clinic-card:has-text("RHU Kalibo")`);
  173 |     await page.click('button[type="submit"]');
  174 |     await page.waitForURL('/dashboard');
  175 |     
  176 |     // Navigate to vitals page
  177 |     await page.click('a:has-text("Record Vitals")');
  178 |     
  179 |     // Check if page loads
  180 |     await page.waitForTimeout(2000);
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
> 266 |     await page.click('a.nav-item:has-text("Home")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  267 |     await page.waitForURL('/dashboard');
  268 |     await expect(page.locator('text=What do you want to do?')).toBeVisible();
  269 |     
  270 |     console.log('✅ Bottom navigation works');
  271 |   });
  272 | });
```