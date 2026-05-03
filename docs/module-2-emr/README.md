# Module 2: EMR-Level FHIR Implementation

## Overview

This module demonstrates how FHIR resources appear in Electronic Medical Record (EMR) systems. Understanding this helps stakeholders see the connection between clinical workflows and FHIR data structures.

## The EMR Perspective

When a clinician uses an EMR, they interact with:
- Patient registration forms
- Visit/encounter records
- Clinical notes and observations
- Prescription orders
- Laboratory results

**Behind the scenes**, these are all represented as FHIR resources!

## EMR Screen → FHIR Resource Mapping

### 1. Patient Registration Screen

**EMR Display:**
```
┌─────────────────────────────────────────┐
│  PATIENT REGISTRATION                   │
├─────────────────────────────────────────┤
│  Name: Maria Cruz Santos               │
│  Birth Date: March 15, 1985            │
│  Gender: Female                        │
│  Address: 123 Rizal St, Kalibo, Aklan  │
│  Contact: +63-912-345-6789              │
│  PhilHealth: 12-123456789-0             │
└─────────────────────────────────────────┘
```

**FHIR Representation:**
→ See `examples/patients/patient-example-001.json`

### 2. Clinical Encounter/Visit

**EMR Display:**
```
┌─────────────────────────────────────────┐
│  ENCOUNTER RECORD                       │
├─────────────────────────────────────────┤
│  Date: January 15, 2026                │
│  Type: Outpatient Visit                │
│  Location: AKLAN PROVINCIAL HOSPITAL   │
│  Department: OPD                        │
│  Doctor: Dr. Jose Reyes                │
│  Duration: 1 hour                      │
│  Status: Completed                     │
└─────────────────────────────────────────┘
```

**FHIR Representation:**
→ See `examples/encounters/encounter-example-001.json`

### 3. Vital Signs Observation

**EMR Display:**
```
┌─────────────────────────────────────────┐
│  VITAL SIGNS                            │
├─────────────────────────────────────────┤
│  Date: January 15, 2026, 08:45 AM      │
│                                         │
│  Blood Pressure: 120/80 mmHg           │
│  Heart Rate: 72 bpm                     │
│  Temperature: 37.0 °C                   │
│  Respiratory Rate: 18 /min             │
│  Weight: 58 kg                         │
│  Height: 162 cm                        │
│  BMI: 22.1 kg/m²                       │
│  Recorded by: Nurse Jane Doe           │
└─────────────────────────────────────────┘
```

**FHIR Representation:**
→ See `examples/observations/observation-vitals-001.json`

## Interactive Activity: EMR Simulation

### Exercise: Map EMR Data to FHIR

**Scenario**: A patient visits AKLAN PROVINCIAL HOSPITAL OPD.

**EMR Data Captured:**
- Patient: Juan dela Cruz, Male, DOB: 1990-07-20
- Visit: January 20, 2026, Check-up
- Vitals: BP 130/85, HR 78, Temp 36.8°C
- Diagnosis: Hypertension
- Medication: Amlodipine 5mg daily

**Your Task**:
1. Identify which FHIR resources are needed
2. Map the data to appropriate resource fields
3. Create JSON representations

**Resources to Use:**
- Patient
- Encounter
- Observation (Vitals)
- Condition (Diagnosis)
- MedicationRequest (Prescription)

### Discussion Points

1. **How does FHIR improve data sharing?**
   - Standardized format across all EMR systems
   - No need for custom interfaces between systems
   - Preserves semantic meaning of data

2. **What challenges exist?**
   - EMR vendors must implement FHIR support
   - Data mapping from legacy formats
   - Training staff on new workflows

## Philippines Context

### PH Core FHIR Profiles

The Philippines has its own FHIR Implementation Guide (IG) called **PH Core** that:
- Extends base FHIR resources
- Adds Philippine-specific requirements
- Defines local coding systems

Example: Patient identifier includes:
- PhilHealth ID
- National Patient Index (if available)

### eReferral Use Case

The Philippine eReferral system uses FHIR to:
1. Create referral documents
2. Share patient summaries between facilities
3. Track referral status
4. Enable continuity of care

## Next Steps

Proceed to [Module 3: API Level](../module-3-api/) to learn how developers interact with these resources programmatically.

---

**Hands-on Exercise**: Create a complete patient record with encounter and observation using the templates in `/examples/`.
