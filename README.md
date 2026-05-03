# OpenHIE Mock EHR
## FHIR Fundamentals 2026 - Aklan Workshop

An interactive, mobile-first Mock EHR for demonstrating OpenHIE interoperability and FHIR data exchange.

🚀 **Live Demo**: [https://aklan-fhir.vercel.app](https://aklan-fhir.vercel.app)

---

## ✨ Features

### OpenHIE Architecture
- 🏥 **Point of Service** (RHU, Hospital, Lab, Pharmacy)
- 🔀 **Interoperability Layer** (OpenHIM / Mirth Connect)
- 🗄️ **Shared Health Record** (cdr.fhirlab.net)
- 📚 **Terminology Server** (tx.fhirlab.net)

### Clinical Workflows
- 📱 Mobile-first, touch-optimized design
- 🎯 Patient registration, search, edit
- 📝 Encounter recording and editing
- 🩺 Vital signs (encounter-linked)
- 🔧 Postman-style FHIR API tester (Developer Mode)
- 🏷️ Dynamic terminology queries

### Workshop Features
- 🏷️ Workshop isolation via FHIR `meta.tag`
- 👤 Participant tracking via `Practitioner` resources
- 🔗 Shareable URLs (no accounts, no passwords)

---

## 🏗️ Architecture

### URL-Driven State (No LocalStorage)
All participant identity is encoded in the URL:
```
https://aklan-fhir.vercel.app/?w=AK26-A&u=Ana&c=rhu-kalibo
```

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `w` | Workshop code (group isolation) | `AK26-A` |
| `u` | User first name | `Ana` |
| `c` | Clinic ID | `rhu-kalibo` |
| `r` | Role (optional) | `physician` |

### OpenHIE Data Flow
```
Point of Service (PoS)
    │
    │ FHIR REST API
    ▼
Interoperability Layer (OpenHIM / Mirth)
    │
    ▼
Shared Services (SHR + Terminology)
```

### Dynamic Terminology
The app queries **tx.fhirlab.net** in real-time:
- ✅ LOINC codes for observations
- ✅ SNOMED CT for conditions
- ❌ ICD-10 — not supported (silent fallback)
- ❌ RxNorm — not supported (silent fallback)

### Workshop Isolation
Resources tagged with workshop code in `meta.tag`:
```
GET /Patient?_tag=https://aklan-fhir.app/workshop|AK26-A
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub Repo to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Or use Vercel Dashboard**
   - Import GitHub repository
   - Framework: SvelteKit
   - Build Command: `npm run build`
   - Output Directory: `.svelte-kit/output`

3. **Environment Variables** (Optional)
   ```
   PUBLIC_FHIR_BASE_URL=https://cdr.fhirlab.net/fhir
   PUBLIC_TERMINOLOGY_URL=https://tx.fhirlab.net/fhir
   ```

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📱 Usage

### For Facilitators

1. **Workshop Codes**
   - Pre-defined: `AK26-A` through `AK26-E` for 5 groups
   - Each group has isolated data via FHIR `meta.tag`

2. **Distribute Links**
   ```
   https://aklan-fhir.vercel.app/workshop?w=AK26-A&c=rhu-kalibo
   https://aklan-fhir.vercel.app/workshop?w=AK26-A&c=aklan-hospital
   ```

3. **Monitor Progress**
   - Facilitator dashboard: `/facilitator?w=AK26-A`

### For Participants

1. **Open Workshop Link** → Pre-filled workshop + clinic
2. **Enter First Name** → Creates/reuses Practitioner in SHR
3. **Select Role** → Physician, Nurse, Midwife, etc.
4. **Dashboard** → Register patients, record encounters, vitals
5. **Developer Mode** → `/developer` for raw FHIR API testing

---

## 🛠️ Tech Stack

- **Framework**: Svelte 5 + SvelteKit
- **Adapter**: Vercel (Edge/Node.js)
- **State**: Svelte 5 Runes (URL-driven, no localStorage)
- **Styling**: CSS (mobile-first, responsive)
- **FHIR**: R4 (via cdr.fhirlab.net)
- **Terminology**: LOINC, SNOMED CT (via tx.fhirlab.net)
- **Testing**: Playwright E2E
- **Deployment**: Vercel

---

## 🏥 FHIR Resources Used

### Core Resources
- `Patient` - Demographics, identifiers (PhilHealth)
- `Encounter` - Visits, appointments
- `Observation` - Vital signs, lab results
- `Condition` - Diagnoses
- `MedicationRequest` - Prescriptions
- `ServiceRequest` - Lab orders, referrals
- `DiagnosticReport` - Lab reports
- `Practitioner` - Participant tracking
- `Organization` - Clinics, workshops

### Terminology Systems
- **LOINC**: `http://loinc.org`
- **SNOMED CT**: `http://snomed.info/sct`
- **ICD-10**: `http://hl7.org/fhir/sid/icd-10`
- **RxNorm**: `http://www.nlm.nih.gov/research/umls/rxnorm`
- **PhilHealth ACR ICD-10**: `http://www.philhealth.gov.ph/fhir/CodeSystem/acr-library` — Used for encounter diagnoses (9,520 codes via tx.fhirlab.net)

---

## 📊 Workshop Activity

### Patient Relay Race (60 minutes)

**Round 1 (15 min)**: Clinic A creates patient data
- Registration: Create Patient
- Nurse: Record vitals (BP, HR, Temp)
- Physician: Document encounter

**Round 2 (15 min)**: Clinic B retrieves & adds
- Search for patient from Clinic A
- View complete history
- Add hospital encounter
- Order labs

**Round 3 (15 min)**: Continue care
- Pharmacy dispenses medication
- Follow-up visit at Clinic A
- See data from all previous visits

**Review (15 min)**: 
- View complete patient timeline
- Export reports
- Discuss interoperability

---

## 🔒 Security & Privacy

⚠️ **Important**: This is a **learning environment** using:
- Public test FHIR server (fhirlab.net)
- Synthetic/fictional patient data only
- No real PHI (Protected Health Information)

**Workshop participants must not enter real patient data.**

---

## 📝 Project Structure

```
.
├── src/
│   ├── lib/
│   │   ├── components/         # Shared AppHeader, layouts
│   │   ├── constants/          # FHIR config, clinics, roles, terminology
│   │   ├── services/
│   │   │   ├── fhir-client.js  # FHIR REST client (CRUD + pagination)
│   │   │   └── terminology.js  # Dynamic terminology with fallback
│   │   └── stores/
│   │       └── appStore.svelte.js  # URL-driven state, practitioner registration
│   └── routes/
│       ├── +page.svelte        # Public IPS-style landing page
│       ├── +layout.svelte      # Root layout with AppHeader
│       ├── workshop/           # Workshop entry (name, role, clinic)
│       ├── dashboard/          # Action cards dashboard
│       ├── patient/
│       │   ├── search/         # Patient search + auto-load
│       │   ├── new/            # Patient registration
│       │   ├── edit/           # Patient edit
│       │   └── [id]/           # Patient detail (encounters, observations)
│       ├── encounter/
│       │   ├── +page.svelte    # Encounter creation
│       │   └── edit/           # Encounter editing
│       ├── vitals/             # Vitals recording (encounter-linked)
│       ├── developer/          # Postman-style FHIR API tester
│       ├── facilitator/        # Workshop monitoring dashboard
│       ├── architecture/       # OpenHIE architecture diagram
│       └── about/              # About page
├── tests/
│   └── workshop-workflow.spec.js   # E2E workshop tests
├── docs/
│   ├── TECHNICAL_SPECIFICATION.md
│   ├── UI_UX_SPECIFICATION.md
│   └── ACTIVITY_SPECIFICATION.md
├── static/
│   └── robots.txt
├── svelte.config.js
├── vite.config.js
├── playwright.config.js
└── package.json
```
.
├── src/
│   ├── lib/
│   │   ├── constants/          # FHIR config, clinics, roles
│   │   ├── services/           # FHIR client, terminology
│   │   └── stores/             # Svelte 5 runes stores
│   └── routes/
│       ├── +page.svelte        # Workshop entry
│       ├── dashboard/          # Main dashboard
│       ├── patient/            # Patient search/register
│       ├── encounter/          # Visit documentation
│       ├── vitals/             # Vital signs
│       └── developer/          # API testing
├── docs/
│   ├── TECHNICAL_SPECIFICATION.md
│   ├── UI_UX_SPECIFICATION.md
│   └── ACTIVITY_SPECIFICATION.md
└── README.md
```

---

## 🤝 Contributing

This project is for the **FHIR Fundamentals 2026 - Aklan** workshop.

For questions or issues, contact the workshop organizers.

---

## 📄 License

MIT License - Educational Use

---

**Made with ❤️ for the Philippine healthcare interoperability community**

*Powered by [Svelte](https://svelte.dev), [FHIR](https://hl7.org/fhir), and [OpenHIE](https://ohie.org)*
