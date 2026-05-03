# Exercise 1: Creating FHIR Resources

## Objective

Learn how to create and validate basic FHIR resources (Patient, Encounter, Observation).

## Prerequisites

- Basic understanding of JSON
- Text editor or IDE
- Access to a FHIR validation tool (optional)

## Part 1: Create a Patient Resource

### Instructions

Create a new Patient resource for the following scenario:

**Patient Information:**
- Name: Juan Dela Cruz
- Date of Birth: July 20, 1990
- Gender: Male
- PhilHealth ID: 09-876543210-1
- Address: 456 Mabini Street, Malay, Aklan, 5608
- Contact: +63-917-123-4567

### Requirements

Your Patient resource must include:
1. ✅ Required fields: `resourceType`, `id`, `name`, `gender`, `birthDate`
2. ✅ At least one identifier (PhilHealth ID)
3. ✅ Complete address with city, state, postal code, and country (PH)
4. ✅ At least one telecom (phone or email)

### Template

```json
{
  "resourceType": "Patient",
  "id": "exercise-patient-001",
  "identifier": [
    {
      "system": "http://philhealth.gov.ph/member-id",
      "value": "YOUR_PHILHEALTH_ID"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "FAMILY_NAME",
      "given": ["GIVEN_NAME"]
    }
  ],
  "gender": "GENDER",
  "birthDate": "YYYY-MM-DD",
  "address": [
    {
      "text": "FULL_ADDRESS",
      "city": "CITY",
      "state": "REGION",
      "postalCode": "POSTAL_CODE",
      "country": "PH"
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "PHONE_NUMBER",
      "use": "mobile"
    }
  ]
}
```

### Validation

Save your file as `exercise-1-patient.json` and verify:
- Valid JSON syntax
- All required fields present
- Date format is YYYY-MM-DD
- Gender is a valid FHIR value

## Part 2: Create an Encounter Resource

### Instructions

Create an Encounter resource representing Juan Dela Cruz's visit to AKLAN PROVINCIAL HOSPITAL:

**Visit Details:**
- Date: January 20, 2026
- Type: Outpatient consultation
- Department: Internal Medicine
- Doctor: Dr. Elena Rodriguez
- Status: Completed
- Duration: 30 minutes

### Requirements

Your Encounter resource must include:
1. ✅ `resourceType`, `id`, `status`
2. ✅ Reference to the patient (use `Patient/exercise-patient-001`)
3. ✅ Class (AMB for ambulatory/outpatient)
4. ✅ Type of encounter
5. ✅ Period with start and end times
6. ✅ Location reference

### Template

```json
{
  "resourceType": "Encounter",
  "id": "exercise-encounter-001",
  "status": "STATUS",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/exercise-patient-001"
  },
  "participant": [
    {
      "type": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
              "code": "ATND"
            }
          ]
        }
      ],
      "individual": {
        "display": "DOCTOR_NAME"
      }
    }
  ],
  "period": {
    "start": "2026-01-20T09:00:00Z",
    "end": "2026-01-20T09:30:00Z"
  },
  "location": [
    {
      "location": {
        "display": "HOSPITAL_NAME - DEPARTMENT"
      }
    }
  ]
}
```

## Part 3: Create an Observation Resource

### Instructions

Create an Observation resource for vital signs recorded during the encounter:

**Vitals:**
- Temperature: 36.8°C
- Blood Pressure: 130/85 mmHg
- Recorded at: January 20, 2026, 09:15 AM

### Requirements

Your Observation must include:
1. ✅ `resourceType`, `id`, `status` (final)
2. ✅ Category (vital-signs)
3. ✅ Code (LOINC code for the observation type)
4. ✅ Subject reference
5. ✅ Effective date/time
6. ✅ Value with quantity

### Template for Temperature

```json
{
  "resourceType": "Observation",
  "id": "exercise-temp-001",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs",
          "display": "Vital Signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "8310-5",
        "display": "Body temperature"
      }
    ]
  },
  "subject": {
    "reference": "Patient/exercise-patient-001"
  },
  "encounter": {
    "reference": "Encounter/exercise-encounter-001"
  },
  "effectiveDateTime": "2026-01-20T09:15:00Z",
  "valueQuantity": {
    "value": 36.8,
    "unit": "Cel",
    "system": "http://unitsofmeasure.org",
    "code": "Cel"
  }
}
```

## Submission Checklist

- [ ] Patient resource created and validated
- [ ] Encounter resource created with proper references
- [ ] Observation resource(s) created
- [ ] All JSON files are syntactically valid
- [ ] Files follow FHIR R4 specification

## Bonus Challenge

Create additional resources:
1. A `Condition` resource for a diagnosis (e.g., Hypertension)
2. A `MedicationRequest` resource for a prescription
3. Link all resources together using references

## References

- [FHIR Patient Resource](https://hl7.org/fhir/R4/patient.html)
- [FHIR Encounter Resource](https://hl7.org/fhir/R4/encounter.html)
- [FHIR Observation Resource](https://hl7.org/fhir/R4/observation.html)
- [LOINC Codes](https://loinc.org/)

---

**Instructor Note**: Have participants share their JSON files for peer review and validation discussion.
