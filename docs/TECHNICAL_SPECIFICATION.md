# Technical Specification
## OpenHIE Mock EHR - FHIR Fundamentals 2026

**Date**: May 2026  
**Status**: Production Ready  
**Target**: Vercel deployment with fhirlab.net backend

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Vercel)                                │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Svelte 5   │  │   Svelte 5   │  │   Svelte 5   │  │   Svelte 5   │     │
│  │  RHU Kalibo  │  │   Hospital   │  │   Pharmacy   │  │     Lab      │     │
│  │  (PoS + EHR) │  │  (PoS + EHR) │  │  (PoS + EHR) │  │  (PoS + EHR) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │                 │               │
│         └─────────────────┴─────────────────┴─────────────────┘               │
│                              │                                               │
│                              │ FHIR REST API (HTTPS)                          │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTEROPERABILITY LAYER (IOL)                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    OpenHIM / Mirth Connect                               ││
│  │                                                                          ││
│  │  • Message routing & orchestration                                       ││
│  • Mediator management                                                     ││
│  • Authentication & authorization                                          ││
│  • Logging & auditing                                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SHARED SERVICES LAYER                                 │
│                                                                              │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Shared Health Record (SHR) │  │      Terminology Service (TS)        │  │
│  │                             │  │                                      │  │
│  │  cdr.fhirlab.net/fhir       │  │  tx.fhirlab.net/fhir                 │  │
│  │                             │  │                                      │  │
│  │  FHIR R4 Resources:         │  │  Code Systems:                       │  │
│  │  • Patient                  │  │  • LOINC (observations, labs)        │  │
│  │  • Encounter                │  │  • SNOMED CT (diagnoses)             │  │
│  │  • Observation              │  │  • ICD-10 (billing)                  │  │
│  │  • Condition                │  │  • RxNorm (medications)              │  │
│  │  • Practitioner             │  │                                      │  │
│  │  • Organization             │  │  Capabilities:                       │  │
│  │                             │  │  • LOINC: ✅ Validated               │  │
│  └─────────────────────────────┘  │  • SNOMED CT: ✅ Validated           │  │
│                                    │  • ICD-10: ❌ Not supported          │  │
│                                    │  • RxNorm: ❌ Not supported          │  │
│                                    └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 OpenHIE Mapping

| OpenHIE Component | Implementation | Details |
|-------------------|----------------|---------|
| **Point of Service (PoS)** | Institution frontend | RHU, Hospital, Lab, Pharmacy |
| **Demo EHR** | Per-institution EHR instance | Each PoS has its own EHR |
| **Interoperability Layer (IOL)** | OpenHIM / Mirth Connect | Message routing between EHRs and SHR |
| **Shared Health Record (SHR)** | cdr.fhirlab.net/fhir | FHIR R4 repository |
| **Terminology Service (TS)** | tx.fhirlab.net/fhir | Code validation & lookup |
| **Client Registry (CR)** | Patient matching | cdr.fhirlab.net/fhir/Patient?identifier= |

### 1.3 Data Flow Patterns

#### Pattern 1: Create Resource
```
User Action → Svelte Component → fhir-client.js → POST /[ResourceType] → SHR
                                     ↓
                               Response: 201 Created
                                     ↓
                               Update UI + Show Toast
```

#### Pattern 2: Search Resources
```
User Search → Svelte Component → fhir-client.js → GET /[ResourceType]?params → SHR
                                     ↓
                               Response: Bundle
                                     ↓
                               Render List + Pagination
```

#### Pattern 3: Cross-Facility Exchange
```
Clinic A: POST /Patient → SHR → Visible to All
                                     ↓
Clinic B: GET /Patient?name= → SHR → Returns Clinic A's Patient
                                     ↓
Clinic B: POST /Encounter → SHR → References Clinic A's Patient
                                     ↓
Clinic A: GET /Encounter?patient= → SHR → Returns Both Encounters
```

---

## 2. FHIR Resource Specifications

### 2.1 Supported Resources

#### Patient
**Purpose**: Demographics and identification
**Profile**: PH Core Patient (Philippine adaptations)

```json
{
  "resourceType": "Patient",
  "id": "[server-assigned]",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-01-15T08:30:00Z",
    "tag": [{
      "system": "https://aklan-fhir.app/workshop",
      "code": "AK26-A"
    }]
  },
  "identifier": [
    {
      "system": "http://philhealth.gov.ph/member-id",
      "value": "XX-XXXXXXXXX-X",
      "type": {
        "coding": [{
          "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
          "code": "NI"
        }]
      }
    }
  ],
  "active": true,
  "name": [
    {
      "use": "official",
      "family": "[Family Name]",
      "given": ["[First Name]", "[Middle Name]"],
      "suffix": ["[Jr/Sr/III]"]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+63-XXX-XXX-XXXX",
      "use": "mobile"
    }
  ],
  "gender": "male | female | other | unknown",
  "birthDate": "YYYY-MM-DD",
  "address": [
    {
      "use": "home",
      "type": "both",
      "text": "[Full Address]",
      "city": "Kalibo | Malay | Numancia | etc",
      "district": "Aklan",
      "state": "Western Visayas",
      "postalCode": "5600 | 5601 | etc",
      "country": "PH"
    }
  ],
  "maritalStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
      "code": "M | S | D | W"
    }]
  }
}
```

**Required Fields**: resourceType, identifier (at least one), name, gender, birthDate
**Search Parameters**: name, birthdate, gender, identifier, address-city, _tag

---

#### Encounter
**Purpose**: Visit and appointment records
**Profile**: PH Core Encounter

```json
{
  "resourceType": "Encounter",
  "id": "[server-assigned]",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-01-15T08:30:00Z",
    "tag": [{
      "system": "https://aklan-fhir.app/workshop",
      "code": "AK26-A"
    }]
  },
  "status": "planned | arrived | in-progress | onleave | finished | cancelled",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB | EMER | HH | IMP | VR",
    "display": "ambulatory | emergency | home health | inpatient | virtual"
  },
  "type": [
    {
      "coding": [{
        "system": "http://snomed.info/sct",
        "code": "185345009",
        "display": "Encounter for symptom"
      }]
    }
  ],
  "subject": {
    "reference": "Patient/[id]",
    "display": "[Patient Name]"
  },
  "participant": [
    {
      "type": [{
        "coding": [{
          "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
          "code": "ATND",
          "display": "attender"
        }]
      }],
      "individual": {
        "reference": "Practitioner/[id]",
        "display": "[Provider Name]"
      }
    }
  ],
  "period": {
    "start": "2026-01-15T08:30:00Z",
    "end": "2026-01-15T09:30:00Z"
  },
  "reasonCode": [
    {
      "text": "[Chief Complaint]"
    }
  ],
  "serviceProvider": {
    "reference": "Organization/[id]",
    "display": "[Clinic Name]"
  }
}
```

**Required Fields**: resourceType, status, class, subject
**Search Parameters**: patient, date, status, service-provider, _tag
**Update**: PUT /Encounter/[id] for edits
**Delete**: DELETE /Encounter/[id] supported

---

#### Observation (Vital Signs)
**Purpose**: Clinical measurements and vital signs
**Profile**: PH Core Observation

```json
{
  "resourceType": "Observation",
  "id": "[server-assigned]",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-01-15T08:30:00Z",
    "tag": [{
      "system": "https://aklan-fhir.app/workshop",
      "code": "AK26-A"
    }]
  },
  "status": "registered | preliminary | final | amended",
  "category": [
    {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
        "code": "vital-signs",
        "display": "Vital Signs"
      }]
    }
  ],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "85354-9",
      "display": "Blood pressure panel"
    }]
  },
  "subject": {
    "reference": "Patient/[id]",
    "display": "[Patient Name]"
  },
  "encounter": {
    "reference": "Encounter/[id]"
  },
  "effectiveDateTime": "2026-01-15T08:30:00Z",
  "performer": [
    {
      "reference": "Practitioner/[id]",
      "display": "[Provider Name]"
    }
  ],
  "component": [
    {
      "code": {
        "coding": [{
          "system": "http://loinc.org",
          "code": "8480-6",
          "display": "Systolic blood pressure"
        }]
      },
      "valueQuantity": {
        "value": 140,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    },
    {
      "code": {
        "coding": [{
          "system": "http://loinc.org",
          "code": "8462-4",
          "display": "Diastolic blood pressure"
        }]
      },
      "valueQuantity": {
        "value": 90,
        "unit": "mmHg"
      }
    }
  ]
}
```

**Key Design Decision**: All observations are **encounter-linked**. The vitals page requires selecting an active encounter, and observations include an `encounter` reference.

**Common LOINC Codes for Vitals**:

| Vital | LOINC Code | Unit |
|-------|-----------|------|
| Blood Pressure Panel | 85354-9 | mmHg |
| Systolic BP | 8480-6 | mmHg |
| Diastolic BP | 8462-4 | mmHg |
| Heart Rate | 8867-4 | beats/min |
| Respiratory Rate | 9279-1 | breaths/min |
| Body Temperature | 8310-5 | Cel |
| Oxygen Saturation | 2708-6 | % |
| Weight | 29463-7 | kg |
| Height | 8302-2 | cm |
| BMI | 39156-5 | kg/m2 |
| Blood Glucose | 2339-0 | mg/dL |

**Required Fields**: resourceType, status, category, code, subject, effectiveDateTime
**Search Parameters**: patient, code, date, category, encounter, _tag
**Delete**: DELETE /Observation/[id] supported

---

#### Practitioner
**Purpose**: Workshop participant tracking
**Profile**: Base FHIR Practitioner

```json
{
  "resourceType": "Practitioner",
  "id": "[server-assigned]",
  "meta": {
    "tag": [{
      "system": "https://aklan-fhir.app/workshop",
      "code": "AK26-A"
    }]
  },
  "active": true,
  "name": [
    {
      "use": "official",
      "given": ["[First Name]"],
      "text": "[First Name]"
    }
  ],
  "qualification": [
    {
      "code": {
        "text": "[Role: physician | nurse | midwife | clerk | pharmacist | lab_tech | facilitator]"
      }
    }
  ]
}
```

**Deduplication Strategy**: Name-based matching. On registration, the app searches existing Practitioners by `name` parameter and filters for exact first name matches. If found, reuses existing Practitioner; if not, creates new one.

---

#### Condition (Encounter Diagnoses)
**Purpose**: Document diagnoses and conditions during encounters  
**Profile**: PH Core Condition with PhilHealth ACR ICD-10 codes  
**Dependencies**: 
- **ValueSet**: `http://www.philhealth.gov.ph/fhir/ValueSet/acr-icd-hierarchical` (9,520 ICD-10 codes)
- **CodeSystem**: `http://www.philhealth.gov.ph/fhir/CodeSystem/acr-library`
- **Terminology Server**: `https://tx.fhirlab.net/fhir`

```json
{
  "resourceType": "Condition",
  "id": "[server-assigned]",
  "meta": {
    "tag": [{
      "system": "https://aklan-fhir.app/workshop",
      "code": "AK26-A"
    }]
  },
  "clinicalStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
      "code": "active"
    }]
  },
  "verificationStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
      "code": "confirmed"
    }]
  },
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-category",
      "code": "encounter-diagnosis",
      "display": "Encounter Diagnosis"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://www.philhealth.gov.ph/fhir/CodeSystem/acr-library",
      "code": "J20.9",
      "display": "Acute bronchitis, unspecified"
    }],
    "text": "Acute bronchitis, unspecified"
  },
  "subject": {
    "reference": "Patient/[id]"
  },
  "encounter": {
    "reference": "Encounter/[id]"
  }
}
```

**Required Fields**: resourceType, clinicalStatus, code, subject, encounter  
**Search Parameters**: patient, encounter, clinical-status, _tag  
**Code Selection**: Real-time search via `$expand` with `filter` parameter on PhilHealth ACR ValueSet  
**UI Pattern**: Chip-based selection in encounter form; chips displayed in EncounterCard header  
**Delete**: DELETE /Condition/[id] supported (cascades with encounter deletion)

---

### 2.2 Terminology Systems

#### LOINC (Laboratory and Clinical Observations)
**System**: `http://loinc.org`  
**Purpose**: Standard codes for observations, lab tests, vitals  
**Usage**: Observation.code, ServiceRequest.code, DiagnosticReport.code  
**Validation**: ✅ Supported on tx.fhirlab.net

#### SNOMED CT
**System**: `http://snomed.info/sct`  
**Purpose**: Clinical diagnoses, procedures, findings  
**Usage**: Condition.code, Encounter.type, Procedure.code  
**Validation**: ✅ Supported on tx.fhirlab.net

#### ICD-10 (General)
**System**: `http://hl7.org/fhir/sid/icd-10`  
**Purpose**: Billing and reporting codes  
**Usage**: Condition.code (secondary)  
**Validation**: ❌ Not supported on tx.fhirlab.net (returns 404)

#### PhilHealth ACR ICD-10 (Philippines Specific)
**System**: `http://www.philhealth.gov.ph/fhir/CodeSystem/acr-library`  
**ValueSet**: `http://www.philhealth.gov.ph/fhir/ValueSet/acr-icd-hierarchical`  
**Purpose**: Philippine Health Insurance Corporation All Case Rates ICD-10 diagnosis codes  
**Usage**: Condition.code for encounter diagnoses  
**Validation**: ✅ Fully supported on tx.fhirlab.net with $expand and $lookup  
**Total Codes**: 9,520 ICD-10 diagnosis codes  
**Query Method**: `GET /ValueSet/$expand?url={ACR_ICD_VALUESET_URL}&filter={searchTerm}&count={n}`  
**Example**: `GET /ValueSet/$expand?url=http://www.philhealth.gov.ph/fhir/ValueSet/acr-icd-hierarchical&filter=diabetes&count=10`

#### RxNorm
**System**: `http://www.nlm.nih.gov/research/umls/rxnorm`  
**Purpose**: Medication identifiers  
**Usage**: MedicationRequest.medication, MedicationDispense.medication  
**Validation**: ❌ Not supported on tx.fhirlab.net (returns 404)

#### Fallback Strategy
When terminology server returns 404, the app uses a **silent fallback**: `lookupCode()` returns `{valid: false}` without throwing, allowing the UI to proceed with the code unchecked.

---

## 3. API Specifications

### 3.1 FHIR REST API Endpoints

#### Base URLs
```javascript
const FHIR_CONFIG = {
  shrBaseUrl: 'https://cdr.fhirlab.net/fhir',
  txBaseUrl: 'https://tx.fhirlab.net/fhir',
  fhirVersion: 'R4',
  format: 'json'
};
```

#### CRUD Operations

**Create (POST)**
```http
POST /[ResourceType]
Content-Type: application/fhir+json

{FHIR Resource JSON}
```

Response:
```http
HTTP/1.1 201 Created
Location: /[ResourceType]/[id]/_history/1
Content-Location: /[ResourceType]/[id]

{Created Resource with server-assigned id}
```

**Read (GET)**
```http
GET /[ResourceType]/[id]
Accept: application/fhir+json
```

**Search (GET with parameters)**
```http
GET /[ResourceType]?param1=value1&param2=value2
Accept: application/fhir+json
```

Response:
```http
HTTP/1.1 200 OK

{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 42,
  "link": [...],
  "entry": [...]
}
```

**Update (PUT)**
```http
PUT /[ResourceType]/[id]
Content-Type: application/fhir+json

{FHIR Resource with id}
```

**Delete (DELETE)**
```http
DELETE /[ResourceType]/[id]
```

**Pagination**
```javascript
// First page
GET /Patient?_tag=https://aklan-fhir.app/workshop|AK26-A&_count=10

// Subsequent pages via Bundle.link
GET /Patient?_tag=...&_count=10&_getpagesoffset=10
```

---

### 3.2 Search Parameters

#### Patient Search
```javascript
// By name (partial match) + workshop tag
GET /Patient?name=Santos&_tag=https://aklan-fhir.app/workshop|AK26-A

// By PhilHealth ID
GET /Patient?identifier=http://philhealth.gov.ph/member-id|12-123456789-0

// By birthdate
GET /Patient?birthdate=1985-03-15

// Combined
GET /Patient?name=Santos&gender=female&birthdate:ge=1980-01-01
```

#### Encounter Search
```javascript
// By patient
GET /Encounter?patient=Patient/123

// By date range
GET /Encounter?date:ge=2026-01-01&date:le=2026-01-31

// By status
GET /Encounter?status=in-progress
```

#### Observation Search
```javascript
// By patient and code
GET /Observation?patient=Patient/123&code=http://loinc.org|85354-9

// By category
GET /Observation?patient=Patient/123&category=vital-signs

// By encounter
GET /Observation?encounter=Encounter/456
```

---

### 3.3 Terminology Operations

#### Code Validation
```javascript
// Validate LOINC code
GET /tx.fhirlab.net/fhir/CodeSystem/$lookup
  ?system=http://loinc.org
  &code=85354-9
```

Response:
```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "display",
      "valueString": "Blood pressure panel"
    }
  ]
}
```

---

## 4. Data Storage & State Management

### 4.1 URL-Driven State (No LocalStorage)

All participant identity is encoded in the URL query parameters:

```
https://aklan-fhir.vercel.app/?w=AK26-A&u=Ana&c=rhu-kalibo
```

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `w` | Workshop code (group isolation) | `AK26-A` |
| `u` | User first name (participant tracking) | `Ana` |
| `c` | Clinic ID (role context) | `rhu-kalibo` |
| `r` | Role (optional) | `physician` |

**Benefits**:
- Shareable links
- No authentication required
- Server-side rendering friendly
- No localStorage dependencies

### 4.2 Workshop Isolation

Resources are tagged with workshop code in `meta.tag`:

```json
{
  "meta": {
    "tag": [{
      "system": "https://aklan-fhir.app/workshop",
      "code": "AK26-A"
    }]
  }
}
```

Search filtering:
```
GET /Patient?_tag=https://aklan-fhir.app/workshop|AK26-A
```

**Result**: Group A never sees Group B's patients.

---

## 5. Application Pages & Features

### 5.1 Public Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | IPS-style clinical viewer with patient list |
| **Workshop Entry** | `/workshop` | Enter workshop code, name, role, clinic |
| **Architecture** | `/architecture` | OpenHIE architecture diagram |
| **About** | `/about` | Workshop information |

### 5.2 Authenticated Pages (URL-based)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/dashboard` | Action cards for core workflows |
| **Patient Search** | `/patient/search` | Search + auto-load workshop patients |
| **Patient Registration** | `/patient/new` | Create new Patient resource |
| **Patient Edit** | `/patient/edit` | Edit demographics, contact, address |
| **Patient Detail** | `/patient/[id]` | View encounters, observations, timeline |
| **Encounter** | `/encounter` | Create new Encounter |
| **Encounter Edit** | `/encounter/edit` | Edit encounter details |
| **Vitals** | `/vitals` | Record vital signs (encounter-linked) |
| **Developer Mode** | `/developer` | Postman-style FHIR API tester |
| **Facilitator** | `/facilitator` | Workshop monitoring dashboard |

### 5.3 Core Features

- **Patient CRUD**: Create, Read, Update, Delete with confirmation dialogs
- **Encounter Management**: Create, edit, link to patient
- **Vitals Recording**: LOINC-coded observations linked to encounters
- **Cross-Facility Search**: Find patients created by other clinics
- **Pagination**: `_summary=count` for accurate totals, `_getpagesoffset` for pages
- **Delete Safety**: Confirmation dialogs before deleting Patient, Encounter, Observation

---

## 6. Error Handling

### 6.1 HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Show validation error to user |
| 401 | Unauthorized | Not applicable (public server) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | FHIR validation failed |
| 500 | Server Error | Retry or show error message |
| 503 | Service Unavailable | Show "Server busy, try again" |

### 6.2 Error Response Format

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "details": {
        "text": "Patient.name is required"
      },
      "expression": ["Patient.name"]
    }
  ]
}
```

---

## 7. Performance Specifications

### 7.1 Target Metrics

| Metric | Target | Measurement |
|--------|--------|---------------|
| Initial Load | < 3s | Time to first paint |
| API Response | < 500ms | SHR server response time |
| UI Update | < 100ms | Time from action to visual feedback |
| Search Results | < 1s | Time from search to results display |
| Concurrent Users | 20+ | Simultaneous workshop participants |

### 7.2 Bundle Optimization

- Lazy load routes
- Code split by feature
- Tree-shake unused FHIR profiles
- Compress FHIR JSON responses
- Use `@sveltejs/adapter-vercel` for edge deployment

---

## 8. Security Considerations

### 8.1 CORS

Since fhirlab.net is a public test server:
- CORS headers verified for browser requests
- Fallback: proxy through Vercel API routes if needed

### 8.2 Data Privacy

**Workshop Context**: Test data only
- Use fictional patient data
- No real PHI (Protected Health Information)
- Clear workshop disclaimer: "This is a learning environment using synthetic data"

### 8.3 No Authentication

The app is designed for **public access**:
- No OAuth2 / SMART on FHIR
- No tokens or API keys
- fhirlab.net servers are fully public
- Trust-based participant tracking via first name only

---

## 9. Testing Strategy

### 9.1 E2E Tests (Playwright)

```javascript
// Workshop workflow test
test('participant can register and view patient', async ({ page }) => {
  await page.goto('/workshop?w=AK26-TEST');
  await page.fill('[name="firstName"]', 'TestUser');
  await page.selectOption('[name="role"]', 'physician');
  await page.selectOption('[name="clinic"]', 'rhu-kalibo');
  await page.click('text=Enter Workshop');
  
  // Dashboard loads
  await expect(page.locator('text=Dashboard')).toBeVisible();
  
  // Create patient
  await page.click('text=Register Patient');
  await page.fill('[name="familyName"]', 'TestPatient');
  await page.fill('[name="givenName"]', 'Test');
  await page.click('text=Create Patient');
  
  // Patient appears in list
  await expect(page.locator('text=TestPatient')).toBeVisible();
});
```

### 9.2 Test Coverage

- Workshop entry and navigation
- Patient CRUD operations
- Encounter creation and editing
- Vitals recording with encounter linking
- Cross-facility patient search
- Developer mode API testing
- Mobile responsive layouts

---

## 10. Deployment Specifications

### 10.1 Vercel Configuration

```json
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
  kit: {
    adapter: adapter()
  }
};
```

### 10.2 Environment Variables

```bash
# .env (optional - defaults built in)
PUBLIC_FHIR_BASE_URL=https://cdr.fhirlab.net/fhir
PUBLIC_TERMINOLOGY_URL=https://tx.fhirlab.net/fhir
```

### 10.3 Pre-Deployment Checklist

- [ ] SHR connectivity verified
- [ ] CORS tested in browser
- [ ] All FHIR operations tested
- [ ] Mobile responsiveness verified
- [ ] Build succeeds without errors
- [ ] Playwright tests passing

---

## 11. Project Structure

```
.
├── src/
│   ├── lib/
│   │   ├── constants/
│   │   │   └── fhir-config.js      # FHIR server URLs, clinic configs
│   │   ├── services/
│   │   │   ├── fhir-client.js      # FHIR REST client (CRUD + pagination)
│   │   │   └── terminology.js      # Dynamic terminology with fallback
│   │   └── stores/
│   │       └── appStore.svelte.js  # URL-driven state, practitioner registration
│   ├── routes/
│   │   ├── +page.svelte            # Public IPS-style landing page
│   │   ├── +layout.svelte          # Root layout with AppHeader
│   │   ├── workshop/
│   │   │   └── +page.svelte        # Workshop entry (name, role, clinic)
│   │   ├── dashboard/
│   │   │   └── +page.svelte        # Action cards dashboard
│   │   ├── patient/
│   │   │   ├── search/
│   │   │   │   └── +page.svelte    # Patient search + auto-load
│   │   │   ├── new/
│   │   │   │   └── +page.svelte    # Patient registration form
│   │   │   ├── edit/
│   │   │   │   └── +page.svelte    # Patient edit form
│   │   │   └── [id]/
│   │   │       └── +page.svelte    # Patient detail (encounters, obs, timeline)
│   │   ├── encounter/
│   │   │   ├── +page.svelte        # Encounter creation
│   │   │   └── edit/
│   │   │       └── +page.svelte    # Encounter editing
│   │   ├── vitals/
│   │   │   └── +page.svelte        # Vitals recording (encounter-linked)
│   │   ├── developer/
│   │   │   └── +page.svelte        # Postman-style API tester
│   │   ├── facilitator/
│   │   │   └── +page.svelte        # Workshop monitoring
│   │   ├── architecture/
│   │   │   └── +page.svelte        # OpenHIE architecture diagram
│   │   └── about/
│   │       └── +page.svelte        # About page
│   └── app.html
├── tests/
│   ├── workshop-workflow.spec.js   # E2E workshop tests
│   └── patient-journey.spec.js     # Patient CRUD tests
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

---

**Document Version**: 2.0  
**Last Updated**: 2026-05-03  
**Next Review**: Post-workshop retrospective
