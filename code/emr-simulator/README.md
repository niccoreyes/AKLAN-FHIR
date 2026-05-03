# EMR Simulator

This directory contains a simple EMR (Electronic Medical Record) simulator that demonstrates how FHIR resources represent clinical data.

## Concept

The simulator shows:
- How an EMR interface collects data
- How that data maps to FHIR resources
- The bidirectional transformation between UI and FHIR

## Usage

[EMR simulator implementation will be added based on workshop needs]

## Purpose

This helps stakeholders understand:
1. FHIR is not just for developers - it represents real clinical workflows
2. Data entered in EMR screens becomes FHIR resources
3. FHIR enables data sharing between different EMR systems
4. Interoperability happens at the data level, not the UI level

## Example Workflow

```
┌─────────────────────┐
│   EMR UI Screen     │
│  (Patient Form)     │
├─────────────────────┤
│ Name: Maria Santos  │
│ DOB: 1985-03-15     │
│ Gender: Female      │
│ [Save Button]       │
└─────────┬───────────┘
          │
          ▼ Converts to
┌─────────────────────┐
│   FHIR Resource     │
│   (JSON format)     │
├─────────────────────┤
│ {                   │
│   "resourceType":   │
│    "Patient",       │
│   "name": [...],    │
│   "birthDate":      │
│    "1985-03-15"     │
│ }                   │
└─────────┬───────────┘
          │
          ▼ Sent via
┌─────────────────────┐
│   FHIR REST API     │
│   POST /Patient     │
└─────────────────────┘
```

## For Instructors

The simulator can be used to:
- Show real-time FHIR resource generation
- Demonstrate clinical data entry
- Explain the connection between workflows and standards
- Validate understanding of resource structures
