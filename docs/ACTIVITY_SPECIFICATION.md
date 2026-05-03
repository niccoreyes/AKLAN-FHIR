# Activity Specification v1.0
## OpenHIE Mock EHR - Culminating Activity Design
## "The Patient Relay Race"

**Date**: May 2026  
**Duration**: 60 minutes  
**Format**: Live, collaborative, cross-facility exchange simulation  
**Status**: Draft for Review

---

## 1. Activity Overview

### 1.1 Concept

**"The Patient Relay Race"** — A collaborative workshop activity where participants simulate a complete patient journey across multiple healthcare facilities using OpenHIE interoperability principles.

### 1.2 Learning Objectives

By the end of this activity, participants will be able to:

1. **Create** valid FHIR R4 resources (Patient, Encounter, Observation, Condition, MedicationRequest, ServiceRequest)
2. **Search** and retrieve patient data from a Shared Health Record (SHR)
3. **Demonstrate** cross-facility data exchange in real-time
4. **Explain** the OpenHIE architecture components (PoS, SHR, CR, TS)
5. **Articulate** the value of interoperability for patient continuity of care
6. **Troubleshoot** common FHIR data exchange issues

### 1.3 Activity Flow Summary

```
TIME    PHASE                    DESCRIPTION
─────────────────────────────────────────────────────────
0:00    SETUP (5 min)            Clinic selection, role assignment
0:05    ROUND 1 (15 min)         Create patient data at Clinic A
0:20    ROUND 2 (15 min)         Exchange: Clinic B retrieves & adds
0:35    ROUND 3 (15 min)         Continue: Pharmacy & follow-up
0:50    REVIEW (10 min)          Timeline review, export, discussion
1:00    COMPLETE
```

---

## 2. Pre-Activity Setup

### 2.1 Technical Requirements

**For Each Participant**:
- Smartphone or tablet (mobile-first design)
- Web browser (Chrome, Safari, Firefox)
- Internet connection
- Access to: `https://[app-url].vercel.app`

**Facilitator Needs**:
- Laptop + large screen for demonstration
- Backup: Mobile hotspot in case of WiFi issues
- Pre-created test data (optional safety net)
- Printed role cards (backup)

### 2.2 Participant Preparation

**Before the Activity**:
1. Distribute clinic URLs or QR codes
2. Brief demonstration of the Mock EMR (5 min)
3. Show example: "Watch me register Maria"
4. Explain milestone system
5. Clarify: "This is synthetic data for learning"

### 2.3 Clinic & Role Assignment

**Clinics** (5 total):

| Clinic ID | Name | Type | Color | Role Types |
|-----------|------|------|-------|------------|
| rhu-kalibo | RHU Kalibo | Rural Health Unit | Emerald | Registration, Nurse, BHW, Physician |
| aklan-provincial | Aklan Provincial Hospital | Provincial Hospital | Blue | Physician, Specialist, Lab Tech, Pharmacist |
| rhu-malay | RHU Malay | Rural Health Unit | Cyan | Registration, Nurse, BHW |
| kalibo-lab | Kalibo Medical Laboratory | Diagnostic Center | Purple | Lab Tech, Radiologist |
| aklan-pharmacy | Aklan Provincial Pharmacy | Pharmacy | Red | Pharmacist, Pharmacy Tech |

**Roles per Clinic**:

**RHU Roles**:
- Registration Clerk: Patient registration, demographics
- Nurse/BHW: Vital signs, initial assessment
- Municipal Health Officer: Diagnosis, referrals

**Hospital Roles**:
- Receiving Physician: Review referrals, admit
- Specialist (Cardiologist, OB-GYN, etc.): Diagnose, treat
- Medical Technologist: Lab orders, results
- Pharmacist: Medication dispensing

---

## 3. Patient Cases (5 Scenarios)

### Case 1: Maria Santos — Hypertension Journey
**Complexity**: ⭐⭐⭐ Standard
**Duration**: Full 60-minute activity
**Roles Needed**: 7-8 participants

**Story**: Maria, 45, visits RHU with headaches. BP elevated. Referred to hospital. Diagnosed with Stage 2 HTN. Started on Amlodipine. Follow-up at RHU shows improvement.

**Timeline**:
```
Day 1 (RHU): Registration → Vitals (BP 150/95) → Encounter → Suspected HTN → Referral
Day 3 (Hospital): Retrieve record → Exam (BP 160/100) → Labs → Dx: Stage 2 HTN → Rx: Amlodipine
Day 3 (Pharmacy): Dispense Amlodipine
Day 30 (RHU): Follow-up → Vitals (BP 135/85 improved!)
```

**FHIR Resources to Create**:
1. Patient (Maria Santos)
2. Observation x4 (BP, HR, Temp, RR)
3. Encounter (RHU initial)
4. Condition (Suspected HTN)
5. ServiceRequest (Referral)
6. Encounter (Hospital)
7. Observation x3 (Hospital vitals)
8. ServiceRequest x3 (Lab orders: CBC, Creatinine, Electrolytes)
9. DiagnosticReport (Lab results)
10. Condition (Confirmed HTN - replaces suspected)
11. MedicationRequest (Amlodipine 5mg)
12. MedicationDispense (Pharmacy)
13. Encounter (RHU follow-up)
14. Observation (Follow-up vitals - BP improved)

**Milestones**:
- First Patient (10 pts)
- Complete Vitals (10 pts)
- First Encounter (10 pts)
- Cross-Facility Exchange (20 pts)
- Medication Ordered (15 pts)
- Labs Completed (15 pts)
- Continuity of Care (20 pts)

---

### Case 2: Juan Dela Cruz — Diabetes Management
**Complexity**: ⭐⭐ Standard
**Duration**: 45-minute activity
**Roles Needed**: 5-6 participants

**Story**: Juan, 58, fisherman with known Type 2 DM. Visit for routine check. BS elevated. Labs ordered. Medication adjusted.

**Timeline**:
```
Day 1 (RHU Malay): Registration → Vitals → BS 250 mg/dL → HbA1c ordered
Day 2 (Lab): Process HbA1c → Result: 8.5%
Day 3 (RHU Malay): Review → Adjust Metformin dose → Follow-up scheduled
```

**FHIR Resources**: 8-10 resources
**Focus**: Chronic disease management, lab integration

---

### Case 3: Ana Reyes — Prenatal Care
**Complexity**: ⭐⭐⭐ Standard
**Duration**: 45-minute activity
**Roles Needed**: 5-6 participants

**Story**: Ana, 28, first pregnancy, 20 weeks. Routine prenatal visit. Referred for ultrasound. Continued care.

**Timeline**:
```
Week 20 (RHU): Registration → Prenatal visit → Fundal height → Refer for ultrasound
Week 21 (Hospital): Ultrasound → Normal anatomy scan → Continue prenatal vitamins
Week 25 (RHU): Follow-up visit → BP check → Scheduled for next trimester
```

**FHIR Resources**: 8-10 resources
**Focus**: Maternal health, imaging orders, preventive care

---

### Case 4: Miguel Santos — Child Immunization
**Complexity**: ⭐ Simple
**Duration**: 30-minute activity
**Roles Needed**: 4-5 participants

**Story**: Miguel, 2 months old. First vaccine series. BCG + Hep B birth dose. 6-week pentavalent + OPV.

**Timeline**:
```
Day 1 (RHU): Registration → BCG → Hep B birth dose
Week 6 (RHU Malay): Pentavalent #1 → OPV #1
Week 10 (RHU Kalibo): Pentavalent #2 → OPV #2
```

**FHIR Resources**: 6-8 resources
**Focus**: Pediatric care, immunization tracking, growth monitoring

---

### Case 5: Elena Torres — Emergency Referral
**Complexity**: ⭐⭐⭐⭐ Complex
**Duration**: 60-minute activity
**Roles Needed**: 8-10 participants

**Story**: Elena, 50, chest pain at RHU. Emergency referral to hospital. ECG, troponin, cardiology consult. Diagnosis: NSTEMI. Treatment and follow-up.

**Timeline**:
```
Hour 0 (RHU Malay): Registration → Triage → BP 180/110 → Chest pain → Emergency referral
Hour 1 (Hospital ER): Receive → ECG → Troponin elevated → Cardiology consult
Hour 3 (Hospital): Diagnosis: NSTEMI → ASA, Clopidogrel, Metoprolol → Admit
Hour 24 (Hospital): Stabilized → Discharge with medications
Week 1 (RHU Malay): Follow-up → BP improved → Continue meds
```

**FHIR Resources**: 15-20 resources
**Focus**: Emergency care, complex medication regimen, time-critical decisions

---

## 4. Round-by-Round Specifications

### ROUND 1: Create (Minutes 5-20)

**Objective**: Establish patient identity and initial clinical data at primary care

**Who**: RHU team participants

**Tasks by Role**:

**Registration Clerk**:
1. Open Mock EMR, select "RHU Kalibo" (or assigned clinic)
2. Search for patient by name
3. If not found, click "Register New Patient"
4. Fill out form:
   - Name (First, Middle, Last)
   - PhilHealth ID (XX-XXXXXXXXX-X format)
   - Birthdate (YYYY-MM-DD)
   - Gender
   - Address (City: Kalibo/Malay/etc)
   - Phone (+63 format)
5. Save
6. **Confirm**: Green toast "Patient registered! Visible to all clinics ✓"

**Nurse/BHW**:
1. Find patient created by Registration Clerk
2. Click "Record Vitals"
3. Enter:
   - Systolic BP: [value from case card]
   - Diastolic BP: [value from case card]
   - Heart Rate: [value]
   - Temperature: [value]
   - Respiratory Rate: [value]
4. Save each vital
5. **Confirm**: Each vital shows green checkmark

**Physician**:
1. Review patient + vitals
2. Click "Create Encounter"
3. Document:
   - Chief complaint (from case card)
   - Assessment
4. If applicable, document suspected condition
5. If applicable, create referral (ServiceRequest)
6. Save
7. **Confirm**: "Encounter created. Data synced to SHR ✓"

**Success Criteria for Round 1**:
- [ ] Patient registered with complete demographics
- [ ] 3+ vital signs recorded
- [ ] Encounter documented
- [ ] All data visible in SHR

**Facilitator Check**:
- Verify at least 1 patient per case is created
- Confirm vitals are logged
- Check that data appears in "Recent Activity" feed

---

### ROUND 2: Exchange (Minutes 20-35)

**Objective**: Demonstrate cross-facility data retrieval and continuity

**Who**: Hospital/Secondary care team participants

**Tasks by Role**:

**Receiving Physician**:
1. Select "Aklan Provincial Hospital" (or assigned)
2. Search for patient by:
   - Name (from case card), OR
   - PhilHealth ID
3. **Observe**: Search results show patient from RHU!
4. Click patient card
5. **Review**: See complete history from Round 1
   - Demographics
   - Vitals
   - Encounter
   - Referral
6. **Milestone**: "Cross-Facility Exchange Unlocked! 🥈"
7. Click "New Encounter"
8. Document hospital visit
9. Save

**Lab Technician** (if applicable):
1. From patient detail, click "Order Lab Tests"
2. Select from case card:
   - CBC (LOINC: 58410-2)
   - Creatinine (LOINC: 2160-0)
   - HbA1c (LOINC: 33717-6)
3. Save orders
4. Later (or different participant), record results:
   - Click "Enter Results"
   - Fill values from case card
   - Mark "Final"
5. Save DiagnosticReport

**Specialist** (Cardiologist, OB-GYN, etc.):
1. Review all data from RHU + Hospital + Labs
2. Click "Add Diagnosis"
3. Document confirmed condition (from case card)
   - Use SNOMED code if known
   - Or select from dropdown
4. If applicable, create MedicationRequest
5. Save

**Success Criteria for Round 2**:
- [ ] Patient found via search (created by different clinic)
- [ ] Complete history reviewed
- [ ] New encounter created at hospital
- [ ] Hospital data visible to RHU

**Facilitator Check**:
- Verify participants can see data from other clinics
- Confirm new encounters appear in patient timelines
- Watch for "Data Shared" milestone triggers

---

### ROUND 3: Continue (Minutes 35-50)

**Objective**: Complete the care continuum with pharmacy and follow-up

**Who**: Pharmacy and RHU follow-up participants

**Tasks by Role**:

**Pharmacist**:
1. Select "Aklan Provincial Pharmacy" (or assigned)
2. Search for patient
3. Review active medications
4. Click "Dispense Medication"
5. Select medication from MedicationRequest
6. Enter:
   - Quantity dispensed
   - Lot number (optional)
   - Instructions
7. Save MedicationDispense
8. **Confirm**: "Medication dispensed ✓"

**RHU Follow-up (BHW/Nurse)**:
1. Return to original RHU clinic
2. Search for patient
3. **Review**: See all data from Hospital + Pharmacy!
4. Click "Follow-up Visit"
5. Create new encounter
6. Record follow-up vitals (from case card — often improved!)
7. Document outcome
8. Save
9. **Milestone**: "Continuity of Care Champion! 🥇"

**Success Criteria for Round 3**:
- [ ] Medication dispensed (if applicable)
- [ ] Follow-up documented
- [ ] Complete timeline visible across all clinics
- [ ] Improvement documented (for chronic conditions)

**Facilitator Check**:
- Verify complete patient journeys
- Check that all milestones are being earned
- Ensure timeline shows cross-facility data

---

## 5. Scoring System

### 5.1 Milestone Points

| Milestone | Points | Badge | Trigger |
|-----------|--------|-------|---------|
| 🥉 First Patient | 10 | Bronze | Create first Patient resource |
| 🥉 Vitals Pro | 10 | Bronze | Create 3+ Observations |
| 🥉 Encounter Expert | 10 | Bronze | Create first Encounter |
| 🥈 Data Shared | 20 | Silver | Another clinic views your data |
| 🥈 Interoperability | 20 | Silver | You view data from another clinic |
| 🥈 Medication Master | 15 | Silver | Create MedicationRequest |
| 🥈 Lab Orderer | 15 | Silver | Create ServiceRequest |
| 🥇 Complete History | 20 | Gold | View patient with 5+ resources |
| 🥇 Continuity Champion | 20 | Gold | Complete full patient journey |
| ⭐ FHIR Expert | 25 | Platinum | Create 10+ valid resources |

**Maximum Score**: 165 points

### 5.2 Scoring Rules

1. **Automatic**: System detects milestones via polling
2. **Unique**: Each milestone earned once per participant
3. **Visible**: Real-time toast notification on earn
4. **Cumulative**: Total score shows in dashboard
5. **No Penalties**: Focus on learning, not perfection

### 5.3 Progress Tracking

```
Your Progress
████████░░░░ 65% (105/165 points)

🏥 Your Clinic: RHU Kalibo
🎯 Milestones: 🥉🥉🥉🥈🥈 (5/10)
📊 Resources Created: 8
🌐 Cross-Facility Exchanges: 2
```

---

## 6. Review & Debrief (Minutes 50-60)

### 6.1 Group Timeline Review (5 min)

**Facilitator Action**:
1. Project technical dashboard on screen
2. Show live patient timelines
3. Highlight cross-facility exchanges
4. Point out: "See how data from RHU appears at Hospital"

**Discussion Questions**:
- What surprised you about the data exchange?
- How did it feel to see data from another clinic?
- What would have been different without the SHR?

### 6.2 Individual Export (3 min)

**Each Participant**:
1. Navigate to "My Activity"
2. Click "Export Report"
3. Choose format:
   - **PNG**: Screenshot of timeline
   - **PDF**: Detailed report with all resources
   - **JSON**: Raw FHIR Bundle
4. Save or share

**Export Contents**:
- Participant name/clinic/role
- List of resources created
- Milestones earned
- Timeline visualization
- Total score

### 6.3 Facilitator Wrap-up (2 min)

**Key Messages**:
1. **Interoperability is real**: You just did it!
2. **FHIR enables this**: Standardized data format
3. **OpenHIE scales this**: Architecture for national health exchange
4. **Patients benefit**: Continuity, safety, better outcomes
5. **You can build this**: Skills to implement in your context

**Closing Activity**:
- Quick poll: "How confident are you explaining FHIR to a colleague?" (1-5)
- Open floor: Questions, insights, next steps

---

## 7. Role Cards (Templates)

### Card Template

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🏥 CLINIC: [Name]                            │
│   🎨 COLOR: [Color swatch]                      │
│                                                 │
│   ┌───────────────────────────────────────┐   │
│   │                                       │   │
│   │   👤 [Role Icon]                      │   │
│   │                                       │   │
│   │   [ROLE NAME]                         │   │
│   │                                       │   │
│   └───────────────────────────────────────┘   │
│                                                 │
│   📋 YOUR TASKS:                               │
│                                                 │
│   1. [Task 1]                                  │
│   2. [Task 2]                                  │
│   3. [Task 3]                                  │
│                                                 │
│   🎯 SUCCESS:                                  │
│   • [Success criteria 1]                       │
│   • [Success criteria 2]                       │
│                                                 │
│   ⏱️ TIME: [X] minutes                         │
│                                                 │
│   💡 TIP: [Helpful hint]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Example: Registration Clerk Card

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🏥 CLINIC: RHU Kalibo                        │
│   🎨 COLOR: Emerald Green                       │
│                                                 │
│   ┌───────────────────────────────────────┐   │
│   │              📝                       │   │
│   │      REGISTRATION                     │   │
│   │         CLERK                         │   │
│   └───────────────────────────────────────┘   │
│                                                 │
│   📋 YOUR TASKS:                               │
│                                                 │
│   1. Search for patient by name                 │
│   2. If not found, click "Register New"        │
│   3. Fill in all fields (use case card)        │
│   4. Save and wait for green ✓                 │
│                                                 │
│   🎯 SUCCESS:                                  │
│   • Patient appears in SHR                     │
│   • Other clinics can search them              │
│   • You earn "First Patient" milestone         │
│                                                 │
│   ⏱️ TIME: 5 minutes                          │
│                                                 │
│   💡 TIP: PhilHealth ID format: XX-XXXXXXXXX-X │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Example: Hospital Physician Card

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🏥 CLINIC: Aklan Provincial Hospital         │
│   🎨 COLOR: Blue                               │
│                                                 │
│   ┌───────────────────────────────────────┐   │
│   │              👨‍⚕️                     │   │
│   │      RECEIVING/                     │   │
│   │    SPECIALIST PHYSICIAN             │   │
│   └───────────────────────────────────────┘   │
│                                                 │
│   📋 YOUR TASKS:                               │
│                                                 │
│   1. Search for patient from RHU               │
│   2. Review complete history (wow!)              │
│   3. Create hospital encounter                 │
│   4. Document diagnosis/treatment              │
│                                                 │
│   🎯 SUCCESS:                                  │
│   • Found patient from different clinic        │
│   • Viewed their data (Interoperability!)      │
│   • Added to their record                      │
│                                                 │
│   ⏱️ TIME: 10 minutes                         │
│                                                 │
│   💡 TIP: Look for the RHU data in timeline  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 8. Case Cards (Templates)

### Case Card: Maria Santos

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   CASE #1: HYPERTENSION JOURNEY                │
│   Patient: Maria Santos                         │
│   Complexity: ⭐⭐⭐                             │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   👤 PATIENT INFO:                             │
│   Name: Maria Cruz Santos                        │
│   Age: 45                                        │
│   Gender: Female                                 │
│   PhilHealth: 12-123456789-0                   │
│   Address: 123 Rizal St, Kalibo, Aklan         │
│   Phone: +63-912-345-6789                      │
│                                                 │
│   📅 TIMELINE:                                  │
│                                                 │
│   Day 1 (RHU):                                 │
│   • Chief Complaint: Headache, dizziness      │
│   • BP: 150/95 (Elevated)                       │
│   • HR: 88, Temp: 37.2°C, RR: 20               │
│   • Assessment: Suspected HTN                  │
│   • Action: Refer to hospital                   │
│                                                 │
│   Day 3 (Hospital):                            │
│   • BP: 160/100 (Higher!)                       │
│   • Labs: CBC normal, Creatinine 1.1           │
│   • Diagnosis: Stage 2 Hypertension           │
│   • Treatment: Amlodipine 5mg daily            │
│                                                 │
│   Day 3 (Pharmacy):                            │
│   • Dispense: Amlodipine 30 tablets            │
│                                                 │
│   Day 30 (RHU Follow-up):                      │
│   • BP: 135/85 (IMPROVED!)                      │
│   • Continue medication                         │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   💊 MEDICATION DETAILS:                       │
│   Name: Amlodipine                              │
│   Dose: 5mg                                     │
│   Route: Oral                                   │
│   Frequency: Once daily                         │
│   Duration: 30 days                             │
│   RxNorm Code: 1790983                          │
│                                                 │
│   🔬 LAB DETAILS:                              │
│   • CBC (LOINC: 58410-2)                       │
│   • Creatinine (LOINC: 2160-0)                 │
│   • Electrolytes panel (LOINC: 24326-1)        │
│                                                 │
│   🏥 CONDITION CODES:                          │
│   SNOMED: 38341003 (Hypertension)              │
│   ICD-10: I10 (Essential HTN)                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 9. Troubleshooting Guide

### Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Can't find patient** | Search returns empty | Check spelling. Try searching by PhilHealth ID instead of name. Ensure patient was actually created in Round 1. |
| **Data not syncing** | Other clinics don't see your data | Wait 3-5 seconds. Pull to refresh. Check Technical Dashboard for API errors. Verify you're using the same SHR (cdr.fhirlab.net). |
| **Vitals not saving** | Error message | Check numeric format (no text). Ensure all required fields filled. BP needs both systolic AND diastolic. |
| **Form won't submit** | Button disabled or error | Scroll up to see validation errors. Red fields need correction. Required fields marked with *. |
| **App loading slowly** | White screen > 5 seconds | Check internet connection. Try refreshing. Use mobile data if WiFi is slow. |
| **Milestone not earned** | Should have triggered | Milestones check every 3 seconds. Wait a moment. Ensure action actually completed (check API log). |
| **Can't see other clinic** | Only your data visible | Verify other participants actually created data. Check Technical Dashboard for recent activity. Different patient? |

### Facilitator Interventions

**Scenario 1: Technical Issues**
- Have backup: Pre-created patient data in SHR
- Participants can practice searching/retrieving existing data
- Or: Switch to offline mode (demo mode with local JSON)

**Scenario 2: Participant Confusion**
- Use "pairing": Pair confused participant with experienced one
- Provide simplified "cheat sheet" with step-by-step
- Facilitator can demonstrate on projection screen

**Scenario 3: Running Behind Schedule**
- Skip Round 3 (Pharmacy)
- Focus on Round 2 (Exchange) — that's the core learning
- Abbreviate Review to 5 minutes

**Scenario 4: Running Ahead of Schedule**
- Add "Bonus Challenge": Create additional resources
- Allow participants to view Technical Dashboard in detail
- Have participants explain their work to the group

---

## 10. Post-Activity Materials

### 10.1 Participant Export

**PDF Report Template**:
```
═══════════════════════════════════════════════════════
  OPENHIE MOCK EMR - ACTIVITY REPORT
  FHIR Fundamentals 2026 - Aklan
═══════════════════════════════════════════════════════

Participant: [Name]
Clinic: [Clinic Name]
Role: [Role]
Date: [Date]

───────────────────────────────────────────────────────
YOUR CONTRIBUTIONS
───────────────────────────────────────────────────────

Resources Created: [X]
├─ Patients: [X]
├─ Encounters: [X]
├─ Observations: [X]
├─ Conditions: [X]
├─ MedicationRequests: [X]
└─ [Other resources]

Cross-Facility Exchanges: [X]
• Data shared with: [Clinic A], [Clinic B]
• Data received from: [Clinic C]

───────────────────────────────────────────────────────
MILESTONES EARNED
───────────────────────────────────────────────────────

🥉 First Patient (10 pts)
🥉 Vitals Pro (10 pts)
🥈 Data Shared (20 pts)
🥇 Continuity Champion (20 pts)
...

TOTAL SCORE: [X] / 165 points

───────────────────────────────────────────────────────
PATIENT TIMELINE
───────────────────────────────────────────────────────

[Timeline visualization]

───────────────────────────────────────────────────────

Generated by OpenHIE Mock EHR
FHIR Server: cdr.fhirlab.net
Terminology: tx.fhirlab.net

═══════════════════════════════════════════════════════
```

### 10.2 Facilitator Summary

**Metrics to Capture**:
- Total participants: __
- Total resources created: __
- Cross-facility exchanges: __
- Average completion time: __
- Most common milestone: __
- Technical issues encountered: __

**Participant Feedback** (Quick Survey):
1. How would you rate the activity? (1-5)
2. What was the most valuable part?
3. What was confusing?
4. How confident are you explaining FHIR? (1-5, before vs after)
5. Would you recommend this to colleagues?

---

## 11. Success Metrics

### 11.1 Learning Outcomes

| Objective | Metric | Target |
|-----------|--------|--------|
| Create FHIR resources | Resources created per participant | ≥ 5 |
| Search & retrieve | Successful cross-facility searches | 100% |
| Demonstrate exchange | Cross-facility data views | ≥ 2 per participant |
| Explain OpenHIE | Self-reported confidence | ≥ 4/5 |
| Troubleshoot | Issues resolved without facilitator | ≥ 80% |

### 11.2 Engagement Metrics

| Metric | Target |
|--------|--------|
| Completion rate | 100% of participants complete Round 2 |
| Milestone engagement | Average 5+ milestones earned |
| Time on task | 45-60 minutes (not rushed, not bored) |
| Technical issues | < 10% of participants affected |
| Export rate | > 80% export their report |

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-03  
**Status**: Draft for Review

**Questions for Review**:
1. Is 60 minutes the right duration?
2. Are 5 patient cases too many? Should we standardize on 1-2?
3. Is the scoring system motivating or distracting?
4. Should we add competitive elements (leaderboard)?
5. Any missing role types?
6. Should we provide paper backup of case cards?
