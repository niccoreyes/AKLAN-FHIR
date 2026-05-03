# Exercise 2: FHIR Search Operations

## Objective

Learn how to construct and execute FHIR search queries to find resources.

## Prerequisites

- Understanding of HTTP GET requests
- Familiarity with query parameters
- Tool: Postman, cURL, or browser

## Part 1: Understanding Search Parameters

### Common Search Parameters

#### Patient Search
```
GET /Patient?name=[name]
GET /Patient?birthdate=[date]
GET /Patient?gender=[male|female|other|unknown]
GET /Patient?identifier=[system]|[value]
GET /Patient?address-city=[city]
```

#### Encounter Search
```
GET /Encounter?patient=[patient-id]
GET /Encounter?date=[date]
GET /Encounter?status=[status]
GET /Encounter?location=[location-id]
```

#### Observation Search
```
GET /Observation?patient=[patient-id]
GET /Observation?code=[system]|[code]
GET /Observation?date=[date]
GET /Observation?value-quantity=[value]
```

### Modifiers

| Modifier | Description | Example |
|----------|-------------|---------|
| `:exact` | Exact match | `name:exact=Smith` |
| `:contains` | Partial match | `name:contains=mit` |
| `:missing` | Check if field exists | `gender:missing=true` |
| `:gt`, `:lt` | Greater/less than | `birthdate:gt=2000-01-01` |
| `:ge`, `:le` | Greater/less or equal | `birthdate:ge=1990-01-01` |

## Part 2: Hands-on Search Exercises

### Exercise 2.1: Basic Patient Search

**Task**: Find patients with the following criteria:

1. **Search by name**
   - URL: `GET /Patient?name=Santos`
   - What results do you expect?

2. **Search by birthdate**
   - URL: `GET /Patient?birthdate=1985-03-15`
   - How many results?

3. **Search by gender**
   - URL: `GET /Patient?gender=female`
   - What other genders are valid?

4. **Combined search**
   - URL: `GET /Patient?name=Santos&gender=female&birthdate:ge=1980-01-01`
   - How does combining parameters work?

### Exercise 2.2: Search by Identifier

**Task**: Find a patient by PhilHealth ID

**Query**:
```
GET /Patient?identifier=http://philhealth.gov.ph/member-id|12-123456789-0
```

**Questions**:
1. Why do we need the system URI?
2. What happens if you search without the system?
3. Can you search with partial identifiers?

### Exercise 2.3: Encounter Searches

**Task**: Find encounters with these criteria:

1. **All encounters for a patient**
   ```
   GET /Encounter?patient=Patient/example-patient-001
   ```

2. **Encounters by date**
   ```
   GET /Encounter?date=2026-01-15
   ```

3. **Encounters by status**
   ```
   GET /Encounter?status=finished
   ```

4. **Encounters at a location**
   ```
   GET /Encounter?location=Location/example-location-001
   ```

### Exercise 2.4: Observation Searches

**Task**: Find observations:

1. **By patient and code**
   ```
   GET /Observation?patient=Patient/example-patient-001&code=http://loinc.org|85354-9
   ```

2. **By date range**
   ```
   GET /Observation?date:ge=2026-01-01&date:le=2026-01-31
   ```

3. **By value range**
   ```
   GET /Observation?value-quantity=gt120&code=http://loinc.org|8480-6
   ```

## Part 3: Advanced Search

### Chained Search

Find encounters for patients named "Santos":
```
GET /Encounter?patient.name=Santos
```

### Reverse Chaining (_has)

Find patients who have encounters at a specific location:
```
GET /Patient?_has:Encounter:patient:location=Location/example-location-001
```

### Include (_include)

Include referenced resources in results:
```
GET /Encounter?_include=Encounter:patient&_include=Encounter:location
```

### RevInclude (_revinclude)

Include resources that reference the matched resource:
```
GET /Patient?_revinclude=Encounter:patient
```

## Part 4: Practical Scenarios

### Scenario 1: Find All Patients from Aklan

**Your Task**: Construct a query to find all patients with address in Kalibo, Aklan.

<details>
<summary>Solution</summary>

```
GET /Patient?address-city=Kalibo&address-state=Aklan
```

</details>

### Scenario 2: Find Recent Encounters

**Your Task**: Find all encounters from the last 7 days (assuming today is 2026-01-20).

<details>
<summary>Solution</summary>

```
GET /Encounter?date:ge=2026-01-13
```

</details>

### Scenario 3: Find Abnormal Blood Pressure

**Your Task**: Find all blood pressure observations where systolic is ≥140.

<details>
<summary>Solution</summary>

```
GET /Observation?code=http://loinc.org|8480-6&value-quantity=ge140
```

</details>

### Scenario 4: Find Patients with Specific Provider

**Your Task**: Find all patients who have been seen by Dr. Jose Reyes.

<details>
<summary>Solution</summary>

```
GET /Patient?_has:Encounter:patient:participant.name=Reyes
```

</details>

## Part 5: Testing Your Queries

### Using cURL

```bash
# Search by name
curl -X GET "https://hapi.fhir.org/baseR4/Patient?name=Santos" \
  -H "Accept: application/fhir+json"

# Combined search
curl -X GET "https://hapi.fhir.org/baseR4/Patient?name=Santos&gender=female" \
  -H "Accept: application/fhir+json"

# Search with date range
curl -X GET "https://hapi.fhir.org/baseR4/Encounter?date:ge=2026-01-01" \
  -H "Accept: application/fhir+json"
```

### Using Postman

1. Set method to GET
2. Enter URL: `https://hapi.fhir.org/baseR4/Patient`
3. Add query parameters in the Params tab:
   - Key: `name`, Value: `Santos`
   - Key: `gender`, Value: `female`
4. Add header:
   - Key: `Accept`, Value: `application/fhir+json`
5. Click Send

## Part 6: Understanding Results

### Bundle Format

Search results are returned as a `Bundle`:

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 5,
  "link": [
    {
      "relation": "self",
      "url": "https://hapi.fhir.org/baseR4/Patient?name=Santos"
    }
  ],
  "entry": [
    {
      "fullUrl": "https://hapi.fhir.org/baseR4/Patient/123",
      "resource": {
        "resourceType": "Patient",
        ...
      },
      "search": {
        "mode": "match"
      }
    }
  ]
}
```

### Result Components

- `total`: Total number of matching resources
- `entry`: Array of search results
- `link`: Navigation links (pagination)
- `search.mode`: How the entry was included (`match` or `include`)

## Submission Checklist

- [ ] Completed all search exercises in Part 2
- [ ] Tested queries using cURL or Postman
- [ ] Documented results for each query
- [ ] Solved all scenarios in Part 4
- [ ] Understood Bundle result format

## References

- [FHIR Search](https://hl7.org/fhir/R4/search.html)
- [FHIR Search Parameters](https://hl7.org/fhir/R4/searchparameter.html)

---

**Instructor Note**: Demonstrate live searches on a public FHIR server and discuss common errors and their solutions.
