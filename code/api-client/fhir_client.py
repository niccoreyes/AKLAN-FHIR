#!/usr/bin/env python3
"""
FHIR API Client Example
A simple Python client for interacting with FHIR servers.
For use in the FHIR Fundamentals 2026 - Aklan workshop.
"""

import requests
import json
from typing import Dict, Any, List, Optional

class FHIRClient:
    """Simple FHIR REST API Client"""
    
    def __init__(self, base_url: str, auth_token: Optional[str] = None):
        """
        Initialize FHIR client
        
        Args:
            base_url: FHIR server base URL (e.g., https://hapi.fhir.org/baseR4)
            auth_token: Optional OAuth2 bearer token
        """
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json'
        }
        if auth_token:
            self.headers['Authorization'] = f'Bearer {auth_token}'
    
    def read(self, resource_type: str, resource_id: str) -> Dict[str, Any]:
        """
        Read a specific resource by ID
        
        Args:
            resource_type: FHIR resource type (e.g., 'Patient')
            resource_id: Resource ID
            
        Returns:
            Resource as dictionary
        """
        url = f"{self.base_url}/{resource_type}/{resource_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def create(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new resource
        
        Args:
            resource: FHIR resource dictionary
            
        Returns:
            Created resource with assigned ID
        """
        resource_type = resource.get('resourceType')
        if not resource_type:
            raise ValueError("Resource must have a resourceType")
        
        url = f"{self.base_url}/{resource_type}"
        response = requests.post(url, json=resource, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def update(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing resource
        
        Args:
            resource: FHIR resource dictionary with ID
            
        Returns:
            Updated resource
        """
        resource_type = resource.get('resourceType')
        resource_id = resource.get('id')
        
        if not resource_type or not resource_id:
            raise ValueError("Resource must have resourceType and id")
        
        url = f"{self.base_url}/{resource_type}/{resource_id}"
        response = requests.put(url, json=resource, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def delete(self, resource_type: str, resource_id: str) -> bool:
        """
        Delete a resource
        
        Args:
            resource_type: FHIR resource type
            resource_id: Resource ID
            
        Returns:
            True if deleted successfully
        """
        url = f"{self.base_url}/{resource_type}/{resource_id}"
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()
        return response.status_code == 204
    
    def search(self, resource_type: str, params: Dict[str, str]) -> Dict[str, Any]:
        """
        Search for resources
        
        Args:
            resource_type: FHIR resource type to search
            params: Search parameters dictionary
            
        Returns:
            Bundle containing search results
        """
        url = f"{self.base_url}/{resource_type}"
        response = requests.get(url, params=params, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def transaction(self, bundle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a transaction Bundle
        
        Args:
            bundle: FHIR Bundle of type 'transaction'
            
        Returns:
            Transaction response Bundle
        """
        url = f"{self.base_url}/"
        response = requests.post(url, json=bundle, headers=self.headers)
        response.raise_for_status()
        return response.json()


def create_patient_example():
    """Example: Create a patient"""
    client = FHIRClient("https://hapi.fhir.org/baseR4")
    
    # Define patient data
    patient = {
        "resourceType": "Patient",
        "identifier": [
            {
                "system": "http://philhealth.gov.ph/member-id",
                "value": "12-345678901-2"
            }
        ],
        "name": [
            {
                "use": "official",
                "family": "Reyes",
                "given": ["Ana", "Marie"]
            }
        ],
        "gender": "female",
        "birthDate": "1990-05-20",
        "telecom": [
            {
                "system": "phone",
                "value": "+63-917-555-1234",
                "use": "mobile"
            }
        ],
        "address": [
            {
                "text": "123 Main St, Kalibo, Aklan",
                "city": "Kalibo",
                "state": "Aklan",
                "postalCode": "5600",
                "country": "PH"
            }
        ]
    }
    
    try:
        result = client.create(patient)
        print(f"✅ Patient created with ID: {result['id']}")
        return result['id']
    except requests.exceptions.HTTPError as e:
        print(f"❌ Error creating patient: {e}")
        return None


def search_patients_example():
    """Example: Search for patients"""
    client = FHIRClient("https://hapi.fhir.org/baseR4")
    
    # Search by name
    try:
        results = client.search("Patient", {"name": "Reyes", "_count": "5"})
        print(f"✅ Found {results.get('total', 0)} patients")
        
        for entry in results.get('entry', []):
            patient = entry.get('resource', {})
            name = patient.get('name', [{}])[0]
            given = ' '.join(name.get('given', []))
            family = name.get('family', '')
            print(f"  - {given} {family} (ID: {patient.get('id')})")
    except requests.exceptions.HTTPError as e:
        print(f"❌ Error searching: {e}")


def read_patient_example(patient_id: str):
    """Example: Read a specific patient"""
    client = FHIRClient("https://hapi.fhir.org/baseR4")
    
    try:
        patient = client.read("Patient", patient_id)
        print(f"✅ Retrieved patient: {patient.get('name', [{}])[0].get('family')}")
        return patient
    except requests.exceptions.HTTPError as e:
        print(f"❌ Error reading patient: {e}")
        return None


def create_encounter_example(patient_id: str):
    """Example: Create an encounter for a patient"""
    client = FHIRClient("https://hapi.fhir.org/baseR4")
    
    encounter = {
        "resourceType": "Encounter",
        "status": "finished",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "ambulatory"
        },
        "subject": {
            "reference": f"Patient/{patient_id}"
        },
        "period": {
            "start": "2026-01-20T09:00:00Z",
            "end": "2026-01-20T09:30:00Z"
        }
    }
    
    try:
        result = client.create(encounter)
        print(f"✅ Encounter created with ID: {result['id']}")
        return result['id']
    except requests.exceptions.HTTPError as e:
        print(f"❌ Error creating encounter: {e}")
        return None


def complete_workflow_example():
    """Example: Complete workflow - create patient + encounter"""
    print("\n=== Complete Workflow Example ===\n")
    
    # Step 1: Create patient
    patient_id = create_patient_example()
    if not patient_id:
        return
    
    # Step 2: Create encounter
    encounter_id = create_encounter_example(patient_id)
    if not encounter_id:
        return
    
    # Step 3: Search for encounters
    print("\nSearching for all encounters...")
    client = FHIRClient("https://hapi.fhir.org/baseR4")
    encounters = client.search("Encounter", {"patient": patient_id})
    print(f"Patient has {encounters.get('total', 0)} encounter(s)")
    
    print("\n✅ Workflow completed successfully!")


if __name__ == "__main__":
    print("🚀 FHIR API Client Examples")
    print("=" * 50)
    
    # Run individual examples
    print("\n1. Search for patients named 'Reyes':")
    search_patients_example()
    
    # Run complete workflow
    complete_workflow_example()
    
    print("\n" + "=" * 50)
    print("Examples completed!")
