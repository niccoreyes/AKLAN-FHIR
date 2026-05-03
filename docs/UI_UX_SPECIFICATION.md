# UI/UX Specification v1.0
## OpenHIE Mock EMR - Design System & Component Specifications

**Date**: May 2026  
**Status**: Draft for Review  
**Design Philosophy**: Mobile-First, Touch-Optimized, Immediate Feedback

---

## 1. Design Principles

### 1.1 Core Tenets

1. **Mobile-First**: Touch targets ≥ 44px, bottom navigation, thumb-friendly
2. **Immediate Feedback**: Every action produces visible confirmation within 100ms
3. **Split-View Architecture**: Clinician view + Technical view (inspired by ips.open-fhir.com)
4. **Patient-Centric**: All flows prioritize patient safety and continuity of care
5. **Accessibility**: WCAG 2.1 AA compliant, high contrast, readable fonts

### 1.2 User Personas

**Primary: Frontline Health Worker**
- Uses mobile device in clinic/field
- Needs quick, reliable data entry
- Wants to see patient's complete history instantly
- Values visual confirmation of data sharing

**Secondary: Workshop Participant**
- Learning FHIR concepts
- Wants to see "behind the scenes" of interoperability
- Needs clear guidance on what to do next
- Appreciates gamification and milestones

---

## 2. Design System

### 2.1 Color Palette

```css
:root {
  /* Primary - Trust & Healthcare */
  --primary-50: #EFF6FF;
  --primary-100: #DBEAFE;
  --primary-200: #BFDBFE;
  --primary-300: #93C5FD;
  --primary-400: #60A5FA;
  --primary-500: #3B82F6;    /* Main Primary */
  --primary-600: #2563EB;    /* Primary Action */
  --primary-700: #1D4ED8;
  --primary-800: #1E40AF;
  --primary-900: #1E3A8A;

  /* Secondary - OpenHIE Brand */
  --secondary-50: #ECFEFF;
  --secondary-100: #CFFAFE;
  --secondary-200: #A5F3FC;
  --secondary-300: #67E8F9;
  --secondary-400: #22D3EE;
  --secondary-500: #06B6D4;
  --secondary-600: #0891B2;  /* Main Secondary */
  --secondary-700: #0E7490;
  --secondary-800: #155E75;
  --secondary-900: #164E63;

  /* Semantic Colors */
  --success-50: #ECFDF5;
  --success-100: #D1FAE5;
  --success-500: #10B981;
  --success-600: #059669;    /* Success Actions */
  --success-700: #047857;

  --warning-50: #FFFBEB;
  --warning-100: #FEF3C7;
  --warning-500: #F59E0B;
  --warning-600: #D97706;    /* Warning/Elevated */
  --warning-700: #B45309;

  --danger-50: #FEF2F2;
  --danger-100: #FEE2E2;
  --danger-500: #EF4444;
  --danger-600: #DC2626;     /* Danger/Critical */
  --danger-700: #B91C1C;

  /* Neutral Scale */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  /* Clinic Colors (for branding) */
  --clinic-rhu: #059669;           /* Emerald */
  --clinic-hospital: #2563EB;      /* Blue */
  --clinic-malay: #0891B2;         /* Cyan */
  --clinic-lab: #7C3AED;           /* Purple */
  --clinic-pharmacy: #DC2626;      /* Red */
}
```

### 2.2 Typography

**Font Family**:
```css
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
```

**Type Scale**:

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 24px | 700 | 1.2 | -0.02em | Page titles |
| H1 | 22px | 700 | 1.3 | -0.01em | Section headers |
| H2 | 20px | 600 | 1.3 | 0 | Card titles |
| H3 | 18px | 600 | 1.4 | 0 | Subsection |
| Body | 16px | 400 | 1.5 | 0 | Primary text |
| Body Small | 14px | 400 | 1.5 | 0 | Secondary text |
| Caption | 12px | 500 | 1.4 | 0.01em | Labels, timestamps |
| Button | 16px | 600 | 1 | 0.01em | Button text |

### 2.3 Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

/* Touch Targets */
--touch-min: 44px;
--touch-comfortable: 48px;
--touch-generous: 56px;
```

### 2.4 Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### 2.5 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
```

---

## 3. Layout Specifications

### 3.1 Screen Breakpoints

```css
/* Mobile First */
--screen-sm: 640px;   /* Small tablets */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Small laptops */
--screen-xl: 1280px;  /* Desktops */
```

### 3.2 Mobile Layout Structure

```
┌─────────────────────────────────────────┐
│ ←  Header (56px)                        │
│    [Back] Title [Action]              │
├─────────────────────────────────────────┤
│                                         │
│  Scrollable Content Area                │
│  (viewport height - header - nav)      │
│                                         │
│  • Cards                                │
│  • Forms                                │
│  • Lists                                │
│  • Timelines                            │
│                                         │
├─────────────────────────────────────────┤
│  Bottom Navigation (64px)              │
│  [🏥] [👤] [📋] [🔄]                    │
└─────────────────────────────────────────┘
```

### 3.3 Safe Areas

```css
/* Mobile safe areas for notches, home indicators */
.safe-top {
  padding-top: env(safe-area-inset-top);
}
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 4. Component Specifications

### 4.1 Buttons

#### Primary Button
```
┌─────────────────────────────────────┐
│  Touch Target: 56px height           │
│  Background: --primary-600           │
│  Text: white, 16px, semibold         │
│  Border Radius: --radius-lg (12px)   │
│  Padding: 16px 24px                  │
│  Shadow: --shadow-md (on active)     │
│  Pressed: scale(0.98)                │
└─────────────────────────────────────┘
```

```svelte
<!-- TouchButton.svelte -->
<button
  class="w-full h-14 bg-primary-600 text-white font-semibold text-base
         rounded-xl active:scale-[0.98] active:bg-primary-700
         transition-all duration-150 shadow-md active:shadow-lg
         disabled:opacity-50 disabled:cursor-not-allowed"
  on:click={onClick}
  disabled={isLoading}
>
  {#if isLoading}
    <span class="animate-spin inline-block mr-2">⟳</span>
    Saving...
  {:else}
    {label}
  {/if}
</button>
```

#### Secondary Button
- Background: white
- Border: 2px solid --gray-300
- Text: --gray-700
- Same touch target and radius

#### Icon Button
- Size: 48px x 48px (touch target)
- Icon size: 24px
- Background: transparent or --gray-100
- Border radius: --radius-lg

### 4.2 Cards

#### Patient Card
```
┌─────────────────────────────────────────┐
│ Height: 88px min                         │
│ Padding: 16px                            │
│ Background: white                        │
│ Border: 1px solid --gray-200             │
│ Border Radius: --radius-lg (12px)        │
│ Shadow: --shadow-sm                      │
│                                          │
│ ┌─────┐  ┌──────────────────────────┐  │
│ │ 👤  │  │ Name (18px semibold)     │  │
│ │ 48px│  │ ID • Age • Gender        │  │
│ └─────┘  │ [Status Chip]            │  │
│          └──────────────────────────┘  │
└─────────────────────────────────────────┘
```

```svelte
<!-- PatientCard.svelte -->
<button
  class="w-full min-h-[88px] bg-white rounded-xl border border-gray-200 
         shadow-sm p-4 active:scale-[0.99] transition-transform
         flex items-center gap-3"
>
  <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
    {gender === 'male' ? '👨' : gender === 'female' ? '👩' : '👤'}
  </div>
  <div class="flex-1 min-w-0 text-left">
    <h3 class="font-semibold text-gray-900 truncate text-lg">{fullName}</h3>
    <div class="flex items-center gap-1.5 text-sm text-gray-500">
      <span class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{primaryId}</span>
      <span>•</span>
      <span>{age}y</span>
      <span>•</span>
      <span class="capitalize">{gender}</span>
    </div>
  </div>
  <span class="text-gray-400 text-xl">›</span>
</button>
```

#### Vital Signs Card
```
┌─────────────────────────────────────────┐
│ LOINC Code: 85354-9 (Blood Pressure)     │
│                                          │
│ 🩺 Blood Pressure               Status │
│    140/90 mmHg                    High │
│    Measured: 14:32 by Nurse Ann          │
│    [Yellow if elevated, Red if high]     │
└─────────────────────────────────────────┘
```

**Color Coding**:
- Normal: --success-500 (green)
- Elevated: --warning-600 (amber)
- High: --danger-600 (red)

### 4.3 Input Fields

#### Text Input
```
┌─────────────────────────────────────────┐
│ Label (12px, medium, uppercase)         │
│ ─────────────────────────────────────── │
│ ┌─────────────────────────────────────┐ │
│ │ [Icon] Input value          [Clear]│ │
│ │ 16px text, gray-900                │ │
│ └─────────────────────────────────────┘ │
│ Helper text (14px, gray-500)            │
└─────────────────────────────────────────┘

Specs:
- Height: 56px
- Border: 1px solid gray-300
- Border Radius: radius-lg (12px)
- Padding: 16px
- Focus: border-primary-500, ring-2 ring-primary-200
```

#### Numeric Input (Vitals)
```svelte
<!-- Specialized for vitals -->
<div class="relative">
  <input
    type="number"
    class="w-full h-16 text-center text-2xl font-semibold
           border-2 border-gray-300 rounded-xl
           focus:border-primary-500 focus:ring-2 focus:ring-primary-200
           placeholder:text-gray-300"
    placeholder="120"
    min="50"
    max="300"
  />
  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
    mmHg
  </span>
</div>
```

### 4.4 Navigation

#### Bottom Navigation Bar
```
┌─────────────────────────────────────────┐
│ Height: 64px + safe-area-inset-bottom   │
│ Background: white                       │
│ Border Top: 1px solid gray-200          │
│ Shadow: shadow-lg (upward)              │
│                                         │
│ [🏥]      [👤]      [📋]      [🔄]      │
│ Clinic   Patients  Visits   Exchange    │
│                                         │
│ Active: Blue icon + label               │
│ Inactive: Gray icon + label             │
│ Touch target: 56px per item             │
└─────────────────────────────────────────┘
```

```svelte
<!-- MobileNav.svelte -->
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg safe-area-pb">
  <div class="flex justify-around items-center h-16">
    {#each navItems as item}
      <a
        href={item.path}
        class="flex flex-col items-center justify-center w-16 h-14 rounded-lg
               {isActive(item.path) ? 'text-primary-600 bg-primary-50' : 'text-gray-500'}"
      >
        <span class="text-2xl">{item.icon}</span>
        <span class="text-xs mt-0.5 font-medium">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>
```

#### Header
```
┌─────────────────────────────────────────┐
│ Height: 56px                            │
│ Background: white or clinic color       │
│ Border Bottom: 1px solid gray-200       │
│                                         │
│ [‹ Back]    Title (18px semibold)   [⋯]│
│                                         │
└─────────────────────────────────────────┘
```

### 4.5 Status Indicators

#### Live Status Badge
```
┌──────────────────┐
│ 🟢 Live          │
│ 10ms latency     │
└──────────────────┘

Animation: Pulse on green dot
Color: --success-500
```

#### Sync Status
- **Synced**: Green checkmark "Visible to all clinics ✓"
- **Syncing**: Spinner "Syncing..."
- **Error**: Red X "Failed to sync"

#### Clinic Badge
```
┌──────────────────┐
│ 🏥 RHU Kalibo    │  (colored border)
│ Emerald green    │
└──────────────────┘

Colors:
- RHU Kalibo: --clinic-rhu (emerald)
- Hospital: --clinic-hospital (blue)
- Malay: --clinic-malay (cyan)
- Lab: --clinic-lab (purple)
- Pharmacy: --clinic-pharmacy (red)
```

### 4.6 Feedback Components

#### Toast Notification
```
┌─────────────────────────────────────────┐
│ Position: Bottom-center, above nav bar    │
│ Animation: Slide up from bottom           │
│ Duration: 3 seconds (auto-dismiss)      │
│                                          │
│ 🎉 Patient created successfully!        │
│ 🌐 Visible to all clinics ✓             │
│                                          │
│ [────────────── progress bar ──────────] │
└─────────────────────────────────────────┘

Types:
- Success: Green background
- Info: Blue background  
- Warning: Amber background
- Error: Red background
```

#### Milestone Badge
```
┌──────────────────┐
│ 🏆               │
│ First Patient    │
│ Bronze           │
└──────────────────┘

Animation: Bounce + glow on earn
Sound: Optional pleasant chime
```

### 4.7 Timeline Component

```
┌─────────────────────────────────────────┐
│ Patient Timeline                        │
│                                         │
│ ●───── Jan 15, 2026                    │
│ │    🏥 RHU Kalibo                     │
│ │    Initial Visit                     │
│ │    BP: 150/95                        │
│ │    [Created by You]                  │
│ │                                      │
│ ●───── Jan 18, 2026                    │
│      🏥 Aklan Provincial Hospital      │
│      Referred Visit                    │
│      BP: 160/100                       │
│      Labs: Creatinine 1.1              │
│      [Created by Dr. Mendoza] ←        │
│      [Synced via SHR ✓]                │
│                                        │
│ Different clinics = different colors   │
└─────────────────────────────────────────┘
```

---

## 5. Page Specifications

### 5.1 Landing Page (Clinic Selection)

**Purpose**: First-time setup, choose your clinic

```
┌─────────────────────────────────────────┐
│                                         │
│   Welcome to                            │
│   OpenHIE Mock EMR                      │
│                                         │
│   FHIR Fundamentals 2026                │
│   Aklan Workshop                        │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ 🏥 Select Your Clinic           │   │
│   │                                 │   │
│   │ ┌───────────────────────────┐   │   │
│   │ │ 🏥 RHU Kalibo           › │   │   │
│   │ │ Primary Care - Emerald    │   │   │
│   │ └───────────────────────────┘   │   │
│   │                                 │   │
│   │ ┌───────────────────────────┐   │   │
│   │ │ 🏥 Aklan Provincial       › │   │   │
│   │ │ Hospital - Blue           │   │   │
│   │ └───────────────────────────┘   │   │
│   │                                 │   │
│   │ ... (more clinics)            │   │
│   └─────────────────────────────────┘   │
│                                         │
│   [Enter as Guest]                      │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 Patient List Page

**Purpose**: Search and browse patients

```
┌─────────────────────────────────────────┐
│ ←  Patients                    [➕]     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🔍 Search by name or ID...          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Recent Patients                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Maria Santos              ›      │ │
│ │ PH-1234 • 45y • Female              │ │
│ │ 🩺 Hypertension                     │ │
│ │ 🏥 RHU Kalibo • 2 min ago           │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Juan Dela Cruz            ›      │ │
│ │ PH-5678 • 32y • Male                │ │
│ │ 🏥 Last visit: Today                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [──────────── Pull to refresh ───────] │
│                                         │
├─────────────────────────────────────────┤
│ [🏥] [👤] [📋] [🔄]                    │
└─────────────────────────────────────────┘
```

**Interactions**:
- Pull down to refresh
- Tap patient card → Patient detail
- Tap search → Expand search with filters
- Floating action button → Register new patient

### 5.3 Patient Detail Page

**Purpose**: Complete patient view with timeline

```
┌─────────────────────────────────────────┐
│ ←  Patient Detail              [✏️]     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │              👤                     │ │
│ │        Maria C. Santos              │ │
│ │     PH-1234-5678-9012               │ │
│ │     45 yrs • Female                 │ │
│ │     📍 Kalibo, Aklan                │ │
│ │     📱 +63-912-345-6789             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 🩺 Active Conditions                    │
│ ┌─────────────────────────────────────┐ │
│ │ 🏥 Hypertension (Jan 15, 2026)     │ │
│ │    Stage 2 • Confirmed              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📋 Encounter Timeline                   │
│ ┌─────────────────────────────────────┐ │
│ │ ● Jan 18, 2026                      │ │
│ │ │ 🏥 Aklan Provincial               │ │
│ │ │ Referred Visit                    │ │
│ │ │ BP: 160/100 • Labs completed      │ │
│ │ │ 💊 Amlodipine 5mg prescribed      │ │
│ │ │ [Dr. Mendoza • SHR sync ✓]        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ● Jan 15, 2026                      │ │
│ │ │ 🏥 RHU Kalibo                     │ │
│ │ │ Initial Visit                     │ │
│ │ │ BP: 150/95                        │ │
│ │ │ [You • 3 days ago]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ➕ New Encounter                        │
│                                         │
├─────────────────────────────────────────┤
│ [🏥] [👤] [📋] [🔄]                    │
└─────────────────────────────────────────┘
```

### 5.4 Technical Dashboard Page

**Purpose**: View FHIR transactions and architecture (IPS-inspired)

```
┌─────────────────────────────────────────┐
│ ←  Technical Dashboard                  │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔄 Live SHR Exchange                │ │
│ │ cdr.fhirlab.net • 12ms latency 🟢   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Recent API Calls                        │
│ ┌─────────────────────────────────────┐ │
│ │ 14:32:05 POST /Patient            │ │
│ │     201 Created • 245ms            │ │
│ │     [View Request/Response]        │ │
│ │                                    │ │
│ │ 14:32:12 POST /Encounter          │ │
│ │     201 Created • 189ms            │ │
│ │                                    │ │
│ │ 14:32:18 POST /Observation        │ │
│ │     201 Created • 156ms            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ OpenHIE Architecture                    │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │  [🔵 RHU Kalibo]                   │ │
│ │        │                           │ │
│ │        │ POST /Patient             │ │
│ │        ▼                           │ │
│ │  [🟠 Shared Health Record]         │ │
│ │        │                           │ │
│ │        │ GET /Patient              │ │
│ │        ▼                           │ │
│ │  [🔵 Hospital]  ← User B         │ │
│ │                                     │ │
│ │  Data flowing between clinics!     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Resources Created: 15                   │
│ Cross-Facility Exchanges: 3             │
│ Milestones: 🥉🥉🥉🥈                  │
│                                         │
├─────────────────────────────────────────┤
│ [🏥] [👤] [📋] [🔄]                    │
└─────────────────────────────────────────┘
```

---

## 6. Animation Specifications

### 6.1 Transitions

**Page Transition**:
```css
/* Slide in from right */
.page-enter {
  animation: slideIn 300ms ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**Card Press**:
```css
.card:active {
  transform: scale(0.98);
  transition: transform 150ms ease;
}
```

**Toast Slide**:
```css
.toast-enter {
  animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### 6.2 Micro-interactions

**Button Press**:
- Scale: 1.0 → 0.98
- Duration: 150ms
- Easing: ease-out

**Input Focus**:
- Border color: gray-300 → primary-500
- Ring: 0 → 2px primary-200
- Duration: 200ms

**Success Checkmark**:
- Scale: 0 → 1.2 → 1.0
- Duration: 400ms
- Easing: cubic-bezier(0.68, -0.55, 0.265, 1.55) (bounce)

**Live Indicator Pulse**:
```css
.live-dot {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 7. Accessibility Specifications

### 7.1 Touch Targets
- Minimum: 44 x 44px (Apple HIG)
- Recommended: 48 x 48px
- Primary actions: 56px height

### 7.2 Color Contrast
- Text on light bg: Minimum 4.5:1
- Large text (18px+): Minimum 3:1
- Interactive elements: Minimum 3:1

### 7.3 Screen Readers
```html
<!-- Proper ARIA labels -->
<button aria-label="Register new patient">
  <span aria-hidden="true">➕</span>
</button>

<!-- Live regions for dynamic content -->
<div role="status" aria-live="polite">
  Patient created successfully
</div>

<!-- Skip links -->
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### 7.4 Focus Management
- Visible focus ring on all interactive elements
- Focus trap in modals
- Return focus after actions

---

## 8. Responsive Adaptations

### 8.1 Tablet (768px+)

- Sidebar navigation instead of bottom nav
- Two-column layouts for lists
- Larger touch targets (56px)
- More content visible without scrolling

### 8.2 Desktop (1024px+)

- Split view: Patient list | Patient detail
- Technical dashboard full width
- Hover states for mouse users
- Keyboard shortcuts

---

## 9. Iconography

### 9.1 Emoji Icons (Primary)

Use native emoji for simplicity and universal understanding:

| Concept | Emoji | Usage |
|---------|-------|-------|
| Patient | 👤 | Patient icon, avatar |
| Male Patient | 👨 | Gender specific |
| Female Patient | 👩 | Gender specific |
| Child | 👶 | Pediatric patients |
| Hospital | 🏥 | Clinic/facility |
| Pharmacy | 💊 | Medication |
| Lab | 🧪 | Laboratory |
| Doctor | 👨‍⚕️ | Provider |
| Nurse | 👩‍⚕️ | Nurse |
| Vitals | 🩺 | Clinical measurements |
| Heart | ❤️ | Heart rate |
| Warning | ⚠️ | Alerts |
| Success | ✅ | Confirmations |
| Error | ❌ | Failures |
| Sync | 🔄 | Data exchange |
| Search | 🔍 | Search |
| Add | ➕ | Create new |
| Edit | ✏️ | Edit |
| Delete | 🗑️ | Delete |
| Calendar | 📅 | Date |
| Time | ⏰ | Time |
| Location | 📍 | Address |
| Phone | 📱 | Contact |
| Email | ✉️ | Email |
| File | 📄 | Documents |
| Chart | 📊 | Data |
| Settings | ⚙️ | Settings |
| Info | ℹ️ | Information |
| Back | ‹ | Navigation |
| Forward | › | Navigation |

### 9.2 SVG Icons (Secondary)

For precise control, use Heroicons or custom SVG:
- Size: 24px default, 20px small, 32px large
- Stroke width: 1.5px or 2px
- Color: Inherit from text color

---

## 10. Voice & Tone

### 10.1 Microcopy Guidelines

**Success Messages**:
- ✅ "Patient registered successfully"
- ✅ "Visible to all clinics"
- ✅ "Data synced"
- ❌ "Operation completed"
- ❌ "Transaction successful"

**Error Messages**:
- ✅ "Unable to save. Please check your connection."
- ✅ "Patient not found. Try searching by PhilHealth ID."
- ❌ "Error 500"
- ❌ "Operation failed"

**Button Labels**:
- ✅ "Register Patient"
- ✅ "Record Vitals"
- ✅ "Create Referral"
- ❌ "Submit"
- ❌ "Save Data"

**Loading States**:
- ✅ "Searching..."
- ✅ "Saving to SHR..."
- ✅ "Loading patient history..."
- ❌ "Loading..."
- ❌ "Please wait"

### 10.2 Workshop-Specific Copy

**Role Card Language**:
- Use "you" and "your"
- Active voice
- Clear action verbs
- Time estimates

**Milestone Celebrations**:
- 🏆 "Cross-Facility Collaboration Unlocked!"
- 🎉 "First Patient Registered!"
- 🌟 "Continuity of Care Champion!"

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-03  
**Status**: Draft for Review

**Questions for Review**:
1. Are touch targets large enough for all users?
2. Is the color palette accessible (WCAG compliant)?
3. Should we add more animations for engagement?
4. Is the emoji set appropriate for the healthcare context?
5. Any missing component specifications?
