# Module 1: Introduction to FHIR

## Overview

Welcome to FHIR Fundamentals 2026! This module introduces the foundational concepts of FHIR (Fast Healthcare Interoperability Resources).

## What is FHIR?

FHIR (pronounced "fire") is a standard for exchanging healthcare information electronically. It was developed by HL7 International and has been widely adopted globally, including in the Philippines.

### Key Benefits

- **Interoperability**: Enables different healthcare systems to communicate
- **Modern Technology**: Uses RESTful APIs and JSON/XML formats
- **Modular**: Resources can be used independently or combined
- **Flexible**: Adaptable to various healthcare settings

## FHIR Resources

FHIR defines various "resources" - modular components that represent different aspects of healthcare:

| Resource | Description | Use Case |
|----------|-------------|----------|
| Patient | Demographics and personal info | Patient registration |
| Encounter | Visits and appointments | Clinic visits |
| Observation | Clinical measurements | Vital signs, lab results |
| Condition | Diagnoses and problems | Medical history |
| MedicationRequest | Prescriptions | Drug orders |
| Practitioner | Healthcare providers | Doctor information |
| Organization | Healthcare facilities | Hospital/clinic info |

## Resource Structure

Every FHIR resource has:

```
{
  "resourceType": "ResourceName",  // Type of resource
  "id": "unique-id",             // Unique identifier
  "meta": { ... },                // Metadata (version, last updated)
  ...                              // Resource-specific data
}
```

## Workshop Flow

```
Module 1: Introduction → Module 2: EMR Level → Module 3: API Level
      ↓                       ↓                     ↓
  Learn basics          See FHIR in EMR        Use FHIR APIs
```

## Next Steps

Proceed to [Module 2: EMR Level Implementation](../module-2-emr/) to see how these resources appear in an actual EMR system.

---

**Activity**: Review the Patient example in `examples/patients/patient-example-001.json` and identify:
1. Patient identifiers (PhilHealth ID)
2. Demographics (name, birthdate, gender)
3. Contact information
4. Address details
