# Exercise 3: Integration Challenge - Complete Workflow

## Objective

Build a complete end-to-end workflow that demonstrates real-world FHIR interoperability - creating a patient record, encounter, observations, and retrieving the complete medical summary.

## Scenario

You are a developer working on a healthcare information exchange system for AKLAN PROVINCIAL HOSPITAL. A new patient, **Elena Torres**, arrives at the Emergency Department with chest pain. Your task is to:

1. Register the patient in the FHIR system
2. Create an emergency encounter
3. Record vital signs and initial assessment
4. Document the chief complaint
5. Retrieve the complete patient summary

## Patient Information

**Demographics:**
- Name: Elena Torres
- Birth Date: March 10, 1975 (age 50)
- Gender: Female
- PhilHealth ID: 11-111111111-1
- Contact: +63-918-555-1234
- Address: 789 Quezon Avenue, Kalibo, Aklan, 5600
- Emergency Contact: Husband - Antonio Torres, +63-918-555-5678

**Visit Information:**
- Arrival: January 20, 2026, 14:30 (2:30 PM)
- Department: Emergency Department
- Chief Complaint: Chest pain
- Status: In progress
- Attending: Dr. Carlos Mendoza (Emergency Physician)

**Initial Vitals (14:35):**
- Blood Pressure: 160/95 mmHg
- Heart Rate: 98 bpm
- Respiratory Rate: 22 /min
- Temperature: 37.2°C
- Oxygen Saturation: 96%
- Pain Level: 7/10

## Part 1: Patient Registration

### Task
Create a complete Patient resource for Elena Torres.

### Requirements
1. ✅ All required demographic fields
2. ✅ PhilHealth identifier
3. ✅ Complete address with PH country code
4. ✅ Phone contact
5. ✅ Emergency contact information

### Your JSON
Create file: `challenge-patient.json`

<details>
<summary>Hint: Emergency Contact Structure</summary>

```json
"contact": [
  {
    "relationship": [
      {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
            "code": "C",
            "display": "Emergency Contact"
          }
        ]
      }
    ],
    "name": {
      "family": "Torres",
      "given": ["Antonio"]
    },
    "telecom": [
      {
        "system": "phone",
        "value": "+63-918-555-5678"
      }
    ]
  }
]
```

</details>

## Part 2: Emergency Encounter

### Task
Create an Emergency Encounter resource.

### Requirements
1. ✅ Status: `in-progress`
2. ✅ Class: `EMER` (emergency)
3. ✅ Type: Emergency department visit (SNOMED code: 4525004)
4. ✅ Subject reference to your patient
5. ✅ Start time: 2026-01-20T14:30:00Z
6. ✅ Participant: Dr. Carlos Mendoza
7. ✅ Location: AKLAN PROVINCIAL HOSPITAL - Emergency Department

### Your JSON
Create file: `challenge-encounter.json`

<details>
<summary>Hint: Emergency Class</summary>

```json
"class": {
  "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
  "code": "EMER",
  "display": "emergency"
}
```

</details>

## Part 3: Vital Signs Bundle

### Task
Create multiple Observation resources for all vital signs.

### Required Observations
1. Blood Pressure (LOINC: 85354-9)
2. Heart Rate (LOINC: 8867-4)
3. Respiratory Rate (LOINC: 9279-1)
4. Body Temperature (LOINC: 8310-5)
5. Oxygen Saturation (LOINC: 2708-6)
6. Pain Level (LOINC: 72514-3)

### Your JSON Files
Create separate files or a Bundle:
- `challenge-observation-bp.json`
- `challenge-observation-hr.json`
- `challenge-observation-rr.json`
- `challenge-observation-temp.json`
- `challenge-observation-o2.json`
- `challenge-observation-pain.json`

### Blood Pressure Structure Reminder

```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "85354-9",
        "display": "Blood pressure panel"
      }
    ]
  },
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8480-6",
            "display": "Systolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 160,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8462-4",
            "display": "Diastolic blood pressure"
          }
        ]
      },
      "valueQuantity": {
        "value": 95,
        "unit": "mmHg",
        "system": "http://unitsofmeasure.org",
        "code": "mm[Hg]"
      }
    }
  ]
}
```

## Part 4: Chief Complaint

### Task
Create an Observation for the chief complaint (chest pain).

### Requirements
1. ✅ Category: `survey` or `exam`
2. ✅ Code: Chief complaint (SNOMED: 215724002 or just text)
3. ✅ Value as string: "Chest pain"
4. ✅ Effective datetime: Time of assessment

### Your JSON
Create file: `challenge-complaint.json`

<details>
<summary>Hint: String Value</summary>

```json
"valueString": "Chest pain"
```

Or use coded value:

```json
"valueCodeableConcept": {
  "coding": [
    {
      "system": "http://snomed.info/sct",
      "code": "29857009",
      "display": "Chest pain"
    }
  ]
}
```

</details>

## Part 5: Complete Bundle

### Task
Create a FHIR Bundle that contains all resources together.

### Bundle Structure

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-001",
      "resource": {
        "resourceType": "Patient",
        ...
      },
      "request": {
        "method": "POST",
        "url": "Patient"
      }
    },
    {
      "fullUrl": "urn:uuid:encounter-001",
      "resource": {
        "resourceType": "Encounter",
        ...
      },
      "request": {
        "method": "POST",
        "url": "Encounter"
      }
    },
    ...
  ]
}
```

### Reference Resources by fullUrl

Instead of referencing by ID, use the UUID assigned in the bundle:

```json
"subject": {
  "reference": "urn:uuid:patient-001"
}
```

## Part 6: API Integration (Bonus)

### Task
Write a simple script to submit your Bundle to a FHIR server.

### Python Example Template

```python
import requests
import json

BASE_URL = "https://hapi.fhir.org/baseR4"

# Load your bundle
with open('challenge-complete-bundle.json', 'r') as f:
    bundle = json.load(f)

# Submit to FHIR server
response = requests.post(
    f"{BASE_URL}/",
    json=bundle,
    headers={"Content-Type": "application/fhir+json"}
)

if response.status_code == 200:
    result = response.json()
    print("Transaction successful!")
    print(f"Created {len(result['entry'])} resources")
    
    # Print created resource IDs
    for entry in result['entry']:
        if 'response' in entry:
            print(f"  {entry['response']['location']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
```

## Part 7: Data Retrieval

### Task
Construct queries to retrieve the complete patient information.

### Queries to Create

1. **Get Patient by PhilHealth ID**
   ```
   GET /Patient?identifier=http://philhealth.gov.ph/member-id|11-111111111-1
   ```

2. **Get All Encounters for Patient**
   ```
   GET /Encounter?patient=[patient-id]&_include=Encounter:patient
   ```

3. **Get Recent Observations**
   ```
   GET /Observation?patient=[patient-id]&date:ge=2026-01-20&_sort=-date
   ```

4. **Get Vital Signs Only**
   ```
   GET /Observation?patient=[patient-id]&category=vital-signs&_sort=-date
   ```

5. **Get Complete Summary**
   ```
   GET /Patient/[id]?_revinclude=Encounter:patient&_revinclude=Observation:patient
   ```

## Evaluation Criteria

Your submission will be evaluated on:

| Criteria | Points | Description |
|----------|--------|-------------|
| **Completeness** | 30 | All required resources created |
| **Correctness** | 30 | Valid FHIR R4 format, proper references |
| **Data Quality** | 20 | Accurate medical data representation |
| **Best Practices** | 10 | Proper coding, identifiers, structure |
| **Documentation** | 10 | Clear comments or README |

## Submission

Submit the following files:

1. `challenge-patient.json`
2. `challenge-encounter.json`
3. `challenge-observation-*.json` (6 files)
4. `challenge-complaint.json`
5. `challenge-complete-bundle.json` (optional but recommended)
6. `QUERIES.md` - Document your search queries
7. `REFLECTION.md` - Brief reflection (200 words) on:
   - What you learned about FHIR interoperability
   - Challenges you faced
   - How this applies to Philippine healthcare

## Bonus Challenges

### Level 1: Add Diagnosis
Create a `Condition` resource for a suspected diagnosis (e.g., Hypertension, Unstable Angina)

### Level 2: Add Medication
Create a `MedicationRequest` for immediate treatment (e.g., Nitroglycerin)

### Level 3: Add Diagnostic Order
Create a `ServiceRequest` for lab tests (e.g., Troponin, ECG)

### Level 4: Build API Client
Create a working API client in Python or JavaScript that:
- Creates all resources via API
- Retrieves and displays the complete record
- Exports to a summary document

## Resources and References

- [FHIR Bundle](https://hl7.org/fhir/R4/bundle.html)
- [FHIR Transaction](https://hl7.org/fhir/R4/http.html#transaction)
- [LOINC Codes](https://loinc.org/)
- [SNOMED CT Browser](https://browser.ihtsdotools.org/)

## Tips for Success

1. **Validate your JSON** - Use a JSON validator
2. **Check FHIR profiles** - Ensure required fields are present
3. **Test references** - Make sure all references are correct
4. **Use consistent timestamps** - Keep times realistic and ordered
5. **Document your work** - Add comments or a README

## Sample Success Criteria

When complete, you should be able to:
- ✅ Create a valid Patient, Encounter, and multiple Observations
- ✅ Link all resources with proper references
- ✅ Submit as a transaction Bundle
- ✅ Query and retrieve the complete patient story
- ✅ Explain how this enables interoperability

---

**Good luck!** This challenge represents a real-world scenario that demonstrates the power of FHIR for healthcare information exchange in the Philippines.
