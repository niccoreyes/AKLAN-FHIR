# OpenHIE Mock EHR
## FHIR Fundamentals 2026 - Aklan Workshop

An interactive, mobile-first Mock EHR for demonstrating OpenHIE interoperability and FHIR data exchange.

🚀 **Live Demo**: [https://aklan-fhir.vercel.app](https://aklan-fhir.vercel.app)

---

## ✨ Features

### Lite Mode UI (Default)
- 📱 Mobile-first, touch-optimized design
- 🎯 Guided workflows for patient registration, vitals, encounters
- 🎨 Color-coded clinic branding
- 🔔 Real-time notifications

### Developer Mode
- 🔧 Postman-style FHIR API testing interface
- 📝 JSON editor with syntax highlighting
- 📊 Request history and response viewer
- 🏷️ Dynamic terminology queries from tx.fhirlab.net

### OpenHIE Integration
- 🌐 Connected to **cdr.fhirlab.net** (Shared Health Record)
- 📚 Terminology from **tx.fhirlab.net** (LOINC, SNOMED CT)
- 🏷️ Workshop isolation via FHIR `meta.tag`
- 👤 Participant tracking via `Practitioner` resources

---

## 🏗️ Architecture

### URL-Driven State (No LocalStorage)
All participant identity is encoded in the URL:
```
https://aklan-fhir.vercel.app/?w=AK26-A&u=Ana&c=rhu-kalibo
```

- `w` = Workshop code (group isolation)
- `u` = User first name
- `c` = Clinic ID
- `r` = Role (optional)

### Dynamic Terminology
Instead of hardcoded codes, the app queries **tx.fhirlab.net** in real-time:
- ✅ LOINC codes for observations
- ✅ SNOMED CT for conditions
- ✅ ICD-10 for billing
- ✅ RxNorm for medications

### Workshop Isolation
Each resource is tagged with workshop code:
```json
{
  "resourceType": "Patient",
  "meta": {
    "tag": [{
      "system": "https://aklan-fhir.app/workshop",
      "code": "AK26-A"
    }]
  }
}
```

Query by workshop:
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

1. **Generate Workshop**
   - Visit: `https://your-app.vercel.app/setup` (if implemented)
   - Or manually create QR codes with workshop codes
   - Format: `AK26-A` through `AK26-E` for 5 groups

2. **Distribute QR Codes**
   ```
   https://aklan-fhir.vercel.app/?w=AK26-A&c=rhu-kalibo
   https://aklan-fhir.vercel.app/?w=AK26-A&c=aklan-hospital
   ```

3. **Monitor Progress**
   - Facilitator dashboard: `/facilitator?w=AK26-A`

### For Participants

1. **Scan QR Code** → Opens app with pre-filled workshop + clinic
2. **Enter First Name** → Creates Practitioner resource in SHR
3. **Use Lite Mode** → Register patients, record vitals
4. **Switch to Developer Mode** → See raw FHIR API calls

---

## 🛠️ Tech Stack

- **Framework**: Svelte 5 + SvelteKit
- **Adapter**: Vercel (Edge/Node.js)
- **State**: Svelte 5 Runes (URL-driven)
- **Styling**: CSS (mobile-first)
- **FHIR**: R4 (via cdr.fhirlab.net)
- **Terminology**: LOINC, SNOMED CT (via tx.fhirlab.net)

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
