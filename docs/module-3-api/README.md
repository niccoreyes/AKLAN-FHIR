# Module 3: Developer API Level

## Overview

This module introduces the FHIR REST API - how developers interact with FHIR resources programmatically to build interoperable healthcare applications.

## FHIR REST API Fundamentals

FHIR uses standard HTTP methods for CRUD operations:

| Operation | HTTP Method | Description | Example |
|-----------|-------------|-------------|---------|
| Create | POST | Create new resource | `POST /Patient` |
| Read | GET | Retrieve specific resource | `GET /Patient/123` |
| Update | PUT | Replace entire resource | `PUT /Patient/123` |
| Patch | PATCH | Partial update | `PATCH /Patient/123` |
| Delete | DELETE | Remove resource | `DELETE /Patient/123` |
| Search | GET | Query resources | `GET /Patient?name=smith` |

## API Base URL Structure

```
https://[server-base]/fhir/[version]/[resource-type]/[id]
```

Example:
```
https://hapi.fhir.org/baseR4/Patient/example-patient-001
```

## Interactive API Examples

### 1. Create a Patient (POST)

**Request:**
```bash
curl -X POST https://hapi.fhir.org/baseR4/Patient \
  -H "Content-Type: application/fhir+json" \
  -d @examples/patients/patient-example-001.json
```

**Response (201 Created):**
```json
{
  "resourceType": "Patient",
  "id": "12345",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-01-15T10:00:00Z"
  },
  ...
}
```

### 2. Read a Patient (GET)

**Request:**
```bash
curl https://hapi.fhir.org/baseR4/Patient/12345 \
  -H "Accept: application/fhir+json"
```

**Response (200 OK):**
```json
{
  "resourceType": "Patient",
  "id": "12345",
  ...
}
```

### 3. Search Patients (GET with Parameters)

**Request:**
```bash
# Search by name
curl "https://hapi.fhir.org/baseR4/Patient?name=Santos" \
  -H "Accept: application/fhir+json"

# Search by birthdate
curl "https://hapi.fhir.org/baseR4/Patient?birthdate=1985-03-15" \
  -H "Accept: application/fhir+json"

# Combined search
curl "https://hapi.fhir.org/baseR4/Patient?name=Santos&gender=female" \
  -H "Accept: application/fhir+json"
```

**Response (Bundle):**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 5,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        ...
      }
    }
  ]
}
```

## Search Parameters

Common search parameters by resource type:

### Patient
- `name` - Patient name (partial match)
- `birthdate` - Date of birth (YYYY-MM-DD)
- `gender` - male | female | other | unknown
- `identifier` - Patient identifier (e.g., PhilHealth ID)
- `address-city` - City from address

### Encounter
- `patient` - Reference to patient
- `date` - Encounter date/time
- `status` - planned | arrived | in-progress | finished
- `location` - Location of encounter

### Observation
- `patient` - Reference to patient
- `code` - Type of observation (LOINC code)
- `date` - Observation date/time
- `value-quantity` - Numeric value range

## Code Examples

### Python (using requests library)

```python
import requests
import json

# FHIR Server URL
BASE_URL = "https://hapi.fhir.org/baseR4"

# Create a patient
patient_data = {
    "resourceType": "Patient",
    "name": [{"family": "Dela Cruz", "given": ["Juan"]}],
    "gender": "male",
    "birthDate": "1990-07-20"
}

response = requests.post(
    f"{BASE_URL}/Patient",
    json=patient_data,
    headers={"Content-Type": "application/fhir+json"}
)

if response.status_code == 201:
    created_patient = response.json()
    print(f"Patient created with ID: {created_patient['id']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)

# Search for patients
search_response = requests.get(
    f"{BASE_URL}/Patient",
    params={"name": "Dela Cruz"},
    headers={"Accept": "application/fhir+json"}
)

bundle = search_response.json()
print(f"Found {bundle['total']} patients")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'https://hapi.fhir.org/baseR4';

// Create a patient
async function createPatient() {
  const patientData = {
    resourceType: 'Patient',
    name: [{ family: 'Dela Cruz', given: ['Juan'] }],
    gender: 'male',
    birthDate: '1990-07-20'
  };

  try {
    const response = await axios.post(`${BASE_URL}/Patient`, patientData, {
      headers: { 'Content-Type': 'application/fhir+json' }
    });
    console.log('Patient created:', response.data.id);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Search patients
async function searchPatients(name) {
  try {
    const response = await axios.get(`${BASE_URL}/Patient`, {
      params: { name: name },
      headers: { 'Accept': 'application/fhir+json' }
    });
    console.log(`Found ${response.data.total} patients`);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Authentication & Authorization (SMART on FHIR)

Production FHIR servers require authentication:

### OAuth2 Flow
```
1. App requests authorization → Authorization Server
2. User authenticates and authorizes
3. Authorization code returned
4. App exchanges code for access token
5. App uses token in API requests
```

### Example: Using Access Token
```bash
curl https://[fhir-server]/Patient/123 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbG..." \
  -H "Accept: application/fhir+json"
```

## Hands-on Exercises

### Exercise 1: Basic API Calls
1. Read the example patient: `GET /Patient/example-patient-001`
2. Search for all female patients
3. Create a new encounter for a patient

### Exercise 2: Search Operations
1. Find all encounters at AKLAN PROVINCIAL HOSPITAL
2. Search for patients born in 1985
3. Find observations with blood pressure readings

### Exercise 3: Integration Challenge
Build a simple script that:
1. Creates a patient
2. Creates an encounter for that patient
3. Adds vital signs observations
4. Retrieves the complete patient record

## Testing Tools

### Recommended Tools
1. **Postman** - GUI for testing API calls
2. **cURL** - Command-line HTTP client
3. **FHIR Inspector** - Chrome extension for FHIR debugging

### Public FHIR Test Servers
- HAPI FHIR Public Server: `https://hapi.fhir.org/baseR4`
- FHIR Placeholder: `https://jsonplaceholder.typicode.com` (not real FHIR, for practice)

## Error Handling

Common HTTP status codes in FHIR:

| Code | Meaning | When to Expect |
|------|---------|----------------|
| 200 | OK | Successful read/search |
| 201 | Created | Successful create |
| 400 | Bad Request | Invalid data/format |
| 401 | Unauthorized | Missing/invalid authentication |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation error |
| 500 | Server Error | Internal server problem |

## Next Steps

Practice the exercises in `/exercises/` directory to reinforce your learning!

---

**Key Takeaway**: FHIR APIs enable developers to build applications that can exchange healthcare data seamlessly across different systems, promoting interoperability in the Philippine healthcare ecosystem.
