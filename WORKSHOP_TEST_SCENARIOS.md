# AKLAN-FHIR Codebase Analysis & Test Scenarios
## Workshop ID: AK26-A | Participant: Thomas

---

## 1. CLINIC ANALYSIS

### Available Clinics

| Clinic ID | Name | Type | Color | Location |
|-----------|------|------|-------|----------|
| rhu-kalibo | RHU Kalibo | Rural Health Unit | Emerald (#059669) | Kalibo, Aklan |
| aklan-hospital | Aklan Provincial Hospital | Provincial Hospital | Blue (#2563EB) | Kalibo, Aklan |
| rhu-malay | RHU Malay | Rural Health Unit | Cyan (#0891B2) | Malay, Aklan |
| kalibo-lab | Kalibo Medical Laboratory | Diagnostic Center | Purple (#7C3AED) | Kalibo, Aklan |
| aklan-pharmacy | Aklan Provincial Pharmacy | Pharmacy | Red (#DC2626) | Kalibo, Aklan |

### Clinic Capabilities Matrix

| Clinic | Can Create | Can View | Primary Actions | Description |
|--------|-----------|----------|-----------------|-------------|
| **rhu-kalibo** | Patient, Encounter, Observation, ServiceRequest, MedicationRequest | All 6 resource types | register, encounter, vitals, order, prescribe | Primary care — register patients, record visits, order labs, refer to hospital |
| **aklan-hospital** | Patient, Encounter, Observation, ServiceRequest, MedicationRequest, DiagnosticReport | All 6 resource types | register, encounter, vitals, order, prescribe, report | Secondary care — full clinical services including lab reporting |
| **rhu-malay** | Patient, Encounter, Observation, ServiceRequest | Patient, Encounter, Observation, ServiceRequest, DiagnosticReport | register, encounter, vitals, order | Rural health — register patients, basic care, refer to hospital |
| **kalibo-lab** | Observation, DiagnosticReport | Patient, ServiceRequest, DiagnosticReport, Observation | inbox, report | Laboratory — receive orders, process tests, report results |
| **aklan-pharmacy** | MedicationDispense | Patient, MedicationRequest, MedicationDispense | inbox, dispense | Pharmacy — receive prescriptions, dispense medications |

---

## 2. PARTICIPANT ROLES

| Role ID | Name | Icon | Description |
|---------|------|------|-------------|
| registration | Registration Clerk | 📝 | Register new patients |
| nurse | Nurse / BHW | 👩‍⚕️ | Record vital signs and assessments |
| physician | Physician | 👨‍⚕️ | Diagnose and create referrals |
| lab | Lab Technician | 🧪 | Process lab orders and results |
| pharmacy | Pharmacist | 💊 | Dispense medications |

---

## 3. CROSS-CLINIC WORKFLOWS (HIE Demonstration)

### Workflow A: Primary Care Referral → Hospital → Follow-up
```
RHU Kalibo (Primary Care)
  ├─ Register Patient (Patient resource)
  ├─ Record Vitals (Observation resources)
  ├─ Create Encounter (Encounter resource)
  ├─ Order Labs (ServiceRequest resource)
  └─ Prescribe if needed (MedicationRequest resource)
         ↓ (HIE: Data visible to all clinics via SHR)
Aklan Provincial Hospital (Secondary Care)
  ├─ Search & retrieve patient from RHU
  ├─ Review complete history (cross-facility data view)
  ├─ Create Hospital Encounter
  ├─ Order more labs (ServiceRequest)
  ├─ Create Diagnostic Report (lab results)
  ├─ Add Diagnosis (Condition resource)
  └─ Create MedicationRequest (prescriptions)
         ↓ (HIE: Updates visible across facilities)
Aklan Provincial Pharmacy
  ├─ Search patient
  ├─ View active MedicationRequests
  └─ Dispense medication (MedicationDispense resource)
         ↓ (HIE: Dispense recorded in SHR)
RHU Kalibo (Follow-up)
  ├─ Search patient
  ├─ View all data from Hospital + Pharmacy
  ├─ Create Follow-up Encounter
  └─ Record improved vitals (demonstrating continuity)
```

### Workflow B: Rural Health → Lab Results
```
RHU Malay (Rural Health Unit)
  ├─ Register Patient
  ├─ Record initial vitals
  ├─ Order HbA1c test (ServiceRequest)
  └─ Refer to lab
         ↓ (HIE: Lab order visible to Laboratory)
Kalibo Medical Laboratory
  ├─ View ServiceRequest in Work Queue (Inbox)
  ├─ Process blood sample
  ├─ Create Observation (result)
  └─ Create DiagnosticReport (final report)
         ↓ (HIE: Results visible to ordering clinic)
RHU Malay
  ├─ Search patient
  ├─ View DiagnosticReport from Lab
  └─ Review and adjust treatment
```

### Workflow C: Emergency Referral
```
RHU Malay (Triage)
  ├─ Quick registration (if new patient)
  ├─ Record emergency vitals (BP 180/110, chest pain)
  ├─ Create Emergency ServiceRequest/Referral
  └─ Transfer to hospital
         ↓ (HIE: Emergency data immediately available)
Aklan Provincial Hospital (Emergency Department)
  ├─ Search by name or PhilHealth ID
  ├─ Access RHU triage data instantly
  ├─ Conduct ECG, Troponin tests
  ├─ Create DiagnosticReport (NSTEMI diagnosis)
  ├─ Create multiple MedicationRequests
  └─ Admission encounter
         ↓ (HIE: Complete record shared)
Pharmacy
  └─ Dispense emergency medications
         ↓
RHU Malay (Follow-up)
  └─ Monitor recovery with full history access
```

---

## 4. FHIR RESOURCES USED

| Resource | Purpose | Created By | Viewed By |
|----------|---------|-----------|-----------|
| Patient | Demographics, identifiers (PhilHealth) | RHU, Hospital | All clinics |
| Encounter | Visit records | RHU, Hospital | All clinics |
| Observation | Vital signs, lab results | RHU, Hospital, Lab | All clinics |
| ServiceRequest | Lab orders, referrals | RHU, Hospital | Lab, RHU, Hospital |
| DiagnosticReport | Lab reports with results | Hospital, Lab | All clinics |
| MedicationRequest | Prescriptions | RHU, Hospital | Pharmacy, RHU, Hospital |
| MedicationDispense | Dispensing records | Pharmacy | Pharmacy, RHU, Hospital |
| Condition | Diagnoses (HTN, DM, etc.) | Hospital | All clinics |
| Practitioner | Participant tracking | System | System |

---

## 5. COMPREHENSIVE TEST SCENARIOS

### URL PATTERNS FOR TESTING
Base URL Format: `https://aklan-fhir.vercel.app/workshop?w=AK26-A&u=Thomas&c={clinic-id}&r={role}`

---

## SCENARIO SET 1: STARTING AT RHU KALIBO (Primary Care)

### Test 1.1: Complete Patient Registration Workflow
**Starting Point:** RHU Kalibo as Registration Clerk
```
URL: /workshop?w=AK26-A&u=Thomas&c=rhu-kalibo&r=registration
```
**Steps:**
1. Log in as Thomas at RHU Kalibo
2. Click "Register Patient"
3. Enter patient details:
   - Name: Maria Cruz Santos
   - PhilHealth ID: 12-123456789-0
   - Birthdate: 1980-05-15
   - Gender: Female
   - Address: 123 Rizal St, Kalibo, Aklan
   - Phone: +63-912-345-6789
4. Submit and verify green success toast
5. **Verify**: Patient visible in SHR

**Expected FHIR Resources Created:**
- 1 Patient resource with workshop tag AK26-A

**Cross-Clinic Verification:**
- Switch to Hospital clinic (via clinic switcher dropdown)
- Search for "Maria Santos"
- Verify patient appears in search results

---

### Test 1.2: Vitals Recording
**Starting Point:** RHU Kalibo as Nurse/BHW
```
URL: /workshop?w=AK26-A&u=Thomas&c=rhu-kalibo&r=nurse
```
**Steps:**
1. Search for patient "Maria Santos"
2. Click "Record Vitals"
3. Enter vitals:
   - BP: 150/95 mmHg (Hypertensive)
   - Heart Rate: 88 bpm
   - Temperature: 37.2°C
   - Respiratory Rate: 20/min
   - Weight: 65 kg
   - Height: 160 cm
4. Save each vital

**Expected FHIR Resources Created:**
- 6 Observation resources (BP panel + individual vitals)
- All linked to Patient via subject.reference

**Cross-Clinic Verification:**
- Switch to Hospital
- Search patient
- View timeline
- Verify vitals appear from RHU

---

### Test 1.3: Encounter Documentation + ServiceRequest
**Starting Point:** RHU Kalibo as Physician
```
URL: /workshop?w=AK26-A&u=Thomas&c=rhu-kalibo&r=physician
```
**Steps:**
1. Find patient "Maria Santos"
2. Click "Record Visit" (Create Encounter)
3. Document:
   - Chief Complaint: Headache, dizziness
   - Assessment: Suspected Hypertension
   - Plan: Refer to hospital for workup
4. Save encounter
5. Click "Order Labs"
6. Create ServiceRequest for:
   - Complete Blood Count (CBC)
   - Creatinine
   - Electrolytes Panel
7. Set priority: routine
8. Submit order

**Expected FHIR Resources Created:**
- 1 Encounter resource
- 3 ServiceRequest resources (lab orders)

**Cross-Clinic Verification:**
- Lab will see orders in their Work Queue (Inbox)
- Hospital will see encounter and orders in patient timeline

---

### Test 1.4: Cross-Clinic Patient Search (HIE Demonstration)
**Starting Point:** Switch to Aklan Provincial Hospital
```
URL: /dashboard?w=AK26-A&u=Thomas&c=aklan-hospital&r=physician
```
**Steps:**
1. Click clinic badge (currently RHU Kalibo)
2. Select "Aklan Provincial Hospital" from dropdown
3. URL should update: `c=aklan-hospital`
4. Click "Find Patient"
5. Search: "Maria Santos"
6. **Verify**: Patient created at RHU appears in results
7. Click patient card
8. **Verify Complete Timeline Shows:**
   - Patient demographics (from RHU)
   - All vitals (from RHU Nurse)
   - Encounter details (from RHU Physician)
   - Lab orders (ServiceRequests from RHU)

**HIE Value Demonstrated:**
- No re-registration needed
- Complete medical history available
- Continuity of care across facilities

---

## SCENARIO SET 2: STARTING AT AKLAN PROVINCIAL HOSPITAL

### Test 2.1: Hospital Encounter + Lab Reporting
**Starting Point:** Aklan Provincial Hospital as Physician
```
URL: /workshop?w=AK26-A&u=Thomas&c=aklan-hospital&r=physician
```
**Steps:**
1. Search for patient created by another clinic (or register new if none)
2. Create Hospital Encounter:
   - Type: Inpatient / Outpatient visit
   - Record diagnosis details
3. Order additional labs:
   - Lipid Panel
   - Liver Function Test
   - HbA1c
4. Go to "Lab Results" page
5. Create Diagnostic Report:
   - Link to ServiceRequest if available
   - Enter results with LOINC codes
   - Mark status: Final
   - Add conclusion

**Expected FHIR Resources Created:**
- 1 Encounter
- 3 ServiceRequests
- 1 DiagnosticReport with linked Observations

**Cross-Clinic Impact:**
- RHU can view hospital encounter and lab results
- Pharmacy can see prescriptions

---

### Test 2.2: Complex Medication Management
**Starting Point:** Aklan Provincial Hospital as Physician
```
URL: /dashboard?w=AK26-A&u=Thomas&c=aklan-hospital&r=physician
```
**Steps:**
1. Find patient with hypertension
2. Click "Prescribe"
3. Create MedicationRequest for:
   - Amlodipine 5mg, once daily, 30 days
   - Add dosage instructions
   - Set status: active
4. Create second prescription:
   - Metformin 500mg, twice daily (if diabetic)
5. Submit both
6. Switch to Pharmacy
7. Go to Inbox → Prescriptions tab
8. **Verify**: Both prescriptions visible

**Expected FHIR Resources Created:**
- 2 MedicationRequest resources

---

## SCENARIO SET 3: STARTING AT KALIBO LAB (Diagnostic Center)

### Test 3.1: Work Queue + Lab Reporting
**Starting Point:** Kalibo Medical Laboratory as Lab Technician
```
URL: /workshop?w=AK26-A&u=Thomas&c=kalibo-lab&r=lab
```
**Steps:**
1. Log in as Lab Technician
2. **Verify Dashboard Actions**: Only "Work Queue" and "Lab Results" visible
3. Click "Work Queue"
4. Check "Lab Orders" tab
5. **Verify**: Orders from RHU and Hospital clinics visible
6. Select an order (e.g., CBC from Maria Santos)
7. Click "Report Results"
8. Enter results:
   - Hemoglobin: 12.5 g/dL
   - WBC: 7.5 x10^9/L
   - Platelets: 250 x10^9/L
9. Create DiagnosticReport
10. Submit

**Expected FHIR Resources Created:**
- 3+ Observation resources (individual results)
- 1 DiagnosticReport (summary with conclusions)

**Cross-Clinic Impact:**
- Ordering clinic (RHU/Hospital) sees results immediately
- Results appear in patient's timeline across all clinics

---

### Test 3.2: Standalone Lab Report
**Steps:**
1. Find patient in system
2. Create DiagnosticReport without linked order
3. Add custom results
4. Submit

**Note:** Lab can only VIEW patients and orders, cannot create patients or encounters

---

## SCENARIO SET 4: STARTING AT AKLAN PROVINCIAL PHARMACY

### Test 4.1: Prescription Work Queue + Dispensing
**Starting Point:** Aklan Provincial Pharmacy as Pharmacist
```
URL: /workshop?w=AK26-A&u=Thomas&c=aklan-pharmacy&r=pharmacy
```
**Steps:**
1. Log in as Pharmacist
2. **Verify Dashboard Actions**: Only "Work Queue" and "Dispense" visible
3. Click "Work Queue"
4. Check "Prescriptions" tab
5. **Verify**: Active MedicationRequests visible
6. Select prescription for Amlodipine
7. Click "Dispense"
8. Enter:
   - Quantity: 30 tablets
   - Lot number: LOT-2026-001
   - Instructions: Take once daily in the morning
9. Submit MedicationDispense

**Expected FHIR Resources Created:**
- 1 MedicationDispense resource
- Links to original MedicationRequest

**Cross-Clinic Impact:**
- Prescribing clinic sees "completed" status
- Patient timeline shows medication history

---

### Test 4.2: View Patient Medication History
**Steps:**
1. Search for patient "Maria Santos"
2. View patient detail page
3. **Verify Timeline Shows:**
   - Active prescriptions
   - Dispensed medications with dates
   - Prescribing physician names
4. This demonstrates pharmacy access to patient's medication history from all clinics

---

## SCENARIO SET 5: STARTING AT RHU MALAY (Rural Remote Clinic)

### Test 5.1: Rural Health Limited Capabilities
**Starting Point:** RHU Malay as Nurse
```
URL: /workshop?w=AK26-A&u=Thomas&c=rhu-malay&r=nurse
```
**Steps:**
1. Log in at RHU Malay
2. **Verify Dashboard Actions**: register, encounter, vitals, order
3. **Verify Missing**: prescribe (no prescription capability)
4. Register new patient: "Juan Dela Cruz"
5. Record vitals:
   - Blood Glucose: 250 mg/dL (elevated)
6. Create encounter
7. Order HbA1c test

**Expected:** Can create ServiceRequest but NOT MedicationRequest

---

### Test 5.2: Cross-Region Care Coordination
**Steps:**
1. Create patient at RHU Malay (Malay town)
2. Order labs (will be done at Kalibo Lab)
3. Refer to Aklan Provincial Hospital
4. Switch to Hospital (different town)
5. Search and find patient from Malay
6. Create encounter
7. View Malay clinic's data

**HIE Value:** Rural patients receive seamless care despite geographic distance

---

## SCENARIO SET 6: COMPLEX MULTI-CLINIC WORKFLOWS

### Test 6.1: Complete Patient Journey (All 5 Clinics)
**Patient Case:** Elena Torres — Emergency Referral

**Phase 1: RHU Malay (Emergency Triage)**
```
Clinic: rhu-malay | Role: nurse
```
- Register Elena Torres (50/F)
- Record emergency vitals: BP 180/110, chest pain
- Document chief complaint: Severe chest pain radiating to left arm
- Create urgent ServiceRequest: Emergency referral to hospital

**Phase 2: Aklan Provincial Hospital (Emergency Department)**
```
Clinic: aklan-hospital | Role: physician
Switch via clinic badge dropdown
```
- Search: "Elena Torres"
- View RHU Malay triage data
- Create Emergency Encounter
- Order: ECG, Troponin I, CBC
- Document: Suspected ACS

**Phase 3: Kalibo Lab (Emergency Testing)**
```
Clinic: kalibo-lab | Role: lab
```
- View Work Queue
- Find Elena's orders
- Process STAT labs
- Create DiagnosticReport:
  - Troponin I: Elevated (2.5 ng/mL)
  - ECG: ST depression
- Mark as Final/Critical

**Phase 4: Hospital (Diagnosis & Treatment)**
```
Clinic: aklan-hospital | Role: physician
```
- View lab results
- Add Diagnosis: NSTEMI (Non-ST Elevated MI)
- Create MedicationRequests:
  - Aspirin 81mg daily
  - Clopidogrel 75mg daily
  - Metoprolol 50mg BID
- Document admission

**Phase 5: Pharmacy (Dispensing)**
```
Clinic: aklan-pharmacy | Role: pharmacy
```
- View Work Queue → Prescriptions
- Find Elena's medications
- Dispense all three medications
- Record lot numbers

**Phase 6: RHU Malay (Follow-up)**
```
Clinic: rhu-malay | Role: nurse
Switch back
```
- Search Elena Torres
- View complete timeline:
  - Original triage (RHU Malay)
  - Hospital encounter
  - Lab results
  - Medications dispensed
- Create follow-up encounter
- Record improved vitals: BP 140/90

**Verification Points:**
- All 5 clinics contributed to record
- Each clinic saw appropriate data
- Complete continuity of care demonstrated

---

### Test 6.2: Chronic Disease Management Loop
**Patient Case:** Juan Dela Cruz — Diabetes Management

**Workflow:**
1. **RHU Malay**: Initial visit, high BS (250 mg/dL), HbA1c ordered
2. **Kalibo Lab**: Process HbA1c → Result: 8.5%
3. **RHU Malay**: Review results, refer to Hospital for management
4. **Aklan Hospital**: Adjust medications, create prescriptions
5. **Aklan Pharmacy**: Dispense Metformin
6. **RHU Malay** (Week 4): Follow-up, BS improved to 140 mg/dL

**FHIR Resources Across Loop:**
- 3 Encounters (RHU → Hospital → RHU)
- 4 Observations (initial BS, HbA1c, follow-up BS, vitals)
- 2 ServiceRequests (HbA1c order, referral)
- 1 DiagnosticReport (HbA1c result)
- 1 MedicationRequest (Metformin)
- 1 MedicationDispense

---

## SCENARIO SET 7: HIE DATA VIEWING VERIFICATIONS

### Test 7.1: Verify Data Isolation by Workshop
**Purpose:** Ensure AK26-A data is separate from other workshops

**Steps:**
1. Create patient at workshop AK26-A
2. Note patient's PhilHealth ID
3. Open new browser tab
4. Go to: `/workshop?w=AK26-B&u=Other&c=rhu-kalibo`
5. Search for same PhilHealth ID
6. **Verify**: Patient NOT found (isolated by workshop tag)

**Technical Detail:**
- FHIR tag: `https://aklan-fhir.app/workshop|AK26-A`
- Search filter: `_tag=https://aklan-fhir.app/workshop|AK26-A`

---

### Test 7.2: Full SHR vs Group Filter Toggle
**Steps:**
1. In Dashboard, locate "Group Filter" toggle
2. Currently set to "Group Only" (shows AK26-A data only)
3. Click toggle to "Full SHR"
4. Go to Patient Search
5. **Verify**: Can see patients from all workshops (if any exist)
6. Toggle back to "Group Only"
7. **Verify**: Only AK26-A patients visible

**Purpose:** Demonstrate HIE filtering capabilities

---

### Test 7.3: Timeline Completeness Check
**Steps:**
1. Find patient with data from multiple clinics
2. Open patient detail page
3. **Verify Timeline Shows:**
   - Patient registration (clinic icon/color)
   - Each encounter (with clinic context)
   - Vitals from different visits
   - Lab orders and results
   - Medications prescribed and dispensed
4. **Verify Sorting**: Most recent first
5. **Verify Cross-Reference**: Clicking resource shows full details

---

## SCENARIO SET 8: ERROR HANDLING & EDGE CASES

### Test 8.1: Patient Not Found
**Steps:**
1. Search for non-existent name: "ZZZZZZZZ"
2. **Verify**: Empty state with "No patients found" message
3. **Verify**: "Register New Patient" button available

---

### Test 8.2: Unauthorized Action Prevention
**Steps:**
1. Log in as Lab Technician at Kalibo Lab
2. Try to access: `/medication-request` directly
3. **Verify**: Redirected to dashboard (Lab cannot prescribe)
4. Try to access: `/patient/new`
5. **Verify**: Redirected to dashboard (Lab cannot register patients)

**Technical Implementation:**
- `CLINIC_CAPABILITIES` checked on page load
- Redirect if `canCreate` doesn't include resource type

---

### Test 8.3: URL Parameter Preservation
**Steps:**
1. Start at: `/dashboard?w=AK26-A&u=Thomas&c=rhu-kalibo`
2. Click "Prescribe"
3. **Verify URL contains**: `w=AK26-A`, `u=Thomas`, `c=rhu-kalibo`, `returnTo=`
4. Click "Cancel" or go back
5. **Verify**: Returns to dashboard with all params intact

---

## SCENARIO SET 9: MOBILE & ACCESSIBILITY TESTS

### Test 9.1: Mobile Responsive Layout
**Device:** Smartphone (iPhone/Android)

**Checks:**
1. Login form fits screen
2. Dashboard action cards stack vertically
3. Bottom navigation bar accessible
4. Patient search results scrollable
5. Forms usable with touch targets

---

### Test 9.2: Touch-Friendly Interactions
**Steps:**
1. Use touch to select clinic card
2. Use touch to select role
3. Use touch on bottom nav
4. Use touch on patient cards
5. **Verify**: All interactions work without mouse

---

## SCENARIO SET 10: FACILITATOR DASHBOARD

### Test 10.1: Monitor Workshop Progress
**URL:** `/facilitator?w=AK26-A`

**Steps:**
1. Open facilitator dashboard
2. **Verify Displays:**
   - Total participants
   - Resources created by type
   - Recent activity feed
   - Cross-clinic exchange count
3. **Verify Real-time**: Data updates as participants work

---

## QUICK REFERENCE: CLINIC URLS FOR TESTING

```
# RHU Kalibo (Primary Care - Full Capabilities)
https://aklan-fhir.vercel.app/workshop?w=AK26-A&u=Thomas&c=rhu-kalibo

# Aklan Provincial Hospital (Secondary Care - Full Capabilities + Reports)
https://aklan-fhir.vercel.app/workshop?w=AK26-A&u=Thomas&c=aklan-hospital

# RHU Malay (Rural Health - Limited, No Prescribing)
https://aklan-fhir.vercel.app/workshop?w=AK26-A&u=Thomas&c=rhu-malay

# Kalibo Medical Laboratory (Lab Only - Receive Orders, Report Results)
https://aklan-fhir.vercel.app/workshop?w=AK26-A&u=Thomas&c=kalibo-lab

# Aklan Provincial Pharmacy (Pharmacy Only - Dispense Medications)
https://aklan-fhir.vercel.app/workshop?w=AK26-A&u=Thomas&c=aklan-pharmacy
```

---

## MILESTONES TO VERIFY

| Milestone | Trigger | Points | Verification |
|-----------|---------|--------|--------------|
| First Patient | Create first Patient resource | 10 | Green toast notification |
| Vitals Pro | Create 3+ Observations | 10 | Check patient timeline |
| Encounter Expert | Create first Encounter | 10 | Badge appears |
| Data Shared | Another clinic views your data | 20 | Cross-clinic activity |
| Interoperability | You view data from another clinic | 20 | View patient created elsewhere |
| Medication Master | Create MedicationRequest | 15 | Pharmacy inbox receives it |
| Lab Orderer | Create ServiceRequest | 15 | Lab work queue receives it |
| Complete History | View patient with 5+ resources | 20 | Timeline completeness |
| Continuity Champion | Complete full patient journey | 20 | Multi-clinic workflow |
| FHIR Expert | Create 10+ valid resources | 25 | Resource count in dashboard |

**Maximum Score:** 165 points per participant

---

## TEST DATA: PATIENT CASES

### Case 1: Maria Santos (Hypertension)
- PhilHealth: 12-123456789-0
- Age: 45, Female
- Journey: RHU → Hospital → Pharmacy → RHU Follow-up

### Case 2: Juan Dela Cruz (Diabetes)
- PhilHealth: 09-876543210-1
- Age: 58, Male
- Journey: RHU Malay → Lab → RHU Malay → Hospital

### Case 3: Ana Reyes (Prenatal)
- PhilHealth: 11-111111111-1
- Age: 28, Female
- Journey: RHU → Hospital (Ultrasound) → RHU

### Case 4: Miguel Santos (Immunization)
- PhilHealth: 22-222222222-2
- Age: 2 months, Male
- Journey: RHU → RHU Malay → RHU Kalibo

### Case 5: Elena Torres (Emergency)
- PhilHealth: 33-333333333-3
- Age: 50, Female
- Journey: RHU Malay → Hospital → Lab → Pharmacy → RHU Malay

---

## SUMMARY: KEY HIE DEMONSTRATION POINTS

1. **Data Persistence**: Patient created at Clinic A is searchable at Clinic B
2. **Real-time Sync**: Updates appear across clinics within seconds
3. **Access Control**: Each clinic sees appropriate data (Lab sees orders, Pharmacy sees prescriptions)
4. **Workflow Continuity**: Complete medical record follows patient across facilities
5. **Capability Limitations**: Each clinic has appropriate restrictions (Lab cannot prescribe, Pharmacy cannot diagnose)
6. **Standardization**: All clinics use FHIR R4 for interoperability
7. **Audit Trail**: Each resource tracks which clinic and practitioner created it
8. **Workshop Isolation**: AK26-A data is completely separate from other workshops

---

**Document Generated:** 2026-05-03
**Workshop:** FHIR Fundamentals 2026 - Aklan
**System:** OpenHIE Mock EHR v2.0.0
