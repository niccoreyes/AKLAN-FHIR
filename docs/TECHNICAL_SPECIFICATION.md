# Technical Specification v1.0
## OpenHIE Mock EHR - FHIR Fundamentals 2026

**Date**: May 2026  
**Status**: Draft for Review  
**Target**: Vercel deployment with fhirlab.net backend

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Vercel)                              │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Svelte 5   │  │   Svelte 5   │  │   Svelte 5   │  │   Svelte 5   │     │
│  │   (User 1)   │  │   (User 2)   │  │   (User 3)   │  │   (User n)   │     │
│  │  RHU Kalibo  │  │   Hospital   │  │   Pharmacy   │  │     ...      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │                 │               │
│         └─────────────────┴─────────────────┴─────────────────┘               │
│                              │                                               │
│                              │ HTTPS + FHIR REST API                          │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FHIR SERVER LAYER                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    cdr.fhirlab.net/fhir                                  ││
│  │                         (SHR - Shared Health Record)                     ││
│  │                                                                          ││
│  │  FHIR R4 Resources:                                                      ││
│  │  • Patient, Encounter, Observation, Condition                           ││
│  │  • MedicationRequest, MedicationDispense                                 ││
│  │  • ServiceRequest, DiagnosticReport                                     ││
│  │  • Immunization, Organization, Practitioner                           ││
│  │  • Bundle (for transactions)                                             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    tx.fhirlab.net/fhir                                   ││
│  │                    (Terminology Service)                                  ││
│  │                                                                          ││
│  │  Code Systems:                                                           ││
│  │  • LOINC (observations, labs)                                             ││
│  │  • SNOMED CT (diagnoses, procedures)                                     ││
│  │  • ICD-10 (billing, reporting)                                           ││
│  │  • RxNorm (medications)                                                    ││
│  │  • PH Custom (Philippine extensions)                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 OpenHIE Mapping

Our Mock EMR implements these OpenHIE components:

| OpenHIE Component | Implementation | FHIR Endpoint |
|-------------------|----------------|---------------|
| **Point of Service (PoS)** | Mock EMR instances | Client-side Svelte app |
| **Interoperability Layer (IOL)** | Direct API calls | HTTPS to cdr.fhirlab.net |
| **Shared Health Record (SHR)** | FHIR Repository | cdr.fhirlab.net/fhir |
| **Terminology Service (TS)** | Code validation | tx.fhirlab.net/fhir |
| **Client Registry (CR)** | Patient matching | cdr.fhirlab.net/fhir/Patient?identifier= |

### 1.3 Data Flow Patterns

#### Pattern 1: Create Resource
```
User Action → Svelte Component → fhir-client.js → POST /[ResourceType] → SHR
                                    ↓
                              Response: 201 Created
                                    ↓
                              Update UI + Show Toast + Record Milestone
```

#### Pattern 2: Search Resources
```
User Search → Svelte Component → fhir-client.js → GET /[ResourceType]?params → SHR
                                    ↓
                              Response: Bundle
                                    ↓
                              Render List + Cache Results
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
    "source": "[clinic-id]"
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
    },
    {
      "system": "http://shr.fhirlab.net/patient-id",
      "value": "[generated]"
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
  },
  "contact": [
    {
      "relationship": [{
        "coding": [{
          "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
          "code": "C",
          "display": "Emergency Contact"
        }]
      }],
      "name": {
        "family": "[Name]",
        "given": ["[Name]"]
      },
      "telecom": [{
        "system": "phone",
        "value": "+63-XXX-XXX-XXXX"
      }]
    }
  ]
}
```

**Required Fields**: resourceType, identifier (at least one), name, gender, birthDate
**Search Parameters**: name, birthdate, gender, identifier, address-city

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
    "source": "[clinic-id]"
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
  "location": [
    {
      "location": {
        "reference": "Location/[id]",
        "display": "[Clinic Name - Department]"
      },
      "status": "active | reserved | completed"
    }
  ],
  "reasonCode": [
    {
      "text": "[Chief Complaint]"
    }
  ],
  "diagnosis": [
    {
      "condition": {
        "reference": "Condition/[id]"
      },
      "use": {
        "coding": [{
          "system": "http://terminology.hl7.org/CodeSystem/diagnosis-role",
          "code": "AD | DD | CC"
        }]
      }
    }
  ],
  "serviceProvider": {
    "reference": "Organization/[id]",
    "display": "[Clinic Name]"
  }
}
```

**Required Fields**: resourceType, status, class, subject
**Search Parameters**: patient, date, status, location, service-provider

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
    "source": "[clinic-id]"
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
  "bodySite": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "368209003",
      "display": "Right arm"
    }]
  },
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
**Search Parameters**: patient, code, date, category

---

#### Condition
**Purpose**: Diagnoses and clinical conditions
**Profile**: PH Core Condition

```json
{
  "resourceType": "Condition",
  "id": "[server-assigned]",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-01-15T08:30:00Z",
    "source": "[clinic-id]"
  },
  "clinicalStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
      "code": "active | inactive | resolved"
    }]
  },
  "verificationStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
      "code": "provisional | differential | confirmed | refuted"
    }]
  },
  "category": [
    {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/condition-category",
        "code": "encounter-diagnosis | problem-list-item"
      }]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "38341003",
        "display": "Hypertensive disorder"
      },
      {
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "I10",
        "display": "Essential (primary) hypertension"
      }
    ],
    "text": "Hypertension"
  },
  "subject": {
    "reference": "Patient/[id]"
  },
  "encounter": {
    "reference": "Encounter/[id]"
  },
  "onsetDateTime": "2026-01-15T08:30:00Z",
  "recordedDate": "2026-01-15T08:30:00Z",
  "recorder": {
    "reference": "Practitioner/[id]"
  },
  "asserter": {
    "reference": "Practitioner/[id]"
  },
  "note": [{
    "text": "[Clinical notes]"
  }]
}
```

**Required Fields**: resourceType, clinicalStatus, code, subject
**Search Parameters**: patient, category, clinical-status, code

---

#### MedicationRequest
**Purpose**: Prescriptions and medication orders
**Profile**: PH Core MedicationRequest

```json
{
  "resourceType": "MedicationRequest",
  "id": "[server-assigned]",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-01-15T08:30:00Z",
    "source": "[clinic-id]"
  },
  "status": "active | on-hold | revoked | completed",
  "intent": "proposal | plan | order | original-order",
  "category": [
    {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
        "code": "outpatient | inpatient | community"
      }]
    }
  ],
  "medicationCodeableConcept": {
    "coding": [{
      "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
      "code": "1790983",
      "display": "Amlodipine 5mg"
    }]
  },
  "subject": {
    "reference": "Patient/[id]"
  },
  "authoredOn": "2026-01-15T08:30:00Z",
  "requester": {
    "reference": "Practitioner/[id]",
    "display": "[Prescriber Name]"
  },
  "reasonCode": [{
    "text": "[Indication]"
  }],
  "dosageInstruction": [
    {
      "text": "Take 1 tablet by mouth once daily",
      "route": {
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "26643006",
          "display": "Oral route"
        }]
      },
      "doseAndRate": [{
        "doseQuantity": {
          "value": 5,
          "unit": "mg"
        }
      }],
      "timing": {
        "repeat": {
          "frequency": 1,
          "period": 1,
          "periodUnit": "d"
        }
      }
    }
  ],
  "dispenseRequest": {
    "quantity": {
      "value": 30,
      "unit": "tablet"
    },
    "expectedSupplyDuration": {
      "value": 30,
      "unit": "days"
    }
  }
}
```

**Required Fields**: resourceType, status, intent, medication, subject, authoredOn
**Search Parameters**: patient, status, intent

---

### 2.2 Terminology Systems

#### LOINC (Laboratory and Clinical Observations)
**System**: `http://loinc.org`  
**Purpose**: Standard codes for observations, lab tests, vitals  
**Usage**: Observation.code, ServiceRequest.code, DiagnosticReport.code

#### SNOMED CT
**System**: `http://snomed.info/sct`  
**Purpose**: Clinical diagnoses, procedures, findings  
**Usage**: Condition.code, Encounter.type, Procedure.code

#### ICD-10
**System**: `http://hl7.org/fhir/sid/icd-10`  
**Purpose**: Billing and reporting codes  
**Usage**: Condition.code (secondary), Claims

#### RxNorm
**System**: `http://www.nlm.nih.gov/research/umls/rxnorm`  
**Purpose**: Medication identifiers  
**Usage**: MedicationRequest.medication, MedicationDispense.medication

#### Philippine Custom Extensions
**System**: `http://ph.gov/fhir/identifiers/`  
**Purpose**: Philippines-specific identifiers  
**Usage**: Patient.identifier (PhilHealth, facility MRN)

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

Response:
```http
HTTP/1.1 200 OK

{FHIR Resource}
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
  "entry": [
    {
      "fullUrl": "...",
      "resource": {FHIR Resource},
      "search": {"mode": "match"}
    }
  ]
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

---

### 3.2 Search Parameters

#### Patient Search
```javascript
// By name (partial match)
GET /Patient?name=Santos

// By PhilHealth ID
GET /Patient?identifier=http://philhealth.gov.ph/member-id|12-123456789-0

// By birthdate
GET /Patient?birthdate=1985-03-15

// By gender
GET /Patient?gender=female

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

// By location
GET /Encounter?location=Location/456
```

#### Observation Search
```javascript
// By patient and code
GET /Observation?patient=Patient/123&code=http://loinc.org|85354-9

// By category
GET /Observation?patient=Patient/123&category=vital-signs

// By date
GET /Observation?patient=Patient/123&date:ge=2026-01-01

// Recent first
GET /Observation?patient=Patient/123&_sort=-date&_count=10
```

---

### 3.3 Terminology Operations

#### Code Validation
```javascript
// Validate LOINC code
GET /tx.fhirlab.net/fhir/CodeSystem/$lookup
  ?system=http://loinc.org
  &code=85354-9

// Validate SNOMED
GET /tx.fhirlab.net/fhir/CodeSystem/$lookup
  ?system=http://snomed.info/sct
  &code=38341003
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

#### ValueSet Expansion
```javascript
// Expand a value set
GET /tx.fhirlab.net/fhir/ValueSet/$expand
  ?url=http://loinc.org/vs/bp-panels
```

---

## 4. Data Storage & State Management

### 4.1 Client-Side State (Svelte 5 Runes)

```javascript
// lib/stores/appStore.svelte.js

export function createAppStore() {
  // Current user context
  let currentClinic = $state(null);
  let currentUser = $state(null);
  let currentRole = $state(null);
  
  // Active patient context
  let activePatient = $state(null);
  let patientHistory = $state({});
  
  // UI state
  let isLoading = $state(false);
  let notifications = $state([]);
  let milestones = $state([]);
  
  // Live activity feed
  let recentActivity = $state([]);
  
  return {
    // Getters
    get currentClinic() { return currentClinic; },
    get currentUser() { return currentUser; },
    get currentRole() { return currentRole; },
    get activePatient() { return activePatient; },
    get patientHistory() { return patientHistory; },
    get isLoading() { return isLoading; },
    get notifications() { return notifications; },
    get milestones() { return milestones; },
    get recentActivity() { return recentActivity; },
    
    // Actions
    setClinic(clinic) { currentClinic = clinic; },
    setUser(user) { currentUser = user; },
    setRole(role) { currentRole = role; },
    setActivePatient(patient) { 
      activePatient = patient;
      this.loadPatientHistory(patient.id);
    },
    addNotification(notification) {
      notifications = [notification, ...notifications].slice(0, 5);
    },
    recordMilestone(milestone) {
      if (!milestones.find(m => m.id === milestone.id)) {
        milestones = [...milestones, milestone];
        this.addNotification({
          type: 'milestone',
          title: `🏆 ${milestone.title}`,
          message: milestone.description
        });
      }
    }
  };
}
```

### 4.2 Caching Strategy

```javascript
// Simple in-memory cache for performance
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export function cacheGet(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

export function cacheSet(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}
```

---

## 5. Real-Time Synchronization

### 5.1 Polling Strategy

Since WebSocket is not available, use intelligent polling:

```javascript
// lib/services/liveSync.js

export class LiveSyncService {
  constructor() {
    this.subscribers = new Map();
    this.intervals = new Map();
    this.defaultInterval = 3000; // 3 seconds
  }

  subscribe(resourceType, params, callback, interval = this.defaultInterval) {
    const key = this.generateKey(resourceType, params);
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      this.startPolling(resourceType, params, key, interval);
    }
    
    this.subscribers.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(key).delete(callback);
      if (this.subscribers.get(key).size === 0) {
        this.stopPolling(key);
      }
    };
  }

  startPolling(resourceType, params, key, interval) {
    let lastResults = null;
    
    const poll = async () => {
      try {
        const results = await fhirClient.search(resourceType, params);
        
        // Deep comparison to detect changes
        if (JSON.stringify(results) !== JSON.stringify(lastResults)) {
          lastResults = results;
          this.notify(key, results);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll immediately
    poll();
    
    // Set interval
    const intervalId = setInterval(poll, interval);
    this.intervals.set(key, intervalId);
  }

  stopPolling(key) {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
      this.subscribers.delete(key);
    }
  }

  notify(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  generateKey(resourceType, params) {
    return `${resourceType}:${JSON.stringify(params)}`;
  }
}
```

### 5.2 Optimistic Updates

```javascript
// Optimistic UI pattern
async function createResourceOptimistic(resource) {
  // 1. Generate temporary ID
  const tempId = `temp-${Date.now()}`;
  const optimisticResource = { ...resource, id: tempId };
  
  // 2. Update UI immediately
  addToLocalState(optimisticResource);
  
  try {
    // 3. Send to server
    const result = await fhirClient.create(resource);
    
    // 4. Replace temp ID with real ID
    replaceTempId(tempId, result.id);
    
    // 5. Show success
    showToast(`${resource.resourceType} created successfully ✓`);
    
    return result;
  } catch (error) {
    // 6. Rollback on error
    removeFromLocalState(tempId);
    showError(`Failed to create ${resource.resourceType}: ${error.message}`);
    throw error;
  }
}
```

---

## 6. Error Handling

### 6.1 HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Show validation error to user |
| 401 | Unauthorized | Show auth error (shouldn't happen) |
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
| Polling Interval | 3s | Live sync frequency |
| Concurrent Users | 20+ | Simultaneous workshop participants |

### 7.2 Bundle Optimization

- Lazy load routes
- Code split by feature
- Tree-shake unused FHIR profiles
- Compress FHIR JSON responses
- Use SvelteKit adapter-static for edge caching

---

## 8. Security Considerations

### 8.1 CORS

Since fhirlab.net is a public test server:
- Verify CORS headers allow browser requests
- Test with multiple browsers
- Have fallback: proxy through Vercel API routes if needed

### 8.2 Data Privacy

**Workshop Context**: Test data only
- Use fictional patient data
- No real PHI (Protected Health Information)
- Clear workshop disclaimer: "This is a learning environment using synthetic data"

### 8.3 Rate Limiting

Be mindful of fhirlab.net limits:
- Implement request batching where possible
- Use Bundles for transactions
- Cache aggressively
- Back off on 429 responses

---

## 9. Testing Strategy

### 9.1 Unit Tests

```javascript
// Test FHIR client
import { describe, it, expect } from 'vitest';
import { fhirClient } from '$lib/services/fhir-client.js';

describe('FHIR Client', () => {
  it('should create a patient', async () => {
    const patient = {
      resourceType: 'Patient',
      name: [{ family: 'Test', given: ['User'] }],
      gender: 'male',
      birthDate: '1990-01-01'
    };
    
    const result = await fhirClient.create(patient);
    expect(result.id).toBeDefined();
    expect(result.resourceType).toBe('Patient');
  });
});
```

### 9.2 Integration Tests

- End-to-end patient journey
- Cross-facility data exchange
- Terminology validation
- Error scenarios

### 9.3 Load Testing

- Simulate 20 concurrent users
- Rapid resource creation
- Search under load

---

## 10. Deployment Specifications

### 10.1 Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".svelte-kit/output",
  "framework": "sveltekit",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### 10.2 Environment Variables

```bash
# .env
PUBLIC_FHIR_BASE_URL=https://cdr.fhirlab.net/fhir
PUBLIC_TERMINOLOGY_URL=https://tx.fhirlab.net/fhir
PUBLIC_APP_NAME=OpenHIE Mock EHR
PUBLIC_WORKSHOP_NAME=FHIR Fundamentals 2026 - Aklan
```

### 10.3 Pre-Deployment Checklist

- [ ] SHR connectivity verified
- [ ] CORS tested in browser
- [ ] All FHIR operations tested
- [ ] Mobile responsiveness verified
- [ ] Lighthouse score > 80
- [ ] Test data pre-populated
- [ ] Documentation updated

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-03  
**Next Review**: Before implementation Phase 1

**Questions for Review**:
1. Are all required FHIR resources covered?
2. Is the polling interval (3s) appropriate?
3. Should we implement request batching?
4. Any missing error scenarios?
5. Performance targets realistic?
