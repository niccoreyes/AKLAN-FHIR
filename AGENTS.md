# AGENTS.md - AKLAN-FHIR Project Context

## Project Overview

OpenHIE Mock EHR web application for the **FHIR Fundamentals 2026 - Aklan** workshop.
Built with Svelte 5 + SvelteKit, deployed on Vercel.

**Purpose:** Demonstrate OpenHIE interoperability concepts using FHIR R4 across multiple clinic types (RHU, Hospital, Lab, Pharmacy).

---

## Architecture Decisions

### 1. URL-Driven State (No localStorage)
**Decision:** All user state (workshop code, name, clinic, role) is stored in URL query parameters (`?w=AK26-A&u=Thomas&c=rhu-kalibo`).

**Why:**
- Enables shareable links (instructor can send direct links)
- No auth/tokens needed (fhirlab.net is fully public)
- Server-side rendering friendly
- Easy to debug (state visible in URL bar)
- Workshop isolation via `meta.tag` on FHIR resources

**Trade-off:**
- URL gets long
- State lost if user manually navigates without params
- Solution: `appStore.buildUrl()` helper preserves params on all navigation

### 2. Clinic-Based Capability System
**Decision:** Each clinic type has different capabilities using `CLINIC_CAPABILITIES` config.

```javascript
'rhu-kalibo': {
  canCreate: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest'],
  canView: ['Patient', 'Encounter', 'Observation', ...],
  primaryActions: ['register', 'encounter', 'vitals', 'order', 'prescribe'],
  description: 'Primary care — register patients, record visits, order labs, refer to hospital'
}
```

**Why:**
- Demonstrates real-world access control
- Pharmacy can't prescribe (only dispense)
- Lab can't register patients (only report results)
- Natural HIE demonstration

### 3. FHIR Resource Workflow Design

**Prescription Flow:**
1. Hospital creates `MedicationRequest` (status: active)
2. Pharmacy searches patient, sees active prescriptions
3. Pharmacy creates `MedicationDispense` (links to request)
4. App updates `MedicationRequest.status` → "completed"
5. Prescription disappears from active list

**Lab Order Flow:**
1. RHU creates `ServiceRequest` (status: active)
2. Lab views in work queue/inbox
3. Lab creates `DiagnosticReport` with observations
4. App updates `ServiceRequest.status` → "completed"
5. Order disappears from inbox

**Key Pattern:** Status updates happen in the *receiving* system (dispense updates prescription, report updates order), not the creating system.

### 4. Auto-Registration Pattern
**Problem:** When switching clinics (which reloads page), `practitionerId` is lost because it's not in URL.

**Solution:** 
- AppHeader has reactive `$effect` that detects missing `practitionerId`
- Automatically searches FHIR server by user name
- Reuses existing Practitioner or creates new one
- Forms trigger registration on-submit if still missing

**Why not store practitionerId in URL?**
- It's internal FHIR ID, not user-friendly
- Would expose implementation details
- Auto-registration is seamless enough

### 5. HIE Patient Search (Pharmacy Mode)
**Decision:** Pharmacy searches across entire SHR (no `_tag` filter) to find any patient with prescriptions.

**Why:**
- Demonstrates true HIE interoperability
- Pharmacy serves all clinics, not just one workshop group
- Uses `workshopCode` only for write operations (tagging dispenses)

---

## Common Issues & Solutions

### Issue: "Practitioner not registered" error
**Root Cause:** Store initialized from URL, but practitioner lookup is async. Race condition between page render and FHIR search.

**Solution:**
```javascript
// Forms now trigger registration on-submit if missing
if (!appStore.practitionerId) {
  error = 'Connecting to FHIR server...';
  await appStore.registerParticipant();
  if (!appStore.practitionerId) {
    error = 'Failed to register. Please refresh.';
    return;
  }
}
```

### Issue: Getting redirected to "/" on refresh
**Root Cause:** `onMount` hook checked `isConfigured` before store finished reading URL params.

**Solution:** Added URL param check alongside store check with 100ms delay:
```javascript
onMount(() => {
  const url = browser ? new URL(window.location.href) : null;
  const hasUrlConfig = url && (url.searchParams.get('w') || url.searchParams.get('u'));
  
  setTimeout(() => {
    if (!appStore.isConfigured && !hasUrlConfig) {
      window.location.replace('/');
    }
  }, 100);
});
```

### Issue: $effect_orphan error in store
**Root Cause:** Used `$effect` rune inside a plain JS module (appStore.svelte.js), but `$effect` only works inside `.svelte` components.

**Solution:** Moved auto-registration `$effect` from store to AppHeader.svelte component.

### Issue: Toast notifications blocking UI
**Root Cause:** Toasts positioned at `top: 80px` (overlapping header), too wide (400px), too long duration (5s).

**Solution:**
- Moved to `top: 130px` (below server bar)
- Reduced max-width to 320px
- Shortened duration: welcome messages 1.5s, errors 4s
- Added dismiss (×) button

### Issue: Losing workshop context when navigating
**Root Cause:** Hardcoded `href` attributes didn't include URL params.

**Solution:** Created `appStore.buildUrl(path, extraParams)` helper that auto-appends workshop context:
```javascript
// Before (broken):
goto('/dashboard')  // Loses context!

// After (fixed):
goto(appStore.buildUrl('/dashboard'))  // Preserves ?w=AK26-A&u=Thomas...
```

---

## Workshop Context

### Workshop Groups
- **AK26-A** through **AK26-E** (5 groups)
- ~20 people per group
- Data isolation via FHIR `meta.tag` = workshop code

### Clinic Types
| Clinic | Icon | Color | Key Capability |
|--------|------|-------|----------------|
| RHU Kalibo | 🏥 | #059669 | Full primary care |
| Aklan Provincial Hospital | 🏥 | #2563EB | Full + reporting |
| RHU Malay | 🏥 | #0891B2 | Limited (no prescriptions) |
| Kalibo Lab | 🧪 | #7C3ED | Reports only |
| Aklan Pharmacy | 💊 | #DC2626 | Dispense only |

### Test Server
- **SHR:** https://cdr.fhirlab.net/fhir (fully public, no auth)
- **Terminology:** https://tx.fhirlab.net/fhir
- **PH FDA ValueSet:** `https://tx.fhirlab.net/fhir/ValueSet/TestPHFDACPRVS`

---

## Development Patterns

### Adding a New Form Page
1. Create `src/routes/new-form/+page.svelte`
2. Add capability check in `CLINIC_CAPABILITIES`
3. Add action in dashboard's `ALL_ACTIONS`
4. Use `appStore.buildUrl()` for all navigation
5. Check `practitionerId` before submit (with auto-register fallback)
6. Preserve workshop params in redirect after submission

### URL Parameter Conventions
- `w` = workshop code (e.g., AK26-A)
- `u` = user name (e.g., Thomas)
- `c` = clinic ID (e.g., rhu-kalibo)
- `r` = role ID (e.g., physician)
- `v` = view mode (clinical | developer)
- `patient` = patient ID for prefill
- `encounter` = encounter ID for linking
- `returnTo` = redirect after form submission

### Toast Usage
```javascript
// Success
appStore.addNotification({
  type: 'success',
  message: 'Action completed!',
  duration: 1500  // Short for success
});

// Error (persistent until dismissed)
appStore.addNotification({
  type: 'error',
  message: 'Something went wrong',
  duration: 4000  // Longer for errors
});
```

---

## Testing Checklist

Before workshop:
- [ ] Deploy to Vercel
- [ ] Test all 5 clinic workflows end-to-end
- [ ] Verify cross-clinic data visibility
- [ ] Test mobile responsiveness
- [ ] Check FHIR server connectivity
- [ ] Run Playwright tests: `npx playwright test`

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/stores/appStore.svelte.js` | URL state, registration, navigation helpers |
| `src/lib/constants/index.js` | Clinics, roles, capabilities config |
| `src/lib/components/AppHeader.svelte` | Navigation, auto-registration, toasts |
| `src/routes/dashboard/+page.svelte` | Main dashboard with action cards |
| `src/routes/patient/[id]/+page.svelte` | Patient timeline with encounter actions |

---

## Resources

- **Workshop Test Scenarios:** `TESTING_STATUS.md`
- **Technical Spec:** `docs/TECHNICAL_SPECIFICATION.md`
- **Playwright Tests:** `tests/workshop-workflow.spec.js`
- **Architecture Diagram:** `/architecture` page

---

*This document captures decisions made during development to help future agents understand the project context and avoid repeating mistakes.*

Last updated: 2025-05-03
Session: Full HIE workflow implementation with encounter linking and status tracking