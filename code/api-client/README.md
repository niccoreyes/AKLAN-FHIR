# API Client Example

This directory contains example code for interacting with FHIR APIs.

## Files

- `fhir_client.py` - Python FHIR client class with examples
- `requirements.txt` - Python dependencies

## Usage

### Install Dependencies

```bash
pip install requests
```

### Run Examples

```bash
python fhir_client.py
```

### Use the Client in Your Code

```python
from fhir_client import FHIRClient

# Initialize client
client = FHIRClient("https://hapi.fhir.org/baseR4")

# Create a patient
patient = {
    "resourceType": "Patient",
    "name": [{"family": "Dela Cruz", "given": ["Juan"]}],
    "gender": "male",
    "birthDate": "1990-01-01"
}

result = client.create(patient)
print(f"Created patient: {result['id']}")

# Search for patients
results = client.search("Patient", {"name": "Dela Cruz"})
print(f"Found {results['total']} patients")

# Read specific patient
patient = client.read("Patient", result['id'])
print(f"Retrieved: {patient['name'][0]['given'][0]}")
```

## Features

- ✅ Create resources
- ✅ Read resources by ID
- ✅ Update resources
- ✅ Delete resources
- ✅ Search with parameters
- ✅ Transaction bundles
- ✅ Error handling

## API Methods

| Method | Description |
|--------|-------------|
| `read(resource_type, id)` | GET single resource |
| `create(resource)` | POST new resource |
| `update(resource)` | PUT existing resource |
| `delete(resource_type, id)` | DELETE resource |
| `search(resource_type, params)` | GET search |
| `transaction(bundle)` | POST transaction |

## Authentication

For authenticated servers:

```python
client = FHIRClient(
    base_url="https://your-fhir-server.com/fhir",
    auth_token="your-oauth-token"
)
```

## Public Test Servers

- **HAPI FHIR Public**: `https://hapi.fhir.org/baseR4`

## Next Steps

Try modifying the examples to:
1. Create different resource types
2. Add more search parameters
3. Handle pagination (_count, _offset)
4. Add validation before creating resources
